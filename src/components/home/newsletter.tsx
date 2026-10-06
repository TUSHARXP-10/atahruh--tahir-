"use client";

import { Check, Crown, Gift, Leaf, Sparkles } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { photo } from "@/lib/images";
import { subscribeNewsletter } from "@/server/actions/engagement";

export function Newsletter() {
  const t = useTranslations("home.newsletter");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  return (
    <Section tone="dark" className="overflow-hidden border-y border-white/5">
      <div className="fade-start absolute inset-y-0 end-0 hidden w-[40%] opacity-90 md:block" aria-hidden>
        <Image src={photo("giftBlackGold")} alt="" fill sizes="46vw" className="object-cover object-[50%_60%]" />
        <div className="absolute inset-0 bg-gradient-to-t from-noir/50 to-transparent" />
      </div>
      <Container className="relative py-14 lg:py-16">
        <div className="max-w-xl">
          <h2 className="font-display text-[clamp(2rem,3.4vw,2.9rem)] leading-none text-ivory">{t("title")}</h2>
          <p className="mt-3 text-sm text-smoke">{t("text")}</p>

          <form
            className="mt-7"
            onSubmit={(e) => {
              e.preventDefault();
              start(async () => {
                const res = await subscribeNewsletter({ email, locale, source: "home", website });
                if (!res.ok) setMessage({ ok: false, text: res.error === "RATE_LIMIT" ? t("busy") : t("invalid") });
                else {
                  setMessage({ ok: true, text: res.already ? t("already") : t("success", { code: res.code }) });
                  setEmail("");
                }
              });
            }}
          >
            <input
              name="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              className="hidden"
              aria-hidden
            />
            <div className="flex overflow-hidden rounded-md border border-white/20 bg-white/[0.06] focus-within:border-gold">
              <label htmlFor="newsletter-email" className="sr-only">
                {t("placeholder")}
              </label>
              <input
                id="newsletter-email"
                type="email"
                required
                maxLength={200}
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("placeholder")}
                className="h-12 min-w-0 flex-1 bg-transparent px-4 text-sm text-ivory placeholder:text-mist focus:outline-none"
              />
              <Button type="submit" className="h-12 rounded-none px-6" disabled={pending}>
                {t("cta")}
              </Button>
            </div>
            <p aria-live="polite" className={`mt-2 min-h-5 text-sm ${message?.ok ? "text-gold-light" : "text-[#e48a96]"}`}>
              {message ? (
                <span className="inline-flex items-center gap-2">
                  {message.ok ? <Check className="size-4" /> : null}
                  {message.text}
                </span>
              ) : null}
            </p>
          </form>

          <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-[0.72rem] text-smoke">
            {[
              { Icon: Gift, label: t("perk1") },
              { Icon: Sparkles, label: t("perk2") },
              { Icon: Leaf, label: t("perk3") },
              { Icon: Crown, label: t("perk4") },
            ].map(({ Icon, label }) => (
              <li key={label} className="flex items-center gap-2">
                <Icon className="size-4 text-gold" strokeWidth={1.25} /> {label}
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </Section>
  );
}
