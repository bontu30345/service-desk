import { notFound, redirect } from "next/navigation";
import {
  AuthorizationError,
  requirePermission,
} from "@/lib/permissions";
import { UpdateUserForm } from "@/features/users/components/update-user-form";
import {
  findUserById,
  listUserDepartments,
} from "@/features/users/repositories/user.repository";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    await requirePermission("user:manage");
  } catch (error) {
    if (error instanceof AuthorizationError) {
      redirect("/dashboard");
    }

    throw error;
  }

  const { id } = await params;
  const userId = Number(id);

  if (!Number.isSafeInteger(userId) || userId < 1) {
    notFound();
  }

  const [user, departments] = await Promise.all([
    findUserById(userId),
    listUserDepartments(),
  ]);

  if (!user) {
    notFound();
  }

  return (
    <main className="space-y-6 p-8">
      <header>
        <h1 className="text-2xl font-bold">Edit user</h1>
        <p className="mt-1 text-sm text-gray-600">
          Update this user&apos;s profile, role, and department.
        </p>
      </header>
      <UpdateUserForm user={user} departments={departments} />
    </main>
  );
}
