import { Hourglass, Leaf, ShieldCheck, Sparkles, Truck, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { Container } from "@/components/ui/container";

export async function TrustBar() {
  const t = await getTranslations("home.trust");
  const items = [
    { Icon: Leaf, title: t("natural"), sub: t("naturalSub") },
    { Icon: Hourglass, title: t("longLasting"), sub: t("longLastingSub") },
    { Icon: Sparkles, title: t("therapeutic"), sub: t("therapeuticSub") },
    { Icon: ShieldCheck, title: t("secure"), sub: t("secureSub") },
    { Icon: Truck, title: t("delivery"), sub: t("deliverySub") },
    { Icon: Users, title: t("customers"), sub: t("customersSub") },
  ];
  return (
    <section aria-label="Promises" className="relative border-y border-gold/10 bg-ebony/80">
      <Container>
        <RevealGroup className="grid grid-cols-2 divide-gold/10 sm:grid-cols-3 lg:grid-cols-6 lg:divide-x rtl:lg:divide-x-reverse">
          {items.map(({ Icon, title, sub }) => (
            <RevealItem key={title} className="flex items-center gap-3 px-2 py-5 sm:justify-center lg:px-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-full border border-gold/30 text-gold">
                <Icon className="size-[1.1rem]" strokeWidth={1.2} />
              </span>
              <span className="leading-tight">
                <span className="block text-[0.78rem] font-semibold text-ivory">{title}</span>
                <span className="block text-[0.72rem] text-mist">{sub}</span>
              </span>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </section>
  );
}
