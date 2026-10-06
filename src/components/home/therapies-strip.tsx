import { ArrowRight, Brain, Droplets, Flower2, Moon, Scale } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Link } from "@/i18n/navigation";
import { photo } from "@/lib/images";

export const NEED_ICONS = { STRESS: Flower2, SLEEP: Moon, FOCUS: Brain, SKIN_HAIR: Droplets, BALANCE: Scale } as const;

export async function TherapiesStrip() {
  const [t, tn] = await Promise.all([getTranslations("home.therapies"), getTranslations("home.therapyTiles")]);
  const needs = Object.keys(NEED_ICONS) as (keyof typeof NEED_ICONS)[];
  return (
    <Section tone="dark" className="overflow-hidden border-t border-white/5 py-16 lg:py-20">
      {/* waterfall & oils bleed in from the end side */}
      <div className="fade-start absolute inset-y-0 end-0 hidden w-[42%] lg:block" aria-hidden>
        <Image src={photo("waterfallBridge")} alt="" fill sizes="42vw" className="object-cover" />
        <div className="absolute inset-0 bg-noir/25" />
      </div>

      <Container className="relative grid items-center gap-10 grid-cols-1 lg:grid-cols-12">
        <Reveal className="lg:col-span-4">
          <h2 className="font-display text-[clamp(2.2rem,3.8vw,3.3rem)] leading-[1.04] text-ivory">
            {t("eyebrow")}
            <span className="block text-gold-light">{t("title")}</span>
          </h2>
          <p className="mt-5 max-w-sm text-ivory/75">{t("text")}</p>
          <Button asChild className="mt-8">
            <Link href="/therapies">
              {t("cta")} <ArrowRight className="rtl:-scale-x-100" strokeWidth={1.5} />
            </Link>
          </Button>
        </Reveal>

        <RevealGroup className="grid grid-cols-2 gap-3 sm:grid-cols-5 lg:col-span-5">
          {needs.map((n) => {
            const Icon = NEED_ICONS[n];
            return (
              <RevealItem key={n}>
                <Link
                  href={`/collections/therapies?need=${n}`}
                  className="group flex h-full flex-col items-center gap-3 rounded-lg border border-white/12 bg-white/[0.03] px-2 py-5 text-center backdrop-blur transition-colors hover:border-gold/60 hover:bg-gold/[0.06]"
                >
                  <span className="grid size-11 place-items-center rounded-full border border-gold/40 text-gold-light transition-transform duration-500 group-hover:scale-110">
                    <Icon className="size-[1.1rem]" strokeWidth={1.25} />
                  </span>
                  <span className="text-[0.72rem] font-medium leading-snug text-ivory">{tn(n)}</span>
                </Link>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </Container>
    </Section>
  );
}
