import "server-only";
import { updateTag } from "next/cache";
import { CATALOG_TAG, CONTENT_TAG, REVIEWS_TAG } from "../queries/catalog";

const TAGS = { catalog: CATALOG_TAG, content: CONTENT_TAG, reviews: REVIEWS_TAG } as const;

/** After an admin edit: expire storefront caches so the next visit shows the change. */
export function refreshStorefront(...areas: (keyof typeof TAGS)[]) {
  for (const area of areas) updateTag(TAGS[area]);
}
