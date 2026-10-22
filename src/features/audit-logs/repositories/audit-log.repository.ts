import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  safeAuditLogSelect,
  type AuditAction,
  type AuditLogFilters,
  type PaginatedAuditLogs,
} from "../types/audit-log";

export type AuditLogCreateInput = {
  actorId: number;
  action: AuditAction;
  resource: string;
  entityId: number;
  ticketId?: number;
  changedFields?: string[];
  previousValue?: string;
  nextValue?: string;
};

export function createAuditLog(
  transaction: Prisma.TransactionClient,
  input: AuditLogCreateInput,
) {
  const details = {
    resource: input.resource,
    entityId: input.entityId,
    ...(input.changedFields ? { changedFields: input.changedFields } : {}),
    ...(input.previousValue !== undefined
      ? { previousValue: input.previousValue }
      : {}),
    ...(input.nextValue !== undefined ? { nextValue: input.nextValue } : {}),
  };

  return transaction.auditLog.create({
    data: {
      action: input.action,
      details: JSON.stringify(details),
      userId: input.actorId,
      ...(input.ticketId !== undefined ? { ticketId: input.ticketId } : {}),
    },
    select: { id: true },
  });
}

export const AUDIT_LOG_PAGE_SIZE = 25;

export async function listAuditLogs(
  filters: AuditLogFilters,
  database: PrismaClient = prisma,
): Promise<PaginatedAuditLogs> {
  const where: Prisma.AuditLogWhereInput = {
    ...(filters.action ? { action: filters.action } : {}),
    ...(filters.actorId ? { userId: filters.actorId } : {}),
    ...(filters.ticketId ? { ticketId: filters.ticketId } : {}),
    ...(filters.from || filters.to
      ? {
          createdAt: {
            ...(filters.from ? { gte: filters.from } : {}),
            ...(filters.to ? { lte: filters.to } : {}),
          },
        }
      : {}),
  };

  const totalCount = await database.auditLog.count({ where });
  const totalPages = Math.ceil(totalCount / AUDIT_LOG_PAGE_SIZE);
  const page = Math.min(filters.page, Math.max(totalPages, 1));
  const logs = await database.auditLog.findMany({
    where,
    select: safeAuditLogSelect,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: (page - 1) * AUDIT_LOG_PAGE_SIZE,
    take: AUDIT_LOG_PAGE_SIZE,
  });

  return { logs, page, pageSize: AUDIT_LOG_PAGE_SIZE, totalCount, totalPages };
}
