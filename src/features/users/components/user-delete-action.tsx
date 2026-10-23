"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { deleteUserAction } from "../actions/delete-user";
import type { UserDeleteState } from "../schemas/user.schema";
import { useActionToast } from "@/components/ui/action-toasts";

const initialState: UserDeleteState = { success: false, message: "" };

function DeleteSubmitButton({ name }: { name: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm(`Permanently delete ${name}? This is available only when the account has no related records. Deactivation is safer when history must be preserved.`)) {
          event.preventDefault();
        }
      }}
      className="font-medium text-red-700 hover:underline disabled:opacity-50"
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}

export function UserDeleteAction({ userId, name }: { userId: number; name: string }) {
  const [state, formAction] = useActionState(deleteUserAction, initialState);
  const router = useRouter();
  useActionToast(state);

  useEffect(() => {
    if (state.success) router.refresh();
  }, [router, state]);

  return (
    <form action={formAction} className="inline-flex flex-col items-start gap-1">
      <input type="hidden" name="userId" value={userId} />
      <DeleteSubmitButton name={name} />
      {state.message && !state.success && (
        <span role="alert" className="text-xs text-red-700">{state.message}</span>
      )}
    </form>
  );
}
