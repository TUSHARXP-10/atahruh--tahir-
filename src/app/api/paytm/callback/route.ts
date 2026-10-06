import { NextResponse, type NextRequest } from "next/server";
import { site } from "@/lib/site";
import { readPaytmPost, reconcilePaytmOrder, type PaymentOutcome } from "@/server/payments";

/**
 * Where Paytm's checkout sends the shopper after paying (the `callbackUrl` of
 * each transaction). Settles the order, then lands them on the right page.
 */
export async function POST(req: NextRequest) {
  const { orderId, signed } = await readPaytmPost(req);
  if (!orderId) return redirect("/checkout?payment=failed");
  if (!signed) console.warn(`[paytm] callback for ${orderId} without a valid checksum — settling via status API`);

  let outcome: PaymentOutcome;
  try {
    outcome = await reconcilePaytmOrder(orderId);
  } catch (e) {
    console.error("[paytm] status check failed", e);
    // Unknown for now; the webhook (or a later visit) settles it
    outcome = { result: "PENDING" };
  }

  const prefix = outcome.locale === "ar" ? "/ar" : "";
  if (outcome.result === "PAID") return redirect(`${prefix}/orders/${outcome.number}?placed=1`);
  if (outcome.result === "PENDING" && outcome.number) return redirect(`${prefix}/orders/${outcome.number}?payment=pending`);
  return redirect(`${prefix}/checkout?payment=failed`);
}

export function GET() {
  return redirect("/checkout");
}

function redirect(path: string) {
  // 303 turns Paytm's POST into a normal page load
  return NextResponse.redirect(new URL(path, site.url), 303);
}
