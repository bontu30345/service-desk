"use client";

export default function AuditLogsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="p-8" role="alert">
      <h1 className="text-xl font-semibold text-gray-900">
        Unable to load audit logs
      </h1>
      <p className="mt-2 text-sm text-gray-600">
        Please try again. If the problem continues, contact an administrator.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
      >
        Try again
      </button>
    </main>
  );
}
