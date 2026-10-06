import { useId } from "react";
import { cn } from "@/lib/utils";

/** Faint girih / khatam lattice used behind sections. */
export function GirihPattern({ className, opacity = 0.07 }: { className?: string; opacity?: number }) {
  const id = `girih${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg
      className={cn("pointer-events-none absolute inset-0 h-full w-full text-gold", className)}
      style={{ opacity }}
      aria-hidden
    >
      <defs>
        <pattern id={id} width="64" height="64" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="currentColor" strokeWidth="0.6">
            <rect x="20" y="20" width="24" height="24" />
            <rect x="20" y="20" width="24" height="24" transform="rotate(45 32 32)" />
            <path d="M0 32h15M49 32h15M32 0v15M32 49v15" />
            <circle cx="32" cy="32" r="4" />
            <path d="M0 0l8 8M64 0l-8 8M0 64l8-8M64 64l-8-8" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

/** Large Arabic calligraphic watermark — "verses of the soul". */
export function CalligraphyWatermark({ className, text = "آيات الروح" }: { className?: string; text?: string }) {
  return (
    <span
      aria-hidden
      lang="ar"
      dir="rtl"
      className={cn(
        "pointer-events-none select-none font-arabic leading-none text-gold/[0.06]",
        className,
      )}
    >
      {text}
    </span>
  );
}

/** Pointed-arch outline (for framing imagery). Stretches to its container. */
export function ArchOutline({ className, inset = false }: { className?: string; inset?: boolean }) {
  return (
    <svg
      viewBox="0 0 100 140"
      preserveAspectRatio="none"
      className={cn("pointer-events-none absolute inset-0 h-full w-full text-gold", className)}
      aria-hidden
      fill="none"
    >
      <path
        d="M0.5 139.5V52.2C0.5 26.5 22 10.6 50 0.6c28 10 49.5 25.9 49.5 51.6v87.3"
        stroke="currentColor"
        strokeWidth="0.5"
        vectorEffect="non-scaling-stroke"
      />
      {inset ? (
        <path
          d="M5 139.5V54C5 31.5 24 17.5 50 8c26 9.5 45 23.5 45 46v85.5"
          stroke="currentColor"
          strokeOpacity="0.4"
          strokeWidth="0.5"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
    </svg>
  );
}
