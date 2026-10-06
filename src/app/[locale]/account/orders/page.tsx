import { getTranslations, setRequestLocale } from "next-intl/server";
import { OrderList } from "@/components/account/order-list";
import { db } from "@/lib/db";
import { requireCustomer } from "@/server/session";

export default async function AccountOrders({ params }: PageProps<"/[locale]/account/orders">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireCustomer(locale, "/account/orders");
  const [t, orders] = await Promise.all([
    getTranslations("account"),
    db.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, include: { items: true } }),
  ]);
  return (
    <section>
      <h2 className="mb-6 font-display text-3xl text-ivory">{t("orders")}</h2>
      <OrderList orders={orders} locale={locale} />
    </section>
  );
}
