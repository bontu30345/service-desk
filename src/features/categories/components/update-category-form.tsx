"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { updateCategoryAction } from "../actions/update-category";
import type { CategoryActionState } from "../schemas/category.schema";
import type { Category } from "../types/category";
import { useActionToast } from "@/components/ui/action-toasts";

const initialState: CategoryActionState = {
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

export function UpdateCategoryForm({ category }: { category: Category }) {
  const action = updateCategoryAction.bind(null, category.id);
  const [state, formAction] = useActionState(action, initialState);
  const router = useRouter();
  useActionToast(state, "Category updated successfully.");

  useEffect(() => {
    if (state.success) {
      router.push("/categories");
      router.refresh();
    }
  }, [router, state]);

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-lg border bg-white p-6"
    >
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium">
          Category Name
        </label>
        <input
          id="name"
          name="name"
          required
          maxLength={100}
          defaultValue={category.name}
          aria-invalid={Boolean(state.fieldErrors?.name?.length)}
          aria-describedby={
            state.fieldErrors?.name?.length ? "category-name-error" : undefined
          }
          className="w-full rounded-md border px-3 py-2"
        />
        {state.fieldErrors?.name?.[0] && (
          <p id="category-name-error" className="mt-1 text-sm text-red-700">
            {state.fieldErrors.name[0]}
          </p>
        )}
      </div>
      <div>
        <label
          htmlFor="description"
          className="mb-1 block text-sm font-medium"
        >
          Description <span className="font-normal text-gray-500">(optional)</span>
        </label>
        <textarea
          id="description"
          name="description"
          maxLength={1000}
          rows={4}
          defaultValue={category.description ?? ""}
          aria-invalid={Boolean(state.fieldErrors?.description?.length)}
          aria-describedby={
            state.fieldErrors?.description?.length
              ? "category-description-error"
              : undefined
          }
          className="w-full rounded-md border px-3 py-2"
        />
        {state.fieldErrors?.description?.[0] && (
          <p
            id="category-description-error"
            className="mt-1 text-sm text-red-700"
          >
            {state.fieldErrors.description[0]}
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
          href="/categories"
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
