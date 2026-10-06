import { setRequestLocale } from "next-intl/server";
import { AddressManager } from "@/components/account/address-manager";
import { db } from "@/lib/db";
import { requireCustomer } from "@/server/session";

export default async function AddressesPage({ params }: PageProps<"/[locale]/account/addresses">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireCustomer(locale, "/account/addresses");
  const rows = await db.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] });
  return (
    <AddressManager
      addresses={rows.map((a) => ({ ...a, line2: a.line2 ?? "", landmark: a.landmark ?? "" }))}
    />
  );
}
