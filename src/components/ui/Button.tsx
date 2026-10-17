import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/cx";
import { Icon, type IconName } from "./Icon";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "inverse";

const VARIANTS: Record<ButtonVariant, string> = {
  // Sunset: once per screen, for the next step
  primary: "bg-sunset text-on-forest border-transparent hover:bg-sunset-hover hover:shadow-md",
  secondary: "bg-forest text-on-forest border-transparent hover:bg-forest-hover hover:shadow-md",
  outline: "bg-white text-forest border-forest hover:bg-forest-soft",
  ghost: "bg-transparent text-forest border-transparent hover:bg-forest-soft",
  inverse: "bg-cream text-forest border-transparent hover:bg-white focus-visible:outline-cream",
};

type ButtonProps = {
  variant?: ButtonVariant;
  /** Primary is always lg, so White on Sunset stays at 19px bold. */
  size?: "lg" | "md";
  iconLeft?: IconName;
  iconRight?: IconName;
  fullWidth?: boolean;
  /** Shows a spinner and disables the button. Pair with a present-tense label, like "Booking your call…". */
  loading?: boolean;
  /** Renders a link. Internal paths use next/link. */
  href?: string;
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">;

export function Button({
  variant = "primary",
  size = "lg",
  iconLeft,
  iconRight,
  fullWidth,
  loading,
  disabled,
  href,
  type = "button",
  className,
  children,
  ...rest
}: ButtonProps) {
  const lg = variant === "primary" || size === "lg";
  const inactive = disabled || loading;
  const iconSize = lg ? 20 : 18;

  const classes = cx(
    "items-center justify-center gap-2.5 rounded-md border-[1.5px] font-body font-bold whitespace-nowrap no-underline",
    "transition-[background-color,box-shadow,transform] duration-120 ease-out",
    "active:translate-y-px active:shadow-none hover:no-underline",
    fullWidth ? "flex w-full" : "inline-flex",
    lg ? "min-h-[52px] px-7 py-3.5 text-button" : "min-h-11 px-5 py-2.5 text-[16px] leading-[22px]",
    disabled
      ? cx("cursor-not-allowed border-transparent text-ink-muted", variant === "ghost" ? "bg-transparent" : "bg-line")
      : VARIANTS[variant],
    loading && "cursor-progress opacity-85",
    className,
  );

  const content = (
    <>
      {loading ? (
        <span
          aria-hidden
          className="animate-spin rounded-pill border-2 border-current border-r-transparent"
          style={{ width: iconSize - 4, height: iconSize - 4 }}
        />
      ) : iconLeft ? (
        <Icon name={iconLeft} size={iconSize} />
      ) : null}
      <span>{children}</span>
      {iconRight && !loading ? <Icon name={iconRight} size={iconSize} /> : null}
    </>
  );

  if (href && !inactive) {
    if (href.startsWith("/")) {
      return (
        <Link href={href} className={classes}>
          {content}
        </Link>
      );
    }
    return (
      <a href={href} className={classes}>
        {content}
      </a>
    );
  }

  return (
    <button type={type} disabled={inactive} aria-busy={loading || undefined} className={classes} {...rest}>
      {content}
    </button>
  );
}
