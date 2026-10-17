import type { FormHTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/cx";

type FormLayoutProps = {
  eyebrow?: string;
  title?: ReactNode;
  description?: ReactNode;
  step?: number;
  totalSteps?: number;
  actions?: ReactNode;
  footnote?: ReactNode;
  /** card: White panel on Cream. plain: no panel. */
  surface?: "card" | "plain";
  children: ReactNode;
  className?: string;
} & Omit<FormHTMLAttributes<HTMLFormElement>, "title" | "className">;

/** Form shell: header, 16px between fields, then actions. */
export function FormLayout({
  eyebrow,
  title,
  description,
  step,
  totalSteps,
  actions,
  footnote,
  surface = "card",
  children,
  className,
  ...rest
}: FormLayoutProps) {
  const card = surface === "card";
  const kicker = step ? `Step ${step}${totalSteps ? ` of ${totalSteps}` : ""}${eyebrow ? ` · ${eyebrow}` : ""}` : eyebrow;

  return (
    <form
      {...rest}
      className={cx(
        "flex w-full max-w-[560px] flex-col gap-6 font-body",
        card && "rounded-md border border-line bg-white p-4 sm:p-6",
        className,
      )}
    >
      {title || kicker ? (
        <header className="flex flex-col gap-1.5">
          {kicker ? <div className="type-label text-forest">{kicker}</div> : null}
          {title ? <h2 className="m-0 type-heading text-ink">{title}</h2> : null}
          {description ? <p className="m-0 text-body text-ink-muted">{description}</p> : null}
        </header>
      ) : null}
      <div className="flex flex-col gap-4">{children}</div>
      {actions ? <div className="flex flex-wrap items-center gap-3 pt-2">{actions}</div> : null}
      {footnote ? <p className="m-0 text-small text-ink-muted">{footnote}</p> : null}
    </form>
  );
}

/** Two (or three) columns on desktop, one on mobile. */
export function FormRow({ columns = 2, children, className }: { columns?: 2 | 3; children: ReactNode; className?: string }) {
  return (
    <div
      className={cx(
        "grid gap-4",
        columns === 3
          ? "grid-cols-[repeat(auto-fit,minmax(140px,1fr))]"
          : "grid-cols-[repeat(auto-fit,minmax(200px,1fr))]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Groups related checkboxes or chips under a legend. */
export function FormGroup({ legend, hint, children, className }: { legend?: ReactNode; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <fieldset className={cx("m-0 flex flex-col gap-0.5 border-0 p-0", className)}>
      {legend ? <legend className="mb-0.5 p-0 text-[15px] leading-[22px] font-semibold text-ink">{legend}</legend> : null}
      {hint ? <div className="text-small text-ink-muted">{hint}</div> : null}
      {children}
    </fieldset>
  );
}
