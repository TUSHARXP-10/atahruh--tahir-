"use client";

import { Expand, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useStore } from "@/components/providers/store-provider";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Link } from "@/i18n/navigation";
import { ConciergeChat } from "./concierge-chat";

/** Slide-in concierge opened from the floating button on every page. */
export function ConciergeDrawer({ whatsapp }: { whatsapp: string }) {
  const t = useTranslations("concierge");
  const { conciergeOpen, setConciergeOpen } = useStore();
  return (
    <Sheet open={conciergeOpen} onOpenChange={setConciergeOpen}>
      <SheetContent side="end" className="w-full sm:max-w-md">
        <div className="flex items-center gap-3 border-b border-gold/15 px-5 py-4 pe-14">
          <span className="grid size-9 place-items-center rounded-full bg-gold-metal text-ink">
            <Sparkles className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <SheetTitle className="font-display text-2xl text-ivory">{t("title")}</SheetTitle>
            <SheetDescription className="truncate text-xs text-mist">{t("subtitle")}</SheetDescription>
          </div>
          <Link href="/concierge" onClick={() => setConciergeOpen(false)} className="text-mist hover:text-gold-light" aria-label={t("openFull")} title={t("openFull")}>
            <Expand className="size-4" />
          </Link>
        </div>
        <div className="min-h-0 flex-1">
          {/* Mounted only while open, so each opening picks up the saved conversation */}
          {conciergeOpen ? <ConciergeChat whatsapp={whatsapp} compact onNavigate={() => setConciergeOpen(false)} /> : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
