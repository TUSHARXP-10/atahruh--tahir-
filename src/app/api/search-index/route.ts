import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAllCards } from "@/server/queries/catalog";

export const revalidate = 3600;

/** Lightweight index for instant ⌘K search (both languages are searchable). */
export async function GET(req: NextRequest) {
  const locale = req.nextUrl.searchParams.get("locale") === "ar" ? "ar" : "en";
  const [cards, products] = await Promise.all([
    getAllCards(locale),
    db.product.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true, nameAr: true, notes: { select: { note: { select: { name: true, nameAr: true } } } } },
    }),
  ]);
  const extra = new Map(products.map((p) => [p.id, p]));

  const index = cards
    .filter((c) => c.kind !== "DISCOVERY_SET")
    .map((c) => {
      const p = extra.get(c.id);
      return {
        id: c.id,
        slug: c.slug,
        name: c.name,
        alt: [p?.name, p?.nameAr].filter(Boolean).join(" "),
        tagline: c.tagline,
        kind: c.kind,
        family: c.family,
        forms: c.forms.map((f) => f.type),
        notes: (p?.notes ?? []).flatMap((n) => [n.note.name, n.note.nameAr ?? ""]).join(" "),
        price: c.minPrice,
        color: c.accentColor,
        shape: c.bottleShape,
        image: c.forms[0]?.image ?? null,
      };
    });

  return NextResponse.json(index, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
  });
}
