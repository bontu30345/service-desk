"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Priority } from "@prisma/client";
import { useActionToast } from "@/components/ui/action-toasts";
import { updateWorkspaceSettings } from "../actions/workspace-settings";
import type { SettingsActionState, WorkspaceSettingsData } from "../types";

const initialActionState: SettingsActionState = { success: false, message: "" };

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1 text-sm text-red-700">{message}</p> : null;
}

export function WorkspaceSettingsForm({ settings }: { settings: WorkspaceSettingsData }) {
  const [values, setValues] = useState(settings);
  const [result, setResult] = useState(initialActionState);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  useActionToast(result);

  function setValue<K extends keyof WorkspaceSettingsData>(key: K, value: WorkspaceSettingsData[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    startTransition(async () => {
      const response = await updateWorkspaceSettings(values);
      setResult(response);
      if (response.success) router.refresh();
    });
  }

  const errors = result.fieldErrors;
  const inputClass = "mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/15";

  return (
    <form onSubmit={submit} className="mt-6 grid gap-5 sm:grid-cols-2">
      <div>
        <label htmlFor="workspaceName" className="text-sm font-medium text-slate-800">Workspace name</label>
        <input id="workspaceName" required minLength={2} maxLength={100} value={values.workspaceName} onChange={(event) => setValue("workspaceName", event.target.value)} aria-invalid={Boolean(errors?.workspaceName)} disabled={pending} className={inputClass} />
        <FieldError message={errors?.workspaceName?.[0]} />
      </div>
      <div>
        <label htmlFor="supportEmail" className="text-sm font-medium text-slate-800">Support email</label>
        <input id="supportEmail" type="email" required maxLength={254} value={values.supportEmail} onChange={(event) => setValue("supportEmail", event.target.value)} aria-invalid={Boolean(errors?.supportEmail)} disabled={pending} className={inputClass} />
        <FieldError message={errors?.supportEmail?.[0]} />
      </div>
      <div>
        <label htmlFor="defaultTicketPriority" className="text-sm font-medium text-slate-800">Default ticket priority</label>
        <select id="defaultTicketPriority" value={values.defaultTicketPriority} onChange={(event) => setValue("defaultTicketPriority", event.target.value as WorkspaceSettingsData["defaultTicketPriority"])} disabled={pending} className={inputClass}>
          {Object.values(Priority).map((priority) => <option key={priority} value={priority}>{priority.charAt(0) + priority.slice(1).toLowerCase()}</option>)}
        </select>
        <p className="mt-1 text-xs text-slate-500">Stored as a workspace default; ticket creation behavior is unchanged.</p>
      </div>
      <div>
        <label htmlFor="brandColor" className="text-sm font-medium text-slate-800">Primary brand color</label>
        <div className="mt-1.5 flex min-h-11 items-center gap-3 rounded-lg border border-slate-300 px-3">
          <input id="brandColor" type="color" value={values.brandColor} onChange={(event) => setValue("brandColor", event.target.value)} aria-label="Choose primary brand color" disabled={pending} className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent p-0 disabled:cursor-wait disabled:opacity-60" />
          <span className="font-mono text-sm text-slate-700">{values.brandColor}</span>
        </div>
        <FieldError message={errors?.brandColor?.[0]} />
      </div>
      <div className="sm:col-span-2">
        <label className="flex min-h-12 cursor-pointer items-center justify-between gap-4 rounded-lg border border-slate-200 px-4 py-3 focus-within:ring-2 focus-within:ring-blue-600">
          <span>
            <span className="block text-sm font-medium text-slate-900">Automatic assignment</span>
            <span className="mt-0.5 block text-xs text-slate-500">Save the workspace preference. Ticket assignment behavior is unchanged.</span>
          </span>
          <input type="checkbox" role="switch" aria-label="Automatic assignment" checked={values.autoAssignment} onChange={(event) => setValue("autoAssignment", event.target.checked)} disabled={pending} className="h-5 w-5 accent-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600" />
        </label>
      </div>
      {result.message && !result.success && <p role="alert" className="text-sm text-red-700 sm:col-span-2">{result.message}</p>}
      <div className="flex justify-end sm:col-span-2">
        <button type="submit" disabled={pending} aria-busy={pending} className="inline-flex min-h-10 items-center justify-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-wait disabled:opacity-60">{pending ? "Saving…" : "Save workspace settings"}</button>
      </div>
    </form>
  );
}
