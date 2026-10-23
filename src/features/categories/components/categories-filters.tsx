import Link from "next/link";

export function CategoriesFilters({ search }: { search?: string }) {
  return (
    <form
      action="/categories"
      method="get"
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
    >
      <div className="flex-1">
        <label htmlFor="search" className="mb-1 block text-sm font-medium">
          Search Categories
        </label>
        <input
          id="search"
          name="search"
          type="search"
          maxLength={100}
          defaultValue={search ?? ""}
          placeholder="Search by name or description..."
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600"
        />
      </div>
      <button
        type="submit"
        className="min-h-10 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        Search
      </button>
      {search && (
        <Link
          href="/categories"
          className="rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          Clear
        </Link>
      )}
    </form>
  );
}
