"use client";

import { Copy, ExternalLink, Loader2, Plus, Save, Trash2, X } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { cn, slugify } from "@/lib/utils";
import { deleteProduct, duplicateProduct, saveProduct, type ProductPayload } from "@/server/admin/actions/products";
import { ActionButton, useResultHandler } from "./client";
import { Bilingual, CheckList, Chips, PickList, Scale, TagInput } from "./fields";
import { GalleryField } from "./image-field";
import { FAMILIES, FORMS, GENDERS, KINDS, MOODS, NEEDS, OCCASIONS, SEASONS, SHAPES, STATUSES, TIMES, keysOf } from "./labels";
import { draftKey as key, newForm, skuFor, type FormDraft, type ProductDraft, type VariantDraft } from "./product-draft-shared";
import { Card, Checkbox, Field, Select, TextArea, TextInput, buttonClass, inputClass } from "./ui";

function toPayload(d: ProductDraft): ProductPayload {
  return {
    ...d,
    family: d.family || null,
    position: Number(d.position) || 0,
    forms: d.forms.map(({ key: _k, variants, ...f }) => ({
      ...f,
      variants: variants.map(({ key: _v, mrp, ...v }) => ({ ...v, mrp: mrp === "" ? null : mrp })),
    })),
  } as unknown as ProductPayload;
}

export function ProductEditor({
  initial,
  collections,
  products,
  noteNames,
}: {
  initial: ProductDraft;
  collections: { id: string; name: string }[];
  products: { id: string; name: string }[];
  noteNames: string[];
}) {
  const [d, setD] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [slugTouched, setSlugTouched] = useState(!!initial.id);
  const [saving, start] = useTransition();
  const handle = useResultHandler();
  const isNew = !initial.id;

  const set = <K extends keyof ProductDraft>(k: K, v: ProductDraft[K]) => {
    setD((x) => ({ ...x, [k]: v }));
    setDirty(true);
  };
  const setForm = (i: number, patch: Partial<FormDraft>) => set("forms", d.forms.map((f, k) => (k === i ? { ...f, ...patch } : f)));

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const save = () =>
    start(async () => {
      const res = await saveProduct(toPayload(d));
      if (res.ok) setDirty(false);
      handle(res);
    });

  const missingTypes = keysOf(FORMS).filter((t) => !d.forms.some((f) => f.type === t));

  return (
    <div className="pb-24">
      {/* Sticky action bar */}
      <div className="sticky top-0 z-30 -mx-4 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-[#e9dfcc] bg-[#f6f1e7]/95 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10">
        <div className="min-w-0">
          <p className="truncate font-display text-2xl text-ink">{d.name || "New product"}</p>
          <p className="text-xs text-ink-muted">{dirty ? "Unsaved changes" : isNew ? "Not saved yet" : "All changes saved"}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={d.status} onChange={(e) => set("status", e.target.value as ProductDraft["status"])} className="w-48" aria-label="Status">
            {keysOf(STATUSES).map((s) => (
              <option key={s} value={s}>
                {STATUSES[s]}
              </option>
            ))}
          </Select>
          {!isNew && d.status === "ACTIVE" ? (
            <a href={`/products/${initial.slug}`} target="_blank" rel="noreferrer" className={buttonClass("secondary")}>
              <ExternalLink /> View
            </a>
          ) : null}
          <button type="button" onClick={save} disabled={saving} className={buttonClass("primary")}>
            {saving ? <Loader2 className="animate-spin" /> : <Save />} {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-6">
          <Card title="Name & story" description="English and Arabic side by side. Arabic is optional — English shows when it’s empty.">
            <div className="grid gap-4">
              <Bilingual
                label="Product name"
                en={d.name}
                ar={d.nameAr}
                onEn={(v) => {
                  set("name", v);
                  if (!slugTouched) setD((x) => ({ ...x, name: v, slug: slugify(v) }));
                }}
                onAr={(v) => set("nameAr", v)}
              />
              <Field label="Web address" hint={`aayatalruh.com/products/${d.slug || "…"}${!isNew ? " — changing this breaks old links" : ""}`}>
                <TextInput
                  value={d.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
                  }}
                />
              </Field>
              <Bilingual label="Tagline" hint="One line under the name, e.g. “Smoky oud & night-blooming rose”" en={d.tagline} ar={d.taglineAr} onEn={(v) => set("tagline", v)} onAr={(v) => set("taglineAr", v)} />
              <Bilingual label="Story" multiline en={d.story} ar={d.storyAr} onEn={(v) => set("story", v)} onAr={(v) => set("storyAr", v)} />
            </div>
          </Card>

          {d.forms.map((f, i) => (
            <Card
              key={f.key}
              title={`${FORMS[f.type]} — photos, sizes & prices`}
              description={i === 0 ? "Shown first on the product page" : undefined}
              actions={
                d.forms.length > 1 ? (
                  <button
                    type="button"
                    className={cn(buttonClass("ghost", "sm"), "text-ruby")}
                    onClick={() => window.confirm(`Remove the ${FORMS[f.type]} form and its sizes?`) && set("forms", d.forms.filter((_, k) => k !== i))}
                  >
                    <Trash2 /> Remove form
                  </button>
                ) : null
              }
            >
              <div className="space-y-6">
                <Field label="Photos" hint="The first photo is the main one; the second appears on hover in the shop.">
                  <GalleryField value={f.images} onChange={(images) => setForm(i, { images })} />
                </Field>

                <div>
                  <p className="mb-2 text-xs font-semibold text-ink">Sizes & prices</p>
                  <div className="overflow-x-auto rounded-lg border border-[#e9dfcc]">
                    <table className="w-full min-w-[640px] text-sm">
                      <thead className="bg-[#fbf7ef] text-[0.68rem] uppercase tracking-[0.08em] text-ink-muted">
                        <tr>
                          <th className="px-1.5 py-2 text-start font-semibold">Size label</th>
                          <th className="px-1.5 py-2 text-start font-semibold">ml</th>
                          <th className="px-1.5 py-2 text-start font-semibold">Price ₹</th>
                          <th className="px-1.5 py-2 text-start font-semibold">MRP ₹</th>
                          <th className="px-1.5 py-2 text-start font-semibold">SKU</th>
                          <th className="px-1.5 py-2 text-start font-semibold">Stock</th>
                          <th className="px-1.5 py-2 text-center font-semibold" title="Selected by default">Default</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {f.variants.map((v, j) => {
                          const setV = (patch: Partial<VariantDraft>) =>
                            setForm(i, { variants: f.variants.map((x, k) => (k === j ? { ...x, ...patch } : patch.isDefault ? { ...x, isDefault: false } : x)) });
                          return (
                            <tr key={v.key} className="border-t border-[#f0e8d9]">
                              <td className="px-1.5 py-2">
                                <input className={cn(inputClass, "h-9 w-20")} value={v.label} onChange={(e) => setV({ label: e.target.value })} aria-label="Size label" />
                              </td>
                              <td className="px-1.5 py-2">
                                <input className={cn(inputClass, "h-9 w-14")} inputMode="decimal" value={v.sizeMl} onChange={(e) => setV({ sizeMl: e.target.value })} aria-label="Millilitres" />
                              </td>
                              <td className="px-1.5 py-2">
                                <input className={cn(inputClass, "h-9 w-20")} inputMode="decimal" value={v.price} onChange={(e) => setV({ price: e.target.value })} placeholder="0" aria-label="Price in rupees" />
                              </td>
                              <td className="px-1.5 py-2">
                                <input className={cn(inputClass, "h-9 w-20")} inputMode="decimal" value={v.mrp} onChange={(e) => setV({ mrp: e.target.value })} placeholder="optional" aria-label="MRP in rupees" />
                              </td>
                              <td className="px-1.5 py-2">
                                <input className={cn(inputClass, "h-9 w-36 px-2 font-mono text-[0.7rem] uppercase")} value={v.sku} onChange={(e) => setV({ sku: e.target.value })} aria-label="SKU" />
                              </td>
                              <td className="px-1.5 py-2">
                                <input className={cn(inputClass, "h-9 w-16", Number(v.stock) <= 5 && "border-[#e6b8bd]")} inputMode="numeric" value={v.stock} onChange={(e) => setV({ stock: e.target.value.replace(/\D/g, "") })} aria-label="Units in stock" />
                              </td>
                              <td className="px-1.5 py-2 text-center">
                                <input type="radio" name={`default-${f.key}`} checked={v.isDefault} onChange={() => setV({ isDefault: true })} className="size-4 accent-[#1c1510]" aria-label="Default size" />
                              </td>
                              <td className="px-1.5 py-2">
                                <button
                                  type="button"
                                  className={cn(buttonClass("ghost", "sm"), "text-ruby")}
                                  disabled={f.variants.length === 1}
                                  onClick={() => setForm(i, { variants: f.variants.filter((_, k) => k !== j) })}
                                  aria-label="Remove size"
                                >
                                  <X />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <button
                    type="button"
                    className={cn(buttonClass("secondary", "sm"), "mt-2")}
                    onClick={() =>
                      setForm(i, {
                        variants: [...f.variants, { key: key(), label: "", sizeMl: "", price: "", mrp: "", sku: skuFor(d.slug, f.type, String(f.variants.length + 1)), stock: "0", isDefault: false }],
                      })
                    }
                  >
                    <Plus /> Add size
                  </button>
                </div>

                <div className="grid gap-4">
                  <Bilingual label="Concentration" hint="e.g. Eau de Parfum · Pure attar oil" en={f.concentration} ar={f.concentrationAr} onEn={(v) => setForm(i, { concentration: v })} onAr={(v) => setForm(i, { concentrationAr: v })} />
                  <Bilingual label={`About the ${FORMS[f.type].toLowerCase()}`} multiline en={f.description} ar={f.descriptionAr} onEn={(v) => setForm(i, { description: v })} onAr={(v) => setForm(i, { descriptionAr: v })} />
                  <Bilingual label="How to use" multiline en={f.howToUse} ar={f.howToUseAr} onEn={(v) => setForm(i, { howToUse: v })} onAr={(v) => setForm(i, { howToUseAr: v })} />
                </div>
              </div>
            </Card>
          ))}

          {missingTypes.length ? (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-[#dccfb6] p-4">
              <span className="text-sm text-ink-muted">Also sell this as:</span>
              {missingTypes.map((t) => (
                <button key={t} type="button" className={buttonClass("secondary", "sm")} onClick={() => set("forms", [...d.forms, newForm(t, d.slug)])}>
                  <Plus /> {FORMS[t]}
                </button>
              ))}
            </div>
          ) : null}

          <Card title="Scent profile" description="Powers the filters, the Fragrance Score quiz and recommendations.">
            <div className="grid gap-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Scent family">
                  <Select value={d.family} onChange={(e) => set("family", e.target.value as ProductDraft["family"])}>
                    <option value="">—</option>
                    {keysOf(FAMILIES).map((k) => (
                      <option key={k} value={k}>
                        {FAMILIES[k]}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="For">
                  <Select value={d.gender} onChange={(e) => set("gender", e.target.value as ProductDraft["gender"])}>
                    {keysOf(GENDERS).map((k) => (
                      <option key={k} value={k}>
                        {GENDERS[k]}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Top notes" hint="First impression">
                  <TagInput value={d.notes.top} onChange={(v) => set("notes", { ...d.notes, top: v })} suggestions={noteNames} />
                </Field>
                <Field label="Heart notes" hint="The character">
                  <TagInput value={d.notes.heart} onChange={(v) => set("notes", { ...d.notes, heart: v })} suggestions={noteNames} />
                </Field>
                <Field label="Base notes" hint="What lingers">
                  <TagInput value={d.notes.base} onChange={(v) => set("notes", { ...d.notes, base: v })} suggestions={noteNames} />
                </Field>
              </div>
              <Chips label="Moods" options={MOODS} value={d.moods} onChange={(v) => set("moods", v)} />
              <Chips label="Wellness needs" hint="For therapy oils" options={NEEDS} value={d.therapyNeeds} onChange={(v) => set("therapyNeeds", v)} />
              <div className="grid gap-5 md:grid-cols-2">
                <Chips label="Seasons" options={SEASONS} value={d.seasons} onChange={(v) => set("seasons", v)} />
                <Chips label="Time of day" options={TIMES} value={d.times} onChange={(v) => set("times", v)} />
              </div>
              <Chips label="Occasions" options={OCCASIONS} value={d.occasions} onChange={(v) => set("occasions", v)} />
              <div className="grid gap-4 sm:grid-cols-3">
                <Scale label="Longevity" value={d.longevity} onChange={(v) => set("longevity", v)} />
                <Scale label="Projection (sillage)" value={d.sillage} onChange={(v) => set("sillage", v)} />
                <Scale label="Intensity" value={d.intensity} onChange={(v) => set("intensity", v)} />
              </div>
            </div>
          </Card>

          <Card title="Search engines" description="How the product appears on Google. Leave empty to use the name and tagline.">
            <div className="grid gap-4">
              <Field label={`Title (${d.seoTitle.length}/70)`}>
                <TextInput value={d.seoTitle} maxLength={70} onChange={(e) => set("seoTitle", e.target.value)} placeholder={d.name} />
              </Field>
              <Field label={`Description (${d.seoDescription.length}/170)`}>
                <TextArea value={d.seoDescription} maxLength={170} onChange={(e) => set("seoDescription", e.target.value)} placeholder={d.tagline} className="min-h-20" />
              </Field>
            </div>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card title="Organisation">
            <div className="grid gap-4">
              <Field label="Product type">
                <Select value={d.kind} onChange={(e) => set("kind", e.target.value as ProductDraft["kind"])}>
                  {keysOf(KINDS).map((k) => (
                    <option key={k} value={k}>
                      {KINDS[k]}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="grid gap-2.5">
                <Checkbox label="Bestseller" checked={d.isBestseller} onChange={(e) => set("isBestseller", e.target.checked)} />
                <Checkbox label="New arrival" checked={d.isNew} onChange={(e) => set("isNew", e.target.checked)} />
                <Checkbox label="Featured" checked={d.isFeatured} onChange={(e) => set("isFeatured", e.target.checked)} />
                <Checkbox label="Offer as free 2 ml sample" checked={d.isSampleable} onChange={(e) => set("isSampleable", e.target.checked)} />
              </div>
              <Field label="Sort order" hint="Lower numbers show first">
                <TextInput inputMode="numeric" value={d.position} onChange={(e) => set("position", e.target.value.replace(/\D/g, ""))} />
              </Field>
            </div>
          </Card>

          <Card title="Collections">
            <CheckList options={collections} value={d.collectionIds} onChange={(v) => set("collectionIds", v)} />
          </Card>

          <Card title="Pairs well with" description="Shown on the product page as layering suggestions.">
            <PickList options={products.filter((p) => p.id !== d.id)} value={d.pairIds} onChange={(v) => set("pairIds", v)} max={6} />
          </Card>

          <Card title="Look" description="Used for accents and the drawn bottle when there’s no photo.">
            <div className="grid gap-4">
              <Field label="Juice colour">
                <div className="flex items-center gap-2">
                  <input type="color" value={d.accentColor} onChange={(e) => set("accentColor", e.target.value)} className="h-10 w-12 cursor-pointer rounded-lg border border-[#dccfb6] bg-white p-1" aria-label="Juice colour" />
                  <TextInput value={d.accentColor} onChange={(e) => set("accentColor", e.target.value)} className="font-mono" />
                </div>
              </Field>
              <Field label="Bottle shape">
                <Select value={d.bottleShape} onChange={(e) => set("bottleShape", e.target.value as ProductDraft["bottleShape"])}>
                  {keysOf(SHAPES).map((k) => (
                    <option key={k} value={k}>
                      {SHAPES[k]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Checkbox label="Show drawn bottle instead of photos" hint="Turn off once real photos are uploaded" checked={d.useBottleArt} onChange={(e) => set("useBottleArt", e.target.checked)} />
            </div>
          </Card>

          {!isNew && initial.id ? (
            <Card title="More">
              <div className="grid gap-2">
                <ActionButton action={() => duplicateProduct(initial.id!)}>
                  <Copy /> Duplicate as draft
                </ActionButton>
                <ActionButton variant="danger" action={() => deleteProduct(initial.id!)} confirm="Delete this product? Products that were ordered are archived instead.">
                  <Trash2 /> Delete
                </ActionButton>
              </div>
            </Card>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
