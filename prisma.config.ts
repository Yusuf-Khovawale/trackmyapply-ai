import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Migrations (prisma migrate deploy/dev) use a DIRECT, non-pooled
    // connection when DIRECT_DATABASE_URL is set. Neon's pooled endpoint
    // (PgBouncer, the "-pooler" host used by DATABASE_URL for serverless)
    // doesn't support the session-level advisory locks Prisma migrate
    // relies on, so migrate can hang or fail against it. Falls back to
    // DATABASE_URL so local dev works without setting the extra var.
    url: process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL ?? "",
  },
});
