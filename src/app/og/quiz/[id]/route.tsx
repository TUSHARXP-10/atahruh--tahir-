import en from "../../../../../messages/en.json";
import { db } from "@/lib/db";
import { photo } from "@/lib/images";
import { ogCard } from "@/server/og";

/** Share image for a Fragrance Score result: the profile title and its line. */
export async function GET(_req: Request, ctx: RouteContext<"/og/quiz/[id]">) {
  const { id } = await ctx.params;
  const row = await db.quizResult.findUnique({ where: { id }, select: { profile: true } });
  const key = (row?.profile as { key?: string } | null)?.key;
  const titles = en.quiz.result.titles as Record<string, string>;
  const lines = en.quiz.result.descriptions as Record<string, string>;
  if (!key || !titles[key]) return new Response("Not found", { status: 404 });
  return ogCard({ photo: photo("portraitFlower"), eyebrow: "My Fragrance Score", title: titles[key], subtitle: lines[key], footer: "Find yours at aayatalruh.com" });
}
