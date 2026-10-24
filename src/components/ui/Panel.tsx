import type { HTMLAttributes, ReactNode, Ref } from "react";
import { cx } from "@/lib/cx";

const TONES = {
  white: "bg-white",
  // Cream on a cream page: website feature cards and inline confirm steps
  cream: "bg-cream",
} as const;

const PADDING = {
  none: "",
  sm: "p-3",
  md: "p-4 sm:p-6",
  lg: "p-6",
  xl: "p-6 sm:p-10",
} as const;

const GAPS = { none: "", sm: "gap-2", md: "gap-3", lg: "gap-4", xl: "gap-6" } as const;

type PanelProps = {
  as?: "section" | "div" | "article" | "li";
  tone?: keyof typeof TONES;
  padding?: keyof typeof PADDING;
  gap?: keyof typeof GAPS;
  /** Shown as an h2 above the content, with an optional description under it. */
  title?: ReactNode;
  description?: ReactNode;
  /** Sits at the end of the header row, next to the title. */
  action?: ReactNode;
  ref?: Ref<HTMLElement>;
  children?: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, "title" | "children">;

/**
 * Bordered box for grouping part of a screen. Unlike Card, it puts no styles on
 * its content, so it can hold forms, lists and anything else.
 */
export function Panel({
  as: Tag = "section",
  tone = "white",
  padding = "md",
  gap = "lg",
  title,
  description,
  action,
  className,
  children,
  ...rest
}: PanelProps) {
  return (
    <Tag
      className={cx("flex flex-col rounded-md border border-line", TONES[tone], PADDING[padding], GAPS[gap], className)}
      {...(rest as HTMLAttributes<HTMLElement>)}
    >
      {title ? (
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="m-0 type-heading">{title}</h2>
            {description ? <p className="m-0 text-body text-ink-muted">{description}</p> : null}
          </div>
          {action}
        </header>
      ) : null}
      {children}
    </Tag>
  );
}
