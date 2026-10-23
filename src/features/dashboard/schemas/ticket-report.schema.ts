
import { Priority, TicketStatus } from "@prisma/client";
import { z } from "zod";
import type { TicketReportFilters } from "../types/ticket-report";

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const positiveDatabaseId = z
  .string()
  .regex(/^[1-9]\d*$/)
  .transform(Number)
  .refine(
    (value) =>
      Number.isSafeInteger(value) && value <= 2_147_483_647,
  );

const pageSchema = z
  .string()
  .regex(/^[1-9]\d*$/)
  .transform(Number)
  .refine(Number.isSafeInteger);

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);

    return (
      !Number.isNaN(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
    );
  });

type TicketReportSearchParams = {
  from?: string | string[];
  to?: string | string[];
  status?: string | string[];
  priority?: string | string[];
  categoryId?: string | string[];
  assigneeId?: string | string[];
  departmentId?: string | string[];
  range?: string | string[];
  page?: string | string[];
};

export function parseTicketReportFilters(
  params: TicketReportSearchParams,
  options: { allowAssignee: boolean; today?: Date } = {
    allowAssignee: true,
  },
): TicketReportFilters {
  const fromResult = dateSchema.safeParse(firstValue(params.from));
  const toResult = dateSchema.safeParse(firstValue(params.to));

  const statusResult = z
    .nativeEnum(TicketStatus)
    .safeParse(firstValue(params.status));

  const priorityResult = z
    .nativeEnum(Priority)
    .safeParse(firstValue(params.priority));

  const categoryResult = positiveDatabaseId.safeParse(
    firstValue(params.categoryId),
  );

  const assigneeResult = positiveDatabaseId.safeParse(
    firstValue(params.assigneeId),
  );

  const departmentResult = positiveDatabaseId.safeParse(
    firstValue(params.departmentId),
  );

  const rangeResult = z
    .enum(["7d", "30d", "year", "custom"])
    .safeParse(firstValue(params.range));

  const pageResult = pageSchema.safeParse(firstValue(params.page));

  const today = (options.today ?? new Date())
    .toISOString()
    .slice(0, 10);

  const range = rangeResult.success ? rangeResult.data : undefined;

  const hasResolvedPresetDates = Boolean(
    (range === "7d" || range === "30d" || range === "year") &&
      fromResult.success &&
      toResult.success &&
      fromResult.data <= toResult.data,
  );

  const presetStart =
    !hasResolvedPresetDates &&
    (range === "7d" || range === "30d" || range === "year")
      ? new Date(`${today}T00:00:00.000Z`)
      : undefined;

  if (presetStart && range === "7d") {
    presetStart.setUTCDate(presetStart.getUTCDate() - 6);
  }

  if (presetStart && range === "30d") {
    presetStart.setUTCDate(presetStart.getUTCDate() - 29);
  }

  if (presetStart && range === "year") {
    presetStart.setUTCMonth(0, 1);
  }

  const effectiveFrom =
    presetStart?.toISOString().slice(0, 10) ??
    (fromResult.success ? fromResult.data : undefined);

  const effectiveTo = presetStart
    ? today
    : toResult.success
      ? toResult.data
      : undefined;

  const effectiveReversed = Boolean(
    effectiveFrom && effectiveTo && effectiveFrom > effectiveTo,
  );

  return {
    ...(!effectiveReversed && effectiveFrom
      ? { from: effectiveFrom }
      : {}),
    ...(!effectiveReversed && effectiveTo
      ? { to: effectiveTo }
      : {}),
    ...(range ? { range } : {}),
    ...(statusResult.success ? { status: statusResult.data } : {}),
    ...(priorityResult.success
      ? { priority: priorityResult.data }
      : {}),
    ...(categoryResult.success
      ? { categoryId: categoryResult.data }
      : {}),
    ...(departmentResult.success
      ? { departmentId: departmentResult.data }
      : {}),
    ...(options.allowAssignee && assigneeResult.success
      ? { assigneeId: assigneeResult.data }
      : {}),
    page: pageResult.success ? pageResult.data : 1,
  };
}

export function areTicketReportFiltersValid(
  params: Omit<TicketReportSearchParams, "page">,
  options: { allowAssignee: boolean },
): boolean {

  const fields = [
    params.from,
    params.to,
    params.status,
    params.priority,
    params.categoryId,
    params.departmentId,
    params.range,
    ...(options.allowAssignee ? [params.assigneeId] : []),
  ];

  if (
    fields.some(
      (value) => Array.isArray(value) && value.length > 1,
    )
  ) {
    return false;
  }

  const rawFrom = firstValue(params.from);
  const rawTo = firstValue(params.to);
  const rawRange = firstValue(params.range);

  const presetRange =
    rawRange === "7d" ||
    rawRange === "30d" ||
    rawRange === "year";

  const hasRawFrom = Boolean(rawFrom);
  const hasRawTo = Boolean(rawTo);

  if (hasRawFrom && !dateSchema.safeParse(rawFrom).success) {
    return false;
  }

  if (hasRawTo && !dateSchema.safeParse(rawTo).success) {
    return false;
  }

  if (
    rawRange &&
    !z.enum(["7d", "30d", "year", "custom"]).safeParse(rawRange)
      .success
  ) {
    return false;
  }

  if (presetRange && hasRawFrom !== hasRawTo) {
    return false;
  }

  if (hasRawFrom && hasRawTo && rawFrom! > rawTo!) {
    return false;
  }

  const normalized = parseTicketReportFilters(
    {
      from: params.from,
      to: params.to,
      status: params.status,
      priority: params.priority,
      categoryId: params.categoryId,
      assigneeId: params.assigneeId,
      departmentId: params.departmentId,
      range: params.range,
    },
    options,
  );

  const provided = [
    [params.status, normalized.status],
    [params.priority, normalized.priority],
    [params.categoryId, normalized.categoryId],
    [params.departmentId, normalized.departmentId],
    ...(options.allowAssignee
      ? [[params.assigneeId, normalized.assigneeId] as const]
      : []),
  ] as const;

  if (
    provided.some(([raw, parsed]) => {
      const value = firstValue(raw);
      return Boolean(value) && parsed === undefined;
    })
  ) {
    return false;
  }

  return !(
    normalized.from &&
    normalized.to &&
    normalized.from > normalized.to
  );
}
