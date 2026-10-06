"use client";

import { useLocale, useTranslations } from "next-intl";
import { createContext, use, useCallback, useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import type { CartView } from "@/server/cart";
import { track } from "@/lib/analytics";
import { useSession } from "@/lib/auth-client";
import { setWishlisted, syncWishlist } from "@/server/actions/account";
import * as cartActions from "@/server/actions/cart";

type AddInput = {
  variantId: string;
  quantity?: number;
  selections?: { productId: string; form: "PERFUME" | "ATTAR" | "OIL" | "SET" }[];
  /** Shown in the toast */
  label?: string;
  openDrawer?: boolean;
};

type StoreContext = {
  cart: CartView | null;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  pending: boolean;
  add: (input: AddInput) => Promise<boolean>;
  update: (itemId: string, quantity: number) => Promise<void>;
  remove: (itemId: string) => Promise<void>;
  applyCoupon: (code: string) => Promise<{ ok: boolean; error?: string }>;
  removeCoupon: () => Promise<void>;
  setGift: (giftWrap: boolean, giftMessage?: string) => Promise<void>;
  setSample: (productId: string | null) => Promise<void>;
  refreshCart: () => Promise<void>;
  replaceCart: (cart: CartView) => void;

  wishlist: string[];
  toggleWishlist: (productId: string, label?: string) => void;
  inWishlist: (productId: string) => boolean;

  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  conciergeOpen: boolean;
  setConciergeOpen: (open: boolean) => void;
};

const Ctx = createContext<StoreContext | null>(null);

const WISHLIST_KEY = "aar-wishlist";

export function StoreProvider({ children }: { children: ReactNode }) {
  const locale = useLocale();
  const t = useTranslations("cart");
  const [cart, setCart] = useState<CartView | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [conciergeOpen, setConciergeOpen] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  const refreshCart = useCallback(
    () =>
      cartActions
        .getCart(locale)
        .then(setCart)
        // Cart is non-critical for rendering; leave as-is
        .catch(() => {}),
    [locale],
  );

  useEffect(() => {
    void refreshCart();
  }, [refreshCart]);

  // Restore the saved wishlist after hydration (the server render has none)
  useEffect(() => {
    const restore = window.setTimeout(() => {
      try {
        const raw = localStorage.getItem(WISHLIST_KEY);
        if (raw) setWishlist(JSON.parse(raw));
      } catch {}
    }, 0);
    return () => window.clearTimeout(restore);
  }, []);

  // Signed in → merge the local wishlist into the account and use the server copy
  const { data: session } = useSession();
  const userId = session?.user?.id;
  useEffect(() => {
    if (!userId) return;
    let local: string[] = [];
    try {
      local = JSON.parse(localStorage.getItem(WISHLIST_KEY) ?? "[]");
    } catch {}
    syncWishlist(local)
      .then((ids) => {
        if (!ids) return;
        setWishlist(ids);
        try {
          localStorage.setItem(WISHLIST_KEY, JSON.stringify(ids));
        } catch {}
      })
      .catch(() => {});
    void refreshCart();
  }, [userId, refreshCart]);

  const persistWishlist = (next: string[]) => {
    setWishlist(next);
    try {
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(next));
    } catch {}
  };

  const run = useCallback(
    <T,>(fn: () => Promise<T>) =>
      new Promise<T>((resolve, reject) => {
        startTransition(async () => {
          try {
            resolve(await fn());
          } catch (e) {
            reject(e);
          }
        });
      }),
    [],
  );

  const add = useCallback(
    async ({ variantId, quantity = 1, selections, label, openDrawer = true }: AddInput) => {
      const res = await run(() => cartActions.addToCart({ variantId, quantity, selections, locale }));
      if (res.ok) {
        setCart(res.cart);
        const line = res.cart.lines.find((l) => l.variantId === variantId);
        if (line) {
          track("add_to_cart", {
            value: line.unitPrice * quantity,
            items: [{ id: line.productId, name: line.name, variant: `${line.formType} ${line.sizeLabel}`, price: line.unitPrice, quantity }],
          });
        }
        if (openDrawer) setCartOpen(true);
        else toast.success(t("addedToast", { name: label ?? "" }));
        return true;
      }
      toast.error(t(`errors.${res.error}`));
      return false;
    },
    [locale, run, t],
  );

  const update = useCallback(
    async (itemId: string, quantity: number) => {
      // optimistic
      setCart((c) =>
        c ? { ...c, lines: c.lines.map((l) => (l.id === itemId ? { ...l, quantity } : l)).filter((l) => l.quantity > 0) } : c,
      );
      const res = await run(() => cartActions.updateCartItem({ itemId, quantity, locale }));
      if (res.ok) setCart(res.cart);
      else void refreshCart();
    },
    [locale, run, refreshCart],
  );

  const remove = useCallback((itemId: string) => update(itemId, 0), [update]);

  const applyCoupon = useCallback(
    async (code: string) => {
      const res = await run(() => cartActions.applyCoupon({ code, locale }));
      if (res.cart) setCart(res.cart);
      return res.ok ? { ok: true } : { ok: false, error: res.error };
    },
    [locale, run],
  );

  const removeCoupon = useCallback(async () => {
    const res = await run(() => cartActions.removeCoupon(locale));
    if (res.ok) setCart(res.cart);
  }, [locale, run]);

  const setGift = useCallback(
    async (giftWrap: boolean, giftMessage?: string) => {
      setCart((c) => (c ? { ...c, giftWrap, giftMessage: giftMessage ?? c.giftMessage } : c));
      const res = await run(() => cartActions.setGiftOptions({ giftWrap, giftMessage, locale }));
      if (res.ok) setCart(res.cart);
    },
    [locale, run],
  );

  const setSample = useCallback(
    async (productId: string | null) => {
      const res = await run(() => cartActions.setFreeSample({ productId, locale }));
      if (res.ok) setCart(res.cart);
    },
    [locale, run],
  );

  const toggleWishlist = useCallback(
    (productId: string, label?: string) => {
      const has = wishlist.includes(productId);
      persistWishlist(has ? wishlist.filter((id) => id !== productId) : [productId, ...wishlist]);
      if (userId) void setWishlisted(productId, !has);
      toast(has ? t("wishlistRemoved", { name: label ?? "" }) : t("wishlistAdded", { name: label ?? "" }));
    },
    [wishlist, t, userId],
  );

  const value = useMemo<StoreContext>(
    () => ({
      cart,
      cartOpen,
      setCartOpen,
      pending,
      add,
      update,
      remove,
      applyCoupon,
      removeCoupon,
      setGift,
      setSample,
      refreshCart,
      replaceCart: setCart,
      wishlist,
      toggleWishlist,
      inWishlist: (id) => wishlist.includes(id),
      searchOpen,
      setSearchOpen,
      conciergeOpen,
      setConciergeOpen,
    }),
    [cart, cartOpen, pending, add, update, remove, applyCoupon, removeCoupon, setGift, setSample, refreshCart, wishlist, toggleWishlist, searchOpen, conciergeOpen],
  );

  return <Ctx value={value}>{children}</Ctx>;
}

export function useStore() {
  const ctx = use(Ctx);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
