"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { createDepartmentAction } from "../actions/create-department";
import type { DepartmentActionState } from "../schemas/department.schema";
import { useActionToast } from "@/components/ui/action-toasts";

const initialState: DepartmentActionState = {
  success: false,
  message: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Creating…" : "Create Department"}
    </button>
  );
}

export function CreateDepartmentForm({ onSuccess }: { onSuccess?: () => void } = {}) {
  const [state, formAction] = useActionState(
    createDepartmentAction,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  useActionToast(state, "Department created successfully.");

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      if (onSuccess) onSuccess();
      else router.push("/departments");
      router.refresh();
    }
  }, [onSuccess, router, state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-4 rounded-lg border bg-white p-6"
    >
      <div>
        <label
          htmlFor="name"
          className="mb-1 block text-sm font-medium"
        >
          Department Name
        </label>
        <input
          id="name"
          name="name"
          required
          maxLength={100}
          autoComplete="organization"
          aria-invalid={Boolean(state.fieldErrors?.name?.length)}
          aria-describedby={
            state.fieldErrors?.name?.length ? "department-name-error" : undefined
          }
          className="w-full rounded-md border px-3 py-2"
        />
        {state.fieldErrors?.name?.[0] && (
          <p id="department-name-error" className="mt-1 text-sm text-red-700">
            {state.fieldErrors.name[0]}
          </p>
        )}
      </div>
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
        {onSuccess ? <button type="button" onClick={onSuccess} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-50">Cancel</button> : <button type="button" onClick={() => router.push("/departments")} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-50">Cancel</button>}
      </div>
    </form>
  );
}
