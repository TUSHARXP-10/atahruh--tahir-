import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
    // The local `prisma dev` database accepts only 10 connections in total, shared by every
    // dev-server bundle — keep each pool small and hand idle connections back quickly.
    // DATABASE_POOL_MAX overrides the pool size (e.g. for a local production build).
    ...(process.env.NODE_ENV !== "production" ? { max: 3, idleTimeoutMillis: 2_000 } : {}),
    ...(process.env.DATABASE_POOL_MAX ? { max: Number(process.env.DATABASE_POOL_MAX) } : {}),
  });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
