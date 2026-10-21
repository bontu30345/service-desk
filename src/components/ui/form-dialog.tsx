"use client";

import { useEffect, useRef, useState } from "react";
import { btnPrimary, cardSurface } from "./ui-classes";

export function FormDialog({
  title,
  triggerLabel,
  children,
}: {
  title: string;
  triggerLabel: string;
  children: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`gap-2 ${btnPrimary}`}>
        <span aria-hidden="true">+</span>{triggerLabel}
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby="create-dialog-title"
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === dialogRef.current) setOpen(false);
        }}
        className={`m-auto max-h-[90dvh] w-[min(38rem,calc(100%-2rem))] overflow-y-auto p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/50 ${cardSurface}`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 id="create-dialog-title" className="text-lg font-semibold">{title}</h2>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close dialog" className="rounded-md p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-600">×</button>
        </div>
        {open && <div className="p-5">{children(() => setOpen(false))}</div>}
      </dialog>
    </>
  );
}
