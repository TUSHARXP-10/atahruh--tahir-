"use server";

import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { pickTherapy, profileKey, rankProducts, scentDNA, type QuizAnswers, type QuizProduct } from "@/lib/quiz";
import { rateLimit } from "@/lib/rate-limit";
import { getSessionUser } from "../session";

const answersSchema = z.object({
  forWhom: z.enum(["me-him", "me-her", "gift-him", "gift-her", "anyone"]),
  moods: z.array(z.string()).max(2),
  families: z.array(z.string()).max(3),
  intensity: z.union([z.literal(2), z.literal(3), z.literal(5)]),
  occasions: z.array(z.string()).max(2),
  season: z.enum(["SUMMER", "MONSOON", "WINTER", "ALL"]),
  form: z.enum(["PERFUME", "ATTAR", "THERAPY", "ANY"]),
  budget: z.enum(["u1500", "1500-3000", "o3000", "any"]),
});

export async function loadQuizProducts(): Promise<QuizProduct[]> {
  const rows = await db.product.findMany({
    where: { status: "ACTIVE", kind: { in: ["FRAGRANCE", "THERAPY"] } },
    select: {
      id: true,
      kind: true,
      family: true,
      gender: true,
      moods: true,
      occasions: true,
      seasons: true,
      intensity: true,
      forms: { select: { type: true, variants: { select: { price: true } } } },
    },
  });
  return rows.map((p) => ({
    id: p.id,
    kind: p.kind,
    family: p.family,
    gender: p.gender,
    moods: p.moods,
    occasions: p.occasions,
    seasons: p.seasons,
    intensity: p.intensity,
    forms: p.forms.map((f) => f.type),
    minPrice: Math.min(...p.forms.flatMap((f) => f.variants.map((v) => v.price))),
  }));
}

export async function submitQuiz(input: QuizAnswers, locale: string) {
  const parsed = answersSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const };
  if (!(await rateLimit("quiz", 30, 3600))) return { ok: false as const };

  const answers = parsed.data as QuizAnswers;
  const products = await loadQuizProducts();
  const matches = rankProducts(products, answers).slice(0, 12);
  const therapy = answers.form === "THERAPY" || answers.moods.length ? pickTherapy(products, answers) : undefined;
  const user = await getSessionUser();

  const result = await db.quizResult.create({
    data: {
      userId: user?.id ?? null,
      locale: locale === "ar" ? "ar" : "en",
      answers: answers as unknown as Prisma.InputJsonValue,
      profile: { key: profileKey(answers), dna: scentDNA(answers), therapyId: therapy?.id ?? null } as Prisma.InputJsonValue,
      matches: matches as unknown as Prisma.InputJsonValue,
    },
  });
  return { ok: true as const, id: result.id };
}
