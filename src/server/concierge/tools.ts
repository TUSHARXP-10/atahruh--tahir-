import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { rankProducts, type QuizAnswers } from "@/lib/quiz";
import { fillTokens } from "@/lib/tokens";
import type { ProductCardData } from "@/lib/types";
import { loadQuizProducts } from "../actions/quiz";
import { getAllCards, getProductDetail } from "../queries/catalog";
import { getContent, getSettings, type FaqBlock } from "../queries/content";

/*
 * Catalogue-grounded tools for the Scent Concierge. Every product fact the
 * model states must come from these results — they read the live catalogue.
 */

const FAMILIES = ["OUD", "FLORAL", "WOODY", "AMBER", "MUSK", "CITRUS", "FRESH", "SPICY", "GOURMAND", "EARTHY", "HERBAL"] as const;
const MOODS = ["CALM", "ENERGETIC", "CONFIDENT", "FOCUSED", "ROMANTIC", "BALANCED"] as const;
const NEEDS = ["STRESS", "SLEEP", "FOCUS", "SKIN_HAIR", "BALANCE"] as const;

const searchInput = z.object({
  query: z.string().max(80).optional(),
  kind: z.enum(["FRAGRANCE", "THERAPY", "GIFT_SET"]).optional(),
  form: z.enum(["PERFUME", "ATTAR"]).optional(),
  gender: z.enum(["MEN", "WOMEN", "UNISEX"]).optional(),
  family: z.enum(FAMILIES).optional(),
  mood: z.enum(MOODS).optional(),
  need: z.enum(NEEDS).optional(),
  max_price_inr: z.number().positive().max(1_000_000).optional(),
  limit: z.number().int().min(1).max(8).optional(),
});
const detailInput = z.object({ slug: z.string().min(1).max(100) });
const matchInput = z.object({
  for_whom: z.enum(["me-him", "me-her", "gift-him", "gift-her", "anyone"]).default("anyone"),
  moods: z.array(z.enum(MOODS)).max(2).default([]),
  families: z.array(z.enum(FAMILIES)).max(3).default([]),
  intensity: z.union([z.literal(2), z.literal(3), z.literal(5)]).default(3),
  form: z.enum(["PERFUME", "ATTAR", "ANY"]).default("ANY"),
  budget: z.enum(["u1500", "1500-3000", "o3000", "any"]).default("any"),
});
const policyInput = z.object({ topic: z.enum(["shipping", "payments", "returns", "products", "gifting", "all"]) });

export const CONCIERGE_TOOLS: Anthropic.Beta.BetaTool[] = [
  {
    name: "search_catalog",
    description:
      "Search the Aayat al-Ruh catalogue. Use it whenever you need products to recommend or compare. Filters are optional and combine with AND. Returns name, slug, type, family, gender, forms with sizes and prices in INR, key notes, rating and stock.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Free text: a name, note (e.g. 'rose', 'oud', 'saffron') or word from the tagline" },
        kind: { type: "string", enum: ["FRAGRANCE", "THERAPY", "GIFT_SET"], description: "FRAGRANCE = perfumes/attars, THERAPY = aromatherapy oils, GIFT_SET = boxed sets" },
        form: { type: "string", enum: ["PERFUME", "ATTAR"], description: "Only products sold in this form" },
        gender: { type: "string", enum: ["MEN", "WOMEN", "UNISEX"] },
        family: { type: "string", enum: [...FAMILIES] },
        mood: { type: "string", enum: [...MOODS] },
        need: { type: "string", enum: [...NEEDS], description: "Wellness need, for therapy oils" },
        max_price_inr: { type: "number", description: "Starting price must be at or below this many rupees" },
        limit: { type: "integer", description: "1–8, default 6" },
      },
    },
    eager_input_streaming: true,
  },
  {
    name: "get_product_details",
    description: "Full details for one product by slug: story, notes pyramid (top/heart/base), every form and size with price and stock, longevity, projection, intensity, seasons, occasions and how to use it.",
    input_schema: { type: "object", properties: { slug: { type: "string" } }, required: ["slug"] },
    eager_input_streaming: true,
  },
  {
    name: "match_preferences",
    description:
      "Rank fragrances against a customer's preferences with the same engine as the Fragrance Score quiz. Returns up to 5 matches with a 0–100 score and the reasons. Use when the customer describes what they like rather than naming products.",
    input_schema: {
      type: "object",
      properties: {
        for_whom: { type: "string", enum: ["me-him", "me-her", "gift-him", "gift-her", "anyone"] },
        moods: { type: "array", items: { type: "string", enum: [...MOODS] }, description: "Up to 2" },
        families: { type: "array", items: { type: "string", enum: [...FAMILIES] }, description: "Up to 3" },
        intensity: { type: "integer", enum: [2, 3, 5], description: "2 soft, 3 moderate, 5 bold" },
        form: { type: "string", enum: ["PERFUME", "ATTAR", "ANY"] },
        budget: { type: "string", enum: ["u1500", "1500-3000", "o3000", "any"], description: "Budget for a full bottle in INR" },
      },
    },
    eager_input_streaming: true,
  },
  {
    name: "store_policies",
    description: "The store's current answers on shipping, delivery times, payments (Paytm, cash on delivery), returns, product care and gifting, with live fees. Use for any question about orders, delivery, payment or returns.",
    input_schema: {
      type: "object",
      properties: { topic: { type: "string", enum: ["shipping", "payments", "returns", "products", "gifting", "all"] } },
      required: ["topic"],
    },
    eager_input_streaming: true,
  },
];

const rupees = (paise: number) => Math.round(paise / 100);

function summarize(c: ProductCardData) {
  return {
    slug: c.slug,
    name: c.name,
    type: c.kind,
    family: c.family,
    gender: c.gender,
    tagline: c.tagline,
    notes: c.notes.slice(0, 6),
    rating: c.rating.count ? `${c.rating.avg}/5 (${c.rating.count})` : null,
    forms: c.forms.map((f) => ({
      form: f.type,
      sizes: f.variants.map((v) => ({ size: v.label, price_inr: rupees(v.price), mrp_inr: v.mrp ? rupees(v.mrp) : null, in_stock: v.stock > 0 })),
    })),
  };
}

export type ToolOutcome = { content: string; isError?: boolean; slugs: string[] };

/** Validate and run one tool call. Inputs are untrusted model output. */
export async function runConciergeTool(name: string, input: unknown, locale: string): Promise<ToolOutcome> {
  const invalid = (e: z.ZodError): ToolOutcome => ({ content: `Invalid input: ${e.issues.map((i) => `${i.path.join(".") || "input"} ${i.message}`).join("; ")}`, isError: true, slugs: [] });

  switch (name) {
    case "search_catalog": {
      const p = searchInput.safeParse(input);
      if (!p.success) return invalid(p.error);
      const f = p.data;
      const q = f.query?.toLowerCase().trim();
      const cards = (await getAllCards(locale)).filter(
        (c) =>
          c.kind !== "DISCOVERY_SET" &&
          (!f.kind || c.kind === f.kind) &&
          (!f.form || c.forms.some((x) => x.type === f.form)) &&
          (!f.gender || c.gender === f.gender || c.gender === "UNISEX") &&
          (!f.family || c.family === f.family) &&
          (!f.mood || c.moods.includes(f.mood)) &&
          (!f.need || c.needs.includes(f.need)) &&
          (!f.max_price_inr || c.minPrice <= f.max_price_inr * 100) &&
          (!q || [c.name, c.tagline, ...c.notes].some((s) => s.toLowerCase().includes(q))),
      );
      const ranked = cards.sort((a, b) => Number(b.isBestseller) - Number(a.isBestseller) || b.rating.avg - a.rating.avg).slice(0, f.limit ?? 6);
      return { content: JSON.stringify({ count: cards.length, results: ranked.map(summarize) }), slugs: ranked.map((c) => c.slug) };
    }
    case "get_product_details": {
      const p = detailInput.safeParse(input);
      if (!p.success) return invalid(p.error);
      const d = await getProductDetail(p.data.slug, locale);
      if (!d) return { content: `No product with slug "${p.data.slug}". Use search_catalog to find valid slugs.`, isError: true, slugs: [] };
      return {
        content: JSON.stringify({
          ...summarize(d),
          story: d.story,
          notes: { top: d.notesPyramid.top.map((n) => n.name), heart: d.notesPyramid.heart.map((n) => n.name), base: d.notesPyramid.base.map((n) => n.name) },
          longevity_1_to_5: d.longevity,
          projection_1_to_5: d.sillage,
          intensity_1_to_5: d.intensity,
          seasons: d.seasons,
          occasions: d.occasions,
          forms_detail: d.formDetails.map((f) => ({ form: f.type, description: f.description, how_to_use: f.howToUse })),
        }),
        slugs: [d.slug],
      };
    }
    case "match_preferences": {
      const p = matchInput.safeParse(input);
      if (!p.success) return invalid(p.error);
      const a = p.data;
      const answers: QuizAnswers = { forWhom: a.for_whom, moods: a.moods, families: a.families, intensity: a.intensity, occasions: [], season: "ALL", form: a.form, budget: a.budget };
      const [products, cards] = await Promise.all([loadQuizProducts(), getAllCards(locale)]);
      const matches = rankProducts(products, answers).slice(0, 5);
      const bySlug = new Map(cards.map((c) => [c.id, c]));
      const results = matches.map((m) => ({ score: m.score, reasons: m.reasons, product: bySlug.get(m.id) ? summarize(bySlug.get(m.id)!) : null })).filter((r) => r.product);
      return { content: JSON.stringify({ results }), slugs: results.map((r) => r.product!.slug) };
    }
    case "store_policies": {
      const p = policyInput.safeParse(input);
      if (!p.success) return invalid(p.error);
      const [faq, settings] = await Promise.all([getContent<FaqBlock>("faq", "en"), getSettings()]);
      const topicMap: Record<string, string> = { shipping: "Orders & delivery", payments: "Payments", returns: "Returns", products: "Our fragrances", gifting: "Gifting" };
      const items = (faq?.items ?? []).filter((i) => p.data.topic === "all" || i.topic === topicMap[p.data.topic]);
      return {
        content: JSON.stringify({
          answers: items.map((i) => ({ q: i.q, a: fillTokens(i.a, settings, "en") })),
          contact: { whatsapp: settings.contact.whatsapp, email: settings.contact.email, hours: settings.contact.hours },
          pages: { track_order: "/track-order", shipping: "/policies/shipping", returns: "/policies/returns", faq: "/faq", contact: "/contact" },
        }),
        slugs: [],
      };
    }
    default:
      return { content: `Unknown tool "${name}"`, isError: true, slugs: [] };
  }
}
