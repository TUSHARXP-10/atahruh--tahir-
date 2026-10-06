import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-sm border border-gold/25 bg-ebony/70 px-4 text-sm text-ivory transition-colors placeholder:text-mist focus:border-gold/70 focus:outline-none focus-visible:outline-none aria-invalid:border-ruby",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-sm border border-gold/25 bg-ebony/70 px-4 py-3 text-sm text-ivory transition-colors placeholder:text-mist focus:border-gold/70 focus:outline-none",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return (
    <label
      className={cn("mb-2 block text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-smoke", className)}
      {...props}
    />
  );
}
