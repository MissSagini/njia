import "server-only";
import { geminiEnv } from "@/lib/env";

export type ChatMessage = { role: "user" | "assistant"; content: string };

/**
 * Asks Google's Gemini API for a reply and returns it as a stream of plain text.
 * Returns null if Gemini isn't set up or refuses the request.
 * Message text is never logged.
 */
export async function streamReply(system: string, messages: ChatMessage[], signal: AbortSignal): Promise<ReadableStream<string> | null> {
  const env = geminiEnv();
  if (!env) return null;

  const request = () =>
    fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(env.GEMINI_MODEL)}:streamGenerateContent?alt=sse`, {
      method: "POST",
      signal,
      headers: { "x-goog-api-key": env.GEMINI_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        // Gemini calls the assistant "model"
        contents: messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
        // Room for models that think before answering; the prompt keeps answers short
        generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
      }),
    });

  let res = await request();
  // Gemini is briefly overloaded now and then (503): try once more before giving up
  if (res.status === 503 || res.status === 500) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    res = await request();
  }
  if (!res.ok || !res.body) {
    console.error(`Gemini request failed with status ${res.status}`);
    return null;
  }

  // Server-sent events: one "data: {json}" line per chunk of the reply
  let buffer = "";
  return res.body.pipeThrough(new TextDecoderStream()).pipeThrough(
    new TransformStream<string, string>({
      transform(chunk, controller) {
        buffer += chunk;
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.error) {
              console.error("Gemini stream error", event.error.code ?? "");
              controller.error(new Error("Gemini stream error"));
              return;
            }
            const parts: { text?: string; thought?: boolean }[] = event.candidates?.[0]?.content?.parts ?? [];
            const text = parts
              .filter((p) => !p.thought)
              .map((p) => p.text ?? "")
              .join("");
            if (text) controller.enqueue(text);
          } catch {
            // A malformed event: skip it rather than end the reply
          }
        }
      },
    }),
  );
}
