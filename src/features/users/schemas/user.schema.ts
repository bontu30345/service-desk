import { z } from "zod";
import type { UserListFilters } from "../types/user";

const roleSchema = z.enum(["EMPLOYEE", "AGENT", "ADMIN"]);

export const userIdSchema = z
  .string()
  .regex(/^[1-9]\d*$/)
  .transform(Number)
  .refine(Number.isSafeInteger);

export type UserDeleteState = { success: boolean; message: string };

const userFieldsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be 100 characters or fewer"),
  email: z.string().trim().email("Invalid email address"),
  role: roleSchema,
  departmentId: z.number().int().positive().nullable().optional(),
});

const departmentFormValueSchema = z.preprocess(
  (value) => {
    if (value === "" || value === undefined || value === null) {
      return undefined;
    }

    if (typeof value === "string") {
      return Number(value);
    }

    return value;
  },
  z.number().int().positive().optional(),
);

export const createUserSchema = userFieldsSchema.extend({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password is too long"),
  role: roleSchema.default("EMPLOYEE"),
  departmentId: departmentFormValueSchema,
});

export const updateUserSchema = z.object({
  name: userFieldsSchema.shape.name,
  email: userFieldsSchema.shape.email,
  role: roleSchema,
  departmentId: z.preprocess(
    (value) => {
      if (value === "" || value === null) {
        return null;
      }

      if (typeof value === "string") {
        return Number(value);
      }

      return value;
    },
    z.number().int().positive().nullable(),
  ),
});

const searchFilterSchema = z.string().trim().min(1).max(100);
const roleFilterSchema = roleSchema;
const departmentIdFilterSchema = z
  .string()
  .regex(/^[1-9]\d*$/)
  .transform(Number)
  .refine(Number.isSafeInteger);
const pageFilterSchema = z
  .string()
  .regex(/^[1-9]\d*$/)
  .transform(Number)
  .refine(Number.isSafeInteger);
const statusFilterSchema = z.enum(["active", "inactive"]);

function singleQueryValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

export function parseUserListFilters(searchParams: {
  search?: string | string[];
  role?: string | string[];
  departmentId?: string | string[];
  status?: string | string[];
  page?: string | string[];
}): UserListFilters {
  const rawSearch = singleQueryValue(searchParams.search);
  const rawRole = singleQueryValue(searchParams.role);
  const rawDepartmentId = singleQueryValue(searchParams.departmentId);
  const rawStatus = singleQueryValue(searchParams.status);
  const rawPage = singleQueryValue(searchParams.page);

  const searchResult = searchFilterSchema.safeParse(rawSearch);
  const roleResult = roleFilterSchema.safeParse(rawRole);
  const departmentIdResult =
    departmentIdFilterSchema.safeParse(rawDepartmentId);
  const statusResult = statusFilterSchema.safeParse(rawStatus);
  const pageResult = pageFilterSchema.safeParse(rawPage);

  return {
    ...(searchResult.success ? { search: searchResult.data } : {}),
    ...(roleResult.success ? { role: roleResult.data } : {}),
    ...(departmentIdResult.success
      ? { departmentId: departmentIdResult.data }
      : {}),
    ...(statusResult.success ? { status: statusResult.data } : {}),
    page: pageResult.success ? pageResult.data : 1,
  };
}

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
