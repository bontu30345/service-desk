export default function TicketsReportLoading() {
  return (
    <main className="space-y-6 p-5 sm:p-8" aria-busy="true">
      <div className="h-8 w-56 animate-pulse rounded bg-gray-200" />
      <div className="h-36 animate-pulse rounded-lg border bg-gray-100" />
      <div className="h-72 animate-pulse rounded-lg border bg-gray-100" />
      <span className="sr-only">Loading tickets report…</span>
    </main>
  );
}
