"use client";

import { useActionState, useState, useTransition } from "react";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { ChoiceChip } from "@/components/ui/ChoiceChip";
import { FieldHelp } from "@/components/ui/Field";
import { FormGroup, FormRow } from "@/components/ui/FormLayout";
import { Select } from "@/components/ui/Select";
import { TextInput } from "@/components/ui/TextInput";
import { Toast } from "@/components/ui/Toast";
import { addCallTimes, removeCallTime, type CallTimeState } from "@/lib/admin/actions";

/** Half-hourly from 8 am to 8 pm EAT. */
const TIMES = Array.from({ length: 25 }, (_, i) => {
  const minutes = 8 * 60 + i * 30;
  const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mm = String(minutes % 60).padStart(2, "0");
  const h12 = ((Math.floor(minutes / 60) + 11) % 12) + 1;
  return { value: `${hh}:${mm}`, label: `${h12}:${mm} ${minutes < 720 ? "am" : "pm"}` };
});

const REPEATS = [
  { value: "1", label: "Just this day" },
  { value: "2", label: "Same times for 2 weeks" },
  { value: "4", label: "Same times for 4 weeks" },
  { value: "8", label: "Same times for 8 weeks" },
];

/** Add free call times: a day, one or more times, optionally repeated weekly. */
export function CallTimesForm() {
  const [state, action, pending] = useActionState<CallTimeState, FormData>(addCallTimes, {});
  const [date, setDate] = useState("");
  const [times, setTimes] = useState<string[]>([]);
  const [repeat, setRepeat] = useState("1");
  const [toast, setToast] = useState<string>();
  const [seen, setSeen] = useState(state);
  if (state !== seen) {
    setSeen(state);
    if (state.added !== undefined) {
      setTimes([]);
      const skipped = state.skipped ? ` (${state.skipped} already there)` : "";
      setToast(`${state.added} call ${state.added === 1 ? "time" : "times"} added${skipped}`);
    }
  }

  const toggle = (t: string) => setTimes((list) => (list.includes(t) ? list.filter((x) => x !== t) : [...list, t].sort()));

  return (
    <form action={action} className="m-0 flex flex-col gap-4">
      {toast ? <Toast onDismiss={() => setToast(undefined)}>{toast}</Toast> : null}
      {times.map((t) => (
        <input key={t} type="hidden" name="time" value={t} />
      ))}
      <FormRow>
        <TextInput label="Day" name="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} error={state.fieldErrors?.date} />
        <Select label="Repeat" name="repeatWeeks" options={REPEATS} value={repeat} onChange={(e) => setRepeat(e.target.value)} />
      </FormRow>
      <FormGroup legend="Times (EAT), 30 minutes each" className="gap-2">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-7">
          {TIMES.map((t) => (
            <ChoiceChip key={t.value} label={t.label} selected={times.includes(t.value)} onPick={() => toggle(t.value)} />
          ))}
        </div>
        <FieldHelp id="call-times-help" error={state.fieldErrors?.time} />
      </FormGroup>
      {state.error ? <Banner tone="error">{state.error}</Banner> : null}
      <Button type="submit" variant="primary" loading={pending} className="self-start">
        {pending ? "Adding call times…" : times.length > 1 ? `Add ${times.length} call times` : "Add call time"}
      </Button>
    </form>
  );
}

/** Removes an open call time. */
export function RemoveCallTime({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();
  return (
    <span className="flex flex-col items-end">
      <Button variant="ghost" size="md" disabled={pending} onClick={() => start(async () => setError((await removeCallTime(id)).error))}>
        Remove
      </Button>
      {error ? <span className="text-small text-ink">{error}</span> : null}
    </span>
  );
}
