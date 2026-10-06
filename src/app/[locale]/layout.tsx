import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Toaster } from "sonner";
import { Analytics } from "@/components/analytics/analytics";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { ConciergeDrawer } from "@/components/concierge/concierge-drawer";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { CookieConsent } from "@/components/layout/cookie-consent";
import { FloatingActions } from "@/components/layout/floating-actions";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { SearchDialog } from "@/components/layout/search-dialog";
import { Cursor } from "@/components/motion/cursor";
import { Preloader } from "@/components/motion/preloader";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { QuickViewProvider } from "@/components/product/quick-view";
import { StoreProvider } from "@/components/providers/store-provider";
import { dirFor, routing } from "@/i18n/routing";
import { analyticsIds } from "@/lib/analytics";
import { fontVariables } from "@/lib/fonts";
import { site } from "@/lib/site";
import { getContent, getSettings, type AnnouncementsBlock } from "@/server/queries/content";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    metadataBase: new URL(site.url),
    title: { default: t("title"), template: `%s · ${locale === "ar" ? site.nameAr : site.name}` },
    description: t("description"),
    applicationName: site.name,
    alternates: {
      canonical: locale === "en" ? "/" : `/${locale}`,
      languages: { en: "/", ar: "/ar", "x-default": "/" },
    },
    openGraph: {
      type: "website",
      siteName: site.name,
      locale: locale === "ar" ? "ar_AE" : "en_IN",
      title: t("title"),
      description: t("description"),
      images: [{ url: "/og/site", width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image" },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  themeColor: "#0b0907",
  colorScheme: "dark",
};

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const [t, announcements, settings] = await Promise.all([
    getTranslations("common"),
    getContent<AnnouncementsBlock>("announcements", locale),
    getSettings(),
  ]);

  return (
    <html lang={locale} dir={dirFor(locale)} className={fontVariables} suppressHydrationWarning>
      <body className="min-h-dvh">
        <NextIntlClientProvider>
          <StoreProvider>
            <QuickViewProvider>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[300] focus:rounded-sm focus:bg-gold focus:px-4 focus:py-2 focus:text-ink"
            >
              {t("skipToContent")}
            </a>
            <Preloader locale={locale} />
            <SmoothScroll />
            <Cursor />
            <AnnouncementBar items={announcements?.items ?? []} />
            <Header />
            <main id="main">{children}</main>
            <Footer />
            <CartDrawer />
            {process.env.ANTHROPIC_API_KEY ? <ConciergeDrawer whatsapp={settings.contact.whatsapp} /> : null}
            <SearchDialog />
            <FloatingActions whatsapp={settings.contact.whatsapp} conciergeEnabled={!!process.env.ANTHROPIC_API_KEY} />
            <CookieConsent />
            <Analytics {...analyticsIds()} />
            <Toaster
              position="bottom-center"
              theme="dark"
              dir={dirFor(locale)}
              toastOptions={{
                classNames: {
                  toast: "!bg-ebony !border !border-gold/30 !text-ivory !rounded-sm !font-sans",
                  description: "!text-smoke",
                  icon: "!text-gold",
                },
              }}
            />
            </QuickViewProvider>
          </StoreProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
