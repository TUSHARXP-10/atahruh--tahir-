import "server-only";
import { generateSignature, toPaytmAmount, type PaytmStatusBody } from "./paytm-core";

/**
 * Paytm Payment Gateway (JS Checkout) over its REST API. Disabled until the
 * merchant credentials from the Paytm for Business dashboard are configured.
 * PAYTM_ENV=production switches from the staging gateway to the live one.
 */
export function paytmEnabled() {
  return !!(process.env.PAYTM_MID && process.env.PAYTM_MERCHANT_KEY);
}

function config() {
  const production = process.env.PAYTM_ENV === "production";
  return {
    mid: process.env.PAYTM_MID ?? "",
    key: process.env.PAYTM_MERCHANT_KEY ?? "",
    website: process.env.PAYTM_WEBSITE || (production ? "DEFAULT" : "WEBSTAGING"),
    host: production ? "https://securegw.paytm.in" : "https://securegw-stage.paytm.in",
  };
}

export function paytmMid() {
  return config().mid;
}

/** Merchant-specific JS Checkout script */
export function paytmScriptUrl() {
  const { host, mid } = config();
  return `${host}/merchantpgpui/checkoutjs/merchants/${encodeURIComponent(mid)}.js`;
}

async function call<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const { host, key } = config();
  const res = await fetch(`${host}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // The signature covers the exact JSON of `body`, which JSON.stringify reproduces verbatim inside the envelope
    body: JSON.stringify({ body, head: { signature: generateSignature(JSON.stringify(body), key) } }),
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Paytm ${path} failed: ${res.status} ${await res.text().catch(() => "")}`);
  return (await res.json()) as T;
}

/** Start a payment and get the transaction token the JS Checkout needs. */
export async function initiateTransaction(input: {
  orderId: string;
  amount: number;
  callbackUrl: string;
  customer: { id: string; email: string; mobile: string };
}) {
  const { mid, website } = config();
  const res = await call<{ body?: { resultInfo?: { resultStatus?: string; resultMsg?: string }; txnToken?: string } }>(
    `/theia/api/v1/initiateTransaction?mid=${encodeURIComponent(mid)}&orderId=${encodeURIComponent(input.orderId)}`,
    {
      requestType: "Payment",
      mid,
      websiteName: website,
      orderId: input.orderId,
      callbackUrl: input.callbackUrl,
      txnAmount: { value: toPaytmAmount(input.amount), currency: "INR" },
      userInfo: { custId: input.customer.id, email: input.customer.email, mobile: input.customer.mobile },
    },
  );
  const token = res.body?.txnToken;
  if (res.body?.resultInfo?.resultStatus !== "S" || !token) {
    throw new Error(`Paytm initiateTransaction rejected: ${res.body?.resultInfo?.resultMsg ?? "no token"}`);
  }
  return token;
}

/** The source of truth for whether an order was paid. */
export async function fetchTransactionStatus(orderId: string) {
  const res = await call<{ body?: PaytmStatusBody }>("/v3/order/status", { mid: config().mid, orderId });
  return res.body ?? {};
}

export function paytmMerchantKey() {
  return config().key;
}
