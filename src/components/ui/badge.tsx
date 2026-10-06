import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const tones = {
  gold: "bg-gold-metal text-ink",
  outline: "border border-gold/50 bg-noir/60 text-gold-light backdrop-blur",
  ruby: "bg-ruby/90 text-parchment",
  dark: "bg-noir/80 text-gold-light backdrop-blur",
  emerald: "bg-emerald/90 text-parchment",
} as const;

export function Badge({ tone = "outline", className, ...props }: ComponentProps<"span"> & { tone?: keyof typeof tones }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-sans text-[0.6rem] font-semibold uppercase tracking-[0.16em]",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
