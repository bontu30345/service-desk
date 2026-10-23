"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { updateUserAction } from "../actions/update-user";
import type { SafeUser, UserActionState } from "../types/user";
import { useActionToast } from "@/components/ui/action-toasts";
import {
  btnPrimary,
  btnSecondary,
  cardSurface,
  formControl,
  formLabel,
} from "@/components/ui/ui-classes";

const initialState: UserActionState = {
  success: false,
  message: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={btnPrimary}
    >
      {pending ? "Saving changes…" : "Save changes"}
    </button>
  );
}

type UpdateUserFormProps = {
  user: SafeUser;
  departments: { id: number; name: string }[];
};

export function UpdateUserForm({
  user,
  departments,
}: UpdateUserFormProps) {
  const updateAction = updateUserAction.bind(null, user.id);
  const [state, formAction] = useActionState(updateAction, initialState);
  const router = useRouter();
  useActionToast(state, "User updated successfully.");

  useEffect(() => {
    if (state.success) {
      router.push("/users");
      router.refresh();
    }
  }, [router, state]);

  function fieldError(name: "name" | "email" | "role" | "departmentId") {
    return state.fieldErrors?.[name]?.[0];
  }

  return (
    <form
      action={formAction}
      className={`grid gap-5 p-6 sm:grid-cols-2 ${cardSurface}`}
    >
      <div>
        <label htmlFor="name" className={formLabel}>
          Name
        </label>
        <input
          id="name"
          name="name"
          required
          minLength={2}
          maxLength={100}
          defaultValue={user.name}
          autoComplete="name"
          aria-invalid={Boolean(fieldError("name"))}
          aria-describedby={fieldError("name") ? "name-error" : undefined}
          className={formControl}
        />
        {fieldError("name") && (
          <p id="name-error" className="mt-1 text-sm text-red-700">
            {fieldError("name")}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="email" className={formLabel}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          defaultValue={user.email}
          autoComplete="email"
          aria-invalid={Boolean(fieldError("email"))}
          aria-describedby={fieldError("email") ? "email-error" : undefined}
          className={formControl}
        />
        {fieldError("email") && (
          <p id="email-error" className="mt-1 text-sm text-red-700">
            {fieldError("email")}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="role" className={formLabel}>
          Role
        </label>
        <select
          id="role"
          name="role"
          defaultValue={user.role}
          aria-invalid={Boolean(fieldError("role"))}
          className={formControl}
        >
          <option value="EMPLOYEE">Employee</option>
          <option value="AGENT">Agent</option>
          <option value="ADMIN">Admin</option>
        </select>
        {fieldError("role") && (
          <p className="mt-1 text-sm text-red-700">{fieldError("role")}</p>
        )}
      </div>

      <div>
        <label htmlFor="departmentId" className={formLabel}>
          Department
        </label>
        <select
          id="departmentId"
          name="departmentId"
          defaultValue={user.departmentId ?? ""}
          aria-invalid={Boolean(fieldError("departmentId"))}
          className={formControl}
        >
          <option value="">No department</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
        </select>
        {departments.length === 0 && (
          <p className="mt-1 text-sm text-slate-600">
            No departments are available.
          </p>
        )}
        {fieldError("departmentId") && (
          <p className="mt-1 text-sm text-red-700">
            {fieldError("departmentId")}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        {state.message && !state.success && (
          <p role="alert" className="w-full text-sm text-red-700">
            {state.message}
          </p>
        )}
        <SubmitButton />
        <Link
          href="/users"
          className={btnSecondary}
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
