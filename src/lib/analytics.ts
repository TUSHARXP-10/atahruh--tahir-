/**
 * Ecommerce events for Google Analytics 4 and the Meta Pixel. Both tags load only
 * after the visitor accepts analytics cookies (see components/analytics); before
 * that — or when no tag is configured — every call here is a no-op.
 * Amounts are passed in paise and reported in rupees.
 */

type Item = { id: string; name: string; variant?: string; price: number; quantity?: number };

type EventName = "view_item" | "add_to_cart" | "begin_checkout" | "purchase";

const PIXEL_EVENT: Record<EventName, string> = {
  view_item: "ViewContent",
  add_to_cart: "AddToCart",
  begin_checkout: "InitiateCheckout",
  purchase: "Purchase",
};

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

const rupees = (paise: number) => Math.round(paise) / 100;

export function track(event: EventName, data: { items: Item[]; value: number; transactionId?: string }) {
  if (typeof window === "undefined" || !document.cookie.includes("aar_consent=all")) return;
  if (window.gtag || window.fbq) send(event, data);
  // Consent given but the tags are still starting (first page view): try once more shortly
  else setTimeout(() => send(event, data), 2000);
}

function send(event: EventName, { items, value, transactionId }: { items: Item[]; value: number; transactionId?: string }) {
  const currency = "INR";
  window.gtag?.("event", event, {
    currency,
    value: rupees(value),
    ...(transactionId ? { transaction_id: transactionId } : {}),
    items: items.map((i) => ({
      item_id: i.id,
      item_name: i.name,
      ...(i.variant ? { item_variant: i.variant } : {}),
      price: rupees(i.price),
      quantity: i.quantity ?? 1,
    })),
  });
  window.fbq?.(
    "track",
    PIXEL_EVENT[event],
    {
      currency,
      value: rupees(value),
      content_type: "product",
      content_ids: items.map((i) => i.id),
      contents: items.map((i) => ({ id: i.id, quantity: i.quantity ?? 1 })),
    },
    transactionId ? { eventID: transactionId } : undefined,
  );
}

/** The configured tag IDs — only well-formed ones, since they are written into inline scripts. */
export function analyticsIds() {
  const ga = process.env.NEXT_PUBLIC_GA_ID?.trim();
  const pixel = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
  return {
    gaId: ga && /^G-[A-Z0-9]{4,20}$/.test(ga) ? ga : undefined,
    pixelId: pixel && /^\d{6,20}$/.test(pixel) ? pixel : undefined,
  };
}
