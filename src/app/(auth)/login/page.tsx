import type { Metadata } from "next";
import { connection } from "next/server";
import { LoginForm } from "@/features/auth/components/login-form";
import { getConfiguredOAuthProviders } from "@/features/auth/oauth-config";

export const metadata: Metadata = {
  title: "Sign in | Service Desk",
  description: "Sign in to access your IT support requests and updates.",
};

function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-xl font-bold text-white shadow-lg shadow-blue-950/20 ${className}`}
      aria-hidden="true"
    >
      S
    </span>
  );
}

export default async function LoginPage() {
  await connection();
  const providers = getConfiguredOAuthProviders();

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 px-4 py-8 sm:px-6">
      <div
        className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-blue-200/40 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-48 -right-24 h-[30rem] w-[30rem] rounded-full bg-indigo-200/30 blur-3xl"
        aria-hidden="true"
      />

      <section
        aria-label="Service Desk sign in"
        className="animate-slide-up relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/80 bg-white shadow-2xl shadow-slate-900/10 md:min-h-[610px] md:grid-cols-2"
      >
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-10 text-white md:flex lg:p-12">
          <div
            className="pointer-events-none absolute -right-28 -top-28 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-36 -left-24 h-80 w-80 rounded-full bg-indigo-500/15 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative">
            <div className="flex items-center gap-3">
              <BrandMark />
              <span className="text-lg font-semibold tracking-tight">
                Service Desk
              </span>
            </div>

            <div className="mt-24 max-w-md">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-300">
                Your support, in one place
              </p>
              <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight lg:text-[2.75rem]">
                Welcome to a better support experience.
              </h1>
              <p className="mt-5 text-base leading-7 text-slate-300">
                Submit IT requests, follow progress, and stay connected with
                your support team from one secure workspace.
              </p>
            </div>
          </div>

          <div className="relative flex items-center gap-3 border-t border-white/10 pt-6 text-sm text-slate-300">
            <svg
              className="h-5 w-5 shrink-0 text-blue-300"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            Secure access for your organization
          </div>
        </aside>

        <div className="flex items-center justify-center px-6 py-10 sm:px-10 md:px-10 lg:px-14">
          <div className="w-full max-w-sm">
            <div className="mb-10 flex items-center gap-3 md:hidden">
              <BrandMark />
              <span className="text-lg font-semibold tracking-tight text-slate-900">
                Service Desk
              </span>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-700">
                Secure service portal
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                Welcome back
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Sign in to access your IT support requests, updates, and
                service desk tools.
              </p>
            </div>

            <LoginForm providers={providers} />

            <p className="mt-8 text-center text-xs leading-5 text-slate-500">
              Access is limited to authorized team members.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
