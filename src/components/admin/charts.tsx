"use client";

import { Table2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { money } from "./format";

/*
 * Dashboard charts, following the dataviz method:
 *  - one series → one validated colour (#a07a32 passes every check on the white card), no legend box
 *  - thin columns (≤ 24px), 4px rounded data-end, square at the baseline, 2px surface gap
 *  - hairline solid grid, clean rounded ticks, one direct label (the peak)
 *  - per-column hover/focus tooltip, and a table view twin
 */
const SERIES = "#a07a32";
const SERIES_HOVER = "#7f5f22";
const GRID = "#efe7d8";
const AXIS_TEXT = "#6b5d4d";

export type DayPoint = { date: string; label: string; revenue: number; orders: number };

/** Clean axis: a 1/2/5 × 10ⁿ step, four intervals that cover the max. */
function niceScale(max: number) {
  if (max <= 0) return { max: 100_000, step: 25_000 }; // ₹1,000 so an empty chart still has an axis
  const raw = max / 4;
  const exp = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * exp).find((s) => s >= raw) ?? 10 * exp;
  return { max: Math.ceil(max / step) * step, step };
}

const compactRupees = (paise: number) => {
  const r = paise / 100;
  if (r >= 1_00_000) return `₹${(r / 1_00_000).toFixed(r % 1_00_000 ? 1 : 0)}L`;
  if (r >= 1000) return `₹${(r / 1000).toFixed(r % 1000 ? 1 : 0)}k`;
  return `₹${r}`;
};

export function RevenueChart({ points, title }: { points: DayPoint[]; title: string }) {
  const wrap = useRef<HTMLElement>(null);
  const [width, setWidth] = useState(720);
  const [active, setActive] = useState<number | null>(null);
  const [table, setTable] = useState(false);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(280, Math.round(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const PLOT_H = 220;
  const AXIS_H = 28;
  const LEFT = 52;
  const TOP = 18;
  const plotW = width - LEFT - 8;
  const { max, step } = niceScale(Math.max(...points.map((p) => p.revenue), 0));
  const ticks = Array.from({ length: Math.round(max / step) + 1 }, (_, i) => i * step);
  const band = plotW / Math.max(1, points.length);
  const barW = Math.max(2, Math.min(24, band - 2));
  const y = (v: number) => TOP + PLOT_H - (v / max) * PLOT_H;
  const every = Math.max(1, Math.ceil(points.length / Math.max(1, Math.floor(plotW / 58))));
  const peak = points.reduce((best, p, i) => (p.revenue > (points[best]?.revenue ?? -1) ? i : best), 0);
  const hovered = active !== null ? points[active] : null;

  return (
    // Measured on the figure, which stays mounted when switching to the table view
    <figure ref={wrap} className="m-0 min-w-0">
      <figcaption className="mb-3 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-ink">{title}</span>
        <button type="button" onClick={() => setTable((t) => !t)} className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-ink-muted hover:bg-[#f3ecdf] hover:text-ink" aria-pressed={table}>
          <Table2 className="size-3.5" /> {table ? "Show chart" : "Show table"}
        </button>
      </figcaption>

      {table ? (
        <div className="max-h-[248px] overflow-y-auto rounded-lg border border-[#f0e8d9]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[#fbf7ef] text-xs text-ink-muted">
              <tr>
                <th className="px-3 py-2 text-start font-semibold">Day</th>
                <th className="px-3 py-2 text-end font-semibold">Orders</th>
                <th className="px-3 py-2 text-end font-semibold">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.date} className="border-t border-[#f0e8d9]">
                  <td className="px-3 py-1.5">{p.label}</td>
                  <td className="px-3 py-1.5 text-end tabular-nums">{p.orders}</td>
                  <td className="px-3 py-1.5 text-end tabular-nums">{money(p.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative" onPointerLeave={() => setActive(null)}>
          <svg width={width} height={TOP + PLOT_H + AXIS_H} role="img" aria-label={`${title}. Use the table view for exact values.`} className="block overflow-visible">
            {ticks.map((t) => (
              <g key={t}>
                <line x1={LEFT} x2={LEFT + plotW} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
                <text x={LEFT - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize={11} fill={AXIS_TEXT} className="tabular-nums">
                  {compactRupees(t)}
                </text>
              </g>
            ))}
            {points.map((p, i) => {
              const x = LEFT + i * band + (band - barW) / 2;
              const top = y(p.revenue);
              const h = TOP + PLOT_H - top;
              const r = Math.min(4, h, barW / 2);
              return (
                <g key={p.date}>
                  {h > 0 ? (
                    <path
                      d={`M${x},${TOP + PLOT_H} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${TOP + PLOT_H} Z`}
                      fill={active === i ? SERIES_HOVER : SERIES}
                    />
                  ) : null}
                  {i % every === 0 ? (
                    <text x={LEFT + i * band + band / 2} y={TOP + PLOT_H + 18} textAnchor="middle" fontSize={11} fill={AXIS_TEXT}>
                      {p.label}
                    </text>
                  ) : null}
                  {i === peak && p.revenue > 0 ? (
                    <text x={x + barW / 2} y={top - 6} textAnchor="middle" fontSize={11} fontWeight={600} fill="#1c1510">
                      {compactRupees(p.revenue)}
                    </text>
                  ) : null}
                  {/* Hit target: the whole band, taller than the bar */}
                  <rect
                    x={LEFT + i * band}
                    y={TOP}
                    width={band}
                    height={PLOT_H}
                    fill="transparent"
                    tabIndex={0}
                    aria-label={`${p.label}: ${money(p.revenue)}, ${p.orders} order${p.orders === 1 ? "" : "s"}`}
                    onPointerEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    onBlur={() => setActive(null)}
                    className="cursor-default outline-none"
                  />
                </g>
              );
            })}
            <line x1={LEFT} x2={LEFT + plotW} y1={TOP + PLOT_H} y2={TOP + PLOT_H} stroke="#dccfb6" strokeWidth={1} />
          </svg>
          {hovered && active !== null ? (
            <div
              className="pointer-events-none absolute z-10 min-w-36 -translate-x-1/2 rounded-lg border border-[#e9dfcc] bg-white px-3 py-2 text-xs shadow-lg"
              style={{ left: Math.min(Math.max(LEFT + active * band + band / 2, 80), width - 80), top: Math.max(0, y(hovered.revenue) - 64) }}
              role="status"
            >
              <p className="text-sm font-semibold text-ink">{money(hovered.revenue)}</p>
              <p className="flex items-center gap-1.5 text-ink-muted">
                <span className="inline-block h-0.5 w-3 rounded" style={{ background: SERIES }} />
                {hovered.label} · {hovered.orders} order{hovered.orders === 1 ? "" : "s"}
              </p>
            </div>
          ) : null}
        </div>
      )}
    </figure>
  );
}

/** Ranked horizontal bars with the value at each bar's tip. */
export function BarList({ rows, empty }: { rows: { key: string; label: string; value: number; sub: string }[]; empty: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length) return <p className="py-6 text-center text-sm text-ink-muted">{empty}</p>;
  return (
    <ol className="space-y-3">
      {rows.map((r) => (
        <li key={r.key} className="group" title={`${r.label}: ${money(r.value)} · ${r.sub}`}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-ink">{r.label}</span>
            <span className="shrink-0 text-xs text-ink-muted">{r.sub}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2.5 flex-1">
              <div className="h-full rounded-e-[4px] transition-colors group-hover:bg-[#7f5f22]" style={{ width: `${(r.value / max) * 100}%`, background: SERIES }} />
            </div>
            <span className="w-20 shrink-0 text-end text-xs font-semibold tabular-nums text-ink">{money(r.value)}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Share of one part against the whole: fill + same-hue lighter track, both labelled. */
export function ShareMeter({ part, whole, partLabel, restLabel }: { part: number; whole: number; partLabel: string; restLabel: string }) {
  const pct = whole ? Math.round((part / whole) * 100) : 0;
  return (
    <div>
      <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full" role="img" aria-label={`${partLabel} ${pct}%, ${restLabel} ${100 - pct}%`}>
        <div className={cn("h-full", pct ? "rounded-s-full" : "")} style={{ width: `${pct}%`, background: SERIES }} />
        <div className="h-full flex-1 rounded-e-full bg-[#ecdcb8]" />
      </div>
      <div className="mt-2 flex justify-between text-xs">
        <span className="flex items-center gap-1.5 text-ink">
          <span className="size-2 rounded-full" style={{ background: SERIES }} /> {partLabel} <strong className="font-semibold">{pct}%</strong>
        </span>
        <span className="flex items-center gap-1.5 text-ink">
          <span className="size-2 rounded-full bg-[#ecdcb8]" /> {restLabel} <strong className="font-semibold">{100 - pct}%</strong>
        </span>
      </div>
    </div>
  );
}
