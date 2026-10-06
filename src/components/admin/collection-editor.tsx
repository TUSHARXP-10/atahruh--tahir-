"use client";

import { ArrowDown, ArrowUp, ExternalLink, Loader2, Save, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useState, useTransition } from "react";
import { cn, slugify } from "@/lib/utils";
import { deleteCollection, saveCollection, type CollectionPayload } from "@/server/admin/actions/collections";
import { ActionButton, useResultHandler } from "./client";
import { Bilingual, Chips } from "./fields";
import { ImageField } from "./image-field";
import { FAMILIES, FORMS, GENDERS, KINDS, MOODS, NEEDS } from "./labels";
import { Card, Checkbox, Field, TextInput, buttonClass } from "./ui";

export type CollectionDraft = {
  id?: string;
  name: string;
  nameAr: string;
  slug: string;
  tagline: string;
  taglineAr: string;
  description: string;
  descriptionAr: string;
  imageUrl: string;
  isFeatured: boolean;
  position: string;
  mode: "rule" | "manual";
  rule: { kind: string[]; form: string[]; gender: string[]; family: string[]; mood: string[]; need: string[]; isNew: boolean; isBestseller: boolean; onSale: boolean; minPrice: string; maxPrice: string };
  productIds: string[];
};

type ProductOption = { id: string; name: string; image: string | null; status: string };

export function CollectionEditor({ initial, products }: { initial: CollectionDraft; products: ProductOption[] }) {
  const [d, setD] = useState(initial);
  const [q, setQ] = useState("");
  const [saving, start] = useTransition();
  const handle = useResultHandler();
  const isNew = !initial.id;
  const set = <K extends keyof CollectionDraft>(k: K, v: CollectionDraft[K]) => setD((x) => ({ ...x, [k]: v }));
  const setRule = <K extends keyof CollectionDraft["rule"]>(k: K, v: CollectionDraft["rule"][K]) => setD((x) => ({ ...x, rule: { ...x.rule, [k]: v } }));

  const chosen = d.productIds.map((id) => products.find((p) => p.id === id)).filter((p): p is ProductOption => !!p);
  const matches = q ? products.filter((p) => !d.productIds.includes(p.id) && p.name.toLowerCase().includes(q.toLowerCase())).slice(0, 8) : [];
  const move = (i: number, dir: -1 | 1) => {
    const ids = [...d.productIds];
    const j = i + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    set("productIds", ids);
  };

  const save = () =>
    start(async () => {
      handle(await saveCollection({ ...d, position: Number(d.position) || 0 } as unknown as CollectionPayload));
    });

  return (
    <div className="pb-16">
      <div className="sticky top-0 z-30 -mx-4 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-[#e9dfcc] bg-[#f6f1e7]/95 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10">
        <p className="font-display text-2xl text-ink">{d.name || "New collection"}</p>
        <div className="flex gap-2">
          {!isNew ? (
            <a href={`/collections/${initial.slug}`} target="_blank" rel="noreferrer" className={buttonClass("secondary")}>
              <ExternalLink /> View
            </a>
          ) : null}
          <button type="button" onClick={save} disabled={saving} className={buttonClass("primary")}>
            {saving ? <Loader2 className="animate-spin" /> : <Save />} Save
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-6">
          <Card title="Details">
            <div className="grid gap-4">
              <Bilingual label="Name" en={d.name} ar={d.nameAr} onEn={(v) => setD((x) => ({ ...x, name: v, slug: isNew ? slugify(v) : x.slug }))} onAr={(v) => set("nameAr", v)} />
              <Field label="Web address" hint={`aayatalruh.com/collections/${d.slug || "…"}${!isNew ? " — menus link here, so change with care" : ""}`}>
                <TextInput value={d.slug} onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} />
              </Field>
              <Bilingual label="Tagline" hint="Shown on the collection card, e.g. “For every personality”" en={d.tagline} ar={d.taglineAr} onEn={(v) => set("tagline", v)} onAr={(v) => set("taglineAr", v)} />
              <Bilingual label="Description" multiline en={d.description} ar={d.descriptionAr} onEn={(v) => set("description", v)} onAr={(v) => set("descriptionAr", v)} />
            </div>
          </Card>

          <Card title="Which products are in it?">
            <div className="mb-5 grid gap-2 sm:grid-cols-2">
              {(
                [
                  ["rule", "Automatic", "Products that match rules — new products join by themselves"],
                  ["manual", "Hand-picked", "Choose products and their order yourself"],
                ] as const
              ).map(([mode, title, text]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => set("mode", mode)}
                  aria-pressed={d.mode === mode}
                  className={cn("rounded-lg border p-3 text-start transition-colors", d.mode === mode ? "border-ink bg-[#fbf7ef] ring-1 ring-ink" : "border-[#dccfb6] hover:border-gold-deep")}
                >
                  <span className="block text-sm font-semibold text-ink">{title}</span>
                  <span className="block text-xs text-ink-muted">{text}</span>
                </button>
              ))}
            </div>

            {d.mode === "rule" ? (
              <div className="grid gap-4">
                <p className="text-xs text-ink-muted">A product must match every group you set. Within a group, any choice counts.</p>
                <Chips label="Type" options={KINDS} value={d.rule.kind} onChange={(v) => setRule("kind", v)} />
                <Chips label="Sold as" options={FORMS} value={d.rule.form} onChange={(v) => setRule("form", v)} />
                <Chips label="For" options={GENDERS} value={d.rule.gender} onChange={(v) => setRule("gender", v)} />
                <Chips label="Scent family" options={FAMILIES} value={d.rule.family} onChange={(v) => setRule("family", v)} />
                <Chips label="Mood" options={MOODS} value={d.rule.mood} onChange={(v) => setRule("mood", v)} />
                <Chips label="Wellness need" options={NEEDS} value={d.rule.need} onChange={(v) => setRule("need", v)} />
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  <Checkbox label="New arrivals only" checked={d.rule.isNew} onChange={(e) => setRule("isNew", e.target.checked)} />
                  <Checkbox label="Bestsellers only" checked={d.rule.isBestseller} onChange={(e) => setRule("isBestseller", e.target.checked)} />
                  <Checkbox label="On offer (below MRP)" checked={d.rule.onSale} onChange={(e) => setRule("onSale", e.target.checked)} />
                </div>
                <div className="grid max-w-md grid-cols-2 gap-3">
                  <Field label="Starting price from ₹">
                    <TextInput inputMode="numeric" value={d.rule.minPrice} onChange={(e) => setRule("minPrice", e.target.value.replace(/[^\d.]/g, ""))} placeholder="any" />
                  </Field>
                  <Field label="Starting price up to ₹">
                    <TextInput inputMode="numeric" value={d.rule.maxPrice} onChange={(e) => setRule("maxPrice", e.target.value.replace(/[^\d.]/g, ""))} placeholder="any" />
                  </Field>
                </div>
              </div>
            ) : (
              <div>
                <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products to add…" aria-label="Search products to add" />
                {matches.length ? (
                  <ul className="mt-1 overflow-hidden rounded-lg border border-[#e9dfcc]">
                    {matches.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          className="flex w-full items-center gap-3 px-3 py-2 text-start text-sm hover:bg-[#fbf7ef]"
                          onClick={() => {
                            set("productIds", [...d.productIds, p.id]);
                            setQ("");
                          }}
                        >
                          <Thumb src={p.image} /> {p.name}
                          {p.status !== "ACTIVE" ? <span className="text-xs text-ink-muted">({p.status.toLowerCase()})</span> : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <ol className="mt-4 space-y-1.5">
                  {chosen.map((p, i) => (
                    <li key={p.id} className="flex items-center gap-3 rounded-lg border border-[#e9dfcc] bg-white px-3 py-2">
                      <span className="w-6 text-xs tabular-nums text-ink-muted">{i + 1}</span>
                      <Thumb src={p.image} />
                      <span className="flex-1 text-sm text-ink">{p.name}</span>
                      <button type="button" className={buttonClass("ghost", "sm")} onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">
                        <ArrowUp />
                      </button>
                      <button type="button" className={buttonClass("ghost", "sm")} onClick={() => move(i, 1)} disabled={i === chosen.length - 1} aria-label="Move down">
                        <ArrowDown />
                      </button>
                      <button type="button" className={cn(buttonClass("ghost", "sm"), "text-ruby")} onClick={() => set("productIds", d.productIds.filter((x) => x !== p.id))} aria-label={`Remove ${p.name}`}>
                        <X />
                      </button>
                    </li>
                  ))}
                </ol>
                {!chosen.length ? <p className="mt-3 text-sm text-ink-muted">No products yet — search above to add some.</p> : null}
              </div>
            )}
          </Card>
        </div>

        <aside className="space-y-6">
          <Card title="Cover photo">
            <ImageField value={d.imageUrl} onChange={(v) => set("imageUrl", v)} aspect="aspect-[4/5]" className="flex-col" />
          </Card>
          <Card title="Display">
            <div className="grid gap-4">
              <Checkbox label="Feature on the homepage" checked={d.isFeatured} onChange={(e) => set("isFeatured", e.target.checked)} />
              <Field label="Sort order" hint="Lower numbers show first">
                <TextInput inputMode="numeric" value={d.position} onChange={(e) => set("position", e.target.value.replace(/\D/g, ""))} />
              </Field>
            </div>
          </Card>
          {!isNew && initial.id ? (
            <Card title="More">
              <ActionButton variant="danger" className="w-full" action={() => deleteCollection(initial.id!)} confirm="Delete this collection? Products stay in the store; any menu links to it will stop working.">
                <Trash2 /> Delete collection
              </ActionButton>
            </Card>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function Thumb({ src }: { src: string | null }) {
  return <span className="relative size-8 shrink-0 overflow-hidden rounded bg-[#f3ecdf]">{src ? <Image src={src} alt="" fill sizes="32px" className="object-cover" /> : null}</span>;
}
