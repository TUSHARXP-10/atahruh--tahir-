import { discountPercent, formatPrice } from "@/lib/money";
import { cn } from "@/lib/utils";

export function Price({
  price,
  mrp,
  locale,
  className,
  size = "md",
  saveLabel,
}: {
  price: number;
  mrp?: number | null;
  locale: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  /** When provided, a "Save x%" tag is shown for discounted items */
  saveLabel?: (percent: number) => string;
}) {
  const off = discountPercent(price, mrp);
  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-2 gap-y-1", className)}>
      <span
        className={cn(
          "font-sans font-semibold tabular-nums text-ivory",
          size === "sm" && "text-sm",
          size === "md" && "text-base",
          size === "lg" && "text-2xl",
        )}
      >
        {formatPrice(price, locale)}
      </span>
      {off > 0 && mrp ? (
        <>
          <s className="text-xs tabular-nums text-mist">{formatPrice(mrp, locale)}</s>
          {saveLabel ? (
            <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-gold">{saveLabel(off)}</span>
          ) : null}
        </>
      ) : null}
    </span>
  );
}
