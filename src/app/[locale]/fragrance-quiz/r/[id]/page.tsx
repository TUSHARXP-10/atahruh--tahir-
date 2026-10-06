import { ArrowRight, MessageCircle, RotateCcw } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { GoldDust } from "@/components/motion/gold-dust";
import { CardGrid } from "@/components/product/card-grid";
import { ShareResult, TopMatches } from "@/components/quiz/result-parts";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { DNA_AXES, type Match, type MatchReason, type QuizAnswers, type ScentDNA } from "@/lib/quiz";
import { site } from "@/lib/site";
import type { FormType } from "@/lib/types";
import { getAllCards } from "@/server/queries/catalog";

type Profile = { key: string; dna: ScentDNA; therapyId: string | null };

async function loadResult(id: string) {
  const row = await db.quizResult.findUnique({ where: { id } });
  if (!row) return null;
  return { answers: row.answers as unknown as QuizAnswers, profile: row.profile as unknown as Profile, matches: row.matches as unknown as Match[] };
}

export async function generateMetadata({ params }: PageProps<"/[locale]/fragrance-quiz/r/[id]">): Promise<Metadata> {
  const { locale, id } = await params;
  const [result, t] = await Promise.all([loadResult(id), getTranslations({ locale, namespace: "quiz.result" })]);
  if (!result) return {};
  return {
    title: t(`titles.${result.profile.key}`),
    description: t(`descriptions.${result.profile.key}`),
    robots: { index: false },
    openGraph: { images: [`/og/quiz/${id}`] },
  };
}

export default async function QuizResultPage({ params }: PageProps<"/[locale]/fragrance-quiz/r/[id]">) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const [result, cards, t] = await Promise.all([loadResult(id), getAllCards(locale), getTranslations()]);
  if (!result) notFound();
  const { profile, matches, answers } = result;

  const byId = new Map(cards.map((c) => [c.id, c]));
  const found = matches.map((m) => ({ ...m, card: byId.get(m.id) })).filter((m): m is Match & { card: NonNullable<typeof m.card> } => !!m.card);
  const reasonText = (r: MatchReason) => {
    const v =
      r.k === "mood" ? t(`moods.${r.v}`) : r.k === "family" ? t(`families.${r.v}`) : r.k === "occasion" ? t(`occasions.${r.v}`) : r.k === "season" ? t(`quiz.o.season.${r.v}`) : r.k === "form" ? t(`forms.${r.v}`) : "";
    return t(`quiz.result.reasons.${r.k}`, { v });
  };
  const top = found.slice(0, 3).map((m) => ({ card: m.card, score: m.score, reasons: m.reasons.map(reasonText) }));
  const more = found.slice(3, 9).map((m) => m.card);
  const therapy = profile.therapyId ? byId.get(profile.therapyId) : undefined;
  const preferForm: FormType | undefined = answers.form === "PERFUME" || answers.form === "ATTAR" ? answers.form : undefined;
  const picks = found
    .filter((m) => m.card.isSampleable)
    .slice(0, 5)
    .map((m) => m.card.id);
  const title = t(`quiz.result.titles.${profile.key}`);
  const url = `${site.url}${locale === "en" ? "" : `/${locale}`}/fragrance-quiz/r/${id}`;

  return (
    <>
      <Section tone="dark" className="overflow-hidden">
        <GoldDust density={0.0001} />
        <Container className="relative grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <p className="eyebrow">{t("quiz.result.eyebrow")}</p>
            <h1 className="mt-4 text-display-lg text-ivory">{title}</h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-smoke">{t(`quiz.result.descriptions.${profile.key}`)}</p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <ShareResult url={url} title={title} />
              <Link href="/fragrance-quiz" className="inline-flex items-center gap-2 text-xs text-mist hover:text-gold-light">
                <RotateCcw className="size-3.5" /> {t("quiz.result.retake")}
              </Link>
            </div>
          </div>
          {/* Scent DNA: one measure per axis, so a plain labelled bar list reads best */}
          <figure className="rounded-lg border border-gold/20 bg-ebony/70 p-6 sm:p-8">
            <figcaption className="mb-5 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-gold">{t("quiz.result.dna")}</figcaption>
            <dl className="space-y-4">
              {DNA_AXES.map((axis) => {
                const pct = Math.round((profile.dna[axis] ?? 0) * 100);
                return (
                  <div key={axis}>
                    <div className="mb-1.5 flex justify-between text-sm">
                      <dt className="text-ivory">{t(`quiz.result.axes.${axis}`)}</dt>
                      <dd className="tabular-nums text-sand">{pct}</dd>
                    </div>
                    <div className="h-2 rounded-full bg-white/8" aria-hidden>
                      <div className="h-full rounded-full bg-gold-metal" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </dl>
          </figure>
        </Container>
      </Section>

      <Section tone="dark" className="border-t border-white/5">
        <Container className="py-14 lg:py-20">
          <h2 className="mb-8 font-display text-4xl text-ivory">{t("quiz.result.topMatches")}</h2>
          {top.length ? <TopMatches matches={top} preferForm={preferForm} /> : null}
        </Container>
      </Section>

      {picks.length >= 3 ? (
        <Section tone="light">
          <Container className="flex flex-col items-start justify-between gap-6 py-12 md:flex-row md:items-center">
            <div className="max-w-xl">
              <h2 className="font-display text-3xl text-heading">{t("quiz.result.tryDiscovery")}</h2>
              <p className="mt-2 text-fg-muted">{t("quiz.result.tryDiscoveryText")}</p>
            </div>
            <Button asChild className="bg-btn text-btn-fg shadow-none">
              <Link href={{ pathname: "/discovery-set", query: { picks: picks.join(",") } }}>
                {t("quiz.result.buildSet")} <ArrowRight className="rtl:-scale-x-100" strokeWidth={1.5} />
              </Link>
            </Button>
          </Container>
        </Section>
      ) : null}

      {more.length || therapy ? (
        <Section tone="light" className="border-t border-hairline">
          <Container className="space-y-14 py-14 lg:py-20">
            {more.length ? (
              <div>
                <h2 className="mb-6 font-display text-3xl text-heading">{t("quiz.result.moreMatches")}</h2>
                <CardGrid products={more} preferForm={preferForm} className="xl:grid-cols-6" />
              </div>
            ) : null}
            {therapy ? (
              <div className="max-w-sm">
                <h2 className="mb-6 font-display text-3xl text-heading">{t("quiz.result.therapyPairing")}</h2>
                <CardGrid products={[therapy]} className="max-w-[15rem] grid-cols-1 md:grid-cols-1 xl:grid-cols-1" />
              </div>
            ) : null}
          </Container>
        </Section>
      ) : null}

      <Section tone="dark">
        <Container className="flex justify-center py-12">
          <Button asChild variant="outline">
            <Link href="/concierge">
              <MessageCircle /> {t("quiz.result.askConcierge")}
            </Link>
          </Button>
        </Container>
      </Section>
    </>
  );
}
