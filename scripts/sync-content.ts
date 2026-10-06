/**
 * Add any missing homepage/page content blocks (e.g. after an upgrade) without
 * touching blocks the client has already edited.   pnpm db:content
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Prisma } from "../src/generated/prisma/client";
import { CONTENT_BLOCKS } from "../prisma/seed-data/content";
import { PAGE_BLOCKS } from "../prisma/seed-data/pages";
import { pgConnection } from "../src/lib/pg-connection";

const db = new PrismaClient({ adapter: new PrismaPg(pgConnection(process.env.DATABASE_URL!)) });

async function main() {
  const blocks = { ...CONTENT_BLOCKS, ...PAGE_BLOCKS } as Record<string, { data: unknown; dataAr?: unknown }>;
  for (const [key, block] of Object.entries(blocks)) {
    const exists = await db.contentBlock.findUnique({ where: { key }, select: { key: true } });
    if (exists) continue;
    await db.contentBlock.create({
      data: { key, data: block.data as Prisma.InputJsonValue, dataAr: (block.dataAr ?? undefined) as Prisma.InputJsonValue | undefined },
    });
    console.log(`· added ${key}`);
  }
  console.log("content blocks in sync");
}

main().finally(() => db.$disconnect());
