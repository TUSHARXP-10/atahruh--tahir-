/**
 * Fragrance Score — a transparent, rule-based matcher.
 * Every product gets a 0–100 match from weighted signals, plus the reasons
 * that drove it (shown to the customer). Pure functions: unit-tested and
 * shared by the quiz UI, the results page and the AI Concierge.
 */

export const QUIZ_FAMILIES = ["FLORAL", "OUD", "WOODY", "AMBER", "CITRUS", "FRESH", "SPICY", "MUSK", "EARTHY", "GOURMAND"] as const;
export const QUIZ_MOODS = ["CALM", "ENERGETIC", "CONFIDENT", "FOCUSED", "ROMANTIC", "BALANCED"] as const;
export const QUIZ_OCCASIONS = ["EVERYDAY", "OFFICE", "DATE", "CELEBRATION", "PRAYER", "TRAVEL"] as const;

export type QuizAnswers = {
  forWhom: "me-him" | "me-her" | "gift-him" | "gift-her" | "anyone";
  moods: string[];
  families: string[];
  intensity: 2 | 3 | 5;
  occasions: string[];
  season: "SUMMER" | "MONSOON" | "WINTER" | "ALL";
  form: "PERFUME" | "ATTAR" | "THERAPY" | "ANY";
  budget: "u1500" | "1500-3000" | "o3000" | "any";
};

export type QuizProduct = {
  id: string;
  kind: string;
  family: string | null;
  gender: "MEN" | "WOMEN" | "UNISEX";
  moods: string[];
  occasions?: string[];
  seasons?: string[];
  intensity?: number;
  forms: string[];
  minPrice: number;
};

export type MatchReason =
  | { k: "mood"; v: string }
  | { k: "family"; v: string }
  | { k: "intensity" }
  | { k: "occasion"; v: string }
  | { k: "season"; v: string }
  | { k: "form"; v: string }
  | { k: "budget" };

export type Match = { id: string; score: number; reasons: MatchReason[] };

const BUDGET_MAX: Record<QuizAnswers["budget"], number> = { u1500: 150_000, "1500-3000": 300_000, o3000: Infinity, any: Infinity };
const BUDGET_MIN: Record<QuizAnswers["budget"], number> = { u1500: 0, "1500-3000": 0, o3000: 250_000, any: 0 };

export function genderOf(a: QuizAnswers): "MEN" | "WOMEN" | null {
  if (a.forWhom === "me-him" || a.forWhom === "gift-him") return "MEN";
  if (a.forWhom === "me-her" || a.forWhom === "gift-her") return "WOMEN";
  return null;
}

/** Score one fragrance against the answers. Weights sum to 100. */
export function scoreProduct(p: QuizProduct, a: QuizAnswers): Match | null {
  const gender = genderOf(a);
  if (gender && p.gender !== "UNISEX" && p.gender !== gender) return null;
  if (p.kind !== "FRAGRANCE") return null;

  const reasons: MatchReason[] = [];
  let score = 0;

  // Mood (30)
  const moodHits = p.moods.filter((m) => a.moods.includes(m));
  if (moodHits.length) {
    score += moodHits.length >= 2 || a.moods.length === 1 ? 30 : 22;
    reasons.push({ k: "mood", v: moodHits[0] });
  }

  // Family (26)
  if (p.family && a.families.includes(p.family)) {
    score += 26;
    reasons.push({ k: "family", v: p.family });
  } else if (!a.families.length) {
    score += 13;
  }

  // Intensity (14) — closeness on a 1–5 scale
  const intensity = p.intensity ?? 3;
  const closeness = 1 - Math.abs(intensity - a.intensity) / 4;
  score += Math.round(14 * closeness);
  if (closeness >= 0.75) reasons.push({ k: "intensity" });

  // Occasion (10)
  const occHit = (p.occasions ?? []).find((o) => a.occasions.includes(o));
  if (occHit) {
    score += 10;
    reasons.push({ k: "occasion", v: occHit });
  } else if (!a.occasions.length) score += 5;

  // Season (10)
  const seasons = p.seasons ?? [];
  if (a.season === "ALL") score += seasons.length >= 4 ? 10 : 6;
  else if (seasons.includes(a.season)) {
    score += 10;
    reasons.push({ k: "season", v: a.season });
  }

  // Form (6)
  if (a.form === "PERFUME" || a.form === "ATTAR") {
    if (p.forms.includes(a.form)) {
      score += 6;
      reasons.push({ k: "form", v: a.form });
    } else score -= 8;
  } else score += 3;

  // Budget (4, or a penalty when clearly out of range)
  if (p.minPrice <= BUDGET_MAX[a.budget] && p.minPrice >= BUDGET_MIN[a.budget]) {
    score += 4;
    if (a.budget !== "any") reasons.push({ k: "budget" });
  } else score -= 12;

  // Gender-specific products for a gendered answer get a small boost
  if (gender && p.gender === gender) score += 3;

  return { id: p.id, score: Math.max(0, Math.min(99, Math.round(score))), reasons: reasons.slice(0, 3) };
}

export function rankProducts(products: QuizProduct[], a: QuizAnswers): Match[] {
  return products
    .map((p) => scoreProduct(p, a))
    .filter((m): m is Match => !!m)
    .sort((x, y) => y.score - x.score);
}

/** Best therapy blend for the chosen moods (the "perfume + therapy combo"). */
export function pickTherapy(products: QuizProduct[], a: QuizAnswers) {
  const therapies = products.filter((p) => p.kind === "THERAPY");
  return therapies
    .map((p) => ({ p, hits: p.moods.filter((m) => a.moods.includes(m)).length }))
    .sort((x, y) => y.hits - x.hits)[0]?.p;
}

// ─── Scent DNA ──────────────────────────────────────────────────────────────

export const DNA_AXES = ["warmth", "freshness", "florality", "woodiness", "sensuality", "intensity"] as const;
export type ScentDNA = Record<(typeof DNA_AXES)[number], number>;

const FAMILY_AXES: Record<string, Partial<ScentDNA>> = {
  OUD: { warmth: 0.9, woodiness: 0.6, sensuality: 0.5 },
  AMBER: { warmth: 1, sensuality: 0.5 },
  SPICY: { warmth: 0.8, woodiness: 0.2 },
  GOURMAND: { warmth: 0.7, sensuality: 0.8 },
  FLORAL: { florality: 1, sensuality: 0.4 },
  MUSK: { sensuality: 0.8, florality: 0.2, freshness: 0.2 },
  WOODY: { woodiness: 1, warmth: 0.3 },
  EARTHY: { woodiness: 0.7, freshness: 0.3 },
  CITRUS: { freshness: 1 },
  FRESH: { freshness: 0.9, florality: 0.1 },
  HERBAL: { freshness: 0.7, woodiness: 0.2 },
};

const MOOD_AXES: Record<string, Partial<ScentDNA>> = {
  CALM: { woodiness: 0.3, sensuality: 0.2 },
  ENERGETIC: { freshness: 0.5 },
  CONFIDENT: { warmth: 0.4, intensity: 0.3 },
  FOCUSED: { woodiness: 0.3, freshness: 0.3 },
  ROMANTIC: { florality: 0.4, sensuality: 0.5 },
  BALANCED: { freshness: 0.2, woodiness: 0.2, florality: 0.2 },
};

export function scentDNA(a: QuizAnswers): ScentDNA {
  const dna: ScentDNA = { warmth: 0.15, freshness: 0.15, florality: 0.15, woodiness: 0.15, sensuality: 0.15, intensity: 0 };
  for (const f of a.families) for (const [k, v] of Object.entries(FAMILY_AXES[f] ?? {})) dna[k as keyof ScentDNA] += v;
  for (const m of a.moods) for (const [k, v] of Object.entries(MOOD_AXES[m] ?? {})) dna[k as keyof ScentDNA] += v;
  const max = Math.max(...DNA_AXES.filter((x) => x !== "intensity").map((x) => dna[x]), 1);
  for (const x of DNA_AXES) if (x !== "intensity") dna[x] = Math.round((dna[x] / max) * 100) / 100;
  dna.intensity = a.intensity / 5;
  return dna;
}

/** A poetic title for the profile, keyed for translation. */
export function profileKey(a: QuizAnswers): string {
  const dna = scentDNA(a);
  const top = (["warmth", "freshness", "florality", "woodiness", "sensuality"] as const).reduce((x, y) => (dna[y] > dna[x] ? y : x));
  const bold = a.intensity >= 5;
  if (top === "warmth") return bold ? "midnightSovereign" : "goldenHearth";
  if (top === "freshness") return bold ? "radiantVoyager" : "morningPoet";
  if (top === "florality") return bold ? "velvetCharmer" : "gardenDreamer";
  if (top === "woodiness") return bold ? "groundedSage" : "sereneMystic";
  return bold ? "velvetCharmer" : "luminousRomantic";
}
