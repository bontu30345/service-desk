
import { Priority, TicketStatus } from "@prisma/client";
import { z } from "zod";
import type { TicketListFilters } from "../types/ticket";

const positiveId = z
  .string()
  .regex(/^[1-9]\d*$/, "Choose a valid option.")
  .transform(Number)
  .refine(Number.isSafeInteger, "Choose a valid option.");

export const createTicketSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required.")
    .max(200, "Title must be 200 characters or fewer."),
  description: z
    .string()
    .trim()
    .min(1, "Description is required.")
    .max(10000, "Description must be 10,000 characters or fewer."),
  priority: z.nativeEnum(Priority, {
    error: "Choose a valid priority.",
  }),
  departmentId: positiveId,
  categoryId: positiveId,
});

export const ticketIdSchema = z
  .string()
  .regex(/^[1-9]\d*$/)
  .transform(Number)
  .refine(Number.isSafeInteger);

export const ticketNumericIdSchema = z.number().int().positive().safe();

export const updateTicketSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required.")
    .max(200, "Title must be 200 characters or fewer."),
  description: z
    .string()
    .trim()
    .min(1, "Description is required.")
    .max(10000, "Description must be 10,000 characters or fewer."),
  priority: z.nativeEnum(Priority, {
    error: "Choose a valid priority.",
  }),
  departmentId: positiveId,
  categoryId: positiveId,
});

/**
 * Validates the ticket version submitted by the edit form.
 * This timestamp is used for concurrency protection, not as an editable field.
 */
export const ticketUpdateTimestampSchema = z.iso.datetime();

export const assignTicketSchema = z.object({
  assigneeId: z
    .union([
      z.literal(""),
      z
        .string()
        .regex(/^[1-9]\d*$/, "Choose an active agent.")
        .transform(Number)
        .refine(Number.isSafeInteger, "Choose an active agent."),
    ])
    .transform((value) => (value === "" ? null : value)),
});

export const ticketStatusSchema = z.nativeEnum(TicketStatus, {
  error: "Choose a valid status.",
});

export const assignTicketSLASchema = z
  .union([
    z.literal(""),
    z
      .string()
      .regex(/^[1-9]\d*$/, "Choose an active SLA policy.")
      .transform(Number)
      .refine(
        (value) => Number.isSafeInteger(value) && value <= 2_147_483_647,
        "Choose an active SLA policy.",
      ),
  ])
  .transform((value) => (value === "" ? null : value));

const ticketSearchSchema = z.string().trim().min(1).max(100);

const queryIdSchema = z
  .string()
  .regex(/^[1-9]\d*$/)
  .transform(Number)
  .refine(Number.isSafeInteger);

const pageFilterSchema = z
  .string()
  .regex(/^[1-9]\d*$/)
  .transform(Number)
  .refine(Number.isSafeInteger);

function singleQueryValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

export function parseTicketListFilters(searchParams: {
  search?: string | string[];
  status?: string | string[];
  priority?: string | string[];
  departmentId?: string | string[];
  categoryId?: string | string[];
  assigneeId?: string | string[];
  page?: string | string[];
}): TicketListFilters {
  const searchResult = ticketSearchSchema.safeParse(
    singleQueryValue(searchParams.search),
  );

  const statusResult = ticketStatusSchema.safeParse(
    singleQueryValue(searchParams.status),
  );

  const priorityResult = z.nativeEnum(Priority).safeParse(
    singleQueryValue(searchParams.priority),
  );

  const departmentIdResult = queryIdSchema.safeParse(
    singleQueryValue(searchParams.departmentId),
  );

  const categoryIdResult = queryIdSchema.safeParse(
    singleQueryValue(searchParams.categoryId),
  );

  const assigneeIdResult = queryIdSchema.safeParse(
    singleQueryValue(searchParams.assigneeId),
  );

  const pageResult = pageFilterSchema.safeParse(
    singleQueryValue(searchParams.page),
  );

  return {
    ...(searchResult.success ? { search: searchResult.data } : {}),
    ...(statusResult.success ? { status: statusResult.data } : {}),
    ...(priorityResult.success ? { priority: priorityResult.data } : {}),
    ...(departmentIdResult.success
      ? { departmentId: departmentIdResult.data }
      : {}),
    ...(categoryIdResult.success
      ? { categoryId: categoryIdResult.data }
      : {}),
    ...(assigneeIdResult.success ? { assigneeId: assigneeIdResult.data } : {}),
    page: pageResult.success ? pageResult.data : 1,
  };
}

export type CreateTicketFormInput = z.input<typeof createTicketSchema>;
export type CreateTicketInput = z.output<typeof createTicketSchema>;

export type UpdateTicketFormInput = z.input<typeof updateTicketSchema>;
export type UpdateTicketInput = z.output<typeof updateTicketSchema>;

export type AssignTicketInput = z.output<typeof assignTicketSchema>;

export type TicketCreateActionState = {
  success: boolean;
  message: string;
  ticketId?: number;
  fieldErrors?: Partial<
    Record<
      "title" | "description" | "priority" | "departmentId" | "categoryId",
      string[]
    >
  >;
};

export type TicketUpdateActionState = {
  success: boolean;
  message: string;
  ticketId?: number;
  fieldErrors?: Partial<
    Record<
      | "title"
      | "description"
      | "priority"
      | "departmentId"
      | "categoryId",
      string[]
    >
  >;
};

export type TicketAssignmentActionState = {
  success: boolean;
  message: string;
  fieldErrors?: {
    assigneeId?: string[];
  };
};

export type TicketStatusActionState = {
  success: boolean;
  message: string;
  fieldErrors?: {
    status?: string[];
  };
};
