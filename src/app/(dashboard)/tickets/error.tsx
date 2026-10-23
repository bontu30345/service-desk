"use client";

export default function TicketsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto w-full max-w-[1600px] space-y-4 p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold tracking-tight text-slate-950">Tickets</h1>
      <p role="alert" className="text-sm text-red-700">
        Tickets could not be loaded. Please try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        Try again
      </button>
    </main>
  );
}
