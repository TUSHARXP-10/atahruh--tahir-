import "dotenv/config";
import pg from "pg";

/**
 * Local runs only: reset the anti-spam counters (contact form, reviews, checkout…)
 * so repeated test runs from the same machine aren't throttled. Never touches a
 * remote database.
 */
export default async function globalSetup() {
  const base = process.env.E2E_BASE_URL ?? "http://localhost:3000";
  const url = process.env.DATABASE_URL ?? "";
  if (!/localhost|127\.0\.0\.1/.test(base) || !/localhost|127\.0\.0\.1/.test(url)) return;
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    await client.query(`DELETE FROM "RateLimit"`);
  } finally {
    await client.end();
  }
}
