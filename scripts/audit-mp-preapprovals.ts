import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

// ============================================================
// AUDIT MP PREAPPROVALS
//
// Lista todas las suscripciones (preapprovals) de un payer en MP,
// las cruza con la DB local y detecta huérfanos (preapprovals
// activos en MP que no corresponden al mpSubscriptionId registrado).
//
// Uso:
//   MP_CUSTOMER_ID=2991577188 npx tsx scripts/audit-mp-preapprovals.ts
//   MERCADOPAGO_ACCESS_TOKEN=... MP_CUSTOMER_ID=2991577188 npx tsx scripts/audit-mp-preapprovals.ts
//
// Opciones:
//   --cancel-orphans    Cancela en MP los preapprovals huérfanos activos
//   --business=<id>     Auditar por businessId en vez de mpCustomerId
// ============================================================

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const MP_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;
const MP_CUSTOMER_ID = process.env.MP_CUSTOMER_ID;
const BY_BUSINESS_ID = process.argv.find((a) => a.startsWith("--business="))?.split("=")[1];
const CANCEL_ORPHANS = process.argv.includes("--cancel-orphans");

if (!MP_TOKEN) {
  console.error("Falta MERCADOPAGO_ACCESS_TOKEN");
  process.exit(1);
}
if (!MP_CUSTOMER_ID && !BY_BUSINESS_ID) {
  console.error("Falta MP_CUSTOMER_ID o --business=<id>");
  process.exit(1);
}

interface MPPreApproval {
  id: string;
  status: string;
  reason: string;
  external_reference: string | null;
  payer_id: number | null;
  date_created: string | null;
  last_modified: string | null;
  next_payment_date: string | null;
  auto_recurring?: {
    frequency: number;
    frequency_type: string;
    transaction_amount: number;
    currency_id: string;
  };
}

async function mpFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${MP_TOKEN}` },
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`MP ${res.status} ${url}: ${txt}`);
  }
  return (await res.json()) as T;
}

async function listPreapprovalsByPayer(payerId: string): Promise<MPPreApproval[]> {
  const url = `https://api.mercadopago.com/preapproval/search?payer_id=${payerId}`;
  const data = await mpFetch<{ results: MPPreApproval[]; next_offset?: number; total?: number }>(url);
  return data.results ?? [];
}

async function getPreapproval(id: string): Promise<MPPreApproval> {
  return mpFetch<MPPreApproval>(`https://api.mercadopago.com/preapproval/${id}`);
}

async function cancelPreapproval(id: string): Promise<boolean> {
  const res = await fetch(`https://api.mercadopago.com/preapproval/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${MP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status: "cancelled" }),
  });
  if (!res.ok) {
    console.error(`  ✗ cancel failed for ${id}: ${res.status} ${await res.text()}`);
    return false;
  }
  // Verificar
  const after = await getPreapproval(id);
  return after.status === "cancelled";
}

async function main() {
  console.log("=".repeat(80));
  console.log("AUDITORÍA MP PREAPPROVALS");
  console.log("=".repeat(80));

  // Resolver payerId y/o businessId local
  let payerId: string | undefined = MP_CUSTOMER_ID;
  let localSub: Awaited<ReturnType<typeof prisma.subscription.findFirst>> = null;

  if (BY_BUSINESS_ID) {
    const business = await prisma.business.findUnique({
      where: { id: BY_BUSINESS_ID },
      include: { subscription: true, owner: { select: { email: true, name: true } } },
    });
    if (!business) {
      console.error("Business no encontrado:", BY_BUSINESS_ID);
      process.exit(1);
    }
    localSub = business.subscription ?? null;
    payerId = business.subscription?.mpCustomerId ?? undefined;
    console.log(`Business: ${business.id} (${business.owner?.email ?? "sin email"})`);
    console.log(`  mpCustomerId (local DB): ${payerId ?? "—"}`);
    console.log(`  mpSubscriptionId (local DB): ${localSub?.mpSubscriptionId ?? "—"}`);
    console.log(`  status local: ${localSub?.status ?? "—"}`);
    console.log(`  plan local: ${localSub?.plan ?? "—"}`);
    console.log(`  cancelledAt: ${localSub?.cancelledAt?.toISOString() ?? "—"}`);
    console.log(`  currentPeriodEnd: ${localSub?.currentPeriodEnd?.toISOString() ?? "—"}`);
  }

  if (!payerId) {
    console.error("No se pudo resolver payer_id. Usar MP_CUSTOMER_ID.");
    process.exit(1);
  }

  console.log(`\nListando preapprovals en MP para payer_id=${payerId}...`);
  let preapprovals: MPPreApproval[] = [];
  try {
    preapprovals = await listPreapprovalsByPayer(payerId);
  } catch (e) {
    console.error("Error listando preapprovals:", e instanceof Error ? e.message : e);
    process.exit(1);
  }

  console.log(`\nMP reporta ${preapprovals.length} preapproval(s):`);
  console.log("-".repeat(80));

  const registeredId = localSub?.mpSubscriptionId;
  const orphans: MPPreApproval[] = [];

  for (const p of preapprovals) {
    const isRegistered = registeredId != null && p.id === registeredId;
    const isActive = p.status === "authorized" || p.status === "pending" || p.status === "paused";
    // Orphan: preapproval activo en MP que no coincide con el mpSubscriptionId local registrado.
    // Preapprovals "pending" abandonados no generan cobros pero igual conviene limpiarlos.
    const isOrphan = isActive && !isRegistered;

    if (!localSub) {
      // Auditar por mpCustomerId sin business local: cruzar via external_reference
      const extRef = p.external_reference ?? "";
      const bizId = extRef.includes(":") ? extRef.split(":")[0] : extRef;
      const matched = bizId
        ? await prisma.subscription.findUnique({ where: { businessId: bizId } })
        : null;
      // Orphan si está activo en MP y:
      //   - no tiene match en DB, o
      //   - mpSubId local es null, o
      //   - p.id != mpSubId local registrado
      const isOrphanLocal =
        isActive &&
        (!matched ||
          !matched.mpSubscriptionId ||
          matched.mpSubscriptionId !== p.id);
      console.log(
        `\n[${p.id}] status=${p.status} ${isOrphanLocal ? "⚠ ORPHAN" : ""}` +
          `\n  reason: ${p.reason}` +
          `\n  external_reference: ${p.external_reference ?? "—"}` +
          `\n  business local: ${bizId || "—"} → ${matched ? `sub.status=${matched.status}, mpSubId=${matched.mpSubscriptionId ?? "null"}, cancelledAt=${matched.cancelledAt?.toISOString() ?? "—"}` : "NO MATCH"}` +
          `\n  auto_recurring.amount: ${p.auto_recurring?.transaction_amount ?? "—"} ${p.auto_recurring?.currency_id ?? ""}` +
          `\n  next_payment_date: ${p.next_payment_date ?? "—"}` +
          `\n  date_created: ${p.date_created ?? "—"}` +
          `\n  last_modified: ${p.last_modified ?? "—"}` +
          (matched && matched.mpSubscriptionId && p.id !== matched.mpSubscriptionId
            ? `\n  ⚠ no coincide con mpSubscriptionId local (${matched.mpSubscriptionId})`
            : "") +
          (matched && matched.status === "CANCELLED" && isActive
            ? `\n  ⚠ sub local CANCELLED pero MP sigue activo — ¡revisa webhook logs!`
            : "")
      );
      if (isOrphanLocal) orphans.push(p);
    } else {
      console.log(
        `\n[${p.id}] status=${p.status} ${isRegistered ? "✓ REGISTERED" : isOrphan ? "⚠ ORPHAN" : ""}` +
          `\n  reason: ${p.reason}` +
          `\n  external_reference: ${p.external_reference ?? "—"}` +
          `\n  auto_recurring.amount: ${p.auto_recurring?.transaction_amount ?? "—"} ${p.auto_recurring?.currency_id ?? ""}` +
          `\n  next_payment_date: ${p.next_payment_date ?? "—"}` +
          `\n  date_created: ${p.date_created ?? "—"}`
      );
      if (isOrphan) orphans.push(p);
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log(`RESUMEN: ${preapprovals.length} total, ${orphans.length} huérfano(s) activo(s)`);

  if (orphans.length === 0) {
    console.log("No hay preapprovals huérfanos activos en MP.");
  } else {
    console.log("Huerfanos activos a cancelar:");
    for (const o of orphans) {
      console.log(`  • ${o.id} (status=${o.status}, ext_ref=${o.external_reference ?? "—"})`);
    }

    if (CANCEL_ORPHANS) {
      console.log("\nCancelando huérfanos...\n");
      for (const o of orphans) {
        const ok = await cancelPreapproval(o.id);
        console.log(`  ${ok ? "✓" : "✗"} ${o.id} → ${ok ? "cancelled" : "FAILED"}`);
      }
    } else {
      console.log("\n→ Re-ejecutar con --cancel-orphans para cancelarlos en MP.");
    }
  }

  // Adicional: si auditamos por business y hay localSub cancelado, verificar estado real en MP
  if (localSub?.mpSubscriptionId && localSub.status === "CANCELLED") {
    console.log("\n" + "-".repeat(80));
    console.log(`Verificando cancelación efectiva en MP para ${localSub.mpSubscriptionId}...`);
    const real = await getPreapproval(localSub.mpSubscriptionId);
    console.log(`  estado real en MP: ${real.status}`);
    if (real.status !== "cancelled") {
      console.log("  ⚠ MP NO procesó la cancelación — sigue activo.");
      if (CANCEL_ORPHANS) {
        const ok = await cancelPreapproval(localSub.mpSubscriptionId);
        console.log(`  Re-cancelado: ${ok ? "sí" : "no"}`);
      }
    }
  }

  await pool.end();
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Error fatal:", e);
  process.exit(1);
});