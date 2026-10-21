import type { ReactNode } from "react";
import { SignedInShell } from "@/components/navigation/SignedInShell";
import { adminAppLinks } from "@/lib/navigation";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <SignedInShell roles={["admin"]} items={adminAppLinks}>
      {children}
    </SignedInShell>
  );
}
