import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { AccountNav } from "@/components/account/account-nav";
import { Ornament } from "@/components/brand/ornament";
import { Container } from "@/components/ui/container";
import { redirect } from "@/i18n/navigation";
import { getSessionUser } from "@/server/session";

export default async function AccountLayout({ children, params }: LayoutProps<"/[locale]/account">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await getSessionUser();
  if (!user) redirect({ href: { pathname: "/login", query: { next: "/account" } }, locale });
  const [t, format] = await Promise.all([getTranslations("account"), getFormatter()]);

  return (
    <Container className="py-12 lg:py-16">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b border-gold/10 pb-8">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <Ornament className="w-8" />
            <span className="eyebrow">{t("title")}</span>
          </div>
          <h1 className="font-display text-5xl text-ivory">{t("hello", { name: user!.name.split(" ")[0] })}</h1>
        </div>
        <p className="text-xs text-mist">{t("memberSince", { date: format.dateTime(new Date(user!.createdAt), { month: "long", year: "numeric" }) })}</p>
      </div>
      <div className="grid gap-10 grid-cols-1 lg:grid-cols-[14rem_1fr]">
        <AccountNav isAdmin={(user as { role?: string }).role === "admin"} />
        <div className="min-w-0">{children}</div>
      </div>
    </Container>
  );
}
