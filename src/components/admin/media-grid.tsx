"use client";

import { Copy, Loader2, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteMedia } from "@/server/admin/actions/media";
import { useResultHandler } from "./client";
import { fmtDate } from "./format";
import { uploadFiles } from "./image-field";
import { buttonClass } from "./ui";

export type MediaItem = { id: string; url: string; filename: string; width: number; height: number; size: number; createdAt: string };

export function MediaUploader() {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (!files.length) return;
          setBusy(true);
          try {
            await uploadFiles(files);
            router.refresh();
          } finally {
            setBusy(false);
          }
        }}
      />
      <button type="button" disabled={busy} onClick={() => ref.current?.click()} className={buttonClass("primary")}>
        {busy ? <Loader2 className="animate-spin" /> : <Upload />} {busy ? "Uploading…" : "Upload photos"}
      </button>
    </>
  );
}

export function MediaGrid({ items }: { items: MediaItem[] }) {
  const [pending, start] = useTransition();
  const handle = useResultHandler();
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
      {items.map((m) => (
        <li key={m.id} className="overflow-hidden rounded-xl border border-[#e9dfcc] bg-white">
          <div className="relative aspect-square bg-[#f3ecdf]">
            <Image src={m.url} alt={m.filename} fill sizes="240px" className="object-cover" />
          </div>
          <div className="p-3">
            <p className="truncate text-xs font-medium text-ink" title={m.filename}>
              {m.filename}
            </p>
            <p className="text-[0.68rem] text-ink-muted">
              {m.width}×{m.height} · {Math.round(m.size / 1024)} KB · {fmtDate(m.createdAt)}
            </p>
            <div className="mt-2 flex gap-1">
              <button
                type="button"
                className={buttonClass("ghost", "sm")}
                onClick={async () => {
                  await navigator.clipboard.writeText(new URL(m.url, window.location.origin).toString());
                  toast.success("Link copied");
                }}
              >
                <Copy /> Copy link
              </button>
              <button
                type="button"
                disabled={pending}
                className={buttonClass("ghost", "sm") + " ms-auto text-ruby"}
                onClick={() => window.confirm("Delete this photo?") && start(async () => handle(await deleteMedia(m.id)))}
                aria-label={`Delete ${m.filename}`}
              >
                <Trash2 />
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
