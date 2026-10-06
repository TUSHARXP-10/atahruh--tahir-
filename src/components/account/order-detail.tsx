import { Check, ExternalLink, MessageCircle, Package } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import { KhatamStar, Ornament } from "@/components/brand/ornament";
import { ProductVisual } from "@/components/product/product-visual";
import { sizeLabel } from "@/lib/format";
import { formatPrice } from "@/lib/money";
import type { FormType } from "@/lib/types";
import { cn } from "@/lib/utils";

const FLOW = ["CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"] as const;

export type OrderView = {
  number: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: Date;
  email: string;
  subtotal: number;
  discount: number;
  shippingFee: number;
  codFee: number;
  giftWrapFee: number;
  total: number;
  taxIncluded: number;
  couponCode: string | null;
  giftMessage: string | null;
  courier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  shippingAddress: unknown;
  items: { id: string; name: string; productSlug: string; formType: string; sizeLabel: string; quantity: number; total: number; accentColor: string | null; imageUrl: string | null; selections: unknown }[];
  events: { id: string; status: string | null; message: string; createdAt: Date; internal: boolean }[];
};

export async function OrderDetail({ order, locale, whatsapp }: { order: OrderView; locale: string; whatsapp: string }) {
  const [t, format] = await Promise.all([getTranslations(), getFormatter()]);
  const a = order.shippingAddress as Record<string, string>;
  const stepIndex = FLOW.indexOf(order.status as (typeof FLOW)[number]);
  const halted = ["CANCELLED", "RETURNED", "REFUNDED"].includes(order.status);
  const date = (d: Date) => format.dateTime(new Date(d), { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

  return (
    <div className="grid gap-8 grid-cols-1 lg:grid-cols-12">
      <div className="space-y-8 lg:col-span-7">
        {/* Status */}
        <section className="rounded-sm border border-gold/15 p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="eyebrow text-[0.6rem]">{t("account.order", { number: "" }).trim()}</p>
              <p className="mt-1 font-display text-3xl text-ivory" dir="ltr">{order.number}</p>
              <p className="mt-1 text-xs text-mist">{t("account.placedOn", { date: date(order.createdAt) })}</p>
            </div>
            <div className="flex flex-col items-end gap-1.5 text-end">
              <span className={cn("rounded-full px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.16em]", halted ? "bg-ruby/20 text-[#e48a96]" : "bg-gold/15 text-gold-light")}>
                {t(`orders.status.${order.status}`)}
              </span>
              <span className="text-xs text-mist">
                {t(`orders.method.${order.paymentMethod}`)} · {t(`orders.payment.${order.paymentStatus}`)}
              </span>
            </div>
          </div>

          {!halted ? (
            <ol className="mt-8 grid grid-cols-5 gap-1" aria-label={t("orders.timeline")}>
              {FLOW.map((s, i) => {
                const done = stepIndex >= i;
                return (
                  <li key={s} className="flex flex-col items-center gap-2 text-center">
                    <span className={cn("relative grid size-9 place-items-center rounded-full border transition-colors", done ? "border-gold bg-gold text-ink" : "border-gold/25 text-mist")}>
                      {done ? <Check className="size-4" strokeWidth={2.5} /> : <span className="text-xs">{i + 1}</span>}
                    </span>
                    <span className={cn("text-[0.62rem] leading-tight", done ? "text-ivory" : "text-mist")}>{t(`orders.status.${s}`)}</span>
                  </li>
                );
              })}
            </ol>
          ) : null}

          {order.trackingNumber ? (
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-sm bg-gold/5 p-4 text-sm">
              <div>
                <p className="text-mist">
                  {t("orders.courier")}: <span className="text-ivory">{order.courier ?? "—"}</span>
                </p>
                <p className="text-mist">
                  {t("orders.tracking")}: <span className="font-semibold tracking-wider text-gold-light" dir="ltr">{order.trackingNumber}</span>
                </p>
              </div>
              {order.trackingUrl ? (
                <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-gold hover:text-gold-light">
                  {t("orders.trackShipment")} <ExternalLink className="size-3.5" />
                </a>
              ) : null}
            </div>
          ) : null}

          <ul className="mt-8 space-y-4 border-t border-gold/10 pt-6">
            {order.events
              .filter((e) => !e.internal)
              .map((e) => (
                <li key={e.id} className="flex gap-3 text-sm">
                  <KhatamStar className="mt-1 size-2.5 shrink-0 text-gold/70" />
                  <div>
                    <p className="text-ivory">{e.status ? t(`orders.status.${e.status}`) : e.message === "Order placed" ? t("orders.placed") : e.message}</p>
                    <p className="text-[0.68rem] text-mist">{date(e.createdAt)}</p>
                  </div>
                </li>
              ))}
          </ul>
        </section>

        {/* Items */}
        <section className="rounded-sm border border-gold/15 p-6 sm:p-8">
          <h2 className="mb-5 flex items-center gap-2 font-display text-2xl text-ivory">
            <Package className="size-5 text-gold" strokeWidth={1.25} /> {t("orders.items")}
          </h2>
          <ul className="divide-y divide-gold/10">
            {order.items.map((i) => (
              <li key={i.id} className="flex items-center gap-4 py-4">
                <div className="relative h-20 w-15 shrink-0 overflow-hidden rounded-t-full border border-gold/15">
                  <ProductVisual
                    form={i.formType as FormType}
                    kind={i.productSlug === "discovery-set" ? "DISCOVERY_SET" : undefined}
                    image={null}
                    name={i.name}
                    color={i.accentColor ?? "#c9a55c"}
                    plain
                    sizes="60px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-xl text-ivory">{i.name}</p>
                  <p className="text-[0.68rem] uppercase tracking-[0.14em] text-mist">
                    {t(`forms.${i.formType}`)} · {sizeLabel(i.sizeLabel, locale)} × {i.quantity}
                  </p>
                  {Array.isArray(i.selections) ? (
                    <p className="mt-1 text-xs text-smoke">{(i.selections as { name: string }[]).map((s) => s.name).join(" · ")}</p>
                  ) : null}
                </div>
                <span className="text-sm tabular-nums text-ivory">{i.total ? formatPrice(i.total, locale) : "—"}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <aside className="space-y-6 lg:col-span-5">
        <section className="rounded-sm border border-gold/15 p-6">
          <div className="mb-3 flex items-center gap-2">
            <Ornament className="w-6" />
            <span className="eyebrow text-[0.6rem]">{t("orders.shipTo")}</span>
          </div>
          <address className="text-sm not-italic leading-relaxed text-smoke">
            <span className="text-ivory">{a.name}</span>
            <br />
            {a.line1}
            {a.line2 ? <>, {a.line2}</> : null}
            {a.landmark ? <><br />{a.landmark}</> : null}
            <br />
            {a.city}, {a.state} <span dir="ltr">{a.pincode}</span>
            <br />
            <span dir="ltr">{a.phone}</span>
          </address>
          {order.giftMessage ? <p className="mt-4 border-s-2 border-gold/40 ps-3 font-display text-lg italic text-gold-light">“{order.giftMessage}”</p> : null}
        </section>

        <section className="rounded-sm border border-gold/15 p-6">
          <div className="mb-3 flex items-center gap-2">
            <Ornament className="w-6" />
            <span className="eyebrow text-[0.6rem]">{t("orders.totals")}</span>
          </div>
          <dl className="space-y-2 text-sm">
            <Row label={t("cart.subtotal")} value={formatPrice(order.subtotal, locale)} />
            {order.discount ? <Row label={t("cart.discount", { code: order.couponCode ?? "" })} value={`− ${formatPrice(order.discount, locale)}`} /> : null}
            <Row label={t("cart.shipping")} value={order.shippingFee ? formatPrice(order.shippingFee, locale) : t("cart.shippingFree")} />
            {order.giftWrapFee ? <Row label={t("cart.giftWrap")} value={formatPrice(order.giftWrapFee, locale)} /> : null}
            {order.codFee ? <Row label={t("cart.codFee")} value={formatPrice(order.codFee, locale)} /> : null}
            <div className="flex items-baseline justify-between border-t border-gold/10 pt-3">
              <dt className="font-display text-xl text-ivory">{t("cart.total")}</dt>
              <dd className="text-xl font-semibold tabular-nums text-gold-light">{formatPrice(order.total, locale)}</dd>
            </div>
            <p className="text-end text-[0.68rem] text-mist">{t("cart.taxIncluded", { amount: formatPrice(order.taxIncluded, locale) })}</p>
          </dl>
        </section>

        <a
          href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hello, I need help with order ${order.number}`)}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between rounded-sm border border-gold/15 p-5 text-sm text-smoke transition-colors hover:border-gold/40"
        >
          <span>{t("orders.needHelp")}</span>
          <span className="flex items-center gap-2 text-gold">
            <MessageCircle className="size-4" /> {t("orders.whatsappUs")}
          </span>
        </a>
      </aside>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-smoke">{label}</dt>
      <dd className="tabular-nums text-ivory">{value}</dd>
    </div>
  );
}
