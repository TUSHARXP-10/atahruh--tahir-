import { ArrowRight, Heart, MapPin, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { OrderList } from "@/components/account/order-list";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { requireCustomer } from "@/server/session";

export const metadata: Metadata = { title: "Account", robots: { index: false } };

export default async function AccountOverview({ params }: PageProps<"/[locale]/account">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireCustomer(locale, "/account");
  const [t, orders, addresses, wishlist, quiz] = await Promise.all([
    getTranslations(),
    db.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 3, include: { items: true } }),
    db.address.count({ where: { userId: user.id } }),
    db.wishlistItem.count({ where: { userId: user.id } }),
    db.quizResult.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, select: { id: true } }),
  ]);

  const tiles = [
    { href: "/wishlist", Icon: Heart, label: t("account.wishlist"), value: wishlist },
    { href: "/account/addresses", Icon: MapPin, label: t("account.addresses"), value: addresses },
    { href: quiz ? `/fragrance-quiz/r/${quiz.id}` : "/fragrance-quiz", Icon: Sparkles, label: t("account.scentProfile"), value: quiz ? "✓" : "—" },
  ];

  return (
    <div className="space-y-10">
      <div className="grid gap-4 sm:grid-cols-3">
        {tiles.map(({ href, Icon, label, value }) => (
          <Link key={href} href={href} className="border-gold-gradient group flex items-center justify-between rounded-sm p-5">
            <span className="flex items-center gap-3 text-sm text-smoke">
              <Icon className="size-4 text-gold" strokeWidth={1.25} /> {label}
            </span>
            <span className="font-display text-3xl lining-nums tabular-nums text-gold-light">{value}</span>
          </Link>
        ))}
      </div>
      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-display text-3xl text-ivory">{t("account.recentOrders")}</h2>
          <Link href="/account/orders" className="inline-flex items-center gap-1.5 text-xs text-gold hover:text-gold-light">
            {t("common.viewAll")} <ArrowRight className="size-3.5 rtl:-scale-x-100" />
          </Link>
        </div>
        <OrderList orders={orders} locale={locale} />
      </section>
    </div>
  );
}
