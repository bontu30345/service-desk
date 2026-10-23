import { Prisma, type PrismaClient } from "@prisma/client";
import type { TicketStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/features/audit-logs/repositories/audit-log.repository";
import {
  notifyTicketAssignment,
  notifyTicketStatusChanged,
} from "@/features/notifications/services/notification-events";
import {
  safeTicketDetailsSelect,
  safeTicketSelect,
  type CreateTicketInput,
  type TicketAssignmentScope,
  type TicketListFilters,
  type TicketListQueryScope,
  type TicketListScope,
  type PaginatedTickets,
  type TicketUpdateInput,
  type TicketUpdateScope,
} from "../types/ticket";

export const TICKET_PAGE_SIZE = 10;

function ticketScopeWhere(scope: TicketListQueryScope): Prisma.TicketWhereInput {
  return (
    scope.kind === "all"
      ? {}
      : scope.kind === "created-by"
        ? { creatorId: scope.userId }
        : scope.kind === "assigned-to"
          ? { assigneeId: scope.userId }
          : { creatorId: scope.userId, assigneeId: scope.userId }
  );
}

export async function listTickets(
  scope: TicketListQueryScope,
  filters: TicketListFilters,
): Promise<PaginatedTickets> {
  const scopeWhere = ticketScopeWhere(scope);
  const searchTicketId = filters.search && /^\d+$/.test(filters.search)
    ? Number(filters.search)
    : null;
  const conditions: Prisma.TicketWhereInput[] = [
    ...(filters.search
      ? [
          {
            OR: [
              ...(searchTicketId !== null && Number.isSafeInteger(searchTicketId)
                ? [{ id: searchTicketId }]
                : []),
              {
                title: {
                  contains: filters.search,
                  mode: "insensitive" as const,
                },
              },
              {
                description: {
                  contains: filters.search,
                  mode: "insensitive" as const,
                },
              },
              {
                creator: {
                  is: {
                    name: {
                      contains: filters.search,
                      mode: "insensitive" as const,
                    },
                  },
                },
              },
            ],
          },
        ]
      : []),
    ...(filters.status ? [{ status: filters.status }] : []),
    ...(filters.priority ? [{ priority: filters.priority }] : []),
    ...(filters.departmentId ? [{ departmentId: filters.departmentId }] : []),
    ...(filters.categoryId ? [{ categoryId: filters.categoryId }] : []),
    ...(filters.assigneeId ? [{ assigneeId: filters.assigneeId }] : []),
  ];
  const where = {
    ...scopeWhere,
    ...(conditions.length ? { AND: conditions } : {}),
  };

  const [totalCount, totalAvailable] = await Promise.all([
    prisma.ticket.count({ where }),
    conditions.length
      ? prisma.ticket.count({ where: scopeWhere })
      : Promise.resolve(undefined),
  ]);
  const totalPages = Math.ceil(totalCount / TICKET_PAGE_SIZE);
  const page = Math.min(filters.page, Math.max(totalPages, 1));
  const tickets = await prisma.ticket.findMany({
    where,
    select: safeTicketSelect,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: (page - 1) * TICKET_PAGE_SIZE,
    take: TICKET_PAGE_SIZE,
  });

  return {
    tickets,
    totalCount,
    totalAvailable: totalAvailable ?? totalCount,
    totalPages,
    page,
    pageSize: TICKET_PAGE_SIZE,
  };
}

export function findTicketById(
  id: number,
  scope: TicketUpdateScope | TicketListScope,
  database: PrismaClient = prisma,
) {
  const where =
    scope.kind === "all"
      ? { id }
      : scope.kind === "created-by"
        ? { id, creatorId: scope.userId }
        : { id, assigneeId: scope.userId };

  return database.ticket.findFirst({
    where,
    select: safeTicketDetailsSelect,
  });
}

export async function updateTicket(
  id: number,
  scope: TicketUpdateScope,
  input: TicketUpdateInput,
  actorId: number,
) {
  return prisma.$transaction(async (transaction) => {
    const where =
      scope.kind === "all" ? { id } : { id, assigneeId: scope.userId };
    const existing = await transaction.ticket.findFirst({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        priority: true,
        departmentId: true,
        categoryId: true,
      },
    });
    if (!existing) {
      return null;
    }

    const changedFields = (
      ["title", "description", "priority", "departmentId", "categoryId"] as const
    ).filter((field) => existing[field] !== input[field]);
    const result = await transaction.ticket.updateMany({
      where,
      data: {
        title: input.title,
        description: input.description,
        priority: input.priority,
        departmentId: input.departmentId,
        categoryId: input.categoryId,
      },
    });

    if (result.count === 0) {
      return null;
    }

    if (changedFields.length > 0) {
      await createAuditLog(transaction, {
        actorId,
        action: "Ticket updated",
        resource: "Ticket",
        entityId: existing.id,
        ticketId: existing.id,
        changedFields: [...changedFields],
      });
    }

    return transaction.ticket.findUnique({
      where: { id },
      select: safeTicketDetailsSelect,
    });
  });
}

export function listActiveTicketAssignees() {
  return prisma.user.findMany({
    where: {
      role: "AGENT",
      isActive: true,
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: [{ name: "asc" }, { id: "asc" }],
  });
}

export function listActiveTicketSLAs() {
  return prisma.sLA.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      responseTimeMinutes: true,
      resolutionTimeMinutes: true,
    },
    orderBy: [{ name: "asc" }, { id: "asc" }],
  });
}

export function findActiveTicketAssignee(
  id: number,
  database: PrismaClient = prisma,
) {
  return database.user.findFirst({
    where: {
      id,
      role: "AGENT",
      isActive: true,
    },
    select: { id: true },
  });
}

export async function updateTicketSLA(
  id: number,
  scope: TicketUpdateScope,
  slaId: number | null,
  actorId: number,
): Promise<
  "missing-ticket" | "unavailable-sla" | "unchanged" | "updated" | "conflict"
> {
  return prisma.$transaction(
    async (transaction) => {
      const ticketWhere =
        scope.kind === "all"
          ? { id }
          : { id, assigneeId: scope.userId };
      const ticket = await transaction.ticket.findFirst({
        where: ticketWhere,
        select: { id: true, slaId: true },
      });

      if (!ticket) {
        return "missing-ticket";
      }
      if (ticket.slaId === slaId) {
        return "unchanged";
      }

      if (slaId !== null) {
        const usableSLA = await transaction.sLA.findFirst({
          where: { id: slaId, status: "ACTIVE" },
          select: { id: true },
        });
        if (!usableSLA) {
          return "unavailable-sla";
        }
      }

      const result = await transaction.ticket.updateMany({
        where: {
          ...ticketWhere,
          slaId: ticket.slaId,
        },
        data: { slaId },
      });

      if (result.count !== 1) {
        return "conflict";
      }

      await createAuditLog(transaction, {
        actorId,
        action: "Ticket SLA changed",
        resource: "Ticket",
        entityId: ticket.id,
        ticketId: ticket.id,
        previousValue: ticket.slaId === null ? "None" : `SLA #${ticket.slaId}`,
        nextValue: slaId === null ? "None" : `SLA #${slaId}`,
      });
      return "updated";
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

export async function updateTicketAssignment(
  id: number,
  scope: TicketAssignmentScope,
  currentAssigneeId: number | null,
  assigneeId: number | null,
  actorId: number,
  database: PrismaClient = prisma,
) {
  return database.$transaction(
    async (transaction) => {
      const where =
        scope.kind === "all"
          ? { id, assigneeId: currentAssigneeId }
          : { id, assigneeId: scope.userId };
      const ticket = await transaction.ticket.findFirst({
        where,
        select: {
          id: true,
          title: true,
          creatorId: true,
          assigneeId: true,
        },
      });

      if (!ticket) {
        return null;
      }
      if (ticket.assigneeId === assigneeId) {
        return transaction.ticket.findUnique({
          where: { id },
          select: safeTicketDetailsSelect,
        });
      }

      if (assigneeId !== null) {
        const activeAssignee = await transaction.user.findFirst({
          where: {
            id: assigneeId,
            role: "AGENT",
            isActive: true,
          },
          select: { id: true },
        });

        if (!activeAssignee) {
          return null;
        }
      }

      const result = await transaction.ticket.updateMany({
        where,
        data: { assigneeId },
      });

      if (result.count === 0) {
        return null;
      }

      await notifyTicketAssignment(transaction, {
        ticketId: ticket.id,
        ticketTitle: ticket.title,
        assigneeId,
        actorId,
      });
      await createAuditLog(transaction, {
        actorId,
        action: "Ticket assigned",
        resource: "Ticket",
        entityId: ticket.id,
        ticketId: ticket.id,
        previousValue:
          ticket.assigneeId === null
            ? "Unassigned"
            : `Agent #${ticket.assigneeId}`,
        nextValue:
          assigneeId === null ? "Unassigned" : `Agent #${assigneeId}`,
      });

      return transaction.ticket.findUnique({
        where: { id },
        select: safeTicketDetailsSelect,
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

export async function transitionTicketStatus(
  id: number,
  scope: TicketUpdateScope,
  currentStatus: TicketStatus,
  currentResolvedAt: Date | null,
  nextStatus: TicketStatus,
  actorId: number,
  database: PrismaClient = prisma,
) {
  return database.$transaction(
    async (transaction) => {
      const scopeWhere =
        scope.kind === "all" ? { id } : { id, assigneeId: scope.userId };
      const ticket = await transaction.ticket.findFirst({
        where: { ...scopeWhere, status: currentStatus },
        select: {
          id: true,
          title: true,
          creatorId: true,
          assigneeId: true,
        },
      });

      if (!ticket) {
        return null;
      }

      const where = { ...scopeWhere, status: currentStatus };
      const now = new Date();
      const result = await transaction.ticket.updateMany({
        where,
        data: {
          status: nextStatus,
          ...(nextStatus === "IN_PROGRESS"
            ? { resolvedAt: null, closedAt: null }
            : {}),
          ...(nextStatus === "RESOLVED"
            ? { resolvedAt: now, closedAt: null }
            : {}),
          ...(nextStatus === "CLOSED"
            ? {
                closedAt: now,
                ...(currentStatus === "RESOLVED" && currentResolvedAt === null
                  ? { resolvedAt: now }
                  : {}),
              }
            : {}),
        },
      });

      if (result.count === 0) {
        return null;
      }

      await notifyTicketStatusChanged(transaction, {
        ticketId: ticket.id,
        ticketTitle: ticket.title,
        creatorId: ticket.creatorId,
        assigneeId: ticket.assigneeId,
        actorId,
        previousStatus: currentStatus,
        nextStatus,
      });
      await createAuditLog(transaction, {
        actorId,
        action: "Ticket status changed",
        resource: "Ticket",
        entityId: ticket.id,
        ticketId: ticket.id,
        previousValue: currentStatus,
        nextValue: nextStatus,
      });

      return transaction.ticket.findUnique({
        where: { id },
        select: safeTicketDetailsSelect,
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

export function listTicketDepartments() {
  return prisma.department.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: [{ name: "asc" }, { id: "asc" }],
  });
}

export function listTicketCategories() {
  return prisma.category.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: [{ name: "asc" }, { id: "asc" }],
  });
}

export function listTicketFilterAssignees() {
  return prisma.user.findMany({
    where: {
      role: "AGENT",
      isActive: true,
      assignedTickets: {
        some: {},
      },
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: [{ name: "asc" }, { id: "asc" }],
  });
}

export function findTicketDepartmentById(id: number) {
  return prisma.department.findUnique({
    where: { id },
    select: { id: true },
  });
}

export function findTicketCategoryById(id: number) {
  return prisma.category.findUnique({
    where: { id },
    select: { id: true },
  });
}

export function createTicket(
  creatorId: number,
  input: CreateTicketInput,
  database: PrismaClient = prisma,
) {
  return database.$transaction(async (transaction) => {
    const ticket = await transaction.ticket.create({
      data: {
        title: input.title,
        description: input.description,
        priority: input.priority,
        creatorId,
        departmentId: input.departmentId,
        categoryId: input.categoryId,
      },
      select: {
        id: true,
        title: true,
      },
    });
    await createAuditLog(transaction, {
      actorId: creatorId,
      action: "Ticket created",
      resource: "Ticket",
      entityId: ticket.id,
      ticketId: ticket.id,
    });
    return ticket;
  });
}
