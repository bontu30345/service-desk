import type { TicketListScope } from "@/features/tickets/types/ticket";
import { listTicketReportExportBatch } from "../repositories/ticket-report.repository";
import type { TicketReportFilters, TicketReportRow } from "../types/ticket-report";
import {
  serializeTicketReportRow,
  ticketReportCsvHeader,
} from "./ticket-report-csv-format";

export async function* streamTicketReportCsv(
  scope: TicketListScope,
  filters: TicketReportFilters,
): AsyncGenerator<string> {
  yield `${ticketReportCsvHeader()}\r\n`;

  let after: Pick<TicketReportRow, "createdAt" | "id"> | undefined;
  while (true) {
    const batch = await listTicketReportExportBatch(scope, filters, after);
    if (batch.length === 0) return;

    for (const ticket of batch) {
      yield `${serializeTicketReportRow(ticket)}\r\n`;
    }

    const lastTicket = batch[batch.length - 1];
    if (!lastTicket || batch.length < 500) return;
    after = { createdAt: lastTicket.createdAt, id: lastTicket.id };
  }
}
