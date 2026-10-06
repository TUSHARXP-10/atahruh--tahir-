import { ChevronRight } from "lucide-react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { absoluteUrl, localePath } from "@/lib/seo";
import { JsonLd } from "@/components/seo/json-ld";

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  const locale = useLocale();
  return (
    <nav aria-label="Breadcrumb">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: items.map((item, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: item.label,
            ...(item.href ? { item: absoluteUrl(localePath(locale, item.href)) } : {}),
          })),
        }}
      />
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-mist">
        {items.map((item, i) => (
          <li key={item.label} className="flex items-center gap-1.5">
            {i > 0 ? <ChevronRight className="size-3 text-gold/50 rtl:-scale-x-100" /> : null}
            {item.href && i < items.length - 1 ? (
              <Link href={item.href} className="-my-2 inline-block py-2 transition-colors hover:text-gold-light">
                {item.label}
              </Link>
            ) : (
              <span aria-current={i === items.length - 1 ? "page" : undefined} className="text-smoke">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
