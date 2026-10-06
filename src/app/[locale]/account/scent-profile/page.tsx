import { ArrowRight, Sparkles } from "lucide-react";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { requireCustomer } from "@/server/session";

export default async function ScentProfilePage({ params }: PageProps<"/[locale]/account/scent-profile">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireCustomer(locale, "/account/scent-profile");
  const [t, tq, format, results] = await Promise.all([
    getTranslations("account"),
    getTranslations("quiz.result"),
    getFormatter(),
    db.quizResult.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 10 }),
  ]);

  if (!results.length) {
    return (
      <div className="grid place-items-center rounded-sm border border-dashed border-gold/20 py-20 text-center">
        <Sparkles className="mb-5 size-8 text-gold" strokeWidth={1} />
        <p className="max-w-sm text-smoke">{t("noScentProfile")}</p>
        <Button asChild className="mt-8">
          <Link href="/fragrance-quiz">{t("takeQuiz")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <section>
      <h2 className="mb-6 font-display text-3xl text-ivory">{t("scentProfile")}</h2>
      <ul className="space-y-3">
        {results.map((r) => {
          const profile = r.profile as { key?: string };
          return (
            <li key={r.id}>
              <Link href={`/fragrance-quiz/r/${r.id}`} className="flex items-center justify-between rounded-sm border border-gold/15 p-5 transition-colors hover:border-gold/40">
                <span>
                  <span className="block font-display text-xl text-ivory">{profile.key ? tq(`titles.${profile.key}`) : tq("dna")}</span>
                  <span className="text-xs text-mist">{format.dateTime(new Date(r.createdAt), { day: "numeric", month: "short", year: "numeric" })}</span>
                </span>
                <ArrowRight className="size-4 text-gold rtl:-scale-x-100" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
