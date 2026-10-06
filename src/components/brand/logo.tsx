import Image from "next/image";
import { cn } from "@/lib/utils";

/*
 * The client's logo, built from their artwork by `scripts/build-logo.py`.
 * `tone` is the background the logo sits on: "dark" = ivory + gold, "light" = ink + gold.
 */

type Tone = "dark" | "light";
const MARK = { w: 668, h: 580 };
const WORD = { w: 658, h: 114 };
const FULL = { w: 684, h: 764 };
// Display widths (CSS px) so phones fetch a few-KB image instead of the full-size artwork
const SIZES = { mark: "52px", word: "112px", full: "176px" };

/** The AR monogram on its own (favicons, compact spots, admin). */
export function Monogram({ className, tone = "dark" }: { className?: string; tone?: Tone }) {
  return <Image src={`/brand/mark-on-${tone}.png`} alt="" aria-hidden width={MARK.w} height={MARK.h} sizes={SIZES.mark} className={cn("h-9 w-auto", className)} />;
}

/**
 * The logo. `inline` (header): the monogram beside the wordmark, so the name stays
 * legible at header size. `stacked` (footer, menu, intro): the full logo artwork.
 */
export function Logo({
  className,
  variant = "inline",
  tone = "dark",
  compact = false,
  priority = false,
}: {
  className?: string;
  variant?: "inline" | "stacked";
  tone?: Tone;
  compact?: boolean;
  priority?: boolean;
  /** Accepted for older call sites; the logo is the same in every language */
  locale?: string;
}) {
  if (variant === "stacked") {
    return <Image src={`/brand/logo-on-${tone}.png`} alt="Aayat al-Ruh" width={FULL.w} height={FULL.h} sizes={SIZES.full} loading={priority ? "eager" : undefined} className={cn("h-32 w-auto", className)} />;
  }
  return (
    // Narrow phones (< 360px) get a slightly smaller lock-up so it clears the header icons
    <span className={cn("inline-flex items-center gap-2 max-[359px]:gap-1.5 sm:gap-2.5", className)}>
      <Image
        src={`/brand/mark-on-${tone}.png`}
        alt=""
        aria-hidden
        width={MARK.w}
        height={MARK.h}
        sizes={SIZES.mark}
        loading={priority ? "eager" : undefined}
        className={cn("w-auto transition-[height] duration-500 max-[359px]:h-[1.8rem]", compact ? "h-8 sm:h-9" : "h-9 sm:h-11")}
      />
      <Image
        src={`/brand/word-on-${tone}.png`}
        alt="Aayat al-Ruh"
        width={WORD.w}
        height={WORD.h}
        sizes={SIZES.word}
        loading={priority ? "eager" : undefined}
        className={cn("w-auto transition-[height] duration-500 max-[359px]:h-[0.8rem]", compact ? "h-[0.95rem] sm:h-[1.05rem]" : "h-[1rem] sm:h-[1.2rem]")}
      />
    </span>
  );
}
