import type { Metadata } from "next";
import { AppPlaceholder } from "@/components/Placeholder";

export const metadata: Metadata = { title: "Sessions" };

export default function SessionsPage() {
  return (
    <AppPlaceholder title="Sessions" icon="calendar">
      Your upcoming and past sessions will show here, with your mentor&apos;s notes and this week&apos;s tasks.
    </AppPlaceholder>
  );
}
