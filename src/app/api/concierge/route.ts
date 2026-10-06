import Anthropic from "@anthropic-ai/sdk";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { CONCIERGE_SYSTEM, localeNote } from "@/server/concierge/prompt";
import { CONCIERGE_TOOLS, runConciergeTool } from "@/server/concierge/tools";
import { getAllCards } from "@/server/queries/catalog";

/*
 * AI Scent Concierge — streams newline-delimited JSON events to the browser:
 *   {type:"text", text} · {type:"products", items} · {type:"done"} · {type:"error", message}
 * Claude Opus 5 with catalogue tools, adaptive thinking, prompt caching and the
 * server-side refusal fallback. Disabled when no API key is configured.
 */

const MODEL = process.env.CONCIERGE_MODEL || "claude-opus-5";
const EFFORT = (["low", "medium", "high"] as const).find((e) => e === process.env.CONCIERGE_EFFORT) ?? "medium";
const MAX_TOOL_ROUNDS = 6;

const bodySchema = z.object({
  locale: z.enum(["en", "ar"]).default("en"),
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(2000) }))
    .min(1)
    .max(24)
    .refine((m) => m[0].role === "user" && m[m.length - 1].role === "user", "Conversation must start and end with the customer"),
});

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) return Response.json({ error: "disabled" }, { status: 503 });
  if (!(await rateLimit("concierge", 40, 3600))) return Response.json({ error: "rate_limit" }, { status: 429 });
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid" }, { status: 400 });
  const { locale, messages: history } = parsed.data;

  const client = new Anthropic();
  const encoder = new TextEncoder();

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: Record<string, unknown>) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      // Only earlier turns' final text is resent; tool calls and thinking stay within the turn that made them
      const messages: Anthropic.Beta.BetaMessageParam[] = history.map((m) => ({ role: m.role, content: m.content }));
      const mentioned = new Set<string>();
      let answer = "";
      let jsonRetries = 0;

      try {
        for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
          const stream = client.beta.messages.stream(
            {
              model: MODEL,
              max_tokens: 16000,
              betas: ["server-side-fallback-2026-07-01"],
              fallbacks: "default",
              output_config: { effort: EFFORT },
              tools: CONCIERGE_TOOLS,
              system: [
                { type: "text", text: CONCIERGE_SYSTEM, cache_control: { type: "ephemeral" } },
                { type: "text", text: localeNote(locale) },
              ],
              messages,
            },
            { signal: req.signal },
          );
          let roundText = "";
          stream.on("text", (delta) => {
            // Separate the text written before a tool call from what follows it
            if (!roundText && answer) send({ type: "text", text: "\n\n" });
            roundText += delta;
            send({ type: "text", text: delta });
          });

          let message: Anthropic.Beta.BetaMessage;
          try {
            message = await stream.finalMessage();
            jsonRetries = 0;
          } catch (err) {
            // A tool input that streamed as unparseable JSON: re-issue the turn (API errors are rethrown)
            if (err instanceof Anthropic.APIError || jsonRetries++ >= 2) throw err;
            continue;
          }
          answer += (answer && roundText ? "\n\n" : "") + roundText;

          if (message.stop_reason === "refusal") {
            if (!roundText) send({ type: "text", text: locale === "ar" ? "عذراً، لا أستطيع المساعدة في هذا هنا — فريقنا سعيد بمساعدتك عبر واتساب." : "I’m sorry, I can’t help with that here — our team is happy to help on WhatsApp." });
            break;
          }
          if (message.stop_reason === "pause_turn") {
            messages.push({ role: "assistant", content: message.content });
            continue;
          }
          const toolUses = message.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use");
          if (!toolUses.length || message.stop_reason !== "tool_use") break;

          messages.push({ role: "assistant", content: message.content });
          const results = await Promise.all(
            toolUses.map(async (t) => {
              const out = await runConciergeTool(t.name, t.input, locale);
              out.slugs.forEach((s) => mentioned.add(s));
              return { type: "tool_result" as const, tool_use_id: t.id, content: out.content, is_error: out.isError };
            }),
          );
          // All results for this turn go back together in one user message
          messages.push({ role: "user", content: results });
        }

        // Product cards for the products the answer actually links to
        const linked = [...answer.matchAll(/\/products\/([a-z0-9-]+)/g)].map((m) => m[1]).filter((s) => mentioned.has(s));
        if (linked.length) {
          const cards = await getAllCards(locale);
          const items = [...new Set(linked)]
            .slice(0, 4)
            .map((slug) => cards.find((c) => c.slug === slug))
            .filter((c): c is NonNullable<typeof c> => !!c)
            .map((c) => ({ slug: c.slug, name: c.name, tagline: c.tagline, price: c.minPrice, image: c.forms[0]?.image ?? null, color: c.accentColor }));
          if (items.length) send({ type: "products", items });
        }
        send({ type: "done" });
      } catch (err) {
        if (!req.signal.aborted) {
          console.error("[concierge]", err instanceof Anthropic.APIError ? `${err.status} ${err.message}` : err);
          send({ type: "error", message: err instanceof Anthropic.RateLimitError ? "busy" : "failed" });
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" },
  });
}
