import { describe, expect, it } from "vitest";
import { pgConnection } from "@/lib/pg-connection";

const SUPABASE = "postgresql://postgres.abcd:pa%24s@aws-0-ap-south-1.pooler.supabase.com:6543/postgres";

describe("pgConnection", () => {
  it("leaves local and other hosts exactly as given", () => {
    const local = "postgres://postgres:postgres@localhost:51218/template1?sslmode=disable";
    const neon = "postgresql://u:p@ep-x-pooler.ap-south-1.aws.neon.tech/neondb?sslmode=require";
    expect(pgConnection(local, undefined)).toEqual({ connectionString: local });
    expect(pgConnection(neon, undefined)).toEqual({ connectionString: neon });
  });

  it("always encrypts Supabase connections, verifying with the CA when given", () => {
    expect(pgConnection(SUPABASE, undefined)).toEqual({ connectionString: SUPABASE, ssl: { rejectUnauthorized: false } });

    const pem = "-----BEGIN CERTIFICATE-----\\nMIIB\\n-----END CERTIFICATE-----";
    expect(pgConnection(SUPABASE, pem).ssl).toEqual({ ca: "-----BEGIN CERTIFICATE-----\nMIIB\n-----END CERTIFICATE-----" });
  });

  it("drops URL ssl params that would override the Supabase settings, keeping the rest", () => {
    const { connectionString } = pgConnection(`${SUPABASE}?sslmode=require&pgbouncer=true`, undefined);
    const url = new URL(connectionString!);
    expect(url.searchParams.get("sslmode")).toBeNull();
    expect(url.searchParams.get("pgbouncer")).toBe("true");
    expect(url.password).toBe("pa%24s");
    expect(url.port).toBe("6543");
  });
});
