// Prisma 7 config — Supabase PostgreSQL
// DATABASE_URL: conexión poolada (pgBouncer puerto 6543) — runtime
// DIRECT_URL:   conexión directa (puerto 5432) — migraciones
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"]!,
    // directUrl usado por prisma migrate para evitar timeout en pgBouncer
    ...(process.env["DIRECT_URL"] ? { directUrl: process.env["DIRECT_URL"] } : {}),
  },
});
