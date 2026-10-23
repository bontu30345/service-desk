import { redirect } from "next/navigation";
import {
  AuthorizationError,
  requirePermission,
} from "@/lib/permissions";
import { CreateDepartmentForm } from "@/features/departments/components/create-department-form";

export default async function NewDepartmentPage() {
  try {
    await requirePermission("department:manage");
  } catch (error) {
    if (error instanceof AuthorizationError) {
      redirect("/dashboard");
    }

    throw error;
  }

  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 p-8">
      <header>
        <h1 className="text-2xl font-bold">Create Department</h1>
        <p className="mt-1 text-sm text-gray-600">
          Add a department to your service desk.
        </p>
      </header>
      <CreateDepartmentForm />
    </main>
  );
}
