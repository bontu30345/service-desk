import { redirect } from "next/navigation";
import {
  AuthenticationRequiredError,
  AuthorizationError,
  requireAuthenticatedUser,
  requirePermission,
} from "@/lib/permissions";
import { getTicketReadPermission, getTicketReadScope } from "@/features/tickets/access";
import { TicketReport } from "@/features/dashboard/components/ticket-report";
import { parseTicketReportFilters } from "@/features/dashboard/schemas/ticket-report.schema";
import {
  getTicketReport,
  getTicketReportFilterOptions,
} from "@/features/dashboard/services/ticket-report.service";

type TicketsReportPageProps = {
  searchParams: Promise<{
    from?: string | string[];
    to?: string | string[];
    status?: string | string[];
    priority?: string | string[];
    categoryId?: string | string[];
    departmentId?: string | string[];
    assigneeId?: string | string[];
    range?: string | string[];
    page?: string | string[];
  }>;
};

export default async function TicketsReportPage({
  searchParams,
}: TicketsReportPageProps) {
  let user;
  try {
    user = await requireAuthenticatedUser();
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) redirect("/login");
    throw error;
  }

  try {
    await requirePermission(getTicketReadPermission(user.role));
  } catch (error) {
    if (error instanceof AuthorizationError) redirect("/dashboard");
    throw error;
  }

  const userId = Number(user.id);
  if (!Number.isSafeInteger(userId) || userId < 1) {
    throw new Error("The authenticated account identifier is invalid.");
  }

  const filters = parseTicketReportFilters(await searchParams, {
    allowAssignee: user.role === "ADMIN",
  });
  const scope = getTicketReadScope(user.role, userId);
  const [result, options] = await Promise.all([
    getTicketReport(userId, user.role, filters),
    getTicketReportFilterOptions(user.role, userId),
  ]);

  return (
    <TicketReport
      filters={filters}
      result={result}
      categories={options.categories}
      departments={options.departments}
      assignees={options.assignees}
      canFilterAssignee={scope.kind === "all"}
    />
  );
}
