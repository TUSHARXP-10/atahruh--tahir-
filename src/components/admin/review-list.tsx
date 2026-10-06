"use client";

import { BadgeCheck, Check, EyeOff, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { deleteReviews, setReviewStatus, setReviewVerified } from "@/server/admin/actions/reviews";
import { useResultHandler } from "./client";
import { fmtDate } from "./format";
import { StatusBadge, buttonClass } from "./ui";

export type ReviewRow = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  authorName: string;
  location: string | null;
  status: string;
  verified: boolean;
  isPlaceholder: boolean;
  createdAt: string;
  product: { id: string; name: string; slug: string };
};

export function ReviewList({ rows }: { rows: ReviewRow[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, start] = useTransition();
  const handle = useResultHandler();
  const run = (fn: () => Promise<Parameters<typeof handle>[0]>) =>
    start(async () => {
      handle(await fn());
      setSelected([]);
    });
  const all = rows.length > 0 && selected.length === rows.length;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 border-b border-[#f0e8d9] px-5 py-3">
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <input type="checkbox" className="size-4 accent-[#1c1510]" checked={all} onChange={(e) => setSelected(e.target.checked ? rows.map((r) => r.id) : [])} />
          {selected.length ? `${selected.length} selected` : "Select all"}
        </label>
        {selected.length ? (
          <div className="ms-auto flex flex-wrap gap-2">
            <button type="button" disabled={pending} className={buttonClass("primary", "sm")} onClick={() => run(() => setReviewStatus(selected, "APPROVED"))}>
              <Check /> Publish
            </button>
            <button type="button" disabled={pending} className={buttonClass("secondary", "sm")} onClick={() => run(() => setReviewStatus(selected, "REJECTED"))}>
              <EyeOff /> Hide
            </button>
            <button
              type="button"
              disabled={pending}
              className={buttonClass("danger", "sm")}
              onClick={() => window.confirm(`Delete ${selected.length} review(s) permanently?`) && run(() => deleteReviews(selected))}
            >
              <Trash2 /> Delete
            </button>
          </div>
        ) : null}
      </div>
      <ul>
        {rows.map((r) => (
          <li key={r.id} className={cn("flex gap-4 border-b border-[#f0e8d9] px-5 py-4 last:border-0", selected.includes(r.id) && "bg-[#fdf8ea]")}>
            <input
              type="checkbox"
              className="mt-1 size-4 shrink-0 accent-[#1c1510]"
              checked={selected.includes(r.id)}
              onChange={(e) => setSelected((s) => (e.target.checked ? [...s, r.id] : s.filter((x) => x !== r.id)))}
              aria-label={`Select review by ${r.authorName}`}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex text-gold-deep" aria-label={`${r.rating} out of 5`}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} className={cn("size-3.5", n <= r.rating ? "fill-current" : "text-[#dccfb6]")} />
                  ))}
                </span>
                <StatusBadge status={r.status} label={r.status === "APPROVED" ? "Published" : r.status === "REJECTED" ? "Hidden" : "Waiting"} />
                {r.isPlaceholder ? <span className="rounded-full bg-[#eeeae3] px-2 py-0.5 text-[0.68rem] font-semibold text-[#5d5348]">Demo</span> : null}
                <Link href={`/admin/products/${r.product.id}`} className="text-xs text-ink-muted hover:text-ink">
                  on {r.product.name}
                </Link>
              </div>
              {r.title ? <p className="mt-1.5 font-semibold text-ink">{r.title}</p> : null}
              <p className="mt-1 whitespace-pre-line text-sm text-ink">{r.body}</p>
              <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-ink-muted">
                {r.authorName}
                {r.location ? `, ${r.location}` : ""} · {fmtDate(r.createdAt)}
                {r.verified ? (
                  <span className="inline-flex items-center gap-0.5 text-[#1f6b3c]">
                    <BadgeCheck className="size-3.5" /> Verified buyer
                  </span>
                ) : null}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              {r.status !== "APPROVED" ? (
                <button type="button" disabled={pending} className={buttonClass("primary", "sm")} onClick={() => run(() => setReviewStatus([r.id], "APPROVED"))}>
                  Publish
                </button>
              ) : (
                <button type="button" disabled={pending} className={buttonClass("secondary", "sm")} onClick={() => run(() => setReviewStatus([r.id], "REJECTED"))}>
                  Hide
                </button>
              )}
              <button type="button" disabled={pending} className={buttonClass("ghost", "sm")} onClick={() => run(() => setReviewVerified(r.id, !r.verified))}>
                {r.verified ? "Remove verified" : "Mark verified"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
