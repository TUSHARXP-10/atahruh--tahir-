import Image from "next/image";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Link } from "@/i18n/navigation";
import type { CollectionData } from "@/server/queries/catalog";

const ORDER = ["perfumes", "attars", "therapies", "gift-sets", "for-him", "for-her", "new-arrivals", "offers"];
const HREF: Record<string, string> = { therapies: "/therapies" };

export function CategoryOrbs({ collections, title }: { collections: CollectionData[]; title: string }) {
  const items = ORDER.map((slug) => collections.find((c) => c.slug === slug)).filter(Boolean) as CollectionData[];
  return (
    <Section tone="dark" aria-label={title} className="py-12 lg:py-14">
      <Container>
        <h2 className="sr-only">{title}</h2>
        <RevealGroup className="no-scrollbar -mx-4 flex snap-x gap-5 overflow-x-auto px-4 pb-1 sm:gap-7 lg:mx-0 lg:grid lg:grid-cols-8 lg:gap-5 lg:overflow-visible lg:px-0" stagger={0.06}>
          {items.map((c) => (
            <RevealItem key={c.slug} className="w-[6.5rem] shrink-0 snap-start sm:w-28 lg:w-auto">
              <Link href={HREF[c.slug] ?? `/collections/${c.slug}`} className="group flex flex-col items-center text-center">
                <span className="relative block aspect-square w-full rounded-full border border-gold/55 p-1 transition-colors duration-500 group-hover:border-gold-light">
                  <span className="relative block h-full w-full overflow-hidden rounded-full">
                    {c.imageUrl ? (
                      <Image
                        src={c.imageUrl}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 10vw, 112px"
                        className="object-cover transition-transform duration-[1.4s] ease-(--ease-luxe) group-hover:scale-110"
                      />
                    ) : null}
                    <span className="absolute inset-0 bg-gradient-to-t from-noir/45 to-transparent" />
                  </span>
                </span>
                <span className="mt-3.5 font-display text-[1.15rem] leading-tight text-ivory transition-colors group-hover:text-gold-light">{c.name}</span>
                <span className="mt-0.5 text-[0.66rem] text-mist">{c.tagline}</span>
              </Link>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </Section>
  );
}
