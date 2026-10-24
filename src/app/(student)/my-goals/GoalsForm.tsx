"use client";

import { useActionState, useState, type ReactNode } from "react";
import { UniversityPicker } from "@/components/goals/UniversityPicker";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { FormRow } from "@/components/ui/FormLayout";
import { Panel } from "@/components/ui/Panel";
import { Select } from "@/components/ui/Select";
import { TextInput } from "@/components/ui/TextInput";
import { Toast } from "@/components/ui/Toast";
import { EXAM_TYPES, formatKenyanPhone } from "@/lib/goals";
import type { StudentGoals } from "@/lib/students/goals";
import { updateGoals, type EditGoalsState } from "./actions";

export function GoalsForm({ goals }: { goals: StudentGoals }) {
  const [state, action, pending] = useActionState<EditGoalsState, FormData>(updateGoals, {});
  const [toastAt, setToastAt] = useState<number>();
  const [seen, setSeen] = useState(state);
  if (state !== seen) {
    setSeen(state);
    if (state.saved) setToastAt(state.saved);
  }

  // After a rejected save show what was typed; otherwise what's saved
  const v = state.values ?? {
    examType: goals.examType,
    courseInterest: goals.courseInterest,
    dreamUniversities: goals.dreamUniversities.join("\n"),
    parentName: goals.parentName,
    parentEmail: goals.parentEmail,
  };
  const errors = state.fieldErrors ?? {};

  return (
    <form action={action} noValidate className="m-0 flex flex-col gap-6">
      {toastAt ? <Toast onDismiss={() => setToastAt(undefined)}>Goals saved</Toast> : null}

      <Panel title="About you" description="To change these, message us at hello@njia.co.ke.">
        <dl className="m-0 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Detail label="Name">{goals.fullName}</Detail>
          <Detail label="Email">{goals.email}</Detail>
          <Detail label="Phone">{formatKenyanPhone(goals.phone)}</Detail>
          <Detail label="School">{goals.school ?? "Not given"}</Detail>
        </dl>
      </Panel>

      <Panel title="Your goals">
        <FormRow>
          <Select
            key={`exam-${v.examType}-${state.saved ?? ""}`}
            label="Exams you're taking"
            name="examType"
            options={[...EXAM_TYPES]}
            defaultValue={v.examType}
            error={errors.examType}
          />
          <TextInput label="Course you'd like to study" name="courseInterest" defaultValue={v.courseInterest} error={errors.courseInterest} />
        </FormRow>
        <UniversityPicker initial={v.dreamUniversities} error={errors.dreamUniversities} />
      </Panel>

      <Panel title="Your parent or guardian" description="They get a short progress report each week.">
        <FormRow>
          <TextInput label="Their name" name="parentName" defaultValue={v.parentName} error={errors.parentName} />
          <TextInput label="Their email" name="parentEmail" type="email" inputMode="email" defaultValue={v.parentEmail} error={errors.parentEmail} />
        </FormRow>
      </Panel>

      {state.error ? <Banner tone="error">{state.error}</Banner> : null}
      <Button type="submit" variant="primary" fullWidth loading={pending}>
        {pending ? "Saving your goals…" : "Save changes"}
      </Button>
    </form>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-small font-semibold text-ink-muted">{label}</dt>
      <dd className="m-0 text-body break-words text-ink">{children}</dd>
    </div>
  );
}
