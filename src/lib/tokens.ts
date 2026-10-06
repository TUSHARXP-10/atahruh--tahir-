import { formatPrice } from "./money";
import type { commerceDefaults, site } from "./site";

type Settings = {
  commerce: { [K in keyof typeof commerceDefaults]: number };
  contact: Record<keyof typeof site.contact, string>;
};

/**
 * Fill {tokens} in admin-written copy (FAQ, policies) with live settings, so a
 * fee changed in Admin → Settings is never contradicted by older page text.
 * Unknown tokens are left untouched.
 */
export function fillTokens(text: string, { commerce, contact }: Settings, locale = "en") {
  const price = (paise: number) => formatPrice(paise, locale);
  const values: Record<string, string> = {
    freeShippingThreshold: price(commerce.freeShippingThreshold),
    standardShippingFee: price(commerce.standardShippingFee),
    expressShippingFee: price(commerce.expressShippingFee),
    codFee: price(commerce.codFee),
    codMaxOrder: price(commerce.codMaxOrder),
    giftWrapFee: price(commerce.giftWrapFee),
    freeSampleThreshold: price(commerce.freeSampleThreshold),
    email: contact.email,
    phone: contact.phone,
    whatsapp: contact.whatsapp,
  };
  return text.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}
