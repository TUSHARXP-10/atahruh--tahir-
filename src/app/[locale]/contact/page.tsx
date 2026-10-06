import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { ContactForm } from "@/components/contact/contact-form";
import { PageHero } from "@/components/layout/page-hero";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { photo } from "@/lib/images";
import { getSettings } from "@/server/queries/content";

export async function generateMetadata({ params }: PageProps<"/[locale]/contact">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  return { title: t("metaTitle"), description: t("intro"), alternates: { canonical: locale === "en" ? "/contact" : `/${locale}/contact` } };
}

export default async function ContactPage({ params }: PageProps<"/[locale]/contact">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, tNav, { contact }] = await Promise.all([getTranslations("contact"), getTranslations("nav"), getSettings()]);

  return (
    <>
      <PageHero breadcrumb={[{ label: tNav("home"), href: "/" }, { label: t("metaTitle") }]} eyebrow={t("eyebrow")} title={t("title")} intro={t("intro")} image={photo("attarLantern")} />
      <Section tone="light">
        <Container className="grid gap-10 py-14 grid-cols-1 lg:grid-cols-[22rem_1fr] lg:py-20">
          <ul className="grid content-start gap-3">
            <Method icon={<MessageCircle />} title={t("whatsappTitle")} text={t("whatsappText")} href={`https://wa.me/${contact.whatsapp}`} value={contact.phone} external />
            <Method icon={<Mail />} title={t("emailTitle")} text={t("emailText")} href={`mailto:${contact.email}`} value={contact.email} />
            <Method icon={<Phone />} title={t("phoneTitle")} href={`tel:${contact.phone.replace(/\s/g, "")}`} value={contact.phone} />
            <Method icon={<MapPin />} title={t("atelierTitle")} value={contact.address} />
            <Method icon={<Clock />} title={t("hoursTitle")} value={contact.hours} />
          </ul>
          <ContactForm />
        </Container>
      </Section>
    </>
  );
}

function Method({ icon, title, text, value, href, external }: { icon: ReactNode; title: string; text?: string; value: string; href?: string; external?: boolean }) {
  const body = (
    <>
      <span className="grid size-11 shrink-0 place-items-center rounded-full border border-hairline text-accent [&_svg]:size-4">{icon}</span>
      <span className="min-w-0">
        <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-fg-muted">{title}</span>
        <span className="block truncate text-[0.95rem] text-heading" dir="ltr">
          {value}
        </span>
        {text ? <span className="block text-xs text-fg-muted">{text}</span> : null}
      </span>
    </>
  );
  return (
    <li>
      {href ? (
        <a href={href} {...(external ? { target: "_blank", rel: "noreferrer" } : {})} className="flex items-center gap-4 rounded-lg border border-hairline bg-surface p-4 transition-colors hover:border-accent">
          {body}
        </a>
      ) : (
        <div className="flex items-center gap-4 rounded-lg border border-hairline bg-surface p-4">{body}</div>
      )}
    </li>
  );
}
