/**
 * Downloads the curated stand-in photography and self-hosts it as WebP.
 *
 *   pnpm photos:fetch          # only missing files
 *   pnpm photos:fetch --force  # re-download everything
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { PHOTO_SOURCES, photoPageUrl, photoSourceUrl, type PhotoKey } from "../src/lib/photo-manifest";

const OUT = path.join(process.cwd(), "public", "images", "library");
const force = process.argv.includes("--force");
mkdirSync(OUT, { recursive: true });

async function fetchOne(key: PhotoKey) {
  const file = path.join(OUT, `${key}.webp`);
  if (!force && existsSync(file)) return "skip";
  const res = await fetch(photoSourceUrl(key, 1800), { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`${key}: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await sharp(buf).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 80 }).toFile(file);
  return "ok";
}

async function main() {
  const keys = Object.keys(PHOTO_SOURCES) as PhotoKey[];
  let ok = 0;
  let skipped = 0;
  const failed: string[] = [];
  // small concurrency pool
  const queue = [...keys];
  await Promise.all(
    Array.from({ length: 8 }, async () => {
      while (queue.length) {
        const key = queue.shift()!;
        try {
          const r = await fetchOne(key);
          if (r === "ok") ok++;
          else skipped++;
        } catch (e) {
          failed.push(String(e));
        }
      }
    }),
  );

  const credits = [
    "# Photo credits",
    "",
    "Stand-in photography used until the client's own product photography is uploaded.",
    "All images are used under the Unsplash License or the Pexels License (free for commercial use).",
    "",
    ...keys.map((k) => `- \`${k}\` — ${photoPageUrl(k)}`),
    "",
  ].join("\n");
  writeFileSync(path.join(OUT, "CREDITS.md"), credits);

  console.log(`photos: ${ok} downloaded, ${skipped} already present, ${failed.length} failed`);
  if (failed.length) {
    console.error(failed.join("\n"));
    process.exit(1);
  }
}

main();
