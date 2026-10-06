"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { sendContactMessage } from "@/server/actions/contact";

const TOPICS = ["order", "product", "gifting", "wholesale", "other"] as const;
const field = "h-12 w-full rounded-md border border-hairline bg-surface px-4 text-sm text-heading placeholder:text-fg-muted focus:border-accent focus:outline-none aria-invalid:border-ruby";

export function ContactForm() {
  const t = useTranslations("contact");
  const locale = useLocale();
  const [pending, start] = useTransition();
  const [invalid, setInvalid] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  if (sentTo) {
    return (
      <div className="grid place-items-center rounded-lg border border-hairline bg-surface px-6 py-16 text-center" role="status">
        <CheckCircle2 className="size-10 text-accent" strokeWidth={1.25} />
        <p className="mt-4 font-display text-3xl text-heading">{t("sentTitle")}</p>
        <p className="mt-2 max-w-sm text-sm text-fg-muted">{t("sent", { email: sentTo })}</p>
        <button type="button" onClick={() => setSentTo(null)} className="mt-6 text-sm text-accent underline-offset-4 hover:underline">
          {t("another")}
        </button>
      </div>
    );
  }

  return (
    <form
      className="grid gap-4 rounded-lg border border-hairline bg-surface p-6 sm:grid-cols-2 sm:p-8"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const get = (k: string) => String(f.get(k) ?? "");
        start(async () => {
          const res = await sendContactMessage({
            name: get("name"),
            email: get("email"),
            phone: get("phone"),
            topic: get("topic") as (typeof TOPICS)[number],
            orderNumber: get("orderNumber"),
            message: get("message"),
            website: get("website"),
            locale,
          });
          if (res.ok) {
            setSentTo(res.email);
            setInvalid([]);
            setError(null);
          } else {
            setInvalid(res.fields ?? []);
            setError(res.error === "RATE_LIMIT" ? t("rateLimit") : t("error"));
          }
        });
      }}
      noValidate
    >
      <p className="font-display text-3xl text-heading sm:col-span-2">{t("formTitle")}</p>
      <Labelled label={t("name")} htmlFor="c-name">
        <input id="c-name" name="name" autoComplete="name" required className={field} aria-invalid={invalid.includes("name")} />
      </Labelled>
      <Labelled label={t("email")} htmlFor="c-email">
        <input id="c-email" name="email" type="email" autoComplete="email" required className={field} aria-invalid={invalid.includes("email")} />
      </Labelled>
      <Labelled label={t("phone")} htmlFor="c-phone">
        <input id="c-phone" name="phone" type="tel" autoComplete="tel" className={field} />
      </Labelled>
      <Labelled label={t("topic")} htmlFor="c-topic">
        <select id="c-topic" name="topic" defaultValue="product" className={cn(field, "appearance-none")}>
          {TOPICS.map((k) => (
            <option key={k} value={k}>
              {t(`topics.${k}`)}
            </option>
          ))}
        </select>
      </Labelled>
      <Labelled label={t("orderNumber")} htmlFor="c-order" className="sm:col-span-2">
        <input id="c-order" name="orderNumber" placeholder="AAR-" className={field} dir="ltr" />
      </Labelled>
      <Labelled label={t("message")} htmlFor="c-message" className="sm:col-span-2">
        <textarea id="c-message" name="message" required rows={6} className={cn(field, "h-auto py-3 leading-relaxed")} aria-invalid={invalid.includes("message")} />
      </Labelled>
      {/* Honeypot for bots — hidden from people and screen readers */}
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      {error ? (
        <p role="alert" className="text-sm text-ruby sm:col-span-2">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-4 sm:col-span-2">
        <p className="text-xs text-fg-muted">{t("privacy")}</p>
        <Button type="submit" disabled={pending} className="bg-btn text-btn-fg shadow-none">
          {pending ? <Loader2 className="animate-spin" /> : null}
          {pending ? t("sending") : t("send")}
        </Button>
      </div>
    </form>
  );
}

function Labelled({ label, htmlFor, className, children }: { label: string; htmlFor: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-2 block text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-fg-muted">
        {label}
      </label>
      {children}
    </div>
  );
}
