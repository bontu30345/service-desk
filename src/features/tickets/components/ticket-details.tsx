import Link from "next/link";
import { TicketBadge } from "@/components/ui/ticket-badge";
import type { SafeTicketDetails } from "../types/ticket";

function formatDate(date: Date | null) {
  return date
    ? new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date)
    : "Not set";
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1.5 break-words text-sm font-medium text-slate-900">
        {children}
      </dd>
    </div>
  );
}

export function TicketDetails({
  ticket,
  canEdit,
  workflowControls,
  slaControl,
  conversation,
  attachments,
}: {
  ticket: SafeTicketDetails;
  canEdit: boolean;
  workflowControls?: React.ReactNode;
  slaControl?: React.ReactNode;
  conversation?: React.ReactNode;
  attachments?: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <header className="flex min-w-0 flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.03] sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="min-w-0">
          <p className="font-mono text-xs font-medium tracking-wide text-slate-500">
            Ticket #{ticket.id}
          </p>
          <h1 className="mt-2 max-w-4xl break-words text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            {ticket.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <TicketBadge kind="status" value={ticket.status} />
            <TicketBadge kind="priority" value={ticket.priority} suffix=" priority" />
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          {canEdit && (
            <Link
              href={`/tickets/${ticket.id}/edit`}
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Edit Ticket
            </Link>
          )}
          <Link
            href="/tickets"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Back to Tickets
          </Link>
        </div>
      </header>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(18rem,3fr)]">
      <div className="min-w-0 space-y-6">
      <section className="space-y-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.03] sm:p-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Description
          </h2>
        </div>
        <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">{ticket.description}</p>
      </section>
      {conversation}
      {attachments}
      </div>
      <aside className="min-w-0 space-y-5">
        {workflowControls}
        {slaControl}
        <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.03] sm:p-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Ticket details</h2>
            <p className="mt-1 text-sm text-slate-500">Requester and ownership</p>
          </div>
          <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
            <Detail label="Requester">{ticket.creator.name}</Detail>
            <Detail label="Assignee">{ticket.assignee?.name ?? "Unassigned"}</Detail>
            <Detail label="Department">{ticket.department.name}</Detail>
            <Detail label="Category">{ticket.category.name}</Detail>
            <Detail label="SLA">{ticket.sla?.name ?? "No SLA"}</Detail>
            {ticket.sla && <>
              <Detail label="SLA policy status">{formatLabel(ticket.sla.status)}</Detail>
              <Detail label="Response target">{ticket.sla.responseTimeMinutes} minutes</Detail>
              <Detail label="Resolution target">{ticket.sla.resolutionTimeMinutes} minutes</Detail>
            </>}
          </dl>
        </section>
        <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.03] sm:p-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Timeline</h2>
          <p className="mt-1 text-sm text-slate-500">Recorded ticket dates</p>
        </div>
        <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
          <Detail label="Created">{formatDate(ticket.createdAt)}</Detail>
          <Detail label="Last updated">{formatDate(ticket.updatedAt)}</Detail>
          <Detail label="Resolved">{formatDate(ticket.resolvedAt)}</Detail>
          <Detail label="Closed">{formatDate(ticket.closedAt)}</Detail>
        </dl>
        </section>
      </aside>
      </div>
    </div>
  );
}
