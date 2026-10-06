import { AdminTeam, SettingsGroup } from "@/components/admin/settings-forms";
import { PageHeader } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/server/admin/auth";
import { getSettings } from "@/server/queries/content";

export const metadata = { title: "Settings" };

const r = (paise: number) => String(paise / 100);

export default async function SettingsPage() {
  const me = await requireAdminPage("/admin/settings");
  const [{ commerce, contact, business, socials }, admins] = await Promise.all([
    getSettings(),
    db.user.findMany({ where: { role: "admin" }, orderBy: { createdAt: "asc" }, select: { id: true, name: true, email: true } }),
  ]);

  return (
    <>
      <PageHeader title="Settings" description="Prices for shipping and extras, contact details shown on the website, and invoice details." />
      <div className="grid max-w-4xl gap-6">
        <SettingsGroup
          group="commerce"
          title="Shipping & extras"
          description="All prices include GST."
          values={{
            freeShippingThreshold: r(commerce.freeShippingThreshold),
            standardShippingFee: r(commerce.standardShippingFee),
            expressShippingFee: r(commerce.expressShippingFee),
            codFee: r(commerce.codFee),
            codMaxOrder: r(commerce.codMaxOrder),
            giftWrapFee: r(commerce.giftWrapFee),
            freeSampleThreshold: r(commerce.freeSampleThreshold),
            gstRatePercent: String(commerce.gstRatePercent),
          }}
          fields={[
            { name: "freeShippingThreshold", label: "Free shipping from", prefix: "₹", hint: "Bag subtotal for free standard shipping" },
            { name: "standardShippingFee", label: "Standard shipping", prefix: "₹" },
            { name: "expressShippingFee", label: "Express shipping", prefix: "₹" },
            { name: "codFee", label: "Cash on delivery fee", prefix: "₹" },
            { name: "codMaxOrder", label: "Largest COD order", prefix: "₹", hint: "Above this, customers must pay online" },
            { name: "giftWrapFee", label: "Gift wrap", prefix: "₹" },
            { name: "freeSampleThreshold", label: "Free 2 ml sample from", prefix: "₹" },
            { name: "gstRatePercent", label: "GST rate (%)", hint: "Used to show the GST included in prices" },
          ]}
        />
        <SettingsGroup
          group="contact"
          title="Contact details"
          description="Shown in the footer, on the contact page and in order emails."
          values={contact}
          fields={[
            { name: "email", label: "Customer care email", type: "email" },
            { name: "phone", label: "Phone (as displayed)" },
            { name: "whatsapp", label: "WhatsApp number", hint: "Country code + number, digits only — e.g. 919876543210" },
            { name: "hours", label: "Opening hours" },
            { name: "address", label: "Address (as displayed)", long: true },
          ]}
        />
        <SettingsGroup
          group="business"
          title="Business & GST"
          description="Printed on tax invoices."
          values={business}
          fields={[
            { name: "legalName", label: "Legal business name" },
            { name: "gstin", label: "GSTIN", hint: "Leave empty if not GST-registered" },
            { name: "state", label: "State of registration", hint: "Decides CGST + SGST (same state) or IGST" },
            { name: "address", label: "Registered address", long: true },
          ]}
        />
        <SettingsGroup
          group="socials"
          title="Social links"
          values={socials}
          fields={[
            { name: "instagram", label: "Instagram", type: "url" },
            { name: "facebook", label: "Facebook", type: "url" },
            { name: "youtube", label: "YouTube", type: "url" },
            { name: "pinterest", label: "Pinterest", type: "url" },
          ]}
        />
        <AdminTeam admins={admins} me={me.id} />
      </div>
    </>
  );
}
