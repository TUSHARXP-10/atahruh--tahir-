"use server";

import { deliveryDate, estimateDelivery, isValidPincode } from "@/lib/delivery";

type PincodeLookup = { city: string; state: string } | null;

/** City/state for an Indian pincode via India Post's public API (cached a day). */
export async function lookupPincode(pin: string): Promise<PincodeLookup> {
  if (!isValidPincode(pin)) return null;
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { Status: string; PostOffice?: { District: string; State: string }[] }[];
    const po = data?.[0]?.PostOffice?.[0];
    return po ? { city: po.District, state: po.State } : null;
  } catch {
    return null;
  }
}

export async function checkDelivery(pin: string) {
  const clean = pin.replace(/\s/g, "");
  if (!isValidPincode(clean)) return { ok: false as const };
  const est = estimateDelivery(clean);
  const place = await lookupPincode(clean);
  return {
    ok: true as const,
    ...est,
    by: deliveryDate(est.maxDays).toISOString(),
    place,
  };
}
