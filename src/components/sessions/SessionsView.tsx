"use client";

import { useActionState, useOptimistic, useState, useTransition } from "react";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { ChoiceChip } from "@/components/ui/ChoiceChip";
import { EmptyState } from "@/components/ui/EmptyState";
import { FieldHelp } from "@/components/ui/Field";
import { FormGroup } from "@/components/ui/FormLayout";
import { Icon } from "@/components/ui/Icon";
import { TextInput } from "@/components/ui/TextInput";
import { Toast } from "@/components/ui/Toast";
import { TimeChooser } from "@/components/booking/TimeChooser";
import {
  addTask,
  bookSession,
  cancelSession,
  removeTask,
  saveSessionNotes,
  setSessionOutcome,
  setTaskDone,
  type NotesState,
  type TaskState,
} from "@/lib/sessions/actions";
import type { SessionItem, SessionsData, SessionTask } from "@/lib/sessions/data";
import { formatLongDay, formatMonth, formatTime, monthKey, zoneLabel } from "@/lib/time";

type Mode = "student" | "mentor";

type Props = {
  data: SessionsData;
  mode: Mode;
  /** Zone to show times in: EAT for students, the mentor's own for mentors. */
  timeZone: string;
};

/** The Sessions screen, shared by students (book, tick tasks) and mentors (notes, tasks). */
export function SessionsView({ data, mode, timeZone }: Props) {
  const now = new Date(data.now).getTime();
  const upcoming = data.sessions.filter((s) => new Date(s.startsAt).getTime() > now);
  const past = data.sessions.filter((s) => new Date(s.startsAt).getTime() <= now).reverse();
  const firstName = data.student.fullName.split(" ")[0];

  if (!data.mentor) {
    return (
      <EmptyState icon="compass" title="Finding your mentor">
        We&apos;re pairing you with a mentor who studied at one of your universities. Once you&apos;re paired, you can book your
        first session here.
      </EmptyState>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <Progress sessions={data.sessions} weeks={data.enrolment?.weeks ?? 12} timeZone={timeZone} now={new Date(data.now)} />

      {upcoming.length > 0 ? (
        <section className="flex flex-col gap-4">
          <h2 className="m-0 type-heading">Coming up</h2>
          {upcoming.map((s) => (
            <SessionCard key={s.id} session={s} mode={mode} timeZone={timeZone} upcoming />
          ))}
        </section>
      ) : null}

      {mode === "student" ? (
        <BookNext data={data} timeZone={timeZone} hasSessions={data.sessions.length > 0} />
      ) : upcoming.length === 0 ? (
        <EmptyState icon="calendar" title={`${firstName} hasn't booked a session yet.`}>
          {data.bookingBlock === "complete"
            ? `${firstName} has had all ${data.enrolment?.weeks} sessions.`
            : `${firstName} books from your free times. Add more on the Free times page if none suit.`}
        </EmptyState>
      ) : null}

      {past.length > 0 ? (
        <section className="flex flex-col gap-4">
          <h2 className="m-0 type-heading">Past sessions</h2>
          {past.map((s, i) => (
            <SessionCard key={s.id} session={s} mode={mode} timeZone={timeZone} latest={i === 0} />
          ))}
        </section>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------- progress

function Progress({ sessions, weeks, timeZone, now }: { sessions: SessionItem[]; weeks: number; timeZone: string; now: Date }) {
  const thisMonth = monthKey(now, timeZone);
  const monthTasks = sessions.filter((s) => monthKey(s.startsAt, timeZone) === thisMonth).flatMap((s) => s.tasks);
  const done = monthTasks.filter((t) => t.done).length;
  const held = sessions.filter((s) => new Date(s.startsAt) <= now && s.status !== "missed").length;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-2 rounded-md border border-line bg-white p-4 sm:p-6">
        <div className="type-label text-forest">{formatMonth(now, timeZone)}</div>
        <div className="font-heading text-[22px] leading-[30px] font-semibold">
          {monthTasks.length ? `${done} of ${monthTasks.length} tasks done` : "No tasks yet this month"}
        </div>
        <Bar value={monthTasks.length ? done / monthTasks.length : 0} label="Tasks done this month" />
      </div>
      <div className="flex flex-col gap-2 rounded-md border border-line bg-white p-4 sm:p-6">
        <div className="type-label text-forest">Programme</div>
        <div className="font-heading text-[22px] leading-[30px] font-semibold">
          {held} of {weeks} sessions held
        </div>
        <Bar value={held / weeks} label="Sessions held" />
      </div>
    </div>
  );
}

function Bar({ value, label }: { value: number; label: string }) {
  const pct = Math.round(Math.min(Math.max(value, 0), 1) * 100);
  return (
    <div role="progressbar" aria-label={label} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} className="h-2 overflow-hidden rounded-pill bg-line">
      <div className="h-full rounded-pill bg-forest" style={{ width: `${pct}%` }} />
    </div>
  );
}

// ---------------------------------------------------------------- one session

function SessionCard({
  session,
  mode,
  timeZone,
  upcoming,
  latest,
}: {
  session: SessionItem;
  mode: Mode;
  timeZone: string;
  upcoming?: boolean;
  latest?: boolean;
}) {
  const when = `${formatLongDay(session.startsAt, timeZone)}, ${formatTime(session.startsAt, timeZone)} to ${formatTime(session.endsAt, timeZone)} ${zoneLabel(session.startsAt, timeZone)}`;

  return (
    <article className="flex flex-col gap-4 rounded-md border border-line bg-white p-4 sm:p-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            {session.weekNumber ? <span className="type-label text-forest">Week {session.weekNumber}</span> : null}
            {upcoming ? (
              <Badge variant="tag">Upcoming</Badge>
            ) : session.status === "missed" ? (
              <Badge variant="neutral">Missed</Badge>
            ) : latest ? (
              <Badge variant="neutral">This week</Badge>
            ) : null}
          </div>
          <h3 className="m-0 type-heading">{session.weekTitle ?? "Session"}</h3>
          <p className="m-0 flex items-center gap-2 text-body text-ink-muted">
            <Icon name="clock" size={18} color="var(--color-forest)" />
            {when}
          </p>
        </div>
        {upcoming && session.meetLink ? (
          <Button variant="secondary" size="md" href={session.meetLink} iconLeft="video" className="self-start">
            Join on Google Meet
          </Button>
        ) : null}
      </header>

      {upcoming && !session.meetLink && mode === "student" ? (
        <p className="m-0 text-body text-ink-muted">Your mentor will add the call link before the session.</p>
      ) : null}

      {mode === "mentor" ? (
        <MentorNotes session={session} />
      ) : session.mentorNotes ? (
        <div className="flex flex-col gap-1">
          <h4 className="m-0 text-[15px] leading-[22px] font-semibold">Your mentor&apos;s notes</h4>
          <p className="m-0 text-body whitespace-pre-line">{session.mentorNotes}</p>
        </div>
      ) : !upcoming ? (
        <p className="m-0 text-body text-ink-muted">Your mentor hasn&apos;t added notes yet.</p>
      ) : null}

      {upcoming && mode === "student" ? (
        <p className="m-0 text-body text-ink-muted">Can&apos;t make it? Message your mentor at least 2 hours before, from the My mentor page.</p>
      ) : null}
      {upcoming && mode === "mentor" ? (
        <div>
          <CancelButton sessionId={session.id} />
        </div>
      ) : null}
      {!upcoming && mode === "mentor" ? <OutcomeControl session={session} /> : null}

      {mode === "student" ? <StudentTasks tasks={session.tasks} /> : <MentorTasks session={session} />}
    </article>
  );
}

// ---------------------------------------------------------------- student: tasks and booking

function StudentTasks({ tasks }: { tasks: SessionTask[] }) {
  const [optimistic, setOptimistic] = useOptimistic(tasks, (list, change: { id: string; done: boolean }) =>
    list.map((t) => (t.id === change.id ? { ...t, done: change.done } : t)),
  );
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  if (tasks.length === 0) return null;

  function toggle(id: string, done: boolean) {
    setError(undefined);
    startTransition(async () => {
      setOptimistic({ id, done });
      const result = await setTaskDone(id, done);
      if (result.error) setError("That didn't save. Tick it again to retry.");
    });
  }

  return (
    <FormGroup legend="Tasks for this week">
      {optimistic.map((t) => (
        <Checkbox key={t.id} label={t.description} checked={t.done} strikeWhenChecked onChange={(done) => toggle(t.id, done)} />
      ))}
      <FieldHelp id="tasks-help" error={error} />
    </FormGroup>
  );
}

function BookNext({ data, timeZone, hasSessions }: { data: SessionsData; timeZone: string; hasSessions: boolean }) {
  const [toast, setToast] = useState(false);
  const mentorFirst = data.mentor?.fullName.split(" ")[0] ?? "your mentor";
  const toastEl = toast ? <Toast onDismiss={() => setToast(false)}>You&apos;re booked!</Toast> : null;

  if (data.bookingBlock === "upcoming") return toastEl;
  if (data.bookingBlock === "complete") {
    return (
      <EmptyState icon="graduation-cap" title="You've had all your sessions.">
        Well done for making it this far. Your mentor is still happy to hear how it goes.
      </EmptyState>
    );
  }

  const title = hasSessions ? "Book your next session" : "Book your first session";
  if (data.freeTimes.length === 0) {
    return (
      <>
        {toastEl}
        <EmptyState icon="calendar" title={title}>
          {`${mentorFirst} hasn't added any free times yet. Check back soon, or message them on the My mentor page.`}
        </EmptyState>
      </>
    );
  }

  return (
    <section className="flex flex-col gap-4 rounded-md border border-line bg-white p-4 sm:p-6">
      {toastEl}
      <header className="flex flex-col gap-1">
        <h2 className="m-0 type-heading">{title}</h2>
        <p className="m-0 text-body text-ink-muted">
          {`${mentorFirst}'s free times, in East Africa Time (EAT). Sessions are 1 hour on Google Meet.`}
        </p>
      </header>
      <TimeChooser freeTimes={data.freeTimes} timeZone={timeZone} action={bookSession} onDone={() => setToast(true)} labels={["Book this time", "Booking your session…"]} />
    </section>
  );
}

/** The mentor cancels, with a second, inline step instead of a browser dialog. */
function CancelButton({ sessionId }: { sessionId: string }) {
  const [asking, setAsking] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();
  if (!asking) {
    return (
      <Button variant="ghost" size="md" onClick={() => setAsking(true)}>
        Cancel session
      </Button>
    );
  }
  return (
    <div className="flex flex-col gap-2 rounded-md border border-line bg-cream p-3">
      <p className="m-0 text-body">
        Cancel this session? The time goes back on offer. Let your student know on WhatsApp too.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="md" loading={pending} onClick={() => start(async () => setError((await cancelSession(sessionId)).error))}>
          {pending ? "Cancelling…" : "Yes, cancel it"}
        </Button>
        <Button variant="ghost" size="md" disabled={pending} onClick={() => setAsking(false)}>
          Keep it
        </Button>
      </div>
      {error ? <Banner tone="error">{error}</Banner> : null}
    </div>
  );
}

/** The mentor says whether a past session happened. */
function OutcomeControl({ session }: { session: SessionItem }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();
  const pick = (outcome: "held" | "missed") => start(async () => setError((await setSessionOutcome(session.id, outcome)).error));
  return (
    <FormGroup legend="Did it happen?" className="gap-2">
      <div className="grid max-w-[360px] grid-cols-2 gap-2">
        <ChoiceChip label="Held" selected={session.status === "held"} disabled={pending} onPick={() => pick("held")} />
        <ChoiceChip label="Missed" selected={session.status === "missed"} disabled={pending} onPick={() => pick("missed")} />
      </div>
      <FieldHelp id={`outcome-${session.id}`} error={error} />
    </FormGroup>
  );
}

// ---------------------------------------------------------------- mentor: notes and tasks

function MentorNotes({ session }: { session: SessionItem }) {
  const [state, action, pending] = useActionState<NotesState, FormData>(saveSessionNotes, {});
  const [toastAt, setToastAt] = useState<number>();
  const [seen, setSeen] = useState(state);
  if (state !== seen) {
    setSeen(state);
    if (state.saved) setToastAt(state.saved);
  }

  return (
    <form action={action} className="m-0 flex flex-col gap-4">
      {toastAt ? <Toast onDismiss={() => setToastAt(undefined)}>Notes saved</Toast> : null}
      <input type="hidden" name="sessionId" value={session.id} />
      <TextInput
        multiline
        label="Your notes"
        name="notes"
        defaultValue={state.values?.notes ?? session.mentorNotes ?? ""}
        hint="What you covered and what comes next. Your student sees these straight away."
        error={state.fieldErrors?.notes}
      />
      <TextInput
        label="Call link"
        name="meetLink"
        type="url"
        inputMode="url"
        optional
        placeholder="https://meet.google.com/abc-defg-hij"
        defaultValue={state.values?.meetLink ?? session.meetLink ?? ""}
        error={state.fieldErrors?.meetLink}
      />
      {state.error ? <Banner tone="error">{state.error}</Banner> : null}
      <Button type="submit" variant="secondary" size="md" loading={pending} className="self-start">
        {pending ? "Saving your notes…" : "Save notes"}
      </Button>
    </form>
  );
}

function MentorTasks({ session }: { session: SessionItem }) {
  const [state, action, pending] = useActionState<TaskState, FormData>(addTask, {});
  const [removing, startRemove] = useTransition();
  const [removeError, setRemoveError] = useState<string>();

  return (
    <div className="flex flex-col gap-3">
      <h4 className="m-0 text-[15px] leading-[22px] font-semibold">Tasks for the week</h4>
      {session.tasks.length ? (
        <ul className="m-0 flex list-none flex-col p-0">
          {session.tasks.map((t) => (
            <li key={t.id} className="flex min-h-11 items-center justify-between gap-3 border-b border-line py-1 last:border-b-0">
              <span className="flex items-start gap-2">
                <Icon name={t.done ? "check" : "list-checks"} size={18} color="var(--color-forest)" style={{ marginTop: 4 }} />
                <span className={t.done ? "text-ink-muted line-through" : ""}>{t.description}</span>
              </span>
              <button
                type="button"
                disabled={removing}
                onClick={() =>
                  startRemove(async () => {
                    const r = await removeTask(t.id);
                    setRemoveError(r.error);
                  })
                }
                aria-label={`Remove task: ${t.description}`}
                className="flex size-11 flex-none cursor-pointer items-center justify-center rounded-sm border-0 bg-transparent hover:bg-forest-soft"
              >
                <Icon name="x" size={18} color="var(--color-ink-muted)" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="m-0 text-body text-ink-muted">No tasks yet. Add two or three small, clear steps.</p>
      )}
      <FieldHelp id={`remove-${session.id}`} error={removeError} />
      <form action={action} key={state.added} className="m-0 flex items-end gap-2">
        <input type="hidden" name="sessionId" value={session.id} />
        <TextInput label="New task" name="description" placeholder="For example, draft your opening paragraph" className="flex-1" maxLength={280} error={state.error} />
        <Button type="submit" variant="outline" size="md" loading={pending} className={state.error ? "mb-[30px]" : ""}>
          Add
        </Button>
      </form>
    </div>
  );
}
