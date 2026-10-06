"use client";

import { Heart, LayoutDashboard, LogOut, MapPin, Package, Shield, Sparkles, User } from "lucide-react";
import NextLink from "next/link";
import { useTranslations } from "next-intl";
import { useStore } from "@/components/providers/store-provider";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export function AccountNav({ isAdmin }: { isAdmin: boolean }) {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const { refreshCart } = useStore();
  const items = [
    { href: "/account", label: t("account.overview"), Icon: LayoutDashboard },
    { href: "/account/orders", label: t("account.orders"), Icon: Package },
    { href: "/account/addresses", label: t("account.addresses"), Icon: MapPin },
    { href: "/wishlist", label: t("account.wishlist"), Icon: Heart },
    { href: "/account/scent-profile", label: t("account.scentProfile"), Icon: Sparkles },
    { href: "/account/profile", label: t("account.profile"), Icon: User },
  ];

  return (
    <nav className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0" aria-label={t("account.title")}>
      {items.map(({ href, label, Icon }) => {
        const active = href === "/account" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-3 rounded-sm px-4 py-3 text-sm transition-colors",
              active ? "bg-gold/10 text-gold-light" : "text-smoke hover:bg-white/[0.03] hover:text-ivory",
            )}
          >
            <Icon className="size-4" strokeWidth={1.25} />
            {label}
          </Link>
        );
      })}
      {isAdmin ? (
        // Admin is a separate, unlocalised app
        <NextLink href="/admin" className="flex shrink-0 items-center gap-3 rounded-sm px-4 py-3 text-sm text-gold hover:bg-gold/5">
          <Shield className="size-4" strokeWidth={1.25} /> Admin
        </NextLink>
      ) : null}
      <button
        type="button"
        onClick={async () => {
          await authClient.signOut();
          await refreshCart();
          router.push("/");
          router.refresh();
        }}
        className="flex shrink-0 items-center gap-3 rounded-sm px-4 py-3 text-start text-sm text-mist hover:text-ivory lg:mt-6 lg:border-t lg:border-gold/10 lg:pt-6"
      >
        <LogOut className="size-4" strokeWidth={1.25} />
        {t("auth.signOut")}
      </button>
    </nav>
  );
}
