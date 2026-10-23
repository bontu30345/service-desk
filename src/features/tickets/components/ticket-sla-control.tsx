"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { assignTicketSLAAction } from "../actions/assign-ticket-sla";
import type {
  SafeTicketDetails,
  TicketSLAOption,
  TicketSlaAssignmentActionState,
} from "../types/ticket";
import { useActionToast } from "@/components/ui/action-toasts";

const initialState: TicketSlaAssignmentActionState = {
  success: false,
  message: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save SLA"}
    </button>
  );
}

export function TicketSLAControl({
  ticket,
  policies,
}: {
  ticket: SafeTicketDetails;
  policies: TicketSLAOption[];
}) {
  const action = assignTicketSLAAction.bind(null, ticket.id);
  const [state, formAction] = useActionState(action, initialState);
  const router = useRouter();
  useActionToast(state, "Ticket SLA updated.");
  const selectedPolicyIsActive = policies.some(
    (policy) => policy.id === ticket.sla?.id,
  );

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [router, state]);

  return (
    <section
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.03] sm:p-6"
      aria-labelledby="ticket-sla-control-heading"
    >
      <div>
        <h2 id="ticket-sla-control-heading" className="text-base font-semibold text-slate-900">
          Ticket SLA
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Only active SLA policies can be assigned. Changing the ticket&apos;s
          SLA does not modify the policy.
        </p>
      </div>
      <form action={formAction} className="space-y-3">
        <div>
          <label htmlFor="ticket-sla-id" className="mb-1.5 block text-sm font-medium text-slate-700">
            SLA policy
          </label>
          <select
            id="ticket-sla-id"
            name="slaId"
            defaultValue={ticket.sla?.id ?? ""}
            aria-invalid={Boolean(state.fieldErrors?.slaId?.length)}
            aria-describedby={
              state.fieldErrors?.slaId?.length
                ? "ticket-sla-error"
                : undefined
            }
            className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 sm:max-w-lg"
          >
            <option value="">No SLA</option>
            {ticket.sla && !selectedPolicyIsActive && (
              <option value={ticket.sla.id}>
                {ticket.sla.name} (currently assigned;{" "}
                {ticket.sla.status.toLowerCase()})
              </option>
            )}
            {policies.map((policy) => (
              <option key={policy.id} value={policy.id}>
                {policy.name} — response {policy.responseTimeMinutes} min /
                resolution {policy.resolutionTimeMinutes} min
              </option>
            ))}
          </select>
          {state.fieldErrors?.slaId?.[0] && (
            <p id="ticket-sla-error" className="mt-1 text-sm text-red-700">
              {state.fieldErrors.slaId[0]}
            </p>
          )}
        </div>
        <SubmitButton />
        {state.message && !state.success && (
          <p
            role={state.success ? "status" : "alert"}
            className={`text-sm ${
              state.success ? "text-green-700" : "text-red-700"
            }`}
          >
            {state.message}
          </p>
        )}
      </form>
    </section>
  );
}
