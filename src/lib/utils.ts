import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { site } from "./site";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Pick the Arabic field when the locale is Arabic and the translation exists. */
export function tr<T extends string | null | undefined>(
  locale: string,
  en: T,
  ar?: string | null,
): string {
  if (locale === "ar" && ar) return ar;
  return en ?? "";
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function absoluteUrl(path = "/") {
  return new URL(path, site.url).toString();
}
