import type { PoolConfig } from "pg";

/**
 * node-postgres settings for a database URL (used by the app, the seed and scripts).
 *
 * Supabase signs its database certificates with its own CA, which Node doesn't trust,
 * and node-postgres treats `sslmode=require` as "verify against public CAs" — so a
 * Supabase URL pasted as-is would fail with "self-signed certificate in certificate chain".
 * For Supabase hosts the connection is always encrypted; paste the project's CA
 * (Supabase → Project Settings → Database → SSL Configuration) into DATABASE_CA_CERT to
 * also verify the certificate. Every other host (local, Neon, RDS…) keeps its URL's own
 * `sslmode`.
 */
export function pgConnection(url: string, ca = process.env.DATABASE_CA_CERT): Pick<PoolConfig, "connectionString" | "ssl"> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { connectionString: url };
  }
  if (!/\.supabase\.(co|com)$/i.test(parsed.hostname)) return { connectionString: url };

  // SSL is set below; URL params would override it
  for (const key of ["sslmode", "sslrootcert", "sslcert", "sslkey", "uselibpqcompat"]) parsed.searchParams.delete(key);
  // Env vars often store the PEM on one line with literal "\n"
  const pem = ca?.trim().replace(/\\n/g, "\n");
  return { connectionString: parsed.toString(), ssl: pem ? { ca: pem } : { rejectUnauthorized: false } };
}
