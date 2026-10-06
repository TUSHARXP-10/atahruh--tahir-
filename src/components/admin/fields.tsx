"use client";

import { Star, X } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { keysOf } from "./labels";
import { Checkbox, TextArea, TextInput, inputClass } from "./ui";

/* Reusable admin form widgets (client). */


export function Bilingual({ label, hint, en, ar, onEn, onAr, multiline }: { label: string; hint?: string; en: string; ar: string; onEn: (v: string) => void; onAr: (v: string) => void; multiline?: boolean }) {
  const id = useId();
  const Input = multiline ? TextArea : TextInput;
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-ink">{label}</p>
      <div className="grid gap-2 md:grid-cols-2">
        <label htmlFor={`${id}-en`} className="relative block">
          <span className="sr-only">{label} (English)</span>
          <Input id={`${id}-en`} value={en} onChange={(e: { target: { value: string } }) => onEn(e.target.value)} />
          <span className="pointer-events-none absolute end-2 top-2 rounded bg-[#f3ecdf] px-1 text-[0.6rem] font-semibold text-ink-muted">EN</span>
        </label>
        <label htmlFor={`${id}-ar`} className="relative block">
          <span className="sr-only">{label} (Arabic)</span>
          <Input id={`${id}-ar`} dir="rtl" lang="ar" value={ar} onChange={(e: { target: { value: string } }) => onAr(e.target.value)} className="font-[family-name:var(--font-plex-arabic)]" />
          <span className="pointer-events-none absolute start-2 top-2 rounded bg-[#f3ecdf] px-1 text-[0.6rem] font-semibold text-ink-muted">AR</span>
        </label>
      </div>
      {hint ? <p className="mt-1 text-xs text-ink-muted">{hint}</p> : null}
    </div>
  );
}

export function Chips<T extends Record<string, string>>({ label, hint, options, value, onChange }: { label: string; hint?: string; options: T; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-xs font-semibold text-ink">
        {label} {hint ? <span className="font-normal text-ink-muted">· {hint}</span> : null}
      </legend>
      <div className="flex flex-wrap gap-1.5">
        {keysOf(options).map((k) => {
          const on = value.includes(k);
          return (
            <button
              key={k}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(on ? value.filter((x) => x !== k) : [...value, k])}
              className={cn("rounded-full border px-3 py-1 text-xs transition-colors", on ? "border-ink bg-ink text-gold-pale" : "border-[#dccfb6] bg-white text-ink hover:border-gold-deep")}
            >
              {options[k]}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function Scale({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-xs font-semibold text-ink">{label}</legend>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${label} ${n} of 5`}
            aria-pressed={value === n}
            onClick={() => onChange(n)}
            className={cn("grid size-9 place-items-center rounded-lg border text-sm transition-colors", n <= value ? "border-gold-deep bg-gold/20 text-ink" : "border-[#dccfb6] bg-white text-ink-muted")}
          >
            {n === value ? <Star className="size-4 fill-current text-gold-deep" /> : n}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function TagInput({ value, onChange, suggestions }: { value: string[]; onChange: (v: string[]) => void; suggestions: string[] }) {
  const [text, setText] = useState("");
  const id = useId();
  const add = (raw: string) => {
    const parts = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!parts.length) return;
    onChange([...value, ...parts.filter((p) => !value.some((v) => v.toLowerCase() === p.toLowerCase()))]);
    setText("");
  };
  return (
    <div className={cn(inputClass, "flex min-h-10 flex-wrap items-center gap-1 py-1.5")}>
      {value.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 rounded-full bg-[#f3ecdf] py-0.5 ps-2 pe-1 text-xs text-ink">
          {t}
          <button type="button" onClick={() => onChange(value.filter((v) => v !== t))} className="rounded-full p-0.5 hover:bg-[#e6dac4]" aria-label={`Remove ${t}`}>
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        list={id}
        value={text}
        onChange={(e) => (e.target.value.endsWith(",") ? add(e.target.value) : setText(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add(text);
          } else if (e.key === "Backspace" && !text && value.length) onChange(value.slice(0, -1));
        }}
        onBlur={() => add(text)}
        placeholder={value.length ? "" : "Type and press Enter"}
        className="min-w-24 flex-1 bg-transparent text-sm outline-none"
        aria-label="Add a note"
      />
      <datalist id={id}>
        {suggestions.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
    </div>
  );
}

export function CheckList({ options, value, onChange }: { options: { id: string; name: string }[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="grid gap-2">
      {options.map((o) => (
        <Checkbox key={o.id} label={o.name} checked={value.includes(o.id)} onChange={(e) => onChange(e.target.checked ? [...value, o.id] : value.filter((v) => v !== o.id))} />
      ))}
    </div>
  );
}

export function PickList({ options, value, onChange, max }: { options: { id: string; name: string }[]; value: string[]; onChange: (v: string[]) => void; max: number }): ReactNode {
  const [q, setQ] = useState("");
  const chosen = value.map((id) => options.find((o) => o.id === id)).filter((o): o is { id: string; name: string } => !!o);
  const matches = q ? options.filter((o) => !value.includes(o.id) && o.name.toLowerCase().includes(q.toLowerCase())).slice(0, 6) : [];
  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-1">
        {chosen.map((o) => (
          <span key={o.id} className="inline-flex items-center gap-1 rounded-full bg-[#f3ecdf] py-0.5 ps-2 pe-1 text-xs text-ink">
            {o.name}
            <button type="button" onClick={() => onChange(value.filter((v) => v !== o.id))} className="rounded-full p-0.5 hover:bg-[#e6dac4]" aria-label={`Remove ${o.name}`}>
              <X className="size-3" />
            </button>
          </span>
        ))}
        {!chosen.length ? <span className="text-xs text-ink-muted">None yet</span> : null}
      </div>
      {value.length < max ? (
        <>
          <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" className="h-9" aria-label="Search products to pair" />
          {matches.length ? (
            <ul className="mt-1 overflow-hidden rounded-lg border border-[#e9dfcc]">
              {matches.map((o) => (
                <li key={o.id}>
                  <button
                    type="button"
                    className="block w-full px-3 py-1.5 text-start text-sm hover:bg-[#fbf7ef]"
                    onClick={() => {
                      onChange([...value, o.id]);
                      setQ("");
                    }}
                  >
                    {o.name}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
