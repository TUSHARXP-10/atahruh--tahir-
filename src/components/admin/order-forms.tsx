"use client";

import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { addOrderNote, recheckPayment, updateOrderStatus } from "@/server/admin/actions/orders";
import { ActionButton, ActionForm, SubmitButton } from "./client";
import { Checkbox, Field, Select, TextArea, TextInput, humanize } from "./ui";

const FLOW = ["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "RETURNED", "REFUNDED"];
const EMAILED = new Set(["PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "REFUNDED"]);

export function OrderStatusForm({
  order,
}: {
  order: { id: string; status: string; courier: string | null; trackingNumber: string | null; trackingUrl: string | null; stockCommitted: boolean; paymentMethod: string };
}) {
  const [status, setStatus] = useState(order.status);
  const next = FLOW[FLOW.indexOf(order.status) + 1];
  const shipping = ["SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(status);
  const closing = status === "CANCELLED" || status === "RETURNED";

  return (
    <ActionForm action={updateOrderStatus} className="space-y-4">
      <input type="hidden" name="orderId" value={order.id} />
      <Field label="Status" htmlFor="status" hint={next && order.status !== "CANCELLED" && status === order.status ? `Next step: ${humanize(next)}` : undefined}>
        <Select id="status" name="status" value={status} onChange={(e) => setStatus(e.target.value)}>
          {FLOW.map((s) => (
            <option key={s} value={s}>
              {humanize(s)}
            </option>
          ))}
        </Select>
      </Field>

      {shipping || order.trackingNumber ? (
        <div className="grid gap-3 rounded-lg bg-[#fbf7ef] p-3">
          <Field label="Courier" htmlFor="courier">
            <TextInput id="courier" name="courier" defaultValue={order.courier ?? ""} placeholder="Delhivery, Blue Dart, India Post…" />
          </Field>
          <Field label="Tracking number" htmlFor="trackingNumber">
            <TextInput id="trackingNumber" name="trackingNumber" defaultValue={order.trackingNumber ?? ""} />
          </Field>
          <Field label="Tracking link" htmlFor="trackingUrl" hint="Optional — the courier’s tracking page for this parcel">
            <TextInput id="trackingUrl" name="trackingUrl" type="url" defaultValue={order.trackingUrl ?? ""} placeholder="https://" />
          </Field>
        </div>
      ) : (
        <>
          <input type="hidden" name="courier" value={order.courier ?? ""} />
          <input type="hidden" name="trackingNumber" value={order.trackingNumber ?? ""} />
          <input type="hidden" name="trackingUrl" value={order.trackingUrl ?? ""} />
        </>
      )}

      {closing && order.stockCommitted ? <Checkbox name="restock" defaultChecked label="Put the items back in stock" hint="Untick for opened or damaged returns" /> : null}
      {EMAILED.has(status) && status !== order.status ? <Checkbox name="notify" defaultChecked label="Email the customer about this update" /> : null}
      {status === "DELIVERED" && order.paymentMethod === "COD" && order.status !== "DELIVERED" ? (
        <p className="text-xs text-ink-muted">Marking delivered also records the cash as collected.</p>
      ) : null}
      {status === "REFUNDED" && order.paymentMethod === "ONLINE" ? (
        <p className="text-xs text-ink-muted">Issue the refund itself in your Paytm dashboard — this only records it here.</p>
      ) : null}

      <SubmitButton className="w-full">Save</SubmitButton>
    </ActionForm>
  );
}

export function OrderNoteForm({ orderId }: { orderId: string }) {
  return (
    <ActionForm action={addOrderNote} resetOnSuccess className="space-y-3">
      <input type="hidden" name="orderId" value={orderId} />
      <TextArea name="message" placeholder="Add a note…" className="min-h-20" aria-label="Note" required />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Checkbox name="visible" label="Show on the customer’s order page" />
        <SubmitButton size="sm" variant="secondary">
          Add note
        </SubmitButton>
      </div>
    </ActionForm>
  );
}

export function RecheckPaymentButton({ orderId }: { orderId: string }) {
  return (
    <ActionButton action={() => recheckPayment(orderId)}>
      <RefreshCw /> Check with Paytm
    </ActionButton>
  );
}
