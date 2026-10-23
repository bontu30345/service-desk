import Link from "next/link";
import type { Priority, TicketStatus } from "@prisma/client";
import { TicketBadge } from "@/components/ui/ticket-badge";
import {
  btnSecondaryLarge,
  cardInteractive,
  cardSurface,
  linkInline,
  pageDescription,
  pageEyebrow,
  pageHeader,
  pageMain,
  pageTitle,
  panelHeader,
  panelSubtitle,
  panelTitle,
} from "@/components/ui/ui-classes";
import { DashboardCharts } from "./dashboard-charts";
import type {
  DashboardTicket,
  OperationalDashboardData,
} from "../types/dashboard";

const statusLabels: Record<TicketStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

const priorityLabels: Record<Priority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function TicketList({
  tickets,
  emptyMessage,
  showAssignee,
  emptyTitle,
  emptyHref,
  emptyLinkLabel,
}: {
  tickets: DashboardTicket[];
  emptyMessage: string;
  showAssignee: boolean;
  emptyTitle?: string;
  emptyHref?: string;
  emptyLinkLabel?: string;
}) {
  if (tickets.length === 0) {
    return (
      <div className="p-5 text-sm leading-6 text-slate-600">
        {emptyTitle && <p className="font-semibold text-slate-900">{emptyTitle}</p>}
        <p>{emptyMessage}</p>
        {emptyHref && emptyLinkLabel && (
          <Link href={emptyHref} className={`mt-3 inline-flex text-sm ${linkInline}`}>
            {emptyLinkLabel}
          </Link>
        )}
      </div>
    );
  }

  return (
    <ul className="divide-y divide-slate-100">
      {tickets.map((ticket) => (
        <li key={ticket.id} className="p-4 transition-colors hover:bg-slate-50/70 sm:px-5">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <Link
                href={`/tickets/${ticket.id}`}
                className="break-words text-sm font-semibold leading-5 text-slate-900 hover:text-blue-700 hover:underline focus-visible:rounded-sm"
              >
                {ticket.title}
              </Link>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                #{ticket.id} · Created by {ticket.creator.name}
                {showAssignee
                  ? ` · ${ticket.assignee?.name ? `Assigned to ${ticket.assignee.name}` : "Unassigned"}`
                  : ""}
              </p>
              {ticket.sla && (
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  SLA: {ticket.sla.name} · resolution target {ticket.sla.resolutionTimeMinutes} min
                  {ticket.sla.status !== "ACTIVE"
                    ? ` (${ticket.sla.status.toLowerCase()} policy)`
                    : ""}
                </p>
              )}
              <time
                dateTime={ticket.createdAt.toISOString()}
                className="mt-1 block text-xs text-slate-500"
              >
                {formatDate(ticket.createdAt)}
              </time>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2 sm:gap-3">
              <TicketBadge kind="priority" value={ticket.priority} />
              <TicketBadge kind="status" value={ticket.status} />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function SummaryCard({
  label,
  value,
  href,
  delayClass = "",
}: {
  label: string;
  value: number;
  href?: string;
  delayClass?: string;
}) {
  const content = (
    <>
      <p className="min-h-8 break-words text-xs font-semibold uppercase leading-4 tracking-wider text-slate-500">{label}</p>
      <p className="mt-2 break-words text-2xl font-bold tracking-tight tabular-nums text-slate-950 sm:text-3xl">
        {value.toLocaleString()}
      </p>
    </>
  );
  const className = `block animate-slide-up ${delayClass} min-w-0 p-4 sm:p-5 ${href ? cardInteractive : cardSurface}`;

  return (
    href
      ? <Link href={href} className={className}>{content}</Link>
      : <article className={className}>{content}</article>
  );
}

const statusChartColors: Record<TicketStatus, string> = {
  OPEN: "#2563eb",
  IN_PROGRESS: "#d97706",
  RESOLVED: "#059669",
  CLOSED: "#6b7280",
};

const priorityChartColors: Record<Priority, string> = {
  LOW: "#94a3b8",
  MEDIUM: "#f59e0b",
  HIGH: "#f97316",
  CRITICAL: "#e11d48",
};

export function OperationalDashboard({
  data,
}: {
  data: OperationalDashboardData;
}) {
  const statusCount = (status: TicketStatus) =>
    data.statusCounts.find((item) => item.status === status)?.count ?? 0;
  const priorityCount = (priority: Priority) =>
    data.priorityCounts.find((item) => item.priority === priority)?.count ?? 0;
  const ticketTotalLabel =
    data.role === "ADMIN"
      ? "Total tickets"
      : data.role === "AGENT"
        ? "Assigned tickets"
        : "Tickets I created";
  const priorityTitle =
    data.role === "ADMIN"
      ? "Workspace tickets by priority"
      : data.role === "AGENT"
        ? "My assigned tickets by priority"
        : "My tickets by priority";
  const statusTitle =
    data.role === "ADMIN"
      ? "Workspace tickets by status"
      : data.role === "AGENT"
        ? "My assigned tickets by status"
        : "My tickets by status";
  const highPriorityCount = priorityCount("HIGH");
  const focusTitle = data.role === "ADMIN" ? "Workspace SLA & Priority Focus" : "My Urgent Work";
  const focusDescription = data.role === "ADMIN"
    ? "Workspace-wide urgent tickets, unassigned work, and SLA-backed items requiring attention."
    : "High-priority tickets and tickets covered by an active SLA assigned to you.";
  const focusEmptyTitle = data.role === "ADMIN" ? "No urgent workspace issues" : "You're all caught up!";
  const focusEmptyMessage = data.role === "ADMIN"
    ? "No qualifying high-priority or SLA-backed tickets currently need attention."
    : "No high-priority or active-SLA tickets are currently assigned to you.";
  const focusHref = data.role === "ADMIN" ? "/tickets?status=OPEN" : "/tickets?queue=assigned";
  const focusLinkLabel = data.role === "ADMIN" ? "View All Open Tickets" : "View My Active Tickets";

  return (
    <main className={`${pageMain} space-y-7 sm:space-y-8`}>
      <header className={pageHeader}>
        <div className="min-w-0">
          <span className={pageEyebrow}>
            <span className="h-2 w-2 rounded-full bg-blue-600" aria-hidden="true" />
            Operations Overview
          </span>
          <h1 className={`mt-2 break-words ${pageTitle}`}>
            Welcome, {data.userName}
          </h1>
          <p className={pageDescription}>
            {data.role === "AGENT" ? "Your assigned work and current ticket status." : "Operational status and ticket performance at a glance."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/tickets" className={`${btnSecondaryLarge} flex-1 sm:flex-none`}>
            View all tickets
          </Link>
        </div>
      </header>

      <section
        aria-label="Operational statistics"
        className={data.role === "ADMIN"
          ? "grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4"
          : "grid min-w-0 grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-5"}
      >
            {data.role === "ADMIN" ? (
          <>
            <SummaryCard label={ticketTotalLabel} value={data.totalTickets} href="/tickets" />
            <SummaryCard label="Open and in progress" value={statusCount("OPEN") + statusCount("IN_PROGRESS")} />
            <SummaryCard label="Resolved and closed" value={statusCount("RESOLVED") + statusCount("CLOSED")} />
            <SummaryCard label="High/critical active" value={data.urgentTicketCount ?? 0} />
            {data.totalUsers !== null && <SummaryCard label="Total users" value={data.totalUsers} />}
            {data.activeUsers !== null && <SummaryCard label="Active users" value={data.activeUsers} />}
          </>
        ) : data.role === "AGENT" ? (
          <>
            <SummaryCard label={ticketTotalLabel} value={data.totalTickets} href="/tickets?queue=assigned" delayClass="delay-100" />
            <SummaryCard label="Open" value={statusCount("OPEN")} href="/tickets?status=OPEN&queue=assigned" delayClass="delay-150" />
            <SummaryCard label="In progress" value={statusCount("IN_PROGRESS")} href="/tickets?status=IN_PROGRESS&queue=assigned" delayClass="delay-150" />
            <SummaryCard label="Resolved" value={statusCount("RESOLVED")} href="/tickets?status=RESOLVED&queue=assigned" delayClass="delay-200" />
            <SummaryCard label="High priority" value={highPriorityCount} href="/tickets?priority=HIGH&queue=assigned" delayClass="delay-200" />
          </>
        ) : (
          <>
            <SummaryCard label={ticketTotalLabel} value={data.totalTickets} href="/tickets" delayClass="delay-100" />
            <SummaryCard label="Open" value={statusCount("OPEN")} href="/tickets?status=OPEN" delayClass="delay-150" />
            <SummaryCard label="In progress" value={statusCount("IN_PROGRESS")} href="/tickets?status=IN_PROGRESS" delayClass="delay-150" />
            <SummaryCard label="Resolved" value={statusCount("RESOLVED")} href="/tickets?status=RESOLVED" delayClass="delay-200" />
            <SummaryCard label="Closed" value={statusCount("CLOSED")} href="/tickets?status=CLOSED" delayClass="delay-200" />
          </>
        )}
      </section>

      <DashboardCharts
        statusTitle={statusTitle}
        priorityTitle={priorityTitle}
        statusData={data.statusCounts.map(({ status, count }) => ({
          key: status,
          label: statusLabels[status],
          count,
          color: statusChartColors[status],
        }))}
        priorityData={data.priorityCounts.map(({ priority, count }) => ({
          key: priority,
          label: priorityLabels[priority],
          count,
          color: priorityChartColors[priority],
        }))}
        departmentData={data.departmentCounts.map(({ departmentId, name, count }, index) => ({
          key: String(departmentId),
          label: name,
          count,
          color: ["#2563eb", "#0d9488", "#7c3aed", "#d97706", "#e11d48"][index % 5],
        }))}
      />

      <section className="grid min-w-0 gap-4 xl:grid-cols-2 xl:gap-5">
        <section className={`min-w-0 ${cardSurface}`}>
          <header className={panelHeader}>
            <div>
              <h2 className={panelTitle}>Recent tickets</h2>
              <p className={panelSubtitle}>
                Latest tickets within your access scope
              </p>
            </div>
            <Link href="/tickets" className={`shrink-0 text-sm ${linkInline}`}>
              All tickets
            </Link>
          </header>
          <TicketList
            tickets={data.recentTickets}
            emptyMessage="No tickets are available in your view yet."
            showAssignee
          />
        </section>

        {data.myAssignedTicketCount !== null && (
          <section className={`min-w-0 ${cardSurface}`}>
            <header className={panelHeader}>
              <div>
                <h2 className={panelTitle}>
                  {focusTitle}
                </h2>
                <p className={panelSubtitle}>
                  {focusDescription}
                </p>
              </div>
              <Link href={focusHref} className={`shrink-0 text-sm ${linkInline}`}>
              {focusLinkLabel}
              </Link>
            </header>
            <TicketList
              tickets={data.priorityFocusTickets}
              emptyMessage={focusEmptyMessage}
              showAssignee={false}
              emptyTitle={focusEmptyTitle}
              emptyHref={focusHref}
              emptyLinkLabel={focusLinkLabel}
            />
          </section>
        )}
      </section>

    </main>
  );
}
