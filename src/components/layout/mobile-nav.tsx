"use client";

import { ChevronDown, Heart, MessageCircle, Package, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { Accordion } from "radix-ui";
import { Logo } from "@/components/brand/logo";
import { StarDivider } from "@/components/brand/ornament";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Link } from "@/i18n/navigation";
import { NAV } from "@/lib/navigation";
import { site } from "@/lib/site";
import { LocaleSwitcher } from "./locale-switcher";

export function MobileNav({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const t = useTranslations();
  const close = () => onOpenChange(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="start" className="w-[min(92vw,24rem)]" closeLabel={t("common.close")}>
        <SheetTitle className="sr-only">{t("common.menu")}</SheetTitle>
        <div className="border-b border-gold/10 px-6 pb-5 pt-6">
          <Logo variant="stacked" className="h-20" />
        </div>

        <nav className="flex-1 overflow-y-auto px-6 py-4" aria-label={t("common.menu")}>
          <Accordion.Root type="single" collapsible>
            {NAV.map((item) =>
              item.columns ? (
                <Accordion.Item key={item.key} value={item.key} className="border-b border-gold/10">
                  <Accordion.Trigger className="group flex w-full items-center justify-between py-4 font-display text-2xl text-ivory">
                    {t(`nav.${item.key}`)}
                    <ChevronDown className="size-4 text-gold transition-transform duration-300 group-data-[state=open]:rotate-180" strokeWidth={1.25} />
                  </Accordion.Trigger>
                  <Accordion.Content className="overflow-hidden data-[state=closed]:animate-[fade-out_.2s] data-[state=open]:animate-[fade-in_.3s]">
                    <div className="space-y-5 pb-5">
                      {item.columns.map((col) => (
                        <div key={col.titleKey}>
                          <p className="eyebrow mb-2 text-[0.6rem]">{t(`nav.${col.titleKey}`)}</p>
                          <ul className="grid grid-cols-2 gap-x-3">
                            {col.links.map((l) => (
                              <li key={l.href + l.key}>
                                <Link href={l.href} onClick={close} className="block py-1.5 text-sm text-smoke hover:text-gold-light">
                                  {t(`${l.ns ?? "nav"}.${l.key}`)}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </Accordion.Content>
                </Accordion.Item>
              ) : (
                <Link key={item.key} href={item.href} onClick={close} className="block border-b border-gold/10 py-4 font-display text-2xl text-ivory">
                  {t(`nav.${item.key}`)}
                </Link>
              ),
            )}
          </Accordion.Root>

          <div className="mt-6 grid grid-cols-2 gap-2">
            {[
              { href: "/account", icon: User, label: t("common.account") },
              { href: "/wishlist", icon: Heart, label: t("common.wishlist") },
              { href: "/track-order", icon: Package, label: t("nav.trackOrder") },
            ].map(({ href, icon: Icon, label }) => (
              <Link key={href} href={href} onClick={close} className="flex items-center gap-2 rounded-sm border border-gold/15 px-3 py-3 text-xs text-smoke hover:border-gold/40 hover:text-gold-light">
                <Icon className="size-4" strokeWidth={1.25} />
                {label}
              </Link>
            ))}
            <a
              href={`https://wa.me/${site.contact.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-sm border border-gold/15 px-3 py-3 text-xs text-smoke hover:border-gold/40 hover:text-gold-light"
            >
              <MessageCircle className="size-4" strokeWidth={1.25} />
              WhatsApp
            </a>
          </div>
        </nav>

        <div className="border-t border-gold/10 px-6 py-5">
          <StarDivider className="mb-4" />
          <div className="flex justify-center">
            <LocaleSwitcher variant="full" />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
