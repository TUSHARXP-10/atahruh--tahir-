"use server";

import { z } from "zod";
import type { ProductCardData } from "@/lib/types";
import { getAllCards } from "../queries/catalog";

/** Card data for a list of slugs, in the given order (used by "recently viewed" and the wishlist). */
export async function getCardsBySlugs(slugs: string[], locale: string): Promise<ProductCardData[]> {
  const parsed = z.array(z.string().max(120)).max(60).safeParse(slugs);
  if (!parsed.success) return [];
  const cards = await getAllCards(locale === "ar" ? "ar" : "en");
  const bySlug = new Map(cards.map((c) => [c.slug, c]));
  return parsed.data.map((s) => bySlug.get(s)).filter(Boolean) as ProductCardData[];
}

export async function getCardsByIds(ids: string[], locale: string): Promise<ProductCardData[]> {
  const parsed = z.array(z.string().max(60)).max(100).safeParse(ids);
  if (!parsed.success) return [];
  const cards = await getAllCards(locale === "ar" ? "ar" : "en");
  const byId = new Map(cards.map((c) => [c.id, c]));
  return parsed.data.map((s) => byId.get(s)).filter(Boolean) as ProductCardData[];
}
