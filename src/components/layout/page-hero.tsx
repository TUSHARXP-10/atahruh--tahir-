import Image from "next/image";
import type { ReactNode } from "react";
import { Ornament } from "@/components/brand/ornament";
import { GirihPattern } from "@/components/brand/patterns";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

/**
 * Dark editorial header for content pages: breadcrumbs, eyebrow, title and
 * intro, with an optional photo fading in from the end side (as in the design).
 */
export function PageHero({
  breadcrumb,
  eyebrow,
  title,
  intro,
  image,
  imagePosition = "50% 50%",
  children,
  compact = false,
}: {
  breadcrumb: { label: string; href?: string }[];
  eyebrow?: ReactNode;
  title: ReactNode;
  intro?: ReactNode;
  image?: string;
  imagePosition?: string;
  children?: ReactNode;
  compact?: boolean;
}) {
  return (
    <section className="relative overflow-hidden border-b border-gold/10 bg-noir">
      <GirihPattern opacity={0.035} />
      {image ? (
        <div className="fade-start absolute inset-y-0 end-0 hidden w-[52%] md:block" aria-hidden>
          <Image src={image} alt="" fill loading="eager" fetchPriority="high" sizes="52vw" className="object-cover opacity-80" style={{ objectPosition: imagePosition }} />
          <div className="absolute inset-0 bg-gradient-to-t from-noir/70 via-transparent to-noir/30" />
        </div>
      ) : null}
      <Container className={cn("relative", compact ? "py-10 lg:py-14" : "py-14 lg:py-24")}>
        <div className="max-w-2xl">
          <Breadcrumbs items={breadcrumb} />
          {eyebrow ? (
            <div className="mb-4 mt-8 flex items-center gap-3">
              <Ornament className="w-8" />
              <span className="eyebrow">{eyebrow}</span>
            </div>
          ) : (
            <div className="mt-8" />
          )}
          <h1 className={cn("text-ivory", compact ? "text-display-md" : "text-display-lg")}>{title}</h1>
          {intro ? <p className="mt-5 max-w-xl text-[1.02rem] leading-relaxed text-smoke">{intro}</p> : null}
          {children ? <div className="mt-8">{children}</div> : null}
        </div>
      </Container>
    </section>
  );
}
