import { Prisma } from "@prisma/client";
import type { TicketListScope } from "@/features/tickets/types/ticket";
import { prisma } from "@/lib/prisma";
import type {
  TicketReportFilters,
  TicketReportOption,
  TicketReportPage,
  TicketReportRow,
} from "../types/ticket-report";

export const TICKET_REPORT_PAGE_SIZE = 25;
const TICKET_REPORT_EXPORT_BATCH_SIZE = 500;

const ticketReportSelect = {
  id: true,
  title: true,
  status: true,
  priority: true,
  createdAt: true,
  creator: { select: { name: true } },
  assignee: { select: { name: true } },
  category: { select: { name: true } },
  department: { select: { name: true } },
} satisfies Prisma.TicketSelect;

function ticketReportWhere(
  scope: TicketListScope,
  filters: TicketReportFilters,
): Prisma.TicketWhereInput {
  const conditions: Prisma.TicketWhereInput[] = [];
  if (filters.from) {
    conditions.push({
      createdAt: { gte: new Date(`${filters.from}T00:00:00.000Z`) },
    });
  }
  if (filters.to) {
    const dayAfterTo = new Date(`${filters.to}T00:00:00.000Z`);
    dayAfterTo.setUTCDate(dayAfterTo.getUTCDate() + 1);
    conditions.push({ createdAt: { lt: dayAfterTo } });
  }
  if (filters.status) conditions.push({ status: filters.status });
  if (filters.priority) conditions.push({ priority: filters.priority });
  if (filters.categoryId) conditions.push({ categoryId: filters.categoryId });
  if (filters.departmentId) conditions.push({ departmentId: filters.departmentId });
  if (filters.assigneeId) conditions.push({ assigneeId: filters.assigneeId });

  const scopeWhere: Prisma.TicketWhereInput =
    scope.kind === "all"
      ? {}
      : scope.kind === "created-by"
        ? { creatorId: scope.userId }
        : { assigneeId: scope.userId };

  return {
    ...scopeWhere,
    ...(conditions.length > 0 ? { AND: conditions } : {}),
  };
}

export async function listTicketReport(
  scope: TicketListScope,
  filters: TicketReportFilters,
): Promise<TicketReportPage> {
  const where = ticketReportWhere(scope, filters);
  const [totalCount, statusGroups, priorityGroups, departmentGroups] = await Promise.all([
    prisma.ticket.count({ where }),
    prisma.ticket.groupBy({ by: ["status"], where, _count: { _all: true } }),
    prisma.ticket.groupBy({ by: ["priority"], where, _count: { _all: true } }),
    prisma.ticket.groupBy({ by: ["departmentId"], where, _count: { _all: true } }),
  ]);
  const departments = await prisma.department.findMany({
    where: { id: { in: departmentGroups.map((item) => item.departmentId) } },
    select: { id: true, name: true },
  });
  const departmentNames = new Map(departments.map((item) => [item.id, item.name]));
  const totalPages = Math.ceil(totalCount / TICKET_REPORT_PAGE_SIZE);
  const page = Math.min(filters.page, Math.max(totalPages, 1));
  const tickets = await prisma.ticket.findMany({
    where,
    select: ticketReportSelect,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: (page - 1) * TICKET_REPORT_PAGE_SIZE,
    take: TICKET_REPORT_PAGE_SIZE,
  });

  return {
    tickets,
    totalCount,
    totalPages,
    page,
    pageSize: TICKET_REPORT_PAGE_SIZE,
    analytics: {
      openCount: statusGroups.find((item) => item.status === "OPEN")?._count._all ?? 0,
      inProgressCount: statusGroups.find((item) => item.status === "IN_PROGRESS")?._count._all ?? 0,
      resolvedCount: statusGroups.find((item) => item.status === "RESOLVED")?._count._all ?? 0,
      priorityCount: priorityGroups.filter((item) => item.priority === "HIGH" || item.priority === "CRITICAL").reduce((sum, item) => sum + item._count._all, 0),
      statusCounts: statusGroups.map(({ status, _count }) => ({ status, count: _count._all })),
      priorityCounts: priorityGroups.map(({ priority, _count }) => ({ priority, count: _count._all })),
      departmentCounts: departmentGroups.map(({ departmentId, _count }) => ({ name: departmentNames.get(departmentId) ?? "Unassigned department", count: _count._all })),
    },
  };
}

export async function listTicketReportExportBatch(
  scope: TicketListScope,
  filters: TicketReportFilters,
  after?: Pick<TicketReportRow, "createdAt" | "id">,
): Promise<TicketReportRow[]> {
  const where = ticketReportWhere(scope, filters);
  if (after) {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
      {
        OR: [
          { createdAt: { lt: after.createdAt } },
          { createdAt: after.createdAt, id: { lt: after.id } },
        ],
      },
    ];
  }

  return prisma.ticket.findMany({
    where,
    select: ticketReportSelect,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: TICKET_REPORT_EXPORT_BATCH_SIZE,
  });
}

export function listTicketReportCategories(): Promise<TicketReportOption[]> {
  return prisma.category.findMany({
    select: { id: true, name: true },
    orderBy: [{ name: "asc" }, { id: "asc" }],
  });
}

export async function listTicketReportDepartments(scope: TicketListScope): Promise<TicketReportOption[]> {
  const scopeWhere: Prisma.TicketWhereInput = scope.kind === "all" ? {} : scope.kind === "created-by" ? { creatorId: scope.userId } : { assigneeId: scope.userId };
  const rows = await prisma.ticket.findMany({ where: scopeWhere, distinct: ["departmentId"], select: { department: { select: { id: true, name: true } } } });
  return rows.map(({ department }) => department).sort((a, b) => a.name.localeCompare(b.name));
}

export function listTicketReportAssignees(): Promise<TicketReportOption[]> {
  return prisma.user.findMany({
    where: { role: "AGENT", isActive: true },
    select: { id: true, name: true },
    orderBy: [{ name: "asc" }, { id: "asc" }],
  });
}
