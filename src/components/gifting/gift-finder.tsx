"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { CardGrid } from "@/components/product/card-grid";
import type { ProductCardData } from "@/lib/types";
import { cn } from "@/lib/utils";

type For = "any" | "him" | "her";
type Budget = "any" | "low" | "mid" | "high";
type Kind = "any" | "sets" | "fragrance" | "therapy";

const BUDGET: Record<Budget, [number, number]> = { any: [0, Infinity], low: [0, 149_999], mid: [150_000, 350_000], high: [350_001, Infinity] };

export function GiftFinder({ products }: { products: ProductCardData[] }) {
  const t = useTranslations("giftingPage");
  const [who, setWho] = useState<For>("any");
  const [budget, setBudget] = useState<Budget>("any");
  const [kind, setKind] = useState<Kind>("any");

  const [min, max] = BUDGET[budget];
  const matches = products
    .filter((p) => (who === "any" ? true : who === "him" ? p.gender !== "WOMEN" : p.gender !== "MEN"))
    .filter((p) => p.minPrice >= min && p.minPrice <= max)
    .filter((p) => (kind === "any" ? true : kind === "sets" ? p.kind === "GIFT_SET" : kind === "fragrance" ? p.kind === "FRAGRANCE" : p.kind === "THERAPY"))
    // Gift sets first, then bestsellers
    .sort((a, b) => Number(b.kind === "GIFT_SET") - Number(a.kind === "GIFT_SET") || Number(b.isBestseller) - Number(a.isBestseller))
    .slice(0, 8);

  return (
    <div>
      <div className="grid gap-6 rounded-lg border border-hairline bg-surface p-6 md:grid-cols-3">
        <Choice label={t("for")} value={who} onChange={setWho} options={(["any", "him", "her"] as const).map((k) => [k, t(`forOptions.${k}`)])} />
        <Choice label={t("budget")} value={budget} onChange={setBudget} options={(["any", "low", "mid", "high"] as const).map((k) => [k, t(`budgetOptions.${k}`)])} />
        <Choice label={t("type")} value={kind} onChange={setKind} options={(["any", "sets", "fragrance", "therapy"] as const).map((k) => [k, t(`typeOptions.${k}`)])} />
      </div>
      <p className="mb-4 mt-6 text-sm text-fg-muted" aria-live="polite">
        {t("results", { count: matches.length })}
      </p>
      {matches.length ? <CardGrid products={matches} /> : null}
    </div>
  );
}

function Choice<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: [T, string][] }) {
  return (
    <fieldset>
      <legend className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-fg-muted">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map(([k, l]) => (
          <button
            key={k}
            type="button"
            aria-pressed={value === k}
            onClick={() => onChange(k)}
            className={cn("rounded-full border px-3.5 py-1.5 text-xs transition-colors", value === k ? "border-heading bg-btn text-btn-fg" : "border-hairline text-heading hover:border-accent")}
          >
            {l}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
