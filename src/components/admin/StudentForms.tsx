"use client";

import { useActionState, useState, type ReactNode } from "react";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { FormRow } from "@/components/ui/FormLayout";
import { Panel } from "@/components/ui/Panel";
import { Select } from "@/components/ui/Select";
import { TextInput } from "@/components/ui/TextInput";
import { Toast } from "@/components/ui/Toast";
import { recordPayment, updateStudentDetails, type EditStudentState, type RecordPaymentState } from "@/lib/admin/actions";
import { formatKenyanPhone } from "@/lib/goals";

type Contact = { fullName: string; email: string; phone: string; school: string | null; parentName: string; parentEmail: string };

/** A student's contact details, with an edit form for the team. */
export function ContactDetails({ studentId, contact }: { studentId: string; contact: Contact }) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState<EditStudentState, FormData>(updateStudentDetails, {});
  const [toastAt, setToastAt] = useState<number>();
  const [seen, setSeen] = useState(state);
  if (state !== seen) {
    setSeen(state);
    if (state.saved) {
      setToastAt(state.saved);
      setEditing(false);
    }
  }

  const toast = toastAt ? <Toast onDismiss={() => setToastAt(undefined)}>Details saved</Toast> : null;
  if (!editing) {
    return (
      <div className="flex flex-col gap-4">
        {toast}
        <dl className="m-0 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Item label="Name">{contact.fullName}</Item>
          <Item label="Email">
            <a href={`mailto:${contact.email}`}>{contact.email}</a>
          </Item>
          <Item label="Phone">
            <a href={`https://wa.me/${contact.phone.replace(/\D/g, "")}`}>{formatKenyanPhone(contact.phone)}</a>
          </Item>
          <Item label="School">{contact.school ?? "Not given"}</Item>
          <Item label="Parent or guardian">
            {contact.parentName}, <a href={`mailto:${contact.parentEmail}`}>{contact.parentEmail}</a>
          </Item>
        </dl>
        <Button variant="outline" size="md" className="self-start" onClick={() => setEditing(true)}>
          Edit details
        </Button>
      </div>
    );
  }

  const v = state.values ?? { ...contact, school: contact.school ?? "" };
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} noValidate className="m-0 flex flex-col gap-4">
      {toast}
      <input type="hidden" name="studentId" value={studentId} />
      <FormRow>
        <TextInput label="Full name" name="fullName" defaultValue={v.fullName} error={e.fullName} />
        <TextInput label="School" name="school" optional defaultValue={v.school ?? ""} error={e.school} />
      </FormRow>
      <FormRow>
        <TextInput label="Email" name="email" type="email" defaultValue={v.email} error={e.email} hint="Also their login email." />
        <TextInput label="Phone" name="phone" type="tel" defaultValue={v.phone} error={e.phone} />
      </FormRow>
      <FormRow>
        <TextInput label="Parent or guardian's name" name="parentName" defaultValue={v.parentName} error={e.parentName} />
        <TextInput label="Parent or guardian's email" name="parentEmail" type="email" defaultValue={v.parentEmail} error={e.parentEmail} />
      </FormRow>
      {state.error ? <Banner tone="error">{state.error}</Banner> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="secondary" size="md" loading={pending}>
          {pending ? "Saving…" : "Save details"}
        </Button>
        <Button variant="ghost" size="md" disabled={pending} onClick={() => setEditing(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

const METHODS = [
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "mpesa", label: "M-Pesa, paid straight to Njia" },
  { value: "cash", label: "Cash" },
];

/** Records money received outside Paystack. */
export function RecordPaymentForm({ studentId, balanceKes }: { studentId: string; balanceKes: number }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<RecordPaymentState, FormData>(recordPayment, {});
  const [toastAt, setToastAt] = useState<number>();
  const [seen, setSeen] = useState(state);
  if (state !== seen) {
    setSeen(state);
    if (state.saved) {
      setToastAt(state.saved);
      setOpen(false);
    }
  }
  const today = new Date().toISOString().slice(0, 10);
  const toast = toastAt ? <Toast onDismiss={() => setToastAt(undefined)}>Payment recorded</Toast> : null;

  if (!open) {
    return (
      <div>
        {toast}
        <Button variant="outline" size="md" onClick={() => setOpen(true)}>
          Record a payment
        </Button>
      </div>
    );
  }

  const v = state.values ?? { amount: String(balanceKes), method: "", paidOn: today, note: "" };
  const e = state.fieldErrors ?? {};
  return (
    <Panel as="div" padding="sm" className="sm:p-4">
    <form action={action} noValidate className="m-0 flex flex-col gap-4">
      {toast}
      <input type="hidden" name="studentId" value={studentId} />
      <p className="m-0 text-body text-ink-muted">
        For money received outside Paystack. Only record it once you&apos;ve seen it arrive.
      </p>
      <FormRow>
        <TextInput label="Amount (KSh)" name="amount" inputMode="numeric" defaultValue={v.amount} error={e.amount} />
        <Select key={`method-${v.method}`} label="How it was paid" name="method" placeholder="Choose" options={METHODS} defaultValue={v.method} error={e.method} />
      </FormRow>
      <FormRow>
        <TextInput label="Day it was paid" name="paidOn" type="date" max={today} defaultValue={v.paidOn} error={e.paidOn} />
        <TextInput label="Reference" name="note" placeholder="Bank or M-Pesa code, or who paid" defaultValue={v.note} error={e.note} />
      </FormRow>
      {state.error ? <Banner tone="error">{state.error}</Banner> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="secondary" size="md" loading={pending}>
          {pending ? "Recording…" : "Record payment"}
        </Button>
        <Button variant="ghost" size="md" disabled={pending} onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
    </Panel>
  );
}

function Item({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-small font-semibold text-ink-muted">{label}</dt>
      <dd className="m-0 text-body break-words text-ink">{children}</dd>
    </div>
  );
}
