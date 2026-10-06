import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { AuthShell } from "@/components/account/auth-shell";
import { ResetForm } from "@/components/account/auth-forms";
import { getSessionUser } from "@/server/session";

export async function generateMetadata({ params }: PageProps<"/[locale]/forgot-password">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("resetTitle"), robots: { index: false } };
}

export default async function Page({ params }: PageProps<"/[locale]/forgot-password">) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (await getSessionUser()) redirect({ href: "/account", locale });
  return (
    <AuthShell locale={locale}>
      <ResetForm />
    </AuthShell>
  );
}
