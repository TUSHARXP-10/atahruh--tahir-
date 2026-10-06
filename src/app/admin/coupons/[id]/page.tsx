import { notFound } from "next/navigation";
import { CouponForm, type CouponDraft } from "@/components/admin/coupon-form";
import { PageHeader } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/server/admin/auth";

export const metadata = { title: "Coupon" };

/** Date → yyyy-mm-dd in IST for <input type="date"> */
const day = (d: Date | null) => (d ? new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(d) : "");
const rupees = (paise: number | null) => (paise ? String(paise / 100) : "");

export default async function CouponPage({ params }: PageProps<"/admin/coupons/[id]">) {
  const { id } = await params;
  await requireAdminPage(`/admin/coupons/${id}`);
  let draft: CouponDraft = {
    code: "",
    type: "PERCENT",
    value: "10",
    minSubtotal: "",
    maxDiscount: "",
    startsAt: "",
    endsAt: "",
    usageLimit: "",
    perUserLimit: "",
    firstOrderOnly: false,
    active: true,
    description: "",
    usedCount: 0,
  };
  if (id !== "new") {
    const c = await db.coupon.findUnique({ where: { id } });
    if (!c) notFound();
    draft = {
      id: c.id,
      code: c.code,
      type: c.type,
      value: c.type === "PERCENT" ? String(c.value) : rupees(c.value),
      minSubtotal: rupees(c.minSubtotal),
      maxDiscount: rupees(c.maxDiscount),
      startsAt: day(c.startsAt),
      endsAt: day(c.endsAt),
      usageLimit: c.usageLimit?.toString() ?? "",
      perUserLimit: c.perUserLimit?.toString() ?? "",
      firstOrderOnly: c.firstOrderOnly,
      active: c.active,
      description: c.description ?? "",
      usedCount: c.usedCount,
    };
  }
  return (
    <>
      <PageHeader back={{ href: "/admin/coupons", label: "Coupons" }} title={draft.id ? `Coupon ${draft.code}` : "New coupon"} />
      <CouponForm initial={draft} />
    </>
  );
}
