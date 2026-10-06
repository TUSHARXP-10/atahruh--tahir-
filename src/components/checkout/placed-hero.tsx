"use client";

import { motion } from "motion/react";
import { useEffect } from "react";
import { KhatamStar } from "@/components/brand/ornament";
import { GoldDust } from "@/components/motion/gold-dust";
import { useStore } from "@/components/providers/store-provider";

/** Celebration banner shown right after an order is placed. */
export function PlacedHero({ title, text, cod, next, nextTitle }: { title: string; text: string; cod: string | null; next: string[]; nextTitle: string }) {
  const { refreshCart } = useStore();
  useEffect(() => {
    void refreshCart();
  }, [refreshCart]);

  return (
    <section className="relative mb-12 overflow-hidden rounded-sm border border-gold/25 bg-[radial-gradient(ellipse_at_50%_0%,#3a2716,#15100c_70%)] px-6 py-14 text-center sm:px-12">
      <GoldDust density={0.00012} />
      <motion.div initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }} className="relative mx-auto mb-6 grid size-16 place-items-center">
        <KhatamStar className="absolute inset-0 size-16 text-gold" />
        <span className="relative text-2xl text-ink">✓</span>
      </motion.div>
      <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8 }} className="relative text-display-md text-ivory">
        {title}
      </motion.h1>
      <p className="relative mx-auto mt-4 max-w-xl text-smoke">{text}</p>
      {cod ? <p className="relative mt-3 text-gold-light">{cod}</p> : null}
      <div className="relative mx-auto mt-10 max-w-3xl">
        <p className="eyebrow mb-5 text-[0.6rem]">{nextTitle}</p>
        <ol className="grid gap-4 sm:grid-cols-3">
          {next.map((n, i) => (
            <li key={n} className="glass-light rounded-sm border border-gold/15 px-4 py-5 text-sm text-ivory">
              <span className="mb-2 block font-display text-3xl text-gold">{i + 1}</span>
              {n}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
