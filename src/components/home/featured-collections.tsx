import { ArrowRight, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Link } from "@/i18n/navigation";
import type { CollectionData } from "@/server/queries/catalog";

export async function FeaturedCollections({ collections }: { collections: CollectionData[] }) {
  const [t, tc] = await Promise.all([getTranslations("home.collections"), getTranslations("common")]);
  return (
    <Section tone="light" className="py-14 lg:py-20">
      <Container>
        <div className="mb-8 flex items-end justify-between gap-6">
          <h2 className="font-display text-[clamp(2rem,3.4vw,2.9rem)] leading-none text-heading">{t("title")}</h2>
          <Link href="/shop" className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap py-2 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-heading hover:text-accent">
            {tc("viewAll")} <ArrowRight className="size-3.5 rtl:-scale-x-100" />
          </Link>
        </div>
        <RevealGroup className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0">
          {collections.map((c) => (
            <RevealItem key={c.slug} className="w-[66%] shrink-0 snap-start sm:w-[40%] lg:w-auto">
              <Link
                href={`/collections/${c.slug}`}
                className="group relative block aspect-[4/5] overflow-hidden rounded-lg shadow-[0_18px_40px_-26px_rgba(28,21,16,0.6)]"
              >
                {c.imageUrl ? (
                  <Image
                    src={c.imageUrl}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 20vw, 66vw"
                    className="object-cover transition-transform duration-[1.6s] ease-(--ease-luxe) group-hover:scale-110"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-noir/90 via-noir/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
                  <div>
                    <h3 className="font-display text-[1.45rem] leading-tight text-ivory">{c.name}</h3>
                    <p className="mt-0.5 text-[0.7rem] text-ivory/75">{c.tagline}</p>
                  </div>
                  <span className="grid size-8 shrink-0 place-items-center rounded-full border border-white/40 text-ivory transition-all duration-500 group-hover:border-gold group-hover:bg-gold group-hover:text-ink">
                    <ArrowUpRight className="size-3.5 rtl:-scale-x-100" strokeWidth={1.5} />
                  </span>
                </div>
              </Link>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </Section>
  );
}
