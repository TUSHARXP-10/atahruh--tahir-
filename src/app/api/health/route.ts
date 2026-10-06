import { db } from "@/lib/db";

/**
 * Uptime check: answers 200 when the site can reach its database.
 * The scheduled GitHub workflow calls it daily, which also keeps a free Supabase
 * project from pausing (Supabase pauses free projects after 7 days without activity).
 */
export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  try {
    await db.$queryRaw`SELECT 1`;
    return Response.json({ ok: true }, { headers });
  } catch {
    return Response.json({ ok: false }, { status: 503, headers });
  }
}
