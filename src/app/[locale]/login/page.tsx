import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { AuthShell } from "@/components/account/auth-shell";
import { LoginForm } from "@/components/account/auth-forms";
import { authFeatures } from "@/lib/auth";
import { getSessionUser } from "@/server/session";

export async function generateMetadata({ params }: PageProps<"/[locale]/login">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("signIn"), robots: { index: false } };
}

export default async function Page({ params, searchParams }: PageProps<"/[locale]/login">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  if (await getSessionUser()) redirect({ href: "/account", locale });
  return (
    <AuthShell locale={locale}>
      <LoginForm googleEnabled={authFeatures.google} next={typeof sp.next === "string" ? sp.next : undefined} />
    </AuthShell>
  );
}
