import { expect, test } from "@playwright/test";
import { lastToast, prepare, signInAsAdmin } from "./helpers";

test("signed-out visitors are sent to sign in", async ({ page }) => {
  await prepare(page);
  await page.goto("/admin/orders");
  await expect(page).toHaveURL(/\/login\?next=%2Fadmin%2Forders/);
});

test("admin API refuses anonymous requests", async ({ request }) => {
  expect((await request.get("/api/admin/orders/export")).status()).toBe(401);
  expect((await request.post("/api/admin/upload", { multipart: { files: { name: "x.png", mimeType: "image/png", buffer: Buffer.from("x") } } })).status()).toBe(401);
});

test.describe("signed in as admin", () => {
  test.skip(!process.env.SEED_ADMIN_EMAIL, "needs SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD");

  test("every admin section opens", async ({ page }) => {
    const errors = await prepare(page);
    await signInAsAdmin(page);
    for (const path of ["/admin", "/admin/orders", "/admin/products", "/admin/inventory", "/admin/collections", "/admin/coupons", "/admin/customers", "/admin/messages", "/admin/reviews", "/admin/homepage", "/admin/pages", "/admin/journal", "/admin/testimonials", "/admin/media", "/admin/settings", "/admin/launch"]) {
      const res = await page.goto(path, { waitUntil: "networkidle" });
      expect(res?.status(), path).toBe(200);
      await expect(page.locator("h1").first(), path).toBeVisible();
    }
    expect(errors).toEqual([]);
  });

  test("edit a product and see it on the store, then revert", async ({ page, context }) => {
    await prepare(page);
    await signInAsAdmin(page);
    await page.goto("/admin/products?q=Oud%20al-Layl", { waitUntil: "networkidle" });
    await page.getByRole("link", { name: "Oud al-Layl", exact: true }).click();
    const tagline = page.getByLabel("Tagline (English)");
    const original = await tagline.inputValue();

    await tagline.fill(`${original} (e2e)`);
    await page.getByRole("button", { name: /^Save$/ }).click();
    expect(await lastToast(page)).toContain("Product saved");

    const shop = await context.newPage();
    await shop.goto("/products/oud-al-layl", { waitUntil: "networkidle" });
    await expect(shop.getByText(`${original} (e2e)`)).toBeVisible();
    await shop.close();

    await page.reload({ waitUntil: "networkidle" });
    await page.getByLabel("Tagline (English)").fill(original);
    await page.getByRole("button", { name: /^Save$/ }).click();
    expect(await lastToast(page)).toContain("Product saved");
  });

  test("shipping an order requires a tracking number", async ({ page }) => {
    await prepare(page);
    await signInAsAdmin(page);
    await page.goto("/admin/orders?tab=pack", { waitUntil: "networkidle" });
    const first = page.locator("tbody a").first();
    test.skip(!(await first.count()), "no orders to pack");
    await first.click();
    await page.selectOption("#status", "SHIPPED");
    await page.getByRole("button", { name: /^Save$/ }).click();
    expect(await lastToast(page)).toContain("tracking number");
  });
});
