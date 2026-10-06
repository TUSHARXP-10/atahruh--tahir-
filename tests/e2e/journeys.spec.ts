import { expect, test } from "@playwright/test";
import { prepare } from "./helpers";

test("Fragrance Score quiz → results → Discovery Set in the bag", async ({ page }) => {
  const errors = await prepare(page);
  const choose = async (name: RegExp) => {
    await page.getByRole("radio", { name }).or(page.getByRole("button", { name })).first().click();
    await page.waitForTimeout(450);
  };
  await page.goto("/fragrance-quiz", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Begin/ }).click();
  await choose(/For me \(her\)/);
  await choose(/^Romantic/);
  await page.getByRole("button", { name: /Continue/ }).click();
  await choose(/^Floral/);
  await page.getByRole("button", { name: /Continue/ }).click();
  await choose(/A gentle presence/);
  await page.getByRole("button", { name: /Skip/ }).click();
  await choose(/All year round/);
  await choose(/Pure attar oil/);
  await choose(/No limit/);

  await page.waitForURL("**/fragrance-quiz/r/**");
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.getByText(/% match/).first()).toBeVisible();

  await page.getByRole("link", { name: /Build my discovery set/ }).click();
  await page.waitForURL("**/discovery-set**");
  while (!(await page.getByText(/5 of 5 chosen/).isVisible())) {
    await page.getByRole("button", { name: "Add to tray" }).first().click();
  }
  await page.getByRole("button", { name: /Add to bag/ }).click();
  await expect(page.getByRole("dialog").getByText(/Discovery Set/).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("create an account, sign out and sign back in", async ({ page }) => {
  await prepare(page);
  const email = `e2e+${Date.now()}@example.com`;
  await page.goto("/register", { waitUntil: "networkidle" });
  await page.fill("#name", "E2E Customer");
  await page.fill("#r-email", email);
  await page.fill("#r-phone", "9812345678");
  await page.fill("#r-password", "correct-horse-42");
  await page.getByRole("button", { name: /^Create account$/ }).click();
  await page.waitForURL("**/account");

  await page.getByRole("button", { name: /Sign out/i }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/account"));

  await page.goto("/login", { waitUntil: "networkidle" });
  await page.fill("#email", email);
  await page.fill("#password", "correct-horse-42");
  await page.getByRole("button", { name: /^Sign in$/i }).click();
  await page.waitForURL("**/account");
});

test("contact form message reaches the admin inbox", async ({ page }) => {
  await prepare(page);
  await page.goto("/contact", { waitUntil: "networkidle" });
  await page.fill("#c-name", "E2E Visitor");
  await page.fill("#c-email", "e2e.visitor@example.com");
  await page.fill("#c-message", "Do you make custom attar blends for weddings?");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText(/Your message is with us/)).toBeVisible();
});
