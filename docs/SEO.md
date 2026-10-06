# Getting Aayat al-Ruh found on Google

The website does the technical SEO on its own. This guide covers what it already does, and the steps that need your accounts. Do the launch checklist once. The monthly routine is what gets the site ranking over time.

## What the site already does

| | |
|---|---|
| Page titles and descriptions | Every page has its own, written for search: "Luxury Perfumes & Pure Attars Online in India", plus product, collection and article pages built from their names and copy. Product pages use the SEO title and description from **Admin → Products → SEO** when you fill them in. |
| One address per page | Each page tells Google its one true address (its *canonical*), so filtered or shared links never compete with the real page. |
| English + Arabic | Every page links its English and Arabic versions, so Google shows Arabic speakers the Arabic page and everyone else the English one. |
| Rich results | Products carry price per size, stock, star rating (real reviews only), delivery time and the 7-day return policy. Google can show these right in the results. The store, website search, collections, articles, FAQ and breadcrumbs are described too. |
| Sitemap | `/sitemap.xml` lists every product, collection, article and page in both languages, with product photos, and refreshes every hour. |
| Private pages | Checkout, account, orders, wishlist, search results and the admin are kept out of Google. |
| Share cards | Links shared on WhatsApp, Instagram, Facebook and X show a branded image with the product name and price. |
| Speed and mobile | Images are compressed and sized per screen. The pages work on phones, which is how Google ranks them. |

## Launch checklist (one time, about an hour)

1. **Use your own domain.** Connect `aayatalruh.com` in Vercel (see [DEPLOYMENT.md](DEPLOYMENT.md#5-connect-the-domain)). A `.vercel.app` address can rank, but it can't build lasting trust, and moving later resets some of that progress.
2. **Google Search Console.** Go to [search.google.com/search-console](https://search.google.com/search-console) → *Add property* → **Domain** → enter `aayatalruh.com` → add the TXT record it shows at your domain registrar. (Or pick *URL prefix* → *HTML tag*, copy the code inside `content="…"` into Vercel as `GOOGLE_SITE_VERIFICATION`, redeploy and click *Verify*.)
   Then: **Sitemaps** → enter `sitemap.xml` → *Submit*. Use **URL inspection → Request indexing** for the home page, `/shop` and your top 5 products.
3. **Bing Webmaster Tools.** Go to [bing.com/webmasters](https://www.bing.com/webmasters) → *Import from Google Search Console* (one click). Bing also feeds ChatGPT search and DuckDuckGo. If you verify with the meta tag instead, its code goes in `BING_SITE_VERIFICATION`.
4. **Google Merchant Center (free listings).** This is the biggest quick win for a shop. Go to [merchants.google.com](https://merchants.google.com) → add your business → verify the website (it reuses Search Console) → *Products → Add products → Automatically from your website*. Google reads the product data the site already publishes, and your perfumes can appear free in the **Shopping** tab, Images and Maps. Set shipping (free over ₹999, ₹99 below) and returns (7 days) to match your policies.
5. **Google Business Profile.** Go to [business.google.com](https://business.google.com) → add *Aayat al-Ruh*, category **Perfume store**, with your Mumbai service area, phone, WhatsApp and website. Add 10+ real photos. This puts you on Maps and in "attar shop near me" searches.
6. **Real social links.** In **Admin → Settings → Social links**, replace the placeholder Instagram, Facebook, YouTube and Pinterest links with your real profiles. Google uses them to recognise the brand. Put the website link in each profile's bio.
7. **Real photos.** In **Admin → Products**, upload your own product photography and untick *Show drawn bottle instead of photos*. Fill in each photo's alt text, e.g. "Oud al-Layl attar 12 ml in a gold glass bottle". Image search is a real source of perfume shoppers.

## Monthly routine (what actually moves rankings)

**Ask for reviews.** A few days after each delivery, message the customer on WhatsApp with the product's page and ask them to leave a review there. Real reviews show as stars in Google, and stars lift click-through. Never post fake reviews: Google removes the stars and can penalise the site.

**Write 2 Journal articles a month** (Admin → Journal), each 800–1,500 words, answering what people actually search for. Link from each article to 2–4 products. Topics with real search demand in India:

- Best attars for men in India (and for women) — long-lasting picks by budget
- Attar vs perfume: which lasts longer?
- How to apply attar so it lasts all day
- What is oud? A beginner's guide to oud attar
- Best perfumes for Eid / Ramadan gifting
- Alcohol-free perfumes: are attars halal?
- Summer vs winter fragrances for Indian weather
- Perfume gift sets under ₹2,000 / ₹5,000
- Mukhallat, musk, amber, rose: Arabic attar notes explained
- Aromatherapy oils for sleep, stress and headaches

Write the Arabic version as well when you can. Arabic perfume searches have far less competition.

**Write product copy that names what people search for.** Use "oud attar", "alcohol-free", "long-lasting", "for men" and "gift" where they're true. Fill **Admin → Products → SEO** with a title under 60 characters and a description under 155. Give each collection a 2–3 sentence description.

**Earn links from other websites.** Links from other websites are Google's strongest trust signal. Ideas:
- Send samples to Indian fragrance YouTubers and Instagram creators, and ask them to link the product page.
- Get listed in gift guides (Diwali, Eid, Valentine's, Mother's Day). Pitch them 4–6 weeks before.
- Write to Indian lifestyle and wedding blogs with a story ("a Mumbai atelier reviving Kannauj attars").
- List the shop on Justdial, IndiaMART and Sulekha, with the website link and the same name, phone and address everywhere.

**Check Search Console monthly.** *Performance* shows the searches you appear for. Pages ranking at positions 5–20 are the ones to improve: add copy, an FAQ, and links from articles. *Pages* shows anything Google could not index.

## What to expect

A new shop usually appears for its brand name within 1–2 weeks of the sitemap being submitted. Category searches like "oud attar online" take 3–6 months of steady articles, reviews and links. No website setting can make that faster; anyone who promises page one in a week is selling something risky.
