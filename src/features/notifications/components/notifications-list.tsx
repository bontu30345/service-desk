import Link from "next/link";
import { MarkNotificationReadButton } from "./mark-notification-read-button";
import type { SafeNotification } from "../types/notification";
import { emptyState } from "@/components/ui/ui-classes";

function NotificationIcon({ title }: { title: string }) {
  const common = {
    className: "h-5 w-5",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  if (title === "Ticket assigned to you") {
    return <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM16 11l2 2 4-4" /></svg>;
  }
  if (title === "Ticket status updated") {
    return <svg {...common}><path d="M4 7h15l-3-3M20 17H5l3 3M19 7l-3-3M5 17l3 3" /></svg>;
  }
  if (title === "New ticket comment") {
    return <svg {...common}><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-3 2v-6.5A7.5 7.5 0 1 1 20 11.5Z" /><path d="M8 11h.01M12 11h.01M16 11h.01" /></svg>;
  }
  return <svg {...common}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function NotificationsList({
  notifications,
}: {
  notifications: SafeNotification[];
}) {
  if (notifications.length === 0) {
    return (
      <p className={emptyState}>
        You have no notifications.
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {notifications.map((notification) => (
        <li
          key={notification.id}
          className={`rounded-xl border p-4 shadow-sm shadow-slate-900/[0.02] sm:p-5 ${
            notification.isRead ? "border-slate-200 bg-white" : "border-blue-200 bg-blue-50/70"
          }`}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            {notification.ticket ? (
              <Link href={`/tickets/${notification.ticket.id}`} className="group flex min-w-0 flex-1 items-start gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${notification.isRead ? "bg-slate-100 text-slate-600" : "bg-blue-100 text-blue-700"}`}>
                  <NotificationIcon title={notification.title} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-semibold text-slate-900 group-hover:text-blue-800">{notification.title}</h2>
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${notification.isRead ? "border-slate-200 bg-slate-100 text-slate-600" : "border-blue-200 bg-blue-100 text-blue-800"}`}>
                      {notification.isRead ? "Read" : "Unread"}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{notification.message}</p>
                  <time dateTime={notification.createdAt.toISOString()} className="mt-2 block text-xs text-slate-500">{formatDate(notification.createdAt)}</time>
                  <span className="mt-2 block text-sm font-medium text-blue-700">View ticket #{notification.ticket.id}</span>
                </div>
              </Link>
            ) : (
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600"><NotificationIcon title={notification.title} /></span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-semibold text-slate-900">{notification.title}</h2><span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{notification.isRead ? "Read" : "Unread"}</span></div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{notification.message}</p>
                  <time dateTime={notification.createdAt.toISOString()} className="mt-2 block text-xs text-slate-500">{formatDate(notification.createdAt)}</time>
                </div>
              </div>
            )}
            {!notification.isRead && (
              <MarkNotificationReadButton notificationId={notification.id} />
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
