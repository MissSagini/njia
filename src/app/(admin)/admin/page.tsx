import type { Metadata } from "next";
import { AppPlaceholder } from "@/components/Placeholder";

export const metadata: Metadata = { title: "Admin" };

export default function AdminPage() {
  return (
    <AppPlaceholder title="Admin" icon="list-checks">
      Consultation calls, pairing students with mentors, approving mentors and payments will show here.
    </AppPlaceholder>
  );
}
