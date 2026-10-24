"use client";

import { useActionState, useState } from "react";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { TextInput } from "@/components/ui/TextInput";
import { Toast } from "@/components/ui/Toast";
import { updateCall, type CallState } from "@/lib/admin/actions";

const STATUSES = [
  { value: "booked", label: "Booked" },
  { value: "completed", label: "Held" },
  { value: "no_show", label: "Didn't join" },
  { value: "cancelled", label: "Cancelled (frees the time)" },
];

/** The free call's Meet link and how it went. */
export function CallEditor({ consultationId, meetLink, status }: { consultationId: string; meetLink: string | null; status: string }) {
  const [state, action, pending] = useActionState<CallState, FormData>(updateCall, {});
  const [link, setLink] = useState(meetLink ?? "");
  const [value, setValue] = useState(status);
  const [toastAt, setToastAt] = useState<number>();
  const [seen, setSeen] = useState(state);
  if (state !== seen) {
    setSeen(state);
    if (state.saved) setToastAt(state.saved);
  }

  return (
    <form action={action} className="m-0 flex flex-col gap-3">
      {toastAt ? <Toast onDismiss={() => setToastAt(undefined)}>Call saved</Toast> : null}
      <input type="hidden" name="consultationId" value={consultationId} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_200px]">
        <TextInput
          label="Meet link"
          name="meetLink"
          type="url"
          inputMode="url"
          placeholder="https://meet.google.com/abc-defg-hij"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          error={state.fieldErrors?.meetLink}
          hint="When you save a new link, we email it to the student and parent."
        />
        <Select label="Status" name="status" options={STATUSES} value={value} onChange={(e) => setValue(e.target.value)} />
      </div>
      {state.error ? <Banner tone="error">{state.error}</Banner> : null}
      {state.notice ? <Banner tone={state.notice.includes("didn't go") ? "error" : "success"}>{state.notice}</Banner> : null}
      <Button type="submit" variant="secondary" size="md" loading={pending} className="self-start">
        {pending ? "Saving…" : "Save call"}
      </Button>
    </form>
  );
}
