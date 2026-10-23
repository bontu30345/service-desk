
import Link from "next/link";
import { Priority, TicketStatus } from "@prisma/client";
import { TicketBadge } from "@/components/ui/ticket-badge";
import { PrintPdfButton } from "./print-pdf-button";
import { DashboardCharts } from "./dashboard-charts";
import { ExportCsvButton } from "./export-csv-button";
import { TicketReportDateRangeFields } from "./ticket-report-date-range-fields";
import { ticketReportFilterParams } from "../services/ticket-report-filter-params";
import type {
  TicketReportFilters,
  TicketReportOption,
  TicketReportPage,
} from "../types/ticket-report";

function reportUrl(filters: TicketReportFilters, page?: number) {
  const params = ticketReportFilterParams(filters);

  if (page && page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();
  return `/reports/tickets${query ? `?${query}` : ""}`;
}

function exportUrl(filters: TicketReportFilters) {
  const query = ticketReportFilterParams(filters).toString();
  return `/api/reports/tickets${query ? `?${query}` : ""}`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function reportPageUrl(filters: TicketReportFilters, page: number) {
  return reportUrl(filters, page);
}

export function TicketReport({
  filters,
  result,
  categories,
  departments,
  assignees,
  canFilterAssignee,
}: {
  filters: TicketReportFilters;
  result: TicketReportPage;
  categories: TicketReportOption[];
  departments: TicketReportOption[];
  assignees: TicketReportOption[];
  canFilterAssignee: boolean;
}) {
  const hasFilters = Boolean(
    filters.from ||
      filters.to ||
      filters.status ||
      filters.priority ||
      filters.categoryId ||
      filters.departmentId ||
      filters.assigneeId,
  );

  return (
    <main className="animate-fade-in space-y-6 p-5 sm:p-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">
            Tickets Report
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Filter tickets available to your account and export the results.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <PrintPdfButton />
          <ExportCsvButton href={exportUrl(filters)} />
        </div>
      </header>

      <section aria-label="Filtered ticket analytics" className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {[
            ["Matching tickets", result.totalCount, "#1d4ed8"],
            ["Open", result.analytics.openCount, "#2563eb"],
            ["In progress", result.analytics.inProgressCount, "#d97706"],
            ["Resolved", result.analytics.resolvedCount, "#16a34a"],
            ["High / critical", result.analytics.priorityCount, "#e11d48"],
          ].map(([label, value, color]) => (
            <article
              key={label}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {label}
              </p>
              <p
                className="mt-2 text-2xl font-bold"
                style={{ color: String(color) }}
              >
                {Number(value).toLocaleString()}
              </p>
            </article>
          ))}
        </div>

        <DashboardCharts
          statusTitle={`${result.totalCount.toLocaleString()} filtered tickets`}
          priorityTitle="Filtered ticket volume by priority"
          statusData={result.analytics.statusCounts.map(
            ({ status, count }) => ({
              key: status,
              label: status.replaceAll("_", " "),
              count,
              color: {
                OPEN: "#2563eb",
                IN_PROGRESS: "#d97706",
                RESOLVED: "#16a34a",
                CLOSED: "#64748b",
              }[status],
            }),
          )}
          priorityData={result.analytics.priorityCounts.map(
            ({ priority, count }) => ({
              key: priority,
              label: priority,
              count,
              color: {
                LOW: "#94a3b8",
                MEDIUM: "#f59e0b",
                HIGH: "#f97316",
                CRITICAL: "#e11d48",
              }[priority],
            }),
          )}
          departmentData={result.analytics.departmentCounts.map(
            ({ name, count }, index) => ({
              key: name,
              label: name,
              count,
              color: [
                "#2563eb",
                "#0d9488",
                "#7c3aed",
                "#d97706",
                "#e11d48",
              ][index % 5],
            }),
          )}
        />
      </section>

      <form
        action="/reports/tickets"
        method="get"
        className="no-print grid gap-4 rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:border-slate-300 sm:grid-cols-2 lg:grid-cols-4"
      >
        <TicketReportDateRangeFields
          initialRange={filters.range ?? "custom"}
          initialFrom={filters.from ?? ""}
          initialTo={filters.to ?? ""}
        />

        <div>
          <label
            htmlFor="status"
            className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600"
          >
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={filters.status ?? ""}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">All statuses</option>
            {Object.values(TicketStatus).map((status) => (
              <option key={status} value={status}>
                {status.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="priority"
            className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600"
          >
            Priority
          </label>
          <select
            id="priority"
            name="priority"
            defaultValue={filters.priority ?? ""}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">All priorities</option>
            {Object.values(Priority).map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="categoryId"
            className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600"
          >
            Category
          </label>
          <select
            id="categoryId"
            name="categoryId"
            defaultValue={filters.categoryId?.toString() ?? ""}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="departmentId"
            className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600"
          >
            Department
          </label>
          <select
            id="departmentId"
            name="departmentId"
            defaultValue={filters.departmentId?.toString() ?? ""}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">All departments</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
        </div>

        {canFilterAssignee && (
          <div>
            <label
              htmlFor="assigneeId"
              className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600"
            >
              Assignee
            </label>
            <select
              id="assigneeId"
              name="assigneeId"
              defaultValue={filters.assigneeId?.toString() ?? ""}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">All assignees</option>
              {assignees.map((assignee) => (
                <option key={assignee.id} value={assignee.id}>
                  {assignee.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex flex-wrap items-end gap-3 pt-2 sm:col-span-2 lg:col-span-4">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-all duration-200 hover:bg-blue-500 active:scale-95"
          >
            Apply filters
          </button>

          {hasFilters && (
            <Link
              href="/reports/tickets"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-xs transition-all duration-200 hover:bg-slate-50 active:scale-95"
            >
              Clear filters
            </Link>
          )}
        </div>
      </form>

      <section aria-label="Filtered ticket results" className="space-y-3">
        <p className="text-sm font-medium text-slate-600" aria-live="polite">
          {result.totalCount.toLocaleString()}{" "}
          {result.totalCount === 1 ? "ticket" : "tickets"} found
        </p>

        {result.tickets.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-xs">
            {hasFilters
              ? "No tickets match these report filters."
              : "No tickets are available in your report scope."}
            {hasFilters && (
              <Link
                href="/reports/tickets"
                className="ml-2 font-semibold text-blue-700 underline underline-offset-2"
              >
                Reset filters
              </Link>
            )}
          </p>
        ) : (
          <div className="max-h-[70vh] overflow-auto rounded-xl border border-slate-200/80 bg-white shadow-xs">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-600 shadow-[0_1px_0_0_#e2e8f0]">
                <tr>
                  <th scope="col" className="px-5 py-3.5 font-semibold">
                    Ticket
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-semibold">
                    Status
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-semibold">
                    Priority
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-semibold">
                    Creator
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-semibold">
                    Assignee
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-semibold">
                    Category
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-semibold">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80">
                {result.tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="transition-colors duration-150 hover:bg-slate-50/80"
                  >
                    <td className="max-w-xs px-5 py-4">
                      <Link
                        href={`/tickets/${ticket.id}`}
                        title={ticket.title}
                        className="block max-w-[200px] truncate font-semibold text-slate-900 transition-colors hover:text-blue-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                      >
                        {ticket.title}
                      </Link>
                      <p className="mt-0.5 font-mono text-xs text-slate-500">
                        #{ticket.id}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <TicketBadge kind="status" value={ticket.status} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <TicketBadge kind="priority" value={ticket.priority} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                      {ticket.creator.name}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                      {ticket.assignee?.name ?? (
                        <span className="italic text-slate-400">Unassigned</span>
                      )}
                    </td>
                    <td
                      className="max-w-[200px] truncate px-5 py-4 text-slate-700"
                      title={ticket.category.name}
                      tabIndex={0}
                      aria-label={`Category: ${ticket.category.name}`}
                    >
                      {ticket.category.name}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                      {formatDate(ticket.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {result.totalCount > 0 && (
          <nav
            aria-label="Ticket report pagination"
            className="flex flex-wrap items-center justify-between gap-3"
          >
            <p className="text-sm text-gray-600">
              Showing {(result.page - 1) * result.pageSize + 1}–
              {Math.min(result.page * result.pageSize, result.totalCount)} of{" "}
              {result.totalCount.toLocaleString()}
            </p>

            <div className="flex items-center gap-2">
              {result.page > 1 ? (
                <Link
                  href={reportPageUrl(filters, result.page - 1)}
                  className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
                >
                  Previous
                </Link>
              ) : (
                <span className="rounded-md border px-3 py-2 text-sm text-gray-400">
                  Previous
                </span>
              )}

              <span className="px-2 text-sm text-gray-700">
                Page {result.page} of {result.totalPages}
              </span>

              {result.page < result.totalPages ? (
                <Link
                  href={reportPageUrl(filters, result.page + 1)}
                  className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
                >
                  Next
                </Link>
              ) : (
                <span className="rounded-md border px-3 py-2 text-sm text-gray-400">
                  Next
                </span>
              )}
            </div>
          </nav>
        )}
      </section>
    </main>
  );
}
