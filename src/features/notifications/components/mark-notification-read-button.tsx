"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "../actions/mark-notification-read";
import type { MarkNotificationReadState } from "../types/notification";
import { useActionToast } from "@/components/ui/action-toasts";

const initialState: MarkNotificationReadState = {
  success: false,
  message: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-9 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Saving…" : "Mark as read"}
    </button>
  );
}

function MarkAllSubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Marking read…" : "Mark all as read"}
    </button>
  );
}

export function MarkAllNotificationsReadButton({
  disabled = false,
}: {
  disabled?: boolean;
}) {
  const [state, formAction] = useActionState(
    markAllNotificationsReadAction,
    initialState,
  );
  const router = useRouter();
  useActionToast(state, "Notifications marked as read.");

  useEffect(() => {
    if (state.success) router.refresh();
  }, [router, state]);

  return (
    <div className="flex flex-col items-end gap-1.5">
      <form action={formAction}>
        <MarkAllSubmitButton disabled={disabled} />
      </form>
      {state.message && !state.success && (
        <p role={state.success ? "status" : "alert"} className={state.success ? "text-xs text-emerald-700" : "text-xs text-red-700"}>
          {state.message}
        </p>
      )}
    </div>
  );
}

export function MarkNotificationReadButton({
  notificationId,
}: {
  notificationId: number;
}) {
  const action = markNotificationReadAction.bind(null, notificationId);
  const [state, formAction] = useActionState(action, initialState);
  const router = useRouter();
  useActionToast(state, "Notification marked as read.");

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [router, state]);

  return (
    <form action={formAction} className="space-y-2">
      <SubmitButton />
      {state.message && !state.success && (
        <p
          role={state.success ? "status" : "alert"}
          className={
            state.success ? "text-xs text-green-700" : "text-xs text-red-700"
          }
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
