import Link from "next/link";
import type { TicketListFilters, TicketQueue } from "../types/ticket";

type TicketsPaginationProps = {
  filters: TicketListFilters;
  queue: TicketQueue;
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

type PageItem = number | "left-ellipsis" | "right-ellipsis";

function getPageItems(page: number, totalPages: number): PageItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  if (page <= 4) {
    return [1, 2, 3, 4, 5, "right-ellipsis", totalPages];
  }
  if (page >= totalPages - 3) {
    return [
      1,
      "left-ellipsis",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }
  return [
    1,
    "left-ellipsis",
    page - 1,
    page,
    page + 1,
    "right-ellipsis",
    totalPages,
  ];
}

function pageHref(filters: TicketListFilters, queue: TicketQueue, page: number) {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.status) params.set("status", filters.status);
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.departmentId) {
    params.set("departmentId", String(filters.departmentId));
  }
  if (filters.categoryId) {
    params.set("categoryId", String(filters.categoryId));
  }
  if (filters.assigneeId) {
    params.set("assigneeId", String(filters.assigneeId));
  }
  if (queue === "assigned") params.set("queue", queue);
  params.set("page", String(page));
  return `/tickets?${params.toString()}`;
}

const pageLinkClass =
  "inline-flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";

export function TicketsPagination({
  filters,
  queue,
  page,
  pageSize,
  totalCount,
  totalPages,
}: TicketsPaginationProps) {
  if (totalCount === 0) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalCount);

  return (
    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm tabular-nums text-slate-600">
        Showing {start}–{end} of {totalCount} tickets
      </p>
      {totalPages > 1 && (
        <nav
          aria-label="Tickets pagination"
          className="flex max-w-full flex-nowrap items-center gap-1 overflow-x-auto pb-1 sm:gap-2"
        >
          {page > 1 ? (
            <Link href={pageHref(filters, queue, page - 1)} className={pageLinkClass}>
              Previous
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className={`${pageLinkClass} cursor-not-allowed opacity-50`}
            >
              Previous
            </span>
          )}
          {getPageItems(page, totalPages).map((item) =>
            typeof item === "number" ? (
              <Link
                key={item}
                href={pageHref(filters, queue, item)}
                aria-current={item === page ? "page" : undefined}
                aria-label={`Page ${item}`}
                className={`${pageLinkClass} ${
                  item === page
                    ? "border-blue-700 bg-blue-700 text-white hover:bg-blue-800"
                    : ""
                }`}
              >
                {item}
              </Link>
            ) : (
              <span
                key={item}
                aria-hidden="true"
                className="shrink-0 px-1 text-slate-500"
              >
                …
              </span>
            ),
          )}
          {page < totalPages ? (
            <Link href={pageHref(filters, queue, page + 1)} className={pageLinkClass}>
              Next
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className={`${pageLinkClass} cursor-not-allowed opacity-50`}
            >
              Next
            </span>
          )}
        </nav>
      )}
    </div>
  );
}
