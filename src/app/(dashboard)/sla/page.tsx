import { ManagementCreateDialog } from "@/components/ui/management-create-dialog";
import { PageShell } from "@/components/ui/page-shell";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import {
  AuthorizationError,
  requirePermission,
} from "@/lib/permissions";
import { SLATable } from "@/features/sla/components/sla-table";
import { listSLAPolicies } from "@/features/sla/repositories/sla.repository";

export const dynamic = "force-dynamic";

export default async function SLAPage() {
  await connection();

  try {
    await requirePermission("sla:manage");
  } catch (error) {
    if (error instanceof AuthorizationError) {
      redirect("/dashboard");
    }
    throw error;
  }

  const policies = await listSLAPolicies();

  return (
    <PageShell
      title="SLA Policies"
      description="Manage response and resolution targets."
      actions={<ManagementCreateDialog resource="sla" />}
    >
      <SLATable policies={policies} />
    </PageShell>
  );
}
