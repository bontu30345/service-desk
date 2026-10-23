export default function DepartmentsLoading() {
  return (
    <main className="space-y-6 p-8" aria-busy="true">
      <div className="space-y-2">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-64 animate-pulse rounded bg-gray-100" />
      </div>
      <div className="h-64 animate-pulse rounded-lg border bg-gray-100" />
      <span className="sr-only">Loading departments…</span>
    </main>
  );
}
