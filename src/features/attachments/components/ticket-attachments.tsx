import { UploadAttachmentForm } from "./upload-attachment-form";
import type { SafeAttachment } from "../types/attachment";
import { formatBytes } from "../utils/format-bytes";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function AttachmentIcon({ image }: { image: boolean }) {
  return image ? (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  ) : (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M8 13h8M8 17h8" />
    </svg>
  );
}

function DownloadIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5M12 15V3" /></svg>;
}

export function TicketAttachments({
  ticketId,
  attachments,
  canUpload,
  hasError,
}: {
  ticketId: number;
  attachments: SafeAttachment[];
  canUpload: boolean;
  hasError: boolean;
}) {
  return (
    <section
      className="space-y-4"
      aria-labelledby="ticket-attachments-heading"
    >
      <header>
        <h2 id="ticket-attachments-heading" className="text-lg font-semibold text-slate-900">
          Attachments
        </h2>
      </header>

      {hasError ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-white p-5 text-sm leading-6 text-red-800 shadow-sm">
          Attachments could not be loaded. Please refresh the page to try again.
        </p>
      ) : attachments.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-600 shadow-sm">
          No attachments yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {attachments.map((attachment) => (
            <li
              key={attachment.id}
              className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 transition-colors hover:bg-slate-50/50 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                  <AttachmentIcon image={/^(image\/|.*\.(png|jpe?g)$)/i.test(`${attachment.fileType ?? ""} ${attachment.fileName}`)} />
                </span>
                <div className="min-w-0">
                  <a
                    href={`/api/tickets/${ticketId}/attachments/${attachment.id}`}
                    className="block truncate text-sm font-semibold text-slate-900 hover:text-blue-700 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    title={attachment.fileName}
                  >
                    {attachment.fileName}
                  </a>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    {attachment.fileType ?? "Unknown type"} · {attachment.fileSize === null ? "Size unavailable" : formatBytes(attachment.fileSize)} · Uploaded by {attachment.uploadedBy.name}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
                <time dateTime={attachment.createdAt.toISOString()} className="text-xs tabular-nums text-slate-500">{formatDate(attachment.createdAt)}</time>
                <a href={`/api/tickets/${ticketId}/attachments/${attachment.id}`} aria-label={`Download ${attachment.fileName}`} title="Download" className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                  <DownloadIcon />
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}

      {canUpload && <UploadAttachmentForm ticketId={ticketId} />}
    </section>
  );
}
