import type { Prisma } from "@prisma/client";

export const safeAuditLogSelect = {
  id: true,
  action: true,
  details: true,
  ticketId: true,
  userId: true,
  createdAt: true,
  user: {
    select: {
      id: true,
      name: true,
      role: true,
    },
  },
} satisfies Prisma.AuditLogSelect;

export type SafeAuditLog = Prisma.AuditLogGetPayload<{
  select: typeof safeAuditLogSelect;
}>;

export type AuditLogFilters = {
  action?: string;
  actorId?: number;
  ticketId?: number;
  from?: Date;
  to?: Date;
  page: number;
};

export type PaginatedAuditLogs = {
  logs: SafeAuditLog[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export const auditActions = [
  "User created",
  "User updated",
  "User activated",
  "User deactivated",
  "User deleted",
  "Department created",
  "Department updated",
  "Category created",
  "Category updated",
  "Ticket created",
  "Ticket updated",
  "Ticket assigned",
  "Ticket status changed",
  "Comment created",
  "Ticket SLA changed",
] as const;

export type AuditAction = (typeof auditActions)[number];
