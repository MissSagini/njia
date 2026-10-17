import type { Metadata } from "next";
import { SitePlaceholder } from "@/components/Placeholder";

export const metadata: Metadata = { title: "Get started" };

export default function GetStartedPage() {
  return (
    <SitePlaceholder title="Your path starts here.">
      This page will hold the goals form, then either a free call booking or payment, depending on how you choose to start.
    </SitePlaceholder>
  );
}
