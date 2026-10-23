import type { TicketReportRow } from "../types/ticket-report";

const csvHeader = [
  "Ticket ID",
  "Title",
  "Status",
  "Priority",
  "Created at",
  "Creator",
  "Assignee",
  "Category",
  "Department",
];

function safeSpreadsheetValue(value: string): string {
  return /^[\u0000-\u0020\uFEFF]*[=+\-@]/.test(value) ? `'${value}` : value;
}

export function encodeCsvCell(value: string): string {
  const safeValue = safeSpreadsheetValue(value);
  return `"${safeValue.replaceAll('"', '""')}"`;
}

export function ticketReportCsvHeader(): string {
  return csvHeader.map(encodeCsvCell).join(",");
}

export function serializeTicketReportRow(ticket: TicketReportRow): string {
  return [
    ticket.id.toString(),
    ticket.title,
    ticket.status,
    ticket.priority,
    ticket.createdAt.toISOString(),
    ticket.creator.name,
    ticket.assignee?.name ?? "",
    ticket.category.name,
    ticket.department.name,
  ]
    .map(encodeCsvCell)
    .join(",");
}
