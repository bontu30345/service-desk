"use client";

import { useState } from "react";

export function ExportCsvButton({ href }: { href: string }) {
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  async function download() {
    if (state === "loading") return;
    setState("loading");
    try {
      const response = await fetch(href, { credentials: "same-origin" });
      if (!response.ok) throw new Error("Export failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `service-desk-tickets-${new Date().toISOString().slice(0, 10)}.csv`;
      anchor.click();

window.setTimeout(() => {
  URL.revokeObjectURL(url);
}, 1000);

setState("idle");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={download}
        disabled={state === "loading"}
        className="no-print inline-flex w-fit items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-wait disabled:opacity-60"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
        </svg>
       {state === "loading" ? "Preparing CSV..." : "Export CSV"}
      </button>
      {state === "error" && <span className="text-xs text-rose-700" role="alert">CSV export failed. Please try again.</span>}
    </div>
  );
}
