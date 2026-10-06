import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppBand } from "@/components/home/app-band";
import { Bestsellers, type BestsellerTabs } from "@/components/home/bestsellers";
import { CategoryOrbs } from "@/components/home/category-orbs";
import { DualBanners } from "@/components/home/dual-banners";
import { FeaturedCollections } from "@/components/home/featured-collections";
import { FragranceScore } from "@/components/home/fragrance-score";
import { Hero } from "@/components/home/hero";
import { InstagramFeed } from "@/components/home/instagram";
import { JournalPreview } from "@/components/home/journal";
import { Newsletter } from "@/components/home/newsletter";
import { OurStory } from "@/components/home/our-story";
import { Rituals } from "@/components/home/rituals";
import { Testimonials } from "@/components/home/testimonials";
import { TherapiesStrip } from "@/components/home/therapies-strip";
import { getAllCards, getCollections, sortCards } from "@/server/queries/catalog";
import {
  getContent,
  getJournalPosts,
  getSettings,
  getTestimonials,
  type HeroBlock,
  type InstagramBlock,
  type RitualsBlock,
  type StatsBlock,
  type InspirationBlock,
} from "@/server/queries/content";
import { OrganizationJsonLd } from "@/components/seo/json-ld";

export const revalidate = 300;

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, cards, collections, hero, stats, instagram, rituals, testimonials, posts, settings, inspiration] = await Promise.all([
    getTranslations("home"),
    getAllCards(locale),
    getCollections(locale),
    getContent<HeroBlock>("hero", locale),
    getContent<StatsBlock>("stats", locale),
    getContent<InstagramBlock>("instagram", locale),
    getContent<RitualsBlock>("rituals", locale),
    getTestimonials(locale),
    getJournalPosts(locale, 4),
    getSettings(),
    getContent<InspirationBlock>("inspiration", locale),
  ]);

  const sorted = sortCards(cards, "featured");
  const fragrances = sorted.filter((c) => c.kind === "FRAGRANCE");
  const tabs: BestsellerTabs = {
    all: sorted.filter((c) => c.isBestseller || c.isFeatured).slice(0, 10),
    men: fragrances.filter((c) => c.gender !== "WOMEN").slice(0, 10),
    women: fragrances.filter((c) => c.gender !== "MEN").slice(0, 10),
    attars: fragrances.filter((c) => c.forms.some((f) => f.type === "ATTAR")).slice(0, 10),
    gifts: sorted.filter((c) => c.kind === "GIFT_SET"),
  };

  const featured = collections.filter((c) => c.isFeatured && !c.filter).concat(collections.filter((c) => c.slug === "gift-sets"));

  return (
    <>
      <OrganizationJsonLd />
      {hero ? <Hero data={hero} /> : null}
      <CategoryOrbs collections={collections} title={t("categories.title")} />
      <DualBanners />
      <Bestsellers tabs={tabs} />
      <FragranceScore />
      <TherapiesStrip />
      <FeaturedCollections collections={featured.slice(0, 5)} />
      <OurStory stats={stats} inspiration={inspiration} />
      {rituals ? <Rituals data={rituals} products={cards} /> : null}
      <Testimonials items={testimonials} />
      <JournalPreview posts={posts} />
      {instagram ? <InstagramFeed data={instagram} profileUrl={settings.socials.instagram} /> : null}
      <Newsletter />
      <AppBand />
    </>
  );
}
