import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const live = /^https:\/\//.test(site.url) && !site.url.includes("localhost");
  return {
    // Keep staging and local copies out of search results
    rules: live
      ? {
          userAgent: "*",
          allow: "/",
          disallow: ["/admin", "/api/", "/checkout", "/account", "/orders/", "/wishlist", "/fragrance-quiz/r/", "/ar/checkout", "/ar/account", "/ar/orders/", "/ar/wishlist", "/ar/fragrance-quiz/r/"],
        }
      : { userAgent: "*", disallow: "/" },
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
