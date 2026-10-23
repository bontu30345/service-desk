"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { createCommentAction } from "../actions/create-comment";
import type { CommentCreateState } from "../types/comment";
import { useActionToast } from "@/components/ui/action-toasts";

const initialState: CommentCreateState = {
  success: false,
  message: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
    >
      {pending && (
        <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {pending ? "Adding comment…" : "Add comment"}
    </button>
  );
}

export function CreateCommentForm({ ticketId }: { ticketId: number }) {
  const action = createCommentAction.bind(null, ticketId);
  const [state, formAction] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  useActionToast(state, "Comment added successfully.");

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [router, state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/[0.03] sm:p-5"
    >
      <div>
        <label htmlFor="comment-content" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
          Add a comment
        </label>
        <textarea
          id="comment-content"
          name="content"
          required
          maxLength={5000}
          rows={3}
          placeholder="Write a clear update for the ticket conversation..."
          aria-invalid={Boolean(state.fieldErrors?.content?.length)}
          aria-describedby={
            state.fieldErrors?.content?.length
              ? "comment-content-error"
              : undefined
          }
          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm leading-6 text-slate-900 placeholder:text-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        {state.fieldErrors?.content?.[0] && (
          <p id="comment-content-error" className="mt-1 text-sm font-medium text-red-600">
            {state.fieldErrors.content[0]}
          </p>
        )}
      </div>
      {state.message && !state.success && (
        <p
          role={state.success ? "status" : "alert"}
          className={
            state.success ? "text-sm font-medium text-emerald-700" : "text-sm font-medium text-red-600"
          }
        >
          {state.message}
        </p>
      )}
      <SubmitButton />
    </form>
  );
}
