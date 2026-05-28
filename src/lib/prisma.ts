import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // En desarrollo usar DIRECT_URL (sin pooler), en producción usar DATABASE_URL (con pooler)
  const connectionString = process.env.NODE_ENV === "development" 
    ? (process.env.DIRECT_URL || process.env.DATABASE_URL)
    : (process.env.DATABASE_URL || process.env.DIRECT_URL);
  
  if (!connectionString) {
    throw new Error("DATABASE_URL or DIRECT_URL is not defined");
  }

  // max: 1 — en serverless cada instancia maneja 1 request a la vez,
  // no necesita más de 1 conexión. Sin este límite, cada lambda puede
  // abrir hasta 10 conexiones por defecto, agotando el pool de Supabase.
  const pool = new Pool({ connectionString, max: 1 });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
