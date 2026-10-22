import Link from "next/link";
import type { SafeAuditLog } from "../types/audit-log";
import { auditActions } from "../types/audit-log";
import { TicketBadge } from "@/components/ui/ticket-badge";
import {
  emptyStateCentered,
  linkInline,
  paginationNavLink,
  paginationSummary,
  tableBody,
  tableCellMuted,
  tableCellStrong,
  tableElement,
  tableHead,
  tableRow,
  tableShell,
} from "@/components/ui/ui-classes";

const knownResources = new Set([
  "User",
  "Department",
  "Category",
  "Ticket",
  "Comment",
]);
const knownFields = new Set([
  "name",
  "email",
  "role",
  "departmentId",
  "isActive",
  "description",
  "title",
  "priority",
  "categoryId",
  "status",
  "assigneeId",
  "slaId",
]);

function safeTransition(value: unknown): value is string {
  return (
    value === "true" ||
    value === "false" ||
    value === "None" ||
    ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].includes(String(value)) ||
    /^SLA #\d+$/.test(String(value)) ||
    /^Agent #\d+$/.test(String(value)) ||
    value === "Unassigned"
  );
}

function safeDetails(details: string | null) {
  if (!details) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(details);
    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }

    const record = parsed as Record<string, unknown>;
    const resource =
      typeof record.resource === "string" &&
      knownResources.has(record.resource)
        ? record.resource
        : null;
    const entityId =
      typeof record.entityId === "number" &&
      Number.isSafeInteger(record.entityId)
        ? record.entityId
        : null;
    const changedFields = Array.isArray(record.changedFields)
      ? record.changedFields.filter(
          (field): field is string =>
            typeof field === "string" && knownFields.has(field),
        )
      : [];
    const previousValue = safeTransition(record.previousValue) && typeof record.previousValue === "string" ? record.previousValue : null;
    const nextValue = safeTransition(record.nextValue) && typeof record.nextValue === "string" ? record.nextValue : null;

    return {
      resource,
      entityId,
      changedFields,
      previousValue,
      nextValue,
    };
  } catch {
    return null;
  }
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function AuditLogList({
  logs,
  totalCount,
  page,
  totalPages,
  filters,
}: {
  logs: SafeAuditLog[];
  totalCount: number;
  page: number;
  totalPages: number;
  filters: {
    action?: string;
    actorId?: number;
    ticketId?: number;
    from?: Date;
    to?: Date;
  };
}) {
  const hasFilters = Boolean(
    filters.action ||
      filters.actorId ||
      filters.ticketId ||
      filters.from ||
      filters.to,
  );
  const pageHref = (nextPage: number) => {
    const params = new URLSearchParams();
    if (filters.action) params.set("action", filters.action);
    if (filters.actorId) params.set("actorId", String(filters.actorId));
    if (filters.ticketId) params.set("ticketId", String(filters.ticketId));
    if (filters.from) params.set("from", filters.from.toISOString().slice(0, 10));
    if (filters.to) params.set("to", filters.to.toISOString().slice(0, 10));
    params.set("page", String(nextPage));
    return `/audit-logs?${params.toString()}`;
  };

  return (
    <section className="space-y-4">
      <p className={paginationSummary} aria-live="polite">
        {totalCount.toLocaleString()} audit {totalCount === 1 ? "event" : "events"}
      </p>
      {logs.length === 0 ? (
        <div className={emptyStateCentered}>
          <h2 className={`font-semibold ${tableCellStrong}`}>
            {hasFilters ? "No matching audit events" : "No audit events yet"}
          </h2>
          <p className={`mt-2 text-sm ${tableCellMuted}`}>
            {hasFilters
              ? "Try adjusting or clearing the filters."
              : "Administrative and ticket activity will appear here."}
          </p>
        </div>
      ) : (
        <div className={tableShell}>
          <table className={`w-full min-w-[760px] ${tableElement}`}>
            <thead className={tableHead}>
              <tr>
                <th scope="col" className="px-4 py-3.5 font-semibold">Time</th>
                <th scope="col" className="px-4 py-3.5 font-semibold">Actor</th>
                <th scope="col" className="px-4 py-3.5 font-semibold">Event</th>
                <th scope="col" className="px-4 py-3.5 font-semibold">Resource</th>
                <th scope="col" className="px-4 py-3.5 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className={tableBody}>
              {logs.map((log) => {
                const details = safeDetails(log.details);
                const resourceId = details?.entityId;
                const ticketId = log.ticketId ?? (
                  details?.resource === "Ticket" ? resourceId : null
                );
                return (
                  <tr key={log.id} className={`align-top ${tableRow}`}>
                    <td className={`whitespace-nowrap px-4 py-4 ${tableCellMuted}`}>
                      <time dateTime={log.createdAt.toISOString()}>
                        {formatDate(log.createdAt)}
                      </time>
                    </td>
                    <td className="px-4 py-4">
                      <span className={tableCellStrong}>
                        {log.user.name}
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">
                        {log.user.role} · #{log.user.id}
                      </span>
                    </td>
                    <td className={`px-4 py-4 ${tableCellStrong}`}>
                      {auditActions.find((action) => action === log.action) ??
                        "Other event"}
                    </td>
                    <td className={`px-4 py-4 ${tableCellMuted}`}>
                      {details?.resource
                        ? `${details.resource}${resourceId ? ` #${resourceId}` : ""}`
                        : ticketId
                          ? `Ticket #${ticketId}`
                          : "—"}
                    </td>
                    <td className={`px-4 py-4 ${tableCellMuted}`}>
                      {details?.previousValue && details.nextValue ? (
                        ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].includes(details.previousValue) && ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].includes(details.nextValue) ? (
                          <span className="inline-flex flex-wrap items-center gap-2"><TicketBadge kind="status" value={details.previousValue} /><span aria-label="changed to" className="text-slate-400">→</span><TicketBadge kind="status" value={details.nextValue} /></span>
                        ) : <span>{details.previousValue} → {details.nextValue}</span>
                      ) : (details?.changedFields.length ? `Changed: ${details.changedFields.join(", ")}` : "—")}
                      {ticketId && (
                        <Link
                          href={`/tickets/${ticketId}`}
                          className={`mt-1 block text-xs ${linkInline}`}
                        >
                          View ticket
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <nav
          aria-label="Audit log pages"
          className="flex flex-wrap items-center justify-between gap-4"
        >
          <p className={paginationSummary}>
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={pageHref(page - 1)} className={paginationNavLink}>
                Previous
              </Link>
            )}
            {page <= 1 && (
              <span
                aria-disabled="true"
                className={`${paginationNavLink} cursor-not-allowed opacity-50`}
              >
                Previous
              </span>
            )}
            {page < totalPages && (
              <Link href={pageHref(page + 1)} className={paginationNavLink}>
                Next
              </Link>
            )}
            {page >= totalPages && (
              <span
                aria-disabled="true"
                className={`${paginationNavLink} cursor-not-allowed opacity-50`}
              >
                Next
              </span>
            )}
          </div>
        </nav>
      )}
    </section>
  );
}
