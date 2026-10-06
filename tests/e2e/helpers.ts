import { expect, type Page } from "@playwright/test";

/** Skip the first-visit intro and the cookie banner, and collect page errors for a test. */
export async function prepare(page: Page, { cookieChoice = true }: { cookieChoice?: boolean } = {}) {
  if (cookieChoice) {
    const url = new URL(process.env.E2E_BASE_URL ?? "http://localhost:3000");
    await page.context().addCookies([{ name: "aar_consent", value: "essential", domain: url.hostname, path: "/" }]);
  }
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem("aar-intro", "1");
    } catch {}
  });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error" && !/Download the React DevTools|favicon/.test(m.text())) errors.push(m.text());
  });
  return errors;
}

/** Sign in with the seeded admin account (SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD). */
export async function signInAsAdmin(page: Page) {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) throw new Error("Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD to run admin tests");
  await page.goto("/login?next=/admin", { waitUntil: "networkidle" });
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.getByRole("button", { name: /^Sign in$/i }).click();
  await page.waitForURL((u) => u.pathname.startsWith("/admin"));
}

/** The newest admin toast (Sonner lists the latest first). */
export async function lastToast(page: Page) {
  const toast = page.locator("[data-sonner-toast]").first();
  await expect(toast).toBeVisible();
  return (await toast.textContent())?.trim() ?? "";
}

/** Fill the checkout address with a test buyer in Mumbai. */
export async function fillCheckout(page: Page) {
  await page.fill("#email", "e2e.buyer@example.com");
  await page.fill("#name", "E2E Buyer");
  await page.fill("#phone", "9876543210");
  await page.fill("#line1", "12 Marine Drive, Sea View Apartments");
  await page.fill("#pincode", "400020");
  await expect(page.locator("#city")).not.toHaveValue("", { timeout: 15_000 }).catch(() => page.fill("#city", "Mumbai"));
  if (!(await page.inputValue("#state"))) await page.selectOption("#state", "Maharashtra");
}
