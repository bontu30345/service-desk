import { CreateCommentForm } from "./create-comment-form";
import type { SafeComment } from "../types/comment";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function TicketComments({
  ticketId,
  comments,
  canComment,
}: {
  ticketId: number;
  comments: SafeComment[];
  canComment: boolean;
}) {
  return (
    <section className="space-y-4" aria-labelledby="ticket-comments-heading">
      <header>
        <h2 id="ticket-comments-heading" className="text-lg font-semibold text-slate-900">
          Comments
        </h2>
      </header>

      {comments.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-600 shadow-sm">
          No comments yet.
        </p>
      ) : (
        <ol className="space-y-3">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className="relative rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/[0.02] sm:p-5"
            >
              <div className="flex items-start gap-3">
                <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-800">
                  {comment.author.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <p className="text-sm font-semibold text-slate-900">{comment.author.name}</p>
                <time
                  dateTime={comment.createdAt.toISOString()}
                  className="text-xs tabular-nums text-slate-500"
                >
                  {formatDate(comment.createdAt)}
                </time>
              </div>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                {comment.content}
              </p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}

      {canComment && (
        <CreateCommentForm ticketId={ticketId} />
      )}
    </section>
  );
}
