"use client";

import { ArrowUp, Loader2, MessageCircle, RotateCcw, Sparkles } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Link } from "@/i18n/navigation";
import { formatPrice } from "@/lib/money";
import { cn } from "@/lib/utils";

type ProductChip = { slug: string; name: string; tagline: string; price: number; image: string | null; color: string };
type ChatMessage = { role: "user" | "assistant"; content: string; products?: ProductChip[]; error?: boolean };

const STORE_KEY = "aar-concierge";

function load(): ChatMessage[] {
  try {
    const raw = sessionStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

/** The concierge conversation. Shared by the drawer and the /concierge page. */
export function ConciergeChat({ whatsapp, compact = false, onNavigate }: { whatsapp: string; compact?: boolean; onNavigate?: () => void }) {
  const t = useTranslations("concierge");
  const locale = useLocale();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const abort = useRef<AbortController | null>(null);

  // Restore the conversation for this browser session (the drawer and page share it).
  // Nothing is saved until the restore has happened, so an effect that runs twice
  // (React dev mode) can't overwrite the saved conversation with an empty one.
  const restored = useRef(false);
  useEffect(() => {
    const saved = load();
    const restore = window.setTimeout(() => {
      restored.current = true;
      if (saved.length) setMessages(saved);
    }, 0);
    return () => window.clearTimeout(restore);
  }, []);
  useEffect(() => {
    if (!restored.current) return;
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify(messages.slice(-30)));
    } catch {}
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages]);
  useEffect(() => () => abort.current?.abort(), []);

  const patchLast = (fn: (m: ChatMessage) => ChatMessage) => setMessages((ms) => ms.map((m, i) => (i === ms.length - 1 ? fn(m) : m)));

  const send = async (text: string) => {
    const content = text.trim().slice(0, 2000);
    if (!content || streaming) return;
    const history = [...messages.filter((m) => !m.error && m.content), { role: "user" as const, content }].slice(-20);
    // The API expects the conversation to start with the customer
    while (history.length && history[0].role !== "user") history.shift();
    setMessages((ms) => [...ms, { role: "user", content }, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);
    abort.current = new AbortController();
    try {
      const res = await fetch("/api/concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, messages: history.map(({ role, content: c }) => ({ role, content: c })) }),
        signal: abort.current.signal,
      });
      if (!res.ok || !res.body) {
        const key = res.status === 429 ? "rateLimit" : res.status === 503 ? "unavailable" : "failed";
        patchLast((m) => ({ ...m, content: t(key), error: true }));
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as { type: string; text?: string; items?: ProductChip[]; message?: string };
          if (event.type === "text" && event.text) patchLast((m) => ({ ...m, content: m.content + event.text }));
          else if (event.type === "products" && event.items) patchLast((m) => ({ ...m, products: event.items }));
          else if (event.type === "error") patchLast((m) => ({ ...m, content: m.content || t(event.message === "busy" ? "busy" : "failed"), error: !m.content }));
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") patchLast((m) => ({ ...m, content: m.content || t("failed"), error: !m.content }));
    } finally {
      setStreaming(false);
    }
  };

  const reset = () => {
    abort.current?.abort();
    setMessages([]);
    setStreaming(false);
  };

  const last = messages[messages.length - 1];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={scroller} className="flex-1 space-y-5 overflow-y-auto px-5 py-6" data-lenis-prevent aria-live="polite">
        <Bubble role="assistant">
          <p>{t("greeting")}</p>
        </Bubble>
        {!messages.length ? (
          <div className="flex flex-wrap gap-2 ps-1">
            {(t.raw("suggestions") as string[]).map((s) => (
              <button key={s} type="button" onClick={() => send(s)} className="rounded-full border border-gold/30 px-3.5 py-1.5 text-start text-xs text-sand transition-colors hover:border-gold hover:text-gold-light">
                {s}
              </button>
            ))}
          </div>
        ) : null}
        {messages.map((m, i) => (
          <div key={i}>
            <Bubble role={m.role} error={m.error}>
              {m.role === "assistant" && !m.content && streaming && i === messages.length - 1 ? (
                <span className="inline-flex items-center gap-2 text-smoke">
                  <Loader2 className="size-3.5 animate-spin" /> {t("thinking")}
                </span>
              ) : m.role === "assistant" ? (
                <div className="concierge-md">
                  <ReactMarkdown
                    components={{
                      a: ({ href = "", children }) =>
                        href.startsWith("/") ? (
                          <Link href={href} onClick={onNavigate} className="text-gold-light underline underline-offset-4 hover:text-gold-pale">
                            {children}
                          </Link>
                        ) : (
                          <a href={href} target="_blank" rel="noreferrer noopener" className="text-gold-light underline underline-offset-4">
                            {children}
                          </a>
                        ),
                    }}
                  >
                    {m.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-line">{m.content}</p>
              )}
            </Bubble>
            {m.products?.length ? (
              <ul className={cn("mt-3 grid gap-2", compact ? "grid-cols-1" : "sm:grid-cols-2")}>
                {m.products.map((p) => (
                  <li key={p.slug}>
                    <Link href={`/products/${p.slug}`} onClick={onNavigate} className="flex items-center gap-3 rounded-lg border border-gold/15 bg-white/[0.03] p-2 transition-colors hover:border-gold/50">
                      <span className="relative size-14 shrink-0 overflow-hidden rounded-md" style={{ backgroundColor: p.color }}>
                        {p.image ? <Image src={p.image} alt="" fill sizes="56px" className="object-cover" /> : null}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm text-ivory">{p.name}</span>
                        <span className="block truncate text-xs text-mist">{p.tagline}</span>
                        <span className="block text-xs text-gold">{t("from", { price: formatPrice(p.price, locale) })}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
            {m.error ? (
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-xs text-[#5fd08f] hover:underline">
                <MessageCircle className="size-3.5" /> {t("whatsapp")}
              </a>
            ) : null}
          </div>
        ))}
      </div>

      <div className="border-t border-gold/15 p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
          className="flex items-end gap-2"
        >
          <label className="sr-only" htmlFor="concierge-input">
            {t("placeholder")}
          </label>
          <textarea
            id="concierge-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(input);
              }
            }}
            rows={1}
            maxLength={2000}
            placeholder={t("placeholder")}
            className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-gold/25 bg-noir/60 px-4 py-2.5 text-sm text-ivory placeholder:text-mist focus:border-gold/70 focus:outline-none"
          />
          <button type="submit" disabled={!input.trim() || streaming} className="grid size-11 shrink-0 place-items-center rounded-full bg-gold-metal text-ink transition-opacity disabled:opacity-40" aria-label={t("send")}>
            {streaming ? <Loader2 className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
          </button>
        </form>
        <div className="mt-2 flex items-center justify-between gap-3 text-[0.65rem] text-mist">
          <span>{t("disclaimer")}</span>
          {last ? (
            <button type="button" onClick={reset} className="inline-flex shrink-0 items-center gap-1 hover:text-gold-light">
              <RotateCcw className="size-3" /> {t("newChat")}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Bubble({ role, error, children }: { role: "user" | "assistant"; error?: boolean; children: React.ReactNode }) {
  return (
    <div className={cn("flex", role === "user" ? "justify-end" : "justify-start")}>
      {role === "assistant" ? (
        <span className="me-2.5 mt-1 grid size-7 shrink-0 place-items-center rounded-full border border-gold/30 text-gold" aria-hidden>
          <Sparkles className="size-3.5" />
        </span>
      ) : null}
      <div
        dir="auto"
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 text-[0.92rem] leading-relaxed",
          role === "user" ? "rounded-ee-sm bg-gold/15 text-ivory" : "rounded-es-sm border border-white/8 bg-white/[0.04] text-sand",
          error && "border-ruby/40 text-[#f0a3ad]",
        )}
      >
        {children}
      </div>
    </div>
  );
}
