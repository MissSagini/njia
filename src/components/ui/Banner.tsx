import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import { Icon, type IconName } from "./Icon";

type BannerProps = {
  tone?: "info" | "error" | "success";
  title?: ReactNode;
  children: ReactNode;
  icon?: IconName;
  /** Optional action, such as a "Try again" button. */
  action?: ReactNode;
  className?: string;
};

/** Error text stays Ink next to a Sunset border and icon: Sunset fails contrast at small sizes. */
export function Banner({ tone = "info", title, children, icon, action, className }: BannerProps) {
  const name: IconName = icon ?? (tone === "error" ? "alert-circle" : tone === "success" ? "check" : "smartphone");
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cx(
        "flex items-start gap-3 rounded-md px-4 py-3",
        tone === "success" ? "border border-transparent bg-forest-soft" : "bg-white",
        tone === "error" ? "border-2 border-sunset" : tone === "info" && "border border-line",
        className,
      )}
    >
      <Icon name={name} color={tone === "error" ? "var(--color-sunset)" : "var(--color-forest)"} style={{ marginTop: 3 }} />
      <div className="flex flex-1 flex-col gap-0.5 text-body text-ink">
        {title ? <strong className="font-bold">{title}</strong> : null}
        <span>{children}</span>
        {action ? <div className="pt-2">{action}</div> : null}
      </div>
    </div>
  );
}
