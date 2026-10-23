import type { Prisma } from "@prisma/client";

export const safeCategorySelect = {
  id: true,
  name: true,
  description: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CategorySelect;

export type Category = Prisma.CategoryGetPayload<{
  select: typeof safeCategorySelect;
}>;

export type CategoryListFilters = {
  search?: string;
  page: number;
};

export type PaginatedCategories = {
  categories: Category[];
  totalCount: number;
  totalAvailable: number;
  totalPages: number;
  page: number;
  pageSize: number;
};

export type CategoryDeleteInfo = {
  id: number;
  ticketCount: number;
};
