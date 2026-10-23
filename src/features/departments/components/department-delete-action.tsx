"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { useActionToast } from "@/components/ui/action-toasts";
import { deleteDepartmentAction } from "../actions/delete-department";
import type { DepartmentDeleteState } from "../schemas/department.schema";

const initialState: DepartmentDeleteState = { success: false, message: "" };

function DeleteButton({ name }: { name: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm(`Delete the department "${name}"?`)) {
          event.preventDefault();
        }
      }}
      className="font-medium text-red-700 hover:underline disabled:opacity-50"
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}

export function DepartmentDeleteAction({
  departmentId,
  name,
}: {
  departmentId: number;
  name: string;
}) {
  const [state, formAction] = useActionState(deleteDepartmentAction, initialState);
  const router = useRouter();
  useActionToast(state, "Department deleted successfully.");

  useEffect(() => {
    if (state.success) router.refresh();
  }, [router, state]);

  return (
    <form action={formAction} className="inline-flex flex-col items-start gap-1">
      <input type="hidden" name="departmentId" value={departmentId} />
      <DeleteButton name={name} />
      {state.message && !state.success && (
        <span role="alert" className="max-w-64 text-xs text-red-700">
          {state.message}
        </span>
      )}
    </form>
  );
}
