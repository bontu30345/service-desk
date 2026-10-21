"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { resetPasswordAction } from "../actions/password-reset";
import type { PasswordResetActionState } from "../schemas/password-reset.schema";

const initialState: PasswordResetActionState = { message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-700/20 transition duration-200 hover:from-blue-600 hover:to-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-wait disabled:opacity-75"
    >
      {pending ? "Updating password…" : "Reset password"}
    </button>
  );
}

export function PasswordResetForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(resetPasswordAction, initialState);

  if (state.success) {
    return (
      <div className="mt-8 space-y-5">
        <p
          role="status"
          aria-live="polite"
          className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-5 text-blue-900"
        >
          {state.message}
        </p>
        <Link
          href="/login"
          className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-700 to-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-700/20 transition hover:from-blue-600 hover:to-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
        >
          Return to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <input type="hidden" name="token" value={token} />
      {state.message ? (
        <p
          id="reset-password-error"
          role="alert"
          aria-live="assertive"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-800"
        >
          {state.message}
        </p>
      ) : null}

      <div>
        <label
          htmlFor="password"
          className="mb-2 block text-sm font-semibold text-slate-800"
        >
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={72}
          required
          aria-describedby={state.message ? "reset-password-error" : undefined}
          className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/15"
          placeholder="At least 8 characters"
        />
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="mb-2 block text-sm font-semibold text-slate-800"
        >
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={72}
          required
          aria-describedby={state.message ? "reset-password-error" : undefined}
          className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/15"
          placeholder="Re-enter your new password"
        />
      </div>

      <SubmitButton />
    </form>
  );
}
