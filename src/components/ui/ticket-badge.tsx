import type { Priority, TicketStatus } from "@prisma/client";

const statusStyles: Record<TicketStatus, string> = {
  OPEN: "border-sky-200 bg-sky-50 text-sky-800",
  IN_PROGRESS: "border-amber-200 bg-amber-50 text-amber-900",
  RESOLVED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  CLOSED: "border-slate-200 bg-slate-100 text-slate-700",
};

const priorityStyles: Record<Priority, string> = {
  LOW: "border-slate-200 bg-slate-100 text-slate-700",
  MEDIUM: "border-blue-200 bg-blue-50 text-blue-800",
  HIGH: "border-orange-200 bg-orange-50 text-orange-900",
  CRITICAL: "border-rose-200 bg-rose-50 text-rose-800",
};

function formatLabel(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function TicketBadge({
  kind,
  value,
  suffix = "",
  className = "",
}: {
  kind: "status" | "priority";
  value: string | null | undefined;
  suffix?: string;
  className?: string;
}) {
  const label = value ? formatLabel(value) : "Unknown";
  const knownStyle = value === undefined || value === null
    ? undefined
    : kind === "status"
      ? statusStyles[value as TicketStatus]
      : priorityStyles[value as Priority];

  return (
    <span className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${knownStyle ?? "border-slate-200 bg-slate-100 text-slate-700"} ${className}`}>
      {label}{suffix}
    </span>
  );
}
