"use client";

import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useId, useRef, type KeyboardEvent } from "react";
import type { FormType } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * The Perfume ⇄ Attar switch. An ARIA radiogroup with a sliding gold
 * indicator; arrow keys move between forms.
 */
export function FormToggle({
  forms,
  value,
  onChange,
  size = "sm",
  className,
  showHints,
}: {
  forms: FormType[];
  value: FormType;
  onChange: (form: FormType) => void;
  size?: "xs" | "sm" | "lg";
  className?: string;
  showHints?: boolean;
}) {
  const t = useTranslations("forms");
  const layoutId = `form-pill-${useId()}`;
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = forms.indexOf(value);
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    const fwd = rtl ? "ArrowLeft" : "ArrowRight";
    const back = rtl ? "ArrowRight" : "ArrowLeft";
    let next = i;
    if (e.key === fwd || e.key === "ArrowDown") next = (i + 1) % forms.length;
    else if (e.key === back || e.key === "ArrowUp") next = (i - 1 + forms.length) % forms.length;
    else return;
    e.preventDefault();
    onChange(forms[next]);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={t("switchLabel")}
      onKeyDown={onKey}
      className={cn(
        "relative inline-grid rounded-full border border-hairline p-0.5",
        size === "lg" && "p-1",
        className,
      )}
      style={{ gridTemplateColumns: `repeat(${forms.length}, minmax(0, 1fr))` }}
    >
      {forms.map((form, i) => {
        const active = form === value;
        return (
          <button
            key={form}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onChange(form);
            }}
            className={cn(
              "relative z-10 rounded-full text-center font-medium uppercase transition-colors duration-300",
              size === "xs" && "px-2 py-1 text-[0.56rem] tracking-[0.14em]",
              size === "sm" && "px-3 py-1.5 text-[0.6rem] tracking-[0.16em]",
              size === "lg" && "px-6 py-3 text-[0.7rem] tracking-[0.2em]",
              active ? "text-ink" : "text-fg-muted hover:text-heading",
            )}
          >
            {active ? (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 -z-10 rounded-full bg-gold-metal shadow-[0_4px_18px_-6px_rgba(232,205,146,0.7)]"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            ) : null}
            <span className="block">{t(form)}</span>
            {showHints && size === "lg" && (form === "PERFUME" || form === "ATTAR") ? (
              <span className={cn("mt-0.5 block text-[0.55rem] normal-case tracking-[0.06em]", active ? "text-ink/70" : "text-fg-muted")}>
                {t(`${form}_hint`)}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
