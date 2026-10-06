"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useRouter } from "@/i18n/navigation";
import { trackOrder } from "@/server/actions/orders";

export function TrackOrderForm({ initialNumber }: { initialNumber: string }) {
  const t = useTranslations("orders");
  const router = useRouter();
  const [number, setNumber] = useState(initialNumber);
  const [contact, setContact] = useState("");
  const [error, setError] = useState(false);
  const [pending, start] = useTransition();

  return (
    <form
      className="mt-10 space-y-4 text-start"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await trackOrder({ number, contact });
          if (res.ok) router.push(`/orders/${res.number}`);
          else setError(true);
        });
      }}
    >
      <div>
        <Label htmlFor="order-number">{t("orderNumber")}</Label>
        <Input id="order-number" required value={number} onChange={(e) => setNumber(e.target.value.toUpperCase())} placeholder="AAR-261004-1234" dir="ltr" className="tracking-wider" />
      </div>
      <div>
        <Label htmlFor="order-contact">{t("emailOrPhone")}</Label>
        <Input id="order-contact" required value={contact} onChange={(e) => setContact(e.target.value)} dir="ltr" />
      </div>
      {error ? <p className="text-sm text-[#e48a96]" role="alert">{t("notFound")}</p> : null}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {t("track")}
      </Button>
    </form>
  );
}
