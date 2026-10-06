"use client";

import { ArrowDown, ArrowUp, Check, ImagePlus, Images, Loader2, Trash2, Upload, X } from "lucide-react";
import Image from "next/image";
import { Dialog } from "radix-ui";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { listMediaLibrary, type LibraryImage } from "@/server/admin/actions/media";
import { buttonClass, inputClass } from "./ui";

type Uploaded = { id: string; url: string; width: number; height: number };

/** Upload photos through the admin upload endpoint. */
export async function uploadFiles(files: File[]): Promise<Uploaded[]> {
  if (!files.length) return [];
  const body = new FormData();
  files.forEach((f) => body.append("files", f));
  const res = await fetch("/api/admin/upload", { method: "POST", body });
  const json = (await res.json().catch(() => ({}))) as { items?: Uploaded[]; errors?: string[]; error?: string };
  for (const e of json.errors ?? []) toast.error(e);
  if (!res.ok && !json.errors?.length) toast.error(json.error ?? "Upload failed");
  if (json.items?.length) toast.success(json.items.length === 1 ? "Photo uploaded" : `${json.items.length} photos uploaded`);
  return json.items ?? [];
}

function UploadButton({ onUploaded, multiple = false, label = "Upload", variant = "secondary" as const }: { onUploaded: (items: Uploaded[]) => void; multiple?: boolean; label?: string; variant?: "secondary" | "primary" }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        multiple={multiple}
        hidden
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (!files.length) return;
          setBusy(true);
          try {
            onUploaded(await uploadFiles(files));
          } finally {
            setBusy(false);
          }
        }}
      />
      <button type="button" disabled={busy} className={buttonClass(variant, "sm")} onClick={() => ref.current?.click()}>
        {busy ? <Loader2 className="animate-spin" /> : <Upload />}
        {busy ? "Uploading…" : label}
      </button>
    </>
  );
}

export function MediaLibraryDialog({
  open,
  onOpenChange,
  onPick,
  multiple = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (urls: string[]) => void;
  multiple?: boolean;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-ink/50" />
        <Dialog.Content className="fixed inset-4 z-[101] mx-auto flex max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl sm:inset-10">
          {/* Mounted only while open, so every opening starts fresh */}
          <LibraryPanel
            multiple={multiple}
            onPick={(urls) => {
              onPick(urls);
              onOpenChange(false);
            }}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function LibraryPanel({ multiple, onPick }: { multiple: boolean; onPick: (urls: string[]) => void }) {
  const [items, setItems] = useState<LibraryImage[] | null>(null);
  const [tab, setTab] = useState<"uploaded" | "stock" | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, start] = useTransition();

  const load = () =>
    start(async () => {
      setItems(await listMediaLibrary());
    });
  useEffect(load, []);

  const activeTab = tab ?? (items && !items.some((i) => i.uploaded) ? "stock" : "uploaded");
  const shown = (items ?? []).filter((i) => (activeTab === "uploaded" ? i.uploaded : !i.uploaded));
  const toggle = (url: string) => setSelected((s) => (multiple ? (s.includes(url) ? s.filter((u) => u !== url) : [...s, url]) : [url]));

  return (
    <>
      <div className="flex items-center justify-between gap-3 border-b border-[#f0e8d9] px-5 py-3">
        <Dialog.Title className="font-display text-2xl text-ink">Choose {multiple ? "photos" : "a photo"}</Dialog.Title>
        <div className="flex items-center gap-2">
          <UploadButton
            multiple
            label="Upload new"
            onUploaded={(up) => {
              if (!up.length) return;
              setTab("uploaded");
              setSelected((s) => (multiple ? [...up.map((u) => u.url), ...s] : [up[0].url]));
              load();
            }}
          />
          <Dialog.Close className={buttonClass("ghost", "sm")} aria-label="Close">
            <X />
          </Dialog.Close>
        </div>
      </div>
      <div className="flex gap-1 border-b border-[#f0e8d9] px-5">
        {(["uploaded", "stock"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn("-mb-px border-b-2 px-3 py-2.5 text-sm", activeTab === t ? "border-ink font-semibold text-ink" : "border-transparent text-ink-muted hover:text-ink")}
          >
            {t === "uploaded" ? "Your uploads" : "Stock library"}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        {loading && !items ? (
          <p className="flex items-center gap-2 text-sm text-ink-muted">
            <Loader2 className="size-4 animate-spin" /> Loading photos…
          </p>
        ) : shown.length ? (
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {shown.map((img) => {
              const on = selected.includes(img.url);
              return (
                <li key={img.url}>
                  <button
                    type="button"
                    onClick={() => toggle(img.url)}
                    onDoubleClick={() => onPick([img.url])}
                    className={cn("group relative block aspect-square w-full overflow-hidden rounded-lg border-2 bg-[#f3ecdf]", on ? "border-ink" : "border-transparent hover:border-[#dccfb6]")}
                    title={img.label}
                  >
                    <Image src={img.url} alt={img.label} fill sizes="160px" className="object-cover" />
                    {on ? (
                      <span className="absolute end-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-ink text-gold-pale">
                        <Check className="size-3.5" />
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="py-10 text-center text-sm text-ink-muted">No uploads yet — use “Upload new”, or pick from the stock library.</p>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-[#f0e8d9] px-5 py-3">
        <p className="text-xs text-ink-muted">{selected.length ? `${selected.length} selected` : multiple ? "Select one or more photos" : "Select a photo (double-click to use it straight away)"}</p>
        <button type="button" disabled={!selected.length} className={buttonClass("primary", "sm")} onClick={() => onPick(selected)}>
          Use {selected.length > 1 ? `${selected.length} photos` : "photo"}
        </button>
      </div>
    </>
  );
}

/** One image: preview, upload, pick from library, clear. With `name`, it also posts in a FormData form. */
export function ImageField({
  value,
  onChange,
  name,
  aspect = "aspect-[4/3]",
  className,
}: {
  value: string;
  onChange?: (url: string) => void;
  name?: string;
  aspect?: string;
  className?: string;
}) {
  const [url, setUrl] = useState(value);
  const [open, setOpen] = useState(false);
  const set = (u: string) => {
    setUrl(u);
    onChange?.(u);
  };
  return (
    <div className={cn("flex items-start gap-4", className)}>
      {name ? <input type="hidden" name={name} value={url} /> : null}
      <div className={cn("relative w-40 shrink-0 overflow-hidden rounded-lg border border-[#e9dfcc] bg-[#f3ecdf]", aspect)}>
        {url ? <Image src={url} alt="" fill sizes="160px" className="object-cover" /> : <ImagePlus className="absolute inset-0 m-auto size-6 text-[#bfae92]" />}
      </div>
      <div className="flex flex-col gap-2">
        <UploadButton onUploaded={(up) => up[0] && set(up[0].url)} />
        <button type="button" className={buttonClass("secondary", "sm")} onClick={() => setOpen(true)}>
          <Images /> Library
        </button>
        {url ? (
          <button type="button" className={buttonClass("ghost", "sm")} onClick={() => set("")}>
            <Trash2 /> Remove
          </button>
        ) : null}
      </div>
      <MediaLibraryDialog open={open} onOpenChange={setOpen} onPick={(u) => u[0] && set(u[0])} />
    </div>
  );
}

export type GalleryImage = { url: string; alt: string };

/** An ordered set of photos with alt text — the first one is the main photo. */
export function GalleryField({ value, onChange, hint }: { value: GalleryImage[]; onChange: (v: GalleryImage[]) => void; hint?: string }) {
  const [open, setOpen] = useState(false);
  const move = (i: number, d: -1 | 1) => {
    const next = [...value];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const add = (urls: string[]) => onChange([...value, ...urls.filter((u) => !value.some((v) => v.url === u)).map((url) => ({ url, alt: "" }))]);

  return (
    <div>
      {value.length ? (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {value.map((img, i) => (
            <li key={img.url} className="flex gap-3 rounded-lg border border-[#e9dfcc] bg-[#fcf9f3] p-2">
              <div className="relative aspect-[5/6] w-20 shrink-0 overflow-hidden rounded-md bg-[#f3ecdf]">
                <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
                {i === 0 ? <span className="absolute inset-x-0 bottom-0 bg-ink/80 py-0.5 text-center text-[0.6rem] font-semibold uppercase tracking-wider text-gold-pale">Main</span> : null}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <input
                  className={cn(inputClass, "h-8 text-xs")}
                  placeholder="Describe the photo (for accessibility)"
                  value={img.alt}
                  onChange={(e) => onChange(value.map((v, k) => (k === i ? { ...v, alt: e.target.value } : v)))}
                />
                <div className="flex gap-1">
                  <button type="button" className={buttonClass("ghost", "sm")} onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move earlier">
                    <ArrowUp />
                  </button>
                  <button type="button" className={buttonClass("ghost", "sm")} onClick={() => move(i, 1)} disabled={i === value.length - 1} aria-label="Move later">
                    <ArrowDown />
                  </button>
                  <button type="button" className={cn(buttonClass("ghost", "sm"), "ms-auto text-ruby")} onClick={() => onChange(value.filter((_, k) => k !== i))} aria-label="Remove photo">
                    <Trash2 />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed border-[#dccfb6] px-4 py-6 text-center text-sm text-ink-muted">No photos yet.</p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <UploadButton multiple label="Upload photos" onUploaded={(up) => add(up.map((u) => u.url))} />
        <button type="button" className={buttonClass("secondary", "sm")} onClick={() => setOpen(true)}>
          <Images /> Add from library
        </button>
        {hint ? <span className="text-xs text-ink-muted">{hint}</span> : null}
      </div>
      <MediaLibraryDialog multiple open={open} onOpenChange={setOpen} onPick={add} />
    </div>
  );
}
