"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Word-by-word masked reveal. Splits on spaces only — never on letters —
 * so Arabic letterforms stay joined.
 */
export function SplitWords({
  text,
  className,
  wordClassName,
  delay = 0,
  stagger = 0.07,
  animateOnMount = false,
}: {
  text: string;
  className?: string;
  wordClassName?: string;
  delay?: number;
  stagger?: number;
  animateOnMount?: boolean;
}) {
  const reduce = useReducedMotion();
  const words = text.split(" ");
  const trigger = animateOnMount ? { animate: "show" } : { whileInView: "show", viewport: { once: true, amount: 0.5 } };

  return (
    <motion.span
      className={cn("inline", className)}
      initial={reduce ? false : "hidden"}
      {...trigger}
      transition={{ staggerChildren: stagger, delayChildren: delay }}
    >
      {/* Screen readers get the whole phrase once; the animated words are hidden from them */}
      <span className="sr-only">{text}</span>
      {words.map((word, i) => (
        <span key={`${word}-${i}`} className="inline-block overflow-hidden pb-[0.12em] align-bottom" aria-hidden>
          <motion.span
            className={cn("inline-block will-change-transform", wordClassName)}
            variants={{
              hidden: { y: "110%", opacity: 0 },
              show: { y: "0%", opacity: 1, transition: { duration: 1.1, ease: [0.22, 1, 0.36, 1] } },
            }}
          >
            {word}
          </motion.span>
          {i < words.length - 1 ? " " : null}
        </span>
      ))}
    </motion.span>
  );
}
