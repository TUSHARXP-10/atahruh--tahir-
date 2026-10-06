# Aayat al-Ruh — website

The online house of **Aayat al-Ruh** (“Verses of the Soul”): fine perfumes, pure attars and natural therapy oils. English and Arabic storefront, Paytm and cash-on-delivery checkout, a full admin panel, the Fragrance Score quiz, a Discovery Set builder and an AI Scent Concierge.

To put the site live, follow **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**.

## What’s inside

| Area | Highlights |
|---|---|
| Storefront | Home, shop and collections with filters, product pages with the Perfume ⇄ Attar switch, search, wishlist, Journal, Rituals, Therapies, Gifting, Our Story, FAQ, policies, contact |
| Languages | English (`/`) and Arabic (`/ar`, right-to-left) everywhere |
| Checkout | Bag with coupons, gift wrap and free sample; Paytm (UPI, cards, net banking, wallets) and cash on delivery; pincode-based delivery estimates; GST-inclusive pricing |
| After an order | Confirmation email, WhatsApp hand-off to the store with the order details, order tracking page |
| Accounts | Email + password or email code, optional Google; orders, addresses, wishlist, saved scent profile |
| Experiences | Fragrance Score quiz with shareable results, Discovery Set builder, AI Scent Concierge (Claude) grounded in the live catalogue |
| Admin (`/admin`) | Dashboard, orders (status emails, tracking, GST invoices, CSV export), products (photos, sizes, prices, stock per form), inventory, collections, coupons, customers, messages, reviews, homepage, FAQ & policies, journal, testimonials, media library, settings, launch checklist |
| SEO | Sitemap with language alternates, robots rules, structured data, branded share images, installable app manifest |
| Privacy & security | Cookie consent banner (en/ar); Google Analytics 4 and Meta Pixel load only after consent, with ecommerce events; HTTPS enforcement + HSTS and security headers; honeypots and rate limits on every public form |

## Tech

Next.js 16 (App Router, React 19, Turbopack) · TypeScript · Tailwind CSS v4 · Prisma 7 + PostgreSQL (Supabase in production) · Better Auth · next-intl · Paytm Payment Gateway · Resend (email) · Anthropic SDK (Claude Opus 5) · sharp · Vitest + Playwright.

## Run it locally

Requirements: Node 20+, pnpm 10.

```bash
pnpm install                 # also generates the Prisma client
cp .env.example .env         # then set BETTER_AUTH_SECRET (openssl rand -base64 32)
pnpm db:start                # local Postgres via `prisma dev` (no Docker needed)
pnpm db:deploy               # apply migrations
pnpm db:seed                 # catalogue, content, coupons and the admin account
pnpm dev                     # http://localhost:3000  ·  admin: /admin
```

Without Paytm, Resend or Anthropic keys the site still runs: checkout offers cash on delivery only, emails are printed in the terminal, and the Concierge is hidden.

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` / `pnpm build` / `pnpm start` | Develop, build, serve the production build |
| `pnpm typecheck` · `pnpm lint` | TypeScript and ESLint |
| `pnpm test` | Unit tests (pricing, delivery, quiz scoring, Paytm checksums, settings placeholders) |
| `pnpm test:e2e` | Browser tests against a running site (`E2E_BASE_URL`, default `http://localhost:3000`) |
| `pnpm db:start` / `db:stop` | Start or stop the local database |
| `pnpm db:migrate` | Create a migration after changing `prisma/schema.prisma` (development) |
| `pnpm db:deploy` | Apply migrations (any environment) |
| `pnpm db:seed` | Rebuild the catalogue and demo content — refuses on a live database that has products |
| `pnpm db:content` | Add any missing homepage/page content blocks without touching edited ones |
| `pnpm db:studio` | Browse the database |
| `pnpm photos:fetch` / `fonts:fetch` | Re-download the stock photo library / brand fonts |

## Project map

```
prisma/                 schema, migrations, seed data (products, content, FAQ & policies)
messages/               en.json, ar.json — all storefront text
src/app/[locale]/       storefront pages (English and Arabic)
src/app/admin/          admin panel
src/app/api/            auth, Paytm callback & webhook, Concierge, admin uploads & exports
src/app/og/             share images · src/app/media/ uploaded photos
src/components/         UI by area (admin, home, product, checkout, concierge, …)
src/server/             server-only logic: queries, actions, payments, admin, concierge tools
src/lib/                shared helpers: pricing, delivery, quiz scoring, Paytm checksum, site settings
tests/unit · tests/e2e  Vitest and Playwright
```

Every admin page and admin action checks for an admin account on its own; editing in the admin refreshes the storefront immediately.
