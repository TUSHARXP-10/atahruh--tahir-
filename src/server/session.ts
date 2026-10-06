import "server-only";
import { headers } from "next/headers";
import { unstable_rethrow } from "next/navigation";
import { cache } from "react";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";

/** The current session (memoised per request). */
export const getSession = cache(async () => {
  try {
    return await auth.api.getSession({ headers: await headers() });
  } catch (err) {
    // Let Next's own signals through (e.g. "this page needs a request"), so pages that read
    // the session are rendered per request instead of being pre-built without one
    unstable_rethrow(err);
    return null;
  }
});

export async function getSessionUser() {
  const session = await getSession();
  return session?.user ?? null;
}

export async function isAdmin() {
  const user = await getSessionUser();
  return (user as { role?: string } | null)?.role === "admin";
}

/**
 * For signed-in pages: the current customer, or a redirect to sign in.
 * Each page calls this itself — a layout check alone doesn't protect pages.
 */
export async function requireCustomer(locale: string, next: string) {
  const user = await getSessionUser();
  if (!user) redirect({ href: { pathname: "/login", query: { next } }, locale });
  return user!;
}
