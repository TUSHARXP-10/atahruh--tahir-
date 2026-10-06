import { formatPrice } from "@/lib/money";

const TZ = "Asia/Kolkata";

export const money = (paise: number) => formatPrice(paise, "en");

export function fmtDate(d: Date | string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: TZ }).format(new Date(d));
}

export function fmtDateTime(d: Date | string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: TZ }).format(new Date(d));
}

/** "3 min ago" style for recent activity, falling back to a date. */
export function fmtAgo(d: Date | string) {
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)} d ago`;
  return fmtDate(d);
}

export function addressLines(raw: unknown) {
  const a = (raw ?? {}) as Record<string, string | undefined>;
  return {
    name: a.name ?? "",
    phone: a.phone ?? "",
    lines: [a.line1, a.line2, a.landmark, [a.city, a.state].filter(Boolean).join(", ") + (a.pincode ? ` ${a.pincode}` : "")].filter((l): l is string => !!l && !!l.trim()),
  };
}
