"use client";

import { Heart, Minus, Plus, ShoppingBag } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useStore } from "@/components/providers/store-provider";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import { sizeLabel } from "@/lib/format";
import type { CardVariant, FormType, ProductCardData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { BackInStock } from "./back-in-stock";
import { FormToggle } from "./form-toggle";
import { defaultVariant } from "./product-card";

/**
 * Form switch + size chips + price + quantity + add to cart.
 * Shared by the product page and quick view.
 */
export function PurchaseOptions({
  product,
  form: formType,
  onFormChange,
  variantId,
  onVariantChange,
  compact,
}: {
  product: ProductCardData;
  form: FormType;
  onFormChange: (f: FormType) => void;
  variantId?: string;
  onVariantChange?: (v: CardVariant) => void;
  compact?: boolean;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const { add, pending, toggleWishlist, inWishlist } = useStore();
  const [qty, setQty] = useState(1);
  const form = product.forms.find((f) => f.type === formType) ?? product.forms[0];
  const [localVariantId, setLocalVariantId] = useState<string | undefined>(undefined);
  const selectedId = variantId ?? localVariantId;
  const variant = form.variants.find((v) => v.id === selectedId) ?? defaultVariant(form);
  const soldOut = variant.stock <= 0;
  const low = variant.stock > 0 && variant.stock <= 5;
  const wished = inWishlist(product.id);

  const selectVariant = (v: CardVariant) => {
    setLocalVariantId(v.id);
    onVariantChange?.(v);
    setQty(1);
  };

  return (
    <div className="space-y-7">
      {product.forms.length > 1 ? (
        <div>
          <FormToggle
            forms={product.forms.map((f) => f.type)}
            value={form.type}
            onChange={(f) => {
              setLocalVariantId(undefined);
              setQty(1);
              onFormChange(f);
            }}
            size="lg"
            showHints
            className="w-full max-w-md"
          />
        </div>
      ) : null}

      <div>
        <div className="mb-3 flex items-baseline justify-between">
          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-smoke">{t("product.size")}</span>
          {form.concentration ? <span className="text-xs text-gold/80">{form.concentration}</span> : null}
        </div>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("product.size")}>
          {form.variants.map((v) => {
            const active = v.id === variant.id;
            return (
              <button
                key={v.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => selectVariant(v)}
                className={cn(
                  "relative min-w-20 rounded-sm border px-4 py-2.5 text-center transition-colors",
                  active ? "border-gold bg-gold/10 text-gold-pale" : "border-gold/20 text-smoke hover:border-gold/50 hover:text-ivory",
                  v.stock <= 0 && "opacity-50",
                )}
              >
                <span className="block text-sm font-medium">{sizeLabel(v.label, locale)}</span>
                {v.stock <= 0 ? <span className="block text-[0.58rem] uppercase tracking-wider text-mist">{t("common.soldOut")}</span> : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-end justify-between gap-4">
        <div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={variant.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
              <Price price={variant.price} mrp={variant.mrp} locale={locale} size="lg" saveLabel={(p) => t("common.save", { percent: p })} />
            </motion.div>
          </AnimatePresence>
          <p className="mt-1 text-[0.68rem] text-mist">{t("common.taxNote")}</p>
        </div>
        <p className={cn("text-xs", soldOut ? "text-[#e48a96]" : low ? "text-gold" : "text-emerald-300/80")}>
          {soldOut ? t("common.outOfStock") : low ? t("common.onlyLeft", { count: variant.stock }) : t("common.inStock")}
        </p>
      </div>

      {soldOut ? (
        <BackInStock variantId={variant.id} name={product.name} />
      ) : (
        // Narrow phones: quantity + wishlist on one row, a full-width Add to cart below
        <div className="flex flex-wrap gap-3 max-[399px]:justify-between">
          <div className="inline-flex h-13 items-center rounded-sm border border-gold/30">
            <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-full w-11 place-items-center text-smoke hover:text-gold-light" aria-label={t("cart.decrease")}>
              <Minus className="size-3.5" />
            </button>
            <span className="w-8 text-center tabular-nums" aria-live="polite" aria-label={t("product.quantity")}>{qty}</span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(Math.min(10, variant.stock), q + 1))}
              className="grid h-full w-11 place-items-center text-smoke hover:text-gold-light"
              aria-label={t("cart.increase")}
            >
              <Plus className="size-3.5" />
            </button>
          </div>
          <Button
            size="lg"
            className="flex-1 max-[399px]:order-last max-[399px]:basis-full"
            disabled={pending}
            onClick={() => add({ variantId: variant.id, quantity: qty, label: product.name })}
          >
            <ShoppingBag strokeWidth={1.5} />
            {pending ? t("common.adding") : t("common.addToCart")}
          </Button>
          {!compact ? (
            <Button
              variant="outline"
              size="icon"
              className="size-13"
              onClick={() => toggleWishlist(product.id, product.name)}
              aria-pressed={wished}
              aria-label={wished ? t("common.removeFromWishlist") : t("common.addToWishlist")}
            >
              <Heart className={cn(wished && "fill-gold text-gold")} strokeWidth={1.25} />
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}
