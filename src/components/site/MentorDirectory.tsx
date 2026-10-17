"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ChoiceChip } from "@/components/ui/ChoiceChip";
import { EmptyState } from "@/components/ui/EmptyState";
import { UNIVERSITIES, type Mentor, type University } from "@/content/mentors";
import { MentorCard } from "./MentorCard";

type Filter = "All" | University;
const FILTERS: Filter[] = ["All", ...UNIVERSITIES];

/** University filter chips and the mentor grid, with an empty state for universities without mentors yet. */
export function MentorDirectory({ mentors }: { mentors: Mentor[] }) {
  const [uni, setUni] = useState<Filter>("All");
  const shown = mentors.filter((m) => uni === "All" || m.university === uni);

  return (
    <>
      <div role="group" aria-labelledby="filter-label" className="flex flex-col gap-2">
        <span id="filter-label" className="text-body font-semibold">
          Show mentors from
        </span>
        {/* Mobile: one scrolling row that runs to the screen edge. Desktop: wraps. */}
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pt-0.5 pb-1.5 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:p-0">
          {FILTERS.map((f) => (
            <div key={f} className="flex-none">
              <ChoiceChip label={f} selected={uni === f} onPick={() => setUni(f)} />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 lg:mt-12">
        {shown.length === 0 ? (
          <div className="flex max-w-[560px] flex-col gap-4">
            <EmptyState icon="graduation-cap" title={`No ${uni} mentors yet.`}>
              We&apos;re adding mentors every month. Book a free call and we&apos;ll find someone who studied a similar
              course nearby.
            </EmptyState>
            <Button variant="secondary" onClick={() => setUni("All")} className="w-full sm:w-auto sm:self-start">
              Show all mentors
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
            {shown.map((m) => (
              <MentorCard key={m.name} initials={m.initials} name={m.name} study={m.study} from={m.from} bio={m.quote} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
