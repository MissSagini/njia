import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

type Tone = "default" | "tint" | "brand" | "dark";

const TONES: Record<Tone, { box: string; border: string; muted: string; eyebrow: string }> = {
  default: { box: "bg-white text-ink", border: "border-line", muted: "text-ink-muted", eyebrow: "text-forest" },
  // Forest-soft: mentor cards, completed tasks
  tint: { box: "bg-forest-soft text-ink", border: "border-transparent", muted: "text-ink-muted", eyebrow: "text-forest" },
  brand: { box: "bg-forest text-on-forest", border: "border-transparent", muted: "text-on-forest", eyebrow: "text-on-forest" },
  dark: { box: "bg-ink text-cream", border: "border-transparent", muted: "text-cream", eyebrow: "text-ochre" },
};

type CardProps = {
  tone?: Tone;
  /** sm = 16px (mobile), md = 16px on mobile and 24px from sm up, none = no padding. */
  padding?: "sm" | "md" | "none";
  eyebrow?: ReactNode;
  title?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  /** Lifts on hover and shows a focus ring. Use with href or onClick. */
  interactive?: boolean;
  selected?: boolean;
  disabled?: boolean;
  href?: string;
  onClick?: () => void;
  className?: string;
};

export function Card({
  tone = "default",
  padding = "md",
  eyebrow,
  title,
  children,
  footer,
  interactive,
  selected,
  disabled,
  href,
  onClick,
  className,
}: CardProps) {
  const t = TONES[tone];
  const classes = cx(
    "relative flex flex-col overflow-hidden rounded-md font-body text-left no-underline font-normal",
    t.box,
    selected ? "border-2 border-forest" : cx("border", t.border),
    interactive && !disabled &&
      "cursor-pointer transition-[box-shadow,transform,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md hover:no-underline",
    interactive && !disabled && tone === "default" && !selected && "hover:border-ink-muted",
    disabled && "cursor-not-allowed opacity-55",
    className,
  );
  // Selected adds 1px of border, so trim 1px of padding to keep content still
  const pad =
    padding === "none" ? "" : padding === "sm" ? (selected ? "p-[15px]" : "p-4") : selected ? "p-[15px] sm:p-[23px]" : "p-4 sm:p-6";

  const body = (
    <div className={cx("flex flex-1 flex-col gap-2", pad)}>
      {eyebrow ? <div className={cx("type-label", t.eyebrow)}>{eyebrow}</div> : null}
      {title ? <h3 className="m-0 type-heading">{title}</h3> : null}
      {children ? <div className={cx("text-body", t.muted)}>{children}</div> : null}
      {footer ? <div className="mt-auto flex flex-wrap items-center gap-3 pt-3">{footer}</div> : null}
    </div>
  );

  if (interactive && href && !disabled) {
    return (
      <Link href={href} className={cx(classes, "text-inherit")}>
        {body}
      </Link>
    );
  }
  if (interactive && onClick) {
    return (
      <button type="button" onClick={onClick} disabled={disabled} aria-pressed={selected} className={classes}>
        {body}
      </button>
    );
  }
  return <div className={classes}>{body}</div>;
}
