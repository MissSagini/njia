import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { activePackage } from "@/app/(site)/get-started/data";
import { systemPrompt } from "@/lib/chat/knowledge";
import { streamReply } from "@/lib/chat/gemini";
import { MAX_HISTORY, MAX_QUESTION_LENGTH } from "@/lib/chat/shared";
import { geminiEnv } from "@/lib/env";

const bodySchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(4000) }))
    .min(1)
    .max(MAX_HISTORY)
    .refine((m) => m.at(-1)?.role === "user" && m.at(-1)!.content.length <= MAX_QUESTION_LENGTH),
});

// Best effort per server instance: enough to stop one visitor running up the bill.
const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 20;
const hits = new Map<string, number[]>();

function allowed(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= LIMIT) return false;
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return true;
}

/**
 * The website's chat assistant. Public: it answers from the website's content
 * and general knowledge, and never reads any account. Replies stream as plain text.
 */
export async function POST(request: NextRequest) {
  if (!geminiEnv()) return NextResponse.json({ error: "off" }, { status: 404 });
  // Only our own pages may call this
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!allowed(ip)) return NextResponse.json({ error: "busy" }, { status: 429 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  // The price always comes from the packages table, never from code
  const pkg = await activePackage().catch(() => null);
  const stream = await streamReply(systemPrompt(pkg), parsed.data.messages, request.signal).catch(() => null);
  if (!stream) return NextResponse.json({ error: "unavailable" }, { status: 502 });

  return new Response(stream.pipeThrough(new TextEncoderStream()), {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
