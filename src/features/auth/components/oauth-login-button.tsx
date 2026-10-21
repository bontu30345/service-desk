"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { oauthLoginAction } from "../actions/oauth-login";
import type { OAuthProvider } from "../oauth-identities";
import type { LoginActionState } from "../actions/login";

const initialState: LoginActionState = { message: "" };

function OAuthSubmit({
  provider,
}: {
  provider: OAuthProvider;
}) {
  const { pending } = useFormStatus();
  const label = provider === "google" ? "Google" : "GitHub";

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition duration-200 hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-wait disabled:opacity-70"
    >
      {pending ? (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700 motion-reduce:animate-none"
          aria-hidden="true"
        />
      ) : provider === "google" ? (
        <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" />
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 38.05 46.98 31.94 46.98 24.55Z" />
          <path fill="#FBBC05" d="M10.53 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.19a23.96 23.96 0 0 0 0 21.56l7.98-6.19Z" />
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.9 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" />
        </svg>
      ) : (
        <svg
          className="h-5 w-5 fill-current"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12 .7a11.3 11.3 0 0 0-3.58 22.02c.57.1.78-.25.78-.55v-2.1c-3.17.69-3.84-1.35-3.84-1.35-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.75 1.18 1.75 1.18 1.02 1.74 2.67 1.24 3.32.95.1-.74.4-1.24.72-1.52-2.53-.29-5.2-1.27-5.2-5.64 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.45.11-3.02 0 0 .96-.31 3.12 1.17a10.85 10.85 0 0 1 5.68 0c2.16-1.48 3.12-1.17 3.12-1.17.62 1.57.23 2.73.11 3.02.73.8 1.18 1.82 1.18 3.07 0 4.38-2.68 5.34-5.23 5.63.41.35.77 1.04.77 2.1v3.12c0 .3.21.66.79.55A11.3 11.3 0 0 0 12 .7Z" />
        </svg>
      )}
      {pending ? "Connecting…" : `Continue with ${label}`}
    </button>
  );
}

export function OAuthLoginButton({ provider }: { provider: OAuthProvider }) {
  const action = oauthLoginAction.bind(null, provider);
  const [state, formAction] = useActionState(action, initialState);

  return (
    <div>
      <form action={formAction}>
        <OAuthSubmit provider={provider} />
      </form>
      {state.message ? (
        <p
          className="mt-2 text-sm text-red-800"
          role="alert"
          aria-live="assertive"
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
