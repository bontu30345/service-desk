export default function AuditLogsLoading() {
  return (
    <main className="space-y-6 p-5 sm:p-8" aria-busy="true">
      <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
      <div className="h-24 animate-pulse rounded-lg bg-gray-100" />
      <div className="h-72 animate-pulse rounded-lg bg-gray-100" />
      <span className="sr-only">Loading audit logs…</span>
    </main>
  );
}
