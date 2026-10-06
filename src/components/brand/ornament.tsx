import { cn } from "@/lib/utils";

/** Hairline gold rule ending in a diamond — used beside eyebrows and dividers. */
export function Ornament({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 8" className={cn("h-2 text-accent rtl:-scale-x-100", className)} aria-hidden fill="none">
      <path d="M0 4h38" stroke="currentColor" strokeOpacity="0.7" strokeWidth="0.75" />
      <path d="M42 0.8 45.2 4 42 7.2 38.8 4z" fill="currentColor" />
      <circle cx="47.2" cy="4" r="0.8" fill="currentColor" />
    </svg>
  );
}

/** Symmetric divider with an eight-pointed star (khatam) at its centre. */
export function StarDivider({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-4 text-accent", className)} aria-hidden>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-gold/50" />
      <KhatamStar className="size-3.5" />
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-gold/50" />
    </div>
  );
}

/** Eight-pointed star made of two overlapping squares. */
export function KhatamStar({ className, filled = true }: { className?: string; filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <g fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? 0 : 1}>
        <rect x="5" y="5" width="14" height="14" />
        <rect x="5" y="5" width="14" height="14" transform="rotate(45 12 12)" />
      </g>
    </svg>
  );
}
