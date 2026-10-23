import type { ReactNode } from "react";
import { requireAuthenticatedUser } from "@/lib/permissions";
import { SettingsTabs } from "@/features/settings/components/settings-tabs";

export default async function SettingsLayout({ children }: { children: ReactNode }) {
  const user = await requireAuthenticatedUser();

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <header>
        <p className="text-sm font-semibold text-blue-700">Account</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Settings</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Manage your profile and the settings available to your account.</p>
      </header>
      <SettingsTabs isAdmin={user.role === "ADMIN"} />
      {children}
    </div>
  );
}
