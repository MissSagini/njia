import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Banner } from "@/components/ui/Banner";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What Njia collects, why, who helps us run the service, and your rights under Kenya's Data Protection Act.",
};

const UPDATED = "24 October 2026";

/**
 * Draft privacy policy, written from what the app does today. Have it reviewed
 * by a data-protection advisor before launch, then remove the draft banner.
 */
export default function PrivacyPage() {
  return (
    <article className="mx-auto flex w-full max-w-[760px] flex-col gap-8 px-5 py-10 lg:px-10 lg:py-16">
      <header className="flex flex-col gap-3">
        <h1 className="m-0 type-display text-pretty">How we look after your details.</h1>
        <p className="m-0 text-body-lg text-ink-muted">
          Many of the students we work with are under 18, so we keep this simple and careful. Last updated {UPDATED}.
        </p>
      </header>

      <Banner tone="info" icon="file-text" title="This policy is a draft.">
        We&apos;re having it checked by a data-protection advisor before Njia launches.
      </Banner>

      <Part title="Who we are">
        <p>
          Njia pairs Kenyan students with Kenyan mentors who studied at UK and European universities. When this policy says
          &ldquo;we&rdquo;, it means Njia; &ldquo;you&rdquo; means the student, and we also explain what it means for parents and
          mentors. Under Kenya&apos;s Data Protection Act 2019, Njia is the data controller for the details below.
        </p>
      </Part>

      <Part title="What we collect">
        <List
          items={[
            <>
              <strong>Your goals:</strong> your name, email, phone number, school, exams, the course and universities you&apos;re
              aiming for, and what you&apos;d like help with.
            </>,
            <>
              <strong>Your parent or guardian:</strong> their name and email, so they get the weekly report and the free call
              invite.
            </>,
            <>
              <strong>Your mentoring:</strong> call and session times, your mentor&apos;s notes, your weekly tasks, which ones
              you&apos;ve ticked off, and links to work you share with your mentor. We keep the link, not the document: it stays
              wherever you saved it, such as Google Docs.
            </>,
            <>
              <strong>Payments:</strong> the amount, the date, how it was paid and, for M-Pesa, the phone number the prompt went
              to. We never see or keep card details: Paystack handles those.
            </>,
            <>
              <strong>Mentors:</strong> their name, email, university, course, where they&apos;re from and live now, a short bio
              and their WhatsApp number, which their students can see.
            </>,
          ]}
        />
      </Part>

      <Part title="Why we use it">
        <List
          items={[
            "To book your free call and your sessions, and pair you with a mentor.",
            "To let your mentor guide you: they see your goals, your sessions and your tasks.",
            "To send your parent or guardian a short progress report each week.",
            "To take payment and keep a record of it.",
            "To keep the service safe, for example by recording who opened a student's details.",
          ]}
        />
        <p>
          We don&apos;t sell your details, use them for advertising, or share them with anyone beyond the services listed
          below.
        </p>
      </Part>

      <Part title="If you're under 18">
        <p>
          A parent or guardian has to agree before we keep your details. That&apos;s the box you tick when you tell us your
          goals. Your parent or guardian can ask us about your details at any time, using the contact below.
        </p>
      </Part>

      <Part title="Who sees your details">
        <List
          items={[
            "You, when you log in.",
            "Your mentor, once you're paired: your goals, sessions and tasks. Mentors don't see your payments.",
            "The Njia team, to run calls, pair students and help with payments. We record each time a team member or mentor opens a student's details.",
          ]}
        />
      </Part>

      <Part title="Services that help us">
        <p>These companies process details for us, only to run Njia:</p>
        <List
          items={[
            "Supabase, which stores our database and handles logins. Its servers are in the European Union (Ireland).",
            "Paystack, which takes M-Pesa and card payments.",
            "Our website host and our email service, which we'll name here before launch.",
          ]}
        />
        <p>
          Storing details outside Kenya is allowed under the Act with proper safeguards, and we choose providers that offer
          them.
        </p>
      </Part>

      <Part title="How long we keep it">
        <p>
          We keep your details while you&apos;re in the programme, then for up to 2 years so we can help if you get in touch
          again, and as long as the law requires for payment records. After that, we delete them.
        </p>
      </Part>

      <Part title="Keeping it safe">
        <p>
          Your details are encrypted when stored. Each person can only see what their role needs: you see your own, mentors see
          their own students&apos;, and the team signs in to see more. We keep personal details out of error reports and
          analytics.
        </p>
      </Part>

      <Part title="Your rights">
        <p>Under the Data Protection Act, you (or your parent or guardian) can ask us to:</p>
        <List
          items={[
            "tell you what details we hold about you, and give you a copy;",
            "correct anything that's wrong;",
            "delete your details, unless the law says we must keep them, as with payment records;",
            "stop using your details for a particular purpose.",
          ]}
        />
        <p>
          Email us at hello@njia.co.ke and we&apos;ll reply within 2 weeks. If you&apos;re not happy with how we handle it, you
          can complain to the Office of the Data Protection Commissioner (odpc.go.ke).
        </p>
      </Part>

      <Part title="Changes">
        <p>If we change this policy, we&apos;ll update the date at the top and tell you by email if the change matters to you.</p>
      </Part>
    </article>
  );
}

function Part({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 text-body text-ink [&_p]:m-0">
      <h2 className="m-0 type-heading">{title}</h2>
      {children}
    </section>
  );
}

function List({ items }: { items: ReactNode[] }) {
  return (
    <ul className="m-0 flex flex-col gap-2 pl-5">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}
