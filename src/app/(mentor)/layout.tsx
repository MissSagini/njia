import type { ReactNode } from "react";
import { SignedInShell } from "@/components/navigation/SignedInShell";
import { mentorAppLinks } from "@/lib/navigation";

export default function MentorLayout({ children }: { children: ReactNode }) {
  return (
    <SignedInShell roles={["mentor"]} items={mentorAppLinks}>
      {children}
    </SignedInShell>
  );
}
