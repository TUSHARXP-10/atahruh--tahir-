import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { HelpAside } from "@/components/layout/help-aside";
import { PageHero } from "@/components/layout/page-hero";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { fillTokens } from "@/lib/tokens";
import { getPolicy, getSettings, POLICY_SLUGS, type PolicySlug } from "@/server/queries/content";

const isPolicy = (s: string): s is PolicySlug => (POLICY_SLUGS as readonly string[]).includes(s);

export function generateStaticParams() {
  return POLICY_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/policies/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isPolicy(slug)) return {};
  const [policy, t] = await Promise.all([getPolicy(slug, locale), getTranslations({ locale, namespace: "meta" })]);
  const intro = policy?.intro ?? "";
  return {
    title: policy?.title,
    description: intro.length >= 70 || !policy ? intro : t("policyDescription", { intro, title: policy.title.toLowerCase() }),
    alternates: { canonical: `${locale === "en" ? "" : `/${locale}`}/policies/${slug}` } };
}

export default async function PolicyPage({ params }: PageProps<"/[locale]/policies/[slug]">) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  if (!isPolicy(slug)) notFound();
  const [policy, settings, t, tNav, format] = await Promise.all([getPolicy(slug, locale), getSettings(), getTranslations("help"), getTranslations("nav"), getFormatter()]);
  if (!policy) notFound();

  const englishBody = policy.bodyLocale !== locale;
  return (
    <>
      <PageHero breadcrumb={[{ label: tNav("home"), href: "/" }, { label: t("policies") }, { label: policy.title }]} eyebrow={t("policies")} title={policy.title} intro={policy.intro} compact />
      <Section tone="light">
        <Container className="grid gap-10 py-14 grid-cols-1 lg:grid-cols-[1fr_20rem] lg:py-20">
          <div className="min-w-0">
            <p className="mb-6 text-xs uppercase tracking-[0.16em] text-fg-muted">
              {t("lastUpdated", { date: format.dateTime(new Date(policy.updatedAt), { day: "numeric", month: "long", year: "numeric" }) })}
            </p>
            {englishBody ? <p className="mb-6 rounded-md border border-hairline bg-surface px-4 py-3 text-sm text-fg-muted">{t("englishOfficial")}</p> : null}
            <article className="prose-aar max-w-3xl" dir={englishBody ? "ltr" : undefined} lang={englishBody ? "en" : undefined}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{fillTokens(policy.body, settings, policy.bodyLocale)}</ReactMarkdown>
            </article>
          </div>
          <HelpAside locale={locale} current={slug} />
        </Container>
      </Section>
    </>
  );
}
