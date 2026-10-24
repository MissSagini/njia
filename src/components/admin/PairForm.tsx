"use client";

import { useActionState, useState } from "react";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Toast } from "@/components/ui/Toast";
import { pairStudent, type PairState } from "@/lib/admin/actions";

type MentorOption = { id: string; fullName: string; university: string; course: string; studentCount: number };

/** Pair a student with an approved mentor, or move them to another. */
export function PairForm({ studentId, currentMentorId, mentors, unpaid }: { studentId: string; currentMentorId: string | null; mentors: MentorOption[]; unpaid: boolean }) {
  const [state, action, pending] = useActionState<PairState, FormData>(pairStudent, {});
  const [mentorId, setMentorId] = useState(currentMentorId ?? "");
  const [toastAt, setToastAt] = useState<number>();
  const [seen, setSeen] = useState(state);
  if (state !== seen) {
    setSeen(state);
    if (state.paired) setToastAt(state.paired);
  }

  if (mentors.length === 0) {
    return <Banner tone="info" icon="users">There are no approved mentors yet. Add or approve one on the Mentors page.</Banner>;
  }

  return (
    <form action={action} className="m-0 flex flex-col gap-4">
      {toastAt ? <Toast onDismiss={() => setToastAt(undefined)}>Mentor saved</Toast> : null}
      <input type="hidden" name="studentId" value={studentId} />
      {unpaid && !currentMentorId ? (
        <Banner tone="info" icon="credit-card">
          This student hasn&apos;t paid yet. Usually you pair after payment.
        </Banner>
      ) : null}
      <Select
        label="Mentor"
        name="mentorId"
        placeholder="Choose a mentor"
        value={mentorId}
        onChange={(e) => setMentorId(e.target.value)}
        options={mentors.map((m) => ({
          value: m.id,
          label: `${m.fullName}, ${m.university} ${m.course} (${m.studentCount} ${m.studentCount === 1 ? "student" : "students"})`,
        }))}
      />
      {state.error ? <Banner tone="error">{state.error}</Banner> : null}
      {state.notice ? <Banner tone={state.notice.includes("didn't go") ? "error" : "success"}>{state.notice}</Banner> : null}
      <Button type="submit" variant="primary" loading={pending} disabled={!mentorId || mentorId === currentMentorId} className="self-start">
        {pending ? "Pairing…" : currentMentorId ? "Change mentor" : "Pair with this mentor"}
      </Button>
    </form>
  );
}
