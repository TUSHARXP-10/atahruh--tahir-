import { expect, test } from "@playwright/test";
import { fillCheckout, prepare } from "./helpers";

test("cash-on-delivery order, then the WhatsApp hand-off", async ({ page }) => {
  const errors = await prepare(page);
  let whatsapp: URL | null = null;
  // Don't actually leave for WhatsApp — capture where we were sent
  await page.route("https://wa.me/**", (route) => {
    whatsapp = new URL(route.request().url());
    return route.fulfill({ status: 200, contentType: "text/html", body: "<h1>WhatsApp</h1>" });
  });

  await page.goto("/products/rose-sahar", { waitUntil: "networkidle" });
  await page.getByRole("radio", { name: /Attar/ }).first().click();
  await expect(page).toHaveURL(/form=attar/);
  await page.getByRole("button", { name: /^Add to cart$/i }).first().click();
  await page.getByRole("dialog").getByRole("link", { name: /Secure checkout/i }).click();
  await page.waitForURL("**/checkout");

  await fillCheckout(page);
  await page.getByRole("radio", { name: /Cash on delivery/i }).click();
  await page.getByRole("button", { name: /Place order/i }).click();
  await page.waitForURL(/\/orders\/AAR-.*placed=1/);
  await expect(page.getByRole("heading", { name: /Thank you/ })).toBeVisible();
  await expect(page.getByText(/Opening WhatsApp in/)).toBeVisible();

  await page.waitForURL(/wa\.me/, { timeout: 15_000 });
  const sent = whatsapp as URL | null;
  expect(sent?.pathname).toBe("/918108156705");
  expect(sent?.searchParams.get("text")).toMatch(/Rose Sahar — Attar/);
  expect(errors).toEqual([]);
});
