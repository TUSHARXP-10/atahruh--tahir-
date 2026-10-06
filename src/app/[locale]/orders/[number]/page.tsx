import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Clock } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { OrderDetail } from "@/components/account/order-detail";
import { TrackEvent } from "@/components/analytics/track-event";
import { PlacedHero } from "@/components/checkout/placed-hero";
import { WhatsAppHandoff } from "@/components/checkout/whatsapp-handoff";
import { Container } from "@/components/ui/container";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/money";
import { paytmEnabled } from "@/lib/paytm";
import { site } from "@/lib/site";
import { hasOrderAccess } from "@/server/orders";
import { reconcilePaytmOrder } from "@/server/payments";
import { getSettings } from "@/server/queries/content";
import { getSessionUser } from "@/server/session";

export const metadata: Metadata = { title: "Order", robots: { index: false } };

export default async function OrderPage({ params, searchParams }: PageProps<"/[locale]/orders/[number]">) {
  const { locale, number } = await params;
  setRequestLocale(locale);
  const [sp, user, settings, t] = await Promise.all([searchParams, getSessionUser(), getSettings(), getTranslations("checkout")]);
  const tOrders = await getTranslations("orders");

  const load = () =>
    db.order.findUnique({
      where: { number: decodeURIComponent(number) },
      include: { items: true, events: { orderBy: { createdAt: "asc" } } },
    });
  let order = await load();
  if (!order) notFound();
  const allowed = (user && order.userId === user.id) || (user as { role?: string } | null)?.role === "admin" || (await hasOrderAccess(order.id));
  if (!allowed) notFound();

  // An online payment still awaiting confirmation: ask Paytm again on each visit
  if (order.paymentMethod === "ONLINE" && order.paymentStatus === "PENDING" && order.gatewayOrderId && order.status !== "CANCELLED" && paytmEnabled()) {
    const outcome = await reconcilePaytmOrder(order.gatewayOrderId).catch(() => null);
    if (outcome && outcome.result !== "PENDING") order = (await load()) ?? order;
  }
  const awaitingPayment = order.paymentMethod === "ONLINE" && order.paymentStatus === "PENDING" && order.status !== "CANCELLED";

  // Hand the order to the team on WhatsApp once it is confirmed (COD, or paid online)
  const confirmed = order.status !== "CANCELLED" && (order.paymentMethod === "COD" || order.paymentStatus === "PAID");
  let whatsappUrl: string | null = null;
  if (sp.placed && confirmed) {
    const [tw, tf] = await Promise.all([getTranslations("checkout.whatsapp"), getTranslations("forms")]);
    const a = order.shippingAddress as { name?: string; city?: string; state?: string; pincode?: string };
    const lines = [
      tw("msgIntro", { number: order.number }),
      "",
      ...order.items.map((i) => `• ${i.quantity} × ${i.name} — ${tf(i.formType)} ${i.sizeLabel}`),
      "",
      tw("msgTotal", { total: formatPrice(order.total, locale), method: order.paymentMethod === "COD" ? tw("methodCod") : tw("methodOnline") }),
      tw("msgName", { name: a.name ?? "" }),
      tw("msgDeliver", { place: [a.city, a.state].filter(Boolean).join(", ") + (a.pincode ? ` ${a.pincode}` : "") }),
      tw("msgLink", { url: `${site.url}${locale === "ar" ? "/ar" : ""}/orders/${order.number}` }),
    ];
    whatsappUrl = `https://wa.me/${settings.contact.whatsapp}?text=${encodeURIComponent(lines.join("\n"))}`;
  }

  const name = (order.shippingAddress as { name?: string }).name?.split(" ")[0] ?? "";

  return (
    <Container className="py-12 lg:py-16">
      {awaitingPayment && sp.payment === "pending" ? (
        <p role="status" className="mb-8 flex items-start gap-3 rounded-sm border border-gold/30 bg-gold/10 px-5 py-4 text-sm text-ivory">
          <Clock className="mt-0.5 size-4 shrink-0 text-gold" strokeWidth={1.75} />
          {tOrders("pendingNotice")}
        </p>
      ) : null}
      {sp.placed ? (
        <>
        {/* First thing the customer sees: the WhatsApp hand-off, then the celebration */}
        {whatsappUrl ? <WhatsAppHandoff url={whatsappUrl} number={order.number} /> : null}
        {confirmed ? (
          <TrackEvent
            event="purchase"
            onceKey={`aar-purchase-${order.number}`}
            data={{
              transactionId: order.number,
              value: order.total,
              items: order.items.map((i) => ({ id: i.productId ?? i.name, name: i.name, variant: `${i.formType} ${i.sizeLabel}`, price: i.unitPrice, quantity: i.quantity })),
            }}
          />
        ) : null}
        <PlacedHero
          title={t("successTitle", { name })}
          text={t("successText", { number: order.number, email: order.email })}
          cod={order.paymentMethod === "COD" ? t("successCod", { amount: formatPrice(order.total, locale) }) : null}
          next={[t("next1"), t("next2"), t("next3")]}
          nextTitle={t("whatsNext")}
        />
        </>
      ) : null}
      <OrderDetail order={order} locale={locale} whatsapp={settings.contact.whatsapp} />
    </Container>
  );
}
