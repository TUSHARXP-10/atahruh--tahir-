import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "group/btn relative inline-flex select-none items-center justify-center gap-2.5 overflow-hidden whitespace-nowrap font-sans font-medium uppercase tracking-[0.14em] transition-[color,background,border-color,box-shadow,transform] duration-500 ease-(--ease-luxe) disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        gold:
          "bg-gold-metal text-ink shadow-[0_8px_30px_-12px_rgba(201,165,92,0.65)] before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent before:transition-transform before:duration-700 hover:shadow-[0_12px_40px_-10px_rgba(232,205,146,0.75)] hover:before:translate-x-full",
        outline: "border border-gold/55 text-gold-light hover:border-gold-light hover:bg-gold/10 hover:text-gold-pale",
        ghost: "text-ivory/80 hover:bg-white/5 hover:text-gold-light",
        dark: "border border-gold/30 bg-noir text-gold-light hover:border-gold hover:text-gold-pale",
        ivory: "bg-ivory text-ink hover:bg-parchment",
        /** Outline that follows the surrounding section tone (readable on light and dark bands) */
        line: "border border-heading/30 text-heading hover:border-accent hover:text-accent",
        link: "h-auto p-0 tracking-[0.18em] text-gold underline-offset-8 hover:text-gold-light hover:underline",
      },
      size: {
        sm: "h-9 px-4 text-[0.66rem]",
        md: "h-11 px-6 text-[0.7rem]",
        lg: "h-13 px-8 text-[0.74rem]",
        icon: "size-10 tracking-normal",
      },
      shape: {
        square: "rounded-none",
        soft: "rounded-sm",
        pill: "rounded-full",
      },
    },
    defaultVariants: { variant: "gold", size: "md", shape: "soft" },
  },
);

type ButtonProps = ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({ className, variant, size, shape, asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return <Comp className={cn(buttonVariants({ variant, size, shape }), className)} {...props} />;
}
