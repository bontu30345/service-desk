"use client";

export default function CategoriesError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="space-y-4 p-8">
      <h1 className="text-2xl font-bold">Categories</h1>
      <p role="alert" className="text-sm text-red-700">
        Categories could not be loaded. Please try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50"
      >
        Try again
      </button>
    </main>
  );
}
