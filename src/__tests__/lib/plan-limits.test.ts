import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────
vi.mock("@/lib/prisma", async () => {
  const { prismaMock } = await import("@/test-utils/prisma-mock");
  return { prisma: prismaMock, default: prismaMock };
});

import prisma from "@/lib/prisma";
import {
  canCreateReservation,
  canCreateStaff,
  getPlanUsage,
  PLAN_LIMITS,
} from "@/lib/plan-limits";

const mockPrisma = vi.mocked(prisma);

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const BUSINESS_FREE = {
  id: "biz-free",
  subscription: { plan: "FREE" as const, status: "ACTIVE" as const },
};
const BUSINESS_PRO = {
  id: "biz-pro",
  subscription: { plan: "PRO" as const, status: "ACTIVE" as const },
};
const BUSINESS_TRIALING = {
  id: "biz-trialing",
  subscription: { plan: "PRO" as const, status: "TRIALING" as const },
};
const BUSINESS_NO_SUB = {
  id: "biz-nosub",
  subscription: null,
};

const FREE_PLAN_CONFIG = {
  maxReservationsPerMonth: 150,
  maxStaff: 1,
};

beforeEach(() => {
  vi.resetAllMocks();
  // Por defecto: PlanConfig devuelve los límites del plan FREE
  (mockPrisma.planConfig.findUnique as never as ReturnType<typeof vi.fn>).mockResolvedValue(FREE_PLAN_CONFIG);
});

// ─── canCreateReservation ─────────────────────────────────────────────────────

describe("canCreateReservation", () => {
  it("devuelve { allowed: false, reason } si el negocio no existe", async () => {
    (mockPrisma.business.findUnique as never as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const result = await canCreateReservation("biz-unknown");
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/no encontrado/i);
  });

  it("PRO activo con límite null → allowed: true sin contar reservas", async () => {
    (mockPrisma.business.findUnique as never as ReturnType<typeof vi.fn>).mockResolvedValue(BUSINESS_PRO);
    (mockPrisma.planConfig.findUnique as never as ReturnType<typeof vi.fn>).mockResolvedValue({
      maxReservationsPerMonth: null, // ilimitado
      maxStaff: null,
    });

    const result = await canCreateReservation("biz-pro");

    expect(result.allowed).toBe(true);
    // No consultó appointment.count (no necesario si es ilimitado)
    expect(mockPrisma.appointment.count).not.toHaveBeenCalled();
  });

  it("FREE dentro del límite (80/150) → allowed: true", async () => {
    (mockPrisma.business.findUnique as never as ReturnType<typeof vi.fn>).mockResolvedValue(BUSINESS_FREE);
    (mockPrisma.appointment.count as never as ReturnType<typeof vi.fn>).mockResolvedValue(80);

    const result = await canCreateReservation("biz-free");

    expect(result.allowed).toBe(true);
    expect(result.usage?.current).toBe(80);
    expect(result.usage?.limit).toBe(150);
  });

  it("FREE en el límite exacto (150/150) → allowed: false con reason", async () => {
    (mockPrisma.business.findUnique as never as ReturnType<typeof vi.fn>).mockResolvedValue(BUSINESS_FREE);
    (mockPrisma.appointment.count as never as ReturnType<typeof vi.fn>).mockResolvedValue(150);

    const result = await canCreateReservation("biz-free");

    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/150/);
    expect(result.usage?.current).toBe(150);
  });

  it("TRIALING fuerza límites FREE aunque el plan sea PRO", async () => {
    (mockPrisma.business.findUnique as never as ReturnType<typeof vi.fn>).mockResolvedValue(BUSINESS_TRIALING);
    (mockPrisma.appointment.count as never as ReturnType<typeof vi.fn>).mockResolvedValue(200);

    // PlanConfig para FREE devuelve límite 150
    const result = await canCreateReservation("biz-trialing");

    expect(result.allowed).toBe(false); // 200 > 150 (FREE limit)

    // Verificar que consultó el planConfig de FREE (no PRO)
    expect(mockPrisma.planConfig.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { plan: "FREE" } })
    );
  });

  it("sin suscripción fuerza límites FREE", async () => {
    (mockPrisma.business.findUnique as never as ReturnType<typeof vi.fn>).mockResolvedValue(BUSINESS_NO_SUB);
    (mockPrisma.appointment.count as never as ReturnType<typeof vi.fn>).mockResolvedValue(10);

    const result = await canCreateReservation("biz-nosub");

    expect(result.allowed).toBe(true);
    expect(mockPrisma.planConfig.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { plan: "FREE" } })
    );
  });

  it("usa fallback estático si PlanConfig no existe en DB", async () => {
    (mockPrisma.business.findUnique as never as ReturnType<typeof vi.fn>).mockResolvedValue(BUSINESS_FREE);
    (mockPrisma.planConfig.findUnique as never as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (mockPrisma.appointment.count as never as ReturnType<typeof vi.fn>).mockResolvedValue(10);

    const result = await canCreateReservation("biz-free");

    expect(result.allowed).toBe(true);
    expect(result.usage?.limit).toBe(PLAN_LIMITS.FREE.maxReservationsPerMonth);
  });
});

// ─── canCreateStaff ───────────────────────────────────────────────────────────

describe("canCreateStaff", () => {
  it("FREE con 1 staff activo (límite) → allowed: false", async () => {
    (mockPrisma.business.findUnique as never as ReturnType<typeof vi.fn>).mockResolvedValue(BUSINESS_FREE);
    (mockPrisma.staff.count as never as ReturnType<typeof vi.fn>).mockResolvedValue(1);

    const result = await canCreateStaff("biz-free");

    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/1 profesional/i);
  });

  it("FREE con 0 staff → allowed: true", async () => {
    (mockPrisma.business.findUnique as never as ReturnType<typeof vi.fn>).mockResolvedValue(BUSINESS_FREE);
    (mockPrisma.staff.count as never as ReturnType<typeof vi.fn>).mockResolvedValue(0);

    const result = await canCreateStaff("biz-free");
    expect(result.allowed).toBe(true);
  });

  it("PRO con staff ilimitado → allowed: true sin contar", async () => {
    (mockPrisma.business.findUnique as never as ReturnType<typeof vi.fn>).mockResolvedValue(BUSINESS_PRO);
    (mockPrisma.planConfig.findUnique as never as ReturnType<typeof vi.fn>).mockResolvedValue({
      maxReservationsPerMonth: null,
      maxStaff: null,
    });

    const result = await canCreateStaff("biz-pro");

    expect(result.allowed).toBe(true);
    expect(mockPrisma.staff.count).not.toHaveBeenCalled();
  });
});

// ─── getPlanUsage ─────────────────────────────────────────────────────────────

describe("getPlanUsage", () => {
  it("devuelve null si el negocio no existe", async () => {
    (mockPrisma.business.findUnique as never as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const result = await getPlanUsage("biz-unknown");
    expect(result).toBeNull();
  });

  it("devuelve usage correcto con reservas y staff del mes", async () => {
    (mockPrisma.business.findUnique as never as ReturnType<typeof vi.fn>).mockResolvedValue(BUSINESS_FREE);
    (mockPrisma.appointment.count as never as ReturnType<typeof vi.fn>).mockResolvedValue(80);
    (mockPrisma.staff.count as never as ReturnType<typeof vi.fn>).mockResolvedValue(1);

    const result = await getPlanUsage("biz-free");

    expect(result?.plan).toBe("FREE");
    expect(result?.reservations.current).toBe(80);
    expect(result?.reservations.limit).toBe(150);
    expect(result?.reservations.percentage).toBe(Math.round((80 / 150) * 100));
    expect(result?.staff.current).toBe(1);
    expect(result?.staff.limit).toBe(1);
  });

  it("percentage es 0 para plan PRO (ilimitado)", async () => {
    (mockPrisma.business.findUnique as never as ReturnType<typeof vi.fn>).mockResolvedValue(BUSINESS_PRO);
    (mockPrisma.planConfig.findUnique as never as ReturnType<typeof vi.fn>).mockResolvedValue({
      maxReservationsPerMonth: null,
      maxStaff: null,
    });
    (mockPrisma.appointment.count as never as ReturnType<typeof vi.fn>).mockResolvedValue(500);
    (mockPrisma.staff.count as never as ReturnType<typeof vi.fn>).mockResolvedValue(10);

    const result = await getPlanUsage("biz-pro");

    expect(result?.reservations.percentage).toBe(0);
  });
});
