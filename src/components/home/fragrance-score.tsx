"use client";

import { ArrowRight, Clock, Flame, Heart, Layers, Leaf, Moon, Sparkles, Target, Wand2, Zap } from "lucide-react";
import { motion, useInView, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useRef } from "react";
import { GoldDust } from "@/components/motion/gold-dust";
import { Magnetic } from "@/components/motion/magnetic";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Link } from "@/i18n/navigation";
import { photo } from "@/lib/images";

const MOODS = [
  { key: "CALM", notes: "Lavender · Sleep", notesAr: "خزامى · نوم", Icon: Moon, tint: "#8b7bd8", side: "start", top: "8%" },
  { key: "ENERGETIC", notes: "Citrus · Fresh", notesAr: "حمضيات · انتعاش", Icon: Zap, tint: "#e8a33d", side: "start", top: "38%" },
  { key: "CONFIDENT", notes: "Oud · Musk", notesAr: "عود · مسك", Icon: Flame, tint: "#d65a3a", side: "start", top: "68%" },
  { key: "FOCUSED", notes: "Sandalwood · Amber", notesAr: "صندل · عنبر", Icon: Target, tint: "#5a9bd5", side: "end", top: "8%" },
  { key: "ROMANTIC", notes: "Rose · Vanilla", notesAr: "ورد · فانيليا", Icon: Heart, tint: "#e0607e", side: "end", top: "38%" },
  { key: "BALANCED", notes: "Natural Therapies", notesAr: "علاجات طبيعية", Icon: Leaf, tint: "#5fae7d", side: "end", top: "68%" },
] as const;

export function FragranceScore() {
  const t = useTranslations("home.score");
  const tm = useTranslations("moods");
  const locale = useLocale();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.35 });
  const reduce = useReducedMotion();

  return (
    <Section tone="dark" className="overflow-hidden py-16 lg:py-24">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_65%_50%,rgba(201,165,92,0.14),transparent_60%)]" aria-hidden />
      <GoldDust density={0.00005} className="opacity-70" />
      <Container className="relative grid items-center gap-12 grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <h2 className="font-display text-[clamp(2.4rem,4.4vw,3.9rem)] leading-[1.02] text-ivory">
            <span className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {t("titleA")}
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/50 px-3 py-1 font-sans text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-gold-light">
                <Sparkles className="size-3" /> {t("badge")}
              </span>
            </span>
            <span className="block">{t("titleB")}</span>
          </h2>
          <p className="mt-6 max-w-md text-ivory/75">{t("text")}</p>
          <Magnetic className="mt-8">
            <Button asChild size="lg">
              <Link href="/fragrance-quiz">
                {t("cta")} <ArrowRight className="rtl:-scale-x-100" strokeWidth={1.5} />
              </Link>
            </Button>
          </Magnetic>
          <ul className="mt-12 grid grid-cols-2 gap-5 border-t border-white/10 pt-8 sm:grid-cols-4">
            {[
              { Icon: Wand2, label: t("f1") },
              { Icon: Heart, label: t("f2") },
              { Icon: Layers, label: t("f3") },
              { Icon: Clock, label: t("f4") },
            ].map(({ Icon, label }) => (
              <li key={label} className="flex items-start gap-2.5 text-[0.72rem] leading-snug text-smoke">
                <Icon className="mt-0.5 size-4 shrink-0 text-gold" strokeWidth={1.25} />
                {label}
              </li>
            ))}
          </ul>
        </div>

        {/* Portrait with orbiting mood cards */}
        <div ref={ref} className="relative mx-auto h-[30rem] w-full max-w-[44rem] sm:h-[34rem] lg:col-span-7 lg:h-[36rem]">
          <div className="portrait-mask absolute inset-x-[14%] inset-y-0 sm:inset-x-[22%]">
            <Image src={photo("portraitFlower")} alt="" fill sizes="(min-width: 1024px) 28rem, 70vw" className="object-cover object-[50%_30%]" />
          </div>

          {MOODS.map((m, i) => (
            <motion.div
              key={m.key}
              className={`absolute ${m.side === "start" ? "start-0" : "end-0"}`}
              style={{ top: m.top }}
              initial={reduce ? false : { opacity: 0, x: m.side === "start" ? -24 : 24 }}
              animate={inView ? { opacity: 1, x: 0 } : undefined}
              transition={{ delay: 0.2 + i * 0.12, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="glass-light flex w-40 items-center gap-2.5 rounded-lg border border-white/12 p-2.5 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.7)] sm:w-48 sm:p-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full" style={{ background: `${m.tint}26`, color: m.tint }}>
                  <m.Icon className="size-4" strokeWidth={1.75} />
                </span>
                <span className="min-w-0 leading-tight">
                  <span className="block text-[0.85rem] font-semibold text-ivory">{tm(m.key)}</span>
                  <span className="block truncate text-[0.66rem] text-smoke">{locale === "ar" ? m.notesAr : m.notes}</span>
                </span>
              </div>
            </motion.div>
          ))}

          <p className={`absolute bottom-2 end-2 -rotate-6 text-gold-light ${locale === "ar" ? "font-arabic text-3xl" : "font-script text-3xl sm:text-4xl"}`}>
            {t("signature")}
          </p>
        </div>
      </Container>
    </Section>
  );
}
