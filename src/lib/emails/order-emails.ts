import "server-only";
import { emailLayout, sendEmail } from "../email";
import { formatPrice } from "../money";
import { site } from "../site";

type OrderForEmail = {
  number: string;
  email: string;
  locale: string;
  paymentMethod: string;
  total: number;
  subtotal: number;
  discount: number;
  shippingFee: number;
  codFee: number;
  giftWrapFee: number;
  shippingAddress: unknown;
  items: { name: string; formType: string; sizeLabel: string; quantity: number; total: number }[];
  courier?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
};

const FORM_AR: Record<string, string> = { PERFUME: "عطر", ATTAR: "عطر زيتي", OIL: "زيت علاجي", SET: "طقم" };

function rows(o: OrderForEmail) {
  const l = o.locale;
  return o.items
    .map(
      (i) => `<tr>
<td style="padding:10px 0;border-bottom:1px solid #2a1f16;color:#f4ecdd">${i.name}<br><span style="color:#8a7f70;font-size:12px">${l === "ar" ? FORM_AR[i.formType] ?? i.formType : i.formType.toLowerCase()} · ${i.sizeLabel} × ${i.quantity}</span></td>
<td style="padding:10px 0;border-bottom:1px solid #2a1f16;text-align:${l === "ar" ? "left" : "right"};color:#e8cd92">${formatPrice(i.total, l)}</td></tr>`,
    )
    .join("");
}

function totals(o: OrderForEmail) {
  const l = o.locale;
  const ar = l === "ar";
  const line = (label: string, value: string, strong = false) =>
    `<tr><td style="padding:4px 0;color:${strong ? "#f4ecdd" : "#b8ad9b"}">${label}</td><td style="padding:4px 0;text-align:${ar ? "left" : "right"};color:${strong ? "#e8cd92" : "#e7d9c0"};${strong ? "font-size:18px" : ""}">${value}</td></tr>`;
  return [
    line(ar ? "المجموع الفرعي" : "Subtotal", formatPrice(o.subtotal, l)),
    o.discount ? line(ar ? "الخصم" : "Discount", `− ${formatPrice(o.discount, l)}`) : "",
    line(ar ? "الشحن" : "Shipping", o.shippingFee ? formatPrice(o.shippingFee, l) : ar ? "مجاني" : "Free"),
    o.giftWrapFee ? line(ar ? "تغليف هدية" : "Gift wrap", formatPrice(o.giftWrapFee, l)) : "",
    o.codFee ? line(ar ? "رسوم الدفع عند الاستلام" : "COD fee", formatPrice(o.codFee, l)) : "",
    line(ar ? "الإجمالي" : "Total", formatPrice(o.total, l), true),
  ].join("");
}

function address(o: OrderForEmail) {
  const a = o.shippingAddress as Record<string, string>;
  return [a.name, a.line1, a.line2, a.landmark, `${a.city}, ${a.state} ${a.pincode}`, a.phone].filter(Boolean).join("<br>");
}

export async function sendOrderConfirmation(o: OrderForEmail) {
  const ar = o.locale === "ar";
  const url = `${site.url}${ar ? "/ar" : ""}/track-order?number=${o.number}`;
  const body = `<div ${ar ? 'dir="rtl" style="text-align:right"' : ""}>
<p style="font-family:Georgia,serif;font-size:24px;color:#f4ecdd;margin:0 0 6px">${ar ? "شكراً لطلبك" : "Thank you for your order"}</p>
<p style="color:#b8ad9b;margin:0 0 22px">${ar ? `تم تأكيد طلبك <strong style="color:#e8cd92">${o.number}</strong>. سنغلّفه يدوياً ونرسل لك تفاصيل التتبع قريباً.` : `Your order <strong style="color:#e8cd92">${o.number}</strong> is confirmed. We will hand-pack it and send tracking details soon.`}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows(o)}</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px">${totals(o)}</table>
<p style="margin:22px 0 4px;color:#c9a55c;font-size:11px;letter-spacing:3px;text-transform:uppercase">${ar ? "الشحن إلى" : "Shipping to"}</p>
<p style="margin:0;color:#e7d9c0">${address(o)}</p>
${o.paymentMethod === "COD" ? `<p style="margin-top:18px;color:#e8cd92">${ar ? `الدفع عند الاستلام: يرجى تجهيز ${formatPrice(o.total, o.locale)}` : `Cash on delivery: please keep ${formatPrice(o.total, o.locale)} ready.`}</p>` : ""}
<p style="margin-top:26px"><a href="${url}" style="display:inline-block;background:#c9a55c;color:#1c1510;padding:12px 22px;text-decoration:none;letter-spacing:2px;font-size:12px;text-transform:uppercase">${ar ? "تتبّع طلبك" : "Track your order"}</a></p>
</div>`;
  return sendEmail({
    to: o.email,
    subject: ar ? `تأكيد الطلب ${o.number} — آيات الروح` : `Order ${o.number} confirmed — Aayat al-Ruh`,
    html: emailLayout({ title: `Order ${o.number}`, preheader: ar ? "تم تأكيد طلبك" : "Your order is confirmed", body }),
  });
}

export async function sendShippingUpdate(o: OrderForEmail & { status: string }) {
  const ar = o.locale === "ar";
  const statusText: Record<string, [string, string]> = {
    PACKED: ["Your order has been packed", "تم تغليف طلبك"],
    SHIPPED: ["Your order is on its way", "طلبك في الطريق"],
    OUT_FOR_DELIVERY: ["Your order is out for delivery", "طلبك خرج للتوصيل"],
    DELIVERED: ["Your order has been delivered", "تم توصيل طلبك"],
    CANCELLED: ["Your order has been cancelled", "تم إلغاء طلبك"],
    REFUNDED: ["Your refund has been processed", "تمت معالجة استرداد المبلغ"],
  };
  const [en, arText] = statusText[o.status] ?? ["Your order has been updated", "تم تحديث طلبك"];
  const heading = ar ? arText : en;
  const tracking =
    o.trackingNumber
      ? `<p style="color:#e7d9c0">${ar ? "شركة الشحن" : "Courier"}: ${o.courier ?? "—"}<br>${ar ? "رقم التتبع" : "Tracking"}: <strong style="color:#e8cd92">${o.trackingNumber}</strong></p>${o.trackingUrl ? `<p><a href="${o.trackingUrl}" style="color:#c9a55c">${ar ? "تتبّع الشحنة ←" : "Track shipment →"}</a></p>` : ""}`
      : "";
  return sendEmail({
    to: o.email,
    subject: `${heading} — ${o.number}`,
    html: emailLayout({
      title: heading,
      body: `<div ${ar ? 'dir="rtl" style="text-align:right"' : ""}><p style="font-family:Georgia,serif;font-size:24px;color:#f4ecdd">${heading}</p><p style="color:#b8ad9b">${ar ? "الطلب" : "Order"} ${o.number}</p>${tracking}</div>`,
    }),
  });
}
