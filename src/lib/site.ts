/**
 * The site's public address. NEXT_PUBLIC_SITE_URL wins when set; on Vercel it can be
 * left out — Vercel provides the production address itself (the vercel.app address,
 * or the custom domain once one is connected).
 */
function siteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return vercel ? `https://${vercel}` : "http://localhost:3000";
}

/**
 * Brand constants. Anything the client may change day-to-day (WhatsApp number,
 * shipping thresholds, social links) is also editable in Admin → Settings, which
 * overrides these defaults at runtime.
 */
export const site = {
  name: "Aayat al-Ruh",
  nameAr: "آيات الروح",
  meaning: "Verses of the Soul",
  meaningAr: "آياتٌ من الروح",
  tagline: "Scents · Attars · Therapies · Rituals",
  description:
    "Aayat al-Ruh is a house of fine perfumes, pure attars and natural therapies — crafted in small batches to elevate your mind, body and everyday rituals.",
  url: siteUrl(),

  // Placeholders until the client confirms — editable in Admin → Settings
  contact: {
    email: "care@aayatalruh.com",
    phone: "+91 81081 56705",
    whatsapp: "918108156705",
    address: "Mumbai, Maharashtra, India",
    hours: "Mon–Sat, 10am–7pm IST",
  },
  /** Seller details printed on GST invoices — set in Admin → Settings */
  business: {
    legalName: "Aayat al-Ruh",
    gstin: "",
    address: "Mumbai, Maharashtra, India",
    state: "Maharashtra",
  },
  socials: {
    instagram: "https://instagram.com/",
    facebook: "https://facebook.com/",
    youtube: "https://youtube.com/",
    pinterest: "https://pinterest.com/",
  },
  instagramHandle: "@aayatalruh",
} as const;

/**
 * The client's logo (full artwork for dark backgrounds). All logo files in
 * public/brand are generated from the artwork by `python scripts/build-logo.py <file>`.
 */
export const brandLogo: { src: string | null; width: number; height: number } = {
  src: "/brand/logo-on-dark.png",
  width: 684,
  height: 764,
};

/** Commerce defaults (paise). Overridable in Admin → Settings. */
export const commerceDefaults = {
  freeShippingThreshold: 99_900,
  standardShippingFee: 9_900,
  expressShippingFee: 19_900,
  codFee: 4_900,
  codMaxOrder: 1_500_000,
  giftWrapFee: 9_900,
  freeSampleThreshold: 249_900,
  gstRatePercent: 18,
  discoverySetPrice: 99_900,
  discoverySetSize: 5,
} as const;
