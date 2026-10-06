"use client";

import { BadgeCheck, Gift, RotateCcw, Share2, Sparkles, Truck } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Ornament } from "@/components/brand/ornament";
import { useStore } from "@/components/providers/store-provider";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Stars } from "@/components/ui/stars";
import { track } from "@/lib/analytics";
import { formatPrice } from "@/lib/money";
import type { CardVariant, FormType } from "@/lib/types";
import type { ProductDetail } from "@/server/queries/catalog";
import { DeliveryCheck } from "./delivery-check";
import { useProductForm } from "./form-context";
import { Gallery, type GalleryItem } from "./gallery";
import { defaultVariant } from "./product-card";
import { ProductVisual } from "./product-visual";
import { PurchaseOptions } from "./purchase-options";

const RECENT_KEY = "aar-recently-viewed";

export function ProductExperience({
  product,
  breadcrumb,
  freeShippingThreshold,
}: {
  product: ProductDetail;
  breadcrumb: { label: string; href?: string }[];
  freeShippingThreshold: number;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const { add, pending } = useStore();
  const { form, setForm } = useProductForm();
  const [variant, setVariant] = useState<CardVariant | null>(null);
  const purchaseRef = useRef<HTMLDivElement>(null);
  const [showSticky, setShowSticky] = useState(false);

  const cardForm = product.forms.find((f) => f.type === form) ?? product.forms[0];
  const details = product.formDetails.find((f) => f.type === form) ?? product.formDetails[0];
  const activeVariant = variant && cardForm.variants.some((v) => v.id === variant.id) ? variant : defaultVariant(cardForm);

  const items: GalleryItem[] = [
    ...(product.useBottleArt ? [{ kind: "art" as const }] : []),
    ...details.images.map((img) => ({ kind: "photo" as const, url: img.url, alt: img.alt })),
  ];

  const changeForm = (f: FormType) => {
    setForm(f);
    setVariant(null);
  };

  // recently viewed
  useEffect(() => {
    try {
      const list: string[] = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
      localStorage.setItem(RECENT_KEY, JSON.stringify([product.slug, ...list.filter((s) => s !== product.slug)].slice(0, 12)));
    } catch {}
  }, [product.slug]);

  // One view_item per product (the page re-renders when the bag or form changes)
  const viewed = useRef<string | null>(null);
  useEffect(() => {
    if (viewed.current === product.id) return;
    viewed.current = product.id;
    const v = defaultVariant(product.forms[0]);
    track("view_item", { value: v.price, items: [{ id: product.id, name: product.name, price: v.price }] });
  }, [product]);

  // sticky mobile bar once the main purchase block scrolls away
  useEffect(() => {
    const el = purchaseRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShowSticky(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Tell the floating WhatsApp / back-to-top buttons to make room for the sticky bar
  useEffect(() => {
    document.documentElement.classList.toggle("has-sticky-bar", showSticky);
    return () => document.documentElement.classList.remove("has-sticky-bar");
  }, [showSticky]);

  const share = async () => {
    const data = { title: product.name, text: t("product.shareText", { name: product.name }), url: window.location.href };
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(data.url);
        toast.success(t("product.copied"));
      }
    } catch {}
  };

  const isTherapy = product.kind === "THERAPY";

  return (
    <>
      <div className="grid gap-10 grid-cols-1 lg:grid-cols-12 lg:gap-14">
        <div className="min-w-0 lg:col-span-7">
          <div className="lg:sticky lg:top-24">
            <Gallery items={items} form={form} productKind={product.kind} name={product.name} color={product.accentColor} shape={product.bottleShape} />
          </div>
        </div>

        <div className="min-w-0 lg:col-span-5">
          <Breadcrumbs items={breadcrumb} />

          <div className="mb-3 mt-8 flex flex-wrap items-center gap-3">
            <Ornament className="w-8" />
            <span className="eyebrow">
              {product.family ? t(`families.${product.family}`) : t(`forms.${form}`)}
              {product.gender !== "UNISEX" ? ` · ${t(`genders.${product.gender}`)}` : ""}
            </span>
            {product.isNew ? <Badge tone="gold">{t("common.new")}</Badge> : null}
            {product.isBestseller ? <Badge>{t("common.bestseller")}</Badge> : null}
          </div>

          <h1 className="font-display text-[clamp(2.6rem,4.6vw,4.2rem)] leading-[1.02] text-ivory">{product.name}</h1>
          <p className="mt-3 font-display text-xl italic text-gold-light/90">{product.tagline}</p>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-mist">
            {product.rating.count > 0 ? (
              <a href="#reviews" className="flex items-center gap-2 hover:text-ivory">
                <Stars value={product.rating.avg} size={13} />
                <span className="tabular-nums">{product.rating.avg.toFixed(1)}</span>·<span>{t("common.reviews", { count: product.rating.count })}</span>
              </a>
            ) : null}
            {product.forms.length > 1 ? (
              <span className="flex items-center gap-1.5 text-gold/80">
                <Sparkles className="size-3.5" /> {t("product.bothForms")}
              </span>
            ) : null}
            <button type="button" onClick={share} className="ms-auto flex items-center gap-1.5 hover:text-gold-light">
              <Share2 className="size-3.5" /> {t("product.share")}
            </button>
          </div>

          <p className="mt-7 leading-relaxed text-smoke">{product.story}</p>

          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={form}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mt-4 border-s-2 border-gold/40 ps-4 text-sm leading-relaxed text-smoke/90"
            >
              {details.description}
            </motion.p>
          </AnimatePresence>

          <div ref={purchaseRef} className="mt-9">
            <PurchaseOptions
              product={product}
              form={form}
              onFormChange={changeForm}
              variantId={activeVariant.id}
              onVariantChange={setVariant}
            />
          </div>

          <div className="mt-8">
            <DeliveryCheck />
          </div>

          <ul className="mt-6 grid gap-3 text-xs text-smoke sm:grid-cols-2">
            {[
              { Icon: Truck, text: t("product.freeShippingOver", { amount: formatPrice(freeShippingThreshold, locale) }) },
              { Icon: BadgeCheck, text: t("product.authentic") },
              { Icon: Gift, text: t("product.giftWrap") },
              { Icon: RotateCcw, text: t("product.easyReturns") },
            ].map(({ Icon, text }) => (
              <li key={text} className="flex items-start gap-2.5">
                <Icon className="mt-px size-4 shrink-0 text-gold" strokeWidth={1.25} />
                {text}
              </li>
            ))}
          </ul>

          {isTherapy ? <p className="mt-6 text-[0.7rem] leading-relaxed text-mist">{t("product.wellnessNote")}</p> : null}
        </div>
      </div>

      {/* Sticky add-to-cart (mobile) */}
      <AnimatePresence>
        {showSticky ? (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="glass fixed inset-x-0 bottom-0 z-40 border-t border-gold/20 px-4 py-3 lg:hidden"
          >
            <div className="flex items-center gap-3">
              <div className="h-12 w-9 shrink-0 overflow-hidden rounded-t-full">
                <ProductVisual form={form} kind={product.kind} image={cardForm.image} name={product.name} color={product.accentColor} shape={product.bottleShape} plain stage={false} sizes="36px" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-lg leading-tight text-ivory">{product.name}</p>
                <p className="text-xs tabular-nums text-smoke">
                  {formatPrice(activeVariant.price, locale)} · {t(`forms.${form}`)}
                </p>
              </div>
              <button
                type="button"
                disabled={pending || activeVariant.stock <= 0}
                onClick={() => add({ variantId: activeVariant.id, label: product.name })}
                className="h-11 shrink-0 rounded-sm bg-gold-metal px-5 text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-ink disabled:opacity-50"
              >
                {activeVariant.stock <= 0 ? t("common.soldOut") : t("common.addToCart")}
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
