"use client";

import { useActionState, useEffect, useRef, useState, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { uploadTicketAttachmentAction } from "../actions/upload-ticket-attachment";
import type { AttachmentUploadActionState } from "../schemas/attachment.schema";
import { formatBytes } from "../utils/format-bytes";
import { useActionToast } from "@/components/ui/action-toasts";

const initialState: AttachmentUploadActionState = {
  success: false,
  message: "",
};

const maxAttachmentSize = 5 * 1024 * 1024;

function fileError(file: File) {
  const extension = file.name.split(".").at(-1)?.toLowerCase();
  if (!extension || !["pdf", "png", "jpg", "jpeg", "txt"].includes(extension)) {
    return "Choose a PDF, PNG, JPG, JPEG, or TXT file.";
  }
  if (file.size > maxAttachmentSize) return "Files must be 5 MiB or smaller.";
  if (file.size === 0) return "The selected file is empty.";
  return "";
}

function UploadButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Uploading…" : "Upload attachment"}
    </button>
  );
}

export function UploadAttachmentForm({
  ticketId,
}: {
  ticketId: number;
}) {
  const action = uploadTicketAttachmentAction.bind(null, ticketId);
  const [state, formAction] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectionError, setSelectionError] = useState("");
  const [selectedAfterSuccess, setSelectedAfterSuccess] = useState(false);
  useActionToast(state, "Attachment uploaded successfully.");

  function acceptFile(file: File | undefined) {
    if (!file) return;
    const error = fileError(file);
    setSelectionError(error);
    if (error) {
      setSelectedFile(null);
      if (formRef.current) {
        const input = formRef.current.elements.namedItem("file");
        if (input instanceof HTMLInputElement) input.value = "";
      }
      return;
    }
    setSelectedAfterSuccess(true);
    setSelectedFile(file);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    acceptFile(file);
    if (file && !fileError(file) && formRef.current) {
      const input = formRef.current.elements.namedItem("file");
      if (input instanceof HTMLInputElement) {
        const transfer = new DataTransfer();
        transfer.items.add(file);
        input.files = transfer.files;
      }
    }
  }

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [router, state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={() => setSelectedAfterSuccess(false)}
      className="space-y-4"
    >
      <div>
        <div
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
          className="rounded-xl border-2 border-dashed border-slate-300 bg-white p-6 text-center transition-all hover:border-blue-500 hover:bg-blue-50/30 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20"
        >
          <label htmlFor="ticket-attachment-file" className="flex cursor-pointer flex-col items-center">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="mb-3 h-9 w-9 text-blue-600">
            <path d="M20 16.2A4.5 4.5 0 0 0 18 7.5h-1.3A6 6 0 1 0 5 15.8" />
            <path d="M12 12v9m-4-4 4-4 4 4" />
          </svg>
          <span className="text-sm font-semibold text-slate-800">Add an attachment</span>
          <span className="mt-1 text-sm text-slate-600">Drop a file here, or click to choose one.</span>
          <input
            id="ticket-attachment-file"
            name="file"
            type="file"
            required
            accept=".pdf,.png,.jpg,.jpeg,.txt,application/pdf,image/png,image/jpeg,text/plain"
            aria-invalid={Boolean(selectionError || state.fieldErrors?.fileName?.length)}
            aria-describedby="ticket-attachment-file-hint"
            onChange={(event) => acceptFile(event.currentTarget.files?.[0])}
            className="mt-4 block min-h-11 w-full max-w-md rounded-lg border border-slate-300 bg-white p-2 text-left text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          />
          </label>
          {selectedFile && (!state.success || selectedAfterSuccess) && (
            <div className="mt-3 flex w-full max-w-md flex-wrap items-center justify-between gap-2 rounded-md bg-white px-3 py-2 text-left text-sm text-slate-700">
              <span className="min-w-0 truncate" title={selectedFile.name}>{selectedFile.name} · {formatBytes(selectedFile.size)}</span>
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setSelectedAfterSuccess(false);
                  if (formRef.current) {
                    const input = formRef.current.elements.namedItem("file");
                    if (input instanceof HTMLInputElement) input.value = "";
                  }
                }}
                className="rounded px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Remove file
              </button>
            </div>
          )}
        </div>
        <p id="ticket-attachment-file-hint" className="mt-1 text-xs text-slate-500">
          PDF, PNG, JPG, or TXT; maximum size 5 MiB.
        </p>
        {(selectionError || state.fieldErrors?.fileName?.[0]) && (
          <p
            id="ticket-attachment-file-error"
            role="alert"
            className="mt-1 text-sm text-red-700"
          >
            {selectionError || state.fieldErrors?.fileName?.[0]}
          </p>
        )}
      </div>
      {state.message && !state.success && (
        <p
          role={state.success ? "status" : "alert"}
          className={
            state.success ? "text-sm text-green-700" : "text-sm text-red-700"
          }
        >
          {state.message}
        </p>
      )}
      <UploadButton />
    </form>
  );
}
