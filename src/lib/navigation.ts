import { photo, type PhotoKey } from "./images";

/** Navigation tree. Labels are translation keys (namespace "nav" unless prefixed). */
export type NavLink = { key: string; href: string; ns?: string };
export type NavColumn = { titleKey: string; links: NavLink[] };
export type NavItem = {
  key: string;
  href: string;
  columns?: NavColumn[];
  feature?: { image: string; textKey: string; href: string; ctaKey: string };
};

const families = (base: string, list: string[]): NavLink[] =>
  list.map((f) => ({ key: f, ns: "families", href: `${base}?family=${f}` }));

const feature = (key: PhotoKey, textKey: string, href: string, ctaKey = "explore") => ({
  image: photo(key),
  textKey,
  href,
  ctaKey,
});

/** Mirrors the client's design: Home · Perfumes · Attars · Therapies · Gift Sets · Our Story */
export const NAV: NavItem[] = [
  { key: "home", href: "/" },
  {
    key: "perfumes",
    href: "/collections/perfumes",
    columns: [
      {
        titleKey: "collections",
        links: [
          { key: "allProducts", href: "/collections/perfumes" },
          { key: "luxury", href: "/collections/luxury-collection" },
          { key: "essentials", href: "/collections/everyday-essentials" },
          { key: "newArrivals", href: "/collections/new-arrivals" },
          { key: "bestsellers", href: "/collections/bestsellers" },
          { key: "forHim", href: "/collections/for-him" },
          { key: "forHer", href: "/collections/for-her" },
        ],
      },
      { titleKey: "byFamily", links: families("/collections/perfumes", ["OUD", "FLORAL", "WOODY", "AMBER", "MUSK", "FRESH", "CITRUS", "GOURMAND"]) },
      {
        titleKey: "discover",
        links: [
          { key: "quiz", href: "/fragrance-quiz" },
          { key: "concierge", href: "/concierge" },
          { key: "discoverySet", href: "/discovery-set" },
          { key: "journal", href: "/journal" },
        ],
      },
    ],
    feature: feature("goldenSpray", "perfumesFeature", "/collections/perfumes"),
  },
  {
    key: "attars",
    href: "/collections/attars",
    columns: [
      {
        titleKey: "collections",
        links: [
          { key: "allProducts", href: "/collections/attars" },
          { key: "arabicAttars", href: "/collections/arabic-attars" },
          { key: "luxury", href: "/collections/luxury-collection" },
          { key: "discoverySet", href: "/discovery-set" },
        ],
      },
      { titleKey: "byFamily", links: families("/collections/attars", ["OUD", "FLORAL", "EARTHY", "SPICY", "HERBAL", "WOODY"]) },
    ],
    feature: feature("attarLantern", "attarsFeature", "/collections/attars"),
  },
  {
    key: "therapies",
    href: "/therapies",
    columns: [
      {
        titleKey: "byNeed",
        links: ["STRESS", "SLEEP", "FOCUS", "SKIN_HAIR", "BALANCE"].map((n) => ({
          key: n,
          ns: "needs",
          href: `/collections/therapies?need=${n}`,
        })),
      },
      {
        titleKey: "experiences",
        links: [
          { key: "therapies", href: "/therapies" },
          { key: "wellness", href: "/collections/wellness-collection" },
          { key: "rituals", href: "/rituals" },
        ],
      },
    ],
    feature: feature("dropperStones", "therapiesFeature", "/therapies"),
  },
  {
    key: "giftSets",
    href: "/collections/gift-sets",
    columns: [
      {
        titleKey: "gifting",
        links: [
          { key: "giftSets", href: "/collections/gift-sets" },
          { key: "discoverySet", href: "/discovery-set" },
          { key: "giftFinder", href: "/gifting" },
          { key: "offers", href: "/collections/offers" },
        ],
      },
    ],
    feature: feature("giftBlackGold", "giftingFeature", "/collections/gift-sets"),
  },
  { key: "ourStory", href: "/our-story" },
];
