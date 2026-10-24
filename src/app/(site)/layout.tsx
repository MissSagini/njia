import { ChatAssistant } from "@/components/chat/ChatAssistant";
import { SiteFooter } from "@/components/navigation/SiteFooter";
import { SiteHeader } from "@/components/navigation/SiteHeader";
import { geminiEnv } from "@/lib/env";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      {/* Hidden until Gemini is set up */}
      {geminiEnv() ? <ChatAssistant /> : null}
    </>
  );
}
