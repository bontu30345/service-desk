"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type ToastVariant = "success" | "error" | "warning";
type Toast = { id: number; message: string; variant: ToastVariant };
type ToastContextValue = (message: string, variant: ToastVariant) => void;

const ToastContext = createContext<ToastContextValue | null>(null);
let nextToastId = 0;

function ToastIcon({ variant }: { variant: ToastVariant }) {
  if (variant === "success") {
    return <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-emerald-600"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.78-9.72a.75.75 0 0 0-1.06-1.06l-3.47 3.47-1.47-1.47a.75.75 0 0 0-1.06 1.06l2 2a.75.75 0 0 0 1.06 0l4-4Z" clipRule="evenodd" /></svg>;
  }
  if (variant === "warning") {
    return <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-amber-600"><path fillRule="evenodd" d="M8.485 2.495a1.75 1.75 0 0 1 3.03 0l6.087 10.55A1.75 1.75 0 0 1 16.087 15.7H3.913a1.75 1.75 0 0 1-1.515-2.655l6.087-10.55ZM10 6a.75.75 0 0 0-.75.75v3.5a.75.75 0 0 0 1.5 0v-3.5A.75.75 0 0 0 10 6Zm0 7.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" /></svg>;
  }
  return <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-red-600"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clipRule="evenodd" /></svg>;
}

function ToastItem({ toast, dismiss }: { toast: Toast; dismiss: (id: number) => void }) {
  useEffect(() => {
    const timeout = window.setTimeout(() => dismiss(toast.id), 5000);
    return () => window.clearTimeout(timeout);
  }, [dismiss, toast.id]);

  return (
    <div role={toast.variant === "error" ? "alert" : "status"} aria-live={toast.variant === "error" ? "assertive" : "polite"} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
      <ToastIcon variant={toast.variant} />
      <p className="min-w-0 flex-1 text-sm font-medium text-slate-800">{toast.message}</p>
      <button type="button" aria-label="Dismiss notification" onClick={() => dismiss(toast.id)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-blue-600">×</button>
    </div>
  );
}

export function ActionToasts({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);
  const notify = useCallback((message: string, variant: ToastVariant) => {
    const id = ++nextToastId;
    setToasts((current) => [...current.slice(-2), { id, message, variant }]);
  }, []);

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="pointer-events-none fixed right-4 top-20 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2">
        {toasts.map((toast) => <div key={toast.id} className="pointer-events-auto"><ToastItem toast={toast} dismiss={dismiss} /></div>)}
      </div>
    </ToastContext.Provider>
  );
}

export function useActionToast(
  state: { success: boolean; message: string },
  successFallback?: string,
) {
  const notify = useContext(ToastContext);
  useEffect(() => {
    if (!state.message && !(state.success && successFallback)) return;
    notify?.(state.message || successFallback!, state.success ? "success" : "error");
  }, [notify, state, state.message, state.success, successFallback]);
}
