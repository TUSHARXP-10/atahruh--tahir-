"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

type Props = { event: Parameters<typeof track>[0]; data: Parameters<typeof track>[1]; /** Send at most once per browser under this key */ onceKey?: string };

/** Sends one analytics event when a server-rendered page mounts. */
export function TrackEvent({ event, data, onceKey }: Props) {
  useEffect(() => {
    if (onceKey) {
      try {
        if (localStorage.getItem(onceKey)) return;
        localStorage.setItem(onceKey, "1");
      } catch {}
    }
    track(event, data);
    // Fire on mount only; the data is fixed for the page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
