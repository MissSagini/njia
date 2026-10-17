"use client";

import { useEffect, useRef, type ReactNode } from "react";

type SheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  /** Chips, buttons and notes. Stacked 16px apart. */
  children?: ReactNode;
};

/**
 * Bottom sheet on mobile, centred 480px panel from sm up.
 * Closes with Escape or a tap on the scrim.
 */
export function Sheet({ open, onClose, title, description, children }: SheetProps) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    addEventListener("keydown", onKey);
    return () => {
      removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div onClick={onClose} className="fixed inset-0 z-90 flex items-end justify-center bg-scrim sm:items-center">
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="flex w-full flex-col gap-4 rounded-t-md bg-white px-5 pt-6 pb-[calc(32px+env(safe-area-inset-bottom))] shadow-lg outline-none sm:w-[480px] sm:rounded-md sm:p-8"
      >
        <div className="flex flex-col gap-1">
          <h2 className="m-0 type-heading">{title}</h2>
          {description ? <p className="m-0 text-body text-ink-muted">{description}</p> : null}
        </div>
        {children}
      </div>
    </div>
  );
}
