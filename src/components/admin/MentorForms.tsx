"use client";

import { useActionState, useState, useTransition } from "react";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { FormRow } from "@/components/ui/FormLayout";
import { Select } from "@/components/ui/Select";
import { TextInput } from "@/components/ui/TextInput";
import { Toast } from "@/components/ui/Toast";
import { addMentor, setMentorApproved, updateMentor, type AddMentorState, type EditMentorState, type MentorField } from "@/lib/admin/actions";
import { MENTOR_TIME_ZONES } from "@/lib/admin/options";

/** The mentor profile fields, shared by adding and editing. */
function MentorFields({ v, e, zone, setZone }: { v: Record<string, string>; e: Partial<Record<MentorField, string>>; zone: string; setZone: (z: string) => void }) {
  return (
    <>
      <FormRow>
        <TextInput label="Full name" name="fullName" defaultValue={v.fullName} error={e.fullName} />
        <TextInput label="Email" name="email" type="email" inputMode="email" defaultValue={v.email} error={e.email} hint="Also their login email." />
      </FormRow>
      <FormRow columns={3}>
        <TextInput label="University" name="university" placeholder="LSE" defaultValue={v.university} error={e.university} />
        <TextInput label="Course" name="course" placeholder="Economics" defaultValue={v.course} error={e.course} />
        <TextInput label="Year finished" name="yearOrStatus" placeholder="2023 or Final year" defaultValue={v.yearOrStatus} error={e.yearOrStatus} />
      </FormRow>
      <FormRow columns={3}>
        <TextInput label="Home town in Kenya" name="homeTown" placeholder="Nyeri" defaultValue={v.homeTown} error={e.homeTown} />
        <TextInput label="Lives in" name="currentCity" placeholder="London" defaultValue={v.currentCity} error={e.currentCity} />
        <Select label="Time zone" name="timeZone" options={MENTOR_TIME_ZONES} value={zone} onChange={(ev) => setZone(ev.target.value)} error={e.timeZone} />
      </FormRow>
      <TextInput
        label="WhatsApp number"
        name="whatsapp"
        type="tel"
        optional
        placeholder="+44 7700 900123"
        hint="With the country code. Students message them on WhatsApp."
        defaultValue={v.whatsapp}
        error={e.whatsapp}
      />
      <TextInput multiline label="Bio" name="bio" optional hint="A few sentences in their own voice, shown to their students." defaultValue={v.bio} error={e.bio} />
    </>
  );
}

/** Adds a mentor and emails them a link to choose a password. */
export function AddMentorForm() {
  const [state, action, pending] = useActionState<AddMentorState, FormData>(addMentor, {});
  const [approved, setApproved] = useState(true);
  const [zone, setZone] = useState("Europe/London");

  return (
    // A fresh form after each mentor is added
    <form action={action} noValidate key={state.added?.name} className="m-0 flex flex-col gap-4">
      {state.added ? (
        <Banner tone="success" title={`${state.added.name} is added.`}>
          {state.added.emailSent
            ? "We've emailed them a link to choose a password and log in."
            : "The password email didn't send. Ask them to use “Forgot your password?” on the log in page."}
        </Banner>
      ) : null}
      <MentorFields v={state.values ?? {}} e={state.fieldErrors ?? {}} zone={zone} setZone={setZone} />
      <input type="hidden" name="approved" value={approved ? "yes" : ""} />
      <Checkbox checked={approved} onChange={setApproved} label="Approved: they studied there, they're Kenyan, and the team has met them." />
      {state.error ? <Banner tone="error">{state.error}</Banner> : null}
      <Button type="submit" variant="primary" loading={pending} className="self-start">
        {pending ? "Adding the mentor…" : "Add mentor"}
      </Button>
    </form>
  );
}

/** Corrects a mentor's profile. */
export function EditMentorForm({ mentor }: { mentor: Record<MentorField, string> & { id: string } }) {
  const [state, action, pending] = useActionState<EditMentorState, FormData>(updateMentor, {});
  const [zone, setZone] = useState(mentor.timeZone);
  const [toastAt, setToastAt] = useState<number>();
  const [seen, setSeen] = useState(state);
  if (state !== seen) {
    setSeen(state);
    if (state.saved) setToastAt(state.saved);
  }

  return (
    <form action={action} noValidate className="m-0 flex flex-col gap-4">
      {toastAt ? <Toast onDismiss={() => setToastAt(undefined)}>Mentor saved</Toast> : null}
      <input type="hidden" name="mentorId" value={mentor.id} />
      <MentorFields v={state.values ?? mentor} e={state.fieldErrors ?? {}} zone={zone} setZone={setZone} />
      {state.error ? <Banner tone="error">{state.error}</Banner> : null}
      <Button type="submit" variant="primary" loading={pending} className="self-start">
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}

/** Approves or hides a mentor. */
export function ApproveButton({ mentorId, approved }: { mentorId: string; approved: boolean }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();
  return (
    <span className="flex flex-col items-end gap-1">
      <Button
        variant={approved ? "ghost" : "secondary"}
        size="md"
        loading={pending}
        onClick={() => start(async () => setError((await setMentorApproved(mentorId, !approved)).error))}
      >
        {approved ? "Hide from students" : "Approve"}
      </Button>
      {error ? <span className="text-small text-ink">{error}</span> : null}
    </span>
  );
}
