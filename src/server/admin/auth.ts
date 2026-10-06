import "server-only";
import { redirect } from "next/navigation";
import { getSessionUser } from "../session";

export type AdminUser = { id: string; name: string; email: string };

function asAdmin(user: Awaited<ReturnType<typeof getSessionUser>>): AdminUser | null {
  if (!user || (user as { role?: string }).role !== "admin") return null;
  return { id: user.id, name: user.name, email: user.email };
}

/** The signed-in admin, or null (for chrome that adapts rather than blocks). */
export async function getAdmin() {
  return asAdmin(await getSessionUser());
}

/**
 * Every admin page calls this — a layout check alone does not protect pages,
 * which render in parallel with their layout.
 */
export async function requireAdminPage(path = "/admin"): Promise<AdminUser> {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(path)}`);
  const admin = asAdmin(user);
  if (!admin) redirect("/admin/no-access");
  return admin;
}

/** Every admin Server Action calls this first: actions are public endpoints. */
export async function requireAdminAction(): Promise<AdminUser> {
  const admin = asAdmin(await getSessionUser());
  if (!admin) throw new Error("Not authorised");
  return admin;
}
