import { requireAuthenticatedUser } from "@/lib/permissions";
import { NotificationPreferencesForm } from "@/features/settings/components/notification-preferences-form";
import { getUserNotificationPreferences } from "@/features/settings/repositories/settings.repository";

export default async function SettingsNotificationsPage() {
  const user = await requireAuthenticatedUser();
  const userId = Number(user.id);
  if (!Number.isSafeInteger(userId) || userId < 1) {
    throw new Error("The authenticated account could not be verified.");
  }

  const preferences = await getUserNotificationPreferences(userId);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-slate-900">Notification preferences</h2>
      <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">These choices are saved to your account. Notification generation does not yet consult them, and email delivery is not configured.</p>
      <NotificationPreferencesForm key={JSON.stringify(preferences)} preferences={preferences} />
    </section>
  );
}
