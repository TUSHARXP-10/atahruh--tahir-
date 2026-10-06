/**
 * The single source of truth for money maths. Pure and synchronous so it is
 * shared by the cart drawer, checkout and the server that creates orders —
 * the server always recomputes; client numbers are only a preview.
 * All amounts are integer paise and GST-inclusive (Indian MRP convention).
 */
import { commerceDefaults } from "./site";

export type CommerceSettings = typeof commerceDefaults;

export type PricingLine = { unitPrice: number; quantity: number };

export type CouponRule = {
  code: string;
  type: "PERCENT" | "FLAT" | "FREE_SHIPPING";
  value: number;
  minSubtotal: number;
  maxDiscount: number | null;
};

export type PricingInput = {
  lines: PricingLine[];
  coupon?: CouponRule | null;
  giftWrap?: boolean;
  paymentMethod?: "ONLINE" | "COD";
  deliverySpeed?: "standard" | "express";
  settings?: Partial<CommerceSettings>;
};

export type PricingResult = {
  subtotal: number;
  discount: number;
  shippingFee: number;
  codFee: number;
  giftWrapFee: number;
  total: number;
  taxIncluded: number;
  itemCount: number;
  freeShippingRemaining: number;
  freeShippingProgress: number;
  freeSampleEligible: boolean;
  freeSampleRemaining: number;
  couponApplied: boolean;
  couponError: "MIN_SUBTOTAL" | null;
  codAllowed: boolean;
};

export function computeTotals(input: PricingInput): PricingResult {
  const s = { ...commerceDefaults, ...input.settings };
  const subtotal = input.lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const itemCount = input.lines.reduce((sum, l) => sum + l.quantity, 0);

  // Coupon
  let discount = 0;
  let couponApplied = false;
  let couponError: PricingResult["couponError"] = null;
  let freeShippingByCoupon = false;
  const c = input.coupon;
  if (c && subtotal > 0) {
    if (subtotal < c.minSubtotal) {
      couponError = "MIN_SUBTOTAL";
    } else {
      couponApplied = true;
      if (c.type === "PERCENT") discount = Math.round((subtotal * c.value) / 100);
      else if (c.type === "FLAT") discount = c.value;
      else freeShippingByCoupon = true;
      if (c.maxDiscount != null) discount = Math.min(discount, c.maxDiscount);
      discount = Math.min(discount, subtotal);
    }
  }

  const afterDiscount = subtotal - discount;

  // Shipping — the free threshold applies to the pre-discount subtotal (friendlier)
  const qualifiesFree = subtotal >= s.freeShippingThreshold || freeShippingByCoupon;
  let shippingFee = 0;
  if (subtotal > 0) {
    if (input.deliverySpeed === "express") shippingFee = qualifiesFree ? s.expressShippingFee - s.standardShippingFee : s.expressShippingFee;
    else shippingFee = qualifiesFree ? 0 : s.standardShippingFee;
  }

  const giftWrapFee = input.giftWrap && subtotal > 0 ? s.giftWrapFee : 0;
  const preCod = afterDiscount + shippingFee + giftWrapFee;
  const codAllowed = preCod <= s.codMaxOrder;
  const codFee = input.paymentMethod === "COD" && subtotal > 0 ? s.codFee : 0;
  const total = Math.max(0, preCod + codFee);

  // GST contained in an inclusive price: total × r / (100 + r)
  const taxIncluded = Math.round((total * s.gstRatePercent) / (100 + s.gstRatePercent));

  return {
    subtotal,
    discount,
    shippingFee,
    codFee,
    giftWrapFee,
    total,
    taxIncluded,
    itemCount,
    freeShippingRemaining: Math.max(0, s.freeShippingThreshold - subtotal),
    freeShippingProgress: Math.min(1, subtotal / s.freeShippingThreshold),
    freeSampleEligible: subtotal >= s.freeSampleThreshold,
    freeSampleRemaining: Math.max(0, s.freeSampleThreshold - subtotal),
    couponApplied,
    couponError,
    codAllowed,
  };
}
