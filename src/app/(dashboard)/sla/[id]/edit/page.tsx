import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import {
  AuthorizationError,
  requirePermission,
} from "@/lib/permissions";
import { UpdateSLAPolicyForm } from "@/features/sla/components/update-sla-policy-form";
import { findSLAPolicyById } from "@/features/sla/repositories/sla.repository";
import { slaIdSchema } from "@/features/sla/schemas/sla.schema";

export const dynamic = "force-dynamic";

export default async function EditSLAPolicyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();

  try {
    await requirePermission("sla:manage");
  } catch (error) {
    if (error instanceof AuthorizationError) {
      redirect("/dashboard");
    }
    throw error;
  }

  const idResult = slaIdSchema.safeParse((await params).id);
  if (!idResult.success) {
    notFound();
  }

  const policy = await findSLAPolicyById(idResult.data);
  if (!policy) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 p-8">
      <header>
        <h1 className="text-2xl font-bold">Edit SLA Policy</h1>
        <p className="mt-1 text-sm text-gray-600">
          Update this policy&apos;s response and resolution targets.
        </p>
      </header>
      <UpdateSLAPolicyForm policy={policy} />
    </main>
  );
}
