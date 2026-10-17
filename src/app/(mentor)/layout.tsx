import { AppShell } from "@/components/navigation/AppShell";
import { mentorAppLinks } from "@/lib/navigation";

export default function MentorLayout({ children }: LayoutProps<"/">) {
  // Initials are a stand-in until login is built
  return (
    <AppShell items={mentorAppLinks} role="mentor" initials="AW">
      {children}
    </AppShell>
  );
}
