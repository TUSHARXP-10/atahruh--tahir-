import "server-only";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { fetchTransactionStatus, paytmMerchantKey, paytmMid } from "@/lib/paytm";
import { evaluateStatus, verifySignature } from "@/lib/paytm-core";
import { finalizePaidOrder, markOrderPaymentFailed } from "./orders";

export type PaymentOutcome = { result: "PAID" | "PENDING" | "FAILED" | "NOT_FOUND"; number?: string; locale?: string };

/**
 * Settle an order against Paytm's Transaction Status API. Whatever the browser
 * or webhook posted is only a hint — the status call decides, and the amount,
 * merchant and order must match before anything is confirmed. Safe to repeat.
 */
export async function reconcilePaytmOrder(gatewayOrderId: string): Promise<PaymentOutcome> {
  const order = await db.order.findUnique({
    where: { gatewayOrderId },
    select: { id: true, number: true, locale: true, total: true, paymentStatus: true },
  });
  if (!order) return { result: "NOT_FOUND" };
  const ref = { number: order.number, locale: order.locale };
  if (order.paymentStatus === "PAID") return { result: "PAID", ...ref };

  const verdict = evaluateStatus(await fetchTransactionStatus(gatewayOrderId), {
    mid: paytmMid(),
    orderId: gatewayOrderId,
    amount: order.total,
  });

  switch (verdict.status) {
    case "PAID":
      await finalizePaidOrder(gatewayOrderId, verdict.txnId);
      return { result: "PAID", ...ref };
    case "PENDING":
      return { result: "PENDING", ...ref };
    case "MISMATCH":
      await db.orderEvent.create({ data: { orderId: order.id, message: `Paytm reported success but it did not match: ${verdict.reason}. Review before shipping.`, internal: true } });
      await markOrderPaymentFailed(gatewayOrderId, verdict.reason);
      return { result: "FAILED", ...ref };
    case "FAILED":
      await markOrderPaymentFailed(gatewayOrderId, verdict.reason);
      return { result: "FAILED", ...ref };
  }
}

/** Read the fields Paytm posts (form-encoded from the browser and webhook; JSON tolerated). */
export async function readPaytmPost(req: NextRequest) {
  const type = req.headers.get("content-type") ?? "";
  let fields: Record<string, string> = {};
  if (type.includes("application/json")) {
    const json = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    fields = Object.fromEntries(Object.entries(json).map(([k, v]) => [k, v == null ? "" : String(v)]));
  } else {
    const form = await req.formData().catch(() => null);
    form?.forEach((v, k) => {
      if (typeof v === "string") fields[k] = v;
    });
  }
  const checksum = fields.CHECKSUMHASH ?? "";
  // Settlement never relies on this (reconcilePaytmOrder asks Paytm directly); it only filters forged webhook calls
  const signed = !!checksum && verifySignature(fields, paytmMerchantKey(), checksum);
  return { orderId: (fields.ORDERID ?? "").trim(), signed };
}
