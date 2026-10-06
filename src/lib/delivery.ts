/**
 * Delivery estimates from the Mumbai warehouse, by Indian pincode.
 * Rules are intentionally simple and editable; swap for a courier API
 * (Shiprocket/Delhivery serviceability) when the client signs one up.
 */

export type DeliveryEstimate = {
  serviceable: boolean;
  minDays: number;
  maxDays: number;
  express: boolean;
  cod: boolean;
  zone: "local" | "metro" | "regional" | "national" | "remote";
};

const METRO_PREFIXES = ["110", "560", "600", "700", "500", "411", "380", "122", "201"];
const REMOTE_PREFIXES = ["744", "737", "190", "191", "192", "193", "194", "790", "791", "792", "793", "794", "795", "796", "797", "798", "799"];
const NO_COD_PREFIXES = ["744", "194"];

export function isValidPincode(pin: string) {
  return /^[1-9][0-9]{5}$/.test(pin);
}

export function estimateDelivery(pin: string): DeliveryEstimate {
  if (!isValidPincode(pin)) {
    return { serviceable: false, minDays: 0, maxDays: 0, express: false, cod: false, zone: "national" };
  }
  const p3 = pin.slice(0, 3);
  const cod = !NO_COD_PREFIXES.includes(p3);
  if (p3 === "400" || p3 === "401" || p3 === "410") return { serviceable: true, minDays: 1, maxDays: 2, express: true, cod, zone: "local" };
  if (METRO_PREFIXES.includes(p3)) return { serviceable: true, minDays: 2, maxDays: 3, express: true, cod, zone: "metro" };
  if (REMOTE_PREFIXES.includes(p3)) return { serviceable: true, minDays: 6, maxDays: 9, express: false, cod, zone: "remote" };
  if (pin[0] === "3" || pin[0] === "4") return { serviceable: true, minDays: 2, maxDays: 4, express: true, cod, zone: "regional" };
  return { serviceable: true, minDays: 4, maxDays: 7, express: true, cod, zone: "national" };
}

/** Add business days (skips Sundays) to today. */
export function deliveryDate(days: number, from = new Date()) {
  const d = new Date(from);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0) added++;
  }
  return d;
}

export const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh",
  "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry",
  "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
  "West Bengal",
] as const;
