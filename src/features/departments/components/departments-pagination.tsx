import Link from "next/link";
import {
  paginationNavLink,
  paginationNavLinkActive,
  paginationSummary,
} from "@/components/ui/ui-classes";

type DepartmentsPaginationProps = {
  search?: string;
  page: number;
  pageSize: number;
  total: number;
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

function pageHref(search: string | undefined, page: number) {
  const params = new URLSearchParams();

  if (search) {
    params.set("search", search);
  }

  params.set("page", String(page));
  return `/departments?${params.toString()}`;
}

const pageLinkClass = paginationNavLink;

export function DepartmentsPagination({
  search,
  page,
  pageSize,
  total,
  totalPages,
}: DepartmentsPaginationProps) {
  if (total === 0) {
    return null;
  }

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <p className={paginationSummary}>
        Showing {start}–{end} of {total} departments
      </p>
      {totalPages > 1 && (
        <nav
          aria-label="Departments pagination"
          className="flex flex-wrap items-center gap-2"
        >
          {page > 1 ? (
            <Link
              href={pageHref(search, page - 1)}
              className={pageLinkClass}
            >
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
                href={pageHref(search, item)}
                aria-current={item === page ? "page" : undefined}
                aria-label={`Page ${item}`}
                className={`${pageLinkClass} ${
                  item === page ? paginationNavLinkActive : ""
                }`}
              >
                {item}
              </Link>
            ) : (
              <span
                key={item}
                aria-hidden="true"
                className="px-1 text-gray-500"
              >
                …
              </span>
            ),
          )}

          {page < totalPages ? (
            <Link href={pageHref(search, page + 1)} className={pageLinkClass}>
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
