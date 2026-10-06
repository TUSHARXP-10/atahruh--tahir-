import { Mail, MapPin, Phone } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/logo";
import { KhatamStar, StarDivider } from "@/components/brand/ornament";
import { CalligraphyWatermark, GirihPattern } from "@/components/brand/patterns";
import { FacebookIcon, InstagramIcon, PinterestIcon, YoutubeIcon } from "@/components/brand/social-icons";
import { CookieSettingsLink } from "@/components/layout/cookie-consent";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/navigation";
import { getSettings } from "@/server/queries/content";

export async function Footer() {
  const [t, settings] = await Promise.all([getTranslations(), getSettings()]);
  const { contact, socials } = settings;

  const columns = [
    {
      title: t("footer.shop"),
      links: [
        { label: t("nav.perfumes"), href: "/collections/perfumes" },
        { label: t("nav.attars"), href: "/collections/attars" },
        { label: t("nav.therapies"), href: "/therapies" },
        { label: t("nav.giftSets"), href: "/collections/gift-sets" },
        { label: t("nav.discoverySet"), href: "/discovery-set" },
        { label: t("nav.newArrivals"), href: "/collections/new-arrivals" },
        { label: t("nav.offers"), href: "/collections/offers" },
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
        { label: t("nav.quiz"), href: "/fragrance-quiz" },
        { label: t("footer.journal"), href: "/journal" },
        { label: t("nav.concierge"), href: "/concierge" },
      ],
    },
  ];

  const social = [
    { href: socials.instagram, label: "Instagram", Icon: InstagramIcon },
    { href: socials.facebook, label: "Facebook", Icon: FacebookIcon },
    { href: socials.youtube, label: "YouTube", Icon: YoutubeIcon },
    { href: socials.pinterest, label: "Pinterest", Icon: PinterestIcon },
  ];

  return (
    <footer className="relative overflow-hidden border-t border-gold/15 bg-noir">
      <GirihPattern opacity={0.035} />
      <CalligraphyWatermark className="absolute -bottom-10 end-[-2rem] text-[11rem] sm:text-[16rem]" />

      <Container className="relative py-16 lg:py-20">
        <div className="grid gap-12 grid-cols-1 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Logo variant="stacked" className="h-36" />
            <p className="mt-6 font-display text-2xl italic text-gold-light/90">{t("footer.tagline")}</p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-smoke">{t("footer.about")}</p>
            <div className="mt-7 flex gap-2">
              {social.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="grid size-10 place-items-center rounded-full border border-gold/25 text-gold-light transition-colors hover:border-gold hover:bg-gold/10"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-5">
            {columns.map((col) => (
              <div key={col.title}>
                <h3 className="eyebrow mb-5 text-[0.62rem]">{col.title}</h3>
                <ul className="space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="-my-1 inline-block py-1 text-sm text-smoke transition-colors hover:text-gold-light">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="lg:col-span-3">
            <h3 className="eyebrow mb-5 text-[0.62rem]">{t("footer.contact")}</h3>
            <ul className="space-y-4 text-sm text-smoke">
              <li className="flex gap-3">
                <Mail className="mt-0.5 size-4 shrink-0 text-gold" strokeWidth={1.25} />
                <a href={`mailto:${contact.email}`} className="hover:text-gold-light">{contact.email}</a>
              </li>
              <li className="flex gap-3">
                <Phone className="mt-0.5 size-4 shrink-0 text-gold" strokeWidth={1.25} />
                <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="hover:text-gold-light" dir="ltr">{contact.phone}</a>
              </li>
              <li className="flex gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-gold" strokeWidth={1.25} />
                <span>{contact.address}</span>
              </li>
            </ul>
            <div className="mt-8">
              <p className="mb-3 text-[0.62rem] uppercase tracking-[0.2em] text-mist">{t("footer.payments")}</p>
              <div className="flex flex-wrap gap-2">
                {["Paytm", "UPI", "RuPay", "Visa", "Mastercard", "COD"].map((p) => (
                  <span key={p} className="rounded-sm border border-gold/20 px-2.5 py-1 text-[0.62rem] font-semibold tracking-wider text-smoke">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <StarDivider className="my-12" />

        <div className="flex flex-col items-center justify-between gap-4 text-xs text-mist md:flex-row">
          <p>{t("footer.rights", { year: new Date().getFullYear() })}</p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="/policies/privacy" className="-my-1.5 inline-block py-1.5 hover:text-gold-light">{t("footer.privacy")}</Link>
            <KhatamStar className="hidden size-2 text-gold/50 sm:block" />
            <Link href="/policies/terms" className="-my-1.5 inline-block py-1.5 hover:text-gold-light">{t("footer.terms")}</Link>
            <KhatamStar className="hidden size-2 text-gold/50 sm:block" />
            <a href="/sitemap.xml" className="-my-1.5 inline-block py-1.5 hover:text-gold-light">{t("footer.sitemap")}</a>
            <KhatamStar className="hidden size-2 text-gold/50 sm:block" />
            <CookieSettingsLink className="-my-1.5 inline-block py-1.5 hover:text-gold-light" />
          </div>
        </div>
      </Container>
    </footer>
  );
}
