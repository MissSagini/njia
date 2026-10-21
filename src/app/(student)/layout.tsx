import type { ReactNode } from "react";
import { SignedInShell } from "@/components/navigation/SignedInShell";
import { studentAppLinks } from "@/lib/navigation";

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <SignedInShell roles={["student"]} items={studentAppLinks}>
      {children}
    </SignedInShell>
  );
}
