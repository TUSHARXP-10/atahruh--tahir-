import { describe, expect, it } from "vitest";
import { profileKey, rankProducts, scentDNA, scoreProduct, type QuizAnswers, type QuizProduct } from "@/lib/quiz";

const base: QuizAnswers = {
  forWhom: "me-her",
  moods: ["ROMANTIC"],
  families: ["FLORAL"],
  intensity: 3,
  occasions: ["DATE"],
  season: "SUMMER",
  form: "ANY",
  budget: "any",
};

const rose: QuizProduct = { id: "rose", kind: "FRAGRANCE", family: "FLORAL", gender: "WOMEN", moods: ["ROMANTIC", "CALM"], occasions: ["DATE"], seasons: ["SPRING", "SUMMER"], intensity: 3, forms: ["PERFUME", "ATTAR"], minPrice: 69_900 };
const oud: QuizProduct = { id: "oud", kind: "FRAGRANCE", family: "OUD", gender: "MEN", moods: ["CONFIDENT"], occasions: ["CELEBRATION"], seasons: ["WINTER"], intensity: 5, forms: ["ATTAR"], minPrice: 149_900 };
const musk: QuizProduct = { id: "musk", kind: "FRAGRANCE", family: "MUSK", gender: "UNISEX", moods: ["CALM", "BALANCED"], occasions: ["EVERYDAY"], seasons: ["SPRING", "SUMMER", "MONSOON", "AUTUMN", "WINTER"], intensity: 2, forms: ["PERFUME"], minPrice: 69_900 };
const therapy: QuizProduct = { id: "sukoon", kind: "THERAPY", family: "HERBAL", gender: "UNISEX", moods: ["CALM"], forms: ["OIL"], minPrice: 59_900 };

describe("fragrance score", () => {
  it("ranks the closest match first with reasons", () => {
    const ranked = rankProducts([oud, musk, rose, therapy], base);
    expect(ranked[0].id).toBe("rose");
    expect(ranked[0].score).toBeGreaterThan(80);
    expect(ranked[0].reasons.map((r) => r.k)).toContain("mood");
  });

  it("excludes products for the other gender and non-fragrances", () => {
    const ids = rankProducts([oud, musk, rose, therapy], base).map((m) => m.id);
    expect(ids).not.toContain("oud");
    expect(ids).not.toContain("sukoon");
    expect(ids).toContain("musk");
  });

  it("penalises out-of-budget picks", () => {
    const within = scoreProduct(rose, { ...base, budget: "u1500" })!;
    const pricey = scoreProduct({ ...rose, minPrice: 499_900 }, { ...base, budget: "u1500" })!;
    expect(within.score).toBeGreaterThan(pricey.score);
  });

  it("keeps scores within 0–99", () => {
    for (const p of [rose, musk]) {
      const s = scoreProduct(p, base)!.score;
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(99);
    }
  });

  it("derives a scent DNA and title", () => {
    const dna = scentDNA({ ...base, families: ["OUD", "AMBER"], moods: ["CONFIDENT"], intensity: 5 });
    expect(dna.warmth).toBe(1);
    expect(profileKey({ ...base, families: ["OUD", "AMBER"], moods: ["CONFIDENT"], intensity: 5 })).toBe("midnightSovereign");
    expect(profileKey({ ...base, families: ["CITRUS"], moods: ["ENERGETIC"], intensity: 2 })).toBe("morningPoet");
  });
});
