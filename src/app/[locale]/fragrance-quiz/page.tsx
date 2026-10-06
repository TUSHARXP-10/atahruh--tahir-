import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { GoldDust } from "@/components/motion/gold-dust";
import { QuizFlow } from "@/components/quiz/quiz-flow";
import { Container } from "@/components/ui/container";
import { photo } from "@/lib/images";

export async function generateMetadata({ params }: PageProps<"/[locale]/fragrance-quiz">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "quiz" });
  return { title: t("metaTitle"), description: t("intro"), alternates: { canonical: locale === "en" ? "/fragrance-quiz" : `/${locale}/fragrance-quiz` } };
}

export default async function QuizPage({ params }: PageProps<"/[locale]/fragrance-quiz">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <section className="relative isolate min-h-[calc(100dvh-6rem)] overflow-hidden bg-noir">
      <Image src={photo("portraitFlower")} alt="" fill loading="eager" fetchPriority="high" sizes="100vw" className="-z-10 object-cover object-[70%_30%] opacity-25" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-noir/40 via-noir/80 to-noir" />
      <GoldDust density={0.00008} />
      <Container className="relative py-16 lg:py-24">
        <QuizFlow />
      </Container>
    </section>
  );
}
