"use client";

import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { QUIZ_FAMILIES, QUIZ_MOODS, QUIZ_OCCASIONS, type QuizAnswers } from "@/lib/quiz";
import { cn } from "@/lib/utils";
import { submitQuiz } from "@/server/actions/quiz";

type Draft = {
  forWhom?: QuizAnswers["forWhom"];
  moods: string[];
  families: string[];
  intensity?: QuizAnswers["intensity"];
  occasions: string[];
  season?: QuizAnswers["season"];
  form?: QuizAnswers["form"];
  budget?: QuizAnswers["budget"];
};

type Step =
  | { key: "forWhom" | "intensity" | "season" | "form" | "budget"; multi: false; options: string[] }
  | { key: "moods" | "families" | "occasions"; multi: true; max: number; options: readonly string[] };

const STEPS: Step[] = [
  { key: "forWhom", multi: false, options: ["me-her", "me-him", "gift-her", "gift-him", "anyone"] },
  { key: "moods", multi: true, max: 2, options: QUIZ_MOODS },
  { key: "families", multi: true, max: 3, options: QUIZ_FAMILIES },
  { key: "intensity", multi: false, options: ["2", "3", "5"] },
  { key: "occasions", multi: true, max: 2, options: QUIZ_OCCASIONS },
  { key: "season", multi: false, options: ["SUMMER", "MONSOON", "WINTER", "ALL"] },
  { key: "form", multi: false, options: ["PERFUME", "ATTAR", "THERAPY", "ANY"] },
  { key: "budget", multi: false, options: ["u1500", "1500-3000", "o3000", "any"] },
];

/** Accent swatches for families so the grid reads at a glance. */
const FAMILY_TINT: Record<string, string> = {
  FLORAL: "#d98ca6",
  OUD: "#6b3f2a",
  WOODY: "#8a6a45",
  AMBER: "#c98a2b",
  CITRUS: "#e4b93a",
  FRESH: "#7fb7b0",
  SPICY: "#b5532f",
  MUSK: "#cbb8a6",
  EARTHY: "#6f7a4a",
  GOURMAND: "#9a5b3c",
};

export function QuizFlow() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [draft, setDraft] = useState<Draft>({ moods: [], families: [], occasions: [] });
  const [pending, start] = useTransition();
  const step = STEPS[index];
  const last = index === STEPS.length - 1;

  const label = (key: Step["key"], option: string) => {
    if (key === "moods") return t(`moods.${option}`);
    if (key === "families") return t(`families.${option}`);
    if (key === "occasions") return t(`occasions.${option}`);
    return t(`quiz.o.${key}.${option}`);
  };
  const hint = (key: Step["key"], option: string) => (key === "intensity" ? t(`quiz.o.intensityHint.${option}`) : key === "form" ? t(`quiz.o.formHint.${option}`) : null);

  const value = (key: Step["key"]) => draft[key];
  const answered = step.multi ? true : value(step.key) !== undefined;

  const go = (delta: number) => {
    setDir(delta);
    setIndex((i) => Math.max(0, Math.min(STEPS.length - 1, i + delta)));
  };

  const finish = (d: Draft) =>
    start(async () => {
      const answers: QuizAnswers = {
        forWhom: d.forWhom ?? "anyone",
        moods: d.moods,
        families: d.families,
        intensity: d.intensity ?? 3,
        occasions: d.occasions,
        season: d.season ?? "ALL",
        form: d.form ?? "ANY",
        budget: d.budget ?? "any",
      };
      const res = await submitQuiz(answers, locale);
      if (res.ok) router.push(`/fragrance-quiz/r/${res.id}`);
      else toast.error(t("common.error"));
    });

  const choose = (option: string) => {
    if (step.multi) {
      const current = draft[step.key];
      const next = current.includes(option) ? current.filter((o) => o !== option) : current.length >= step.max ? [...current.slice(1), option] : [...current, option];
      setDraft((d) => ({ ...d, [step.key]: next }));
      return;
    }
    const v = step.key === "intensity" ? (Number(option) as QuizAnswers["intensity"]) : option;
    const nextDraft = { ...draft, [step.key]: v } as Draft;
    setDraft(nextDraft);
    // Single choice: move on by itself after a beat
    window.setTimeout(() => (last ? finish(nextDraft) : go(1)), 260);
  };

  if (pending) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-center" role="status">
        <div>
          <Sparkles className="mx-auto size-10 animate-pulse text-gold" strokeWidth={1} />
          <p className="mt-6 font-display text-3xl text-ivory">{t("quiz.revealing")}</p>
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="mx-auto max-w-2xl py-10 text-center">
        <p className="eyebrow">{t("quiz.result.eyebrow")}</p>
        <h1 className="mt-4 text-display-lg text-ivory">{t("quiz.metaTitle")}</h1>
        <p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-smoke">{t("quiz.intro")}</p>
        <Button size="lg" className="mt-10" onClick={() => setStarted(true)}>
          {t("quiz.start")} <ArrowRight className="rtl:-scale-x-100" strokeWidth={1.5} />
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-10">
        <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.16em] text-mist">
          <span>{t("quiz.step", { n: index + 1, total: STEPS.length })}</span>
          {step.multi ? <span>{t("quiz.pickUpTo", { n: step.max })}</span> : null}
        </div>
        <div className="h-px bg-white/10" aria-hidden>
          <motion.div className="h-px bg-gold" animate={{ width: `${((index + (answered && step.multi ? 1 : 0)) / STEPS.length) * 100}%` }} transition={{ duration: 0.5 }} />
        </div>
      </div>

      <AnimatePresence mode="wait" custom={dir}>
        <motion.div
          key={step.key}
          custom={dir}
          initial={{ opacity: 0, x: dir * 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: dir * -40 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 id={`q-${step.key}`} className="text-center font-display text-[clamp(2rem,4vw,3.2rem)] leading-tight text-ivory">
            {t(`quiz.q.${step.key}`)}
          </h2>
          <div
            role={step.multi ? "group" : "radiogroup"}
            aria-labelledby={`q-${step.key}`}
            className={cn("mt-10 grid gap-3", step.options.length > 6 ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5" : step.options.length > 4 ? "grid-cols-2 sm:grid-cols-3" : "sm:grid-cols-2")}
          >
            {step.options.map((o) => {
              const v = value(step.key);
              const on = step.multi ? (v as string[]).includes(o) : String(v) === o;
              const h = hint(step.key, o);
              return (
                <button
                  key={o}
                  type="button"
                  role={step.multi ? undefined : "radio"}
                  aria-checked={step.multi ? undefined : on}
                  aria-pressed={step.multi ? on : undefined}
                  onClick={() => choose(o)}
                  className={cn(
                    "group relative flex min-h-20 items-center gap-3 rounded-lg border px-5 py-4 text-start transition-all duration-300",
                    on ? "border-gold bg-gold/12 shadow-[0_0_0_1px_rgba(201,165,92,0.6)]" : "border-white/12 bg-white/[0.03] hover:border-gold/50 hover:bg-white/[0.06]",
                  )}
                >
                  {step.key === "families" ? <span className="size-3 shrink-0 rounded-full" style={{ background: FAMILY_TINT[o] }} aria-hidden /> : null}
                  <span className="flex-1">
                    <span className={cn("block text-[0.98rem]", on ? "text-gold-light" : "text-ivory")}>{label(step.key, o)}</span>
                    {h ? <span className="mt-0.5 block text-xs text-mist">{h}</span> : null}
                  </span>
                  <span className={cn("grid size-5 shrink-0 place-items-center rounded-full border transition-colors", on ? "border-gold bg-gold text-ink" : "border-white/25")}>
                    {on ? <Check className="size-3" strokeWidth={3} /> : null}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="mt-10 flex items-center justify-between">
        <button type="button" onClick={() => (index === 0 ? setStarted(false) : go(-1))} className="inline-flex items-center gap-2 text-sm text-smoke hover:text-gold-light">
          <ArrowLeft className="size-4 rtl:-scale-x-100" /> {t("quiz.back")}
        </button>
        {step.multi ? (
          <Button onClick={() => (last ? finish(draft) : go(1))}>
            {value(step.key) && (value(step.key) as string[]).length ? (last ? t("quiz.finish") : t("quiz.next")) : t("quiz.skip")}
            {pending ? <Loader2 className="animate-spin" /> : <ArrowRight className="rtl:-scale-x-100" strokeWidth={1.5} />}
          </Button>
        ) : answered && !last ? (
          <Button variant="outline" onClick={() => go(1)}>
            {t("quiz.next")} <ArrowRight className="rtl:-scale-x-100" strokeWidth={1.5} />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
