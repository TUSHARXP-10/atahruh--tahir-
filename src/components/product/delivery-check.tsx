"use client";

import { MapPin, Truck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { checkDelivery } from "@/server/actions/delivery";

type Result = Awaited<ReturnType<typeof checkDelivery>>;
const KEY = "aar-pincode";

export function DeliveryCheck() {
  const t = useTranslations("product");
  const locale = useLocale();
  const [pin, setPin] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [pending, start] = useTransition();

  const run = (value: string) =>
    start(async () => {
      const res = await checkDelivery(value);
      setResult(res);
      if (res.ok) {
        try {
          localStorage.setItem(KEY, value);
        } catch {}
      }
    });

  // Re-check the customer's last pincode once the page has hydrated
  useEffect(() => {
    const restore = window.setTimeout(() => {
      try {
        const saved = localStorage.getItem(KEY);
        if (saved) {
          setPin(saved);
          run(saved);
        }
      } catch {}
    }, 0);
    return () => window.clearTimeout(restore);
  }, []);

  const date =
    result?.ok &&
    new Intl.DateTimeFormat(locale === "ar" ? "ar-u-nu-latn" : "en-IN", { weekday: "short", day: "numeric", month: "short" }).format(new Date(result.by));

  return (
    <div className="rounded-sm border border-gold/15 p-4">
      <p className="mb-3 flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-smoke">
        <Truck className="size-4 text-gold" strokeWidth={1.25} /> {t("delivery")}
      </p>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          run(pin);
        }}
      >
        <input
          inputMode="numeric"
          maxLength={6}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          placeholder={t("pincodePlaceholder")}
          aria-label={t("pincodePlaceholder")}
          className="h-10 w-full min-w-0 flex-1 rounded-sm border border-gold/20 bg-ebony px-3 text-sm tracking-[0.2em] text-ivory placeholder:tracking-normal placeholder:text-mist focus:border-gold/60 focus:outline-none"
        />
        <button type="submit" disabled={pending || pin.length !== 6} className="h-10 rounded-sm border border-gold/40 px-4 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-gold-light hover:bg-gold/10 disabled:opacity-40">
          {t("check")}
        </button>
      </form>
      <div aria-live="polite" className="mt-2 min-h-5 text-xs">
        {result && !result.ok ? <p className="text-[#e48a96]">{t("invalidPincode")}</p> : null}
        {result?.ok ? (
          <div className="space-y-1 text-smoke">
            {result.place ? (
              <p className="flex items-center gap-1.5 text-mist">
                <MapPin className="size-3" /> {result.place.city}, {result.place.state}
              </p>
            ) : null}
            <p className="text-ivory">{t("deliveryBy", { date: date as string })}</p>
            <p className={result.cod ? "text-emerald-300/80" : "text-gold"}>{result.cod ? t("codAvailable") : t("codUnavailable")}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
