import type { TicketReportFilters } from "../types/ticket-report";

export function ticketReportFilterParams(filters: TicketReportFilters) {
  const params = new URLSearchParams();
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.range) params.set("range", filters.range);
  if (filters.status) params.set("status", filters.status);
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.categoryId) params.set("categoryId", String(filters.categoryId));
  if (filters.departmentId) params.set("departmentId", String(filters.departmentId));
  if (filters.assigneeId) params.set("assigneeId", String(filters.assigneeId));
  return params;
}
