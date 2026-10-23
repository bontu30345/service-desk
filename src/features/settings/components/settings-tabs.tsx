"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "Profile", href: "/settings/profile" },
  { label: "Notifications", href: "/settings/notifications" },
  { label: "Preferences", href: "/settings/preferences" },
  { label: "Workspace", href: "/settings/workspace", adminOnly: true },
];

export function SettingsTabs({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Settings sections" className="-mx-4 overflow-x-auto border-b border-slate-200 px-4 sm:mx-0 sm:px-0">
      <div className="flex min-w-max gap-1">
        {tabs.filter((tab) => !tab.adminOnly || isAdmin).map((tab) => {
          const active = pathname === tab.href;
          return <Link key={tab.href} href={tab.href} aria-current={active ? "page" : undefined} className={`border-b-2 px-3 py-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-blue-600 ${active ? "border-blue-700 text-blue-800" : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900"}`}>{tab.label}</Link>;
        })}
      </div>
    </nav>
  );
}
