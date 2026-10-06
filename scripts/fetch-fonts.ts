/**
 * Self-hosts the brand typefaces (woff2) from the Fontsource CDN so builds
 * never depend on Google Fonts at compile time.  `pnpm fonts:fetch`
 */
import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";

const OUT = path.join(process.cwd(), "src", "fonts");
const CDN = "https://cdn.jsdelivr.net/fontsource/fonts";

const files: [family: string, file: string][] = [
  ...["300", "400", "500", "600"].flatMap((w) => [
    ["cormorant-garamond", `latin-${w}-normal`] as [string, string],
    ["cormorant-garamond", `latin-${w}-italic`] as [string, string],
  ]),
  ...["400", "500", "600"].map((w) => ["cinzel", `latin-${w}-normal`] as [string, string]),
  ["manrope:vf", "latin-wght-normal"],
  ["amiri", "arabic-400-normal"],
  ["amiri", "arabic-700-normal"],
  ...["300", "400", "500", "600"].map((w) => ["ibm-plex-sans-arabic", `arabic-${w}-normal`] as [string, string]),
  ["pinyon-script", "latin-400-normal"],
];

async function main() {
  for (const [family, file] of files) {
    const name = `${family.replace(":vf", "")}-${file}.woff2`;
    const dest = path.join(OUT, name);
    if (existsSync(dest)) continue;
    const res = await fetch(`${CDN}/${family}@latest/${file}.woff2`);
    if (!res.ok) throw new Error(`${family}/${file}: HTTP ${res.status}`);
    writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
    console.log("·", name);
  }
}
main();
