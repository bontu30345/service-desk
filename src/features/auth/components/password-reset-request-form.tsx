"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { requestPasswordResetAction } from "../actions/password-reset";
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
      {pending ? "Requesting reset…" : "Send reset instructions"}
    </button>
  );
}

export function PasswordResetRequestForm() {
  const [state, formAction] = useActionState(
    requestPasswordResetAction,
    initialState,
  );

  return (
    <form action={formAction} className="mt-8 space-y-5">
      {state.message ? (
        <p
          id="reset-request-message"
          role={state.success ? "status" : "alert"}
          aria-live="polite"
          className={`rounded-xl border px-4 py-3 text-sm leading-5 ${
            state.success
              ? "border-blue-200 bg-blue-50 text-blue-900"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-sm font-semibold text-slate-800"
        >
          Work email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          aria-describedby={state.message ? "reset-request-message" : undefined}
          className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/15"
          placeholder="you@company.com"
        />
      </div>

      <SubmitButton />
    </form>
  );
}
