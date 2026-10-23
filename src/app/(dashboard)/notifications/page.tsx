import { redirect } from "next/navigation";
import { connection } from "next/server";
import {
  AuthenticationRequiredError,
  AuthorizationError,
  requirePermission,
} from "@/lib/permissions";
import { NotificationsList } from "@/features/notifications/components/notifications-list";
import { MarkAllNotificationsReadButton } from "@/features/notifications/components/mark-notification-read-button";
import { listUserNotifications } from "@/features/notifications/repositories/notification.repository";

export default async function NotificationsPage() {
  await connection();

  let user;
  try {
    user = await requirePermission("notification:read:own");
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      redirect("/login");
    }
    if (error instanceof AuthorizationError) {
      redirect("/dashboard");
    }
    throw error;
  }

  const userId = Number(user.id);
  if (!Number.isSafeInteger(userId) || userId < 1) {
    throw new Error("The authenticated account identifier is invalid.");
  }

  const notifications = await listUserNotifications(userId);

  return (
    <main className="mx-auto w-full max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Notifications</h1>
          <p className="mt-1 text-sm text-slate-600">Updates for your tickets and conversations.</p>
        </div>
        <MarkAllNotificationsReadButton disabled={!notifications.some(({ isRead }) => !isRead)} />
      </header>
      <NotificationsList notifications={notifications} />
    </main>
  );
}
