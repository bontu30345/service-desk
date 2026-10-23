import { redirect } from "next/navigation";
import {
  AuthorizationError,
  requirePermission,
} from "@/lib/permissions";
import { UsersTable } from "@/features/users/components/users-table";
import { ManagementCreateDialog } from "@/components/ui/management-create-dialog";
import { PageShell } from "@/components/ui/page-shell";
import { btnSecondary, formControl, formLabel } from "@/components/ui/ui-classes";
import Link from "next/link";
import { UsersPagination } from "@/features/users/components/users-pagination";
import {
  listUserDepartments,
  listUsers,
} from "@/features/users/repositories/user.repository";
import { parseUserListFilters } from "@/features/users/schemas/user.schema";

type UsersPageProps = {
  searchParams: Promise<{
    search?: string | string[];
    role?: string | string[];
    departmentId?: string | string[];
    status?: string | string[];
    page?: string | string[];
  }>;
};

export default async function UsersPage({ searchParams }: UsersPageProps) {
  try {
    await requirePermission("user:manage");
  } catch (error) {
    if (error instanceof AuthorizationError) {
      redirect("/dashboard");
    }

    throw error;
  }

  const filters = parseUserListFilters(await searchParams);
  const [userPage, departments] = await Promise.all([
    listUsers(filters),
    listUserDepartments(),
  ]);
  const { users, totalCount, totalPages, page, pageSize } = userPage;
  const hasFilters = Boolean(
    filters.search ||
      filters.role ||
      filters.departmentId !== undefined ||
      filters.status ||
      page > 1,
  );

  return (
    <PageShell
      title="Users"
      description="Manage and review users in your service desk."
      actions={<ManagementCreateDialog resource="user" departments={departments} />}
    >
      <form
        action="/users"
        method="get"
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <label htmlFor="search" className={formLabel}>
            Search users
          </label>
          <input
            id="search"
            name="search"
            type="search"
            maxLength={100}
            defaultValue={filters.search ?? ""}
            placeholder="Search by name or email..."
            className={formControl}
          />
        </div>
        <div>
          <label htmlFor="role" className={formLabel}>
            Role
          </label>
          <select
            id="role"
            name="role"
            defaultValue={filters.role ?? ""}
            className={`${formControl} sm:w-44`}
          >
            <option value="">All Roles</option>
            <option value="EMPLOYEE">EMPLOYEE</option>
            <option value="AGENT">AGENT</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>
        <div>
          <label htmlFor="departmentId" className={formLabel}>
            Department
          </label>
          <select
            id="departmentId"
            name="departmentId"
            defaultValue={filters.departmentId?.toString() ?? ""}
            className={`${formControl} sm:w-52`}
          >
            <option value="">All Departments</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="status" className={formLabel}>
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={filters.status ?? ""}
            className={`${formControl} sm:w-40`}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <button type="submit" className={btnSecondary}>
          Apply
        </button>
        {hasFilters && (
          <Link href="/users" className={`text-center ${btnSecondary}`}>
            Clear filters
          </Link>
        )}
      </form>
      <UsersTable
        users={users}
        hasFilters={Boolean(
          filters.search ||
            filters.role ||
            filters.departmentId !== undefined ||
            filters.status,
        )}
      />
      <UsersPagination
        filters={filters}
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
        totalPages={totalPages}
      />
    </PageShell>
  );
}
