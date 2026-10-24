import type { Metadata } from "next";
import { FaqList } from "@/components/site/FaqList";
import { Section } from "@/components/site/Section";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { Card } from "@/components/ui/Card";
import { Icon, type IconName } from "@/components/ui/Icon";

export const metadata: Metadata = { title: "For parents" };

// Sample report from the design mock-ups
const sampleReport = [
  { label: "Sessions held", value: "1 (Thu 15 Oct)" },
  { label: "Tasks completed", value: "2 of 3" },
  { label: "Worked on", value: "Comparing LSE and UCL Economics" },
  { label: "Next step", value: "Final personal statement draft" },
];

const points: { icon: IconName; title: string; text: string }[] = [
  { icon: "mail", title: "A report every week", text: "Sessions held, tasks done and the next step, sent to your email." },
  { icon: "users", title: "Join the free call", text: "Hear the plan first-hand and ask your own questions." },
  { icon: "smartphone", title: "Pay by M-Pesa or card", text: "KSh 250,000. The payment prompt can go to your phone." },
  { icon: "home", title: "Help after they arrive", text: "Accommodation, a bank account, a SIM card and finding community." },
];

const faqs = [
  {
    question: "How much does it cost?",
    answer:
      "KSh 250,000. It includes your child's mentor, weekly sessions and a weekly progress report for you. The first call is free.",
  },
  {
    question: "How do I pay?",
    answer:
      "By M-Pesa or card, after the free call or straight away if your child applies now. The M-Pesa prompt can go to your phone.",
  },
  {
    question: "Do I need an account?",
    answer: "No. Reports come to your email every week. Your child uses the app to see sessions and tasks.",
  },
  {
    question: "Who are the mentors?",
    answer:
      "Kenyans who studied at the university your child is aiming for. Our team interviews each one and checks their degree.",
  },
];

export default function ForParentsPage() {
  return (
    <>
      <Section padding="pt-8 pb-10 lg:py-24">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-20">
          <div className="flex flex-col gap-5">
            <h1 className="m-0 type-display">You&apos;ll see the progress, too.</h1>
            <p className="m-0 text-body-lg text-ink-muted">
              Every week, a report lists the sessions held, your child&apos;s tasks and what comes next. No login needed.
              It arrives by email.
            </p>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
              <Button variant="primary" iconRight="arrow-right" href="/get-started?path=call" fullWidth className="lg:w-auto">
                Book a free call
              </Button>
              <p className="m-0 text-body text-ink-muted">You&apos;re welcome to join the call with your child.</p>
            </div>
          </div>
          <Card title="Cynthia's report: 12 to 18 October">
            <dl className="m-0 flex flex-col gap-3">
              {sampleReport.map((r) => (
                <div key={r.label} className="flex flex-wrap justify-between gap-x-4 gap-y-1 border-b border-line pb-3">
                  <dt className="text-ink-muted">{r.label}</dt>
                  <dd className="m-0 text-right font-semibold text-ink">{r.value}</dd>
                </div>
              ))}
            </dl>
            <p className="m-0 mt-3 text-small text-ink-muted">
              From Amani Wanjiku, Cynthia&apos;s mentor (LSE, Economics 2022)
            </p>
          </Card>
        </div>
      </Section>

      <Section tone="white" stack>
        <h2 className="m-0 type-title">Clear, calm and in the loop.</h2>
        <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 lg:grid-cols-4">
          {points.map((p) => (
            <Panel as="li" key={p.title} tone="cream" padding="lg" gap="md">
              <Icon name={p.icon} size={24} color="var(--color-forest)" />
              <h3 className="m-0 text-body-lg font-bold">{p.title}</h3>
              <p className="m-0 text-body text-ink-muted">{p.text}</p>
            </Panel>
          ))}
        </ul>
      </Section>

      <Section stack>
        <h2 className="m-0 type-title">Questions parents ask</h2>
        <FaqList items={faqs} />
      </Section>
    </>
  );
}
