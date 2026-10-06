import localFont from "next/font/local";

/**
 * Self-hosted brand typefaces (see `pnpm fonts:fetch`). Local files keep
 * builds independent of Google Fonts and are served from our own origin.
 *
 * Only the headline serif and the body sans are preloaded. The rest load on
 * demand wherever they are used, so English pages never download the Arabic
 * fonts (and nothing competes with the hero image on slow phone connections).
 */

/** Editorial display serif — headlines */
export const cormorant = localFont({
  src: [
    { path: "../fonts/cormorant-garamond-latin-300-normal.woff2", weight: "300", style: "normal" },
    { path: "../fonts/cormorant-garamond-latin-300-italic.woff2", weight: "300", style: "italic" },
    { path: "../fonts/cormorant-garamond-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../fonts/cormorant-garamond-latin-400-italic.woff2", weight: "400", style: "italic" },
    { path: "../fonts/cormorant-garamond-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../fonts/cormorant-garamond-latin-500-italic.woff2", weight: "500", style: "italic" },
    { path: "../fonts/cormorant-garamond-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../fonts/cormorant-garamond-latin-600-italic.woff2", weight: "600", style: "italic" },
  ],
  variable: "--font-cormorant",
  display: "swap",
  fallback: ["Georgia", "serif"],
});

/** Roman capitals — wordmark and eyebrow labels */
export const cinzel = localFont({
  src: [
    { path: "../fonts/cinzel-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../fonts/cinzel-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../fonts/cinzel-latin-600-normal.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-cinzel",
  display: "swap",
  preload: false,
  fallback: ["serif"],
});

/** UI / body sans (variable weight) */
export const manrope = localFont({
  src: [{ path: "../fonts/manrope-latin-wght-normal.woff2", weight: "200 800", style: "normal" }],
  variable: "--font-manrope",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

/** Classical Naskh — Arabic display and calligraphic accents */
export const amiri = localFont({
  src: [
    { path: "../fonts/amiri-arabic-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../fonts/amiri-arabic-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-amiri",
  display: "swap",
  preload: false,
  fallback: ["serif"],
});

/** Arabic UI / body */
export const plexArabic = localFont({
  src: [
    { path: "../fonts/ibm-plex-sans-arabic-arabic-300-normal.woff2", weight: "300", style: "normal" },
    { path: "../fonts/ibm-plex-sans-arabic-arabic-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../fonts/ibm-plex-sans-arabic-arabic-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../fonts/ibm-plex-sans-arabic-arabic-600-normal.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-plex-arabic",
  display: "swap",
  preload: false,
  fallback: ["sans-serif"],
});

/** Hand-written signature lines ("Scents matched to you") */
export const pinyon = localFont({
  src: [{ path: "../fonts/pinyon-script-latin-400-normal.woff2", weight: "400", style: "normal" }],
  variable: "--font-pinyon",
  display: "swap",
  preload: false,
  fallback: ["cursive"],
});

export const fontVariables = [
  cormorant.variable,
  cinzel.variable,
  manrope.variable,
  amiri.variable,
  plexArabic.variable,
  pinyon.variable,
].join(" ");
