"use client";

import {
  BookOpen,
  Boxes,
  ExternalLink,
  FileText,
  Images,
  Inbox,
  LayoutDashboard,
  LayoutTemplate,
  Layers,
  LogOut,
  Menu,
  Package,
  Quote,
  Rocket,
  Settings,
  ShoppingBag,
  Star,
  TicketPercent,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/brand/logo";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

type Counts = { toPack: number; pendingReviews: number; lowStock: number; messages: number };
type NavItem = { href: string; label: string; Icon: typeof LayoutDashboard; exact?: boolean; count?: keyof Counts };

const GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Store",
    items: [
      { href: "/admin", label: "Dashboard", Icon: LayoutDashboard, exact: true },
      { href: "/admin/orders", label: "Orders", Icon: ShoppingBag, count: "toPack" },
      { href: "/admin/products", label: "Products", Icon: Package },
      { href: "/admin/inventory", label: "Inventory", Icon: Boxes, count: "lowStock" },
      { href: "/admin/collections", label: "Collections", Icon: Layers },
      { href: "/admin/coupons", label: "Coupons", Icon: TicketPercent },
      { href: "/admin/customers", label: "Customers", Icon: Users },
      { href: "/admin/messages", label: "Messages", Icon: Inbox, count: "messages" },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/reviews", label: "Reviews", Icon: Star, count: "pendingReviews" },
      { href: "/admin/homepage", label: "Homepage", Icon: LayoutTemplate },
      { href: "/admin/pages", label: "FAQ & policies", Icon: FileText },
      { href: "/admin/journal", label: "Journal", Icon: BookOpen },
      { href: "/admin/testimonials", label: "Testimonials", Icon: Quote },
      { href: "/admin/media", label: "Media library", Icon: Images },
    ],
  },
  {
    label: "Setup",
    items: [
      { href: "/admin/settings", label: "Settings", Icon: Settings },
      { href: "/admin/launch", label: "Launch checklist", Icon: Rocket },
    ],
  },
];

export function AdminNav({ counts, user }: { counts: Counts; user: { name: string; email: string } }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const active = (href: string, exact?: boolean) => (exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));

  const nav = (
    <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-5" aria-label="Admin">
      {GROUPS.map((g) => (
        <div key={g.label}>
          <p className="mb-2 px-3 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-gold/60">{g.label}</p>
          <ul className="space-y-0.5">
            {g.items.map(({ href, label, Icon, exact, count }) => {
              const n = count ? counts[count] : 0;
              const on = active(href, exact);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setOpen(false)}
                    aria-current={on ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      on ? "bg-gold/15 text-gold-pale" : "text-sand/75 hover:bg-white/5 hover:text-ivory",
                    )}
                  >
                    <Icon className="size-4 shrink-0" strokeWidth={1.6} />
                    <span className="flex-1">{label}</span>
                    {n ? <span className="rounded-full bg-gold px-1.5 py-px text-[0.65rem] font-bold text-ink">{n}</span> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  const footer = (
    <div className="border-t border-white/10 p-4">
      <p className="truncate text-sm text-ivory">{user.name}</p>
      <p className="truncate text-xs text-smoke">{user.email}</p>
      <div className="mt-3 flex gap-2">
        <a href="/" target="_blank" rel="noreferrer" className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/15 px-2 py-1.5 text-xs text-sand hover:border-gold hover:text-gold-light">
          <ExternalLink className="size-3.5" /> View store
        </a>
        <button
          type="button"
          onClick={async () => {
            await authClient.signOut();
            // Different root layout, so this is a full page load
            router.push("/login");
          }}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/15 px-2 py-1.5 text-xs text-sand hover:border-gold hover:text-gold-light"
        >
          <LogOut className="size-3.5" /> Sign out
        </button>
      </div>
    </div>
  );

  const brand = (
    <Link href="/admin" className="flex items-center gap-3 px-5 py-5">
      <Logo className="[&_img:first-child]:h-9 [&_img:last-child]:h-[0.95rem]" />
      <span className="rounded bg-gold/15 px-1.5 py-0.5 text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-gold-light">Admin</span>
    </Link>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col bg-noir lg:flex print:hidden">
        {brand}
        {nav}
        {footer}
      </aside>

      {/* Mobile top bar + drawer */}
      <div className="sticky top-0 z-40 flex items-center justify-between bg-noir px-2 lg:hidden print:hidden">
        {brand}
        <button type="button" onClick={() => setOpen(true)} className="grid size-11 place-items-center text-gold-light" aria-label="Open menu">
          <Menu className="size-5" />
        </button>
      </div>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
          <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close menu" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 start-0 flex w-72 flex-col bg-noir">
            <div className="flex items-center justify-between pe-2">
              {brand}
              <button type="button" onClick={() => setOpen(false)} className="grid size-11 place-items-center text-gold-light" aria-label="Close menu">
                <X className="size-5" />
              </button>
            </div>
            {nav}
            {footer}
          </div>
        </div>
      ) : null}
    </>
  );
}
