import { formatPrice } from "@/lib/money";
import { ogCard } from "@/server/og";
import { getProductDetail } from "@/server/queries/catalog";

/** Share image for a product page: /og/product/<slug>?locale=en */
export async function GET(_req: Request, ctx: RouteContext<"/og/product/[slug]">) {
  const { slug } = await ctx.params;
  // Card text uses the Latin brand fonts, so it is always rendered in English
  const product = await getProductDetail(slug, "en");
  if (!product) return new Response("Not found", { status: 404 });
  const forms = product.forms.map((f) => (f.type === "PERFUME" ? "Perfume" : f.type === "ATTAR" ? "Attar" : f.type === "OIL" ? "Therapy oil" : "Gift set")).join(" · ");
  const photo = product.forms[0]?.image ?? product.formDetails[0]?.images[0]?.url ?? null;
  return ogCard({
    photo,
    eyebrow: forms,
    title: product.name,
    subtitle: product.tagline,
    footer: `From ${formatPrice(product.minPrice, "en")} · aayatalruh.com`,
    accent: product.accentColor,
  });
}
