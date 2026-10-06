import { ArrowUpRight, Mail, MessageCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { getPolicyTitles, getSettings } from "@/server/queries/content";

/** Side panel for help pages: contact shortcuts and the list of policies. */
export async function HelpAside({ locale, current }: { locale: string; current?: string }) {
  const [t, settings, policies] = await Promise.all([getTranslations("help"), getSettings(), getPolicyTitles(locale)]);
  const links = [{ href: "/faq", title: t("faq"), key: "faq" }, ...policies.map((p) => ({ href: `/policies/${p.slug}`, title: p.title, key: p.slug }))];
  return (
    <aside className="space-y-6 lg:sticky lg:top-28">
      <div className="rounded-lg border border-hairline bg-surface p-6">
        <p className="font-display text-2xl text-heading">{t("stillTitle")}</p>
        <p className="mt-2 text-sm text-fg-muted">{t("stillText")}</p>
        <div className="mt-5 grid gap-2">
          <a
            href={`https://wa.me/${settings.contact.whatsapp}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-md bg-[#1f6b3c] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#185731]"
          >
            <MessageCircle className="size-4" /> {t("whatsapp")}
          </a>
          <a href={`mailto:${settings.contact.email}`} className="flex items-center gap-3 rounded-md border border-hairline px-4 py-3 text-sm text-heading transition-colors hover:border-accent">
            <Mail className="size-4 text-accent" /> {settings.contact.email}
          </a>
          <Link href="/contact" className="flex items-center justify-between rounded-md px-4 py-2 text-sm text-fg-muted hover:text-heading">
            {t("contactPage")} <ArrowUpRight className="size-4 rtl:-scale-x-100" />
          </Link>
        </div>
      </div>
      <nav aria-label={t("policies")} className="rounded-lg border border-hairline bg-surface p-3">
        <ul>
          {links.map((l) => (
            <li key={l.key}>
              <Link
                href={l.href}
                aria-current={current === l.key ? "page" : undefined}
                className={cn("block rounded-md px-3 py-2 text-sm transition-colors", current === l.key ? "bg-cream-deep font-semibold text-heading" : "text-fg-muted hover:text-heading")}
              >
                {l.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
