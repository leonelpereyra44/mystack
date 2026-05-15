import { PrismaClient } from "@prisma/client";
import { mockDeep } from "vitest-mock-extended";

// Singleton del mock de Prisma. Cada test file que lo importe a través de
// vi.mock("@/lib/prisma", async () => ...) obtiene la misma instancia dentro del mismo worker.
// Los tests llaman vi.resetAllMocks() en beforeEach para limpiar el estado entre tests.
export const prismaMock = mockDeep<PrismaClient>();
