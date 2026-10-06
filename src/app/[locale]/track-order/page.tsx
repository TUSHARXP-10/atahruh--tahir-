import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { TrackOrderForm } from "@/components/account/track-order-form";
import { Ornament } from "@/components/brand/ornament";
import { GirihPattern } from "@/components/brand/patterns";
import { Container } from "@/components/ui/container";

export async function generateMetadata({ params }: PageProps<"/[locale]/track-order">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "orders" });
  return { title: t("trackTitle") };
}

export default async function TrackOrderPage({ params, searchParams }: PageProps<"/[locale]/track-order">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const t = await getTranslations("orders");
  return (
    <section className="relative overflow-hidden py-20 lg:py-28">
      <GirihPattern opacity={0.04} />
      <Container className="relative max-w-xl text-center">
        <div className="mb-4 flex items-center justify-center gap-3">
          <Ornament className="w-8" />
          <span className="eyebrow">{t("track")}</span>
          <Ornament className="w-8 -scale-x-100" />
        </div>
        <h1 className="text-display-md text-ivory">{t("trackTitle")}</h1>
        <p className="mx-auto mt-4 max-w-md text-smoke">{t("trackText")}</p>
        <TrackOrderForm initialNumber={typeof sp.number === "string" ? sp.number : ""} />
      </Container>
    </section>
  );
}
