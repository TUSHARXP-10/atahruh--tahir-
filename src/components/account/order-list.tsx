import { ChevronRight } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import { ProductVisual } from "@/components/product/product-visual";
import { Link } from "@/i18n/navigation";
import { formatPrice } from "@/lib/money";
import type { FormType } from "@/lib/types";
import { cn } from "@/lib/utils";

type Row = {
  number: string;
  status: string;
  total: number;
  createdAt: Date;
  items: { id: string; name: string; formType: string; accentColor: string | null; quantity: number }[];
};

export async function OrderList({ orders, locale }: { orders: Row[]; locale: string }) {
  const [t, format] = await Promise.all([getTranslations(), getFormatter()]);
  if (!orders.length) return <p className="rounded-sm border border-dashed border-gold/20 p-10 text-center text-smoke">{t("account.noOrders")}</p>;
  return (
    <ul className="space-y-3">
      {orders.map((o) => (
        <li key={o.number}>
          <Link href={`/orders/${o.number}`} className="group flex items-center gap-5 rounded-sm border border-gold/15 p-4 transition-colors hover:border-gold/40 sm:p-5">
            <div className="flex -space-x-3 rtl:space-x-reverse">
              {o.items.slice(0, 3).map((i) => (
                <div key={i.id} className="relative h-14 w-10 overflow-hidden rounded-t-full border border-gold/20 bg-ebony">
                  <ProductVisual form={i.formType as FormType} name={i.name} color={i.accentColor ?? "#c9a55c"} plain sizes="40px" />
                </div>
              ))}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-xl text-ivory" dir="ltr">{o.number}</p>
              <p className="text-xs text-mist">
                {format.dateTime(new Date(o.createdAt), { day: "numeric", month: "short", year: "numeric" })} · {t("account.items", { count: o.items.reduce((s, i) => s + i.quantity, 0) })}
              </p>
            </div>
            <div className="text-end">
              <p className="text-sm font-semibold tabular-nums text-ivory">{formatPrice(o.total, locale)}</p>
              <span className={cn("text-[0.62rem] uppercase tracking-[0.14em]", ["CANCELLED", "REFUNDED"].includes(o.status) ? "text-[#e48a96]" : "text-gold")}>
                {t(`orders.status.${o.status}`)}
              </span>
            </div>
            <ChevronRight className="size-4 text-mist transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
