import "server-only";
import type { OrderStatus, Prisma } from "@/generated/prisma/client";

/** Order list tabs → the statuses each one covers. */
export const ORDER_TABS = [
  { key: "all", label: "All", statuses: null },
  { key: "pack", label: "To pack", statuses: ["CONFIRMED"] },
  { key: "packed", label: "Packed", statuses: ["PACKED"] },
  { key: "transit", label: "In transit", statuses: ["SHIPPED", "OUT_FOR_DELIVERY"] },
  { key: "delivered", label: "Delivered", statuses: ["DELIVERED"] },
  { key: "unpaid", label: "Awaiting payment", statuses: ["PENDING"] },
  { key: "closed", label: "Cancelled & returns", statuses: ["CANCELLED", "RETURNED", "REFUNDED"] },
] as const satisfies readonly { key: string; label: string; statuses: readonly OrderStatus[] | null }[];

export type OrderTab = (typeof ORDER_TABS)[number]["key"];

export function orderWhere({ tab, q, from, to }: { tab?: string; q?: string; from?: string; to?: string }): Prisma.OrderWhereInput {
  const t = ORDER_TABS.find((x) => x.key === tab) ?? ORDER_TABS[0];
  const where: Prisma.OrderWhereInput = {};
  if (t.statuses) where.status = { in: [...t.statuses] };
  const query = q?.trim();
  if (query) {
    where.OR = [
      { number: { contains: query, mode: "insensitive" } },
      { email: { contains: query, mode: "insensitive" } },
      { phone: { contains: query.replace(/\s/g, "") } },
      { shippingAddress: { path: ["name"], string_contains: query } },
      { trackingNumber: { contains: query, mode: "insensitive" } },
    ];
  }
  const range: Prisma.DateTimeFilter = {};
  if (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) range.gte = new Date(`${from}T00:00:00+05:30`);
  if (to && /^\d{4}-\d{2}-\d{2}$/.test(to)) range.lte = new Date(`${to}T23:59:59.999+05:30`);
  if (range.gte || range.lte) where.createdAt = range;
  return where;
}

/** Search params are strings or arrays; admin lists only ever use the first value. */
export function first(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export function pageOf(v: string | string[] | undefined) {
  const n = Number.parseInt(first(v) ?? "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}
