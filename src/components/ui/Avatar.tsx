import { cx } from "@/lib/cx";

type AvatarProps = {
  initials: string;
  size?: number;
  tone?: "forest" | "soft";
  className?: string;
};

/** Initials in a circle. 64px and up switch to the Fraunces heading face. */
export function Avatar({ initials, size = 40, tone = "forest", className }: AvatarProps) {
  const large = size >= 64;
  return (
    <div
      aria-hidden
      className={cx(
        "flex flex-none items-center justify-center rounded-pill",
        tone === "soft" ? "bg-forest-soft text-forest" : "bg-forest text-white",
        large ? "font-heading font-semibold" : "font-body font-bold",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.max(14, Math.round(size * 0.36)) }}
    >
      {initials}
    </div>
  );
}
