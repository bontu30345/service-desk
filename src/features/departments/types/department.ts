import type { Prisma } from "@prisma/client";

export const safeDepartmentSelect = {
  id: true,
  name: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.DepartmentSelect;

export type Department = Prisma.DepartmentGetPayload<{
  select: typeof safeDepartmentSelect;
}>;

export type DepartmentListFilters = {
  search?: string;
  page: number;
};

export type PaginatedDepartments = {
  departments: Department[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type DepartmentDeleteInfo = {
  id: number;
  userCount: number;
  ticketCount: number;
};
