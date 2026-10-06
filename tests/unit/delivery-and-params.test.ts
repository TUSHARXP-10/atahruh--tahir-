import { describe, expect, it } from "vitest";
import { activeFilterCount, paramsToFilter, parseCatalogParams, toQuery } from "@/lib/catalog-params";
import { estimateDelivery, isValidPincode } from "@/lib/delivery";
import { sizeLabel } from "@/lib/format";

describe("delivery", () => {
  it("validates Indian pincodes", () => {
    expect(isValidPincode("400020")).toBe(true);
    expect(isValidPincode("012345")).toBe(false);
    expect(isValidPincode("40002")).toBe(false);
  });

  it("estimates by zone", () => {
    expect(estimateDelivery("400020").zone).toBe("local");
    expect(estimateDelivery("110001").zone).toBe("metro");
    expect(estimateDelivery("744101")).toMatchObject({ zone: "remote", cod: false, express: false });
    expect(estimateDelivery("226001").zone).toBe("national");
  });
});

describe("catalog params", () => {
  it("parses and sanitises query strings", () => {
    const p = parseCatalogParams({ family: "oud,floral,nonsense", form: "ATTAR", sort: "price-asc", price: "bogus" });
    expect(p.family).toEqual(["OUD", "FLORAL"]);
    expect(p.form).toEqual(["ATTAR"]);
    expect(p.sort).toBe("price-asc");
    expect(p.price).toBeNull();
    expect(activeFilterCount(p)).toBe(3);
  });

  it("round-trips through the query string", () => {
    const p = parseCatalogParams({ mood: "CALM", price: "1000-2500" });
    expect(toQuery(p)).toEqual({ mood: "CALM", price: "1000-2500" });
    expect(paramsToFilter(p)).toMatchObject({ mood: ["CALM"], minPrice: 100_000, maxPrice: 250_000 });
  });
});

describe("sizeLabel", () => {
  it("localises units for Arabic", () => {
    expect(sizeLabel("50 ml", "ar")).toBe("50 مل");
    expect(sizeLabel("Gift box", "ar")).toBe("علبة هدية");
    expect(sizeLabel("50 ml", "en")).toBe("50 ml");
  });
});
