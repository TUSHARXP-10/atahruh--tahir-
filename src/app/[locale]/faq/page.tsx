import { Plus } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { HelpAside } from "@/components/layout/help-aside";
import { PageHero } from "@/components/layout/page-hero";
import { JsonLd } from "@/components/seo/json-ld";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { photo } from "@/lib/images";
import { fillTokens } from "@/lib/tokens";
import { slugify } from "@/lib/utils";
import { getContent, getSettings, type FaqBlock } from "@/server/queries/content";

export async function generateMetadata({ params }: PageProps<"/[locale]/faq">): Promise<Metadata> {
  const { locale } = await params;
  const faq = await getContent<FaqBlock>("faq", locale);
  return { title: faq?.title ?? "FAQ", description: faq?.intro, alternates: { canonical: locale === "en" ? "/faq" : `/${locale}/faq` } };
}

export default async function FaqPage({ params }: PageProps<"/[locale]/faq">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [faq, settings, t, tNav] = await Promise.all([getContent<FaqBlock>("faq", locale), getSettings(), getTranslations("help"), getTranslations("nav")]);
  if (!faq) notFound();

  const items = faq.items.map((i) => ({ ...i, a: fillTokens(i.a, settings, locale) }));
  const topics = [...new Set(items.map((i) => i.topic))];
  // Anchors from the English topic order so Arabic and English share them
  const anchor = (topic: string) => `topic-${topics.indexOf(topic) + 1}-${slugify(topic) || "faq"}`;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: items.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })),
        }}
      />
      <PageHero
        breadcrumb={[{ label: tNav("home"), href: "/" }, { label: faq.title }]}
        eyebrow={t("eyebrow")}
        title={faq.title}
        intro={faq.intro}
        image={photo("lanternMarble")}
        compact
      >
        <nav aria-label={t("topics")} className="flex flex-wrap gap-2">
          {topics.map((topic) => (
            <a key={topic} href={`#${anchor(topic)}`} className="rounded-full border border-gold/30 px-4 py-1.5 text-xs text-sand transition-colors hover:border-gold hover:text-gold-light">
              {topic}
            </a>
          ))}
        </nav>
      </PageHero>
      <Section tone="light">
        <Container className="grid gap-10 py-14 grid-cols-1 lg:grid-cols-[1fr_20rem] lg:py-20">
          <div className="space-y-12">
            {topics.map((topic) => (
              <section key={topic} id={anchor(topic)} className="scroll-mt-28">
                <h2 className="mb-4 font-display text-3xl text-heading">{topic}</h2>
                <div className="divide-y divide-hairline rounded-lg border border-hairline bg-surface">
                  {items
                    .filter((i) => i.topic === topic)
                    .map((i) => (
                      <details key={i.q} className="group px-5 py-1 [&_summary::-webkit-details-marker]:hidden">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[0.98rem] font-medium text-heading">
                          {i.q}
                          <Plus className="size-4 shrink-0 text-accent transition-transform duration-300 group-open:rotate-45" />
                        </summary>
                        <p className="pb-5 text-[0.95rem] leading-relaxed text-fg-muted">{i.a}</p>
                      </details>
                    ))}
                </div>
              </section>
            ))}
          </div>
          <HelpAside locale={locale} current="faq" />
        </Container>
      </Section>
    </>
  );
}
