"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import type { Role } from "@prisma/client";
import { useActionToast } from "@/components/ui/action-toasts";
import { ProfilePhotoUploader } from "./profile-photo-uploader";
import { changePasswordAction, updateProfileAction } from "../actions/profile";
import type { SettingsActionState } from "../types";

const initialSettingsActionState: SettingsActionState = { success: false, message: "" };

function roleLabel(role: Role) {
  return role === "ADMIN" ? "Admin" : role === "AGENT" ? "Agent" : "Employee";
}

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} aria-busy={pending} className="inline-flex min-h-10 items-center justify-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-wait disabled:opacity-60">{pending ? pendingLabel : label}</button>;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? <p id={id} className="mt-1 text-sm text-red-700">{message}</p> : null;
}

export function ProfileSettingsForm({
  userId,
  name,
  email,
  role,
  photoVersion,
  hasPhoto,
}: {
  userId: number;
  name: string;
  email: string;
  role: Role;
  photoVersion: number;
  hasPhoto: boolean;
}) {
  const [profileState, profileAction] = useActionState(updateProfileAction, initialSettingsActionState);
  const [passwordState, passwordAction] = useActionState(changePasswordAction, initialSettingsActionState);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const passwordFormRef = useRef<HTMLFormElement>(null);
  useActionToast(profileState);
  useActionToast(passwordState);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (passwordOpen && !dialog.open) dialog.showModal();
    if (!passwordOpen && dialog.open) dialog.close();
  }, [passwordOpen]);

  useEffect(() => {
    if (passwordState.success) passwordFormRef.current?.reset();
  }, [passwordState.success]);

  const profileNameError = profileState.fieldErrors?.name?.[0];
  const passwordErrors = passwordState.fieldErrors;

  return (
    <>
      <ProfilePhotoUploader
        userId={userId}
        name={name}
        version={photoVersion}
        initialHasPhoto={hasPhoto}
      />
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <h2 className="text-base font-semibold text-slate-900">Profile information</h2>
          <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{roleLabel(role)}</span>
        </div>

        <form action={profileAction} className="mt-5 space-y-5">
          <div>
            <label htmlFor="profile-name" className="mb-1.5 block text-sm font-medium text-slate-800">Full name</label>
            <input id="profile-name" name="name" required minLength={2} maxLength={100} defaultValue={name} autoComplete="name" aria-invalid={Boolean(profileNameError)} aria-describedby={profileNameError ? "profile-name-error" : undefined} className="min-h-11 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/15 sm:max-w-xl" />
            <FieldError id="profile-name-error" message={profileNameError} />
          </div>
          <div>
            <label htmlFor="profile-email" className="mb-1.5 block text-sm font-medium text-slate-800">Email</label>
            <input id="profile-email" type="email" value={email} readOnly disabled className="min-h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-600 disabled:cursor-not-allowed sm:max-w-xl" />
            <p className="mt-1 text-xs text-slate-500">Email changes are managed by your administrator.</p>
          </div>
          {profileState.message && !profileState.success && <p role="alert" className="text-sm text-red-700">{profileState.message}</p>}
          <div className="flex flex-wrap gap-3">
            <SubmitButton label="Save changes" pendingLabel="Saving…" />
            <button type="button" onClick={() => setPasswordOpen(true)} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">Change password</button>
          </div>
        </form>
      </section>

      <dialog ref={dialogRef} aria-labelledby="change-password-title" onClose={() => setPasswordOpen(false)} className="m-auto max-h-[90dvh] w-[min(32rem,calc(100%-2rem))] overflow-y-auto rounded-xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-900/40 backdrop:backdrop-blur-sm">
        <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
          <h2 id="change-password-title" className="text-lg font-semibold">Change password</h2>
          <p className="mt-1 text-sm text-slate-600">Enter your current password and choose a new one. You&apos;ll need to sign in again afterward.</p>
        </div>
        <form ref={passwordFormRef} action={passwordAction} className="space-y-4 p-5 sm:p-6">
          {(["currentPassword", "newPassword", "confirmPassword"] as const).map((field) => {
            const labels = { currentPassword: "Current password", newPassword: "New password", confirmPassword: "Confirm new password" };
            const autocomplete = field === "currentPassword" ? "current-password" : "new-password";
            const error = passwordErrors?.[field]?.[0];
            return <div key={field}>
              <label htmlFor={field} className="mb-1.5 block text-sm font-medium text-slate-800">{labels[field]}</label>
              <input id={field} name={field} type="password" required autoComplete={autocomplete} minLength={field === "currentPassword" ? undefined : 8} maxLength={72} aria-invalid={Boolean(error)} aria-describedby={error ? `${field}-error` : undefined} className="min-h-11 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/15" />
              <FieldError id={`${field}-error`} message={error} />
            </div>;
          })}
          {passwordState.message && !passwordState.success && <p role="alert" className="text-sm text-red-700">{passwordState.message}</p>}
          {passwordState.success && <p role="status" aria-live="polite" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{passwordState.message}</p>}
          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setPasswordOpen(false)} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">Close</button>
            {!passwordState.success && <SubmitButton label="Update password" pendingLabel="Updating…" />}
          </div>
        </form>
      </dialog>
    </>
  );
}
