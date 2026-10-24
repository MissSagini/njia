import { MentorCard } from "@/components/site/MentorCard";
import { Section, SectionIntro, SectionLink } from "@/components/site/Section";
import { Avatar } from "@/components/ui/Avatar";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon, type IconName } from "@/components/ui/Icon";
import { PathMotif } from "@/components/ui/PathMotif";
import { mentors } from "@/content/mentors";

const steps = [
  { title: "Tell us your goals", text: "Your universities, course, exams and what you need help with." },
  { title: "Free consultation call", text: "A 30-minute call to understand where you are and where you want to go." },
  { title: "Meet your mentor", text: "We pair you with a Kenyan who studied at your dream university." },
  { title: "Sessions and next steps", text: "Weekly sessions, notes and a short task list each week." },
];

const featured = mentors.filter((m) => m.summary).slice(0, 3);

const arrival: { icon: IconName; label: string }[] = [
  { icon: "home", label: "Accommodation" },
  { icon: "credit-card", label: "Bank account" },
  { icon: "smartphone", label: "SIM card" },
  { icon: "map-pin", label: "Getting around" },
  { icon: "users", label: "Finding community" },
];

const sampleReport = [
  { label: "Sessions held", value: "1" },
  { label: "Tasks completed", value: "2 of 3" },
  { label: "Next step", value: "Final personal statement draft" },
];

const ways = [
  {
    title: "Start with a free call",
    text: "Not sure which course or university yet? Talk it through with us first.",
    points: ["30 minutes on Google Meet", "Free, with no commitment", "Parents welcome to join"],
    cta: "Book your free call",
    variant: "secondary" as const,
    href: "/get-started?path=call",
  },
  {
    title: "Apply now",
    text: "Already know where you want to go? Tell us your goals, pay, and we pair you with a mentor.",
    points: ["Takes about 5 minutes", "Pay KSh 250,000 by M-Pesa or card", "Paired with a mentor within 2 days"],
    cta: "Apply now",
    variant: "outline" as const,
    href: "/get-started?path=apply",
  },
];

export default function HomePage() {
  return (
    <>
      <Section>
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-20">
          <div className="flex flex-col gap-6">
            <h1 className="m-0 type-display text-pretty">Someone from home who&apos;s already been there.</h1>
            <p className="m-0 max-w-[540px] text-body-lg text-ink-muted">
              Njia pairs you with a Kenyan mentor who studied at your dream university. Together you&apos;ll choose a
              course, write your application and plan the move, one next step at a time.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <Button variant="primary" iconRight="arrow-right" href="/get-started?path=call" className="w-full sm:w-auto">
                Book your free call
              </Button>
              <Button variant="outline" href="/get-started?path=apply" className="w-full sm:w-auto">
                Apply now
              </Button>
            </div>
            <p className="m-0 text-body text-ink-muted">
              Not sure yet? The call is free. Already know what you need? Apply now and skip it.
            </p>
            <p className="m-0 text-body">Mentors from Oxford, Cambridge, LSE, UCL and Edinburgh.</p>
          </div>

          <div className="relative">
            {/* Swap for a real photo of a mentor and student in Nairobi */}
            <div
              role="img"
              aria-label="Photo placeholder: a mentor and student talking in Nairobi"
              className="flex aspect-[4/3] items-start justify-end rounded-md bg-forest-soft p-4 text-small font-semibold text-forest lg:aspect-square"
            >
              Photo: mentor and student, Nairobi
            </div>
            <div className="absolute right-4 bottom-4 left-4 flex max-w-[320px] items-center gap-3 rounded-md border border-line bg-white p-4 shadow-lg">
              <Avatar initials="AW" size={48} />
              <div className="flex flex-col">
                <span className="font-bold">Amani Wanjiku</span>
                <span className="text-small text-ink-muted">LSE, Economics 2022 · London</span>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section tone="white" stack>
        <SectionIntro title="A clear path, one next step at a time.">
          You always know what&apos;s next. Your parents get a progress report by email every week.
        </SectionIntro>
        <ol className="m-0 grid list-none grid-cols-1 gap-5 p-0 lg:grid-cols-4 lg:gap-6">
          {steps.map((s, i) => (
            <li
              key={s.title}
              className="flex items-start gap-4 lg:flex-col lg:rounded-md lg:border lg:border-line lg:bg-cream lg:p-6"
            >
              <div
                aria-hidden
                className="flex size-10 flex-none items-center justify-center rounded-pill bg-forest-soft font-bold text-forest"
              >
                {i + 1}
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="m-0 type-heading">{s.title}</h3>
                <p className="m-0 text-body text-ink-muted">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <SectionLink href="/how-it-works">See how it works in detail</SectionLink>
      </Section>

      <Section stack>
        <SectionIntro title="Been there, and from home.">
          Every mentor is Kenyan and studied at the university you&apos;re aiming for.
        </SectionIntro>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
          {featured.map((m) => (
            <MentorCard key={m.name} initials={m.initials} name={m.name} study={m.study} bio={m.summary} />
          ))}
        </div>
        <SectionLink href="/mentors">Meet all our mentors</SectionLink>
      </Section>

      <Section tone="ink" stack>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionIntro title="The offer letter is just the beginning." onDark>
            Your mentor helps you settle in during your first weeks abroad.
          </SectionIntro>
          <PathMotif tone="dark" />
        </div>
        <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 lg:grid-cols-5 lg:gap-4">
          {arrival.map((a) => (
            <li key={a.label} className="flex items-center gap-3 rounded-md border border-hairline-dark p-4 font-semibold">
              <Icon name={a.icon} color="var(--color-ochre)" />
              {a.label}
            </li>
          ))}
        </ul>
      </Section>

      <Section>
        <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-2 lg:gap-20">
          <div className="flex flex-col gap-3">
            <h2 className="m-0 type-title text-pretty">You&apos;ll see the progress, too.</h2>
            <p className="m-0 text-body-lg text-ink-muted">
              Every week, a report lists the sessions held, your child&apos;s tasks and what comes next. No login needed.
              It arrives by email.
            </p>
            <SectionLink href="/for-parents">More for parents</SectionLink>
          </div>
          <Card title="Cynthia's report: 12 to 18 October">
            <dl className="m-0 flex flex-col gap-3">
              {sampleReport.map((r) => (
                <div key={r.label} className="flex justify-between gap-4 border-b border-line pb-3">
                  <dt className="text-ink-muted">{r.label}</dt>
                  <dd className="m-0 text-right font-semibold text-ink">{r.value}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </Section>

      <Section tone="white" stack>
        <h2 className="m-0 type-title">Two ways to start.</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
          {ways.map((w) => (
            <Panel as="div" key={w.title} tone="cream" padding="none" className="p-4 lg:p-8">
              <h3 className="m-0 type-heading">{w.title}</h3>
              <p className="m-0 text-body text-ink-muted">{w.text}</p>
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {w.points.map((p) => (
                  <li key={p} className="flex items-center gap-2">
                    <Icon name="check" size={18} color="var(--color-forest)" />
                    {p}
                  </li>
                ))}
              </ul>
              <div className="mt-2">
                <Button variant={w.variant} href={w.href} className="w-full sm:w-auto">
                  {w.cta}
                </Button>
              </div>
            </Panel>
          ))}
        </div>
      </Section>
    </>
  );
}
