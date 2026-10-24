"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useRef, useState, type Ref } from "react";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { ChoiceChip } from "@/components/ui/ChoiceChip";
import { FieldHelp } from "@/components/ui/Field";
import { FormGroup, FormRow } from "@/components/ui/FormLayout";
import { Icon } from "@/components/ui/Icon";
import { Panel } from "@/components/ui/Panel";
import { UniversityPicker } from "@/components/goals/UniversityPicker";
import { PackageSummaryCard } from "@/components/payments/PackageSummaryCard";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { TextInput } from "@/components/ui/TextInput";
import { EXAM_TYPES, START_PATHS, type StartPath } from "@/lib/goals";
import { dayKeyEat, formatDayEat, formatLongDayEat, formatTimeEat } from "@/lib/time";
import { submitGoals, type GoalsState } from "./actions";
import type { CallSlot, PackageSummary } from "./data";

type Props = {
  initialPath: StartPath;
  /** Null when the times couldn't be loaded. */
  slots: CallSlot[] | null;
  pkg: PackageSummary | null;
};

const paths = [
  {
    value: START_PATHS.call,
    query: "call",
    title: "Start with a free call",
    text: "Not sure yet? Talk it through with us for 30 minutes first. Free, and parents are welcome.",
  },
  {
    value: START_PATHS.apply,
    query: "apply",
    title: "Apply now",
    text: "Already know what you need? Skip the call, pay, and we pair you with a mentor within 2 days.",
  },
] as const;

export function GetStartedForm({ initialPath, slots, pkg }: Props) {
  const [state, action, pending] = useActionState<GoalsState, FormData>(submitGoals, {});
  const [path, setPath] = useState<StartPath>(initialPath);
  const [consent, setConsent] = useState(false);
  const values = state.values ?? {};
  const errors = state.fieldErrors ?? {};
  const top = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Scroll to the confirmation, or to the first problem, after each submit
  useEffect(() => {
    if (state.done?.payUrl) router.push(state.done.payUrl);
    else if (state.done) top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    else if (state.error || state.fieldErrors) {
      document.querySelector<HTMLElement>("[aria-invalid='true'], [data-error='true']")?.focus();
    }
  }, [state, router]);

  function choosePath(next: StartPath) {
    setPath(next);
    const query = paths.find((p) => p.value === next)?.query;
    window.history.replaceState(null, "", `?path=${query}`);
  }

  if (state.done?.payUrl) return <Skeleton label="Opening the payment page" rows={2} />;
  if (state.done) return <Confirmation ref={top} done={state.done} />;

  const isCall = path === START_PATHS.call;

  return (
    <form action={action} noValidate className="m-0 flex flex-col gap-6">
      <div ref={top} />
      <input type="hidden" name="path" value={path} />
      {/* Left empty by people; bots fill it in */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="sr-only" />

      <fieldset className="m-0 flex flex-col gap-3 border-0 p-0">
        <legend className="mb-3 p-0 type-heading">How would you like to start?</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {paths.map((p) => (
            <Card key={p.value} interactive selected={path === p.value} onClick={() => choosePath(p.value)} title={p.title}>
              {p.text}
            </Card>
          ))}
        </div>
      </fieldset>

      <Panel title="About you">
        <TextInput label="Full name" name="fullName" autoComplete="name" defaultValue={values.fullName} error={errors.fullName} />
        <FormRow>
          <TextInput
            label="Email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            defaultValue={values.email}
            error={
              state.emailTaken ? (
                <span>
                  This email already has a Njia account. <Link href="/log-in">Log in</Link> to carry on. If you haven&apos;t set a
                  password yet, use <Link href="/forgot-password">Forgot your password?</Link>
                </span>
              ) : (
                errors.email
              )
            }
          />
          <TextInput
            label="Phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="0712 345 678"
            defaultValue={values.phone}
            error={errors.phone}
          />
        </FormRow>
        <TextInput label="School" name="school" optional autoComplete="organization" defaultValue={values.school} error={errors.school} />
      </Panel>

      <Panel title="Your goals">
        <FormRow>
          <Select
            // Remount with what was sent: React's post-submit form reset would otherwise blank a select
            key={values.examType}
            label="Exams you're taking"
            name="examType"
            placeholder="Choose one"
            options={[...EXAM_TYPES]}
            defaultValue={values.examType}
            error={errors.examType}
          />
          <TextInput
            label="Course you'd like to study"
            name="courseInterest"
            placeholder="For example, Economics"
            defaultValue={values.courseInterest}
            error={errors.courseInterest}
          />
        </FormRow>
        <UniversityPicker initial={values.dreamUniversities} error={errors.dreamUniversities} />
        <TextInput
          multiline
          label="What would you like help with?"
          name="helpNeeded"
          hint="Choosing a course, your personal statement, interviews, the visa, moving: anything on your mind."
          defaultValue={values.helpNeeded}
          error={errors.helpNeeded}
        />
      </Panel>

      <Panel title="Your parent or guardian" description="They get a short progress report each week. They don't need an account.">
        <FormRow>
          <TextInput label="Their name" name="parentName" defaultValue={values.parentName} error={errors.parentName} />
          <TextInput
            label="Their email"
            name="parentEmail"
            type="email"
            inputMode="email"
            placeholder="parent@example.com"
            defaultValue={values.parentEmail}
            error={errors.parentEmail}
          />
        </FormRow>
      </Panel>

      {isCall ? (
        <CallTimes slots={slots} takenSlotId={state.takenSlotId} error={errors.slotId} onApplyInstead={() => choosePath(START_PATHS.apply)} />
      ) : (
        <PackageSummaryCard pkg={pkg} />
      )}

      <div className="flex flex-col gap-1">
        {/* Sent from state, not the checkbox, which React's post-submit form reset would untick */}
        <input type="hidden" name="consent" value={consent ? "yes" : ""} />
        <Checkbox
          checked={consent}
          onChange={setConsent}
          error={!!errors.consent}
          label="My parent or guardian agrees to Njia keeping these details to run my mentorship."
        />
        <FieldHelp id="consent-help" error={errors.consent} />
        <Link href="/privacy" target="_blank" className="inline-flex min-h-11 items-center self-start rounded-sm pl-8">
          How we look after your details
        </Link>
      </div>

      {state.error ? <Banner tone="error">{state.error}</Banner> : null}

      <div className="flex flex-col gap-3">
        <Button type="submit" variant="primary" fullWidth loading={pending}>
          {isCall ? (pending ? "Booking your call…" : "Book your free call") : pending ? "Saving your goals…" : "Apply now"}
        </Button>
        <p className="m-0 text-center text-body text-ink-muted">
          Already have an account?{" "}
          <Link href="/log-in" className="inline-flex min-h-11 items-center rounded-sm">
            Log in
          </Link>
        </p>
      </div>
    </form>
  );
}

function CallTimes({
  slots,
  takenSlotId,
  error,
  onApplyInstead,
}: {
  slots: CallSlot[] | null;
  takenSlotId?: string;
  error?: string;
  onApplyInstead: () => void;
}) {
  const [taken, setTaken] = useState<Set<string>>(new Set());
  const [slotId, setSlotId] = useState("");
  const [seen, setSeen] = useState(takenSlotId);
  // A time someone else just booked stays struck through, and is unselected
  if (takenSlotId !== seen) {
    setSeen(takenSlotId);
    if (takenSlotId) {
      setTaken(new Set(taken).add(takenSlotId));
      if (slotId === takenSlotId) setSlotId("");
    }
  }

  const days = useMemo(() => {
    const byDay = new Map<string, CallSlot[]>();
    for (const s of slots ?? []) {
      const key = dayKeyEat(s.startsAt);
      byDay.set(key, [...(byDay.get(key) ?? []), s]);
    }
    return [...byDay.entries()].map(([key, list]) => ({ key, label: formatDayEat(list[0].startsAt), slots: list }));
  }, [slots]);
  const [dayKey, setDayKey] = useState(days[0]?.key ?? "");
  const day = days.find((d) => d.key === dayKey) ?? days[0];

  const description = "Times are in East Africa Time (EAT). The call is 30 minutes on Google Meet.";

  if (slots === null) {
    return (
      <Panel title="Choose a call time" description={description}>
        <Banner tone="error">We couldn&apos;t load the call times. Refresh the page to try again.</Banner>
      </Panel>
    );
  }
  if (days.length === 0) {
    return (
      <Panel title="Choose a call time" description={description}>
        <Banner
          tone="info"
          icon="calendar"
          title="No call times are open right now."
          action={
            <Button size="md" variant="outline" onClick={onApplyInstead}>
              Apply now instead
            </Button>
          }
        >
          New times open every week, so check back tomorrow. If you already know what you need, you can apply now.
        </Banner>
      </Panel>
    );
  }

  return (
    <Panel title="Choose a call time" description={description}>
      <input type="hidden" name="slotId" value={slotId} />
      <FormGroup legend="Day" className="gap-2">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {days.map((d) => (
            <ChoiceChip key={d.key} label={d.label} selected={d.key === day.key} onPick={() => setDayKey(d.key)} />
          ))}
        </div>
      </FormGroup>
      <FormGroup legend="Time" className="gap-2">
        <div className="grid grid-cols-3 gap-2 outline-none sm:grid-cols-4" data-error={error ? "true" : undefined} tabIndex={error ? -1 : undefined}>
          {day.slots.map((s) => (
            <ChoiceChip
              key={s.id}
              label={formatTimeEat(s.startsAt)}
              selected={s.id === slotId}
              disabled={taken.has(s.id)}
              onPick={() => setSlotId(s.id)}
            />
          ))}
        </div>
        <FieldHelp id="slot-help" error={error} />
      </FormGroup>
      <p className="m-0 flex items-start gap-2 text-body text-ink-muted">
        <Icon name="users" size={20} color="var(--color-forest)" style={{ marginTop: 3 }} />
        Your parent is welcome to join. We&apos;ll email them the invite too.
      </p>
    </Panel>
  );
}

function Confirmation({ done, ref }: { done: NonNullable<GoalsState["done"]>; ref: Ref<HTMLDivElement> }) {
  const isCall = done.path === START_PATHS.call;
  const steps = isCall
    ? [
        done.callStartsAt
          ? `Your free call is on ${formatLongDayEat(done.callStartsAt)} at ${formatTimeEat(done.callStartsAt)} EAT.`
          : "Your free call is booked.",
        done.inviteSent
          ? "You and your parent will get a calendar invite by email, with the Google Meet link."
          : "We'll email you and your parent the Google Meet link before the call.",
        done.emailSent
          ? `We've sent a link to ${done.email} so you can choose a password and log in.`
          : `To log in, use “Forgot your password?” on the log in page with ${done.email}.`,
      ]
    : [
        "Payment is the next step. We'll email you about paying by M-Pesa or card.",
        "Once you've paid, we pair you with a mentor within 2 days.",
        done.emailSent
          ? `We've sent a link to ${done.email} so you can choose a password, log in and pay any time.`
          : `To log in and pay later, use “Forgot your password?” on the log in page with ${done.email}.`,
      ];

  return (
    <Panel as="div" ref={ref} padding="xl" gap="xl" className="scroll-mt-24" role="status">
      <div className="flex size-14 items-center justify-center rounded-pill bg-forest-soft">
        <Icon name={isCall ? "calendar" : "check"} size={24} color="var(--color-forest)" />
      </div>
      <h2 className="m-0 type-title">{isCall ? "You're booked!" : "Your goals are saved."}</h2>
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {steps.map((s) => (
          <li key={s} className="flex items-start gap-3 text-body-lg">
            <Icon name="check" size={20} color="var(--color-forest)" style={{ marginTop: 5 }} />
            {s}
          </li>
        ))}
      </ul>
      <Button variant="secondary" href="/how-it-works" className="self-start">
        See how it works
      </Button>
    </Panel>
  );
}
