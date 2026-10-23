"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { updateDepartmentAction } from "../actions/update-department";
import type { Department } from "../types/department";
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
      {pending ? "Saving…" : "Save changes"}
    </button>
  );
}

export function UpdateDepartmentForm({
  department,
}: {
  department: Department;
}) {
  const action = updateDepartmentAction.bind(null, department.id);
  const [state, formAction] = useActionState(action, initialState);
  const router = useRouter();
  useActionToast(state, "Department updated successfully.");

  useEffect(() => {
    if (state.success) {
      router.push("/departments");
      router.refresh();
    }
  }, [router, state]);

  return (
    <form
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
          defaultValue={department.name}
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
        <p role="alert" className="text-sm text-red-700">
          {state.message}
        </p>
      )}
      <div className="flex gap-3">
        <SubmitButton />
        <Link
          href="/departments"
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
