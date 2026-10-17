import type { Metadata } from "next";
import { AppPlaceholder } from "@/components/Placeholder";

export const metadata: Metadata = { title: "My students" };

export default function StudentsPage() {
  return (
    <AppPlaceholder title="My students" icon="users">
      Your paired students will show here, with session notes and weekly tasks for each.
    </AppPlaceholder>
  );
}
