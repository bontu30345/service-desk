import { z } from "zod";
import { auditActions } from "../types/audit-log";

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function positiveInteger(value: string | undefined) {
  if (!value || !/^[1-9]\d*$/.test(value)) {
    return undefined;
  }
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : undefined;
}

function validDate(value: string | undefined, endOfDay = false) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return undefined;
  }

  const date = new Date(
    `${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}`,
  );
  return Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
    ? undefined
    : date;
}

export function parseAuditLogFilters(params: {
  action?: string | string[];
  actorId?: string | string[];
  ticketId?: string | string[];
  from?: string | string[];
  to?: string | string[];
  page?: string | string[];
}) {
  const rawAction = firstValue(params.action);
  const action = auditActionSchema.safeParse(rawAction);
  const page = positiveInteger(firstValue(params.page)) ?? 1;
  const from = validDate(firstValue(params.from));
  const to = validDate(firstValue(params.to), true);

  return {
    action: action.success ? action.data : undefined,
    actorId: positiveInteger(firstValue(params.actorId)),
    ticketId: positiveInteger(firstValue(params.ticketId)),
    from: from && to && from > to ? undefined : from,
    to: from && to && from > to ? undefined : to,
    page,
  };
}

const auditActionSchema = z.enum(auditActions);
