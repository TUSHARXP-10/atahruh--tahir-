import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { AdminNav } from "@/components/admin/nav";
import { db } from "@/lib/db";
import { fontVariables } from "@/lib/fonts";
import { getAdmin } from "@/server/admin/auth";
import { LOW_STOCK } from "@/server/admin/constants";
import "../globals.css";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin · Aayat al-Ruh" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#0b0907", colorScheme: "light" };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  // Chrome only — every page enforces access itself (requireAdminPage)
  const admin = await getAdmin();
  const counts = admin
    ? await Promise.all([
        db.order.count({ where: { status: "CONFIRMED" } }),
        db.review.count({ where: { status: "PENDING" } }),
        db.variant.count({ where: { stock: { lte: LOW_STOCK }, form: { product: { status: "ACTIVE" } } } }),
        db.contactMessage.count({ where: { handled: false } }),
      ]).then(([toPack, pendingReviews, lowStock, messages]) => ({ toPack, pendingReviews, lowStock, messages }))
    : null;

  return (
    <html lang="en" dir="ltr" className={fontVariables} style={{ colorScheme: "light" }}>
      <body className="min-h-dvh bg-[#f6f1e7] text-ink print:bg-white" data-tone="light">
        {admin && counts ? (
          <div className="lg:flex">
            <AdminNav counts={counts} user={admin} />
            <main className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:px-10 print:p-0">{children}</main>
          </div>
        ) : (
          <main>{children}</main>
        )}
        {/* Bottom-centre: clear of the top-right Save buttons and the bottom-right inventory bar */}
        <Toaster position="bottom-center" richColors closeButton />
      </body>
    </html>
  );
}
