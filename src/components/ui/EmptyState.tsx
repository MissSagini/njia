import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import { Icon, type IconName } from "./Icon";

type EmptyStateProps = {
  icon?: IconName;
  title: ReactNode;
  /** One sentence naming what comes next. */
  children: ReactNode;
  /** The one action that fills the space, such as "Book your first session". */
  action?: ReactNode;
  headingLevel?: "h1" | "h2";
  className?: string;
};

export function EmptyState({ icon = "compass", title, children, action, headingLevel = "h2", className }: EmptyStateProps) {
  const Heading = headingLevel;
  return (
    <div className={cx("flex flex-col items-center gap-3 rounded-md border border-line bg-white px-6 py-10 text-center", className)}>
      <div className="flex size-14 items-center justify-center rounded-pill bg-forest-soft">
        <Icon name={icon} size={24} color="var(--color-forest)" />
      </div>
      <Heading className="m-0 type-heading">{title}</Heading>
      <p className="m-0 max-w-[420px] text-body text-pretty text-ink-muted">{children}</p>
      {action ? <div className="pt-2">{action}</div> : null}
    </div>
  );
}
