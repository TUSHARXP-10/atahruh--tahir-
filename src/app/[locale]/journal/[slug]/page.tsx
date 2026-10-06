import { ArrowLeft, Clock } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ShareArticle } from "@/components/journal/share";
import { JsonLd } from "@/components/seo/json-ld";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Link } from "@/i18n/navigation";
import { site } from "@/lib/site";
import { getJournalPost, getJournalPosts } from "@/server/queries/content";

export async function generateStaticParams() {
  const posts = await getJournalPosts("en");
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/journal/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getJournalPost(slug, locale);
  if (!post) return {};
  const path = `${locale === "en" ? "" : `/${locale}`}/journal/${slug}`;
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: path },
    openGraph: { type: "article", title: post.title, description: post.excerpt, publishedTime: post.publishedAt, images: [{ url: post.coverUrl }] },
  };
}

export default async function ArticlePage({ params }: PageProps<"/[locale]/journal/[slug]">) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const [post, posts, t, tNav, tc, format] = await Promise.all([getJournalPost(slug, locale), getJournalPosts(locale), getTranslations("journalPage"), getTranslations("nav"), getTranslations("common"), getFormatter()]);
  if (!post) notFound();

  const url = `${site.url}${locale === "en" ? "" : `/${locale}`}/journal/${post.slug}`;
  const more = posts.filter((p) => p.slug !== post.slug).sort((a, b) => b.tags.filter((x) => post.tags.includes(x)).length - a.tags.filter((x) => post.tags.includes(x)).length).slice(0, 3);
  const englishBody = post.bodyLocale !== locale;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.excerpt,
          image: new URL(post.coverUrl, site.url).toString(),
          datePublished: post.publishedAt,
          author: { "@type": "Organization", name: post.author },
          publisher: { "@type": "Organization", name: site.name },
          mainEntityOfPage: url,
        }}
      />
      <section className="relative isolate overflow-hidden bg-noir">
        <Image src={post.coverUrl} alt="" fill loading="eager" fetchPriority="high" sizes="100vw" className="-z-10 object-cover opacity-55" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-noir via-noir/60 to-noir/30" />
        <Container className="flex min-h-[26rem] max-w-4xl flex-col justify-end pb-14 pt-24 lg:min-h-[32rem]">
          <Breadcrumbs items={[{ label: tNav("home"), href: "/" }, { label: tNav("journal"), href: "/journal" }, { label: post.title }]} />
          <p className="mt-6 text-[0.7rem] uppercase tracking-[0.18em] text-gold">{post.tags.join(" · ")}</p>
          <h1 className="mt-3 text-display-lg text-ivory">{post.title}</h1>
          <p className="mt-5 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.14em] text-sand/80">
            {t("by", { author: post.author })} · {format.dateTime(new Date(post.publishedAt), { day: "numeric", month: "long", year: "numeric" })} · <Clock className="size-3.5" />{" "}
            {tc("minRead", { minutes: post.readMinutes })}
          </p>
        </Container>
      </section>
      <Section tone="light">
        <Container className="max-w-3xl py-14 lg:py-20">
          <p className="font-display text-2xl leading-snug text-heading">{post.excerpt}</p>
          <hr className="my-10 border-hairline" />
          {englishBody ? <p className="mb-6 text-sm text-fg-muted">{t("englishOnly")}</p> : null}
          <article className="prose-aar" dir={englishBody ? "ltr" : undefined} lang={englishBody ? "en" : undefined}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.body}</ReactMarkdown>
          </article>
          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-hairline pt-6">
            <Link href="/journal" className="inline-flex items-center gap-2 text-sm text-fg-muted hover:text-heading">
              <ArrowLeft className="size-4 rtl:-scale-x-100" /> {t("back")}
            </Link>
            <ShareArticle url={url} title={post.title} />
          </div>
        </Container>
        {more.length ? (
          <div className="border-t border-hairline">
            <Container className="py-14">
              <h2 className="mb-6 font-display text-3xl text-heading">{t("more")}</h2>
              <ul className="grid gap-6 md:grid-cols-3">
                {more.map((p) => (
                  <li key={p.slug}>
                    <Link href={`/journal/${p.slug}`} className="group block overflow-hidden rounded-lg border border-hairline bg-surface">
                      <div className="relative aspect-[16/10] overflow-hidden">
                        <Image src={p.coverUrl} alt="" fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover transition-transform duration-[1.4s] ease-(--ease-luxe) group-hover:scale-105" />
                      </div>
                      <div className="p-5">
                        <h3 className="font-display text-xl leading-snug text-heading group-hover:text-accent">{p.title}</h3>
                        <p className="mt-2 text-xs text-fg-muted">{tc("minRead", { minutes: p.readMinutes })}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </Container>
          </div>
        ) : null}
      </Section>
    </>
  );
}
