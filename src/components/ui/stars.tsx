import { cn } from "@/lib/utils";

const STAR = "M12 2.6l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.4l-5.9 3.3 1.3-6.6L2.5 9.5l6.6-.8z";

/** Accessible star rating that supports fractional values. */
export function Stars({
  value,
  size = 12,
  className,
  label,
}: {
  value: number;
  size?: number;
  className?: string;
  label?: string;
}) {
  return (
    <span
      className={cn("relative inline-flex items-center text-gold", className)}
      role="img"
      aria-label={label ?? `${value.toFixed(1)} / 5`}
    >
      <span className="inline-flex gap-0.5 opacity-25" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => (
          <svg key={i} width={size} height={size} viewBox="0 0 24 24" className="shrink-0">
            <path d={STAR} fill="currentColor" />
          </svg>
        ))}
      </span>
      <span
        className="absolute inset-y-0 start-0 inline-flex gap-0.5 overflow-hidden"
        style={{ width: `${(Math.max(0, Math.min(5, value)) / 5) * 100}%` }}
        aria-hidden
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <svg key={i} width={size} height={size} viewBox="0 0 24 24" className="shrink-0">
            <path d={STAR} fill="currentColor" />
          </svg>
        ))}
      </span>
    </span>
  );
}
