import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
    // Local `prisma dev` runs a separate shadow database; Neon/managed DBs can omit this.
    shadowDatabaseUrl: process.env["SHADOW_DATABASE_URL"],
  },
});
