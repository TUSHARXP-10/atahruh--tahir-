"use client";

import Fuse from "fuse.js";
import { ArrowUpRight, Clock, Search, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Dialog } from "radix-ui";
import { useEffect, useMemo, useRef, useState } from "react";
import { ProductVisual } from "@/components/product/product-visual";
import { useStore } from "@/components/providers/store-provider";
import { Link, useRouter } from "@/i18n/navigation";
import { formatPrice } from "@/lib/money";
import type { FormType } from "@/lib/types";
import { cn } from "@/lib/utils";

export type SearchEntry = {
  id: string;
  slug: string;
  name: string;
  alt: string;
  tagline: string;
  kind: string;
  family: string | null;
  forms: FormType[];
  notes: string;
  price: number;
  color: string;
  shape: string;
  image: string | null;
};

const RECENT_KEY = "aar-recent-searches";
const POPULAR = { en: ["Oud", "Rose", "Attar", "Musk", "Sleep", "Gift"], ar: ["عود", "ورد", "عطر زيتي", "مسك", "نوم", "هدية"] };

let indexPromise: Promise<SearchEntry[]> | null = null;
let indexLocale = "";
function loadIndex(locale: string) {
  if (!indexPromise || indexLocale !== locale) {
    indexLocale = locale;
    indexPromise = fetch(`/api/search-index?locale=${locale}`).then((r) => r.json());
  }
  return indexPromise;
}

export function useSearchIndex(active: boolean) {
  const locale = useLocale();
  const [index, setIndex] = useState<SearchEntry[] | null>(null);
  useEffect(() => {
    if (!active) return;
    let alive = true;
    loadIndex(locale).then((d) => alive && setIndex(d)).catch(() => {});
    return () => {
      alive = false;
    };
  }, [active, locale]);
  const fuse = useMemo(
    () =>
      index
        ? new Fuse(index, {
            keys: [
              { name: "name", weight: 3 },
              { name: "alt", weight: 2 },
              { name: "notes", weight: 1.5 },
              { name: "family", weight: 1 },
              { name: "tagline", weight: 0.8 },
              { name: "forms", weight: 0.6 },
            ],
            threshold: 0.38,
            ignoreLocation: true,
          })
        : null,
    [index],
  );
  return { index, fuse };
}

export function SearchDialog() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { searchOpen, setSearchOpen } = useStore();
  const [query, setQueryRaw] = useState("");
  // Recent searches live in this browser; they only render inside the open dialog, so reading them here is safe
  const [recent, setRecent] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    } catch {
      return [];
    }
  });
  const [active, setActive] = useState(0);
  // A new query always starts with the first result highlighted
  const setQuery = (q: string) => {
    setQueryRaw(q);
    setActive(0);
  };
  const inputRef = useRef<HTMLInputElement>(null);
  const { fuse } = useSearchIndex(searchOpen);

  const results = useMemo(() => {
    if (!fuse || query.trim().length < 2) return [];
    return fuse.search(query.trim(), { limit: 8 }).map((r) => r.item);
  }, [fuse, query]);

  const remember = (q: string) => {
    const next = [q, ...recent.filter((r) => r.toLowerCase() !== q.toLowerCase())].slice(0, 6);
    setRecent(next);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {}
  };

  const go = (href: string, q?: string) => {
    if (q) remember(q);
    setSearchOpen(false);
    setQuery("");
    router.push(href);
  };

  const submit = () => {
    const q = query.trim();
    if (!q) return;
    if (results[active]) go(`/products/${results[active].slug}`, q);
    else go(`/search?q=${encodeURIComponent(q)}`, q);
  };

  return (
    <Dialog.Root open={searchOpen} onOpenChange={setSearchOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-noir/80 backdrop-blur-md data-[state=open]:animate-[fade-in_.3s_ease]" />
        <Dialog.Content
          data-lenis-prevent
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            inputRef.current?.focus();
          }}
          className="fixed inset-x-0 top-0 z-[90] mx-auto max-h-[88dvh] w-full max-w-3xl overflow-hidden border-b border-gold/20 bg-ebony shadow-2xl outline-none data-[state=open]:animate-[sheet-in-top_.45s_var(--ease-luxe)] sm:top-[8vh] sm:rounded-md sm:border"
        >
          <Dialog.Title className="sr-only">{t("search.title")}</Dialog.Title>
          <div className="flex items-center gap-3 border-b border-gold/15 px-5">
            <Search className="size-5 shrink-0 text-gold" strokeWidth={1.25} />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActive((i) => Math.min(i + 1, results.length - 1));
                }
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActive((i) => Math.max(i - 1, 0));
                }
              }}
              placeholder={t("search.placeholder")}
              className="h-16 min-w-0 flex-1 bg-transparent font-display text-2xl text-ivory placeholder:text-mist/70 focus:outline-none"
              role="combobox"
              aria-expanded={results.length > 0}
              aria-controls="search-results"
              aria-activedescendant={results[active] ? `sr-${results[active].id}` : undefined}
            />
            {query ? (
              <button type="button" onClick={() => setQuery("")} className="p-1 text-mist hover:text-ivory" aria-label={t("common.close")}>
                <X className="size-4" />
              </button>
            ) : null}
            <Dialog.Close className="hidden rounded border border-gold/20 px-2 py-1 text-[0.6rem] uppercase tracking-widest text-mist hover:text-ivory sm:block">
              Esc
            </Dialog.Close>
          </div>

          <div className="max-h-[70dvh] overflow-y-auto p-3">
            {query.trim().length < 2 ? (
              <div className="space-y-6 p-3">
                {recent.length ? (
                  <section>
                    <p className="eyebrow mb-3 text-[0.6rem]">{t("search.recent")}</p>
                    <div className="flex flex-wrap gap-2">
                      {recent.map((r) => (
                        <button key={r} type="button" onClick={() => setQuery(r)} className="inline-flex items-center gap-1.5 rounded-full border border-gold/20 px-3 py-1.5 text-sm text-smoke hover:border-gold/50 hover:text-ivory">
                          <Clock className="size-3" />
                          {r}
                        </button>
                      ))}
                    </div>
                  </section>
                ) : null}
                <section>
                  <p className="eyebrow mb-3 text-[0.6rem]">{t("search.popular")}</p>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR[locale === "ar" ? "ar" : "en"].map((p) => (
                      <button key={p} type="button" onClick={() => setQuery(p)} className="rounded-full border border-gold/20 px-4 py-1.5 font-display text-lg text-ivory/90 hover:border-gold/50 hover:text-gold-light">
                        {p}
                      </button>
                    ))}
                  </div>
                </section>
                <p className="text-xs text-mist">{t("search.hint")}</p>
              </div>
            ) : results.length ? (
              <>
                <ul id="search-results" role="listbox" className="grid gap-1">
                  {results.map((r, i) => (
                    <li key={r.id} id={`sr-${r.id}`} role="option" aria-selected={i === active}>
                      <Link
                        href={`/products/${r.slug}`}
                        onClick={() => {
                          remember(query.trim());
                          setSearchOpen(false);
                          setQuery("");
                        }}
                        onMouseEnter={() => setActive(i)}
                        className={cn("flex items-center gap-4 rounded-sm p-2 transition-colors", i === active ? "bg-gold/10" : "hover:bg-white/[0.03]")}
                      >
                        <div className="relative h-16 w-13 shrink-0 overflow-hidden rounded-t-full rounded-b-sm border border-gold/15">
                          <ProductVisual form={r.forms[0] ?? "PERFUME"} kind={r.kind} image={r.image} name={r.name} color={r.color} shape={r.shape} plain sizes="52px" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-display text-xl text-ivory">{r.name}</p>
                          <p className="truncate text-xs text-mist">
                            {r.forms.map((f) => t(`forms.${f}`)).join(" · ")} — {r.tagline}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm tabular-nums text-smoke">{t("common.from", { price: formatPrice(r.price, locale) })}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => go(`/search?q=${encodeURIComponent(query.trim())}`, query.trim())}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-sm border border-gold/15 py-3 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-gold hover:bg-gold/5"
                >
                  {t("search.viewAll")}
                  <ArrowUpRight className="size-3.5" />
                </button>
              </>
            ) : (
              <p className="p-8 text-center font-display text-xl text-smoke">{t("search.noResults", { query: query.trim() })}</p>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
