import { describe, expect, it } from "vitest";
import { localePath, metaDescription, pageMetadata } from "@/lib/seo";

describe("localePath", () => {
  it("keeps English unprefixed and prefixes Arabic", () => {
    expect(localePath("en", "/")).toBe("/");
    expect(localePath("en", "/shop")).toBe("/shop");
    expect(localePath("ar", "/")).toBe("/ar");
    expect(localePath("ar", "/products/oud")).toBe("/ar/products/oud");
  });
});

describe("metaDescription", () => {
  it("leaves short copy alone and flattens whitespace and markdown", () => {
    expect(metaDescription("  A **rich**\n oud.  ")).toBe("A rich oud.");
  });

  it("cuts long copy on a word boundary with an ellipsis", () => {
    const text = "Smoky oud and rose ".repeat(20);
    const out = metaDescription(text);
    expect(out.length).toBeLessThanOrEqual(158);
    expect(out.endsWith("…")).toBe(true);
    expect(out).not.toMatch(/\s…$/);
    expect(text.startsWith(out.slice(0, -1))).toBe(true);
  });
});

describe("pageMetadata", () => {
  it("gives each page its own canonical and every language alternate", () => {
    const meta = pageMetadata({ locale: "ar", path: "/track-order", title: "Track" });
    expect(meta.alternates?.canonical).toBe("/ar/track-order");
    expect(meta.alternates?.languages).toEqual({ en: "/track-order", ar: "/ar/track-order", "x-default": "/track-order" });
    expect(meta.openGraph).toMatchObject({ url: "/ar/track-order", locale: "ar_AE", alternateLocale: ["en_IN"] });
  });

  it("falls back to the branded share card and supports article pages", () => {
    const meta = pageMetadata({ locale: "en", path: "/journal/x", title: "X", article: { publishedTime: "2026-01-01" } });
    expect(meta.openGraph).toMatchObject({ type: "article", publishedTime: "2026-01-01", images: [{ url: "/og/site" }] });
  });

  it("can skip the brand suffix for the home page", () => {
    expect(pageMetadata({ locale: "en", path: "/", title: "Home", absoluteTitle: true }).title).toEqual({ absolute: "Home" });
  });
});
