# Putting Aayat al-Ruh live

This guide takes the site from this repository to a live domain with real payments. It assumes **Vercel** for hosting and **Neon** for the database (both have free starting tiers and Indian regions); any Node.js 20 host with PostgreSQL works the same way.

Allow about half a day, plus Paytm’s own approval time.

---

## 1. What you need first

| Account | Why | Notes |
|---|---|---|
| A domain (e.g. `aayatalruh.com`) | The website address | Any registrar |
| [Vercel](https://vercel.com) | Runs the website | Connect the Git repository |
| [Neon](https://neon.tech) | PostgreSQL database | Choose region **AWS Asia Pacific (Mumbai)** |
| **Paytm for Business** | Online payments | Needs business KYC and **Payment Gateway** enabled for a website |
| [Resend](https://resend.com) | Order and sign-in emails | Verify the domain with DNS records |
| Anthropic API key *(optional)* | AI Scent Concierge | [console.anthropic.com](https://console.anthropic.com) |
| Google Cloud OAuth *(optional)* | “Sign in with Google” | |

---

## 2. Create the database

1. In Neon, create a project in the Mumbai region.
2. Copy the **pooled** connection string — it looks like `postgresql://user:password@ep-…-pooler.ap-south-1.aws.neon.tech/neondb?sslmode=require`.
3. From your computer, apply the database structure and load the catalogue **once**:

Point your terminal at the Neon database, and choose the first admin login (use a long, unique password):

```bash
# PowerShell                                         # bash / macOS
$env:DATABASE_URL="postgresql://…"                   export DATABASE_URL="postgresql://…"
$env:SEED_ADMIN_EMAIL="you@yourdomain.com"           export SEED_ADMIN_EMAIL="you@yourdomain.com"
$env:SEED_ADMIN_PASSWORD="a-long-unique-password"    export SEED_ADMIN_PASSWORD="a-long-unique-password"
```

Then:

```bash
pnpm db:deploy     # create the tables
pnpm db:seed       # catalogue, content and the admin login
```

The seed creates the catalogue, collections, journal, FAQ and policies, coupons and the first admin login. It refuses to run again on a live database that has products, so the client’s edits are never overwritten. Demo reviews, testimonials and the Our Story numbers are stored but **hidden on the live site** until replaced (Admin → Launch checklist).

---

## 3. Environment variables

Set these in **Vercel → Project → Settings → Environment Variables** (Production). They are read when the site builds, so redeploy after changing them.

| Variable | Value |
|---|---|
| `DATABASE_URL` | Neon pooled connection string |
| `NEXT_PUBLIC_SITE_URL` | `https://aayatalruh.com` (your domain, no trailing slash) |
| `BETTER_AUTH_URL` | Same as above |
| `BETTER_AUTH_SECRET` | Random secret: `openssl rand -base64 32` |
| `PAYTM_MID` · `PAYTM_MERCHANT_KEY` | From Paytm (step 6) |
| `PAYTM_ENV` | `staging` while testing, then `production` |
| `RESEND_API_KEY` · `EMAIL_FROM` | From Resend; e.g. `Aayat al-Ruh <orders@aayatalruh.com>` |
| `ANTHROPIC_API_KEY` | Optional — switches on the Concierge |
| `GOOGLE_CLIENT_ID` · `GOOGLE_CLIENT_SECRET` | Optional — switches on Google sign-in |
| `NEXT_PUBLIC_GA_ID` | Optional — Google Analytics 4 measurement ID (`G-…`) |
| `NEXT_PUBLIC_META_PIXEL_ID` | Optional — Meta Pixel ID (digits) for Instagram/Facebook ads |

Leave `SHADOW_DATABASE_URL`, `DATABASE_POOL_MAX`, `NEXT_BUILD_CPUS` and `DEMO_CONTENT` unset in production.

---

## 4. Deploy on Vercel

1. **Add New → Project**, import the repository. Vercel detects Next.js and pnpm; keep the default build command (`pnpm build`).
2. The region is already set to **Mumbai (bom1)** in `vercel.json`, so the site sits next to the database and its Indian customers — nothing to change.
3. Deploy. Open the `.vercel.app` address and check the homepage, a product and `/admin` (sign in with the seed admin).

## 5. Connect the domain

1. **Vercel → Settings → Domains**: add `aayatalruh.com` and `www.aayatalruh.com`, then create the DNS records Vercel shows at your registrar. HTTPS is automatic.
2. Make sure `NEXT_PUBLIC_SITE_URL` and `BETTER_AUTH_URL` match the final domain, and redeploy.

Search engines are blocked automatically until the site runs on an `https://` domain; after that `robots.txt` allows them and `/sitemap.xml` lists every page in both languages. Submit the sitemap in [Google Search Console](https://search.google.com/search-console).

## 6. Switch on Paytm payments

1. In the **Paytm for Business** dashboard, make sure *Payment Gateway (website)* is active for the business.
2. **Developer Settings → API Keys → Test**: copy the test **MID** and **Merchant Key**, set them in Vercel with `PAYTM_ENV=staging`, redeploy.
3. Place a test order with Paytm’s test payment details. The order should show **Paid** in Admin → Orders, and the customer should land on the confirmation page and be handed to WhatsApp.
4. **Developer Settings → Webhook URL**: set the *Payment Notification URL* to `https://aayatalruh.com/api/paytm/webhook`. It confirms payments that finish after the customer closes the tab (slow UPI approvals).
5. Replace the keys with the **Production** MID and key, set `PAYTM_ENV=production`, redeploy, and make one small real payment to confirm.

How it stays safe: the site never trusts what the browser reports. Every payment is confirmed by asking Paytm directly, and an order is only marked paid when the merchant, order number and exact amount all match. Refunds are issued in the Paytm dashboard and recorded in the admin.

Until Paytm keys are set, checkout simply offers cash on delivery.

## 7. Emails

1. In Resend, add the domain and create the DNS records it lists (SPF, DKIM). Wait for **Verified**.
2. Set `RESEND_API_KEY` and `EMAIL_FROM` (an address on the verified domain) and redeploy.
3. Place a test order — the confirmation email should arrive. Sign-in codes, status updates, back-in-stock alerts and contact-form messages use the same setup.

## 8. Optional extras

- **AI Scent Concierge** — set `ANTHROPIC_API_KEY` and redeploy; the gold “Scent Concierge” button and `/concierge` appear. It uses Claude Opus 5 with a server-side safety fallback, answers only from the live catalogue and store policies, and never gives medical advice. `CONCIERGE_MODEL` and `CONCIERGE_EFFORT` (`low`/`medium`/`high`) change the model and depth; set a monthly spend limit in the Anthropic console.
- **Analytics** — create a GA4 property (Admin → Data streams → Web) and set `NEXT_PUBLIC_GA_ID`; for Instagram/Facebook ads also set `NEXT_PUBLIC_META_PIXEL_ID`. Redeploy. The tags load **only after a visitor taps “Accept all”** in the cookie banner, and send page views plus `view_item`, `add_to_cart`, `begin_checkout` and `purchase` (with order number and value in ₹). In GA4, mark `purchase` as a key event.
- **Google sign-in** — create an OAuth client (Web) in Google Cloud with the redirect URI `https://aayatalruh.com/api/auth/callback/google`, set the two variables, redeploy.

### Security built in

HTTPS is enforced: when `NEXT_PUBLIC_SITE_URL` starts with `https://`, plain-HTTP requests are redirected and browsers are told to always use HTTPS (HSTS). Every page also sends `nosniff`, a strict referrer policy and anti-framing headers. Secret keys (Paytm, Resend, Anthropic, auth) are only ever read on the server — only the `NEXT_PUBLIC_…` values above reach the browser, and those are not secret. Never put a secret in a `NEXT_PUBLIC_` variable.

## 9. Before announcing the launch

Open **Admin → Launch checklist**. It checks payments, email, domain, logo, contact numbers, social links, GST details and real product photos, and offers one-click removal of demo content and test orders. In particular:

- **Settings**: business name, GSTIN and registered address (printed on invoices), contact details, social links, shipping fees.
- **Settings → Admin team**: add the owner’s own account, then retire or re-password the seed admin.
- **FAQ & policies**: have the policy text reviewed by the client’s lawyer or CA; prices and contact details inside them fill in from Settings automatically.
- **Products**: upload real photos in each product (they are compressed automatically and stored in the database).
- **Homepage → Our Story numbers**: enter real figures and mark them real, or leave them hidden.

---

## Updating the site later

- **Code changes**: push to the main branch — Vercel builds and deploys. If the change includes a new migration in `prisma/migrations`, run `pnpm db:deploy` against the production `DATABASE_URL` first.
- **New content blocks** shipped by a code change: `pnpm db:content` adds them without touching anything the client edited.
- **Everything else** (products, prices, stock, photos, coupons, pages, homepage) is done in `/admin` and appears on the site immediately.

## Backups

Neon keeps point-in-time history (restore any moment within your plan’s window from the Neon console). Uploaded photos live in the same database, so one backup covers everything. Order and customer CSVs can be exported from Admin → Orders and Admin → Customers.

## Troubleshooting

| Symptom | Check |
|---|---|
| Checkout shows only cash on delivery | `PAYTM_MID` / `PAYTM_MERCHANT_KEY` missing — set them and redeploy |
| Payments stay “pending” | Paytm webhook URL (step 6.4); Admin → order → *Check with Paytm* re-asks Paytm |
| No emails arrive | Resend domain verified? `EMAIL_FROM` on that domain? Check Resend’s logs |
| Can’t sign in after moving domains | `BETTER_AUTH_URL` and `NEXT_PUBLIC_SITE_URL` must be the exact live URL |
| Concierge button missing | `ANTHROPIC_API_KEY` set, then redeployed |
| Admin edits don’t show | They should be instant; hard-refresh the page. Settings changes can take up to a minute on cached pages |
