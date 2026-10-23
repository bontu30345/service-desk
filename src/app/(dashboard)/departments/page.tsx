import { redirect } from "next/navigation";
import Link from "next/link";
import {
  AuthorizationError,
  requirePermission,
} from "@/lib/permissions";
import { DepartmentsTable } from "@/features/departments/components/departments-table";
import { listDepartments } from "@/features/departments/repositories/department.repository";
import { ManagementCreateDialog } from "@/components/ui/management-create-dialog";
import { PageShell } from "@/components/ui/page-shell";
import { btnSecondary, formControl, formLabel } from "@/components/ui/ui-classes";
import { DepartmentsPagination } from "@/features/departments/components/departments-pagination";
import { parseDepartmentListFilters } from "@/features/departments/schemas/department.schema";

type DepartmentsPageProps = {
  searchParams: Promise<{
    search?: string | string[];
    page?: string | string[];
  }>;
};

export default async function DepartmentsPage({
  searchParams,
}: DepartmentsPageProps) {
  try {
    await requirePermission("department:manage");
  } catch (error) {
    if (error instanceof AuthorizationError) {
      redirect("/dashboard");
    }

    throw error;
  }

  const filters = parseDepartmentListFilters(await searchParams);
  const departmentPage = await listDepartments(filters);
  const { departments, total, totalPages, page, pageSize } = departmentPage;
  const { search } = filters;

  return (
    <PageShell
      title="Departments"
      description="View departments in your service desk."
      actions={<ManagementCreateDialog resource="department" />}
    >
      <form
        action="/departments"
        method="get"
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <label htmlFor="search" className={formLabel}>
            Search Departments
          </label>
          <input
            id="search"
            name="search"
            type="search"
            maxLength={100}
            defaultValue={search ?? ""}
            placeholder="Search departments..."
            className={formControl}
          />
        </div>
        <button type="submit" className={btnSecondary}>
          Search
        </button>
        {search && (
          <Link href="/departments" className={`text-center ${btnSecondary}`}>
            Clear
          </Link>
        )}
      </form>
      <DepartmentsTable
        departments={departments}
        hasSearch={Boolean(search)}
      />
      <DepartmentsPagination
        search={search}
        page={page}
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
      />
    </PageShell>
  );
}
