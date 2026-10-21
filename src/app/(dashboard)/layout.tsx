import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import {
  AuthenticationRequiredError,
  requireAuthenticatedUser,
} from "@/lib/permissions";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getProfilePhotoPresentation } from "@/features/settings/repositories/settings.repository";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  let user;
  try {
    user = await requireAuthenticatedUser();
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      redirect("/login");
    }

    throw error;
  }

  const userId = Number(user.id);
  if (!Number.isSafeInteger(userId) || userId < 1) redirect("/login");
  const photo = await getProfilePhotoPresentation(userId);

  return (
    <DashboardShell
      userId={userId}
      name={user.name ?? user.email ?? "Service Desk user"}
      email={user.email ?? null}
      role={user.role}
      photoVersion={photo?.version ?? 0}
      hasProfilePhoto={photo?.hasPhoto ?? false}
    >
      {children}
    </DashboardShell>
  );
}
