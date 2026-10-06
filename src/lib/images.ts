import { PHOTO_SOURCES, type PhotoKey } from "./photo-manifest";

export type { PhotoKey };

/**
 * Self-hosted stand-in photography (see src/lib/photo-manifest.ts and
 * `pnpm photos:fetch`). Next/Image handles resizing; `width` is kept for
 * call-site compatibility.
 */
export function photo(key: PhotoKey, _width?: number) {
  return `/images/library/${key}.webp`;
}

export const photoKeys = Object.keys(PHOTO_SOURCES) as PhotoKey[];
