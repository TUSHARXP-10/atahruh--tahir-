import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { buttonClass } from "@/components/admin/ui";
import { getSessionUser } from "@/server/session";

export const metadata = { title: "No access" };

export default async function NoAccessPage() {
  const user = await getSessionUser();
  return (
    <div className="grid min-h-dvh place-items-center bg-noir px-6 text-center">
      <div className="max-w-md">
        <Logo variant="stacked" className="mx-auto h-32" />
        <h1 className="mt-6 font-display text-4xl text-ivory">This account can’t open the admin</h1>
        <p className="mt-3 text-sm text-smoke">
          {user ? `You are signed in as ${user.email}, which is a customer account.` : "Please sign in with an admin account."} Ask the store owner to give your account admin access, or sign in with the admin account.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/login?next=/admin" className={buttonClass("gold")}>
            Sign in as admin
          </Link>
          <Link href="/" className="inline-flex h-10 items-center rounded-lg border border-white/20 px-4 text-sm text-sand hover:border-gold hover:text-gold-light">
            Back to the store
          </Link>
        </div>
      </div>
    </div>
  );
}
