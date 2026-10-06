import { notFound } from "next/navigation";

/** Any unknown /admin/… address shows the admin 404 (inside the admin shell). */
export default function UnknownAdminPage() {
  notFound();
}
