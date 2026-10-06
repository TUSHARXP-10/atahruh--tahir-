import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "node:crypto";

/*
 * Pure Paytm helpers (no I/O) — kept separate from `paytm.ts` so they can be unit-tested.
 *
 * Checksum scheme, ported from Paytm's official `paytmchecksum` package:
 *   AES-128-CBC( sha256(payload + "|" + salt) + salt ), keyed with the merchant key.
 * JSON APIs sign the exact JSON string of `body`; form posts sign the values
 * joined with "|" in key order (CHECKSUMHASH excluded).
 */

const IV = "@@@@&&&&####$$$$";

function hashWithSalt(payload: string, salt: string) {
  return createHash("sha256").update(`${payload}|${salt}`).digest("hex") + salt;
}

export function paramsToString(params: Record<string, string | null | undefined>) {
  return Object.keys(params)
    .filter((k) => k !== "CHECKSUMHASH")
    .sort()
    .map((k) => params[k] ?? "")
    .join("|");
}

export function generateSignature(payload: string | Record<string, string>, key: string) {
  const str = typeof payload === "string" ? payload : paramsToString(payload);
  const salt = randomBytes(3).toString("base64");
  const cipher = createCipheriv("aes-128-cbc", key, IV);
  return cipher.update(hashWithSalt(str, salt), "binary", "base64") + cipher.final("base64");
}

export function verifySignature(payload: string | Record<string, string>, key: string, checksum: string) {
  const str = typeof payload === "string" ? payload : paramsToString(payload);
  let decrypted: string;
  try {
    const decipher = createDecipheriv("aes-128-cbc", key, IV);
    decrypted = decipher.update(checksum, "base64", "binary") + decipher.final("binary");
  } catch {
    return false;
  }
  const a = Buffer.from(decrypted, "binary");
  const b = Buffer.from(hashWithSalt(str, decrypted.slice(-4)), "binary");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Paise → the rupee string Paytm expects ("1199.00"). */
export function toPaytmAmount(paise: number) {
  return (paise / 100).toFixed(2);
}

/** Paytm's rupee string → paise, or NaN when it isn't a plain amount. */
export function paytmAmountToPaise(amount: string | undefined) {
  if (!amount || !/^\d+(\.\d{1,2})?$/.test(amount.trim())) return Number.NaN;
  return Math.round(Number.parseFloat(amount) * 100);
}

/** Response body of the Transaction Status API (`/v3/order/status`). */
export type PaytmStatusBody = {
  resultInfo?: { resultStatus?: string; resultCode?: string; resultMsg?: string };
  txnId?: string;
  bankTxnId?: string;
  orderId?: string;
  txnAmount?: string;
  mid?: string;
  paymentMode?: string;
};

export type PaytmVerdict =
  | { status: "PAID"; txnId: string; paymentMode?: string }
  | { status: "PENDING" }
  | { status: "FAILED"; reason: string }
  /** Paytm says success, but for a different merchant, order or amount — never confirm. */
  | { status: "MISMATCH"; reason: string };

/**
 * Decide what a status response means for one of our orders. Only a
 * TXN_SUCCESS for the same merchant, order and exact amount confirms payment.
 */
export function evaluateStatus(body: PaytmStatusBody, expected: { mid: string; orderId: string; amount: number }): PaytmVerdict {
  const result = body.resultInfo?.resultStatus;
  // 501 "System Error" is Paytm being unable to answer right now, not a declined payment
  if (result === "PENDING" || body.resultInfo?.resultCode === "501") return { status: "PENDING" };
  if (result !== "TXN_SUCCESS") return { status: "FAILED", reason: body.resultInfo?.resultMsg || result || "Unknown status" };
  if (body.mid !== expected.mid) return { status: "MISMATCH", reason: "Merchant ID does not match" };
  if (body.orderId !== expected.orderId) return { status: "MISMATCH", reason: "Order ID does not match" };
  if (paytmAmountToPaise(body.txnAmount) !== expected.amount) {
    return { status: "MISMATCH", reason: `Amount ${body.txnAmount} does not match order total` };
  }
  if (!body.txnId) return { status: "MISMATCH", reason: "Missing transaction ID" };
  return { status: "PAID", txnId: body.txnId, paymentMode: body.paymentMode };
}
