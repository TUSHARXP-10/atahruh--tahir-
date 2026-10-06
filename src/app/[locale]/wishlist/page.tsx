import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { WishlistView } from "@/components/account/wishlist-view";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

export async function generateMetadata({ params }: PageProps<"/[locale]/wishlist">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "common" });
  return { title: t("wishlist"), robots: { index: false } };
}

export default async function WishlistPage({ params }: PageProps<"/[locale]/wishlist">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  return (
    <Container className="py-14 lg:py-20">
      <SectionHeading as="h1" eyebrow={t("common.brand")} title={t("common.wishlist")} className="mb-12" />
      <WishlistView />
    </Container>
  );
}
