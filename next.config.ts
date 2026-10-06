import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Same rule as src/lib/site.ts: an explicit address, else the production address Vercel provides
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "");
/** A real HTTPS deployment (not localhost): turns on HSTS and the HTTP → HTTPS redirect. */
const httpsSite = siteUrl.startsWith("https://") && !/localhost|127\.0\.0\.1/.test(siteUrl);

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Only framing/plugin rules here; scripts stay open for the Paytm checkout and analytics tags
  { key: "Content-Security-Policy", value: `frame-ancestors 'self'; base-uri 'self'; object-src 'none'${httpsSite ? "; upgrade-insecure-requests" : ""}` },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  ...(httpsSite ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }] : []),
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    // Hosts behind a proxy that still accept plain HTTP (Vercel already redirects on its own)
    return httpsSite
      ? [{ source: "/:path*", has: [{ type: "header", key: "x-forwarded-proto", value: "http" }], destination: `${siteUrl.replace(/\/$/, "")}/:path*`, permanent: true }]
      : [];
  },
  // Share-image routes read their fonts from disk at runtime
  outputFileTracingIncludes: {
    "/og/**": ["./src/fonts/og/**/*", "./public/brand/word-on-dark.png"],
  },
  images: {
    // WebP only: AVIF encodes are slow and can stall on some photo sizes; every current browser supports WebP
    formats: ["image/webp"],
    qualities: [60, 75, 80, 90],
    // Fewer widths and a long cache keep image transformations well inside Vercel's free
    // allowance (each re-optimisation counts). Photos never change in place — a new upload
    // gets a new address — so caching for a month is safe.
    deviceSizes: [640, 828, 1200, 1920, 2048],
    imageSizes: [64, 128, 256, 384],
    minimumCacheTTL: 2_678_400, // 31 days
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "motion"],
    // NEXT_BUILD_CPUS caps build workers (each opens database connections) — useful
    // when building against the small local `prisma dev` database
    ...(process.env.NEXT_BUILD_CPUS ? { cpus: Number(process.env.NEXT_BUILD_CPUS) } : {}),
  },
};

export default withNextIntl(nextConfig);
