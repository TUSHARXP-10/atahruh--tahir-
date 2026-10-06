"use client";

import { ArrowRight, Hourglass, Leaf, ShieldCheck, Sparkles, Truck, Users } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRef, type CSSProperties } from "react";
import { GoldDust } from "@/components/motion/gold-dust";
import { Magnetic } from "@/components/motion/magnetic";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { HeroBlock } from "@/server/queries/content";

/** Entrance delay for the CSS `.hero-rise` / `.hero-word` animations (globals.css). */
const delay = (seconds: number) => ({ "--delay": `${seconds}s` }) as CSSProperties;

/**
 * Full-bleed cinematic hero: architecture backdrop, the product scene blended
 * in on the right, drifting gold sparks, and the trust row inside the hero.
 */
export function Hero({ data }: { data: HeroBlock }) {
  const t = useTranslations("home");
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const yBack = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "12%"]);
  const yFront = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "-6%"]);

  const trust = [
    { Icon: Leaf, title: t("trust.natural"), sub: t("trust.naturalSub") },
    { Icon: Hourglass, title: t("trust.longLasting"), sub: t("trust.longLastingSub") },
    { Icon: Sparkles, title: t("trust.therapeutic"), sub: t("trust.therapeuticSub") },
    { Icon: ShieldCheck, title: t("trust.secure"), sub: t("trust.secureSub") },
    { Icon: Truck, title: t("trust.delivery"), sub: t("trust.deliverySub") },
    { Icon: Users, title: t("trust.customers"), sub: t("trust.customersSub") },
  ];

  return (
    <section ref={ref} data-tone="dark" className="relative -mt-20 flex min-h-[max(46rem,100svh)] flex-col overflow-hidden bg-noir">
      {/* Architecture backdrop */}
      <motion.div className="absolute inset-0" style={{ y: yBack }} aria-hidden>
        <Image src={data.background} alt="" fill loading="eager" fetchPriority="high" sizes="100vw" quality={60} className="object-cover object-[50%_40%] opacity-80" />
      </motion.div>

      {/* Product scene, blended in on the right */}
      <motion.div className="absolute inset-y-0 end-0 w-full md:w-[68%]" style={{ y: yFront }} aria-hidden>
        <div className="hero-scene hero-scene-mask relative h-full w-full">
          <Image src={data.image} alt="" fill loading="eager" sizes="(min-width: 768px) 68vw, 100vw" quality={80} className="object-cover object-[50%_72%] brightness-110 saturate-[1.15]" />
        </div>
      </motion.div>

      {/* Light & shade */}
      <div className="absolute inset-0 bg-gradient-to-r from-noir via-noir/60 to-transparent rtl:bg-gradient-to-l" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-t from-noir via-transparent to-noir/40" aria-hidden />
      <div className="absolute end-[18%] top-[30%] size-[28rem] rounded-full bg-[radial-gradient(circle,rgba(232,205,146,0.22),transparent_65%)] blur-2xl" aria-hidden />
      <GoldDust density={0.00012} maxParticles={180} />

      {/* Copy */}
      <div className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-1 items-center px-4 pb-10 pt-32 sm:px-6 lg:px-10">
        <div className="max-w-xl">
          <p className="hero-rise eyebrow mb-6 text-[0.66rem] text-gold-light sm:text-[0.72rem]" style={delay(0.2)}>
            {data.eyebrow}
          </p>
          <h1 className="text-display-xl">
            <HeroLine text={data.title} start={0.3} className="text-ivory" />
            <HeroLine text={data.titleAccent} start={0.55} wordClassName="text-gold-animated" />
          </h1>
          <p className="hero-rise mt-7 max-w-md text-[1.02rem] leading-relaxed text-ivory/80" style={delay(0.95)}>
            {data.subtitle}
          </p>
          <div className="hero-rise mt-9 flex flex-wrap items-center gap-4" style={delay(1.1)}>
            <Magnetic>
              <Button asChild size="lg">
                <Link href={data.primaryCta.href}>
                  {data.primaryCta.label} <ArrowRight className="rtl:-scale-x-100" strokeWidth={1.5} />
                </Link>
              </Button>
            </Magnetic>
            <Button asChild size="lg" variant="outline" className="bg-noir/30 backdrop-blur">
              <Link href={data.secondaryCta.href}>
                {data.secondaryCta.label}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Side rail */}
      <div className="absolute end-6 top-1/2 z-10 hidden -translate-y-1/2 flex-col items-center gap-4 xl:flex" aria-hidden>
        <span className="text-[0.58rem] uppercase tracking-[0.38em] text-ivory/70 [writing-mode:vertical-rl]">{t("moreThanFragrance")}</span>
        <span className="h-14 w-px bg-gradient-to-b from-gold/70 to-transparent" />
        <span className="text-[0.55rem] uppercase tracking-[0.38em] text-mist [writing-mode:vertical-rl]">{t("scroll")}</span>
      </div>

      {/* Trust row inside the hero */}
      <div className="hero-rise relative z-10 border-t border-white/10 bg-noir/55 backdrop-blur-md" style={delay(1.3)}>
        <ul className="mx-auto grid max-w-[1440px] grid-cols-2 px-4 sm:grid-cols-3 sm:px-6 lg:grid-cols-6 lg:px-10">
          {trust.map(({ Icon, title, sub }, i) => (
            <li
              key={title}
              className={`flex items-center gap-3 py-4 lg:justify-center ${i > 0 ? "lg:border-s lg:border-white/10" : ""}`}
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-full border border-gold/40 text-gold-light">
                <Icon className="size-4" strokeWidth={1.25} />
              </span>
              <span className="leading-tight">
                <span className="block text-[0.74rem] font-semibold text-ivory">{title}</span>
                <span className="block text-[0.68rem] text-smoke">{sub}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** One headline line, revealed word by word (split on spaces only, so Arabic stays joined). */
function HeroLine({ text, start, className, wordClassName }: { text: string; start: number; className?: string; wordClassName?: string }) {
  const words = text.split(" ");
  return (
    <span className={cn("block", className)}>
      <span className="sr-only">{text}</span>
      {words.map((word, i) => (
        <span key={`${word}-${i}`} className="inline-block overflow-hidden pb-[0.12em] align-bottom" aria-hidden>
          <span className="hero-word" style={delay(start + i * 0.07)}>
            <span className={cn("inline-block", wordClassName)}>{word}</span>
          </span>
          {i < words.length - 1 ? " " : null}
        </span>
      ))}
    </span>
  );
}
