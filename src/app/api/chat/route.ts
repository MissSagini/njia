import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { currentPackage, systemPrompt } from "@/lib/chat/knowledge";
import { streamReply } from "@/lib/chat/gemini";
import { MAX_HISTORY, MAX_QUESTION_LENGTH, MAX_REPLY_HISTORY } from "@/lib/chat/shared";
import { geminiEnv } from "@/lib/env";

const bodySchema = z.object({
  messages: z
    .array(
      z.discriminatedUnion("role", [
        z.object({ role: z.literal("user"), content: z.string().trim().min(1).max(MAX_QUESTION_LENGTH) }),
        z.object({ role: z.literal("assistant"), content: z.string().trim().min(1).max(MAX_REPLY_HISTORY) }),
      ]),
    )
    .min(1)
    .max(MAX_HISTORY)
    .refine((m) => m.at(-1)?.role === "user"),
});

// Best effort per server instance: enough to stop one visitor, or a flood of
// visitors, running up the bill. A shared store (like Vercel KV) would hold across instances.
const WINDOW_MS = 10 * 60 * 1000;
const PER_VISITOR = 20;
const PER_INSTANCE = 300;
const hits = new Map<string, number[]>();
let all: number[] = [];

function allowed(ip: string) {
  const now = Date.now();
  const fresh = (times: number[]) => times.filter((t) => now - t < WINDOW_MS);
  all = fresh(all);
  const recent = fresh(hits.get(ip) ?? []);
  if (recent.length >= PER_VISITOR || all.length >= PER_INSTANCE) return false;
  recent.push(now);
  all.push(now);
  hits.set(ip, recent);
  // Forget visitors whose window has passed, rather than resetting everyone
  if (hits.size > 5000) {
    for (const [key, times] of hits) if (!fresh(times).length) hits.delete(key);
  }
  return true;
}

/** Browsers say where a request came from; only our own pages may call this. */
function sameSite(request: NextRequest) {
  const site = request.headers.get("sec-fetch-site");
  if (site) return site === "same-origin";
  // Older browsers without Sec-Fetch-Site still send Origin on a POST
  return request.headers.get("origin") === request.nextUrl.origin;
}

/**
 * The website's chat assistant. Public: it answers from the website's content
 * and general knowledge, and never reads any account. Replies stream as plain text.
 */
export async function POST(request: NextRequest) {
  if (!geminiEnv()) return NextResponse.json({ error: "off" }, { status: 404 });
  if (!sameSite(request)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  // Vercel sets x-real-ip itself, so visitors can't fake it
  const ip = request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!allowed(ip)) return NextResponse.json({ error: "busy" }, { status: 429 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  // The price always comes from the packages table, never from code
  const pkg = await currentPackage().catch(() => null);
  const stream = await streamReply(systemPrompt(pkg), parsed.data.messages, request.signal).catch(() => null);
  if (!stream) return NextResponse.json({ error: "unavailable" }, { status: 502 });

  return new Response(stream.pipeThrough(new TextEncoderStream()), {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
