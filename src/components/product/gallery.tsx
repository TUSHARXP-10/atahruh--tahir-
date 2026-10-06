"use client";

import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useState, type PointerEvent } from "react";
import { ArchOutline } from "@/components/brand/patterns";
import type { FormType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ProductVisual } from "./product-visual";

export type GalleryItem = { kind: "art" } | { kind: "photo"; url: string; alt: string };

export function Gallery({
  items,
  form,
  productKind,
  name,
  color,
  shape,
}: {
  items: GalleryItem[];
  form: FormType;
  productKind: string;
  name: string;
  color: string;
  shape: string;
}) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const current = items[Math.min(index, items.length - 1)];

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (current?.kind !== "photo" || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };

  return (
    <div className="flex min-w-0 flex-col-reverse gap-4 lg:flex-row">
      {items.length > 1 ? (
        <div className="no-scrollbar flex min-w-0 gap-3 overflow-x-auto lg:max-h-[40rem] lg:flex-col lg:overflow-y-auto">
          {items.map((item, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`${name} ${i + 1}`}
              aria-current={i === index}
              className={cn(
                "relative h-24 w-18 shrink-0 overflow-hidden rounded-t-full rounded-b-sm border transition-colors",
                i === index ? "border-gold" : "border-gold/15 opacity-70 hover:opacity-100",
              )}
            >
              {item.kind === "art" ? (
                <ProductVisual form={form} kind={productKind} name={name} color={color} shape={shape} plain sizes="72px" />
              ) : (
                <Image src={item.url} alt="" fill sizes="72px" className="object-cover" />
              )}
            </button>
          ))}
        </div>
      ) : null}

      <div className="relative min-w-0 flex-1">
        <div
          className="relative aspect-[4/5] cursor-crosshair overflow-hidden rounded-t-[999px] rounded-b-sm border border-gold/20 lg:aspect-auto lg:h-[min(46rem,78svh)]"
          onPointerMove={onMove}
          onPointerLeave={() => setZoom(null)}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={`${form}-${index}`}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 0.96, filter: "blur(6px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              {current?.kind === "photo" ? (
                <Image
                  src={current.url}
                  alt={current.alt}
                  fill
                  loading="eager"
                  fetchPriority="high"
                  sizes="(min-width: 1024px) 45vw, 100vw"
                  className="object-cover transition-transform duration-300"
                  style={zoom ? { transform: "scale(1.8)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
                />
              ) : (
                <ProductVisual form={form} kind={productKind} name={name} color={color} shape={shape} priority sizes="(min-width: 1024px) 45vw, 100vw" />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        <ArchOutline className="-inset-3 h-[calc(100%+1.5rem)] w-[calc(100%+1.5rem)] text-gold/25 max-lg:hidden" />
      </div>
    </div>
  );
}
