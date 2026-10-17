import type { ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import type { IconName } from "@/components/ui/Icon";
import { PathMotif } from "@/components/ui/PathMotif";

/** Stand-in for a website page that hasn't been built yet. */
export function SitePlaceholder({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mx-auto flex w-full max-w-site flex-col gap-6 px-5 py-10 lg:px-10 lg:py-24">
      <PathMotif />
      <Badge variant="neutral" shape="square" className="self-start">
        Page in progress
      </Badge>
      <h1 className="m-0 max-w-[16ch] type-display">{title}</h1>
      <p className="m-0 max-w-[60ch] text-body-lg text-ink-muted">{children}</p>
    </section>
  );
}

/** Stand-in for a platform screen that hasn't been built yet. */
export function AppPlaceholder({ title, icon, children }: { title: string; icon: IconName; children: ReactNode }) {
  return (
    <section className="mx-auto flex w-full max-w-app flex-col gap-6 px-5 py-8 lg:px-10 lg:py-12">
      <h1 className="m-0 type-title">{title}</h1>
      <EmptyState icon={icon} title="This screen is in progress.">
        {children}
      </EmptyState>
    </section>
  );
}
