import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * Page band with a colour tone. "light" is the warm ivory band from the
 * design; children using tone tokens (text-heading, text-fg-muted,
 * border-hairline, bg-surface, bg-btn…) adapt automatically.
 */
export function Section({ tone = "dark", className, ...props }: ComponentProps<"section"> & { tone?: "dark" | "light" }) {
  return (
    <section
      data-tone={tone}
      className={cn("relative", tone === "light" ? "bg-cream text-ink" : "bg-noir text-ivory", className)}
      {...props}
    />
  );
}
