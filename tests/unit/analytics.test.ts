import { afterEach, describe, expect, it, vi } from "vitest";
import { analyticsIds, track } from "@/lib/analytics";

/** A minimal browser: a cookie jar plus spy tags. */
function fakeBrowser(cookie: string) {
  const gtag = vi.fn();
  const fbq = vi.fn();
  vi.stubGlobal("window", { gtag, fbq });
  vi.stubGlobal("document", { cookie });
  return { gtag, fbq };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("analytics", () => {
  it("only accepts well-formed tag IDs", () => {
    vi.stubEnv("NEXT_PUBLIC_GA_ID", "G-ABC123XYZ");
    vi.stubEnv("NEXT_PUBLIC_META_PIXEL_ID", "123456789012345");
    expect(analyticsIds()).toEqual({ gaId: "G-ABC123XYZ", pixelId: "123456789012345" });

    vi.stubEnv("NEXT_PUBLIC_GA_ID", "G-1');alert(1);//");
    vi.stubEnv("NEXT_PUBLIC_META_PIXEL_ID", "abc");
    expect(analyticsIds()).toEqual({ gaId: undefined, pixelId: undefined });
  });

  it("sends nothing without analytics consent", () => {
    const { gtag, fbq } = fakeBrowser("aar_consent=essential");
    track("add_to_cart", { value: 329900, items: [{ id: "p1", name: "Oud al-Layl", price: 329900 }] });
    expect(gtag).not.toHaveBeenCalled();
    expect(fbq).not.toHaveBeenCalled();
  });

  it("reports ecommerce events in rupees once consent is given", () => {
    const { gtag, fbq } = fakeBrowser("x=1; aar_consent=all");
    track("purchase", { transactionId: "AAR-1", value: 334800, items: [{ id: "p1", name: "Oud al-Layl", variant: "PERFUME 50 ml", price: 329900, quantity: 1 }] });
    expect(gtag).toHaveBeenCalledWith("event", "purchase", {
      currency: "INR",
      value: 3348,
      transaction_id: "AAR-1",
      items: [{ item_id: "p1", item_name: "Oud al-Layl", item_variant: "PERFUME 50 ml", price: 3299, quantity: 1 }],
    });
    expect(fbq).toHaveBeenCalledWith(
      "track",
      "Purchase",
      expect.objectContaining({ currency: "INR", value: 3348, content_ids: ["p1"] }),
      { eventID: "AAR-1" },
    );
  });
});
