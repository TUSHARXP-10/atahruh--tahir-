/**
 * Seeds the Aayat al-Ruh catalogue, editorial content and an admin account.
 * Safe to re-run: catalogue/content tables are rebuilt, users and orders are kept.
 *
 *   pnpm db:seed
 */
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";
import { PrismaClient, type Prisma } from "../src/generated/prisma/client";
import { photo, type PhotoKey } from "../src/lib/images";
import { commerceDefaults, site } from "../src/lib/site";
import { COLLECTIONS, CONTENT_BLOCKS, COUPONS, JOURNAL, REVIEW_POOL, TESTIMONIALS } from "./seed-data/content";
import { NOTES } from "./seed-data/notes";
import { PAGE_BLOCKS } from "./seed-data/pages";
import { PRODUCT_PHOTOS } from "./seed-data/product-photos";
import { PRODUCTS, type SeedProduct } from "./seed-data/products";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const rs = (rupees: number) => rupees * 100;

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return Math.abs(h);
}

type VariantSeed = { label: string; sizeMl: number; price: number; isDefault?: boolean };

const SIZES: Record<string, VariantSeed[]> = {
  "PERFUME:classic": [
    { label: "30 ml", sizeMl: 30, price: 1499 },
    { label: "50 ml", sizeMl: 50, price: 2199, isDefault: true },
    { label: "100 ml", sizeMl: 100, price: 3499 },
  ],
  "PERFUME:luxe": [
    { label: "50 ml", sizeMl: 50, price: 3299, isDefault: true },
    { label: "100 ml", sizeMl: 100, price: 5499 },
  ],
  "ATTAR:classic": [
    { label: "3 ml", sizeMl: 3, price: 699 },
    { label: "6 ml", sizeMl: 6, price: 1199, isDefault: true },
    { label: "12 ml", sizeMl: 12, price: 1999 },
  ],
  "ATTAR:luxe": [
    { label: "3 ml", sizeMl: 3, price: 1499 },
    { label: "6 ml", sizeMl: 6, price: 2699, isDefault: true },
    { label: "12 ml", sizeMl: 12, price: 4799 },
  ],
  OIL: [
    { label: "10 ml", sizeMl: 10, price: 599, isDefault: true },
    { label: "30 ml", sizeMl: 30, price: 1199 },
  ],
};

const FORM_COPY = {
  PERFUME: {
    concentration: { classic: ["Eau de Parfum", "أو دو بارفان"], luxe: ["Extrait de Parfum", "مستخلص عطر"] },
    description: (n: string, nAr: string) => [
      `${n} in its spray form — luminous and diffusive, made to bloom around you and linger on fabric long after you have left the room.`,
      `${nAr} في صورة الرذاذ — مضيء وفوّاح، يتفتّح من حولك ويبقى عالقاً بالقماش بعد مغادرتك المكان بوقت طويل.`,
    ],
    howToUse: [
      "Spray 3–4 times from about 15 cm onto pulse points and clothing. Let it settle — never rub.",
      "رشّ ٣–٤ مرات من مسافة ١٥ سم تقريباً على نقاط النبض والملابس. اتركه يستقر — ولا تفركه.",
    ],
  },
  ATTAR: {
    concentration: { classic: ["Pure Attar · Oil", "عطر زيتي خالص"], luxe: ["Pure Attar · Oil", "عطر زيتي خالص"] },
    description: (n: string, nAr: string) => [
      `${n} as a pure attar — a concentrated, alcohol-free oil in the Kannauj tradition. Intimate, skin-close and astonishingly long-lasting.`,
      `${nAr} عطراً زيتياً خالصاً — زيت مركّز خالٍ من الكحول على طريقة قنّوج. حميمي وقريب من البشرة ويدوم طويلاً على نحو مدهش.`,
    ],
    howToUse: [
      "Glide the glass wand over the wrists, behind the ears or along the collar. One or two touches last all day.",
      "مرّر العصا الزجاجية على المعصمين وخلف الأذنين أو على الياقة. لمسة أو لمستان تدومان طوال اليوم.",
    ],
  },
  OIL: {
    concentration: { classic: ["Aromatherapy Oil Blend", "مزيج زيوت عطرية"], luxe: ["Aromatherapy Oil Blend", "مزيج زيوت عطرية"] },
    description: (n: string, nAr: string) => [
      `${n} is a blend of pure essential oils in a light carrier, crafted for diffusers, massage and mindful daily rituals.`,
      `${nAr} مزيج من الزيوت العطرية النقية في زيت حامل خفيف، صُنع لأجهزة النشر والتدليك والطقوس اليومية الواعية.`,
    ],
    howToUse: [
      "Add 4–6 drops to a diffuser, or warm 2–3 drops in the palms and inhale deeply. For massage, apply to the shoulders, neck or temples. Patch test before use; for external use only. Not a substitute for medical advice.",
      "أضف ٤–٦ قطرات إلى جهاز النشر، أو دفّئ ٢–٣ قطرات بين الكفين واستنشقها بعمق. للتدليك ضعه على الكتفين أو الرقبة أو الصدغين. جرّبه على مساحة صغيرة أولاً؛ للاستخدام الخارجي فقط. لا يغني عن الاستشارة الطبية.",
    ],
  },
} as const;

function variantsFor(p: SeedProduct, form: string): VariantSeed[] {
  if (form === "SET") return [{ label: p.kind === "DISCOVERY_SET" ? "5 × 2 ml" : "Gift box", sizeMl: p.kind === "DISCOVERY_SET" ? 10 : 0, price: p.setPrice ?? 999, isDefault: true }];
  if (form === "OIL") return SIZES.OIL;
  return SIZES[`${form}:${p.tier ?? "classic"}`];
}

function stockFor(slug: string, label: string) {
  if (slug === "oud-malaki" && label === "12 ml") return 0; // demo: back-in-stock alerts
  if (slug === "zafran-royale" && label === "100 ml") return 3; // demo: low stock
  return 8 + (hash(slug + label) % 52);
}

async function wipe() {
  await db.cartItem.deleteMany();
  await db.cart.deleteMany();
  await db.backInStockRequest.deleteMany();
  await db.wishlistItem.deleteMany();
  await db.review.deleteMany();
  await db.testimonial.deleteMany();
  await db.collectionProduct.deleteMany();
  await db.collection.deleteMany();
  await db.productNote.deleteMany();
  await db.productImage.deleteMany();
  await db.variant.deleteMany();
  await db.productForm.deleteMany();
  await db.product.deleteMany();
  await db.note.deleteMany();
  await db.journalPost.deleteMany();
}

async function seedNotes() {
  await db.note.createMany({
    data: Object.entries(NOTES).map(([slug, [name, nameAr]]) => ({ slug, name, nameAr })),
  });
  const notes = await db.note.findMany({ select: { id: true, slug: true } });
  return new Map(notes.map((n) => [n.slug, n.id]));
}

async function seedProducts(noteIds: Map<string, string>) {
  const ids = new Map<string, string>();

  for (const [index, p] of PRODUCTS.entries()) {
    const product = await db.product.create({
      data: {
        slug: p.slug,
        kind: p.kind,
        name: p.name,
        nameAr: p.nameAr,
        tagline: p.tagline,
        taglineAr: p.taglineAr,
        story: p.story,
        storyAr: p.storyAr,
        family: p.family,
        gender: p.gender,
        moods: p.moods ?? [],
        therapyNeeds: p.needs ?? [],
        seasons: p.seasons ?? [],
        times: p.times ?? [],
        occasions: p.occasions ?? [],
        longevity: p.longevity ?? 3,
        sillage: p.sillage ?? 3,
        intensity: p.intensity ?? 3,
        accentColor: p.color,
        bottleShape: p.shape ?? "facet",
        isBestseller: !!p.bestseller,
        isNew: !!p.isNew,
        isFeatured: !!p.featured,
        isSampleable: p.sampleable ?? (p.kind === "FRAGRANCE"),
        useBottleArt: !PRODUCT_PHOTOS[p.slug],
        position: index,
        seoTitle: `${p.name} — ${p.tagline}`,
        seoDescription: p.story.slice(0, 155),
      },
    });
    ids.set(p.slug, product.id);

    // Notes pyramid
    if (p.notes) {
      const rows: Prisma.ProductNoteCreateManyInput[] = [];
      (["top", "heart", "base"] as const).forEach((layer) => {
        p.notes![layer].forEach((slug, position) => {
          const noteId = noteIds.get(slug);
          if (!noteId) throw new Error(`Unknown note "${slug}" on ${p.slug}`);
          rows.push({ productId: product.id, noteId, layer: layer.toUpperCase() as "TOP" | "HEART" | "BASE", position });
        });
      });
      await db.productNote.createMany({ data: rows });
    }

    // Forms → variants → images
    for (const [formIndex, form] of p.forms.entries()) {
      const tier = p.tier ?? "classic";
      const copy = form in FORM_COPY ? FORM_COPY[form as keyof typeof FORM_COPY] : null;
      const [description, descriptionAr] = copy
        ? copy.description(p.name, p.nameAr)
        : [`${p.setContents ?? ""}. ${p.story}`, `${p.setContentsAr ?? ""}. ${p.storyAr}`];

      const photos: PhotoKey[] = PRODUCT_PHOTOS[p.slug]?.[form] ?? [];

      await db.productForm.create({
        data: {
          productId: product.id,
          type: form,
          position: formIndex,
          concentration: copy ? copy.concentration[tier][0] : p.kind === "DISCOVERY_SET" ? "Discovery Set" : "Gift Set",
          concentrationAr: copy ? copy.concentration[tier][1] : p.kind === "DISCOVERY_SET" ? "مجموعة اكتشاف" : "طقم هدايا",
          description,
          descriptionAr,
          howToUse: copy?.howToUse[0],
          howToUseAr: copy?.howToUse[1],
          images: {
            create: photos.map((key, position) => ({
              url: photo(key, 1600),
              alt: position === 0 ? p.name : `${p.name} — mood`,
              altAr: position === 0 ? p.nameAr : `${p.nameAr} — أجواء`,
              position,
            })),
          },
          variants: {
            create: variantsFor(p, form).map((v, position) => ({
              label: v.label,
              sizeMl: v.sizeMl,
              price: rs(v.price),
              mrp: form === "SET" ? (p.setMrp ? rs(p.setMrp) : null) : p.offer ? rs(Math.round((v.price * 1.2) / 100) * 100 - 1) : null,
              sku: `AAR-${p.slug.toUpperCase().replace(/[^A-Z0-9]+/g, "").slice(0, 10)}-${form[0]}${v.sizeMl || position}`,
              stock: form === "SET" ? 40 : stockFor(p.slug, v.label),
              isDefault: !!v.isDefault,
              position,
            })),
          },
        },
      });
    }
  }

  // Pairings ("Layer it with")
  for (const p of PRODUCTS) {
    if (!p.pairs?.length) continue;
    await db.product.update({
      where: { slug: p.slug },
      data: { pairsWith: { connect: p.pairs.map((slug) => ({ slug })) } },
    });
  }
  return ids;
}

async function seedCollections(productIds: Map<string, string>) {
  for (const c of COLLECTIONS) {
    await db.collection.create({
      data: {
        slug: c.slug,
        name: c.name,
        nameAr: c.nameAr,
        tagline: c.tagline,
        taglineAr: c.taglineAr,
        description: "description" in c ? c.description : null,
        descriptionAr: "descriptionAr" in c ? c.descriptionAr : null,
        imageUrl: c.image,
        position: c.position,
        isFeatured: "isFeatured" in c ? !!c.isFeatured : false,
        filter: "filter" in c ? (c.filter as Prisma.InputJsonValue) : undefined,
        products:
          "products" in c && c.products
            ? { create: c.products.map((slug, position) => ({ productId: productIds.get(slug)!, position })) }
            : undefined,
      },
    });
  }
}

async function seedReviewsAndTestimonials(productIds: Map<string, string>) {
  const now = Date.now();
  const reviews: Prisma.ReviewCreateManyInput[] = [];
  for (const p of PRODUCTS) {
    if (p.kind !== "FRAGRANCE" && p.kind !== "THERAPY") continue;
    const h = hash(p.slug);
    const count = 2 + (h % 4);
    for (let i = 0; i < count; i++) {
      const r = REVIEW_POOL[(h + i * 3) % REVIEW_POOL.length];
      reviews.push({
        productId: productIds.get(p.slug)!,
        authorName: r.authorName,
        location: r.location,
        title: r.title,
        body: r.body,
        rating: (h + i) % 5 === 0 ? 4 : 5,
        status: "APPROVED",
        verified: true,
        isPlaceholder: true,
        createdAt: new Date(now - ((h + i * 17) % 120) * 86_400_000),
      });
    }
  }
  await db.review.createMany({ data: reviews });

  await db.testimonial.createMany({
    data: TESTIMONIALS.map((t, position) => ({
      name: t.name,
      location: t.location,
      quote: t.quote,
      quoteAr: t.quoteAr,
      rating: t.rating,
      productId: productIds.get(t.product),
      position,
      isPlaceholder: true,
    })),
  });
}

async function seedJournal() {
  const now = Date.now();
  await db.journalPost.createMany({
    data: JOURNAL.map((j, i) => ({
      slug: j.slug,
      title: j.title,
      titleAr: j.titleAr,
      excerpt: j.excerpt,
      excerptAr: j.excerptAr,
      body: j.body,
      bodyAr: j.bodyAr,
      coverUrl: j.cover,
      tags: [...j.tags],
      readMinutes: j.readMinutes,
      publishedAt: new Date(now - i * 9 * 86_400_000),
    })),
  });
}

async function seedCommerce() {
  for (const c of COUPONS) {
    await db.coupon.upsert({
      where: { code: c.code },
      update: {},
      create: { ...c, minSubtotal: "minSubtotal" in c ? c.minSubtotal : 0 },
    });
  }
  for (const [key, block] of Object.entries(CONTENT_BLOCKS)) {
    await db.contentBlock.upsert({
      where: { key },
      update: { data: block.data as Prisma.InputJsonValue, dataAr: ("dataAr" in block ? block.dataAr : undefined) as Prisma.InputJsonValue },
      create: { key, data: block.data as Prisma.InputJsonValue, dataAr: ("dataAr" in block ? block.dataAr : undefined) as Prisma.InputJsonValue },
    });
  }
  // FAQ and policies are edited by the client in Admin → Pages: create once, never overwrite
  for (const [key, block] of Object.entries(PAGE_BLOCKS)) {
    await db.contentBlock.upsert({
      where: { key },
      update: {},
      create: { key, data: block.data as unknown as Prisma.InputJsonValue, dataAr: block.dataAr as unknown as Prisma.InputJsonValue },
    });
  }
  const settings: Record<string, Prisma.InputJsonValue> = {
    commerce: { ...commerceDefaults },
    contact: { ...site.contact },
    socials: { ...site.socials },
  };
  for (const [key, value] of Object.entries(settings)) {
    await db.setting.upsert({ where: { key }, update: {}, create: { key, value } });
  }
}

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    console.log("· SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set — skipping admin user");
    return;
  }
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    await db.user.update({ where: { email }, data: { role: "admin" } });
    console.log(`· admin ${email} already exists (role ensured)`);
    return;
  }
  const id = randomUUID();
  await db.user.create({
    data: {
      id,
      email,
      name: "Aayat al-Ruh Admin",
      emailVerified: true,
      role: "admin",
      accounts: {
        create: { id: randomUUID(), accountId: id, providerId: "credential", password: await hashPassword(password) },
      },
    },
  });
  console.log(`· admin user created: ${email}`);
}

async function main() {
  // The seed rebuilds the catalogue. On a live database that already has products,
  // refuse unless explicitly forced — it would replace the client's own edits.
  const local = /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL ?? "");
  if (!local && (await db.product.count()) > 0 && !process.argv.includes("--force")) {
    console.error("✖ This database already has products and is not local. The seed would replace the catalogue.");
    console.error("  Use `pnpm db:content` to add missing content safely, or run `pnpm exec prisma db seed -- --force` if you really mean it.");
    process.exit(1);
  }
  console.time("seed");
  await wipe();
  const noteIds = await seedNotes();
  const productIds = await seedProducts(noteIds);
  await seedCollections(productIds);
  await seedReviewsAndTestimonials(productIds);
  await seedJournal();
  await seedCommerce();
  await seedAdmin();
  const [products, variants] = await Promise.all([db.product.count(), db.variant.count()]);
  console.log(`· ${products} products, ${variants} variants, ${COLLECTIONS.length} collections`);
  console.timeEnd("seed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
