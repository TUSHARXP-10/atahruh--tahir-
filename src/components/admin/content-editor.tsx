"use client";

import { ArrowDown, ArrowUp, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { saveContentBlock } from "@/server/admin/actions/content";
import { useResultHandler } from "./client";
import { ImageField } from "./image-field";
import { Card, Checkbox, Notice, Select, TextArea, TextInput, buttonClass } from "./ui";

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };
type Path = (string | number)[];

const LABELS: Record<string, string> = {
  eyebrow: "Small heading",
  title: "Title",
  titleAccent: "Title — gold part",
  subtitle: "Subtitle",
  primaryCta: "Main button",
  secondaryCta: "Second button",
  label: "Text",
  href: "Link",
  image: "Main image",
  imageSecondary: "Second image",
  background: "Background image",
  items: "Items",
  value: "Number",
  handle: "Instagram handle",
  tiles: "Photos",
  notes: "Notes",
  time: "Time",
  steps: "Steps",
  products: "Products",
  description: "Description",
  key: "ID (letters only, unique)",
  intro: "Introduction",
  topic: "Topic",
  q: "Question",
  a: "Answer",
  body: "Page text (Markdown)",
};
const IMAGE_KEYS = new Set(["image", "imageSecondary", "background", "coverUrl"]);
const LONG_KEYS = new Set(["subtitle", "description", "text", "intro", "a", "body"]);
const STRUCTURAL = new Set(["href", "key"]);

const label = (k: string | number) => (typeof k === "number" ? `#${k + 1}` : (LABELS[k] ?? k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase())));

function getAt(tree: Json, path: Path): Json {
  return path.reduce<Json>((node, k) => (node && typeof node === "object" ? ((node as Record<string, Json>)[k as string] ?? null) : null), tree);
}
function setAt(tree: Json, path: Path, value: Json): Json {
  if (!path.length) return value;
  const [k, ...rest] = path;
  if (Array.isArray(tree)) return tree.map((item, i) => (i === k ? setAt(item, rest, value) : item));
  const obj = (tree && typeof tree === "object" ? tree : {}) as Record<string, Json>;
  return { ...obj, [k]: setAt(obj[k as string] ?? null, rest, value) };
}
/** An empty item shaped like `like` (for "Add" in lists). */
function blank(like: Json): Json {
  if (typeof like === "string") return "";
  if (typeof like === "number") return 0;
  if (typeof like === "boolean") return false;
  if (Array.isArray(like)) return [];
  if (like && typeof like === "object") return Object.fromEntries(Object.entries(like).map(([k, v]) => [k, blank(v)]));
  return null;
}
/** Arabic tree with the English structure; strings only. */
function buildAr(en: Json, ar: Json | undefined): Json {
  if (typeof en === "string") return typeof ar === "string" ? ar : "";
  if (Array.isArray(en)) return en.map((item, i) => buildAr(item, Array.isArray(ar) ? ar[i] : undefined));
  if (en && typeof en === "object") {
    const src = ar && typeof ar === "object" && !Array.isArray(ar) ? (ar as Record<string, Json>) : {};
    return Object.fromEntries(Object.entries(en).map(([k, v]) => [k, buildAr(v, src[k])]));
  }
  return null;
}
/** Drop empty Arabic strings so English shows through; arrays keep positions with null. */
function pruneAr(node: Json): Json | undefined {
  if (typeof node === "string") return node.trim() ? node : undefined;
  if (Array.isArray(node)) {
    const items = node.map((n) => pruneAr(n) ?? null);
    return items.some((n) => n !== null) ? items : undefined;
  }
  if (node && typeof node === "object") {
    const entries = Object.entries(node)
      .map(([k, v]) => [k, pruneAr(v)] as const)
      .filter(([, v]) => v !== undefined);
    return entries.length ? (Object.fromEntries(entries) as Json) : undefined;
  }
  return undefined;
}

export type ContentBlockView = { key: string; title: string; description: string; data: Json; dataAr: Json | null };

export function ContentEditor({ block, products }: { block: ContentBlockView; products: { slug: string; name: string }[] }) {
  const [data, setData] = useState<Json>(block.data);
  const [ar, setAr] = useState<Json>(() => buildAr(block.data, block.dataAr ?? undefined));
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [dirty, setDirty] = useState(false);
  const [saving, start] = useTransition();
  const handle = useResultHandler();

  const edit = (path: Path, value: Json) => {
    if (lang === "en") setData((d) => setAt(d, path, value));
    else setAr((a) => setAt(a, path, value));
    setDirty(true);
  };
  /** List operations apply to both languages so Arabic stays aligned with English. */
  const listOp = (path: Path, fn: <T>(list: T[]) => T[]) => {
    setData((d) => setAt(d, path, fn((getAt(d, path) as Json[]) ?? [])));
    setAr((a) => {
      const current = getAt(a, path);
      return setAt(a, path, fn(Array.isArray(current) ? current : []));
    });
    setDirty(true);
  };

  const save = () =>
    start(async () => {
      const res = await saveContentBlock(block.key, data, pruneAr(buildAr(data, ar)) ?? null);
      if (res.ok) setDirty(false);
      handle(res);
    });

  const placeholder = data && typeof data === "object" && !Array.isArray(data) && "isPlaceholder" in data ? (data as Record<string, Json>).isPlaceholder === true : null;

  return (
    <Card
      title={block.title}
      description={block.description}
      actions={
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-[#efe7d8] p-0.5">
            {(
              [
                ["en", "English"],
                ["ar", "Arabic"],
              ] as const
            ).map(([k, l]) => (
              <button key={k} type="button" onClick={() => setLang(k)} className={cn("rounded-md px-2.5 py-1 text-xs", lang === k ? "bg-white font-semibold text-ink shadow-sm" : "text-ink-muted")}>
                {l}
              </button>
            ))}
          </div>
          <button type="button" onClick={save} disabled={saving || !dirty} className={buttonClass("primary", "sm")}>
            {saving ? <Loader2 className="animate-spin" /> : <Save />} Save
          </button>
        </div>
      }
    >
      {lang === "ar" ? (
        <div className="mb-4">
          <Notice>Arabic text for the /ar site. Leave a field empty to show the English text there. Photos and links are shared with English.</Notice>
        </div>
      ) : null}
      {placeholder !== null ? (
        <div className="mb-4">
          <Notice tone={placeholder ? "warn" : "ok"}>
            <Checkbox
              label={placeholder ? "These are demo figures — hidden on the live site" : "Real figures — shown on the live site"}
              hint="Untick once the numbers are true for the business"
              checked={placeholder}
              onChange={(e) => {
                setData((d) => setAt(d, ["isPlaceholder"], e.target.checked));
                setDirty(true);
              }}
            />
          </Notice>
        </div>
      ) : null}
      <Node node={data} arNode={ar} path={[]} lang={lang} edit={edit} listOp={listOp} products={products} parentKey={null} />
    </Card>
  );
}

function Node({
  node,
  arNode,
  path,
  lang,
  edit,
  listOp,
  products,
  parentKey,
}: {
  node: Json;
  arNode: Json;
  path: Path;
  lang: "en" | "ar";
  edit: (path: Path, value: Json) => void;
  listOp: (path: Path, fn: <T>(list: T[]) => T[]) => void;
  products: { slug: string; name: string }[];
  parentKey: string | null;
}) {
  const key = path[path.length - 1];
  const keyName = typeof key === "string" ? key : parentKey;

  if (Array.isArray(node)) {
    const template = node[0];
    const simple = template === undefined || typeof template !== "object" || template === null;
    return (
      <div className="space-y-2">
        {node.map((item, i) => (
          <div key={i} className={cn(!simple && "rounded-lg border border-[#e9dfcc] bg-[#fcf9f3] p-4")}>
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                {!simple ? <p className="mb-3 text-xs font-semibold text-ink-muted">{label(i)}</p> : null}
                <Node node={item} arNode={Array.isArray(arNode) ? (arNode[i] ?? null) : null} path={[...path, i]} lang={lang} edit={edit} listOp={listOp} products={products} parentKey={keyName} />
              </div>
              {lang === "en" ? (
                <div className="flex shrink-0 gap-0.5">
                  <button type="button" className={buttonClass("ghost", "sm")} disabled={i === 0} onClick={() => listOp(path, (l) => swap(l, i, i - 1))} aria-label="Move up">
                    <ArrowUp />
                  </button>
                  <button type="button" className={buttonClass("ghost", "sm")} disabled={i === node.length - 1} onClick={() => listOp(path, (l) => swap(l, i, i + 1))} aria-label="Move down">
                    <ArrowDown />
                  </button>
                  <button type="button" className={cn(buttonClass("ghost", "sm"), "text-ruby")} onClick={() => listOp(path, (l) => l.filter((_, k) => k !== i))} aria-label="Remove">
                    <Trash2 />
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        ))}
        {lang === "en" ? (
          <button type="button" className={buttonClass("secondary", "sm")} onClick={() => listOp(path, (l) => [...l, blank(template ?? "") as never])}>
            <Plus /> Add {keyName === "tiles" ? "photo" : keyName === "products" ? "product" : keyName === "steps" ? "step" : "item"}
          </button>
        ) : null}
      </div>
    );
  }

  if (node && typeof node === "object") {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Object.entries(node).map(([k, v]) => {
          if (k === "isPlaceholder") return null;
          if (lang === "ar" && (IMAGE_KEYS.has(k) || STRUCTURAL.has(k) || (Array.isArray(v) && (k === "tiles" || k === "products")))) return null;
          const wide = Array.isArray(v) || (v && typeof v === "object") || LONG_KEYS.has(k) || IMAGE_KEYS.has(k);
          return (
            <div key={k} className={cn(wide && "md:col-span-2")}>
              <p className="mb-1.5 text-xs font-semibold text-ink">{label(k)}</p>
              <Node node={v} arNode={arNode && typeof arNode === "object" && !Array.isArray(arNode) ? ((arNode as Record<string, Json>)[k] ?? null) : null} path={[...path, k]} lang={lang} edit={edit} listOp={listOp} products={products} parentKey={k} />
            </div>
          );
        })}
      </div>
    );
  }

  if (typeof node === "boolean") {
    return lang === "en" ? <Checkbox label="Yes" checked={node} onChange={(e) => edit(path, e.target.checked)} /> : null;
  }
  if (typeof node === "number") {
    return lang === "en" ? <TextInput inputMode="numeric" value={String(node)} onChange={(e) => edit(path, Number(e.target.value) || 0)} /> : <p className="text-sm text-ink-muted">{node}</p>;
  }

  const value = typeof node === "string" ? node : "";
  if (lang === "en" && (IMAGE_KEYS.has(String(keyName)) || parentKey === "tiles")) {
    return <ImageField key={value} value={value} onChange={(u) => edit(path, u)} aspect={parentKey === "tiles" ? "aspect-square" : "aspect-[4/3]"} />;
  }
  if (lang === "en" && parentKey === "products") {
    return (
      <Select value={value} onChange={(e) => edit(path, e.target.value)} aria-label="Product">
        <option value="">Choose a product…</option>
        {products.map((p) => (
          <option key={p.slug} value={p.slug}>
            {p.name}
          </option>
        ))}
      </Select>
    );
  }
  const long = LONG_KEYS.has(String(keyName)) || value.length > 90;
  const Input = long ? TextArea : TextInput;
  const size = keyName === "body" ? "min-h-[30rem] font-mono text-[0.8rem] leading-relaxed" : long ? "min-h-20" : undefined;
  if (lang === "ar") {
    const arValue = typeof arNode === "string" ? arNode : "";
    return <Input dir="rtl" lang="ar" value={arValue} placeholder={value} onChange={(e: { target: { value: string } }) => edit(path, e.target.value)} className={size} />;
  }
  return <Input value={value} onChange={(e: { target: { value: string } }) => edit(path, e.target.value)} className={size} />;
}

function swap<T>(list: T[], i: number, j: number) {
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}
