import { NextResponse, type NextRequest } from "next/server";
import { readPaytmPost, reconcilePaytmOrder } from "@/server/payments";

/**
 * Paytm payment-notification webhook — catches payments that finish after the
 * shopper has left (slow UPI approvals, closed tabs). Configure it in the Paytm
 * dashboard under Developer Settings → Webhook URL → Payment Notification URL:
 * https://<domain>/api/paytm/webhook
 */
export async function POST(req: NextRequest) {
  const { orderId, signed } = await readPaytmPost(req);
  if (!signed) return NextResponse.json({ ok: false }, { status: 401 });
  if (!orderId) return NextResponse.json({ ok: true });

  try {
    const outcome = await reconcilePaytmOrder(orderId);
    return NextResponse.json({ ok: true, result: outcome.result });
  } catch (e) {
    console.error("[paytm] webhook status check failed", e);
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}
