import { ArrowUpRight, Clock } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { PageHero } from "@/components/layout/page-hero";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Link } from "@/i18n/navigation";
import { photo } from "@/lib/images";
import { cn } from "@/lib/utils";
import { getJournalPosts } from "@/server/queries/content";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/journal">): Promise<Metadata> {
  const { locale } = await params;
  const [t, tNav] = await Promise.all([getTranslations({ locale, namespace: "journalPage" }), getTranslations({ locale, namespace: "nav" })]);
  return pageMetadata({ locale, path: "/journal", title: tNav("journal"), description: t("metaDescription") });
}

export default async function JournalPage({ params, searchParams }: PageProps<"/[locale]/journal">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [sp, posts, t, tNav, tc, format] = await Promise.all([searchParams, getJournalPosts(locale), getTranslations("journalPage"), getTranslations("nav"), getTranslations("common"), getFormatter()]);
  const tags = [...new Set(posts.flatMap((p) => p.tags))];
  const tag = typeof sp.tag === "string" && tags.includes(sp.tag) ? sp.tag : null;
  const shown = tag ? posts.filter((p) => p.tags.includes(tag)) : posts;
  const [lead, ...rest] = shown;
  const date = (iso: string) => format.dateTime(new Date(iso), { day: "numeric", month: "long", year: "numeric" });

  return (
    <>
      <PageHero breadcrumb={[{ label: tNav("home"), href: "/" }, { label: tNav("journal") }]} eyebrow={tNav("journal")} title={tNav("journal")} intro={t("intro")} image={photo("candleCosy")} compact>
        <nav className="flex flex-wrap gap-2" aria-label="Topics">
          {[null, ...tags].map((tg) => (
            <Link
              key={tg ?? "all"}
              href={tg ? { pathname: "/journal", query: { tag: tg } } : "/journal"}
              aria-current={tg === tag ? "page" : undefined}
              className={cn(
                "rounded-full border px-4 py-1.5 text-xs transition-colors",
                tg === tag ? "border-gold bg-gold text-ink" : "border-gold/30 text-sand hover:border-gold hover:text-gold-light",
              )}
            >
              {tg ?? t("all")}
            </Link>
          ))}
        </nav>
      </PageHero>
      <Section tone="light">
        <Container className="py-14 lg:py-20">
          {lead ? (
            <Link href={`/journal/${lead.slug}`} className="group grid overflow-hidden rounded-lg border border-hairline bg-surface md:grid-cols-2">
              <div className="relative aspect-[4/3] overflow-hidden md:aspect-auto md:min-h-[24rem]">
                <Image src={lead.coverUrl} alt="" fill loading="eager" fetchPriority="high" sizes="(min-width: 768px) 50vw, 100vw" className="object-cover transition-transform duration-[1.4s] ease-(--ease-luxe) group-hover:scale-105" />
              </div>
              <div className="flex flex-col justify-center p-8 lg:p-12">
                <span className="eyebrow">{t("featured")}</span>
                <h2 className="mt-3 font-display text-4xl leading-tight text-heading group-hover:text-accent">{lead.title}</h2>
                <p className="mt-4 leading-relaxed text-fg-muted">{lead.excerpt}</p>
                <p className="mt-6 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.14em] text-fg-muted">
                  {date(lead.publishedAt)} · <Clock className="size-3.5" /> {tc("minRead", { minutes: lead.readMinutes })}
                </p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-heading">
                  {t("readArticle")} <ArrowUpRight className="size-4 rtl:-scale-x-100" />
                </span>
              </div>
            </Link>
          ) : null}
          {rest.length ? (
            <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((p) => (
                <li key={p.slug}>
                  <Link href={`/journal/${p.slug}`} className="group block h-full overflow-hidden rounded-lg border border-hairline bg-surface">
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <Image src={p.coverUrl} alt="" fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-[1.4s] ease-(--ease-luxe) group-hover:scale-105" />
                    </div>
                    <div className="p-6">
                      <p className="text-[0.68rem] uppercase tracking-[0.14em] text-accent">{p.tags.join(" · ")}</p>
                      <h3 className="mt-2 font-display text-2xl leading-snug text-heading group-hover:text-accent">{p.title}</h3>
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-fg-muted">{p.excerpt}</p>
                      <p className="mt-4 text-xs text-fg-muted">
                        {date(p.publishedAt)} · {tc("minRead", { minutes: p.readMinutes })}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </Container>
      </Section>
    </>
  );
}
