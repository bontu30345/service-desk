import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Service Desk - IT Support Made Simple",
  description: "Streamline IT issue submission, tracking, SLA enforcement, and team resolution.",
};

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-900 text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md transition-all duration-300">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 rounded-lg group"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-700 to-blue-500 text-lg font-bold text-white shadow-md shadow-blue-500/20 transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3">
              S
            </span>
            <span className="text-lg font-bold tracking-tight text-white">
              Service Desk
            </span>
          </Link>

          <nav aria-label="Landing page navigation" className="flex items-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-600/30 transition-all duration-200 hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 active:scale-95 hover:-translate-y-0.5"
            >
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-28">
          {/* Subtle background glow with slow pulse */}
          <div
            className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-b from-blue-600/20 via-blue-900/10 to-transparent blur-3xl animate-pulse duration-[4000ms]"
            aria-hidden="true"
          />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="animate-fade-in inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-950/50 px-3.5 py-1.5 text-xs font-medium text-blue-300 backdrop-blur-sm transition-transform hover:scale-105 duration-300">
                <span className="h-2 w-2 rounded-full bg-blue-400 animate-ping" />
                Enterprise IT Issue Tracking & Support Platform
              </div>

              {/* Headline with Typewriter + Moving Gradient Effect */}
              <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-6xl sm:leading-none flex justify-center">
                <span className="animate-typewriter">
                  IT Support Made Simple
                </span>
              </h1>

              <p className="animate-slide-up mt-6 text-lg text-slate-300 sm:text-xl sm:leading-relaxed delay-150">
                Submit requests, track resolution progress in real time, communicate seamlessly with support technicians, and meet Service Level Agreements effortlessly.
              </p>

              <div className="animate-slide-up mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row delay-300">
                <Link
                  href="/login"
                  className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-600/30 transition-all duration-300 hover:from-blue-500 hover:to-blue-400 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 active:scale-[0.98] sm:w-auto"
                >
                  <span className="absolute inset-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
                  Access Service Desk Portal
                  <svg
                    className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Workflow Overview */}
        <section className="border-t border-slate-800/80 bg-slate-950/60 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-blue-400">
                End-To-End Support Workflow
              </h2>
              <p className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                How tickets move from request to resolution
              </p>
            </div>

            <div className="mt-12 grid gap-8 sm:grid-cols-3 lg:gap-12">
              <div className="group rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-md transition-all duration-300 hover:-translate-y-1.5 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-900/50 text-xl font-bold text-blue-400 ring-1 ring-blue-500/30 transition-transform duration-300 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white">
                  1
                </div>
                <h3 className="mt-5 text-lg font-semibold text-white">
                  Submit IT Request
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  Employees log issues with details, department selection, and file attachments to initiate support.
                </p>
              </div>

              <div className="group rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-md transition-all duration-300 hover:-translate-y-1.5 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-900/50 text-xl font-bold text-blue-400 ring-1 ring-blue-500/30 transition-transform duration-300 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white">
                  2
                </div>
                <h3 className="mt-5 text-lg font-semibold text-white">
                  Triage & Assignment
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  Agents receive tickets, update priority, track SLA response timers, and collaborate via ticket comments.
                </p>
              </div>

              <div className="group rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-md transition-all duration-300 hover:-translate-y-1.5 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-900/50 text-xl font-bold text-blue-400 ring-1 ring-blue-500/30 transition-transform duration-300 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white">
                  3
                </div>
                <h3 className="mt-5 text-lg font-semibold text-white">
                  Resolution & Audit
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  Tickets are safely resolved and closed with full audit history, notifications, and reporting capabilities.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Built for Security, Clarity, and Efficiency
              </h2>
              <p className="mt-3 text-base text-slate-400">
                Comprehensive tools to keep your organization operating smoothly.
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="group rounded-2xl border border-slate-800 bg-slate-900/50 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/40 hover:bg-slate-900 hover:shadow-lg">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 transition-all duration-300 group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <h3 className="mt-4 font-semibold text-white">Role-Based Access</h3>
                <p className="mt-1.5 text-xs text-slate-400">
                  Strict boundaries for End Users, Agents, and Administrators.
                </p>
              </div>

              <div className="group rounded-2xl border border-slate-800 bg-slate-900/50 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/40 hover:bg-slate-900 hover:shadow-lg">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 transition-all duration-300 group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <h3 className="mt-4 font-semibold text-white">SLA Enforcement</h3>
                <p className="mt-1.5 text-xs text-slate-400">
                  Automatic resolution target tracking based on priority levels.
                </p>
              </div>

              <div className="group rounded-2xl border border-slate-800 bg-slate-900/50 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/40 hover:bg-slate-900 hover:shadow-lg">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 transition-all duration-300 group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
                  </svg>
                </div>
                <h3 className="mt-4 font-semibold text-white">Notifications & Audit</h3>
                <p className="mt-1.5 text-xs text-slate-400">
                  Stay updated on ticket state changes with detailed event history.
                </p>
              </div>

              <div className="group rounded-2xl border border-slate-800 bg-slate-900/50 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/40 hover:bg-slate-900 hover:shadow-lg">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 transition-all duration-300 group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 19V5M4 19h16" />
                    <path d="M8 15V9M12 15V5M16 15v-3" />
                  </svg>
                </div>
                <h3 className="mt-4 font-semibold text-white">Data Export</h3>
                <p className="mt-1.5 text-xs text-slate-400">
                  Filtered ticket statistics and CSV / PDF report export capabilities.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 py-16 text-center">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to resolve IT requests faster?
            </h2>
            <p className="mt-4 text-base text-slate-300">
              Log in with your organizational credentials to access the Service Desk workspace.
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-blue-600/30 transition-all duration-200 hover:bg-blue-500 hover:shadow-xl hover:-translate-y-0.5 active:scale-95"
              >
                Sign In to Portal
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 px-4 py-8 text-center text-xs text-slate-500 sm:px-6">
        <div className="mx-auto max-w-7xl flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p>© {new Date().getFullYear()} IT Service Desk Management System. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/login" className="transition-colors hover:text-slate-300">
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}