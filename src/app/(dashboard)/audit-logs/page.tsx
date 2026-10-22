import { redirect } from "next/navigation";
import { connection } from "next/server";
import {
  AuthenticationRequiredError,
  AuthorizationError,
  requirePermission,
} from "@/lib/permissions";
import { AuditLogList } from "@/features/audit-logs/components/audit-log-list";
import { listAuditLogs } from "@/features/audit-logs/repositories/audit-log.repository";
import { parseAuditLogFilters } from "@/features/audit-logs/schemas/audit-log.schema";
import { auditActions } from "@/features/audit-logs/types/audit-log";

type AuditLogsPageProps = {
  searchParams: Promise<{
    action?: string | string[];
    actorId?: string | string[];
    ticketId?: string | string[];
    from?: string | string[];
    to?: string | string[];
    page?: string | string[];
  }>;
};

export default async function AuditLogsPage({
  searchParams,
}: AuditLogsPageProps) {
  await connection();

  try {
    await requirePermission("audit-log:read");
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      redirect("/login");
    }
    if (error instanceof AuthorizationError) {
      redirect("/dashboard");
    }
    throw error;
  }

  const filters = parseAuditLogFilters(await searchParams);
  const result = await listAuditLogs(filters);
  const fromValue = filters.from?.toISOString().slice(0, 10) ?? "";
  const toValue = filters.to?.toISOString().slice(0, 10) ?? "";

  return (
    <main className="space-y-6 p-5 sm:p-8">
      <header>
        <h1 className="text-2xl font-bold text-gray-950">Audit Logs</h1>
        <p className="mt-1 text-sm text-gray-600">
          Administrative and ticket activity. Audit events cannot be changed here.
        </p>
      </header>

      <form
        action="/audit-logs"
        method="get"
        className="flex flex-wrap items-end gap-3 py-1"
      >
        <div>
          <label htmlFor="action" className="mb-1 block text-sm font-medium">
            Event
          </label>
          <select
            id="action"
            name="action"
            defaultValue={filters.action ?? ""}
            className="min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600"
          >
            <option value="">All events</option>
            {auditActions.map((action) => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="actorId" className="mb-1 block text-sm font-medium">
            Actor ID
          </label>
          <input
            id="actorId"
            name="actorId"
            inputMode="numeric"
            pattern="[1-9][0-9]*"
            defaultValue={filters.actorId ?? ""}
            className="min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600"
          />
        </div>
        <div>
          <label htmlFor="ticketId" className="mb-1 block text-sm font-medium">
            Ticket ID
          </label>
          <input
            id="ticketId"
            name="ticketId"
            inputMode="numeric"
            pattern="[1-9][0-9]*"
            defaultValue={filters.ticketId ?? ""}
            className="min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600"
          />
        </div>
        <div>
          <label htmlFor="from" className="mb-1 block text-sm font-medium">
            From
          </label>
          <input
            id="from"
            name="from"
            type="date"
            defaultValue={fromValue}
            className="min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600"
          />
        </div>
        <div>
          <label htmlFor="to" className="mb-1 block text-sm font-medium">
            To
          </label>
          <input
            id="to"
            name="to"
            type="date"
            defaultValue={toValue}
            className="min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="min-h-10 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          >
            Apply filters
          </button>
          <a
            href="/audit-logs"
            className="inline-flex min-h-10 items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Clear
          </a>
        </div>
      </form>

      <AuditLogList
        logs={result.logs}
        totalCount={result.totalCount}
        page={result.page}
        totalPages={result.totalPages}
        filters={filters}
      />
    </main>
  );
}
