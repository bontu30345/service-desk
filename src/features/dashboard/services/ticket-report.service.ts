import type { Role } from "@prisma/client";
import { getTicketReadScope } from "@/features/tickets/access";
import {
  listTicketReport,
  listTicketReportAssignees,
  listTicketReportCategories,
  listTicketReportDepartments,
} from "../repositories/ticket-report.repository";
import type {
  TicketReportFilters,
  TicketReportPage,
} from "../types/ticket-report";

export function getTicketReport(
  userId: number,
  role: Role,
  filters: TicketReportFilters,
): Promise<TicketReportPage> {
  return listTicketReport(getTicketReadScope(role, userId), filters);
}

export function getTicketReportFilterOptions(role: Role, userId: number) {
  const scope = getTicketReadScope(role, userId);
  return Promise.all([
    listTicketReportCategories(),
    listTicketReportDepartments(scope),
    scope.kind === "all" ? listTicketReportAssignees() : Promise.resolve([]),
  ]).then(([categories, departments, assignees]) => ({ categories, departments, assignees }));
}
