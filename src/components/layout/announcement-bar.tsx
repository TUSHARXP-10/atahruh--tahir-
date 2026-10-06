"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { KhatamStar } from "@/components/brand/ornament";

/** Slim rotating announcements above the header. */
export function AnnouncementBar({ items }: { items: string[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (items.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % items.length), 4800);
    return () => clearInterval(id);
  }, [items.length]);

  if (!items.length) return null;

  return (
    <div className="relative z-[51] h-9 overflow-hidden border-b border-gold/10 bg-ebony text-[0.62rem] tracking-[0.1em] text-gold-light/90 sm:text-[0.68rem] sm:tracking-[0.16em]">
      <div className="mx-auto flex h-full max-w-[1440px] items-center justify-center gap-3 px-4" aria-live="polite">
        <KhatamStar className="size-2.5 shrink-0 text-gold/70 max-[399px]:hidden" />
        <div className="relative h-full min-w-0 flex-1 sm:flex-none sm:min-w-[26rem]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={index}
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -14, opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex items-center justify-center text-center uppercase"
            >
              {/* Long messages wrap to a second line on narrow phones instead of being cut off */}
              <span className="line-clamp-2 leading-[1.3]">{items[index]}</span>
            </motion.p>
          </AnimatePresence>
        </div>
        <KhatamStar className="size-2.5 shrink-0 text-gold/70 max-[399px]:hidden" />
      </div>
    </div>
  );
}
