export default function DashboardLoading() {
  return (
    <main className="mx-auto w-full max-w-[1600px] space-y-7 p-4 sm:space-y-8 sm:p-6 lg:p-8" aria-busy="true">
      <div className="space-y-2">
        <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-80 animate-pulse rounded bg-slate-100" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-xl border border-slate-200 bg-white"
          />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="h-56 animate-pulse rounded-xl border border-slate-200 bg-white" />
        <div className="h-56 animate-pulse rounded-xl border border-slate-200 bg-white" />
      </div>
      <span className="sr-only">Loading dashboard…</span>
    </main>
  );
}
