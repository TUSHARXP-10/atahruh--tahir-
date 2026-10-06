"use client";

import { Cookie } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { onConsentOpen, openConsentSettings, useConsent, writeConsent, type Consent } from "@/lib/consent";

/** Asks once for analytics consent; the footer's "Cookie settings" link re-opens it. */
export function CookieConsent() {
  const t = useTranslations("cookies");
  const consent = useConsent();
  const [reopened, setReopened] = useState(false);

  useEffect(() => onConsentOpen(() => setReopened(true)), []);

  if (consent === undefined || (consent && !reopened)) return null;

  const choose = (value: Consent) => {
    setReopened(false);
    writeConsent(value);
  };

  return (
    <section
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-title"
      aria-describedby="cookie-text"
      className="cookie-in fixed inset-x-3 bottom-3 z-[60] rounded-md border border-gold/30 bg-ebony/95 p-4 text-ivory shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] backdrop-blur-md sm:inset-x-auto sm:bottom-6 sm:start-6 sm:w-[24rem] sm:p-5"
    >
      <div className="flex items-start gap-3">
        <Cookie className="mt-0.5 size-5 shrink-0 text-gold" aria-hidden />
        <div className="min-w-0">
          <h2 id="cookie-title" className="font-display text-lg leading-tight text-ivory">
            {t("title")}
          </h2>
          <p id="cookie-text" className="mt-1.5 text-[0.8rem] leading-relaxed text-smoke">
            {t("text")}{" "}
            <Link href="/policies/privacy" className="text-gold-light underline underline-offset-2 hover:text-gold-pale">
              {t("policy")}
            </Link>
          </p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button size="sm" onClick={() => choose("all")}>
          {t("accept")}
        </Button>
        <Button size="sm" variant="outline" onClick={() => choose("essential")}>
          {t("essential")}
        </Button>
      </div>
    </section>
  );
}

/** Footer link that re-opens the banner. */
export function CookieSettingsLink({ className }: { className?: string }) {
  const t = useTranslations("cookies");
  return (
    <button type="button" onClick={openConsentSettings} className={className}>
      {t("settings")}
    </button>
  );
}
