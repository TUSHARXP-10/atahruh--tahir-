import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/** Lets customers install the store as an app (Add to Home Screen). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: site.name,
    description: site.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b0907",
    theme_color: "#0b0907",
    categories: ["shopping", "lifestyle", "beauty"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Shop all", url: "/shop" },
      { name: "Fragrance Score", url: "/fragrance-quiz" },
      { name: "Track order", url: "/track-order" },
    ],
  };
}
