import type { Metadata } from "next";
import { SitePlaceholder } from "@/components/Placeholder";

export const metadata: Metadata = { title: "For parents" };

export default function ForParentsPage() {
  return (
    <SitePlaceholder title="Your child, in safe and serious hands.">
      This page will show a sample weekly report, what parents can expect, and answers about cost, paying and mentors.
    </SitePlaceholder>
  );
}
