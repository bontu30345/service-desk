"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { Priority } from "@prisma/client";
import { createTicketAction } from "../actions/create-ticket";
import type { TicketCreateActionState } from "../schemas/ticket.schema";
import type { TicketRelationOption } from "../types/ticket";
import { useActionToast } from "@/components/ui/action-toasts";

const initialState: TicketCreateActionState = {
  success: false,
  message: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition-all duration-200 hover:bg-blue-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
    >
      {pending && (
        <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {pending ? "Creating ticket…" : "Create Ticket"}
    </button>
  );
}

function priorityLabel(priority: Priority) {
  return priority.charAt(0) + priority.slice(1).toLowerCase();
}

export function CreateTicketForm({
  departments,
  categories,
}: {
  departments: TicketRelationOption[];
  categories: TicketRelationOption[];
}) {
  const [state, formAction] = useActionState(createTicketAction, initialState);
  const router = useRouter();
  useActionToast(state, "Ticket created successfully.");

  useEffect(() => {
    if (state.success && state.ticketId) {
      router.push(`/tickets/${state.ticketId}`);
      router.refresh();
    }
  }, [router, state]);

  function fieldError(
    name: "title" | "description" | "priority" | "departmentId" | "categoryId",
  ) {
    return state.fieldErrors?.[name]?.[0];
  }

  return (
    <form action={formAction} className="space-y-5 rounded-xl border border-slate-200/80 bg-white p-6 shadow-xs animate-fade-in sm:p-8">
      <div>
        <label htmlFor="title" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
          Title
        </label>
        <input
          id="title"
          name="title"
          required
          maxLength={200}
          placeholder="Brief summary of the issue..."
          aria-invalid={Boolean(fieldError("title"))}
          aria-describedby={fieldError("title") ? "ticket-title-error" : undefined}
          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        {fieldError("title") && (
          <p id="ticket-title-error" className="mt-1 text-sm font-medium text-red-600">
            {fieldError("title")}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          required
          maxLength={10000}
          rows={6}
          placeholder="Provide detailed instructions, steps to reproduce, or context..."
          aria-invalid={Boolean(fieldError("description"))}
          aria-describedby={
            fieldError("description") ? "ticket-description-error" : undefined
          }
          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        {fieldError("description") && (
          <p
            id="ticket-description-error"
            className="mt-1 text-sm font-medium text-red-600"
          >
            {fieldError("description")}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="departmentId"
            className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700"
          >
            Department
          </label>
          <select
            id="departmentId"
            name="departmentId"
            required
            defaultValue=""
            aria-invalid={Boolean(fieldError("departmentId"))}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="" disabled>
              Select a department
            </option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
          {departments.length === 0 && (
            <p className="mt-1 text-sm text-slate-500">
              No departments are available. Contact an administrator.
            </p>
          )}
          {fieldError("departmentId") && (
            <p className="mt-1 text-sm font-medium text-red-600">
              {fieldError("departmentId")}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="categoryId" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
            Category
          </label>
          <select
            id="categoryId"
            name="categoryId"
            required
            defaultValue=""
            aria-invalid={Boolean(fieldError("categoryId"))}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="" disabled>
              Select a category
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {categories.length === 0 && (
            <p className="mt-1 text-sm text-slate-500">
              No categories are available. Contact an administrator.
            </p>
          )}
          {fieldError("categoryId") && (
            <p className="mt-1 text-sm font-medium text-red-600">
              {fieldError("categoryId")}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="priority" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
          Priority
        </label>
        <select
          id="priority"
          name="priority"
          defaultValue={Priority.MEDIUM}
          aria-invalid={Boolean(fieldError("priority"))}
          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 sm:max-w-xs"
        >
          {Object.values(Priority).map((priority) => (
            <option key={priority} value={priority}>
              {priorityLabel(priority)}
            </option>
          ))}
        </select>
        {fieldError("priority") && (
          <p className="mt-1 text-sm font-medium text-red-600">
            {fieldError("priority")}
          </p>
        )}
      </div>

      <section aria-labelledby="ticket-attachments-heading" className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 sm:p-5">
        <h2 id="ticket-attachments-heading" className="text-sm font-semibold text-slate-900">Attachments</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          After the ticket is created, you can add logs or screenshots from its details page. Supported files: PDF, PNG, JPG, JPEG, or TXT, up to 5 MiB each.
        </p>
      </section>

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
      <div className="flex gap-3 pt-2">
        <SubmitButton />
        <Link
          href="/tickets"
          className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-xs transition-all duration-200 hover:bg-slate-50 active:scale-95"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
