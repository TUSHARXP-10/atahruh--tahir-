import { CheckCircle2, Circle, CircleAlert } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { LaunchActions } from "@/components/admin/launch-actions";
import { Card, PageHeader } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { brandLogo, site } from "@/lib/site";
import { requireAdminPage } from "@/server/admin/auth";
import { getContent, getSettings } from "@/server/queries/content";

export const metadata = { title: "Launch checklist" };

type Status = "done" | "todo" | "optional";
type Item = { status: Status; title: string; detail: ReactNode };

export default async function LaunchPage() {
  await requireAdminPage("/admin/launch");
  const [settings, demoReviews, demoTestimonials, testOrders, stockPhotoProducts, totalProducts, stats, adminEmails] = await Promise.all([
    getSettings(),
    db.review.count({ where: { isPlaceholder: true } }),
    db.testimonial.count({ where: { isPlaceholder: true } }),
    db.order.count({ where: { email: { endsWith: "@example.com" } } }),
    db.product.count({ where: { status: "ACTIVE", forms: { some: { images: { some: { url: { startsWith: "/images/library/" } } } } } } }),
    db.product.count({ where: { status: "ACTIVE" } }),
    getContent<{ isPlaceholder?: boolean }>("stats", "en"),
    db.user.findMany({ where: { role: "admin" }, select: { email: true } }),
  ]);
  const prodSite = /^https:\/\//.test(site.url) && !site.url.includes("localhost");
  const paytm = !!(process.env.PAYTM_MID && process.env.PAYTM_MERCHANT_KEY);
  const paytmLive = paytm && process.env.PAYTM_ENV === "production";

  const groups: { title: string; items: Item[] }[] = [
    {
      title: "Payments & email",
      items: [
        {
          status: paytmLive ? "done" : "todo",
          title: "Paytm online payments",
          detail: paytmLive ? "Live Paytm keys are set." : paytm ? "Test keys are set — switch to the Production MID/key and PAYTM_ENV=production." : "Add PAYTM_MID and PAYTM_MERCHANT_KEY (Paytm Dashboard → Developer Settings → API Keys). Until then only cash on delivery is offered.",
        },
        {
          status: paytmLive ? "todo" : "optional",
          title: "Paytm payment webhook",
          detail: (
            <>
              In the Paytm dashboard set the Payment Notification URL to <code className="rounded bg-[#f3ecdf] px-1">{site.url}/api/paytm/webhook</code>. It confirms slow UPI payments.
            </>
          ),
        },
        {
          status: process.env.RESEND_API_KEY ? "done" : "todo",
          title: "Order emails",
          detail: process.env.RESEND_API_KEY ? `Emails are sent from ${process.env.EMAIL_FROM ?? "the default address"}.` : "Add RESEND_API_KEY and verify your domain at resend.com so customers receive order and sign-in emails.",
        },
      ],
    },
    {
      title: "Website",
      items: [
        { status: prodSite ? "done" : "todo", title: "Domain", detail: prodSite ? `Live at ${site.url}` : `NEXT_PUBLIC_SITE_URL is ${site.url} — set it to your https:// domain.` },
        { status: brandLogo.src ? "done" : "todo", title: "Logo", detail: brandLogo.src ? "The client logo is in place." : "The temporary wordmark is showing — send the logo file to your developer." },
        {
          status: settings.contact.whatsapp === site.contact.whatsapp || settings.contact.phone === site.contact.phone ? "todo" : "done",
          title: "Phone & WhatsApp",
          detail: <Link href="/admin/settings" className="underline">Replace the placeholder numbers in Settings</Link>,
        },
        {
          status: Object.values(settings.socials).some((u) => /^https:\/\/(www\.)?(instagram|facebook|youtube|pinterest)\.com\/?$/.test(u)) ? "todo" : "done",
          title: "Social links",
          detail: <Link href="/admin/settings" className="underline">Point every social icon at your real profiles</Link>,
        },
        {
          status: settings.business.gstin ? "done" : "todo",
          title: "GST details on invoices",
          detail: <Link href="/admin/settings" className="underline">Add GSTIN and registered address</Link>,
        },
        {
          status: stockPhotoProducts === 0 ? "done" : "todo",
          title: "Real product photos",
          detail: `${stockPhotoProducts} of ${totalProducts} live products still use stock photos. Upload your own photos in each product.`,
        },
      ],
    },
    {
      title: "Content",
      items: [
        { status: demoReviews ? "todo" : "done", title: "Demo reviews", detail: demoReviews ? `${demoReviews} demo reviews exist (hidden on the live site). Remove them below.` : "No demo reviews." },
        { status: demoTestimonials ? "todo" : "done", title: "Demo testimonials", detail: demoTestimonials ? `${demoTestimonials} demo quotes exist (hidden on the live site). Add real ones and remove these.` : "No demo testimonials." },
        {
          status: stats && stats.isPlaceholder === false ? "done" : "todo",
          title: "Our Story numbers",
          detail: <Link href="/admin/homepage?section=stats" className="underline">Enter the real figures and mark them as real (hidden until then)</Link>,
        },
        { status: testOrders ? "todo" : "done", title: "Test orders", detail: testOrders ? `${testOrders} test orders (@example.com) are in the system. Delete them below.` : "No test orders." },
      ],
    },
    {
      title: "Security",
      items: [
        {
          status: adminEmails.some((a) => a.email === "admin@aayatalruh.com") ? "todo" : "done",
          title: "Admin login",
          detail: "Create your own admin account (Settings → Admin team), then remove the default admin@aayatalruh.com login — or at least change its password.",
        },
        { status: process.env.GOOGLE_CLIENT_ID ? "done" : "optional", title: "Sign in with Google", detail: "Optional — add Google OAuth keys to let customers sign in with one tap." },
        { status: process.env.ANTHROPIC_API_KEY ? "done" : "optional", title: "AI Scent Concierge", detail: "Optional — add an Anthropic API key to switch on the AI fragrance assistant." },
      ],
    },
  ];
  const all = groups.flatMap((g) => g.items).filter((i) => i.status !== "optional");
  const ready = all.filter((i) => i.status === "done").length;

  return (
    <>
      <PageHeader title="Launch checklist" description={`${ready} of ${all.length} launch tasks done. Optional extras are marked with a hollow circle.`} />
      <div className="mb-6 h-2 max-w-4xl overflow-hidden rounded-full bg-[#e9dfcc]">
        <div className="h-full rounded-full bg-gold-deep" style={{ width: `${(ready / all.length) * 100}%` }} />
      </div>
      <div className="grid max-w-4xl grid-cols-1 gap-6">
        {groups.map((g) => (
          <Card key={g.title} title={g.title} padded={false}>
            <ul>
              {g.items.map((i) => (
                <li key={i.title} className="flex gap-3 border-b border-[#f0e8d9] px-5 py-3.5 last:border-0">
                  {i.status === "done" ? (
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#1f6b3c]" />
                  ) : i.status === "todo" ? (
                    <CircleAlert className="mt-0.5 size-5 shrink-0 text-[#b07d18]" />
                  ) : (
                    <Circle className="mt-0.5 size-5 shrink-0 text-[#cbbd9f]" />
                  )}
                  <div className="min-w-0 break-words">
                    <p className="text-sm font-semibold text-ink">{i.title}</p>
                    <p className="text-sm text-ink-muted">{i.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        ))}
        <LaunchActions demo={demoReviews + demoTestimonials} testOrders={testOrders} />
      </div>
    </>
  );
}
