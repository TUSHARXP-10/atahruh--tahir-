"use client";

import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/** EN ⇄ العربية — keeps the current page and query string. */
export function LocaleSwitcher({ className, variant = "compact" }: { className?: string; variant?: "compact" | "full" }) {
  const locale = useLocale();
  const t = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const next = locale === "ar" ? "en" : "ar";

  const switchTo = (target: string) => {
    const query = Object.fromEntries(new URLSearchParams(window.location.search));
    startTransition(() => {
      router.replace({ pathname, query }, { locale: target, scroll: false });
    });
  };

  if (variant === "full") {
    return (
      <div className={cn("inline-flex rounded-full border border-gold/30 p-1", className)} role="group" aria-label={t("language")}>
        {(["en", "ar"] as const).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => l !== locale && switchTo(l)}
            aria-pressed={l === locale}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs transition-colors",
              l === locale ? "bg-gold-metal font-semibold text-ink" : "text-smoke hover:text-gold-light",
              l === "ar" ? "font-arabic text-sm" : "tracking-[0.18em]",
            )}
          >
            {l === "ar" ? "العربية" : "EN"}
          </button>
        ))}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => switchTo(next)}
      disabled={pending}
      className={cn(
        "h-10 items-center gap-1.5 rounded-full px-3 text-ivory/85 transition-colors hover:bg-white/5 hover:text-gold-light disabled:opacity-60",
        className,
      )}
      aria-label={`${t("language")}: ${next === "ar" ? "العربية" : "English"}`}
      lang={next}
    >
      <Languages className="size-4" strokeWidth={1.25} />
      <span className={next === "ar" ? "font-arabic text-[0.95rem]" : "text-[0.68rem] font-medium tracking-[0.18em]"}>
        {next === "ar" ? "العربية" : "EN"}
      </span>
    </button>
  );
}
