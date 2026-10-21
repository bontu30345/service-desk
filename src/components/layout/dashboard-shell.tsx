"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode, type KeyboardEvent } from "react";
import { useFormStatus } from "react-dom";
import type { Role } from "@prisma/client";
import { logoutAction } from "@/features/auth/actions/logout";
import { hasPermission } from "@/lib/permission-policy";
import { ActionToasts } from "@/components/ui/action-toasts";
import { ThemePreferencesProvider } from "@/components/ui/theme-preferences";
import { ProfileAvatar } from "@/components/ui/profile-avatar";

type NavigationItem = {
  label: string;
  href: string;
  icon: "dashboard" | "tickets" | "notifications" | "reports" | "users" | "departments" | "categories" | "sla" | "audit" | "settings";
  adminOnly?: boolean;
};

const navigationItems: NavigationItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { label: "Tickets", href: "/tickets", icon: "tickets" },
  { label: "Notifications", href: "/notifications", icon: "notifications" },
  { label: "Tickets Report", href: "/reports/tickets", icon: "reports" },
  { label: "Users", href: "/users", icon: "users", adminOnly: true },
  { label: "Departments", href: "/departments", icon: "departments", adminOnly: true },
  { label: "Categories", href: "/categories", icon: "categories", adminOnly: true },
  { label: "SLA Policies", href: "/sla", icon: "sla", adminOnly: true },
  { label: "Audit Logs", href: "/audit-logs", icon: "audit", adminOnly: true },
  { label: "Settings", href: "/settings", icon: "settings" },
];

function NavigationIcon({ icon }: { icon: NavigationItem["icon"] }) {
  const common = {
    className: "h-5 w-5 shrink-0",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  switch (icon) {
    case "dashboard":
      return <svg {...common}><rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="3" width="8" height="5" rx="1.5" /><rect x="13" y="10" width="8" height="11" rx="1.5" /><rect x="3" y="13" width="8" height="8" rx="1.5" /></svg>;
    case "tickets":
      return <svg {...common}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v18H6.5A2.5 2.5 0 0 1 4 18.5z" /><path d="M4 17.5A2.5 2.5 0 0 1 6.5 15H20M8 7h8M8 11h8" /></svg>;
    case "notifications":
      return <svg {...common}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>;
    case "reports":
      return <svg {...common}><path d="M4 19V5M4 19h16" /><path d="M8 15V9M12 15V5M16 15v-3M20 15V7" /></svg>;
    case "users":
      return <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM20 8v6M23 11h-6" /></svg>;
    case "departments":
      return <svg {...common}><path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M15 9h.01M9 13h.01M15 13h.01M10 21v-4h4v4" /></svg>;
    case "categories":
      return <svg {...common}><path d="m20.6 13.4-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z" /><circle cx="7.5" cy="7.5" r="1.2" /></svg>;
    case "sla":
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2M8 2v2M16 2v2" /></svg>;
    case "audit":
      return <svg {...common}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /><path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5" /></svg>;
    case "settings":
      return <svg {...common}><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1a1.8 1.8 0 0 1-2.5 2.5l-.1-.1a1.8 1.8 0 0 0-3 .9v.2a1.8 1.8 0 0 1-3.6 0v-.2a1.8 1.8 0 0 0-3-.9l-.1.1a1.8 1.8 0 0 1-2.5-2.5l.1-.1a1.8 1.8 0 0 0-.9-3h-.2a1.8 1.8 0 0 1 0-3.6h.2a1.8 1.8 0 0 0 .9-3l-.1-.1a1.8 1.8 0 0 1 2.5-2.5l.1.1a1.8 1.8 0 0 0 3-.9v-.2a1.8 1.8 0 0 1 3.6 0v.2a1.8 1.8 0 0 0 3 .9l.1-.1a1.8 1.8 0 0 1 2.5 2.5l-.1.1a1.8 1.8 0 0 0 .9 3h.2a1.8 1.8 0 0 1 0 3.6h-.2a1.8 1.8 0 0 0-.9 3Z" /></svg>;
  }
}

function roleLabel(role: Role) {
  const labels: Record<Role, string> = {
    ADMIN: "Admin",
    AGENT: "Agent",
    EMPLOYEE: "Employee",
  };
  return labels[role];
}

function LogoutIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 17l5-5-5-5M15 12H3" />
      <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
    </svg>
  );
}

function LogoutSubmitButton({ variant }: { variant: "sidebar" | "menu" }) {
  const { pending } = useFormStatus();
  const styles = variant === "sidebar"
    ? "text-slate-300 hover:bg-slate-800 hover:text-white focus-visible:outline-blue-400"
    : "text-red-600 hover:bg-red-50 hover:text-red-700 focus-visible:outline-blue-600";

  return (
    <button
      type="submit"
      disabled={pending}
      className={`flex min-h-10 w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${styles}`}
    >
      <LogoutIcon className={variant === "sidebar" ? "h-5 w-5" : "h-4 w-4"} />
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}

function LogoutForm({ variant }: { variant: "sidebar" | "menu" }) {
  return (
    <form action={logoutAction}>
      <LogoutSubmitButton variant={variant} />
    </form>
  );
}

function SidebarSignOut() {
  return (
    <div className="mt-auto shrink-0 border-t border-slate-800 px-4 py-3">
      <LogoutForm variant="sidebar" />
    </div>
  );
}

function AccountMenu({
  userId,
  name,
  email,
  role,
  photoVersion,
  hasProfilePhoto,
}: {
  userId: number;
  name: string;
  email: string | null;
  role: Role;
  photoVersion: number;
  hasProfilePhoto: boolean;
}) {
  const menuRef = useRef<HTMLDetailsElement>(null);
  const triggerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) {
        if (menuRef.current) menuRef.current.open = false;
      }
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLDetailsElement>) {
    if (event.key === "Escape" && menuRef.current?.open) {
      event.preventDefault();
      menuRef.current.open = false;
      triggerRef.current?.focus();
    }
  }

  return (
    <details ref={menuRef} onKeyDown={handleKeyDown} className="relative">
      <summary
        ref={triggerRef as React.RefObject<HTMLElement>}
        aria-label={`Open account menu for ${name}`}
        className="flex min-h-10 cursor-pointer list-none items-center gap-1.5 rounded-lg px-1.5 py-1 text-left hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 [&::-webkit-details-marker]:hidden"
      >
        <ProfileAvatar userId={userId} name={name} version={photoVersion} hasPhoto={hasProfilePhoto} size="small" />
        <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-slate-500"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.09 1.03l-4.25 4.3a.75.75 0 0 1-1.07 0l-4.25-4.3a.75.75 0 0 1 .02-1.05Z" clipRule="evenodd" /></svg>
      </summary>
      <div className="absolute right-0 z-50 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
        <div className="flex min-w-0 items-start gap-3 px-3 py-3">
          <ProfileAvatar userId={userId} name={name} version={photoVersion} hasPhoto={hasProfilePhoto} size="medium" />
          <div className="min-w-0">
            <p className="break-words text-sm font-semibold text-slate-900">{name}</p>
            {email && <p className="mt-0.5 break-all text-xs text-slate-500">{email}</p>}
            <p className="mt-1 text-xs font-medium text-slate-600">{roleLabel(role)}</p>
          </div>
        </div>
        <div className="my-1 border-t border-slate-100" />
        <Link
          href="/settings"
          onClick={() => {
            if (menuRef.current) menuRef.current.open = false;
          }}
          className="flex min-h-10 w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          <NavigationIcon icon="settings" />
          <span>Settings</span>
        </Link>
        <LogoutForm variant="menu" />
      </div>
    </details>
  );
}

function SidebarContent({
  role,
  pathname,
  onNavigate,
}: {
  role: Role;
  pathname: string;
  onNavigate?: () => void;
}) {
  const items = navigationItems.filter((item) => !item.adminOnly || role === "ADMIN");

  return (
    <>
      <div className="flex h-[4.5rem] shrink-0 items-center gap-3 border-b border-slate-800 px-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-blue-400 text-lg font-bold text-white shadow-md shadow-blue-500/20">
          S
        </span>
        <div>
          <p className="text-sm font-semibold tracking-wide text-white">
            SERVICE DESK
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-slate-400">Operations center</p>
        </div>
      </div>
      <nav aria-label="Main navigation" className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-5">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          Workspace
        </p>
        {items.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                active
                  ? "border-l-2 border-blue-300 bg-blue-600 text-white shadow-sm shadow-blue-950/20"
                  : "border-l-2 border-transparent text-slate-300 hover:bg-slate-800/80 hover:text-white"
              }`}
            >
              <NavigationIcon icon={item.icon} />
              <span>{item.label}</span>
              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export function DashboardShell({
  children,
  userId,
  name,
  email,
  role,
  photoVersion,
  hasProfilePhoto,
}: {
  children: ReactNode;
  userId: number;
  name: string;
  email: string | null;
  role: Role;
  photoVersion: number;
  hasProfilePhoto: boolean;
}) {
  const pathname = usePathname();
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);

  return (
    <ThemePreferencesProvider>
    <div className="min-h-screen bg-slate-50/70">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-slate-950 lg:flex border-r border-slate-800">
        <SidebarContent role={role} pathname={pathname} />
        <SidebarSignOut />
      </aside>

      <div className="min-h-screen lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" aria-label="Service Desk home" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
              S
            </span>
            <span className="hidden text-sm font-semibold text-slate-900 sm:inline">
              Service Desk
            </span>
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link
              href="/notifications"
              aria-label="Notifications"
              title="Notifications"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <NavigationIcon icon="notifications" />
            </Link>
            {hasPermission(role, "ticket:create") && pathname !== "/tickets/new" && (
              <Link
                href="/tickets/new"
                aria-label="Create ticket"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:h-10 sm:w-auto sm:gap-2 sm:px-3.5"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <span className="hidden text-sm font-semibold sm:inline">Create Ticket</span>
              </Link>
            )}
            <AccountMenu
              userId={userId}
              name={name}
              email={email}
              role={role}
              photoVersion={photoVersion}
              hasProfilePhoto={hasProfilePhoto}
            />
            <button
              type="button"
              aria-label={mobileNavigationOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={mobileNavigationOpen}
              aria-controls="mobile-dashboard-navigation"
              onClick={() => setMobileNavigationOpen((open) => !open)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 lg:hidden"
            >
              {mobileNavigationOpen ? (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="m6 6 12 12M18 6 6 18" />
                </svg>
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </header>

        {mobileNavigationOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              type="button"
              aria-label="Close navigation menu"
              onClick={() => setMobileNavigationOpen(false)}
              className="absolute inset-0 h-full w-full bg-slate-950/60 backdrop-blur-xs animate-fade-in"
            />
            <aside
              id="mobile-dashboard-navigation"
              aria-label="Mobile navigation"
              className="absolute inset-y-0 left-0 flex w-[min(19rem,85vw)] flex-col overflow-y-auto bg-slate-950 shadow-2xl animate-scale-in"
            >
              <SidebarContent
                role={role}
                pathname={pathname}
                onNavigate={() => setMobileNavigationOpen(false)}
              />
              <SidebarSignOut />
            </aside>
          </div>
        )}

        <main className="min-w-0"><ActionToasts>{children}</ActionToasts></main>
      </div>
    </div>
    </ThemePreferencesProvider>
  );
}
