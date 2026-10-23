"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { TicketStatus } from "@prisma/client";
import { assignTicketAction } from "../actions/assign-ticket";
import { changeTicketStatusAction } from "../actions/change-ticket-status";
import { getAllowedTicketStatusTransitions } from "../access";
import type {
  TicketAssignmentActionState,
  TicketStatusActionState,
} from "../schemas/ticket.schema";
import type { SafeTicketDetails, TicketRelationOption } from "../types/ticket";
import { useActionToast } from "@/components/ui/action-toasts";

const initialAssignmentState: TicketAssignmentActionState = {
  success: false,
  message: "",
};

const initialStatusState: TicketStatusActionState = {
  success: false,
  message: "",
};

function formatLabel(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase().replaceAll("_", " ");
}

function AssignmentSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save assignment"}
    </button>
  );
}

function StatusSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Updating…" : "Update status"}
    </button>
  );
}

export function TicketWorkflowControls({
  ticket,
  assignees,
  canAssign,
  canChangeStatus,
}: {
  ticket: SafeTicketDetails;
  assignees: TicketRelationOption[];
  canAssign: boolean;
  canChangeStatus: boolean;
}) {
  const assignmentAction = assignTicketAction.bind(null, ticket.id);
  const [assignmentState, assignmentFormAction] = useActionState(
    assignmentAction,
    initialAssignmentState,
  );
  const statusAction = changeTicketStatusAction.bind(null, ticket.id);
  const [statusState, statusFormAction] = useActionState(
    statusAction,
    initialStatusState,
  );
  const router = useRouter();
  useActionToast(assignmentState, "Assignment updated successfully.");
  useActionToast(statusState, "Ticket status updated.");

  useEffect(() => {
    if (assignmentState.success || statusState.success) {
      router.refresh();
    }
  }, [assignmentState, router, statusState]);

  const currentAssigneeIsListed =
    ticket.assignee && assignees.some((item) => item.id === ticket.assignee?.id);
  const transitions = getAllowedTicketStatusTransitions(ticket.status);

  if (!canAssign && (!canChangeStatus || transitions.length === 0)) {
    return null;
  }

  return (
    <section aria-label="Ticket workflow" className="space-y-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.03] sm:p-6">
      {canAssign && (
        <form action={assignmentFormAction} className="space-y-3">
          <h2 className="text-base font-semibold text-slate-900">Assignment</h2>
          <div>
            <label
              htmlFor="assigneeId"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Assigned agent
            </label>
            <select
              id="assigneeId"
              name="assigneeId"
              defaultValue={ticket.assignee?.id ?? ""}
              aria-invalid={Boolean(
                assignmentState.fieldErrors?.assigneeId?.length,
              )}
              className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">Unassigned</option>
              {ticket.assignee && !currentAssigneeIsListed && (
                <option value={ticket.assignee.id}>
                  {ticket.assignee.name} (currently assigned)
                </option>
              )}
              {assignees.map((assignee) => (
                <option key={assignee.id} value={assignee.id}>
                  {assignee.name}
                </option>
              ))}
            </select>
            {assignmentState.fieldErrors?.assigneeId?.[0] && (
              <p className="mt-1 text-sm text-red-700">
                {assignmentState.fieldErrors.assigneeId[0]}
              </p>
            )}
          </div>
          <AssignmentSubmitButton />
          {assignmentState.message && !assignmentState.success && (
            <p
              role={assignmentState.success ? "status" : "alert"}
              className={`text-sm ${
                assignmentState.success ? "text-emerald-700" : "text-red-700"
              }`}
            >
              {assignmentState.message}
            </p>
          )}
        </form>
      )}

      {canChangeStatus && transitions.length > 0 && (
        <form action={statusFormAction} className="space-y-3">
          <h2 className="text-base font-semibold text-slate-900">Status workflow</h2>
          <div>
            <label
              htmlFor="next-status"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Move to
            </label>
            <select
              id="next-status"
              name="status"
              defaultValue=""
              required
              aria-invalid={Boolean(statusState.fieldErrors?.status?.length)}
              className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="" disabled>
                Select next status
              </option>
              {transitions.map((status: TicketStatus) => (
                <option key={status} value={status}>
                  {formatLabel(status)}
                </option>
              ))}
            </select>
            {statusState.fieldErrors?.status?.[0] && (
              <p className="mt-1 text-sm text-red-700">
                {statusState.fieldErrors.status[0]}
              </p>
            )}
          </div>
          <StatusSubmitButton />
          {statusState.message && !statusState.success && (
            <p
              role={statusState.success ? "status" : "alert"}
              className={`text-sm ${
                statusState.success ? "text-emerald-700" : "text-red-700"
              }`}
            >
              {statusState.message}
            </p>
          )}
        </form>
      )}
    </section>
  );
}
