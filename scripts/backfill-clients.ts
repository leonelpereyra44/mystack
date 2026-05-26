/**
 * Script de backfill: crea registros Client desde appointments existentes.
 *
 * Agrupa los appointments por (businessId, customerEmail) y crea un Client
 * por cada combinación única, usando el nombre y teléfono más recientes.
 *
 * Ejecución (una sola vez, después de la migración add_clients):
 *   npx tsx scripts/backfill-clients.ts
 *
 * Es seguro de correr varias veces (usa upsert, no falla si el cliente ya existe).
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Error: DATABASE_URL o DIRECT_URL no está definida");
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function backfillClients() {
  console.log("Iniciando backfill de clientes...\n");

  // Obtener todos los appointments agrupados por businessId + customerEmail
  // Tomamos el nombre y teléfono del appointment más reciente para cada cliente
  const rows = await prisma.$queryRaw<
    {
      businessId: string;
      customerEmail: string;
      customerName: string;
      customerPhone: string | null;
    }[]
  >`
    SELECT DISTINCT ON ("businessId", "customerEmail")
      "businessId",
      LOWER("customerEmail") AS "customerEmail",
      "customerName",
      "customerPhone"
    FROM appointments
    ORDER BY "businessId", "customerEmail", "createdAt" DESC
  `;

  console.log(`Encontrados ${rows.length} clientes únicos en appointments.`);

  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const row of rows) {
    try {
      const result = await prisma.client.upsert({
        where: {
          businessId_email: {
            businessId: row.businessId,
            email: row.customerEmail,
          },
        },
        update: {
          name: row.customerName,
          phone: row.customerPhone ?? undefined,
        },
        create: {
          businessId: row.businessId,
          email: row.customerEmail,
          name: row.customerName,
          phone: row.customerPhone ?? null,
        },
      });

      // Si updatedAt === createdAt, es nuevo; si no, fue actualizado
      const isNew =
        Math.abs(result.updatedAt.getTime() - result.createdAt.getTime()) < 1000;
      if (isNew) {
        created++;
      } else {
        updated++;
      }
    } catch (err) {
      console.error(
        `Error al procesar ${row.customerEmail} (business: ${row.businessId}):`,
        err
      );
      errors++;
    }
  }

  console.log(`\nBackfill completado:`);
  console.log(`  Clientes creados:     ${created}`);
  console.log(`  Clientes actualizados: ${updated}`);
  console.log(`  Errores:              ${errors}`);
}

backfillClients()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
