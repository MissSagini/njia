import type { Metadata } from "next";
import { MentorDirectory } from "@/components/site/MentorDirectory";
import { Section } from "@/components/site/Section";
import { Button } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { mentors } from "@/content/mentors";

export const metadata: Metadata = { title: "Mentors" };

const checks: { icon: IconName; title: string; text: string }[] = [
  {
    icon: "graduation-cap",
    title: "Studied where you want to go",
    text: "Every mentor is a current student or graduate of the university they mentor for.",
  },
  {
    icon: "users",
    title: "Kenyan, like you",
    text: "They know KCSE, A-levels and IB in Kenya, and what it takes to apply from home.",
  },
  {
    icon: "check",
    title: "Approved by our team",
    text: "We interview every mentor and check their degree before they meet a student.",
  },
];

export default function MentorsPage() {
  return (
    <>
      <Section padding="pt-8 pb-10 lg:pt-24 lg:pb-24">
        <div className="flex flex-col gap-5">
          <h1 className="m-0 type-display">Been there, and from home.</h1>
          <p className="m-0 max-w-[640px] text-body-lg text-ink-muted">
            Every mentor is Kenyan and studied at the university you&apos;re aiming for. They remember the essays, the visa
            forms and the first cold week.
          </p>
          <MentorDirectory mentors={mentors} />
        </div>
      </Section>

      <Section tone="white" stack>
        <h2 className="m-0 type-title">How we choose mentors</h2>
        <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 lg:grid-cols-3">
          {checks.map((c) => (
            <li key={c.title} className="flex flex-col gap-3 rounded-md border border-line bg-cream p-6">
              <Icon name={c.icon} size={24} color="var(--color-forest)" />
              <h3 className="m-0 text-body-lg font-bold">{c.title}</h3>
              <p className="m-0 text-body text-ink-muted">{c.text}</p>
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
          <Button variant="primary" iconRight="arrow-right" href="/get-started?path=call" fullWidth className="lg:w-auto">
            Book your free call
          </Button>
          <p className="m-0 text-body text-ink-muted">We&apos;ll match you with the right mentor after your call.</p>
        </div>
      </Section>
    </>
  );
}
