"use client";

import { AlertCircle, Banknote, Check, CreditCard, Gift, Lock, ShieldCheck, Zap } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { BottleArt } from "@/components/brand/bottle-art";
import { KhatamStar } from "@/components/brand/ornament";
import { ProductVisual } from "@/components/product/product-visual";
import { useStore } from "@/components/providers/store-provider";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Link, useRouter } from "@/i18n/navigation";
import { deliveryDate, estimateDelivery, INDIAN_STATES, isValidPincode } from "@/lib/delivery";
import { sizeLabel } from "@/lib/format";
import { formatPrice } from "@/lib/money";
import { computeTotals, type CommerceSettings } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import type { CartView } from "@/server/cart";
import { markPaymentFailed, placeOrder } from "@/server/actions/checkout";
import { lookupPincode } from "@/server/actions/delivery";

type Address = { id?: string; name: string; phone: string; line1: string; line2: string; landmark: string; city: string; state: string; pincode: string; isDefault?: boolean };
type Sample = { id: string; name: string; color: string; shape: string };

const EMPTY: Address = { name: "", phone: "", line1: "", line2: "", landmark: "", city: "", state: "", pincode: "" };

type PaytmCheckout = {
  onLoad: (cb: () => void) => void;
  init: (config: Record<string, unknown>) => Promise<void>;
  invoke: () => void;
};

declare global {
  interface Window {
    Paytm?: { CheckoutJS: PaytmCheckout };
  }
}

/** Load Paytm's merchant-specific JS Checkout once and wait until it is ready. */
function loadPaytm(src: string) {
  return new Promise<PaytmCheckout | null>((resolve) => {
    if (window.Paytm?.CheckoutJS) return resolve(window.Paytm.CheckoutJS);
    const timer = window.setTimeout(() => resolve(null), 20_000);
    const s = document.createElement("script");
    s.src = src;
    s.crossOrigin = "anonymous";
    s.onload = () => {
      const checkout = window.Paytm?.CheckoutJS;
      if (!checkout) return resolve(null);
      checkout.onLoad(() => {
        window.clearTimeout(timer);
        resolve(checkout);
      });
    };
    s.onerror = () => {
      window.clearTimeout(timer);
      resolve(null);
    };
    document.body.appendChild(s);
  });
}

export function CheckoutForm({
  initialCart,
  user,
  addresses,
  samples,
  settings,
  onlineEnabled,
  paymentFailed = false,
}: {
  initialCart: CartView;
  user: { name: string; email: string; phone: string } | null;
  addresses: Address[];
  samples: Sample[];
  settings: CommerceSettings;
  onlineEnabled: boolean;
  /** Returned from Paytm without a completed payment */
  paymentFailed?: boolean;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { cart: liveCart, refreshCart } = useStore();
  const cart = liveCart ?? initialCart;

  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];
  const [savedId, setSavedId] = useState<string | null>(defaultAddress?.id ?? null);
  const [email, setEmail] = useState(user?.email ?? "");
  const [address, setAddress] = useState<Address>(defaultAddress ?? { ...EMPTY, name: user?.name ?? "", phone: user?.phone ?? "" });
  const [saveAddress, setSaveAddress] = useState(!!user && !addresses.length);
  const [speed, setSpeed] = useState<"standard" | "express">("standard");
  const [chosenMethod, setMethod] = useState<"ONLINE" | "COD">(onlineEnabled ? "ONLINE" : "COD");
  const [sample, setSample] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [pending, start] = useTransition();
  const [paying, setPaying] = useState(false);

  const est = isValidPincode(address.pincode) ? estimateDelivery(address.pincode) : null;
  const effectiveSpeed = speed === "express" && est?.express ? "express" : "standard";

  const totalsFor = (paymentMethod: "ONLINE" | "COD") =>
    computeTotals({
      lines: cart.lines.map((l) => ({ unitPrice: l.unitPrice, quantity: l.quantity })),
      coupon: cart.coupon,
      giftWrap: cart.giftWrap,
      paymentMethod,
      deliverySpeed: effectiveSpeed,
      settings,
    });
  // Whether COD is allowed doesn't depend on the method chosen (it is checked before the COD fee)
  const chosenTotals = totalsFor(chosenMethod);
  const codAvailable = chosenTotals.codAllowed && (est ? est.cod : true);
  // If COD stops being available (pincode or bag changed), fall back to paying online
  const method = chosenMethod === "COD" && !codAvailable && onlineEnabled ? "ONLINE" : chosenMethod;
  const totals = method === chosenMethod ? chosenTotals : totalsFor(method);

  // Pincode → city/state autofill
  useEffect(() => {
    if (!isValidPincode(address.pincode)) return;
    let alive = true;
    lookupPincode(address.pincode).then((place) => {
      if (!alive || !place) return;
      setAddress((a) => ({
        ...a,
        city: a.city || place.city,
        state: a.state || (INDIAN_STATES.find((s) => s.toLowerCase() === place.state.toLowerCase()) ?? place.state),
      }));
    });
    return () => {
      alive = false;
    };
  }, [address.pincode]);

  const set = (k: keyof Address) => (e: { target: { value: string } }) => {
    setSavedId(null);
    setAddress((a) => ({ ...a, [k]: k === "pincode" ? e.target.value.replace(/\D/g, "").slice(0, 6) : e.target.value }));
    setErrors((errs) => errs.filter((x) => x !== `address.${k}`));
  };
  const invalid = (field: string) => errors.includes(field);

  const submit = () =>
    start(async () => {
      setErrors([]);
      const res = await placeOrder({
        email,
        address: { name: address.name, phone: address.phone, line1: address.line1, line2: address.line2, landmark: address.landmark, city: address.city, state: address.state, pincode: address.pincode },
        saveAddress: !!user && !savedId && saveAddress,
        deliverySpeed: effectiveSpeed,
        paymentMethod: method,
        freeSampleProductId: totals.freeSampleEligible ? sample : null,
        locale,
      });

      if (!res.ok) {
        if (res.fields) setErrors(res.fields);
        toast.error(t(`checkout.errors.${res.error}`));
        if (res.error === "OUT_OF_STOCK" || res.error === "EMPTY") void refreshCart();
        return;
      }

      if (res.mode === "cod") {
        await refreshCart();
        router.push(`/orders/${res.number}?placed=1`);
        return;
      }

      // Paytm — on success Paytm posts to /api/paytm/callback, which settles the order and redirects
      setPaying(true);
      const checkout = await loadPaytm(res.paytm.scriptUrl);
      if (!checkout) {
        setPaying(false);
        toast.error(t("checkout.errors.GENERIC"));
        return;
      }
      try {
        await checkout.init({
          root: "",
          flow: "DEFAULT",
          data: { orderId: res.paytm.orderId, token: res.paytm.txnToken, tokenType: "TXN_TOKEN", amount: res.paytm.amount },
          merchant: { name: "Aayat al-Ruh", redirect: true },
          handler: {
            notifyMerchant: (event: string) => {
              if (event !== "APP_CLOSED") return;
              setPaying(false);
              void markPaymentFailed({ orderNumber: res.paytm.orderId, reason: "checkout closed" });
              toast(t("checkout.errors.PAYMENT_FAILED"));
            },
          },
        });
        checkout.invoke();
      } catch (e) {
        console.error("[paytm]", e);
        setPaying(false);
        toast.error(t("checkout.errors.GENERIC"));
      }
    });

  if (!cart.lines.length) {
    return (
      <div className="grid place-items-center rounded-sm border border-dashed border-gold/20 py-24 text-center">
        <KhatamStar className="mb-6 size-8 text-gold/60" filled={false} />
        <p className="font-display text-3xl text-ivory">{t("checkout.empty")}</p>
        <Button asChild className="mt-8">
          <Link href="/shop">{t("checkout.continueShopping")}</Link>
        </Button>
      </div>
    );
  }

  const busy = pending || paying;

  return (
    <form
      className="grid grid-cols-1 gap-10 lg:grid-cols-12"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      noValidate
    >
      <div className="min-w-0 space-y-6 lg:col-span-7">
        {paymentFailed ? (
          <p role="alert" className="flex items-start gap-3 rounded-sm border border-ruby/40 bg-ruby/10 px-4 py-3 text-sm text-ivory">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-[#e48a96]" strokeWidth={1.75} />
            {t("checkout.paymentFailedNotice")}
          </p>
        ) : null}
        {/* 1 · Contact */}
        <Step n={1} title={t("checkout.contact")}>
          {!user ? (
            <p className="mb-5 text-sm text-mist">
              {t("checkout.signInPrompt")}{" "}
              <Link href={{ pathname: "/login", query: { next: "/checkout" } }} className="text-gold underline-offset-4 hover:underline">
                {t("checkout.signInLink")}
              </Link>
            </p>
          ) : null}
          <Field label={t("checkout.email")} id="email" invalid={invalid("email")}>
            <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={invalid("email")} />
          </Field>
        </Step>

        {/* 2 · Address */}
        <Step n={2} title={t("checkout.shipping")}>
          {addresses.length ? (
            <div className="mb-6">
              <p className="mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-smoke">{t("checkout.savedAddresses")}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {addresses.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => {
                      setSavedId(a.id!);
                      setAddress(a);
                    }}
                    className={cn("rounded-sm border p-4 text-start text-sm transition-colors", savedId === a.id ? "border-gold bg-gold/5" : "border-gold/15 hover:border-gold/40")}
                  >
                    <p className="font-semibold text-ivory">{a.name}</p>
                    <p className="mt-1 text-xs leading-relaxed text-smoke">
                      {a.line1}, {a.line2 && `${a.line2}, `}
                      {a.city} {a.pincode}
                    </p>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setSavedId(null);
                    setAddress({ ...EMPTY, name: user?.name ?? "", phone: user?.phone ?? "" });
                  }}
                  className={cn("rounded-sm border border-dashed p-4 text-sm text-gold", !savedId ? "border-gold" : "border-gold/25 hover:border-gold/50")}
                >
                  + {t("checkout.newAddress")}
                </button>
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("checkout.fullName")} id="name" invalid={invalid("address.name")}>
              <Input id="name" autoComplete="name" value={address.name} onChange={set("name")} aria-invalid={invalid("address.name")} />
            </Field>
            <Field label={t("checkout.phone")} id="phone" invalid={invalid("address.phone")} hint={t("checkout.phoneHint")}>
              <Input id="phone" type="tel" inputMode="tel" autoComplete="tel" value={address.phone} onChange={set("phone")} aria-invalid={invalid("address.phone")} dir="ltr" />
            </Field>
            <Field label={t("checkout.line1")} id="line1" invalid={invalid("address.line1")} className="sm:col-span-2">
              <Input id="line1" autoComplete="address-line1" value={address.line1} onChange={set("line1")} aria-invalid={invalid("address.line1")} />
            </Field>
            <Field label={t("checkout.line2")} id="line2" className="sm:col-span-2">
              <Input id="line2" autoComplete="address-line2" value={address.line2} onChange={set("line2")} />
            </Field>
            <Field label={t("checkout.pincode")} id="pincode" invalid={invalid("address.pincode")}>
              <Input id="pincode" inputMode="numeric" autoComplete="postal-code" value={address.pincode} onChange={set("pincode")} aria-invalid={invalid("address.pincode")} dir="ltr" className="tracking-[0.2em]" />
            </Field>
            <Field label={t("checkout.landmark")} id="landmark">
              <Input id="landmark" value={address.landmark} onChange={set("landmark")} />
            </Field>
            <Field label={t("checkout.city")} id="city" invalid={invalid("address.city")}>
              <Input id="city" autoComplete="address-level2" value={address.city} onChange={set("city")} aria-invalid={invalid("address.city")} />
            </Field>
            <Field label={t("checkout.state")} id="state" invalid={invalid("address.state")}>
              <select
                id="state"
                value={address.state}
                onChange={set("state")}
                aria-invalid={invalid("address.state")}
                className="h-12 w-full rounded-sm border border-gold/25 bg-ebony/70 px-4 text-sm text-ivory focus:border-gold/70 focus:outline-none aria-invalid:border-ruby"
              >
                <option value="">{t("checkout.selectState")}</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          {user && !savedId ? (
            <label className="mt-5 flex items-center gap-3 text-sm text-smoke">
              <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="size-4 accent-[#c9a55c]" />
              {t("checkout.saveAddress")}
            </label>
          ) : null}
        </Step>

        {/* 3 · Delivery */}
        <Step n={3} title={t("checkout.delivery")}>
          {est ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Choice
                active={effectiveSpeed === "standard"}
                onClick={() => setSpeed("standard")}
                title={t("checkout.standard")}
                text={t("checkout.standardText", { min: est.minDays, max: est.maxDays })}
                right={totals.subtotal >= settings.freeShippingThreshold ? t("cart.shippingFree") : formatPrice(settings.standardShippingFee, locale)}
              />
              <Choice
                active={effectiveSpeed === "express"}
                disabled={!est.express}
                onClick={() => setSpeed("express")}
                title={t("checkout.express")}
                icon={<Zap className="size-3.5" />}
                text={!est.express ? t("checkout.expressUnavailable") : est.maxDays - 2 <= 1 ? t("checkout.expressNextDay") : t("checkout.expressText", { min: Math.max(1, est.minDays - 1), max: est.maxDays - 2 })}
                right={formatPrice(totals.subtotal >= settings.freeShippingThreshold ? settings.expressShippingFee - settings.standardShippingFee : settings.expressShippingFee, locale)}
              />
              <p className="text-xs text-mist sm:col-span-2">
                {t("product.deliveryBy", {
                  date: new Intl.DateTimeFormat(locale === "ar" ? "ar-u-nu-latn" : "en-IN", { weekday: "short", day: "numeric", month: "short" }).format(
                    deliveryDate(effectiveSpeed === "express" ? Math.max(1, est.maxDays - 2) : est.maxDays),
                  ),
                })}
              </p>
            </div>
          ) : (
            <p className="text-sm text-mist">{t("checkout.enterPincodeFirst")}</p>
          )}
        </Step>

        {/* Complimentary sample */}
        {totals.freeSampleEligible && samples.length ? (
          <Step n="✦" title={t("checkout.freeSampleTitle")}>
            <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
              {samples.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSample(sample === s.id ? null : s.id)}
                  aria-pressed={sample === s.id}
                  className={cn("w-24 shrink-0 rounded-sm border p-2 text-center transition-colors", sample === s.id ? "border-gold bg-gold/10" : "border-gold/15 hover:border-gold/40")}
                >
                  <div className="mx-auto h-16 w-10">
                    <BottleArt form="ATTAR" color={s.color} plain />
                  </div>
                  <p className="mt-1 truncate text-[0.7rem] text-ivory">{s.name}</p>
                </button>
              ))}
            </div>
          </Step>
        ) : null}

        {/* 4 · Payment */}
        <Step n={4} title={t("checkout.payment")}>
          <div className="grid gap-3">
            {onlineEnabled ? (
              <Choice
                active={method === "ONLINE"}
                onClick={() => setMethod("ONLINE")}
                title={t("checkout.online")}
                icon={<CreditCard className="size-3.5" />}
                text={t("checkout.onlineText")}
                right={<span className="flex gap-1">{["Paytm", "UPI", "Cards"].map((x) => <span key={x} className="rounded-sm border border-gold/20 px-1.5 py-0.5 text-[0.55rem] text-smoke">{x}</span>)}</span>}
              />
            ) : (
              <p className="rounded-sm border border-gold/15 bg-gold/5 px-4 py-3 text-xs text-smoke">{t("checkout.onlineUnavailable")}</p>
            )}
            <Choice
              active={method === "COD"}
              disabled={!codAvailable}
              onClick={() => setMethod("COD")}
              title={t("checkout.cod")}
              icon={<Banknote className="size-3.5" />}
              text={codAvailable ? t("checkout.codText", { fee: formatPrice(settings.codFee, locale) }) : t("checkout.codUnavailable")}
            />
          </div>
        </Step>
      </div>

      {/* Summary */}
      <aside className="min-w-0 lg:col-span-5">
        <div className="sticky top-24 rounded-sm border border-gold/15 bg-ebony/70 p-6 sm:p-8">
          <div className="mb-6 flex items-baseline justify-between">
            <h2 className="font-display text-3xl text-ivory">{t("checkout.summary")}</h2>
            <Link href="/shop" className="text-xs text-gold hover:text-gold-light">
              {t("checkout.editCart")}
            </Link>
          </div>
          <ul className="max-h-80 space-y-4 overflow-y-auto pe-1" data-lenis-prevent>
            {cart.lines.map((l) => (
              <li key={l.id} className="flex items-center gap-4">
                <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-t-full border border-gold/15">
                  <ProductVisual form={l.formType} kind={l.kind} image={l.image} name={l.name} color={l.accentColor} shape={l.bottleShape} colors={l.selections?.map((s) => s.color)} plain sizes="48px" />
                  <span className="absolute -end-0 -top-0 grid size-5 place-items-center rounded-full bg-gold text-[0.6rem] font-bold text-ink">{l.quantity}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-lg leading-tight text-ivory">{l.name}</p>
                  <p className="text-[0.68rem] uppercase tracking-[0.14em] text-mist">
                    {t(`forms.${l.formType}`)} · {sizeLabel(l.sizeLabel, locale)}
                  </p>
                </div>
                <span className="text-sm tabular-nums text-ivory">{formatPrice(l.unitPrice * l.quantity, locale)}</span>
              </li>
            ))}
          </ul>
          {cart.giftWrap ? (
            <p className="mt-4 flex items-center gap-2 text-xs text-gold-light">
              <Gift className="size-3.5" /> {t("checkout.giftNote")}
            </p>
          ) : null}

          <dl className="mt-6 space-y-2 border-t border-gold/10 pt-5 text-sm">
            <Row label={t("cart.subtotal")} value={formatPrice(totals.subtotal, locale)} />
            {totals.discount ? <Row label={t("cart.discount", { code: cart.couponCode ?? "" })} value={`− ${formatPrice(totals.discount, locale)}`} accent /> : null}
            <Row label={t("cart.shipping")} value={totals.shippingFee ? formatPrice(totals.shippingFee, locale) : t("cart.shippingFree")} />
            {totals.giftWrapFee ? <Row label={t("cart.giftWrap")} value={formatPrice(totals.giftWrapFee, locale)} /> : null}
            {totals.codFee ? <Row label={t("cart.codFee")} value={formatPrice(totals.codFee, locale)} /> : null}
            <div className="flex items-baseline justify-between border-t border-gold/10 pt-4">
              <dt className="font-display text-2xl text-ivory">{t("cart.total")}</dt>
              <dd className="text-2xl font-semibold tabular-nums text-gold-light">{formatPrice(totals.total, locale)}</dd>
            </div>
            <p className="text-end text-[0.68rem] text-mist">{t("cart.taxIncluded", { amount: formatPrice(totals.taxIncluded, locale) })}</p>
          </dl>

          <Button type="submit" size="lg" className="mt-6 w-full" disabled={busy}>
            <Lock strokeWidth={1.5} />
            {busy ? t("checkout.processing") : method === "ONLINE" ? t("checkout.pay", { total: formatPrice(totals.total, locale) }) : t("checkout.placeOrder", { total: formatPrice(totals.total, locale) })}
          </Button>
          <p className="mt-4 flex items-start gap-2 text-[0.68rem] leading-relaxed text-mist">
            <ShieldCheck className="mt-px size-3.5 shrink-0 text-gold" /> {t("checkout.agree")}
          </p>
        </div>
      </aside>
    </form>
  );
}

function Step({ n, title, children }: { n: number | string; title: string; children: ReactNode }) {
  return (
    <section className="rounded-sm border border-gold/15 p-6 sm:p-8">
      <h2 className="mb-6 flex items-center gap-3 font-display text-2xl text-ivory">
        <span className="relative grid size-8 place-items-center text-sm text-gold">
          <KhatamStar className="absolute inset-0 size-8 opacity-20" />
          <span className="relative font-sans font-semibold">{n}</span>
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({ label, id, children, invalid, hint, className }: { label: string; id: string; children: ReactNode; invalid?: boolean; hint?: string; className?: string }) {
  return (
    <div className={className}>
      <Label htmlFor={id} className={invalid ? "text-[#e48a96]" : undefined}>
        {label}
      </Label>
      {children}
      {hint ? <p className="mt-1.5 text-[0.68rem] text-mist">{hint}</p> : null}
    </div>
  );
}

function Choice({
  active,
  disabled,
  onClick,
  title,
  text,
  right,
  icon,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  text: string;
  right?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex items-start gap-3 rounded-sm border p-4 text-start transition-colors disabled:cursor-not-allowed disabled:opacity-45",
        active ? "border-gold bg-gold/5" : "border-gold/15 hover:border-gold/40",
      )}
    >
      <span className={cn("mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border", active ? "border-gold bg-gold text-ink" : "border-gold/40")}>
        {active ? <Check className="size-2.5" strokeWidth={4} /> : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-ivory">
          {icon}
          {title}
        </span>
        <span className="mt-0.5 block text-xs text-mist">{text}</span>
      </span>
      {right ? <span className="shrink-0 text-sm tabular-nums text-smoke">{right}</span> : null}
    </button>
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
