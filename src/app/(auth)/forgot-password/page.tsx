import Link from "next/link";
import type { Metadata } from "next";
import { PasswordResetRequestForm } from "@/features/auth/components/password-reset-request-form";

export const metadata: Metadata = {
  title: "Forgot password | Service Desk",
  description: "Request a password reset for your Service Desk account.",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 px-4 py-10 sm:px-6">
      <section
        aria-labelledby="forgot-password-heading"
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
            id="forgot-password-heading"
            className="mt-3 text-3xl font-bold tracking-tight text-slate-950"
          >
            Forgot your password?
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Enter your work email. If an active account matches and recovery
            email is configured, we’ll send instructions shortly.
          </p>
        </div>
        <PasswordResetRequestForm />
      </section>
    </main>
  );
}
