"use client";

import { Apple, Bell, Download, Gift, Play, Sparkles, Star } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useMediaQuery } from "@/lib/use-media-query";
import { Monogram } from "@/components/brand/logo";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/navigation";
import { photo } from "@/lib/images";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/** Sand-coloured app band: store badges, footer link columns and a phone mock-up. */
export function AppBand() {
  const t = useTranslations();
  const [deferred, setDeferred] = useState<InstallEvent | null>(null);
  const standalone = useMediaQuery("(display-mode: standalone)");
  const [accepted, setAccepted] = useState(false);
  const installed = standalone || accepted;
  const [hint, setHint] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const install = async () => {
    if (!deferred) return setHint(true);
    await deferred.prompt();
    if ((await deferred.userChoice).outcome === "accepted") setAccepted(true);
    setDeferred(null);
  };

  const columns = [
    {
      title: t("footer.shop"),
      links: [
        { label: t("nav.perfumes"), href: "/collections/perfumes" },
        { label: t("nav.attars"), href: "/collections/attars" },
        { label: t("nav.therapies"), href: "/therapies" },
        { label: t("nav.giftSets"), href: "/collections/gift-sets" },
        { label: t("nav.newArrivals"), href: "/collections/new-arrivals" },
      ],
    },
    {
      title: t("footer.help"),
      links: [
        { label: t("footer.trackOrder"), href: "/track-order" },
        { label: t("footer.shipping"), href: "/policies/shipping" },
        { label: t("footer.returns"), href: "/policies/returns" },
        { label: t("footer.faqs"), href: "/faq" },
        { label: t("footer.contactUs"), href: "/contact" },
      ],
    },
    {
      title: t("footer.company"),
      links: [
        { label: t("footer.ourStory"), href: "/our-story" },
        { label: t("nav.rituals"), href: "/rituals" },
        { label: t("footer.journal"), href: "/journal" },
        { label: t("nav.quiz"), href: "/fragrance-quiz" },
      ],
    },
  ];

  return (
    <section data-tone="light" className="relative overflow-hidden bg-[#e9dfcf] text-ink">
      <Container className="grid items-center gap-10 py-14 grid-cols-1 lg:grid-cols-12 lg:py-16">
        <div className="lg:col-span-4">
          <h2 className="font-display text-[clamp(2rem,3.2vw,2.75rem)] leading-none text-ink">{t("home.app.title")}</h2>
          <p className="mt-3 max-w-sm text-sm text-ink-muted">{t("home.app.text")}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {[
              { Icon: Apple, small: "Download on the", big: "App Store" },
              { Icon: Play, small: "Get it on", big: "Google Play" },
            ].map(({ Icon, small, big }) => (
              <span key={big} className="relative inline-flex h-12 items-center gap-2.5 rounded-lg bg-ink px-4 text-white" lang="en" dir="ltr">
                <Icon className="size-5 fill-white" strokeWidth={1} />
                <span className="leading-none">
                  <span className="block text-[0.55rem] opacity-80">{small}</span>
                  <span className="block text-[0.95rem] font-semibold">{big}</span>
                </span>
                <span className="absolute -end-2 -top-2 rounded-full bg-gold px-1.5 py-0.5 text-[0.5rem] font-bold uppercase tracking-wider text-ink">
                  {t("common.comingSoon")}
                </span>
              </span>
            ))}
          </div>
          <button type="button" onClick={install} disabled={installed} className="mt-4 inline-flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-ink underline-offset-4 hover:underline disabled:opacity-60">
            <Download className="size-4" /> {installed ? t("home.app.installed") : t("home.app.install")}
          </button>
          {hint ? <p className="mt-2 text-xs text-ink-muted">{t("home.app.iosHint")}</p> : null}
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[0.72rem] text-ink-muted">
            {[
              { Icon: Gift, label: t("home.app.perk1") },
              { Icon: Bell, label: t("home.app.perk2") },
              { Icon: Sparkles, label: t("home.app.perk3") },
            ].map(({ Icon, label }) => (
              <li key={label} className="flex items-center gap-1.5">
                <Icon className="size-3.5 text-gold-deep" strokeWidth={1.5} /> {label}
              </li>
            ))}
          </ul>
        </div>

        <nav className="grid grid-cols-3 gap-6 lg:col-span-5" aria-label={t("footer.shop")}>
          {columns.map((col) => (
            <div key={col.title}>
              <p className="mb-3 text-[0.72rem] font-bold uppercase tracking-[0.14em] text-ink">{col.title}</p>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-[0.8rem] text-ink-muted transition-colors hover:text-gold-deep">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Phone mock-up with real product photography */}
        <div className="relative mx-auto lg:col-span-3">
          <div className="relative h-[26rem] w-52 rotate-[-5deg] rounded-[2.4rem] border-[9px] border-ink bg-noir shadow-[0_40px_70px_-28px_rgba(28,21,16,0.75)]">
            <div className="absolute start-1/2 top-1.5 z-10 h-4 w-16 -translate-x-1/2 rounded-full bg-ink rtl:translate-x-1/2" />
            <div className="flex h-full flex-col overflow-hidden rounded-[1.9rem] text-ivory">
              <div className="relative h-40 shrink-0">
                <Image src={photo("crystalDecanters")} alt="" fill sizes="13rem" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-noir via-noir/30 to-noir/40" />
                <div className="absolute inset-x-3 top-5 flex items-center justify-between">
                  <Monogram className="h-5 w-auto" />
                  <Star className="size-3 text-gold" />
                </div>
                <p className="absolute inset-x-3 bottom-3 font-display text-base leading-tight" lang="en">
                  A Fragrance <span className="text-gold-light">Beyond Time</span>
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 p-2.5">
                {(["amberSilk", "attarLantern", "goldenSpray", "dropperStones"] as const).map((k) => (
                  <div key={k} className="overflow-hidden rounded-md bg-ebony">
                    <div className="relative aspect-square">
                      <Image src={photo(k)} alt="" fill sizes="6rem" className="object-cover" />
                    </div>
                    <div className="space-y-1 p-1.5">
                      <div className="h-1.5 w-3/4 rounded bg-white/15" />
                      <div className="h-1.5 w-1/2 rounded bg-gold/50" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
