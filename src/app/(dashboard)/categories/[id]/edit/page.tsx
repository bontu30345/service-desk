import { notFound, redirect } from "next/navigation";
import {
  AuthorizationError,
  requirePermission,
} from "@/lib/permissions";
import { UpdateCategoryForm } from "@/features/categories/components/update-category-form";
import { findCategoryById } from "@/features/categories/repositories/category.repository";
import { categoryIdSchema } from "@/features/categories/schemas/category.schema";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    await requirePermission("category:manage");
  } catch (error) {
    if (error instanceof AuthorizationError) {
      redirect("/dashboard");
    }

    throw error;
  }

  const { id } = await params;
  const idResult = categoryIdSchema.safeParse(id);
  if (!idResult.success) {
    notFound();
  }

  const category = await findCategoryById(idResult.data);
  if (!category) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 p-8">
      <header>
        <h1 className="text-2xl font-bold">Edit Category</h1>
        <p className="mt-1 text-sm text-gray-600">
          Update the category name or description.
        </p>
      </header>
      <UpdateCategoryForm category={category} />
    </main>
  );
}
