import type { ReactNode } from "react";
import { Ornament } from "@/components/brand/ornament";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  action,
  align = "start",
  className,
  as: Tag = "h2",
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  align?: "start" | "center";
  className?: string;
  as?: "h1" | "h2" | "h3";
}) {
  const centered = align === "center";
  return (
    <div
      className={cn(
        "flex flex-col gap-5 md:flex-row md:items-end md:justify-between",
        centered && "items-center text-center md:flex-col md:items-center",
        className,
      )}
    >
      <div className={cn("max-w-2xl", centered && "mx-auto")}>
        {eyebrow ? (
          <div className={cn("mb-4 flex items-center gap-3", centered && "justify-center")}>
            <Ornament className="w-8" />
            <span className="eyebrow">{eyebrow}</span>
            {centered ? <Ornament className="w-8 -scale-x-100" /> : null}
          </div>
        ) : null}
        <Tag className="text-display-md text-heading">{title}</Tag>
        {subtitle ? <p className="mt-3 max-w-xl text-[0.95rem] leading-relaxed text-fg-muted">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
