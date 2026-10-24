"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { ChoiceChip } from "@/components/ui/ChoiceChip";
import { Sheet } from "@/components/ui/Sheet";
import { TextInput } from "@/components/ui/TextInput";
import { CONTACT_EMAIL, HANDOFF, MAX_HISTORY, MAX_QUESTION_LENGTH } from "@/lib/chat/shared";
import { cx } from "@/lib/cx";

type Message = { role: "user" | "assistant"; content: string };

const STARTERS = ["How does Njia work?", "How much does it cost?", "How do I write a good personal statement?"];

/** Hides the hand-off marker, including a half-streamed one at the end. */
function visible(text: string) {
  return text.replace(HANDOFF, "").replace(/\[\[[a-z]*\]?$/, "").trim();
}

/**
 * The website's chat assistant: a button in the corner that opens a sheet.
 * It answers from the website's content and general knowledge, and shows
 * contact buttons when a person should take over.
 */
export function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const end = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [messages, busy]);

  async function ask(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    const history: Message[] = [...messages, { role: "user", content: q }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setDraft("");
    setError(undefined);
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.slice(-MAX_HISTORY) }),
      });
      if (!res.ok || !res.body) {
        throw new Error(res.status === 429 ? "busy" : "failed");
      }
      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let reply = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        reply += value;
        setMessages([...history, { role: "assistant", content: reply }]);
      }
      if (!visible(reply)) throw new Error("failed");
    } catch (e) {
      setMessages(history.slice(0, -1));
      setDraft(q);
      setError(
        e instanceof Error && e.message === "busy"
          ? "You've asked a lot of questions in a short time. Wait a few minutes, then try again."
          : `The assistant didn't answer. Try again, or email us at ${CONTACT_EMAIL}.`,
      );
    } finally {
      setBusy(false);
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    void ask(draft);
  }

  return (
    <>
      <Button
        variant="secondary"
        size="md"
        iconLeft="message-circle"
        onClick={() => setOpen(true)}
        className="fixed right-4 bottom-[calc(16px+env(safe-area-inset-bottom))] z-40 shadow-lg"
      >
        Ask a question
      </Button>

      <Sheet
        open={open}
        onClose={close}
        title="Ask a question."
        description="Answers come from AI using what's on this site, so they can be wrong. Please don't share personal details here."
      >
        <div className="flex max-h-[50vh] min-h-40 flex-col gap-3 overflow-y-auto" aria-live="polite">
          {messages.length === 0 ? (
            <div className="flex flex-col gap-2">
              <p className="m-0 text-body text-ink-muted">Try one of these, or type your own.</p>
              {STARTERS.map((s) => (
                <ChoiceChip key={s} label={s} align="start" onPick={() => void ask(s)} />
              ))}
            </div>
          ) : (
            messages.map((m, i) => {
              const text = m.role === "assistant" ? visible(m.content) : m.content;
              const handoff = m.role === "assistant" && m.content.includes(HANDOFF);
              return (
                <div key={i} className={cx("flex flex-col gap-2", m.role === "user" ? "items-end" : "items-start")}>
                  <p
                    className={cx(
                      "m-0 max-w-[85%] rounded-md px-3 py-2 text-body whitespace-pre-line",
                      m.role === "user" ? "bg-forest-soft text-ink" : "border border-line bg-cream text-ink",
                    )}
                  >
                    {m.role === "user" ? <span className="sr-only">You: </span> : <span className="sr-only">Assistant: </span>}
                    {text || <span className="text-ink-muted">Writing an answer…</span>}
                  </p>
                  {handoff && !(busy && i === messages.length - 1) ? (
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" size="md" iconLeft="calendar" href="/get-started?path=call">
                        Book a free call
                      </Button>
                      <Button variant="outline" size="md" iconLeft="mail" href={`mailto:${CONTACT_EMAIL}`}>
                        Email us
                      </Button>
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
          <div ref={end} />
        </div>

        {error ? <Banner tone="error">{error}</Banner> : null}

        <form onSubmit={submit} className="m-0 flex items-end gap-2">
          <TextInput
            label="Your question"
            name="question"
            value={draft}
            maxLength={MAX_QUESTION_LENGTH}
            autoComplete="off"
            onChange={(e) => setDraft(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" variant="secondary" size="md" iconLeft="send" loading={busy} disabled={!draft.trim()} aria-label="Send">
            Send
          </Button>
        </form>
      </Sheet>
    </>
  );
}
