"use client";

import { Bell, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { requestBackInStock } from "@/server/actions/engagement";

export function BackInStock({ variantId, name }: { variantId: string; name: string }) {
  const t = useTranslations("product");
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);
  const [pending, start] = useTransition();

  if (done) {
    return (
      <p className="flex items-center gap-2 rounded-sm border border-gold/30 bg-gold/5 px-4 py-3 text-sm text-gold-light">
        <Check className="size-4" /> {t("backInStockDone")}
      </p>
    );
  }

  return (
    <form
      className="rounded-sm border border-gold/20 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await requestBackInStock({ variantId, email });
          if (res.ok) setDone(true);
          else setError(true);
        });
      }}
    >
      <p className="flex items-center gap-2 font-display text-lg text-ivory">
        <Bell className="size-4 text-gold" strokeWidth={1.25} /> {t("backInStockTitle")}
      </p>
      <p className="mt-1 text-xs text-smoke">{t("backInStockText", { name })}</p>
      <div className="mt-3 flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(false);
          }}
          placeholder={t("emailPlaceholder")}
          aria-invalid={error}
          className="h-11 min-w-0 flex-1 rounded-sm border border-gold/25 bg-ebony px-3 text-sm text-ivory placeholder:text-mist focus:border-gold/60 focus:outline-none aria-invalid:border-ruby"
        />
        <Button type="submit" variant="outline" className="h-11" disabled={pending}>
          {t("backInStockTitle")}
        </Button>
      </div>
    </form>
  );
}
