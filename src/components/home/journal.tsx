import { ArrowUpRight, Clock } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Link } from "@/i18n/navigation";

type Post = { slug: string; title: string; excerpt: string; coverUrl: string; readMinutes: number; tags: string[] };

export async function JournalPreview({ posts }: { posts: Post[] }) {
  const [t, tc] = await Promise.all([getTranslations("home.journal"), getTranslations("common")]);
  if (!posts.length) return null;
  return (
    <Section tone="dark" className="border-t border-white/5 py-16 lg:py-20">
      <Container>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-[clamp(2rem,3.4vw,2.9rem)] leading-none text-ivory">{t("title")}</h2>
            <p className="mt-2 text-sm text-smoke">{t("subtitle")}</p>
          </div>
          <Link
            href="/journal"
            className="inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-2.5 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-ivory transition-colors hover:border-gold hover:text-gold-light"
          >
            {t("cta")} <ArrowUpRight className="size-3.5 rtl:-scale-x-100" />
          </Link>
        </div>
        <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {posts.map((p) => (
            <RevealItem key={p.slug}>
              <Link href={`/journal/${p.slug}`} className="group relative block aspect-[4/3] overflow-hidden rounded-lg">
                <Image
                  src={p.coverUrl}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-[1.4s] ease-(--ease-luxe) group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-noir/95 via-noir/35 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <h3 className="font-display text-[1.3rem] leading-snug text-ivory group-hover:text-gold-light">{p.title}</h3>
                  <p className="mt-1.5 flex items-center gap-1.5 text-[0.66rem] uppercase tracking-[0.14em] text-ivory/65">
                    <Clock className="size-3" /> {tc("minRead", { minutes: p.readMinutes })}
                  </p>
                </div>
              </Link>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </Section>
  );
}
