"use client";

import { Loader2, Minus, Plus, Save } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { updateStock } from "@/server/admin/actions/inventory";
import { useResultHandler } from "./client";
import { money } from "./format";
import { buttonClass, inputClass, Table } from "./ui";

export type InventoryRow = { id: string; productId: string; product: string; form: string; label: string; sku: string; price: number; stock: number; waiting: number };

export function InventoryTable({ rows, low }: { rows: InventoryRow[]; low: number }) {
  const [edits, setEdits] = useState<Record<string, number>>({});
  const [saving, start] = useTransition();
  const handle = useResultHandler();
  const changed = Object.entries(edits).filter(([id, v]) => rows.find((r) => r.id === id)?.stock !== v);

  const setStock = (id: string, v: number) => setEdits((e) => ({ ...e, [id]: Math.max(0, Math.min(1_000_000, v)) }));
  const save = () =>
    start(async () => {
      const res = await updateStock(changed.map(([id, stock]) => ({ id, stock })));
      if (res.ok) setEdits({});
      handle(res);
    });

  return (
    <>
      <Table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Size</th>
            <th>SKU</th>
            <th className="text-end">Price</th>
            <th className="text-end">Waiting</th>
            <th className="text-end">In stock</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const value = edits[r.id] ?? r.stock;
            const dirty = value !== r.stock;
            return (
              <tr key={r.id} className={cn(dirty && "bg-[#fdf8ea]")}>
                <td>
                  <Link href={`/admin/products/${r.productId}`} className="font-medium text-ink hover:text-gold-deep">
                    {r.product}
                  </Link>
                  <span className="ms-2 text-xs text-ink-muted">{r.form}</span>
                </td>
                <td className="text-ink-muted">{r.label}</td>
                <td className="font-mono text-xs text-ink-muted">{r.sku}</td>
                <td className="text-end tabular-nums">{money(r.price)}</td>
                <td className="text-end tabular-nums">{r.waiting ? <span className="rounded-full bg-gold/25 px-2 py-0.5 text-xs font-semibold text-ink" title="Customers waiting for a back-in-stock email">{r.waiting}</span> : <span className="text-ink-muted">—</span>}</td>
                <td>
                  <div className="flex items-center justify-end gap-1">
                    <button type="button" className={buttonClass("ghost", "sm")} onClick={() => setStock(r.id, value - 1)} aria-label={`One less ${r.product} ${r.label}`}>
                      <Minus />
                    </button>
                    <input
                      inputMode="numeric"
                      value={value}
                      onChange={(e) => setStock(r.id, Number(e.target.value.replace(/\D/g, "") || 0))}
                      className={cn(inputClass, "h-8 w-20 text-end tabular-nums", value === 0 ? "border-ruby/50 text-ruby" : value <= low ? "border-[#ecd9a8]" : "")}
                      aria-label={`Stock for ${r.product} ${r.label}`}
                    />
                    <button type="button" className={buttonClass("ghost", "sm")} onClick={() => setStock(r.id, value + 1)} aria-label={`One more ${r.product} ${r.label}`}>
                      <Plus />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
      <div className={cn("sticky bottom-4 z-20 mx-4 mt-4 flex items-center justify-between gap-3 rounded-xl bg-ink px-4 py-3 text-sm text-ivory shadow-xl transition-opacity", changed.length ? "opacity-100" : "pointer-events-none opacity-0")}>
        <span>
          {changed.length} unsaved change{changed.length === 1 ? "" : "s"}
        </span>
        <div className="flex gap-2">
          <button type="button" className="rounded-lg px-3 py-1.5 text-sand hover:text-ivory" onClick={() => setEdits({})}>
            Discard
          </button>
          <button type="button" onClick={save} disabled={saving} className={buttonClass("gold", "sm")}>
            {saving ? <Loader2 className="animate-spin" /> : <Save />} Save stock
          </button>
        </div>
      </div>
    </>
  );
}
