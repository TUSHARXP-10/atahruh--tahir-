import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migrations need a session connection: on Supabase that's the session pooler (port 5432)
    // in DIRECT_URL; the site itself uses the transaction pooler in DATABASE_URL.
    url: process.env["DIRECT_URL"] || process.env["DATABASE_URL"],
    // Local `prisma dev` runs a separate shadow database; managed databases can omit this.
    shadowDatabaseUrl: process.env["SHADOW_DATABASE_URL"],
  },
});
