import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { TrackEvent } from "@/components/analytics/track-event";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { Container } from "@/components/ui/container";
import { db } from "@/lib/db";
import { paytmEnabled } from "@/lib/paytm";
import { tr } from "@/lib/utils";
import { currentCartView } from "@/server/cart";
import { getSettings } from "@/server/queries/content";
import { getSessionUser } from "@/server/session";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage({ params, searchParams }: PageProps<"/[locale]/checkout">) {
  const [{ locale }, sp] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);
  const [cart, user, settings, t] = await Promise.all([currentCartView(locale), getSessionUser(), getSettings(), getTranslations("checkout")]);
  const [addresses, samples] = await Promise.all([
    user ? db.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] }) : Promise.resolve([]),
    db.product.findMany({
      where: { isSampleable: true, status: "ACTIVE", kind: "FRAGRANCE" },
      orderBy: [{ isBestseller: "desc" }, { position: "asc" }],
      take: 8,
      select: { id: true, name: true, nameAr: true, accentColor: true, bottleShape: true },
    }),
  ]);

  return (
    <Container className="py-10 lg:py-14">
      <h1 className="mb-10 font-display text-5xl text-ivory">{t("title")}</h1>
      {cart.lines.length ? (
        <TrackEvent
          event="begin_checkout"
          data={{
            value: cart.totals.total,
            items: cart.lines.map((l) => ({ id: l.productId, name: l.name, variant: `${l.formType} ${l.sizeLabel}`, price: l.unitPrice, quantity: l.quantity })),
          }}
        />
      ) : null}
      <CheckoutForm
        initialCart={cart}
        user={user ? { name: user.name, email: user.email, phone: (user as { phone?: string | null }).phone ?? "" } : null}
        addresses={addresses.map((a) => ({
          id: a.id,
          name: a.name,
          phone: a.phone,
          line1: a.line1,
          line2: a.line2 ?? "",
          landmark: a.landmark ?? "",
          city: a.city,
          state: a.state,
          pincode: a.pincode,
          isDefault: a.isDefault,
        }))}
        samples={samples.map((s) => ({ id: s.id, name: tr(locale, s.name, s.nameAr), color: s.accentColor, shape: s.bottleShape }))}
        settings={settings.commerce}
        onlineEnabled={paytmEnabled()}
        paymentFailed={sp.payment === "failed"}
      />
    </Container>
  );
}
