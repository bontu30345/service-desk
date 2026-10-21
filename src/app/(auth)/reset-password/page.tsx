import Link from "next/link";
import type { Metadata } from "next";
import { PasswordResetForm } from "@/features/auth/components/password-reset-form";

export const metadata: Metadata = {
  title: "Reset password | Service Desk",
  description: "Choose a new password for your Service Desk account.",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string | string[] }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";

  return (
    <main
      className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 px-4 py-10 sm:px-6"
    >
      <section
        aria-labelledby="reset-password-heading"
        className="animate-slide-up w-full max-w-lg rounded-3xl border border-white/80 bg-white p-7 shadow-2xl shadow-slate-900/10 sm:p-10"
      >
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded text-sm font-semibold text-blue-700 transition-colors hover:text-blue-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
        >
          <span aria-hidden="true">←</span>
          Back to sign in
        </Link>
        <div className="mt-8">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-700">
            Account recovery
          </p>
          <h1
            id="reset-password-heading"
            className="mt-3 text-3xl font-bold tracking-tight text-slate-950"
          >
            Choose a new password
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Choose a password you haven’t used before. Reset links expire after
            30 minutes and can only be used once.
          </p>
        </div>
        {token ? (
          <PasswordResetForm token={token} />
        ) : (
          <div className="mt-8 space-y-5">
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-800">
              This reset link is invalid or expired. Request a new link.
            </p>
            <Link
              href="/forgot-password"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-700 to-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-700/20 transition hover:from-blue-600 hover:to-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
            >
              Request a new reset link
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
