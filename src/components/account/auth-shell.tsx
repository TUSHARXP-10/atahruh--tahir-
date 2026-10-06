import Image from "next/image";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { ArchOutline, CalligraphyWatermark } from "@/components/brand/patterns";
import { photo } from "@/lib/images";

/** Split-screen frame for sign-in / sign-up / reset pages. */
export function AuthShell({ children }: { locale?: string; children: ReactNode }) {
  return (
    <section className="relative grid min-h-[calc(100dvh-6.25rem)] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <Image src={photo("lanternMarble", 1600)} alt="" fill loading="eager" fetchPriority="high" sizes="50vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-noir via-noir/40 to-noir/30" />
        <CalligraphyWatermark className="absolute bottom-10 start-10 text-[8rem] text-gold/20" />
        <Logo variant="stacked" className="absolute start-1/2 top-1/2 h-48 -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_10px_40px_rgba(0,0,0,0.7)] rtl:translate-x-1/2" />
      </div>
      <div className="relative flex items-center justify-center px-4 py-14 sm:px-10">
        <div className="relative w-full max-w-md">
          <div className="pointer-events-none absolute -inset-x-10 -inset-y-14 hidden opacity-40 sm:block">
            <ArchOutline className="text-gold/30" />
          </div>
          <div className="relative">{children}</div>
        </div>
      </div>
    </section>
  );
}
