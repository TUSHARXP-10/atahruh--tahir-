"use client";

import { useSyncExternalStore } from "react";

/**
 * Cookie consent. "essential" = only the cookies the shop needs (bag, sign-in,
 * language). "all" = also analytics / marketing tags. Stored in a first-party
 * cookie for 6 months; no choice yet = null, and nothing optional loads.
 */
export type Consent = "all" | "essential";

const COOKIE = "aar_consent";
const CHANGE = "aar:consent";
const OPEN = "aar:consent-open";
const MAX_AGE = 60 * 60 * 24 * 180;

export function readConsent(): Consent | null {
  const match = document.cookie.match(/(?:^|;\s*)aar_consent=(all|essential)/);
  return (match?.[1] as Consent | undefined) ?? null;
}

export function writeConsent(value: Consent) {
  const previous = readConsent();
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE}=${value}; Max-Age=${MAX_AGE}; Path=/; SameSite=Lax${secure}`;
  if (previous === "all" && value === "essential") {
    // Withdrawn: clear the analytics cookies and reload so the tags are gone
    for (const name of document.cookie.split(/;\s*/).map((c) => c.split("=")[0])) {
      if (/^(_ga|_gid|_gat|_fbp|_fbc)/.test(name)) {
        for (const domain of ["", `; Domain=${location.hostname}`, `; Domain=.${location.hostname.replace(/^www\./, "")}`]) {
          document.cookie = `${name}=; Max-Age=0; Path=/${domain}`;
        }
      }
    }
    location.reload();
    return;
  }
  window.dispatchEvent(new Event(CHANGE));
}

/** Re-open the banner (footer "Cookie settings" link). */
export function openConsentSettings() {
  window.dispatchEvent(new Event(OPEN));
}

export function onConsentOpen(listener: () => void) {
  window.addEventListener(OPEN, listener);
  return () => window.removeEventListener(OPEN, listener);
}

function subscribe(listener: () => void) {
  window.addEventListener(CHANGE, listener);
  return () => window.removeEventListener(CHANGE, listener);
}

/** The visitor's choice; `undefined` while server-rendering. */
export function useConsent(): Consent | null | undefined {
  return useSyncExternalStore(subscribe, readConsent, () => undefined);
}
