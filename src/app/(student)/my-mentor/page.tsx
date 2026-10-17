import type { Metadata } from "next";
import { AppPlaceholder } from "@/components/Placeholder";

export const metadata: Metadata = { title: "My mentor" };

export default function MyMentorPage() {
  return (
    <AppPlaceholder title="My mentor" icon="user">
      You&apos;ll see your mentor&apos;s profile here, with payment if it&apos;s still due and ways to contact them.
    </AppPlaceholder>
  );
}
