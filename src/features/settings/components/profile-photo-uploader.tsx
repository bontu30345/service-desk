"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { useActionToast } from "@/components/ui/action-toasts";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import {
  removeProfilePhotoAction,
  uploadProfilePhotoAction,
} from "../actions/profile-photo";
import {
  MAX_PROFILE_PHOTO_SIZE,
  type ProfilePhotoActionState,
} from "../schemas/profile-photo.schema";

const initialState: ProfilePhotoActionState = { success: false, message: "" };

function UploadButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-10 items-center justify-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? "Saving photo…" : "Save photo"}
    </button>
  );
}

function RemoveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? "Removing…" : "Remove photo"}
    </button>
  );
}

export function ProfilePhotoUploader({
  userId,
  name,
  version,
  initialHasPhoto,
}: {
  userId: number;
  name: string;
  version: number;
  initialHasPhoto: boolean;
}) {
  const [uploadState, uploadAction] = useActionState(uploadProfilePhotoAction, initialState);
  const [removeState, removeAction] = useActionState(removeProfilePhotoAction, initialState);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const hasPhoto = removeState.success
    ? false
    : uploadState.success
      ? true
      : initialHasPhoto;
  const visiblePreviewUrl = uploadState.success ? null : previewUrl;
  const [fileError, setFileError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  useActionToast(uploadState);
  useActionToast(removeState);

  useEffect(() => {
    if (uploadState.success) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    }
  }, [previewUrl, router, uploadState]);

  useEffect(() => {
    if (removeState.success) {
      router.refresh();
    }
  }, [router, removeState]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function selectFile(file: File | undefined) {
    setFileError("");
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    if (!file) return;
    if (file.size > MAX_PROFILE_PHOTO_SIZE) {
      setFileError("Choose an image that is 5 MB or smaller.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setPreviewUrl(URL.createObjectURL(file));
  }

  function cancelSelection() {
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    setFileError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <section aria-labelledby="profile-photo-heading" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <ProfileAvatar
          userId={userId}
          name={name}
          version={version}
          hasPhoto={hasPhoto}
          size="large"
          previewSrc={visiblePreviewUrl}
        />
        <div className="min-w-0 flex-1">
          <h2 id="profile-photo-heading" className="font-semibold text-slate-900">Profile photo</h2>
          <p className="mt-1 text-sm text-slate-600">JPEG, PNG, or WebP. Maximum size 5 MB.</p>
          <form action={uploadAction} className="mt-4 space-y-3">
            <label htmlFor="profile-photo-file" className="block text-sm font-medium text-slate-800">
              Choose a photo
            </label>
            <input
              ref={inputRef}
              id="profile-photo-file"
              name="photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-describedby="profile-photo-help profile-photo-error"
              onChange={(event) => selectFile(event.currentTarget.files?.[0])}
              className="block w-full max-w-xl text-sm text-slate-700 file:mr-3 file:min-h-10 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:font-medium file:text-slate-800 hover:file:bg-slate-200"
            />
            <p id="profile-photo-help" className="text-xs text-slate-500">
              Your selection is previewed locally and is not saved until you choose Save photo.
            </p>
            {(fileError || (uploadState.message && !uploadState.success)) && (
              <p id="profile-photo-error" role="alert" className="text-sm text-red-700">
                {fileError || uploadState.message}
              </p>
            )}
            {uploadState.success && (
              <p role="status" aria-live="polite" className="text-sm text-emerald-700">
                {uploadState.message}
              </p>
            )}
            {visiblePreviewUrl && (
              <div className="flex flex-wrap gap-3">
                <UploadButton />
                <button
                  type="button"
                  onClick={cancelSelection}
                  className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  Cancel
                </button>
              </div>
            )}
          </form>
          {hasPhoto && !visiblePreviewUrl && (
            <form action={removeAction} className="mt-3">
              <RemoveButton />
              {removeState.message && !removeState.success && (
                <p role="alert" className="mt-2 text-sm text-red-700">{removeState.message}</p>
              )}
              {removeState.success && (
                <p role="status" aria-live="polite" className="mt-2 text-sm text-emerald-700">{removeState.message}</p>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
