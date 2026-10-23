import { z } from "zod";
import type { CategoryListFilters } from "../types/category";

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Category name is required.")
    .max(100, "Category name must be 100 characters or fewer."),
  description: z
    .string()
    .trim()
    .max(1000, "Description must be 1000 characters or fewer.")
    .transform((value) => (value === "" ? null : value)),
});

export const categoryIdSchema = z.coerce
  .number()
  .int()
  .positive()
  .safe("The selected category is invalid.");

const categorySearchSchema = z.string().trim().min(1).max(100);
const categoryPageSchema = z
  .string()
  .regex(/^[1-9]\d*$/)
  .transform(Number)
  .refine(Number.isSafeInteger);

function singleQueryValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

export function parseCategoryListFilters(searchParams: {
  search?: string | string[];
  page?: string | string[];
}): CategoryListFilters {
  const searchResult = categorySearchSchema.safeParse(
    singleQueryValue(searchParams.search),
  );
  const pageResult = categoryPageSchema.safeParse(
    singleQueryValue(searchParams.page),
  );

  return {
    ...(searchResult.success ? { search: searchResult.data } : {}),
    page: pageResult.success ? pageResult.data : 1,
  };
}

export type CategoryInput = z.infer<typeof categorySchema>;

export type CategoryActionState = {
  success: boolean;
  message: string;
  fieldErrors?: {
    name?: string[];
    description?: string[];
  };
};

export type CategoryDeleteState = {
  success: boolean;
  message: string;
};
