"use client";

import { createPortal } from "react-dom";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";

type MenuPosition = {
  left: number;
  top: number;
};

const viewportPadding = 8;
const menuOffset = 8;

export function RowActionsMenu({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition>({ left: 8, top: 8 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useLayoutEffect(() => {
    if (!open || typeof document === "undefined") return;

    const updatePosition = () => {
      const trigger = triggerRef.current;
      const menu = menuRef.current;
      if (!trigger || !menu) return;

      const triggerRect = trigger.getBoundingClientRect();
      const menuRect = menu.getBoundingClientRect();
      const width = Math.min(
        menuRect.width,
        window.innerWidth - viewportPadding * 2,
      );
      const left = Math.max(
        viewportPadding,
        Math.min(
          triggerRect.right - width,
          window.innerWidth - width - viewportPadding,
        ),
      );
      const below = triggerRect.bottom + menuOffset;
      const top =
        below + menuRect.height <= window.innerHeight - viewportPadding
          ? below
          : Math.max(
              viewportPadding,
              triggerRect.top - menuRect.height - menuOffset,
            );

      setPosition({ left, top });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (
        target instanceof Node &&
        !triggerRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const closeAfterSelection = (event: MouseEvent<HTMLDivElement>) => {
    if (event.defaultPrevented) return;
    const target = event.target;
    if (
      target instanceof Element &&
      target.closest("a, button:not(:disabled)")
    ) {
      setOpen(false);
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Open actions for ${label}`}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-5 w-5"
        >
          <circle cx="4" cy="10" r="1.5" />
          <circle cx="10" cy="10" r="1.5" />
          <circle cx="16" cy="10" r="1.5" />
        </svg>
      </button>
      {typeof document !== "undefined" &&
        createPortal(
          <div
            id={menuId}
            ref={menuRef}
            hidden={!open}
            onClick={closeAfterSelection}
            style={{ left: position.left, top: position.top }}
            className="fixed z-[100] max-h-[min(24rem,calc(100vh-1rem))] min-w-44 max-w-[calc(100vw-1rem)] overflow-y-auto rounded-md border border-slate-200 bg-white p-1 shadow-lg [&_a]:block [&_a]:rounded-md [&_a]:px-3 [&_a]:py-2 [&_a]:text-sm [&_a]:text-slate-700 [&_a:hover]:bg-slate-50 [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-[-2px] [&_a:focus-visible]:outline-blue-600 [&_button]:block [&_button]:w-full [&_button]:rounded-md [&_button]:px-3 [&_button]:py-2 [&_button]:text-left [&_button]:text-sm [&_button]:text-slate-700 [&_button:hover]:bg-slate-50 [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-[-2px] [&_button:focus-visible]:outline-blue-600"
          >
            {children}
          </div>,
          document.body,
        )}
    </>
  );
}
