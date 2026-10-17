"use client";

import { useEffect } from "react";
import { Icon } from "./Icon";

type ToastProps = {
  children: string;
  /** Called after 3 seconds. */
  onDismiss?: () => void;
};

/**
 * Ink bar with an Ochre check. Sits above the mobile tab bar (88px up) and
 * 24px from the bottom on desktop. Render it only while it should show.
 */
export function Toast({ children, onDismiss }: ToastProps) {
  useEffect(() => {
    if (!onDismiss) return;
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-[calc(88px+env(safe-area-inset-bottom))] left-1/2 z-80 flex w-[min(360px,calc(100%-40px))] -translate-x-1/2 items-center gap-3 rounded-md bg-ink px-4 py-3 text-cream shadow-lg lg:bottom-6"
    >
      <div className="flex size-7 flex-none items-center justify-center rounded-pill bg-ochre">
        <Icon name="check" size={16} color="var(--color-ink)" />
      </div>
      <div className="text-body font-semibold">{children}</div>
    </div>
  );
}
