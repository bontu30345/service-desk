"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { setUserStatusAction } from "../actions/set-user-status";
import type { UserActionState } from "../types/user";
import { useActionToast } from "@/components/ui/action-toasts";

const initialState: UserActionState = {
  success: false,
  message: "",
};

function StatusSubmitButton({
  isActive,
}: {
  isActive: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(event) => {
        if (isActive) {
          const confirmed = window.confirm(
            "Deactivate this user? The user will no longer be considered active.",
          );
          if (!confirmed) {
            event.preventDefault();
          }
        }
      }}
      className="font-medium text-blue-700 hover:underline disabled:opacity-50"
    >
      {pending
        ? "Saving…"
        : isActive
          ? "Deactivate"
          : "Activate"}
    </button>
  );
}

export function UserStatusAction({
  userId,
  isActive,
}: {
  userId: number;
  isActive: boolean;
}) {
  const action = setUserStatusAction.bind(null, userId, !isActive);
  const [state, formAction] = useActionState(action, initialState);
  const router = useRouter();
  useActionToast(state, isActive ? "User deactivated successfully." : "User activated successfully.");

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [router, state]);

  return (
    <form action={formAction} className="inline-flex flex-col items-start gap-1">
      <StatusSubmitButton isActive={isActive} />
      {state.message && !state.success && (
        <span
          role={state.success ? "status" : "alert"}
          className={`text-xs ${
            state.success ? "text-green-700" : "text-red-700"
          }`}
        >
          {state.message}
        </span>
      )}
    </form>
  );
}
