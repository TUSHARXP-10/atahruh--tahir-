import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Link } from "@/i18n/navigation";
import { photo } from "@/lib/images";

function Banner({
  image,
  imageClass,
  title,
  accent,
  text,
  cta,
  href,
  delay = 0,
  side,
}: {
  image: string;
  imageClass?: string;
  title: string;
  accent?: string;
  text: string;
  cta: string;
  href: string;
  delay?: number;
  /** Place the photo in the end half with a soft fade instead of full-bleed */
  side?: boolean;
}) {
  return (
    <Reveal
      delay={delay}
      className="group relative isolate min-h-[17rem] overflow-hidden rounded-lg border border-gold/15 bg-[radial-gradient(ellipse_at_80%_50%,#3d2a16,#15100c_60%,#0b0907)] sm:min-h-[19rem]"
    >
      <div className={side ? "fade-start absolute inset-y-0 end-0 -z-10 w-[58%]" : "absolute inset-0 -z-10"}>
        <Image
          src={image}
          alt=""
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className={`object-cover transition-transform duration-[2s] ease-(--ease-luxe) group-hover:scale-105 ${imageClass ?? ""}`}
        />
      </div>
      {side ? null : <div className="absolute inset-0 -z-10 bg-gradient-to-r from-noir via-noir/75 to-noir/0 rtl:bg-gradient-to-l" />}
      <div className="flex h-full max-w-[60%] flex-col justify-center p-7 sm:p-10">
        <h2 className="font-display text-[clamp(1.9rem,3vw,2.75rem)] leading-[1.04] text-ivory">
          {title}
          {accent ? <span className="block text-gold-light">{accent}</span> : null}
        </h2>
        <p className="mt-3 max-w-xs text-sm leading-relaxed text-ivory/75">{text}</p>
        <Button asChild size="md" className="mt-6 self-start">
          <Link href={href}>
            {cta} <ArrowRight className="rtl:-scale-x-100" strokeWidth={1.5} />
          </Link>
        </Button>
      </div>
    </Reveal>
  );
}

export async function DualBanners() {
  const t = await getTranslations("home.banners");
  return (
    <Section tone="dark" className="pb-12 lg:pb-14">
      <Container className="grid gap-5 lg:grid-cols-2">
        <Banner
          image={photo("amberSilk")}
          imageClass="object-[50%_62%]"
          side
          title={t("luxuryTitle")}
          text={t("luxuryText")}
          cta={t("luxuryCta")}
          href="/collections/luxury-collection"
        />
        <Banner
          image={photo("waterfall")}
          title={t("therapyEyebrow")}
          accent={t("therapyTitle")}
          text={t("therapyText")}
          cta={t("therapyCta")}
          href="/therapies"
          delay={0.1}
        />
      </Container>
    </Section>
  );
}
