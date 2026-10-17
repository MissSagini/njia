import type { Metadata } from "next";
import { SitePlaceholder } from "@/components/Placeholder";

export const metadata: Metadata = { title: "Log in" };

export default function LogInPage() {
  return (
    <SitePlaceholder title="Welcome back.">
      This page will ask for your email and send you a login link. No password needed.
    </SitePlaceholder>
  );
}
