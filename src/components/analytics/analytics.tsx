"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect, useRef } from "react";
import { useConsent } from "@/lib/consent";

/**
 * Google Analytics 4 and the Meta Pixel, loaded only after the visitor accepts
 * analytics cookies. Set NEXT_PUBLIC_GA_ID / NEXT_PUBLIC_META_PIXEL_ID to enable.
 * Ecommerce events are sent from lib/analytics.
 */
export function Analytics({ gaId, pixelId }: { gaId?: string; pixelId?: string }) {
  const consent = useConsent();
  const pathname = usePathname();
  const firstPath = useRef(pathname);

  // GA4 tracks client-side navigations itself (enhanced measurement); the Pixel needs a nudge
  useEffect(() => {
    if (pathname !== firstPath.current) window.fbq?.("track", "PageView");
  }, [pathname]);

  if (consent !== "all" || (!gaId && !pixelId)) return null;

  return (
    <>
      {gaId ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('js',new Date());gtag('config','${gaId}');`}
          </Script>
        </>
      ) : null}
      {pixelId ? (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');fbq('track','PageView');`}
        </Script>
      ) : null}
    </>
  );
}

