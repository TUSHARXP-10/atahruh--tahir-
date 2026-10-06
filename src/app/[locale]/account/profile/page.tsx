import { setRequestLocale } from "next-intl/server";
import { ProfileForm } from "@/components/account/profile-form";
import { requireCustomer } from "@/server/session";

export default async function ProfilePage({ params }: PageProps<"/[locale]/account/profile">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireCustomer(locale, "/account/profile");
  return <ProfileForm name={user.name} email={user.email} phone={(user as { phone?: string | null }).phone ?? ""} />;
}
