import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import { Icon, type IconName } from "./Icon";

const VARIANTS = {
  tag: "bg-forest-soft text-forest border-transparent",
  forest: "bg-forest text-on-forest border-transparent",
  ochre: "bg-ochre text-ink border-transparent",
  neutral: "bg-white text-ink-muted border-line",
  dark: "bg-ink text-cream border-transparent",
} as const;

type BadgeProps = {
  variant?: keyof typeof VARIANTS;
  shape?: "pill" | "square";
  icon?: IconName;
  dot?: boolean;
  children: ReactNode;
  className?: string;
};

export function Badge({ variant = "tag", shape = "pill", icon, dot, children, className }: BadgeProps) {
  return (
    <span
      className={cx(
        "inline-flex h-[26px] items-center gap-1.5 border px-2.5 font-body whitespace-nowrap type-label",
        shape === "pill" ? "rounded-pill" : "rounded-sm",
        VARIANTS[variant],
        className,
      )}
    >
      {dot ? <span className="size-1.5 rounded-pill bg-current" /> : null}
      {icon ? <Icon name={icon} size={14} strokeWidth={2.25} /> : null}
      {children}
    </span>
  );
}
