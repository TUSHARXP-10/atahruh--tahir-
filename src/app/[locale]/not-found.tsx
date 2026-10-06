import { useTranslations } from "next-intl";
import { KhatamStar } from "@/components/brand/ornament";
import { CalligraphyWatermark, GirihPattern } from "@/components/brand/patterns";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("notFound");
  return (
    <section className="relative grid min-h-[70dvh] place-items-center overflow-hidden px-6 py-24 text-center">
      <GirihPattern opacity={0.05} />
      <CalligraphyWatermark className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-[9rem] sm:text-[14rem]" />
      <div className="relative max-w-lg">
        <KhatamStar className="mx-auto mb-8 size-8 text-gold" filled={false} />
        <p className="eyebrow mb-4">404</p>
        <h1 className="text-display-lg text-ivory">{t("title")}</h1>
        <p className="mx-auto mt-5 max-w-md text-smoke">{t("text")}</p>
        <Button asChild className="mt-10">
          <Link href="/">{t("cta")}</Link>
        </Button>
      </div>
    </section>
  );
}
