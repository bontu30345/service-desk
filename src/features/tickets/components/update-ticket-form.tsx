
"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Priority } from "@prisma/client";
import { useFormStatus } from "react-dom";
import { updateTicketAction } from "../actions/update-ticket";
import type { TicketUpdateActionState } from "../schemas/ticket.schema";
import type {
  SafeTicketDetails,
  TicketRelationOption,
} from "../types/ticket";
import { useActionToast } from "@/components/ui/action-toasts";
import {
  btnPrimary,
  btnSecondary,
  cardSurface,
  formControl,
  formLabel,
} from "@/components/ui/ui-classes";

const initialState: TicketUpdateActionState = {
  success: false,
  message: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={btnPrimary}>
      {pending ? "Saving…" : "Save changes"}
    </button>
  );
}

function formatLabel(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase().replaceAll("_", " ");
}

export function UpdateTicketForm({
  ticket,
  departments,
  categories,
}: {
  ticket: SafeTicketDetails;
  departments: TicketRelationOption[];
  categories: TicketRelationOption[];
}) {
  const action = updateTicketAction.bind(null, ticket.id);
  const [state, formAction] = useActionState(action, initialState);
  const router = useRouter();

  useActionToast(state, "Ticket updated successfully.");

  useEffect(() => {
    if (state.success) {
      router.push(`/tickets/${ticket.id}`);
      router.refresh();
    }
  }, [router, state, ticket.id]);

  function fieldError(
    name:
      | "title"
      | "description"
      | "priority"
      | "departmentId"
      | "categoryId",
  ) {
    return state.fieldErrors?.[name]?.[0];
  }

  return (
    <form action={formAction} className={`space-y-5 p-6 ${cardSurface}`}>
      <input
        type="hidden"
        name="expectedUpdatedAt"
        value={ticket.updatedAt.toISOString()}
      />

      <div>
        <label htmlFor="title" className={formLabel}>
          Title
        </label>
        <input
          id="title"
          name="title"
          required
          maxLength={200}
          defaultValue={ticket.title}
          aria-invalid={Boolean(fieldError("title"))}
          className={formControl}
        />
        {fieldError("title") && (
          <p className="mt-1 text-sm text-red-700">
            {fieldError("title")}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="description" className={formLabel}>
          Description
        </label>
        <textarea
          id="description"
          name="description"
          required
          maxLength={10000}
          rows={6}
          defaultValue={ticket.description}
          aria-invalid={Boolean(fieldError("description"))}
          className={formControl}
        />
        {fieldError("description") && (
          <p className="mt-1 text-sm text-red-700">
            {fieldError("description")}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="priority" className={formLabel}>
          Priority
        </label>
        <select
          id="priority"
          name="priority"
          defaultValue={ticket.priority}
          aria-invalid={Boolean(fieldError("priority"))}
          className={`${formControl} sm:max-w-xs`}
        >
          {Object.values(Priority).map((priority) => (
            <option key={priority} value={priority}>
              {formatLabel(priority)}
            </option>
          ))}
        </select>
        {fieldError("priority") && (
          <p className="mt-1 text-sm text-red-700">
            {fieldError("priority")}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="departmentId" className={formLabel}>
            Department
          </label>
          <select
            id="departmentId"
            name="departmentId"
            required
            defaultValue={ticket.department.id}
            aria-invalid={Boolean(fieldError("departmentId"))}
            className={formControl}
          >
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
          {fieldError("departmentId") && (
            <p className="mt-1 text-sm text-red-700">
              {fieldError("departmentId")}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="categoryId" className={formLabel}>
            Category
          </label>
          <select
            id="categoryId"
            name="categoryId"
            required
            defaultValue={ticket.category.id}
            aria-invalid={Boolean(fieldError("categoryId"))}
            className={formControl}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {fieldError("categoryId") && (
            <p className="mt-1 text-sm text-red-700">
              {fieldError("categoryId")}
            </p>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-500">
        The requester, status, assignee, SLA, and related timestamps are not
        editable here.
      </p>

      {state.message && !state.success && (
        <p
          role="alert"
          className="text-sm text-red-700"
        >
          {state.message}
        </p>
      )}

      <div className="flex gap-3">
        <SubmitButton />
        <Link
          href={`/tickets/${ticket.id}`}
          className={btnSecondary}
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
