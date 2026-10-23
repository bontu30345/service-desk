"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { createSLAPolicyAction } from "../actions/create-sla-policy";
import type { SLAPolicyActionState } from "../schemas/sla.schema";
import { SLAPolicyFormFields } from "./sla-policy-form-fields";
import { useActionToast } from "@/components/ui/action-toasts";

const initialState: SLAPolicyActionState = { success: false, message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Creating…" : "Create SLA policy"}
    </button>
  );
}

export function CreateSLAPolicyForm({ onSuccess }: { onSuccess?: () => void } = {}) {
  const [state, formAction] = useActionState(
    createSLAPolicyAction,
    initialState,
  );
  const router = useRouter();
  useActionToast(state, "SLA policy created successfully.");

  useEffect(() => {
    if (state.success) {
      if (onSuccess) onSuccess();
      else router.push("/sla");
      router.refresh();
    }
  }, [onSuccess, router, state]);

  return (
    <form action={formAction} className="space-y-4 rounded-lg border bg-white p-6">
      <SLAPolicyFormFields state={state} />
      {state.message && !state.success && (
        <p
          role={state.success ? "status" : "alert"}
          className={
            state.success ? "text-sm text-green-700" : "text-sm text-red-700"
          }
        >
          {state.message}
        </p>
      )}
      <div className="flex gap-3">
        <SubmitButton />
        {onSuccess ? <button type="button" onClick={onSuccess} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-50">Cancel</button> : <Link href="/sla" className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-50">Cancel</Link>}
      </div>
    </form>
  );
}
