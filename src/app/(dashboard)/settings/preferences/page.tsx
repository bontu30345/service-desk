"use client";

import { useThemePreference, type ThemeChoice } from "@/components/ui/theme-preferences";

const themeOptions: { value: ThemeChoice; label: string; description: string; preview: string }[] = [
  { value: "light", label: "Light Mode", description: "A bright workspace with light surfaces.", preview: "bg-white" },
  { value: "dark", label: "Dark Mode", description: "A darker workspace for low-light environments.", preview: "bg-slate-800" },
  { value: "system", label: "System Default", description: "Follow your device appearance setting.", preview: "bg-gradient-to-r from-white via-white to-slate-800" },
];

export default function SettingsPreferencesPage() {
  const { theme, setTheme } = useThemePreference();

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Theme preference</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">Choose how the Service Desk workspace looks on this device. Your selection is saved in this browser.</p>
      </div>
      <fieldset className="mt-5 grid gap-3 sm:grid-cols-3">
        <legend className="sr-only">Theme choice</legend>
        {themeOptions.map((option) => (
          <label key={option.value} className={`relative flex min-h-36 cursor-pointer flex-col rounded-xl border p-4 transition-colors focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 ${theme === option.value ? "border-blue-600 bg-blue-50/50" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}>
            <input type="radio" name="theme" value={option.value} checked={theme === option.value} onChange={() => setTheme(option.value)} className="sr-only" />
            <span aria-hidden="true" className={`mb-4 flex h-12 items-end gap-1 overflow-hidden rounded-lg border border-slate-200 p-1.5 ${option.preview}`}>
              <span className="h-7 w-2 rounded-sm bg-slate-300/80" />
              <span className="h-7 flex-1 rounded-sm bg-slate-200/80" />
              <span className="h-4 w-5 rounded-sm bg-blue-500/80" />
            </span>
            <span className="flex items-center justify-between gap-2 text-sm font-semibold text-slate-900">
              {option.label}
              <span aria-hidden="true" className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${theme === option.value ? "border-blue-600" : "border-slate-300"}`}>
                {theme === option.value && <span className="h-2 w-2 rounded-full bg-blue-600" />}
              </span>
            </span>
            <span className="mt-1 text-xs leading-5 text-slate-600">{option.description}</span>
          </label>
        ))}
      </fieldset>
    </section>
  );
}
