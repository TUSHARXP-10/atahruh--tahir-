import { expect, test } from "@playwright/test";
import { prepare } from "./helpers";

/** Every public page loads in English and Arabic, with a heading and no script errors. */
const PAGES = [
  "/",
  "/shop",
  "/collections/attars",
  "/products/oud-al-layl",
  "/therapies",
  "/rituals",
  "/gifting",
  "/discovery-set",
  "/fragrance-quiz",
  "/our-story",
  "/journal",
  "/journal/the-art-of-arabic-attars",
  "/faq",
  "/contact",
  "/policies/shipping",
  "/policies/returns",
  "/policies/privacy",
  "/policies/terms",
  "/track-order",
  "/concierge",
  "/search?q=oud",
];

for (const locale of ["", "/ar"]) {
  for (const path of PAGES) {
    test(`${locale || "/en"} ${path} renders`, async ({ page }) => {
      const errors = await prepare(page);
      const res = await page.goto(`${locale}${path === "/" && locale ? "" : path}`, { waitUntil: "domcontentloaded" });
      expect(res?.status(), "HTTP status").toBe(200);
      await expect(page.locator("h1, h2").first()).toBeVisible();
      if (locale) await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
      await page.waitForLoadState("load");
      await page.waitForTimeout(500);
      expect(errors, "page errors").toEqual([]);
    });
  }
}

test("unknown pages show the 404", async ({ page }) => {
  await prepare(page);
  const res = await page.goto("/this-page-does-not-exist");
  expect(res?.status()).toBe(404);
});

test("SEO files are served", async ({ request }) => {
  for (const url of ["/sitemap.xml", "/robots.txt", "/manifest.webmanifest", "/og/site", "/og/product/oud-al-layl"]) {
    const res = await request.get(url);
    expect(res.status(), url).toBe(200);
  }
});

test("unknown admin pages show the admin 404", async ({ page }) => {
  await prepare(page);
  const res = await page.goto("/admin/this-page-does-not-exist");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: /doesn’t exist/ })).toBeVisible();
});

test("cookie banner asks once and can be reopened", async ({ page }) => {
  await prepare(page, { cookieChoice: false });
  await page.goto("/");
  const banner = page.getByRole("dialog", { name: "Your privacy" });
  await expect(banner).toBeVisible();
  await banner.getByRole("button", { name: "Essential only" }).click();
  await expect(banner).toBeHidden();
  expect((await page.context().cookies()).find((c) => c.name === "aar_consent")?.value).toBe("essential");

  await page.reload();
  await expect(page.locator("footer")).toBeVisible();
  await expect(banner).toBeHidden();
  await page.getByRole("button", { name: "Cookie settings" }).click();
  await expect(banner).toBeVisible();
  await banner.getByRole("button", { name: "Accept all" }).click();
  await expect(banner).toBeHidden();
  expect((await page.context().cookies()).find((c) => c.name === "aar_consent")?.value).toBe("all");
});

test("security headers are sent", async ({ request }) => {
  const res = await request.get("/");
  const h = res.headers();
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(h["x-frame-options"]).toBe("SAMEORIGIN");
  expect(h["content-security-policy"]).toContain("frame-ancestors 'self'");
});
