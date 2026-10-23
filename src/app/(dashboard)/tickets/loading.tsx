export default function TicketsLoading() {
  return (
    <main className="mx-auto w-full max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8" aria-busy="true">
      <div className="space-y-2">
        <div className="h-8 w-40 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-72 animate-pulse rounded bg-slate-100" />
      </div>
      <div className="h-64 animate-pulse rounded-xl border border-slate-200 bg-white" />
      <span className="sr-only">Loading tickets…</span>
    </main>
  );
}
