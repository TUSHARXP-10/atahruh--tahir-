"use client";

import { Eye, Heart, ShoppingBag } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useStore } from "@/components/providers/store-provider";
import { Stars } from "@/components/ui/stars";
import { Link } from "@/i18n/navigation";
import { sizeLabel } from "@/lib/format";
import { discountPercent, formatPrice } from "@/lib/money";
import type { FormType, ProductCardData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { FormToggle } from "./form-toggle";
import { ProductVisual } from "./product-visual";

export function defaultVariant(form: ProductCardData["forms"][number]) {
  return form.variants.find((v) => v.isDefault && v.stock > 0) ?? form.variants.find((v) => v.stock > 0) ?? form.variants[0];
}

/**
 * Compact product card (photo, name, rating, price, full-width Add to Cart).
 * Reads the section tone, so it sits on ivory or noir bands unchanged.
 */
export function ProductCard({
  product,
  priority,
  onQuickView,
  className,
  preferForm,
}: {
  product: ProductCardData;
  priority?: boolean;
  onQuickView?: (p: ProductCardData, form: FormType) => void;
  className?: string;
  /** Show this form first when the product has it (e.g. on the Attars page) */
  preferForm?: FormType;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const { add, toggleWishlist, inWishlist, pending } = useStore();
  const [formType, setFormType] = useState<FormType>(
    preferForm && product.forms.some((f) => f.type === preferForm) ? preferForm : (product.forms[0]?.type ?? "PERFUME"),
  );
  const form = product.forms.find((f) => f.type === formType) ?? product.forms[0];
  const variant = form ? defaultVariant(form) : undefined;
  const isDiscovery = product.kind === "DISCOVERY_SET";
  const href = isDiscovery
    ? "/discovery-set"
    : { pathname: `/products/${product.slug}`, query: formType !== product.forms[0]?.type ? { form: formType.toLowerCase() } : {} };
  const wished = inWishlist(product.id);
  const off = variant ? discountPercent(variant.price, variant.mrp) : 0;
  const soldOut = !variant || variant.stock <= 0;

  return (
    <article
      className={cn(
        "group/card relative flex h-full flex-col overflow-hidden rounded-lg border border-hairline bg-surface transition-[box-shadow,transform] duration-500 ease-(--ease-luxe) hover:-translate-y-0.5 hover:shadow-[0_22px_44px_-24px_rgba(28,21,16,0.45)]",
        className,
      )}
    >
      <div className="relative">
        <Link href={href} className="relative block aspect-[5/6] overflow-hidden bg-ebony" aria-label={product.name}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={formType}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <ProductVisual
                form={form?.type ?? "PERFUME"}
                kind={product.kind}
                image={form?.image}
                name={product.name}
                color={product.accentColor}
                shape={product.bottleShape}
                priority={priority}
                sizes="(min-width: 1280px) 16vw, (min-width: 768px) 30vw, 48vw"
                className="transition-transform duration-[1.2s] ease-(--ease-luxe) group-hover/card:scale-[1.05]"
              />
            </motion.div>
          </AnimatePresence>
          {form?.hoverImage ? (
            <div className="absolute inset-0 opacity-0 transition-opacity duration-700 group-hover/card:opacity-100 max-md:hidden">
              <Image src={form.hoverImage} alt="" fill sizes="(min-width: 1280px) 16vw, 30vw" className="object-cover" />
            </div>
          ) : null}
        </Link>

        <div className="pointer-events-none absolute start-2.5 top-2.5 flex flex-col items-start gap-1">
          {product.isNew ? (
            <span className="rounded-sm bg-gold-metal px-2 py-0.5 text-[0.56rem] font-bold uppercase tracking-[0.14em] text-ink">{t("common.new")}</span>
          ) : product.isBestseller ? (
            <span className="rounded-sm bg-noir/75 px-2 py-0.5 text-[0.56rem] font-bold uppercase tracking-[0.14em] text-gold-light backdrop-blur">{t("common.bestseller")}</span>
          ) : null}
          {off > 0 ? <span className="rounded-sm bg-ruby px-2 py-0.5 text-[0.56rem] font-bold uppercase tracking-[0.12em] text-parchment">−{off}%</span> : null}
        </div>

        <button
          type="button"
          onClick={() => toggleWishlist(product.id, product.name)}
          aria-pressed={wished}
          aria-label={wished ? t("common.removeFromWishlist") : t("common.addToWishlist")}
          className="absolute end-2.5 top-2.5 grid size-8 place-items-center rounded-full bg-white/90 text-ink shadow-sm transition-transform hover:scale-110"
        >
          <Heart className={cn("size-3.5", wished && "fill-ruby text-ruby")} strokeWidth={1.75} />
        </button>

        {onQuickView && !isDiscovery ? (
          <button
            type="button"
            onClick={() => onQuickView(product, formType)}
            className="absolute inset-x-3 bottom-3 flex translate-y-2 items-center justify-center gap-1.5 rounded-md bg-white/92 py-2 text-[0.6rem] font-bold uppercase tracking-[0.16em] text-ink opacity-0 shadow transition-all duration-500 group-hover/card:translate-y-0 group-hover/card:opacity-100 max-md:hidden"
          >
            <Eye className="size-3.5" strokeWidth={1.75} />
            {t("common.quickView")}
          </button>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <h3 className="font-sans text-[0.86rem] font-semibold leading-snug text-heading">
          <Link href={href} className="-my-1 block truncate py-1 hover:text-accent">
            {product.name}
          </Link>
        </h3>

        {product.rating.count > 0 ? (
          <div className="flex items-center gap-1.5 text-xs text-fg-muted">
            <Stars value={product.rating.avg} size={11} />
            <span className="tabular-nums">({product.rating.count})</span>
          </div>
        ) : (
          <p className="line-clamp-1 text-xs text-fg-muted">{product.tagline}</p>
        )}

        {product.forms.length > 1 ? (
          <FormToggle forms={product.forms.map((f) => f.type)} value={formType} onChange={setFormType} size="xs" className="mt-0.5 w-full" />
        ) : null}

        <div className="mt-auto flex flex-wrap items-baseline justify-between gap-x-2 pt-1">
          {variant ? (
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={variant.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="flex items-baseline gap-1.5 whitespace-nowrap"
              >
                <span className="text-[0.95rem] font-bold tabular-nums text-heading">{formatPrice(variant.price, locale)}</span>
                {off > 0 && variant.mrp ? <s className="text-[0.68rem] tabular-nums text-fg-muted">{formatPrice(variant.mrp, locale)}</s> : null}
              </motion.p>
            </AnimatePresence>
          ) : null}
          {variant ? <span className="whitespace-nowrap text-[0.62rem] uppercase tracking-[0.12em] text-fg-muted">{sizeLabel(variant.label, locale)}</span> : null}
        </div>

        {isDiscovery ? (
          <Link
            href="/discovery-set"
            className="mt-1 flex h-9 items-center justify-center rounded-md bg-btn text-[0.64rem] font-bold uppercase tracking-[0.16em] text-btn-fg transition-opacity hover:opacity-90"
          >
            {t("common.explore")}
          </Link>
        ) : (
          <button
            type="button"
            disabled={soldOut || pending}
            onClick={() => variant && add({ variantId: variant.id, label: product.name })}
            className="mt-1 flex h-9 items-center justify-center gap-1.5 rounded-md bg-btn text-[0.64rem] font-bold uppercase tracking-[0.16em] text-btn-fg transition-opacity hover:opacity-90 disabled:opacity-40"
            aria-label={`${t("common.addToCart")} — ${product.name}`}
          >
            <ShoppingBag className="size-3.5" strokeWidth={1.75} />
            {soldOut ? t("common.soldOut") : t("common.addToCart")}
          </button>
        )}
      </div>
    </article>
  );
}
