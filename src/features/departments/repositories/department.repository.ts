import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/features/audit-logs/repositories/audit-log.repository";
import { safeDepartmentSelect } from "../types/department";
import type { DepartmentInput } from "../schemas/department.schema";
import type {
  DepartmentListFilters,
  PaginatedDepartments,
  DepartmentDeleteInfo,
} from "../types/department";

export const DEPARTMENT_PAGE_SIZE = 10;

export async function listDepartments(
  filters: DepartmentListFilters,
  pageSize = DEPARTMENT_PAGE_SIZE,
): Promise<PaginatedDepartments> {
  const where = filters.search
    ? {
        name: {
          contains: filters.search,
          mode: "insensitive" as const,
        },
      }
    : undefined;

  const total = await prisma.department.count({ where });
  const totalPages = Math.ceil(total / pageSize);
  const page = Math.min(filters.page, Math.max(totalPages, 1));
  const departments = await prisma.department.findMany({
    where,
    select: safeDepartmentSelect,
    orderBy: [{ name: "asc" }, { id: "asc" }],
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return {
    departments,
    total,
    page,
    pageSize,
    totalPages,
  };
}

export function createDepartment(input: DepartmentInput, actorId: number) {
  return prisma.$transaction(async (transaction) => {
    const department = await transaction.department.create({
      data: { name: input.name },
      select: safeDepartmentSelect,
    });
    await createAuditLog(transaction, {
      actorId,
      action: "Department created",
      resource: "Department",
      entityId: department.id,
    });
    return department;
  });
}

export function findDepartmentById(id: number) {
  return prisma.department.findUnique({
    where: { id },
    select: safeDepartmentSelect,
  });
}

export function updateDepartment(
  id: number,
  input: DepartmentInput,
  actorId: number,
) {
  return prisma.$transaction(async (transaction) => {
    const department = await transaction.department.update({
      where: { id },
      data: { name: input.name },
      select: safeDepartmentSelect,
    });
    await createAuditLog(transaction, {
      actorId,
      action: "Department updated",
      resource: "Department",
      entityId: department.id,
      changedFields: ["name"],
    });
    return department;
  });
}

export function deleteDepartmentIfUnused(id: number) {
  return prisma.department.deleteMany({
    where: {
      id,
      users: { none: {} },
      tickets: { none: {} },
    },
  });
}

export async function findDepartmentDeleteInfo(
  id: number,
): Promise<DepartmentDeleteInfo | null> {
  const department = await prisma.department.findUnique({
    where: { id },
    select: {
      id: true,
      _count: { select: { users: true, tickets: true } },
    },
  });
  return department
    ? {
        id: department.id,
        userCount: department._count.users,
        ticketCount: department._count.tickets,
      }
    : null;
}
