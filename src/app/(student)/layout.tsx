import { AppShell } from "@/components/navigation/AppShell";
import { studentAppLinks } from "@/lib/navigation";

export default function StudentLayout({ children }: LayoutProps<"/">) {
  // Initials are a stand-in until login is built
  return (
    <AppShell items={studentAppLinks} role="student" initials="CM">
      {children}
    </AppShell>
  );
}
