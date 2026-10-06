import { site } from "@/lib/site";

/** Renders a JSON-LD script. `<` is escaped so content can never break out of the tag. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export function OrganizationJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        name: site.name,
        alternateName: site.nameAr,
        url: site.url,
        logo: `${site.url}/brand/logo-on-light.png`,
        description: site.description,
        sameAs: Object.values(site.socials),
        contactPoint: {
          "@type": "ContactPoint",
          email: site.contact.email,
          telephone: site.contact.phone,
          contactType: "customer service",
          areaServed: "IN",
          availableLanguage: ["English", "Arabic", "Hindi"],
        },
      }}
    />
  );
}
