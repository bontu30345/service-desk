import { z } from "zod";
import type { DepartmentListFilters } from "../types/department";

export const departmentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Department name is required")
    .max(100, "Department name must be 100 characters or fewer"),
});

export const departmentIdSchema = z.coerce
  .number()
  .int()
  .positive()
  .safe("The selected department is invalid.");

const departmentSearchSchema = z.string().trim().min(1).max(100);
const departmentPageSchema = z
  .string()
  .regex(/^[1-9]\d*$/)
  .transform(Number)
  .refine(Number.isSafeInteger);

function singleQueryValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

export function parseDepartmentSearch(searchParams: {
  search?: string | string[];
}) {
  const result = departmentSearchSchema.safeParse(
    singleQueryValue(searchParams.search),
  );

  return result.success ? result.data : undefined;
}

export function parseDepartmentListFilters(searchParams: {
  search?: string | string[];
  page?: string | string[];
}): DepartmentListFilters {
  const search = parseDepartmentSearch(searchParams);
  const rawPage = singleQueryValue(searchParams.page);
  const pageResult = departmentPageSchema.safeParse(rawPage);

  return {
    ...(search ? { search } : {}),
    page: pageResult.success ? pageResult.data : 1,
  };
}

export type DepartmentInput = z.infer<typeof departmentSchema>;

export type DepartmentActionState = {
  success: boolean;
  message: string;
  fieldErrors?: {
    name?: string[];
  };
};

export type DepartmentDeleteState = {
  success: boolean;
  message: string;
};
