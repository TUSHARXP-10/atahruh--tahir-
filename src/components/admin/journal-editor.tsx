"use client";

import { ExternalLink, Loader2, Save, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn, slugify } from "@/lib/utils";
import { deleteJournalPost, saveJournalPost } from "@/server/admin/actions/journal";
import { ActionButton, useResultHandler } from "./client";
import { Bilingual, TagInput } from "./fields";
import { ImageField } from "./image-field";
import { Card, Checkbox, Field, TextArea, TextInput, buttonClass } from "./ui";

export type JournalDraft = {
  id?: string;
  title: string;
  titleAr: string;
  slug: string;
  excerpt: string;
  excerptAr: string;
  body: string;
  bodyAr: string;
  coverUrl: string;
  author: string;
  tags: string[];
  published: boolean;
  publishedAt: string;
};

export function JournalEditor({ initial }: { initial: JournalDraft }) {
  const [d, setD] = useState(initial);
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [view, setView] = useState<"write" | "preview">("write");
  const [saving, start] = useTransition();
  const handle = useResultHandler();
  const isNew = !initial.id;
  const set = <K extends keyof JournalDraft>(k: K, v: JournalDraft[K]) => setD((x) => ({ ...x, [k]: v }));
  const body = lang === "en" ? d.body : d.bodyAr;
  const words = d.body.split(/\s+/).filter(Boolean).length;

  return (
    <div className="pb-16">
      <div className="sticky top-0 z-30 -mx-4 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-[#e9dfcc] bg-[#f6f1e7]/95 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10">
        <p className="min-w-0 truncate font-display text-2xl text-ink">{d.title || "New article"}</p>
        <div className="flex gap-2">
          {!isNew && initial.published ? (
            <a href={`/journal/${initial.slug}`} target="_blank" rel="noreferrer" className={buttonClass("secondary")}>
              <ExternalLink /> View
            </a>
          ) : null}
          <button type="button" disabled={saving} onClick={() => start(async () => handle(await saveJournalPost(d)))} className={buttonClass("primary")}>
            {saving ? <Loader2 className="animate-spin" /> : <Save />} {d.published ? "Save & publish" : "Save draft"}
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-6">
          <Card>
            <div className="grid gap-4">
              <Bilingual label="Title" en={d.title} ar={d.titleAr} onEn={(v) => setD((x) => ({ ...x, title: v, slug: isNew ? slugify(v) : x.slug }))} onAr={(v) => set("titleAr", v)} />
              <Field label="Web address" hint={`aayatalruh.com/journal/${d.slug || "…"}`}>
                <TextInput value={d.slug} onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} />
              </Field>
              <Bilingual label="Summary" hint="One or two sentences for article cards and Google" multiline en={d.excerpt} ar={d.excerptAr} onEn={(v) => set("excerpt", v)} onAr={(v) => set("excerptAr", v)} />
            </div>
          </Card>

          <Card
            title="Article"
            description="Use ## for headings, **bold**, *italic*, - for lists and > for quotes."
            actions={
              <div className="flex gap-2">
                <Toggle value={lang} options={[["en", "English"], ["ar", "Arabic"]]} onChange={setLang} />
                <Toggle value={view} options={[["write", "Write"], ["preview", "Preview"]]} onChange={setView} />
              </div>
            }
          >
            {view === "write" ? (
              <TextArea
                value={body}
                dir={lang === "ar" ? "rtl" : "ltr"}
                onChange={(e) => set(lang === "en" ? "body" : "bodyAr", e.target.value)}
                className="min-h-[28rem] font-mono text-[0.82rem]"
                placeholder={lang === "ar" ? "اكتب المقال بالعربية (اختياري)" : "Write the article…"}
                aria-label={`Article (${lang === "en" ? "English" : "Arabic"})`}
              />
            ) : (
              <article dir={lang === "ar" ? "rtl" : "ltr"} className="prose-aar min-h-[28rem] rounded-lg border border-[#f0e8d9] bg-[#fffdf9] p-6">
                {body ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown> : <p className="text-ink-muted">Nothing to preview yet.</p>}
              </article>
            )}
            <p className="mt-2 text-xs text-ink-muted">
              {words} words · about {Math.max(1, Math.round(words / 220))} min read
            </p>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card title="Publishing">
            <div className="grid gap-4">
              <Checkbox label="Published" hint="Untick to keep it as a draft" checked={d.published} onChange={(e) => set("published", e.target.checked)} />
              <Field label="Publish date">
                <TextInput type="date" value={d.publishedAt} onChange={(e) => set("publishedAt", e.target.value)} />
              </Field>
              <Field label="Author">
                <TextInput value={d.author} onChange={(e) => set("author", e.target.value)} />
              </Field>
              <Field label="Tags">
                <TagInput value={d.tags} onChange={(v) => set("tags", v)} suggestions={["Rituals", "Oud", "Attar", "Wellness", "Gifting", "Guides", "Heritage"]} />
              </Field>
            </div>
          </Card>
          <Card title="Cover photo">
            <ImageField value={d.coverUrl} onChange={(v) => set("coverUrl", v)} aspect="aspect-[16/10]" className="flex-col" />
          </Card>
          {!isNew && initial.id ? (
            <Card title="More">
              <ActionButton variant="danger" className="w-full" action={() => deleteJournalPost(initial.id!)} confirm="Delete this article permanently?">
                <Trash2 /> Delete article
              </ActionButton>
            </Card>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function Toggle<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="flex rounded-lg bg-[#efe7d8] p-0.5">
      {options.map(([k, label]) => (
        <button key={k} type="button" onClick={() => onChange(k)} className={cn("rounded-md px-2.5 py-1 text-xs", value === k ? "bg-white font-semibold text-ink shadow-sm" : "text-ink-muted")}>
          {label}
        </button>
      ))}
    </div>
  );
}
