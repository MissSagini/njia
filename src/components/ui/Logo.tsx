import Image from "next/image";
import { cx } from "@/lib/cx";

const FILES = {
  light: "/brand/njia-lockup.svg",
  dark: "/brand/njia-lockup-dark.svg",
  icon: "/brand/njia-app-icon.svg",
} as const;

const RATIO = { light: 452 / 199, dark: 452 / 199, icon: 1 } as const;

type LogoProps = {
  /** light: on Cream, White, Forest-soft. dark: on Ink, Forest, dark photos. icon: below 80px. */
  variant?: keyof typeof FILES;
  width?: number;
  alt?: string;
  className?: string;
  priority?: boolean;
};

/** Places the supplied SVG files as-is. Never redraws or recolours the mark. */
export function Logo({ variant = "light", width, alt = "Njia", className, priority }: LogoProps) {
  let w = width ?? (variant === "icon" ? 40 : 120);
  if (variant !== "icon" && w < 80) w = 80; // brand rule: the lockup is at least 80px wide
  const h = Math.round(w / RATIO[variant]);
  return (
    <Image
      src={FILES[variant]}
      alt={alt}
      width={Math.round(w)}
      height={h}
      className={cx("block", className)}
      style={{ width: w, height: h }}
      priority={priority}
      unoptimized
    />
  );
}
