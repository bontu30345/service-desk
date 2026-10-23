import { redirect } from "next/navigation";
import { AuthorizationError, requireRole } from "@/lib/permissions";
import { WorkspaceSettingsForm } from "@/features/settings/components/workspace-settings-form";
import { getWorkspaceSettings } from "@/features/settings/repositories/settings.repository";

export default async function SettingsWorkspacePage() {
  try {
    await requireRole("ADMIN");
  } catch (error) {
    if (error instanceof AuthorizationError) redirect("/settings/profile");
    throw error;
  }

  const settings = await getWorkspaceSettings();

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Workspace settings</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">Manage shared defaults used across the Service Desk workspace.</p>
      </div>
      <WorkspaceSettingsForm key={JSON.stringify(settings)} settings={settings} />
      <p className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">These values are stored for the workspace. Default priority, automatic assignment, and brand color are not yet applied to ticket workflows or the current application theme.</p>
    </section>
  );
}
