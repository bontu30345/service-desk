import Link from "next/link";
import { TicketBadge } from "@/components/ui/ticket-badge";
import type { SafeTicket } from "../types/ticket";
import { emptyState } from "@/components/ui/ui-classes";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(date);
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

export function TicketsTable({
  tickets,
  hasFilters,
  totalAvailable,
}: {
  tickets: SafeTicket[];
  hasFilters: boolean;
  totalAvailable: number;
}) {
  if (tickets.length === 0) {
    return hasFilters && totalAvailable > 0 ? (
      <p className={emptyState}>
        No tickets match these search and filter criteria.
      </p>
    ) : (
      <p className={emptyState}>
        No tickets found.
      </p>
    );
  }

  return (
    <div className="max-h-[70vh] overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.03]">
      <table aria-label="Tickets" className="w-full min-w-[1000px] table-fixed divide-y divide-slate-200 text-left text-sm">
        <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600 shadow-[0_1px_0_0_#e2e8f0]">
          <tr>
            <th scope="col" className="w-[14%] px-4 py-3.5 font-semibold">
              Ticket
            </th>
            <th scope="col" className="w-[12%] px-3 py-3.5 font-semibold">
              Status
            </th>
            <th scope="col" className="w-[9%] px-3 py-3.5 font-semibold">
              Priority
            </th>
            <th scope="col" className="w-[12%] px-3 py-3.5 font-semibold">
              Created by
            </th>
            <th scope="col" className="w-[12%] px-3 py-3.5 font-semibold">
              Assignee
            </th>
            <th scope="col" className="w-[8%] px-3 py-3.5 font-semibold">
              Department
            </th>
            <th scope="col" className="w-[7%] px-3 py-3.5 font-semibold">
              Category
            </th>
            <th scope="col" className="w-[8%] px-3 py-3.5 font-semibold">
              SLA
            </th>
            <th scope="col" className="w-[9%] px-3 py-3.5 font-semibold">
              Created
            </th>
            <th scope="col" className="w-[9%] px-3 py-3.5 font-semibold">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {tickets.map((ticket) => (
            <tr
              key={ticket.id}
              className="transition-colors hover:bg-blue-50/30"
            >
              <td className="min-w-0 px-4 py-4 align-top">
                <Link
                  href={`/tickets/${ticket.id}`}
                  title={ticket.title}
                  aria-label={`Ticket: ${ticket.title}`}
                  className="block max-w-full truncate font-semibold leading-5 text-slate-900 transition-colors hover:text-blue-700 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  {ticket.title}
                </Link>
                <p className="mt-1 font-mono text-xs tabular-nums text-slate-500">#{ticket.id}</p>
              </td>
              <td className="whitespace-nowrap px-3 py-4 align-top">
                <TicketBadge kind="status" value={ticket.status} />
              </td>
              <td className="whitespace-nowrap px-3 py-4 align-top">
                <TicketBadge kind="priority" value={ticket.priority} />
              </td>
              <td className="min-w-0 px-3 py-4 align-top text-slate-700">
                <span className="block truncate" title={ticket.creator.name} tabIndex={0} aria-label={`Requester: ${ticket.creator.name}`}>
                  {ticket.creator.name}
                </span>
              </td>
              <td className="min-w-0 px-3 py-4 align-top text-slate-700">
                <span className="block truncate" title={ticket.assignee?.name ?? "Unassigned"} tabIndex={0} aria-label={`Assignee: ${ticket.assignee?.name ?? "Unassigned"}`}>
                  {ticket.assignee?.name ?? (
                    <span className="text-slate-400 italic">Unassigned</span>
                  )}
                </span>
              </td>
              <td className="min-w-0 px-3 py-4 align-top text-slate-700">
                <span className="block truncate" title={ticket.department.name} tabIndex={0} aria-label={`Department: ${ticket.department.name}`}>
                  {ticket.department.name}
                </span>
              </td>
              <td className="min-w-0 px-3 py-4 align-top text-slate-700">
                <span className="block truncate" title={ticket.category.name} tabIndex={0} aria-label={`Category: ${ticket.category.name}`}>
                  {ticket.category.name}
                </span>
              </td>
              <td className="min-w-0 px-3 py-4 align-top text-xs text-slate-700">
                {ticket.sla ? (
                  <span className="block truncate font-medium" title={`${ticket.sla.name} (${formatLabel(ticket.sla.status)})`}>
                    <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-blue-500" />
                    {ticket.sla.name} ({formatLabel(ticket.sla.status)})
                  </span>
                ) : (
                  <span className="text-slate-400">No SLA</span>
                )}
              </td>
              <td className="whitespace-normal px-3 py-4 align-top text-xs tabular-nums text-slate-500">
                {formatDate(ticket.createdAt)}
              </td>
              <td className="whitespace-nowrap px-3 py-4 align-top">
                <Link
                  href={`/tickets/${ticket.id}`}
                  aria-label={`View ticket ${ticket.id}: ${ticket.title}`}
                  className="inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
