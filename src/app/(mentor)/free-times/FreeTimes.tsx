"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormRow } from "@/components/ui/FormLayout";
import { Icon } from "@/components/ui/Icon";
import { Select } from "@/components/ui/Select";
import { TextInput } from "@/components/ui/TextInput";
import { Toast } from "@/components/ui/Toast";
import { addFreeTimes, removeFreeTime, type FreeTimeState } from "@/lib/sessions/actions";
import { dayKey, formatLongDay, formatTime } from "@/lib/time";

type Time = { id: string; startsAt: string; endsAt: string; bookedBy: string | null };

/** Every half hour from 6 am to 10 pm, in the mentor's zone. */
const START_TIMES = Array.from({ length: 33 }, (_, i) => {
  const minutes = 6 * 60 + i * 30;
  const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mm = String(minutes % 60).padStart(2, "0");
  const h12 = ((Math.floor(minutes / 60) + 11) % 12) + 1;
  return { value: `${hh}:${mm}`, label: `${h12}:${mm} ${minutes < 720 ? "am" : "pm"}` };
});

const REPEATS = [
  { value: "1", label: "Just this once" },
  { value: "2", label: "Every week for 2 weeks" },
  { value: "4", label: "Every week for 4 weeks" },
  { value: "8", label: "Every week for 8 weeks" },
  { value: "12", label: "Every week for 12 weeks" },
];

export function FreeTimes({ timeZone, times }: { timeZone: string; times: Time[] }) {
  const [state, action, pending] = useActionState<FreeTimeState, FormData>(addFreeTimes, {});
  const [toast, setToast] = useState<string>();
  // Controlled, so a failed submit doesn't clear them
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [repeat, setRepeat] = useState("1");
  const [seen, setSeen] = useState(state);
  if (state !== seen) {
    setSeen(state);
    if (state.added !== undefined) {
      const skipped = state.skipped ? ` (${state.skipped} already there)` : "";
      setToast(state.added === 1 ? `Free time added${skipped}` : `${state.added} free times added${skipped}`);
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  // "London time": a city stays right across daylight-saving changes, unlike "BST"
  const zone = `${timeZone.split("/").pop()?.replace(/_/g, " ")} time`;
  const days = useMemo(() => {
    const byDay = new Map<string, Time[]>();
    for (const t of times) byDay.set(dayKey(t.startsAt, timeZone), [...(byDay.get(dayKey(t.startsAt, timeZone)) ?? []), t]);
    return [...byDay.values()];
  }, [times, timeZone]);

  return (
    <div className="flex flex-col gap-8">
      {toast ? <Toast onDismiss={() => setToast(undefined)}>{toast}</Toast> : null}

      <form action={action} className="m-0 flex flex-col gap-4 rounded-md border border-line bg-white p-4 sm:p-6">
        <header className="flex flex-col gap-1">
          <h2 className="m-0 type-heading">Add a free time</h2>
          <p className="m-0 text-body text-ink-muted">Times are in {zone}. Students see them in East Africa Time.</p>
        </header>
        <FormRow columns={3}>
          <TextInput label="Day" name="date" type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} error={state.fieldErrors?.date} />
          <Select label="Start time" name="time" placeholder="Choose" options={START_TIMES} value={time} onChange={(e) => setTime(e.target.value)} error={state.fieldErrors?.time} />
          <Select label="Repeat" name="repeatWeeks" options={REPEATS} value={repeat} onChange={(e) => setRepeat(e.target.value)} />
        </FormRow>
        {state.error ? <Banner tone="error">{state.error}</Banner> : null}
        <Button type="submit" variant="primary" loading={pending} className="self-start">
          {pending ? "Adding your free time…" : "Add free time"}
        </Button>
      </form>

      <section className="flex flex-col gap-4">
        <h2 className="m-0 type-heading">Your upcoming free times</h2>
        {days.length === 0 ? (
          <EmptyState icon="calendar" title="No free times yet.">
            Add a few times above so your students can book their next session.
          </EmptyState>
        ) : (
          days.map((list) => <Day key={list[0].id} times={list} timeZone={timeZone} />)
        )}
      </section>
    </div>
  );
}

function Day({ times, timeZone }: { times: Time[]; timeZone: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();
  return (
    <div className="flex flex-col rounded-md border border-line bg-white px-4 py-2 sm:px-6">
      <h3 className="m-0 py-2 font-heading text-[18px] leading-[26px] font-semibold">{formatLongDay(times[0].startsAt, timeZone)}</h3>
      <ul className="m-0 flex list-none flex-col p-0">
        {times.map((t) => (
          <li key={t.id} className="flex min-h-12 items-center justify-between gap-3 border-t border-line">
            <span className="flex flex-wrap items-center gap-2">
              <Icon name="clock" size={18} color="var(--color-forest)" />
              {formatTime(t.startsAt, timeZone)} to {formatTime(t.endsAt, timeZone)}
              {t.bookedBy ? <Badge variant="tag">Booked by {t.bookedBy.split(" ")[0]}</Badge> : null}
            </span>
            {t.bookedBy ? null : (
              <Button
                variant="ghost"
                size="md"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    setError((await removeFreeTime(t.id)).error);
                  })
                }
              >
                Remove
              </Button>
            )}
          </li>
        ))}
      </ul>
      {error ? <Banner tone="error" className="mb-2">{error}</Banner> : null}
    </div>
  );
}
