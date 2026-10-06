import { notFound } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { addressLines, fmtDate, money } from "@/components/admin/format";
import { PrintButton } from "@/components/admin/print-button";
import { ALink, humanize } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/server/admin/auth";
import { getSettings } from "@/server/queries/content";

export const metadata = { title: "Invoice" };

/** Default HSN codes by form — confirm with the client's accountant before launch. */
const HSN: Record<string, string> = { PERFUME: "3303", ATTAR: "3303", OIL: "3301", SET: "3303" };

export default async function InvoicePage({ params }: PageProps<"/admin/orders/[number]/invoice">) {
  const number = decodeURIComponent((await params).number);
  await requireAdminPage(`/admin/orders/${number}/invoice`);
  const [order, { business, commerce, contact }] = await Promise.all([db.order.findUnique({ where: { number }, include: { items: true } }), getSettings()]);
  if (!order) notFound();

  const a = addressLines(order.shippingAddress);
  const buyerState = ((order.shippingAddress ?? {}) as Record<string, string>).state ?? "";
  const intraState = !!business.state && business.state.toLowerCase() === buyerState.toLowerCase();
  const taxable = order.total - order.taxIncluded;
  const rate = commerce.gstRatePercent;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <ALink href={`/admin/orders/${order.number}`} variant="ghost">
          ← Back to order
        </ALink>
        <PrintButton />
      </div>

      <article className="rounded-xl border border-[#e9dfcc] bg-white p-10 text-sm text-ink print:border-0 print:p-0">
        <header className="flex items-start justify-between gap-6 border-b border-[#e9dfcc] pb-6">
          <div>
            <Logo variant="stacked" tone="light" className="mb-3 h-20" />
            <p className="font-caps text-sm tracking-[0.18em] text-ink">{business.legalName}</p>
            <p className="mt-1 whitespace-pre-line text-xs text-ink-muted">{business.address}</p>
            <p className="text-xs text-ink-muted">
              {contact.email} · {contact.phone}
            </p>
            <p className="mt-1 text-xs font-medium">GSTIN: {business.gstin || "— (add in Settings)"}</p>
          </div>
          <div className="text-end">
            <p className="font-display text-3xl">Tax invoice</p>
            <p className="mt-1 text-xs text-ink-muted">Invoice no. {order.number}</p>
            <p className="text-xs text-ink-muted">Date {fmtDate(order.paidAt ?? order.createdAt)}</p>
            <p className="text-xs text-ink-muted">
              Payment: {order.paymentMethod === "COD" ? "Cash on delivery" : "Online"} ({humanize(order.paymentStatus)})
            </p>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-6 border-b border-[#e9dfcc] py-5">
          <div>
            <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-ink-muted">Bill & ship to</p>
            <p className="font-medium">{a.name}</p>
            {a.lines.map((l) => (
              <p key={l} className="text-xs">
                {l}
              </p>
            ))}
            <p className="text-xs">{a.phone}</p>
          </div>
          <div>
            <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-ink-muted">Place of supply</p>
            <p>{buyerState || "—"}</p>
            <p className="mt-2 text-xs text-ink-muted">{order.email}</p>
          </div>
        </section>

        <table className="mt-5 w-full text-xs">
          <thead>
            <tr className="border-b border-[#e9dfcc] text-start text-[0.65rem] uppercase tracking-[0.1em] text-ink-muted">
              <th className="py-2 text-start font-semibold">Item</th>
              <th className="py-2 text-start font-semibold">HSN</th>
              <th className="py-2 text-end font-semibold">Qty</th>
              <th className="py-2 text-end font-semibold">Rate</th>
              <th className="py-2 text-end font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((i) => (
              <tr key={i.id} className="border-b border-[#f3ecdf]">
                <td className="py-2">
                  {i.name}
                  <span className="block text-ink-muted">
                    {humanize(i.formType)} · {i.sizeLabel}
                  </span>
                </td>
                <td className="py-2">{HSN[i.formType] ?? "3303"}</td>
                <td className="py-2 text-end tabular-nums">{i.quantity}</td>
                <td className="py-2 text-end tabular-nums">{money(i.unitPrice)}</td>
                <td className="py-2 text-end tabular-nums">{money(i.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex justify-end">
          <dl className="w-72 space-y-1 text-xs">
            <Line label="Subtotal" value={money(order.subtotal)} />
            {order.discount ? <Line label={`Discount${order.couponCode ? ` (${order.couponCode})` : ""}`} value={`− ${money(order.discount)}`} /> : null}
            {order.shippingFee ? <Line label="Shipping" value={money(order.shippingFee)} /> : null}
            {order.codFee ? <Line label="COD fee" value={money(order.codFee)} /> : null}
            {order.giftWrapFee ? <Line label="Gift wrap" value={money(order.giftWrapFee)} /> : null}
            <div className="flex justify-between border-t border-[#e9dfcc] pt-2 text-sm font-semibold">
              <dt>Total (incl. GST)</dt>
              <dd className="tabular-nums">{money(order.total)}</dd>
            </div>
            <div className="mt-3 space-y-1 rounded-md bg-[#fbf7ef] p-3">
              <Line label="Taxable value" value={money(taxable)} />
              {intraState ? (
                <>
                  <Line label={`CGST @ ${rate / 2}%`} value={money(Math.floor(order.taxIncluded / 2))} />
                  <Line label={`SGST @ ${rate / 2}%`} value={money(order.taxIncluded - Math.floor(order.taxIncluded / 2))} />
                </>
              ) : (
                <Line label={`IGST @ ${rate}%`} value={money(order.taxIncluded)} />
              )}
            </div>
          </dl>
        </div>

        <footer className="mt-10 border-t border-[#e9dfcc] pt-4 text-center text-[0.65rem] text-ink-muted">
          This is a computer-generated invoice. Thank you for choosing {business.legalName}.
        </footer>
      </article>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
