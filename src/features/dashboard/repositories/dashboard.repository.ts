import { Priority, Prisma, TicketStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { TicketListScope } from "@/features/tickets/types/ticket";
import type {
  DashboardPriorityCount,
  DashboardDepartmentCount,
  DashboardStatusCount,
  DashboardTicket,
} from "../types/dashboard";

const recentTicketLimit = 5;
const priorityFocusLimit = 8;

const dashboardTicketSelect = {
  id: true,
  title: true,
  status: true,
  priority: true,
  createdAt: true,
  creator: { select: { name: true } },
  assignee: { select: { name: true } },
  sla: {
    select: {
      name: true,
      status: true,
      resolutionTimeMinutes: true,
    },
  },
} satisfies Prisma.TicketSelect;

function scopeWhere(scope: TicketListScope): Prisma.TicketWhereInput {
  switch (scope.kind) {
    case "all":
      return {};
    case "created-by":
      return { creatorId: scope.userId };
    case "assigned-to":
      return { assigneeId: scope.userId };
  }
}

async function listRecentTickets(
  where: Prisma.TicketWhereInput,
): Promise<DashboardTicket[]> {
  const tickets = await prisma.ticket.findMany({
    where,
    select: dashboardTicketSelect,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: recentTicketLimit,
  });
  return tickets;
}

async function listPriorityFocusTickets(
  scope: TicketListScope,
): Promise<DashboardTicket[]> {
  return prisma.ticket.findMany({
    where: {
      ...scopeWhere(scope),
      status: { notIn: ["RESOLVED", "CLOSED"] },
      OR: [
        { priority: { in: ["HIGH", "CRITICAL"] } },
        { sla: { is: { status: "ACTIVE" } } },
      ],
    },
    select: dashboardTicketSelect,
    orderBy: [
      { priority: "desc" },
      { assigneeId: "asc" },
      { createdAt: "desc" },
      { id: "desc" },
    ],
    take: priorityFocusLimit,
  });
}

export async function getDashboardTicketData(
  scope: TicketListScope,
  userId: number,
  includeAssignedSection: boolean,
): Promise<{
  totalUsers: number | null;
  activeUsers: number | null;
  totalTickets: number;
  statusCounts: DashboardStatusCount[];
  priorityCounts: DashboardPriorityCount[];
  departmentCounts: DashboardDepartmentCount[];
  recentTickets: DashboardTicket[];
  myAssignedTicketCount: number | null;
  myAssignedTickets: DashboardTicket[];
  priorityFocusTickets: DashboardTicket[];
  urgentTicketCount: number | null;
}> {
  const visibleWhere = scopeWhere(scope);
  const assignedWhere = { assigneeId: userId };
  const assignedViewMatchesDashboardScope =
    scope.kind === "assigned-to" && scope.userId === userId;

  const [
    groupedStatuses,
    groupedPriorities,
    groupedDepartments,
    recentTickets,
    myAssignedTicketCount,
    queriedAssignedTickets,
    priorityFocusTickets,
    urgentTicketCount,
    totalUsers,
    activeUsers,
  ] = await Promise.all([
    prisma.ticket.groupBy({
      by: ["status"],
      where: visibleWhere,
      _count: { _all: true },
    }),
    prisma.ticket.groupBy({
      by: ["priority"],
      where: visibleWhere,
      _count: { _all: true },
    }),
    prisma.ticket.groupBy({
      by: ["departmentId"],
      where: visibleWhere,
      _count: { _all: true },
    }),
    listRecentTickets(visibleWhere),
    includeAssignedSection
      ? prisma.ticket.count({ where: assignedWhere })
      : Promise.resolve(null),
    includeAssignedSection && !assignedViewMatchesDashboardScope
      ? listRecentTickets(assignedWhere)
      : Promise.resolve(null),
    includeAssignedSection
      ? listPriorityFocusTickets(scope)
      : Promise.resolve([]),
    scope.kind === "all"
      ? prisma.ticket.count({
          where: {
            ...visibleWhere,
            status: { in: ["OPEN", "IN_PROGRESS"] },
            priority: { in: ["HIGH", "CRITICAL"] },
          },
        })
      : Promise.resolve(null),
    scope.kind === "all"
      ? prisma.user.count()
      : Promise.resolve(null),
    scope.kind === "all"
      ? prisma.user.count({ where: { isActive: true } })
      : Promise.resolve(null),
  ]);

  const departments = await prisma.department.findMany({
    where: { id: { in: groupedDepartments.map(({ departmentId }) => departmentId) } },
    select: { id: true, name: true },
  });
  const departmentNameById = new Map(departments.map(({ id, name }) => [id, name]));
  const departmentCounts = groupedDepartments
    .map(({ departmentId, _count }) => ({
      departmentId,
      name: departmentNameById.get(departmentId) ?? "Department",
      count: _count._all,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  const statusCountByValue = new Map(
    groupedStatuses.map(({ status, _count }) => [status, _count._all]),
  );
  const priorityCountByValue = new Map(
    groupedPriorities.map(({ priority, _count }) => [
      priority,
      _count._all,
    ]),
  );
  const statusCounts = Object.values(TicketStatus).map((status) => ({
    status,
    count: statusCountByValue.get(status) ?? 0,
  }));
  const priorityCounts = Object.values(Priority).map((priority) => ({
    priority,
    count: priorityCountByValue.get(priority) ?? 0,
  }));

  return {
    totalUsers,
    activeUsers,
    totalTickets: groupedStatuses.reduce(
      (total, status) => total + status._count._all,
      0,
    ),
    statusCounts,
    priorityCounts,
    departmentCounts,
    recentTickets,
    myAssignedTicketCount,
    myAssignedTickets: includeAssignedSection
      ? (queriedAssignedTickets ?? recentTickets)
      : [],
    priorityFocusTickets,
    urgentTicketCount,
  };
}
