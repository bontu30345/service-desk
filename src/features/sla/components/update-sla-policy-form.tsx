"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { updateSLAPolicyAction } from "../actions/update-sla-policy";
import type { SLAPolicyActionState } from "../schemas/sla.schema";
import { useActionToast } from "@/components/ui/action-toasts";
import type { SafeSLA } from "../types/sla";
import { SLAPolicyFormFields } from "./sla-policy-form-fields";

const initialState: SLAPolicyActionState = { success: false, message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save changes"}
    </button>
  );
}

export function UpdateSLAPolicyForm({ policy }: { policy: SafeSLA }) {
  const action = updateSLAPolicyAction.bind(null, policy.id);
  const [state, formAction] = useActionState(action, initialState);
  const router = useRouter();
  useActionToast(state, "SLA policy updated successfully.");

  useEffect(() => {
    if (state.success) {
      router.push("/sla");
      router.refresh();
    }
  }, [router, state]);

  return (
    <form action={formAction} className="space-y-4 rounded-lg border bg-white p-6">
      <SLAPolicyFormFields state={state} policy={policy} />
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
        <Link
          href="/sla"
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
