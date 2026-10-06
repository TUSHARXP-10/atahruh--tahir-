"use client";

import { Gift, Lock, Minus, Plus, Sparkles, Tag, Trash2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { KhatamStar } from "@/components/brand/ornament";
import { ProductVisual } from "@/components/product/product-visual";
import { useStore } from "@/components/providers/store-provider";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Link } from "@/i18n/navigation";
import { sizeLabel } from "@/lib/format";
import { formatPrice } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { CartLine } from "@/server/cart";

export function CartDrawer() {
  const t = useTranslations();
  const locale = useLocale();
  const { cart, cartOpen, setCartOpen, setGift } = useStore();
  const lines = cart?.lines ?? [];
  const totals = cart?.totals;
  const empty = lines.length === 0;

  return (
    <Sheet open={cartOpen} onOpenChange={setCartOpen}>
      <SheetContent side="end" closeLabel={t("common.close")} className="w-[min(100vw,28rem)]">
        <div className="flex items-baseline gap-3 border-b border-gold/10 px-6 pb-5 pt-6">
          <SheetTitle className="font-display text-3xl text-ivory">{t("cart.title")}</SheetTitle>
          <span className="text-xs uppercase tracking-[0.18em] text-mist">{t("cart.count", { count: totals?.itemCount ?? 0 })}</span>
        </div>

        {empty ? (
          <EmptyCart onClose={() => setCartOpen(false)} />
        ) : (
          <>
            {totals ? <Progress /> : null}
            <ul className="flex-1 divide-y divide-gold/10 overflow-y-auto px-6" data-lenis-prevent>
              <AnimatePresence initial={false}>
                {lines.map((line) => (
                  <motion.li
                    key={line.id}
                    layout
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden py-5"
                  >
                    <Line line={line} />
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>

            <div className="space-y-4 border-t border-gold/15 bg-noir/60 px-6 pb-6 pt-5">
              <label className="flex cursor-pointer items-start gap-3 text-sm text-smoke">
                <input
                  type="checkbox"
                  checked={cart?.giftWrap ?? false}
                  onChange={(e) => setGift(e.target.checked, cart?.giftMessage ?? undefined)}
                  className="mt-0.5 size-4 accent-[#c9a55c]"
                />
                <span className="flex items-center gap-2">
                  <Gift className="size-4 text-gold" strokeWidth={1.25} />
                  {t("cart.giftWrapLabel", { fee: formatPrice(cart?.giftWrapFee ?? 0, locale) })}
                </span>
              </label>
              {cart?.giftWrap ? <GiftMessage /> : null}

              <CouponField />

              {totals ? (
                <dl className="space-y-1.5 text-sm">
                  <Row label={t("cart.subtotal")} value={formatPrice(totals.subtotal, locale)} />
                  {totals.discount > 0 ? (
                    <Row label={t("cart.discount", { code: cart?.couponCode ?? "" })} value={`− ${formatPrice(totals.discount, locale)}`} accent />
                  ) : null}
                  {totals.giftWrapFee > 0 ? <Row label={t("cart.giftWrap")} value={formatPrice(totals.giftWrapFee, locale)} /> : null}
                  <Row
                    label={t("cart.shipping")}
                    value={totals.shippingFee === 0 ? t("cart.shippingFree") : formatPrice(totals.shippingFee, locale)}
                  />
                  <div className="flex items-baseline justify-between border-t border-gold/10 pt-3">
                    <dt className="font-display text-xl text-ivory">{t("cart.total")}</dt>
                    <dd className="font-sans text-xl font-semibold tabular-nums text-gold-light">{formatPrice(totals.total, locale)}</dd>
                  </div>
                  <p className="text-end text-[0.68rem] text-mist">{t("cart.taxIncluded", { amount: formatPrice(totals.taxIncluded, locale) })}</p>
                </dl>
              ) : null}

              <Button asChild size="lg" className="w-full">
                <Link href="/checkout" onClick={() => setCartOpen(false)}>
                  <Lock strokeWidth={1.5} />
                  {t("cart.checkout")}
                </Link>
              </Button>
              <p className="text-center text-[0.65rem] uppercase tracking-[0.16em] text-mist">{t("cart.secureNote")}</p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-smoke">{label}</dt>
      <dd className={cn("tabular-nums text-ivory", accent && "text-gold")}>{value}</dd>
    </div>
  );
}

function Progress() {
  const t = useTranslations("cart");
  const locale = useLocale();
  const { cart } = useStore();
  const totals = cart!.totals;
  const unlocked = totals.freeShippingRemaining === 0;
  return (
    <div className="border-b border-gold/10 px-6 py-4">
      <p className="mb-2.5 flex items-center gap-2 text-xs text-smoke">
        <Sparkles className="size-3.5 text-gold" strokeWidth={1.5} />
        {unlocked
          ? totals.freeSampleEligible
            ? t("sampleUnlocked")
            : t("sampleRemaining", { amount: formatPrice(totals.freeSampleRemaining, locale) })
          : t("freeShippingRemaining", { amount: formatPrice(totals.freeShippingRemaining, locale) })}
      </p>
      <div className="h-1 overflow-hidden rounded-full bg-umber">
        <motion.div
          className="h-full rounded-full bg-gold-metal"
          initial={false}
          animate={{ width: `${(unlocked ? Math.min(1, totals.subtotal / Math.max(1, totals.subtotal + totals.freeSampleRemaining)) : totals.freeShippingProgress) * 100}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

function Line({ line }: { line: CartLine }) {
  const t = useTranslations();
  const locale = useLocale();
  const { update, remove, setCartOpen } = useStore();
  const href = line.kind === "DISCOVERY_SET" ? "/discovery-set" : `/products/${line.slug}${line.formType === "ATTAR" ? "?form=attar" : ""}`;
  return (
    <div className="flex gap-4">
      <Link href={href} onClick={() => setCartOpen(false)} className="relative block h-28 w-22 shrink-0 overflow-hidden rounded-t-full rounded-b-sm border border-gold/15">
        <ProductVisual
          form={line.formType}
          kind={line.kind}
          image={line.image}
          name={line.name}
          color={line.accentColor}
          shape={line.bottleShape}
          colors={line.selections?.map((s) => s.color)}
          plain
          sizes="88px"
        />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link href={href} onClick={() => setCartOpen(false)} className="block truncate font-display text-lg leading-tight text-ivory hover:text-gold-light">
              {line.name}
            </Link>
            <p className="mt-0.5 text-[0.68rem] uppercase tracking-[0.14em] text-mist">
              {t(`forms.${line.formType}`)} · {sizeLabel(line.sizeLabel, locale)}
            </p>
          </div>
          <button type="button" onClick={() => remove(line.id)} className="-me-1 p-1 text-mist transition-colors hover:text-ruby" aria-label={t("cart.remove")}>
            <Trash2 className="size-4" strokeWidth={1.25} />
          </button>
        </div>

        {line.selections ? (
          <ul className="mt-2 flex flex-wrap gap-1">
            {line.selections.map((s) => (
              <li key={s.productId} className="inline-flex items-center gap-1 rounded-full border border-gold/15 px-2 py-0.5 text-[0.62rem] text-smoke">
                <span className="size-1.5 rounded-full" style={{ background: s.color }} />
                {s.name}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-auto flex items-center justify-between pt-3">
          {line.selections ? (
            <span className="text-xs text-mist">× 1</span>
          ) : (
            <div className="inline-flex items-center rounded-full border border-gold/25">
              <button type="button" onClick={() => update(line.id, line.quantity - 1)} className="grid size-8 place-items-center text-smoke hover:text-gold-light" aria-label={t("cart.decrease")}>
                <Minus className="size-3" />
              </button>
              <span className="w-6 text-center text-sm tabular-nums" aria-label={t("cart.quantity")}>{line.quantity}</span>
              <button
                type="button"
                disabled={line.quantity >= Math.min(10, line.stock)}
                onClick={() => update(line.id, line.quantity + 1)}
                className="grid size-8 place-items-center text-smoke hover:text-gold-light disabled:opacity-30"
                aria-label={t("cart.increase")}
              >
                <Plus className="size-3" />
              </button>
            </div>
          )}
          <span className="font-sans text-sm font-semibold tabular-nums text-ivory">{formatPrice(line.unitPrice * line.quantity, locale)}</span>
        </div>
      </div>
    </div>
  );
}

function CouponField() {
  const t = useTranslations("cart");
  const { cart, applyCoupon, removeCoupon, pending } = useStore();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (cart?.couponCode) {
    return (
      <div className="flex items-center justify-between rounded-sm border border-gold/30 bg-gold/5 px-3 py-2 text-sm">
        <span className="flex items-center gap-2 text-gold-light">
          <Tag className="size-4" strokeWidth={1.25} />
          {t("couponApplied", { code: cart.couponCode })}
        </span>
        <button type="button" onClick={() => removeCoupon()} className="p-1 text-mist hover:text-ivory" aria-label={t("removeCoupon")}>
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!code.trim()) return;
        const res = await applyCoupon(code);
        setError(res.ok ? null : t(`errors.${res.error ?? "NOT_FOUND"}`));
        if (res.ok) setCode("");
      }}
    >
      <div className="flex gap-2">
        <label className="sr-only" htmlFor="cart-coupon">{t("coupon")}</label>
        <input
          id="cart-coupon"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder={t("couponPlaceholder")}
          className="h-10 min-w-0 flex-1 rounded-sm border border-gold/25 bg-ebony px-3 text-sm uppercase tracking-wider text-ivory placeholder:normal-case placeholder:tracking-normal placeholder:text-mist focus:border-gold/60 focus:outline-none"
          aria-invalid={!!error}
          aria-describedby={error ? "cart-coupon-error" : undefined}
        />
        <Button type="submit" variant="outline" size="sm" className="h-10" disabled={pending}>
          {t("apply")}
        </Button>
      </div>
      {error ? (
        <p id="cart-coupon-error" className="mt-1.5 text-xs text-[#e48a96]">
          {error}
        </p>
      ) : null}
    </form>
  );
}

function GiftMessage() {
  const t = useTranslations("cart");
  const { cart, setGift } = useStore();
  const [value, setValue] = useState(cart?.giftMessage ?? "");
  return (
    <textarea
      value={value}
      maxLength={240}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => setGift(true, value)}
      placeholder={t("giftMessagePlaceholder")}
      className="h-20 w-full resize-none rounded-sm border border-gold/20 bg-ebony px-3 py-2 font-display text-base italic text-ivory placeholder:text-mist focus:border-gold/50 focus:outline-none"
    />
  );
}

function EmptyCart({ onClose }: { onClose: () => void }) {
  const t = useTranslations("cart");
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-10 text-center">
      <div className="relative mb-8 grid size-28 place-items-center">
        <div className="absolute inset-0 animate-spin-slow rounded-full border border-dashed border-gold/30" />
        <KhatamStar className="size-9 text-gold/70" filled={false} />
      </div>
      <p className="font-display text-3xl text-ivory">{t("empty")}</p>
      <p className="mt-3 text-sm text-smoke">{t("emptyText")}</p>
      <div className="mt-8 flex flex-col gap-3">
        <Button asChild>
          <Link href="/collections/bestsellers" onClick={onClose}>{t("emptyCta")}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/fragrance-quiz" onClick={onClose}>{t("takeQuiz")}</Link>
        </Button>
      </div>
    </div>
  );
}
