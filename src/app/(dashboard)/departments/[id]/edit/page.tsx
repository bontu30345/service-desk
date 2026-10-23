import { notFound, redirect } from "next/navigation";
import {
  AuthorizationError,
  requirePermission,
} from "@/lib/permissions";
import { UpdateDepartmentForm } from "@/features/departments/components/update-department-form";
import { findDepartmentById } from "@/features/departments/repositories/department.repository";

export default async function EditDepartmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    await requirePermission("department:manage");
  } catch (error) {
    if (error instanceof AuthorizationError) {
      redirect("/dashboard");
    }

    throw error;
  }

  const { id } = await params;
  const departmentId = Number(id);

  if (!Number.isSafeInteger(departmentId) || departmentId < 1) {
    notFound();
  }

  const department = await findDepartmentById(departmentId);

  if (!department) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 p-8">
      <header>
        <h1 className="text-2xl font-bold">Edit Department</h1>
        <p className="mt-1 text-sm text-gray-600">
          Change the department name.
        </p>
      </header>
      <UpdateDepartmentForm department={department} />
    </main>
  );
}
