"use client";

import { Check, Plus, Search, ShoppingBag, X } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useStore } from "@/components/providers/store-provider";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/money";
import { cn } from "@/lib/utils";

type SampleForm = "PERFUME" | "ATTAR";
export type Candidate = { id: string; name: string; family: string | null; familyLabel: string; notes: string[]; color: string; image: string | null; forms: SampleForm[] };
type Pick = { productId: string; form: SampleForm };

export function DiscoveryBuilder({
  candidates,
  size,
  variantId,
  price,
  available,
  initialPicks,
  fromQuiz,
}: {
  candidates: Candidate[];
  size: number;
  variantId: string | null;
  price: number;
  available: boolean;
  initialPicks: Pick[];
  fromQuiz: boolean;
}) {
  const t = useTranslations("discovery");
  const tf = useTranslations("forms");
  const locale = useLocale();
  const { add, pending } = useStore();
  const [picks, setPicks] = useState<Pick[]>(initialPicks.slice(0, size));
  const [formOf, setFormOf] = useState<Record<string, SampleForm>>({});
  const [family, setFamily] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const byId = new Map(candidates.map((c) => [c.id, c]));
  const families = [...new Map(candidates.filter((c) => c.family).map((c) => [c.family!, c.familyLabel])).entries()];
  const query = q.trim().toLowerCase();
  const shown = candidates.filter((c) => (!family || c.family === family) && (!query || c.name.toLowerCase().includes(query) || c.notes.some((n) => n.toLowerCase().includes(query))));
  const full = picks.length >= size;
  const need = size - picks.length;

  const toggle = (c: Candidate) => {
    if (picks.some((p) => p.productId === c.id)) setPicks((ps) => ps.filter((p) => p.productId !== c.id));
    else if (!full) setPicks((ps) => [...ps, { productId: c.id, form: formOf[c.id] ?? c.forms[0] }]);
  };
  const setForm = (c: Candidate, form: SampleForm) => {
    setFormOf((f) => ({ ...f, [c.id]: form }));
    setPicks((ps) => ps.map((p) => (p.productId === c.id ? { ...p, form } : p)));
  };

  const tray = (
    <div className="rounded-lg border border-hairline bg-surface p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <p className="font-display text-2xl text-heading">{t("tray")}</p>
        <p className="text-xs text-fg-muted" aria-live="polite">
          {t("chosen", { n: picks.length, total: size })}
        </p>
      </div>
      <ol className="grid grid-cols-5 gap-2">
        {Array.from({ length: size }, (_, i) => {
          const pick = picks[i];
          const c = pick ? byId.get(pick.productId) : undefined;
          return (
            <li key={i} className="flex flex-col items-center text-center">
              {c ? (
                <button type="button" onClick={() => toggle(c)} className="group relative" aria-label={t("remove", { name: c.name })}>
                  <Vial color={c.color} />
                  <span className="absolute -end-1 -top-1 hidden size-5 place-items-center rounded-full bg-ink text-gold-pale group-hover:grid">
                    <X className="size-3" />
                  </span>
                </button>
              ) : (
                <span className="grid h-[4.5rem] w-8 place-items-center rounded-t-full rounded-b-md border border-dashed border-hairline text-xs text-fg-muted">{i + 1}</span>
              )}
              <span className="mt-1.5 line-clamp-2 min-h-[2.2em] text-[0.62rem] leading-tight text-heading">{c ? c.name : ""}</span>
              {c && pick ? <span className="text-[0.58rem] uppercase tracking-[0.1em] text-accent">{tf(pick.form)}</span> : null}
            </li>
          );
        })}
      </ol>
      <Button
        className="mt-5 w-full bg-btn text-btn-fg shadow-none"
        disabled={!available || !variantId || !full || pending}
        onClick={async () => {
          if (!variantId) return;
          const ok = await add({ variantId, selections: picks, label: t("added") });
          if (ok) setPicks([]);
        }}
      >
        <ShoppingBag /> {full ? t("add", { price: formatPrice(price, locale) }) : t("needMore", { n: need })}
      </Button>
      {!available ? <p className="mt-2 text-center text-xs text-ruby">{t("unavailable")}</p> : null}
    </div>
  );

  return (
    <div className="grid gap-8 grid-cols-1 lg:grid-cols-[1fr_21rem]">
      <div className="min-w-0">
        {fromQuiz ? <p className="mb-5 rounded-md border border-hairline bg-surface px-4 py-3 text-sm text-fg-muted">{t("fromQuiz")}</p> : null}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <div className="relative me-2 w-full sm:w-64">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-fg-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("search")}
              aria-label={t("search")}
              className="h-10 w-full rounded-full border border-hairline bg-surface ps-9 pe-4 text-sm text-heading placeholder:text-fg-muted focus:border-accent focus:outline-none"
            />
          </div>
          {[[null, t("all")] as const, ...families].map(([k, label]) => (
            <button
              key={k ?? "all"}
              type="button"
              aria-pressed={family === k}
              onClick={() => setFamily(k)}
              className={cn("rounded-full border px-3.5 py-1.5 text-xs transition-colors", family === k ? "border-heading bg-btn text-btn-fg" : "border-hairline text-heading hover:border-accent")}
            >
              {label}
            </button>
          ))}
        </div>

        {shown.length ? (
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {shown.map((c) => {
              const inTray = picks.some((p) => p.productId === c.id);
              const form = picks.find((p) => p.productId === c.id)?.form ?? formOf[c.id] ?? c.forms[0];
              return (
                <li key={c.id} className={cn("flex flex-col overflow-hidden rounded-lg border bg-surface transition-colors", inTray ? "border-accent ring-1 ring-accent" : "border-hairline")}>
                  <div className="relative aspect-square" style={{ backgroundColor: c.color }}>
                    {c.image ? <Image src={c.image} alt="" fill sizes="(min-width: 1280px) 18vw, (min-width: 768px) 28vw, 45vw" className="object-cover" /> : null}
                    {inTray ? (
                      <span className="absolute start-2 top-2 inline-flex items-center gap-1 rounded-full bg-ink/85 px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-gold-pale">
                        <Check className="size-3" /> {t("inTray")}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col p-3">
                    <p className="text-sm font-semibold text-heading">{c.name}</p>
                    <p className="text-[0.7rem] text-fg-muted">{[c.familyLabel, ...c.notes.slice(0, 2)].filter(Boolean).join(" · ")}</p>
                    {c.forms.length > 1 ? (
                      <div className="mt-2 flex rounded-full border border-hairline p-0.5" role="radiogroup" aria-label={t("sampleAs")}>
                        {c.forms.map((f) => (
                          <button
                            key={f}
                            type="button"
                            role="radio"
                            aria-checked={form === f}
                            onClick={() => setForm(c, f)}
                            className={cn("flex-1 rounded-full py-1 text-[0.62rem] uppercase tracking-[0.1em]", form === f ? "bg-gold-metal text-ink" : "text-fg-muted hover:text-heading")}
                          >
                            {tf(f)}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-[0.62rem] uppercase tracking-[0.1em] text-accent">{tf(c.forms[0])}</p>
                    )}
                    <button
                      type="button"
                      onClick={() => toggle(c)}
                      disabled={!inTray && full}
                      className={cn(
                        "mt-3 inline-flex h-9 items-center justify-center gap-1.5 rounded-md text-[0.66rem] font-semibold uppercase tracking-[0.14em] transition-colors disabled:opacity-40",
                        inTray ? "border border-hairline text-heading hover:border-ruby hover:text-ruby" : "bg-btn text-btn-fg hover:opacity-90",
                      )}
                    >
                      {inTray ? <X className="size-3.5" /> : <Plus className="size-3.5" />}
                      {inTray ? t("removeFromTray") : t("addToTray")}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="py-12 text-center text-fg-muted">{t("noResults")}</p>
        )}
      </div>

      <aside className="order-first lg:order-none">
        <div className="lg:sticky lg:top-28">{tray}</div>
      </aside>
    </div>
  );
}

function Vial({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 32 72" className="h-[4.5rem] w-8" aria-hidden>
      <rect x="11" y="2" width="10" height="9" rx="2" fill="#1c1510" />
      <rect x="9" y="10" width="14" height="4" rx="1" fill="#8e6b2f" />
      <path d="M8 16h16v48a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6z" fill="#fff" fillOpacity="0.55" stroke="#c9a55c" strokeWidth="1" />
      <path d="M9 34h14v30a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5z" fill={color} fillOpacity="0.85" />
      <rect x="11" y="20" width="2" height="40" rx="1" fill="#fff" fillOpacity="0.5" />
    </svg>
  );
}
