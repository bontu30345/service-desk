"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { createUserAction } from "../actions/create-user";
import type { UserActionState } from "../types/user";
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
      {pending ? "Creating user…" : "Create user"}
    </button>
  );
}

type CreateUserFormProps = {
  departments: { id: number; name: string }[];
  onSuccess?: () => void;
};

export function CreateUserForm({ departments, onSuccess }: CreateUserFormProps) {
  const [state, formAction] = useActionState(createUserAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  useActionToast(state, "User created successfully.");

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      onSuccess?.();
      router.refresh();
    }
  }, [onSuccess, router, state]);

  function fieldError(
    name: "name" | "email" | "password" | "role" | "departmentId",
  ) {
    return state.fieldErrors?.[name]?.[0];
  }

  return (
    <form
      ref={formRef}
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
        <label htmlFor="password" className={formLabel}>
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          maxLength={72}
          autoComplete="new-password"
          aria-invalid={Boolean(fieldError("password"))}
          aria-describedby={
            fieldError("password") ? "password-error" : undefined
          }
          className={formControl}
        />
        {fieldError("password") && (
          <p id="password-error" className="mt-1 text-sm text-red-700">
            {fieldError("password")}
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
          defaultValue="EMPLOYEE"
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
          defaultValue=""
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

      <div className="flex flex-col items-start gap-3 sm:col-span-2">
        {state.message && !state.success && (
          <p
            role={state.success ? "status" : "alert"}
            className={
              state.success ? "text-sm text-emerald-700" : "text-sm text-red-700"
            }
          >
            {state.message}
          </p>
        )}
        <div className="flex gap-3">
          <SubmitButton />
          {onSuccess && <button type="button" onClick={onSuccess} className={btnSecondary}>Cancel</button>}
        </div>
      </div>
    </form>
  );
}
