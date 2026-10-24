import type { Metadata } from "next";
import { Section, SectionIntro } from "@/components/site/Section";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { Icon, type IconName } from "@/components/ui/Icon";

export const metadata: Metadata = { title: "How it works" };

const steps = [
  {
    title: "Tell us your goals",
    text: "Your universities, course, exams and what you need help with. It takes about 5 minutes.",
    points: ["Choose up to 5 dream universities", "Add your parent's email for weekly reports", "Pick a free call time, or apply straight away"],
  },
  {
    title: "Free consultation call",
    text: "A 30-minute call on Google Meet to understand where you are and where you want to go.",
    points: ["Free, with no commitment", "Your parents are welcome to join", "Skip it if you already know what you need"],
  },
  {
    title: "Meet your mentor",
    text: "We pair you with a Kenyan who studied at your dream university, within 2 days of paying.",
    points: ["See their profile in the app", "Message them on WhatsApp or email", "They book your first session with you"],
  },
  {
    title: "Sessions and next steps",
    text: "Weekly sessions on Google Meet, notes after each one and a short task list.",
    points: ["Tick off tasks in the app", "Your mentor sees your progress", "Help settling in after you arrive"],
  },
];

const week: { icon: IconName; title: string; text: string }[] = [
  { icon: "video", title: "A session with your mentor", text: "45 minutes on Google Meet, at a time that suits you both." },
  { icon: "file-text", title: "Notes from your mentor", text: "What you covered and what comes next, in the app the same day." },
  { icon: "list-checks", title: "This week's tasks", text: "Two or three specific steps, like shortlisting courses on UCAS." },
  { icon: "mail", title: "Your parents' report", text: "Sessions held, tasks done and the next step, by email." },
];

export default function HowItWorksPage() {
  return (
    <>
      <Section padding="pt-8 pb-10 lg:pt-24 lg:pb-18" className="flex flex-col gap-5">
        <h1 className="m-0 max-w-[860px] type-display text-pretty">A clear path, one next step at a time.</h1>
        <p className="m-0 max-w-[640px] text-body-lg text-ink-muted">
          From your first call to your first weeks abroad, you always know what&apos;s next. Your parents get a progress
          report by email every week.
        </p>
      </Section>

      <Section tone="white">
        <ol className="m-0 flex list-none flex-col gap-4 p-0">
          {steps.map((s, i) => (
            <li
              key={s.title}
              className="grid grid-cols-1 items-start gap-4 rounded-md border border-line bg-cream p-4 lg:grid-cols-[48px_1fr_1fr] lg:gap-8 lg:p-8"
            >
              <div
                aria-hidden
                className="flex size-12 flex-none items-center justify-center rounded-pill bg-forest-soft text-body-lg font-bold text-forest"
              >
                {i + 1}
              </div>
              <div className="flex flex-col gap-2">
                <h2 className="m-0 type-heading">{s.title}</h2>
                <p className="m-0 text-body text-ink-muted">{s.text}</p>
              </div>
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {s.points.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-body">
                    <Icon name="check" size={18} color="var(--color-forest)" style={{ marginTop: 4 }} />
                    {p}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </Section>

      <Section stack>
        <h2 className="m-0 type-title text-pretty">A typical week: one session, a few tasks, one report.</h2>
        <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 lg:grid-cols-4">
          {week.map((w) => (
            <Panel as="li" key={w.title} padding="lg" gap="md">
              <Icon name={w.icon} size={24} color="var(--color-forest)" />
              <h3 className="m-0 text-body-lg font-bold">{w.title}</h3>
              <p className="m-0 text-body text-ink-muted">{w.text}</p>
            </Panel>
          ))}
        </ul>
      </Section>

      <Section tone="ink" className="flex flex-col items-stretch justify-between gap-8 lg:flex-row lg:items-center">
        <SectionIntro title="KSh 250,000 for your mentorship." onDark>
          Includes your mentor, weekly sessions and a weekly progress report for your parent. Pay by M-Pesa or card. The
          first call is free.
        </SectionIntro>
        <div className="flex flex-none flex-col gap-3 lg:flex-row">
          <Button variant="primary" iconRight="arrow-right" href="/get-started?path=call" fullWidth className="lg:w-auto">
            Book your free call
          </Button>
          <Button variant="inverse" href="/get-started?path=apply" fullWidth className="lg:w-auto">
            Apply now
          </Button>
        </div>
      </Section>
    </>
  );
}
