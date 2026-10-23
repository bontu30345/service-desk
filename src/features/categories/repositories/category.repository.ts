import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/features/audit-logs/repositories/audit-log.repository";
import type { CategoryInput } from "../schemas/category.schema";
import {
  safeCategorySelect,
  type CategoryDeleteInfo,
  type CategoryListFilters,
  type PaginatedCategories,
} from "../types/category";

export const CATEGORY_PAGE_SIZE = 10;

export async function listCategories(
  filters: CategoryListFilters,
): Promise<PaginatedCategories> {
  const where = filters.search
    ? {
        OR: [
          { name: { contains: filters.search, mode: "insensitive" as const } },
          {
            description: {
              contains: filters.search,
              mode: "insensitive" as const,
            },
          },
        ],
      }
    : undefined;

  const [totalCount, totalAvailable] = await Promise.all([
    prisma.category.count({ where }),
    filters.search ? prisma.category.count() : Promise.resolve(undefined),
  ]);
  const totalPages = Math.ceil(totalCount / CATEGORY_PAGE_SIZE);
  const page = Math.min(filters.page, Math.max(totalPages, 1));
  const categories = await prisma.category.findMany({
    where,
    select: safeCategorySelect,
    orderBy: [{ name: "asc" }, { id: "asc" }],
    skip: (page - 1) * CATEGORY_PAGE_SIZE,
    take: CATEGORY_PAGE_SIZE,
  });

  return {
    categories,
    totalCount,
    totalAvailable: totalAvailable ?? totalCount,
    totalPages,
    page,
    pageSize: CATEGORY_PAGE_SIZE,
  };
}

export function findCategoryById(id: number) {
  return prisma.category.findUnique({
    where: { id },
    select: safeCategorySelect,
  });
}

export function createCategory(input: CategoryInput, actorId: number) {
  return prisma.$transaction(async (transaction) => {
    const category = await transaction.category.create({
      data: {
        name: input.name,
        description: input.description,
      },
      select: safeCategorySelect,
    });
    await createAuditLog(transaction, {
      actorId,
      action: "Category created",
      resource: "Category",
      entityId: category.id,
    });
    return category;
  });
}

export function updateCategory(
  id: number,
  input: CategoryInput,
  actorId: number,
) {
  return prisma.$transaction(async (transaction) => {
    const category = await transaction.category.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description,
      },
      select: safeCategorySelect,
    });
    await createAuditLog(transaction, {
      actorId,
      action: "Category updated",
      resource: "Category",
      entityId: category.id,
      changedFields: ["name", "description"],
    });
    return category;
  });
}

export function deleteCategoryIfUnused(id: number) {
  return prisma.category.deleteMany({
    where: {
      id,
      tickets: {
        none: {},
      },
    },
  });
}

export async function findCategoryDeleteInfo(
  id: number,
): Promise<CategoryDeleteInfo | null> {
  const category = await prisma.category.findUnique({
    where: { id },
    select: {
      id: true,
      _count: {
        select: { tickets: true },
      },
    },
  });

  return category
    ? { id: category.id, ticketCount: category._count.tickets }
    : null;
}
