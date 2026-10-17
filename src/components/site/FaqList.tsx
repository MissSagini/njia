"use client";

import { useId, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { cx } from "@/lib/cx";

/** Accordion of questions. One answer open at a time; the first starts open. */
export function FaqList({ items }: { items: { question: string; answer: string }[] }) {
  const [open, setOpen] = useState(0);
  const baseId = useId();

  return (
    <div className="flex max-w-[860px] flex-col gap-2">
      {items.map((item, i) => {
        const expanded = open === i;
        const panelId = `${baseId}-${i}`;
        return (
          <div key={item.question} className="rounded-md border border-line bg-white">
            <h3 className="m-0">
              <button
                type="button"
                onClick={() => setOpen(expanded ? -1 : i)}
                aria-expanded={expanded}
                aria-controls={panelId}
                className="flex min-h-14 w-full cursor-pointer items-center justify-between gap-4 rounded-md border-0 bg-transparent px-5 py-3 text-left font-body text-body-lg font-bold text-ink"
              >
                {item.question}
                <Icon
                  name="chevron-down"
                  color="var(--color-forest)"
                  className={cx("transition-transform duration-150 ease-out", expanded && "rotate-180")}
                />
              </button>
            </h3>
            {expanded ? (
              <p id={panelId} className="m-0 px-5 pb-4 text-body text-ink-muted">
                {item.answer}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
