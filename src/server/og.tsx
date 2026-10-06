import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { db } from "@/lib/db";
import { site } from "@/lib/site";

/*
 * Branded 1200×630 social cards (WhatsApp, Instagram, Google). Photos are
 * re-encoded to JPEG data URLs so the renderer never meets an unsupported format.
 */

export const OG_SIZE = { width: 1200, height: 630 };

const fontsDir = path.join(process.cwd(), "src/fonts/og");
let fonts: Promise<{ name: string; data: Buffer; weight: 500; style: "normal" }[]> | null = null;
function loadFonts() {
  fonts ??= Promise.all([
    readFile(path.join(fontsDir, "cormorant-500.woff")).then((data) => ({ name: "Cormorant", data, weight: 500 as const, style: "normal" as const })),
    readFile(path.join(fontsDir, "cinzel-500.woff")).then((data) => ({ name: "Cinzel", data, weight: 500 as const, style: "normal" as const })),
    readFile(path.join(fontsDir, "manrope-500.woff")).then((data) => ({ name: "Manrope", data, weight: 500 as const, style: "normal" as const })),
    // Extended set: carries the ₹ sign
    readFile(path.join(fontsDir, "manrope-ext-500.woff")).then((data) => ({ name: "ManropeExt", data, weight: 500 as const, style: "normal" as const })),
  ]);
  return fonts;
}

/** A site image (/images/… or /media/…) as a JPEG data URL, cropped to the box. */
export async function imageData(url: string | null | undefined, width: number, height: number) {
  if (!url) return null;
  try {
    let input: Buffer | null = null;
    if (url.startsWith("/images/")) {
      // Public files aren't bundled with serverless functions on some hosts — fetch them from the site then
      input = await readFile(path.join(process.cwd(), "public", url)).catch(async () => {
        const res = await fetch(new URL(url, site.url), { signal: AbortSignal.timeout(8_000) });
        return res.ok ? Buffer.from(await res.arrayBuffer()) : null;
      });
    }
    else if (url.startsWith("/media/")) {
      const id = url.replace(/^\/media\//, "").replace(/\.webp$/, "");
      const media = await db.media.findUnique({ where: { id }, select: { data: true } });
      input = media ? Buffer.from(media.data) : null;
    }
    if (!input) return null;
    const jpeg = await sharp(input).resize(width, height, { fit: "cover", position: "attention" }).jpeg({ quality: 82 }).toBuffer();
    return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  } catch {
    return null;
  }
}

const GOLD = "#c9a55c";

let word: Promise<string> | null = null;
/** The logo's wordmark (ivory + gold) as a PNG data URL. */
function wordmark() {
  word ??= readFile(path.join(process.cwd(), "public/brand/word-on-dark.png")).then((b) => `data:image/png;base64,${b.toString("base64")}`);
  return word;
}

/** The shared card: photo on the left, brand and copy on the right. Served as JPEG (~100 KB) so WhatsApp shows the preview. */
export async function ogCard({ photo, eyebrow, title, subtitle, footer, accent = GOLD }: { photo: string | null; eyebrow: string; title: string; subtitle?: string; footer?: string; accent?: string }) {
  const [image, logo] = await Promise.all([imageData(photo, 520, 630), wordmark()]);
  const png = new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: "#0b0907", color: "#f4ecdd" }}>
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} width={520} height={630} alt="" style={{ objectFit: "cover" }} />
        ) : (
          <div style={{ display: "flex", width: 520, height: 630, background: `linear-gradient(160deg, ${accent}, #15100c)` }} />
        )}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, padding: "64px 64px 56px", borderLeft: `2px solid ${GOLD}55` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} width={300} height={52} alt="" />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontFamily: "Manrope, ManropeExt", fontSize: 20, letterSpacing: 6, textTransform: "uppercase", color: GOLD }}>{eyebrow}</div>
            <div style={{ display: "flex", fontFamily: "Cormorant", fontSize: title.length > 26 ? 64 : 82, lineHeight: 1.02, marginTop: 18 }}>{title}</div>
            {subtitle ? <div style={{ display: "flex", fontFamily: "Manrope, ManropeExt", fontSize: 26, lineHeight: 1.4, color: "#b8ad9b", marginTop: 20 }}>{subtitle}</div> : null}
          </div>
          <div style={{ display: "flex", fontFamily: "Manrope, ManropeExt", fontSize: 22, color: "#e8cd92" }}>{footer ?? "aayatalruh.com"}</div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await loadFonts() },
  );
  const jpeg = await sharp(Buffer.from(await png.arrayBuffer())).jpeg({ quality: 84, mozjpeg: true }).toBuffer();
  return new Response(new Uint8Array(jpeg), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" },
  });
}
