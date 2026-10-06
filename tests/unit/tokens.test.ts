import { describe, expect, it } from "vitest";
import { commerceDefaults, site } from "@/lib/site";
import { fillTokens } from "@/lib/tokens";

const settings = { commerce: { ...commerceDefaults }, contact: { ...site.contact } };

describe("fillTokens", () => {
  it("fills fees and contact details from settings", () => {
    const text = fillTokens("Free above {freeShippingThreshold}; COD fee {codFee}. Write to {email}.", settings);
    expect(text).toBe(`Free above ₹999; COD fee ₹49. Write to ${site.contact.email}.`);
  });

  it("follows a changed setting", () => {
    const text = fillTokens("Free above {freeShippingThreshold}", { ...settings, commerce: { ...settings.commerce, freeShippingThreshold: 149_900 } });
    expect(text).toBe("Free above ₹1,499");
  });

  it("leaves unknown tokens untouched", () => {
    expect(fillTokens("Hello {name}", settings)).toBe("Hello {name}");
  });
});
