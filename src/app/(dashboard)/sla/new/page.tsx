import { redirect } from "next/navigation";
import { connection } from "next/server";
import {
  AuthorizationError,
  requirePermission,
} from "@/lib/permissions";
import { CreateSLAPolicyForm } from "@/features/sla/components/create-sla-policy-form";

export const dynamic = "force-dynamic";

export default async function NewSLAPolicyPage() {
  await connection();

  try {
    await requirePermission("sla:manage");
  } catch (error) {
    if (error instanceof AuthorizationError) {
      redirect("/dashboard");
    }
    throw error;
  }

  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 p-8">
      <header>
        <h1 className="text-2xl font-bold">Create SLA Policy</h1>
        <p className="mt-1 text-sm text-gray-600">
          Define response and resolution targets for service desk work.
        </p>
      </header>
      <CreateSLAPolicyForm />
    </main>
  );
}
