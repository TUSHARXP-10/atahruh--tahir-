import { MessageCircle, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ConciergeChat } from "@/components/concierge/concierge-chat";
import { GoldDust } from "@/components/motion/gold-dust";
import { Container } from "@/components/ui/container";
import { getSettings } from "@/server/queries/content";

export async function generateMetadata({ params }: PageProps<"/[locale]/concierge">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "concierge" });
  return { title: t("title"), description: t("subtitle"), alternates: { canonical: locale === "en" ? "/concierge" : `/${locale}/concierge` } };
}

export default async function ConciergePage({ params }: PageProps<"/[locale]/concierge">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, { contact }] = await Promise.all([getTranslations("concierge"), getSettings()]);
  const enabled = !!process.env.ANTHROPIC_API_KEY;

  return (
    <section className="relative overflow-hidden bg-noir">
      <GoldDust density={0.00006} />
      <Container className="relative max-w-3xl py-12 lg:py-16">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-gold-metal text-ink">
            <Sparkles className="size-5" />
          </span>
          <h1 className="text-display-md text-ivory">{t("title")}</h1>
          <p className="mx-auto mt-3 max-w-lg text-smoke">{t("subtitle")}</p>
        </div>
        {enabled ? (
          <div className="h-[min(42rem,calc(100dvh-16rem))] overflow-hidden rounded-xl border border-gold/20 bg-ebony/80 backdrop-blur">
            <ConciergeChat whatsapp={contact.whatsapp} />
          </div>
        ) : (
          <div className="rounded-xl border border-gold/20 bg-ebony/80 p-10 text-center">
            <p className="text-smoke">{t("unavailable")}</p>
            <a href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#1f6b3c] px-6 py-3 text-sm text-white hover:bg-[#185731]">
              <MessageCircle className="size-4" /> {t("whatsapp")}
            </a>
          </div>
        )}
      </Container>
    </section>
  );
}
