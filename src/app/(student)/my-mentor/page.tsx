import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PaymentPanel } from "@/components/payments/PaymentPanel";
import { FreeCallControls } from "./FreeCallControls";
import { Avatar } from "@/components/ui/Avatar";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { initialsFor, requireViewer } from "@/lib/auth/dal";
import { openCallSlots } from "@/lib/calls/data";
import { paystackEnv } from "@/lib/env";
import { formatKes } from "@/lib/money";
import { loadCheckout } from "@/lib/payments/ledger";
import { payToken } from "@/lib/payments/link";
import { myMentor, type MyMentorData } from "@/lib/students/my-mentor";
import { formatLongDayEat, formatTimeEat } from "@/lib/time";

export const metadata: Metadata = { title: "My mentor" };

export default function MyMentorPage() {
  return (
    <section className="mx-auto flex w-full max-w-[880px] flex-col gap-6 px-5 py-8 lg:px-10 lg:py-12">
      <h1 className="m-0 type-title">My mentor</h1>
      <Suspense fallback={<Skeleton label="Loading your mentor" avatar rows={2} />}>
        <Loaded />
      </Suspense>
    </section>
  );
}

async function Loaded() {
  const viewer = await requireViewer(["student"]);
  let data;
  try {
    data = await myMentor(viewer);
  } catch (error) {
    console.error("my-mentor: load failed", (error as { code?: string }).code);
    return <Banner tone="error">Your mentor&apos;s details didn&apos;t load. Refresh the page to try again.</Banner>;
  }
  if (!data) {
    return (
      <EmptyState icon="compass" title="We couldn't find your goals.">
        Message us at hello@njia.co.ke and we&apos;ll sort it out.
      </EmptyState>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {data.upcomingCall ? <FreeCall call={data.upcomingCall} /> : null}
      {data.balanceKes > 0 && data.enrolmentId ? <PaymentDue enrolmentId={data.enrolmentId} balanceKes={data.balanceKes} /> : null}
      {data.mentor ? <Mentor mentor={data.mentor} studentFirstName={data.firstName} owes={data.balanceKes > 0} /> : <Finding data={data} />}
      {data.mentor ? <NextSession session={data.nextSession} /> : null}
    </div>
  );
}

const when = (iso: string) => `${formatLongDayEat(iso)} at ${formatTimeEat(iso)} EAT`;

async function FreeCall({ call }: { call: NonNullable<MyMentorData["upcomingCall"]> }) {
  // Other open times, to move the call to
  const openTimes = call.canChange ? await openCallSlots().catch(() => []) : [];
  return (
    <Card eyebrow="Your free call" title={when(call.startsAt)}>
      {call.meetLink ? (
        <div className="pt-2">
          <Button variant="secondary" size="md" href={call.meetLink} iconLeft="video">
            Join on Google Meet
          </Button>
        </div>
      ) : (
        "We'll email you and your parent the Google Meet link before the call."
      )}
      <FreeCallControls openTimes={openTimes} canChange={call.canChange} />
    </Card>
  );
}

function Finding({ data }: { data: MyMentorData }) {
  const text =
    data.balanceKes > 0
      ? data.startPath === "free_call"
        ? "After your free call and payment, we pair you with a Kenyan mentor who studied at one of your universities, within 2 days."
        : "Once you've paid, we pair you with a Kenyan mentor who studied at one of your universities, within 2 days."
      : "We're pairing you with a Kenyan mentor who studied at one of your universities. It takes up to 2 days, and we'll email you when it's done.";
  return (
    <EmptyState icon="compass" title="Finding your mentor">
      {text}
    </EmptyState>
  );
}

function Mentor({ mentor, studentFirstName, owes }: { mentor: NonNullable<MyMentorData["mentor"]>; studentFirstName: string; owes: boolean }) {
  const first = mentor.fullName.split(" ")[0];
  const greeting = `Hi ${first}, it's ${studentFirstName} from Njia.`;
  const whatsapp = mentor.whatsapp
    ? `https://wa.me/${mentor.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(greeting)}`
    : null;
  const email = `mailto:${mentor.email}?subject=${encodeURIComponent("Njia mentoring")}`;

  return (
    <Card tone="tint">
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar initials={initialsFor(mentor.fullName, mentor.email)} size={72} />
          <div className="flex min-w-0 flex-[1_1_220px] flex-col gap-1">
            <h2 className="m-0 type-heading text-ink">{mentor.fullName}</h2>
            <div className="text-body font-semibold text-forest">
              {mentor.university}, {mentor.course}, {mentor.yearOrStatus}
            </div>
            <div className="flex items-center gap-1.5 text-small text-ink-muted">
              <Icon name="map-pin" size={16} />
              From {mentor.homeTown}, now in {mentor.currentCity}
            </div>
          </div>
        </div>
        {mentor.bio ? <p className="m-0 text-body text-pretty text-ink">{mentor.bio}</p> : null}
        <div className="flex flex-col gap-3 sm:flex-row">
          {whatsapp ? (
            // Sunset goes to paying while money is owed: one per screen
            <Button variant={owes ? "secondary" : "primary"} href={whatsapp} iconLeft="message-circle" className="w-full sm:w-auto">
              Message on WhatsApp
            </Button>
          ) : null}
          <Button variant={whatsapp ? "outline" : "secondary"} href={email} iconLeft="mail" className="w-full sm:w-auto">
            Email {first}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function NextSession({ session }: { session: MyMentorData["nextSession"] }) {
  return (
    <Card eyebrow="Next session" title={session ? when(session.startsAt) : "Nothing booked yet"}>
      <div className="flex flex-wrap items-center gap-3 pt-1">
        {session?.meetLink ? (
          <Button variant="secondary" size="md" href={session.meetLink} iconLeft="video">
            Join on Google Meet
          </Button>
        ) : null}
        <Link href="/sessions" className="inline-flex min-h-11 items-center rounded-sm">
          {session ? "See notes and tasks" : "Book your next session"}
        </Link>
      </div>
    </Card>
  );
}

async function PaymentDue({ enrolmentId, balanceKes }: { enrolmentId: string; balanceKes: number }) {
  // The student's own enrolment, checked by the session above
  const checkout = paystackEnv() ? await loadCheckout(enrolmentId) : null;
  if (!checkout?.charge) {
    return (
      <Card eyebrow="Payment" title={`${formatKes(balanceKes)} to pay`}>
        Pay by M-Pesa or card (Visa or Mastercard), and the M-Pesa prompt can go to your parent&apos;s phone. We&apos;ll email
        you how to pay.
      </Card>
    );
  }
  return (
    <PaymentPanel
      token={payToken(enrolmentId)}
      amountKes={checkout.charge.remainingKes}
      afterPaid="We'll pair you with a mentor within 2 days, if we haven't already, and email you when it's done."
    />
  );
}
