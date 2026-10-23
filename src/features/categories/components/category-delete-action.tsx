"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { deleteCategoryAction } from "../actions/delete-category";
import type { CategoryDeleteState } from "../schemas/category.schema";
import { useActionToast } from "@/components/ui/action-toasts";

const initialState: CategoryDeleteState = {
  success: false,
  message: "",
};

function DeleteButton({ name }: { name: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm(`Delete the category "${name}"?`)) {
          event.preventDefault();
        }
      }}
      className="font-medium text-red-700 hover:underline disabled:opacity-50"
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}

export function CategoryDeleteAction({
  categoryId,
  name,
}: {
  categoryId: number;
  name: string;
}) {
  const [state, formAction] = useActionState(deleteCategoryAction, initialState);
  const router = useRouter();
  useActionToast(state, "Category deleted successfully.");

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [router, state]);

  return (
    <form action={formAction} className="inline-flex flex-col items-start gap-1">
      <input type="hidden" name="categoryId" value={categoryId} />
      <DeleteButton name={name} />
      {state.message && !state.success && (
        <span
          role={state.success ? "status" : "alert"}
          className={`max-w-64 text-xs ${
            state.success ? "text-green-700" : "text-red-700"
          }`}
        >
          {state.message}
        </span>
      )}
    </form>
  );
}
