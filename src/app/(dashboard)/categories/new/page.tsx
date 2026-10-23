import { redirect } from "next/navigation";
import {
  AuthorizationError,
  requirePermission,
} from "@/lib/permissions";
import { CreateCategoryForm } from "@/features/categories/components/create-category-form";

export default async function NewCategoryPage() {
  try {
    await requirePermission("category:manage");
  } catch (error) {
    if (error instanceof AuthorizationError) {
      redirect("/dashboard");
    }

    throw error;
  }

  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 p-8">
      <header>
        <h1 className="text-2xl font-bold">Create Category</h1>
        <p className="mt-1 text-sm text-gray-600">
          Add a category for organizing service desk tickets.
        </p>
      </header>
      <CreateCategoryForm />
    </main>
  );
}
