import { describe, expect, it } from "vitest";
import { computeTotals } from "@/lib/pricing";
import { commerceDefaults as s } from "@/lib/site";

const line = (rupees: number, quantity = 1) => ({ unitPrice: rupees * 100, quantity });

describe("computeTotals", () => {
  it("charges standard shipping below the free threshold", () => {
    const r = computeTotals({ lines: [line(699)] });
    expect(r.subtotal).toBe(69_900);
    expect(r.shippingFee).toBe(s.standardShippingFee);
    expect(r.total).toBe(69_900 + s.standardShippingFee);
    expect(r.freeShippingRemaining).toBe(s.freeShippingThreshold - 69_900);
  });

  it("ships free at or above the threshold", () => {
    const r = computeTotals({ lines: [line(999)] });
    expect(r.shippingFee).toBe(0);
    expect(r.freeShippingRemaining).toBe(0);
  });

  it("applies percentage coupons with a cap", () => {
    const r = computeTotals({
      lines: [line(5499), line(3299)],
      coupon: { code: "WELCOME10", type: "PERCENT", value: 10, minSubtotal: 0, maxDiscount: 50_000 },
    });
    expect(r.discount).toBe(50_000); // 10% of ₹8,798 = ₹879.80 → capped at ₹500
    expect(r.couponApplied).toBe(true);
  });

  it("applies flat coupons only above their minimum spend", () => {
    const coupon = { code: "RUH500", type: "FLAT" as const, value: 50_000, minSubtotal: 399_900, maxDiscount: null };
    expect(computeTotals({ lines: [line(2199)], coupon }).couponError).toBe("MIN_SUBTOTAL");
    const ok = computeTotals({ lines: [line(2199, 2)], coupon });
    expect(ok.discount).toBe(50_000);
  });

  it("free-shipping coupons remove the shipping fee", () => {
    const r = computeTotals({ lines: [line(599)], coupon: { code: "FREESHIP", type: "FREE_SHIPPING", value: 0, minSubtotal: 0, maxDiscount: null } });
    expect(r.shippingFee).toBe(0);
    expect(r.discount).toBe(0);
  });

  it("adds the COD fee and gift wrap", () => {
    const r = computeTotals({ lines: [line(1199)], paymentMethod: "COD", giftWrap: true });
    expect(r.codFee).toBe(s.codFee);
    expect(r.giftWrapFee).toBe(s.giftWrapFee);
    expect(r.total).toBe(119_900 + s.codFee + s.giftWrapFee);
  });

  it("disallows COD above the configured maximum", () => {
    const r = computeTotals({ lines: [line(5499, 10)], paymentMethod: "COD" });
    expect(r.codAllowed).toBe(false);
  });

  it("computes the GST contained in a tax-inclusive total", () => {
    const r = computeTotals({ lines: [line(1180)] }); // ₹1,180 incl. 18% → ₹180 GST
    expect(r.taxIncluded).toBe(18_000);
  });

  it("charges the express difference when shipping is otherwise free", () => {
    const r = computeTotals({ lines: [line(2199)], deliverySpeed: "express" });
    expect(r.shippingFee).toBe(s.expressShippingFee - s.standardShippingFee);
  });

  it("flags the complimentary sample threshold", () => {
    expect(computeTotals({ lines: [line(2199)] }).freeSampleEligible).toBe(false);
    expect(computeTotals({ lines: [line(2499)] }).freeSampleEligible).toBe(true);
  });

  it("never discounts below zero", () => {
    const r = computeTotals({ lines: [line(100)], coupon: { code: "X", type: "FLAT", value: 999_999, minSubtotal: 0, maxDiscount: null } });
    expect(r.discount).toBe(10_000);
    expect(r.total).toBeGreaterThanOrEqual(0);
  });
});
