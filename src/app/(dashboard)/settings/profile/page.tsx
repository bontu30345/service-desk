import { redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/lib/permissions";
import { ProfileSettingsForm } from "@/features/settings/components/profile-settings-form";
import { getProfilePhotoPresentation } from "@/features/settings/repositories/settings.repository";

export default async function SettingsProfilePage() {
  const user = await requireAuthenticatedUser();
  if (!user.id || !user.role) redirect("/login");
  const userId = Number(user.id);
  if (!Number.isSafeInteger(userId) || userId < 1) redirect("/login");
  const photo = await getProfilePhotoPresentation(userId);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Profile information</h2>
        <p className="mt-1 text-sm text-slate-600">Update the name associated with your Service Desk account.</p>
      </div>
      <ProfileSettingsForm
        userId={userId}
        name={user.name ?? ""}
        email={user.email ?? ""}
        role={user.role}
        photoVersion={photo?.version ?? 0}
        hasPhoto={photo?.hasPhoto ?? false}
      />
    </section>
  );
}
