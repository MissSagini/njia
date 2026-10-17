import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import { Icon } from "./Icon";

export function FieldLabel({ htmlFor, optional, children }: { htmlFor: string; optional?: boolean; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="flex items-baseline gap-1.5 font-body text-[15px] leading-[22px] font-semibold text-ink">
      {children}
      {optional ? <span className="text-small font-normal text-ink-muted">(optional)</span> : null}
    </label>
  );
}

/** Error (one plain sentence in Ink, next to a Sunset icon) or hint below a field. */
export function FieldHelp({ id, error, hint }: { id: string; error?: ReactNode; hint?: ReactNode }) {
  if (error) {
    return (
      <div id={id} role="alert" className="flex items-start gap-1.5 text-small text-ink">
        <Icon name="alert-circle" size={16} color="var(--color-sunset)" style={{ marginTop: 3 }} />
        {error}
      </div>
    );
  }
  if (hint) {
    return (
      <div id={id} className="text-small text-ink-muted">
        {hint}
      </div>
    );
  }
  return null;
}

/** Border and ring states shared by text inputs and selects. */
export function fieldBoxClasses({ error, disabled }: { error?: boolean; disabled?: boolean }) {
  return cx(
    "rounded-sm border transition-[border-color,box-shadow] duration-120",
    disabled
      ? "cursor-not-allowed border-line bg-cream"
      : error
        ? "border-sunset bg-white focus-within:shadow-focus-error"
        : "border-line bg-white hover:border-ink-muted focus-within:border-forest focus-within:shadow-focus",
  );
}
