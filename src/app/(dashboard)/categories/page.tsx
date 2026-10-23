import { ManagementCreateDialog } from "@/components/ui/management-create-dialog";
import { PageShell } from "@/components/ui/page-shell";
import { redirect } from "next/navigation";
import {
  AuthorizationError,
  requirePermission,
} from "@/lib/permissions";
import { CategoriesFilters } from "@/features/categories/components/categories-filters";
import { CategoriesPagination } from "@/features/categories/components/categories-pagination";
import { CategoriesTable } from "@/features/categories/components/categories-table";
import { listCategories } from "@/features/categories/repositories/category.repository";
import { parseCategoryListFilters } from "@/features/categories/schemas/category.schema";

type CategoriesPageProps = {
  searchParams: Promise<{
    search?: string | string[];
    page?: string | string[];
  }>;
};

export default async function CategoriesPage({
  searchParams,
}: CategoriesPageProps) {
  try {
    await requirePermission("category:manage");
  } catch (error) {
    if (error instanceof AuthorizationError) {
      redirect("/dashboard");
    }

    throw error;
  }

  const filters = parseCategoryListFilters(await searchParams);
  const categoryPage = await listCategories(filters);
  const {
    categories,
    totalCount,
    totalAvailable,
    totalPages,
    page,
    pageSize,
  } = categoryPage;

  return (
    <PageShell
      title="Categories"
      description="Manage ticket categories in your service desk."
      actions={<ManagementCreateDialog resource="category" />}
    >
      <CategoriesFilters search={filters.search} />
      <CategoriesTable
        categories={categories}
        hasSearch={Boolean(filters.search)}
        hasCategories={totalAvailable > 0}
      />
      <CategoriesPagination
        search={filters.search}
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
        totalPages={totalPages}
      />
    </PageShell>
  );
}
