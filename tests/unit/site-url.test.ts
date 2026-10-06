import { afterEach, describe, expect, it, vi } from "vitest";

/** site.url is read once at import, so each case imports a fresh copy. */
async function siteUrlWith(env: Record<string, string>) {
  for (const key of ["NEXT_PUBLIC_SITE_URL", "VERCEL_PROJECT_PRODUCTION_URL", "NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL"]) vi.stubEnv(key, "");
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
  vi.resetModules();
  return (await import("@/lib/site")).site.url;
}

afterEach(() => vi.unstubAllEnvs());

describe("site.url", () => {
  it("is localhost when nothing is configured", async () => {
    expect(await siteUrlWith({})).toBe("http://localhost:3000");
  });

  it("uses Vercel's production address when NEXT_PUBLIC_SITE_URL isn't set", async () => {
    expect(await siteUrlWith({ VERCEL_PROJECT_PRODUCTION_URL: "aayat-al-ruh.vercel.app" })).toBe("https://aayat-al-ruh.vercel.app");
    expect(await siteUrlWith({ NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL: "aayatalruh.com" })).toBe("https://aayatalruh.com");
  });

  it("prefers an explicit NEXT_PUBLIC_SITE_URL, without a trailing slash", async () => {
    expect(await siteUrlWith({ NEXT_PUBLIC_SITE_URL: "https://shop.example.com/", VERCEL_PROJECT_PRODUCTION_URL: "x.vercel.app" })).toBe("https://shop.example.com");
  });
});
