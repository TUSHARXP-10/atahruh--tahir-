import { ExternalLink, Gift, Lock, Printer } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { addressLines, fmtDateTime, money } from "@/components/admin/format";
import { OrderNoteForm, OrderStatusForm, RecheckPaymentButton } from "@/components/admin/order-forms";
import { ALink, Card, PageHeader, StatusBadge, humanize } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { requireAdminPage } from "@/server/admin/auth";

export async function generateMetadata({ params }: PageProps<"/admin/orders/[number]">) {
  return { title: `Order ${decodeURIComponent((await params).number)}` };
}

export default async function OrderDetailPage({ params }: PageProps<"/admin/orders/[number]">) {
  const number = decodeURIComponent((await params).number);
  await requireAdminPage(`/admin/orders/${number}`);
  const order = await db.order.findUnique({
    where: { number },
    include: {
      items: true,
      events: { orderBy: { createdAt: "desc" } },
      user: { select: { id: true, name: true, email: true, createdAt: true, _count: { select: { orders: true } } } },
    },
  });
  if (!order) notFound();
  const a = addressLines(order.shippingAddress);
  const units = order.items.reduce((n, i) => n + i.quantity, 0);

  return (
    <>
      <PageHeader
        back={{ href: "/admin/orders", label: "Orders" }}
        title={order.number}
        description={
          <span className="flex flex-wrap items-center gap-2">
            Placed {fmtDateTime(order.createdAt)} · <StatusBadge status={order.status} /> <StatusBadge status={order.paymentStatus} label={`${order.paymentMethod === "COD" ? "COD" : "Online"} · ${humanize(order.paymentStatus)}`} />
          </span>
        }
        actions={
          <>
            <ALink href={`/admin/orders/${order.number}/invoice`}>
              <Printer /> Invoice
            </ALink>
            <a href={`/orders/${order.number}`} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm text-ink-muted hover:text-ink">
              <ExternalLink className="size-4" /> Customer view
            </a>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-6">
          <Card title={`Items · ${units} unit${units === 1 ? "" : "s"}`} padded={false}>
            <ul>
              {order.items.map((item) => {
                const picks = Array.isArray(item.selections) ? (item.selections as { name?: string; form?: string }[]) : [];
                return (
                  <li key={item.id} className="flex items-center gap-4 border-b border-[#f0e8d9] px-5 py-3 last:border-0">
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-[#f3ecdf]" style={{ backgroundColor: item.accentColor ?? undefined }}>
                      {item.imageUrl ? <Image src={item.imageUrl} alt="" fill sizes="56px" className="object-cover" /> : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-ink">{item.name}</p>
                      <p className="text-xs text-ink-muted">
                        {humanize(item.formType)} · {item.sizeLabel} · {money(item.unitPrice)} each
                      </p>
                      {picks.length ? <p className="mt-1 text-xs text-ink-muted">Picks: {picks.map((p) => `${p.name ?? "?"}${p.form ? ` (${humanize(p.form)})` : ""}`).join(", ")}</p> : null}
                    </div>
                    <p className="text-sm tabular-nums text-ink-muted">× {item.quantity}</p>
                    <p className="w-24 text-end font-medium tabular-nums text-ink">{money(item.total)}</p>
                  </li>
                );
              })}
            </ul>
            <dl className="space-y-1.5 border-t border-[#f0e8d9] bg-[#fcf9f3] px-5 py-4 text-sm">
              <Row label="Subtotal" value={money(order.subtotal)} />
              {order.discount ? <Row label={`Discount${order.couponCode ? ` (${order.couponCode})` : ""}`} value={`− ${money(order.discount)}`} /> : null}
              <Row label={`Shipping (${order.deliverySpeed})`} value={order.shippingFee ? money(order.shippingFee) : "Free"} />
              {order.codFee ? <Row label="COD fee" value={money(order.codFee)} /> : null}
              {order.giftWrapFee ? <Row label="Gift wrap" value={money(order.giftWrapFee)} /> : null}
              <div className="flex justify-between border-t border-[#e9dfcc] pt-2 text-base font-semibold text-ink">
                <dt>Total</dt>
                <dd className="tabular-nums">{money(order.total)}</dd>
              </div>
              <Row label="Includes GST" value={money(order.taxIncluded)} muted />
            </dl>
          </Card>

          {order.giftWrap || order.giftMessage ? (
            <Card title={<span className="flex items-center gap-2"><Gift className="size-4 text-gold-deep" /> Gift</span>}>
              <p className="text-sm text-ink">{order.giftWrap ? "Gift wrap requested." : null}</p>
              {order.giftMessage ? <blockquote className="mt-2 border-s-2 border-gold ps-3 font-display text-lg italic text-ink">“{order.giftMessage}”</blockquote> : null}
            </Card>
          ) : null}

          <Card title="Timeline" description="Notes marked with a lock are only visible to admins.">
            <OrderNoteForm orderId={order.id} />
            <ol className="mt-5 space-y-4 border-s border-[#e9dfcc] ps-5">
              {order.events.map((e) => (
                <li key={e.id} className="relative">
                  <span className={cn("absolute -start-[1.6rem] top-1.5 size-2.5 rounded-full ring-4 ring-white", e.internal ? "bg-[#cbbd9f]" : "bg-gold-deep")} />
                  <p className="flex items-center gap-1.5 text-sm text-ink">
                    {e.internal ? <Lock className="size-3 text-ink-muted" aria-label="Admin only" /> : null}
                    {e.message}
                    {e.status ? <StatusBadge status={e.status} className="ms-1" /> : null}
                  </p>
                  <p className="text-xs text-ink-muted">{fmtDateTime(e.createdAt)}</p>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Update order">
            <OrderStatusForm order={order} />
          </Card>

          <Card title="Customer">
            <p className="font-medium text-ink">{a.name}</p>
            <p className="text-sm text-ink-muted">
              <a href={`mailto:${order.email}`} className="hover:text-ink">
                {order.email}
              </a>
            </p>
            <p className="text-sm text-ink-muted">
              <a href={`tel:${order.phone}`} className="hover:text-ink">
                {order.phone}
              </a>{" "}
              ·{" "}
              <a href={`https://wa.me/${order.phone.replace(/\D/g, "").replace(/^(\d{10})$/, "91$1")}`} target="_blank" rel="noreferrer" className="text-[#1f6b3c] hover:underline">
                WhatsApp
              </a>
            </p>
            <p className="mt-2 text-xs text-ink-muted">
              {order.user ? `Account holder · ${order.user._count.orders} order${order.user._count.orders === 1 ? "" : "s"}` : "Guest checkout"} · language: {order.locale === "ar" ? "Arabic" : "English"}
            </p>
          </Card>

          <Card title="Ship to">
            <address className="text-sm not-italic leading-relaxed text-ink">
              {a.name}
              <br />
              {a.lines.map((l) => (
                <span key={l}>
                  {l}
                  <br />
                </span>
              ))}
              {a.phone}
            </address>
          </Card>

          <Card title="Payment">
            <dl className="space-y-1.5 text-sm">
              <Row label="Method" value={order.paymentMethod === "COD" ? "Cash on delivery" : `Online${order.paymentGateway ? ` · ${order.paymentGateway}` : ""}`} />
              <Row label="Status" value={humanize(order.paymentStatus)} />
              {order.gatewayPaymentId ? <Row label="Transaction" value={order.gatewayPaymentId} /> : null}
              {order.paidAt ? <Row label="Paid" value={fmtDateTime(order.paidAt)} /> : null}
            </dl>
            {order.paymentMethod === "ONLINE" && order.paymentStatus === "PENDING" ? (
              <div className="mt-4">
                <RecheckPaymentButton orderId={order.id} />
              </div>
            ) : null}
          </Card>
        </div>
      </div>
    </>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={cn("flex justify-between gap-4", muted ? "text-xs text-ink-muted" : "text-ink-muted")}>
      <dt>{label}</dt>
      <dd className={cn("text-end tabular-nums", !muted && "text-ink")}>{value}</dd>
    </div>
  );
}
