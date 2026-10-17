import type { Metadata } from "next";
import { AppPlaceholder } from "@/components/Placeholder";

export const metadata: Metadata = { title: "My goals" };

export default function MyGoalsPage() {
  return (
    <AppPlaceholder title="My goals" icon="compass">
      You&apos;ll see and edit your course, exams, dream universities and parent&apos;s details here.
    </AppPlaceholder>
  );
}
