"use client";

import { ChevronDown, Heart, Menu, Search, ShoppingBag, User } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { NavigationMenu } from "radix-ui";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { Ornament } from "@/components/brand/ornament";
import { useStore } from "@/components/providers/store-provider";
import { Link, usePathname } from "@/i18n/navigation";
import { dirFor } from "@/i18n/routing";
import { NAV, type NavItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { LocaleSwitcher } from "./locale-switcher";
import { MobileNav } from "./mobile-nav";

export function Header() {
  const locale = useLocale();
  const t = useTranslations();
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { cart, setCartOpen, setSearchOpen, wishlist } = useStore();
  const count = cart?.totals.itemCount ?? 0;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ⌘K / Ctrl+K opens search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setSearchOpen]);

  const solid = scrolled || !isHome;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-[background,border-color,backdrop-filter] duration-500",
        solid ? "glass border-b border-gold/10" : "border-b border-transparent bg-transparent",
      )}
    >
      <div
        className={cn(
          "mx-auto flex max-w-[1440px] items-center gap-4 px-4 transition-[height] duration-500 sm:px-6 lg:px-10",
          solid ? "h-16" : "h-20",
        )}
      >
        {/* Mobile: menu */}
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="-ms-2 grid size-10 place-items-center text-ivory/90 lg:hidden"
          aria-label={t("header.openMenu")}
        >
          <Menu className="size-5" strokeWidth={1.25} />
        </button>

        <Link href="/" className="shrink-0 max-lg:absolute max-lg:start-1/2 max-lg:-translate-x-1/2 max-lg:rtl:translate-x-1/2" aria-label={t("common.brand")}>
          <Logo compact={solid} priority />
        </Link>

        {/* Desktop navigation */}
        <NavigationMenu.Root
          dir={dirFor(locale)}
          delayDuration={60}
          className="hidden flex-1 justify-center lg:flex"
        >
          <NavigationMenu.List className="flex items-center gap-1">
            {NAV.map((item) => (
              <NavEntry key={item.key} item={item} active={isActive(pathname, item.href)} />
            ))}
          </NavigationMenu.List>
          <div className="absolute inset-x-0 top-full flex justify-center">
            <NavigationMenu.Viewport className="relative mt-0 h-[var(--radix-navigation-menu-viewport-height)] w-full origin-top overflow-hidden border-y border-gold/15 bg-noir/95 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.9)] backdrop-blur-xl transition-[height] duration-300 data-[state=closed]:animate-[fade-out_.2s_ease] data-[state=open]:animate-[fade-in_.3s_ease]" />
          </div>
        </NavigationMenu.Root>

        {/* Actions */}
        <div className="ms-auto flex items-center gap-0.5 sm:gap-1">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="me-2 hidden h-10 w-60 items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.06] px-4 text-start text-[0.72rem] text-smoke backdrop-blur transition-colors hover:border-gold/50 hover:text-ivory min-[1380px]:flex min-[1380px]:w-52 2xl:w-72"
          >
            <Search className="size-4 shrink-0 text-gold-light" strokeWidth={1.5} />
            <span className="flex-1 truncate">{t("header.searchPlaceholder")}</span>
            <kbd className="hidden rounded border border-white/15 px-1.5 py-0.5 font-sans text-[0.58rem] text-mist 2xl:inline">⌘K</kbd>
          </button>
          <IconButton label={t("common.search")} onClick={() => setSearchOpen(true)} className="min-[1380px]:hidden">
            <Search strokeWidth={1.25} />
          </IconButton>
          <LocaleSwitcher className="hidden md:inline-flex" />
          <IconButton label={t("common.account")} href="/account" className="hidden sm:grid">
            <User strokeWidth={1.25} />
          </IconButton>
          <IconButton label={t("common.wishlist")} href="/wishlist" className="hidden sm:grid" count={wishlist.length}>
            <Heart strokeWidth={1.25} />
          </IconButton>
          <IconButton label={t("header.cartCount", { count })} onClick={() => setCartOpen(true)} count={count}>
            <ShoppingBag strokeWidth={1.25} />
          </IconButton>
        </div>
      </div>

      <MobileNav open={mobileOpen} onOpenChange={setMobileOpen} />
    </header>
  );
}

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href.split("?")[0]);
}

function NavEntry({ item, active }: { item: NavItem; active: boolean }) {
  const t = useTranslations();
  const label = t(`nav.${item.key}`);
  const base =
    "relative inline-flex h-10 items-center gap-1 whitespace-nowrap px-2.5 text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ivory/85 transition-colors hover:text-gold-light data-[state=open]:text-gold-light 2xl:px-4";
  const underline = (
    <span
      className={cn(
        "absolute inset-x-3.5 -bottom-0.5 h-px origin-center scale-x-0 bg-gold transition-transform duration-500 group-hover/nav:scale-x-100",
        active && "scale-x-100",
      )}
    />
  );

  if (!item.columns) {
    return (
      <NavigationMenu.Item className="group/nav">
        <NavigationMenu.Link asChild active={active}>
          <Link href={item.href} className={cn(base, active && "text-gold-light")}>
            {label}
            {underline}
          </Link>
        </NavigationMenu.Link>
      </NavigationMenu.Item>
    );
  }

  return (
    <NavigationMenu.Item className="group/nav">
      <NavigationMenu.Trigger className={cn(base, "group", active && "text-gold-light")}>
        {label}
        <ChevronDown className="size-3 transition-transform duration-300 group-data-[state=open]:rotate-180" strokeWidth={1.5} aria-hidden />
        {underline}
      </NavigationMenu.Trigger>
      <NavigationMenu.Content className="w-full data-[motion^=from-]:animate-[fade-in_.35s_ease] data-[motion^=to-]:animate-[fade-out_.2s_ease]">
        <MegaPanel item={item} />
      </NavigationMenu.Content>
    </NavigationMenu.Item>
  );
}

function MegaPanel({ item }: { item: NavItem }) {
  const t = useTranslations();
  return (
    <div className="mx-auto grid max-w-[1440px] grid-cols-12 gap-10 px-10 py-10">
      <div className="col-span-8 grid grid-cols-3 gap-10">
        {item.columns!.map((col) => (
          <div key={col.titleKey}>
            <div className="mb-5 flex items-center gap-2">
              <Ornament className="w-6" />
              <span className="eyebrow text-[0.62rem]">{t(`nav.${col.titleKey}`)}</span>
            </div>
            <ul className="space-y-1">
              {col.links.map((link) => (
                <li key={link.href + link.key}>
                  <NavigationMenu.Link asChild>
                    <Link
                      href={link.href}
                      className="group/l inline-flex items-center gap-2 py-1.5 font-display text-[1.32rem] leading-tight text-ivory/85 transition-colors hover:text-gold-light"
                    >
                      <span className="h-px w-0 bg-gold transition-all duration-500 group-hover/l:w-4" />
                      {t(`${link.ns ?? "nav"}.${link.key}`)}
                    </Link>
                  </NavigationMenu.Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {item.feature ? (
        <NavigationMenu.Link asChild>
          <Link href={item.feature.href} className="group/f relative col-span-4 block overflow-hidden rounded-sm">
            <div className="relative aspect-[16/10]">
              <Image
                src={item.feature.image}
                alt=""
                fill
                sizes="420px"
                className="object-cover transition-transform duration-[1.6s] ease-(--ease-luxe) group-hover/f:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-noir via-noir/30 to-transparent" />
            </div>
            <div className="absolute inset-x-0 bottom-0 p-6">
              <p className="font-display text-xl leading-snug text-ivory">{t(`megaMenu.${item.feature.textKey}`)}</p>
              <span className="mt-3 inline-block text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-gold">
                {item.feature.ctaKey === "quiz" ? t("nav.quiz") : t("common.explore")} →
              </span>
            </div>
          </Link>
        </NavigationMenu.Link>
      ) : null}
    </div>
  );
}

function IconButton({
  children,
  label,
  onClick,
  href,
  count,
  className,
}: {
  children: React.ReactNode;
  label: string;
  onClick?: () => void;
  href?: string;
  count?: number;
  className?: string;
}) {
  const inner = (
    <>
      <span className="[&_svg]:size-[1.2rem]">{children}</span>
      {count ? (
        <span className="absolute -end-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-gold-metal px-1 text-[0.58rem] font-bold leading-4 text-ink">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </>
  );
  const cls = cn(
    "relative grid size-10 place-items-center rounded-full text-ivory/90 transition-colors hover:bg-white/5 hover:text-gold-light",
    className,
  );
  return href ? (
    <Link href={href} className={cls} aria-label={label}>
      {inner}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={cls} aria-label={label}>
      {inner}
    </button>
  );
}
