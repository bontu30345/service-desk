"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useActionToast } from "@/components/ui/action-toasts";
import { updateNotificationPreferences } from "../actions/notification-preferences";
import type { NotificationPreferenceData, SettingsActionState } from "../types";

const initialActionState: SettingsActionState = { success: false, message: "" };
const eventRows = [
  { key: "ticketAssigned", label: "Ticket assigned to me", description: "When a ticket is assigned to your account." },
  { key: "newComment", label: "New comment", description: "When a comment is added to a ticket you can access. Internal notes are not currently supported." },
  { key: "ticketStatusUpdated", label: "Ticket status updated", description: "When the status changes on a ticket you can access." },
  { key: "slaAlerts", label: "SLA warning or breach", description: "When an SLA warning or breach notification is generated." },
] as const;

function PreferenceSwitch({ label, checked, disabled, onChange }: { label: string; checked: boolean; disabled: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className={`inline-flex min-h-11 items-center justify-center rounded-lg px-2 focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 ${disabled ? "cursor-wait opacity-60" : "cursor-pointer"}`}>
      <input type="checkbox" role="switch" aria-label={label} checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} className="peer sr-only" />
      <span aria-hidden="true" className="relative h-6 w-11 rounded-full bg-slate-300 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:bg-blue-600 peer-checked:after:translate-x-5 motion-reduce:transition-none motion-reduce:after:transition-none" />
    </label>
  );
}

export function NotificationPreferencesForm({ preferences }: { preferences: NotificationPreferenceData }) {
  const [values, setValues] = useState(preferences);
  const [result, setResult] = useState(initialActionState);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  useActionToast(result);

  function updateValue(field: keyof NotificationPreferenceData, checked: boolean) {
    setValues((current) => ({ ...current, [field]: checked }));
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    startTransition(async () => {
      const response = await updateNotificationPreferences(values);
      setResult(response);
      if (response.success) router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="mt-5">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] border-separate border-spacing-0 text-left">
          <thead>
            <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th scope="col" className="border-b border-slate-200 px-3 py-3">Event</th>
              <th scope="col" className="w-24 border-b border-slate-200 px-3 py-3 text-center">In-App</th>
              <th scope="col" className="w-24 border-b border-slate-200 px-3 py-3 text-center">Email</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {eventRows.map(({ key, label, description }) => (
              <tr key={key}>
                <th scope="row" className="border-b border-slate-100 px-3 py-4 font-normal">
                  <span className="block text-sm font-medium text-slate-900">{label}</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span>
                </th>
                <td className="border-b border-slate-100 px-3 py-2 text-center">
                  <PreferenceSwitch label={`${label} — In-App`} checked={values[`${key}InApp`]} disabled={pending} onChange={(checked) => updateValue(`${key}InApp`, checked)} />
                </td>
                <td className="border-b border-slate-100 px-3 py-2 text-center">
                  <PreferenceSwitch label={`${label} — Email`} checked={values[`${key}Email`]} disabled={pending} onChange={(checked) => updateValue(`${key}Email`, checked)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {result.message && !result.success && <p role="alert" className="mt-4 text-sm text-red-700">{result.message}</p>}
      <div className="mt-5 flex justify-end">
        <button type="submit" disabled={pending} aria-busy={pending} className="inline-flex min-h-10 items-center justify-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-wait disabled:opacity-60">{pending ? "Saving…" : "Save preferences"}</button>
      </div>
    </form>
  );
}
