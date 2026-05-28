import prisma from "@/lib/prisma";

// Keys available in system_configs
export const CONFIG_KEYS = {
  MAINTENANCE_MODE: "maintenance_mode",
  MAINTENANCE_MESSAGE: "maintenance_message",
  SITE_ANNOUNCEMENT: "site_announcement",
  ANNOUNCEMENT_COLOR: "announcement_color", // "info" | "warning" | "success"
} as const;

type ConfigKey = (typeof CONFIG_KEYS)[keyof typeof CONFIG_KEYS];

export async function getSystemConfig(key: ConfigKey): Promise<string | null> {
  try {
    const config = await prisma.systemConfig.findUnique({ where: { key } });
    return config?.value ?? null;
  } catch {
    return null;
  }
}

export async function getSystemConfigs(keys: ConfigKey[]): Promise<Record<string, string>> {
  try {
    const configs = await prisma.systemConfig.findMany({
      where: { key: { in: keys } },
    });
    return Object.fromEntries(configs.map((c) => [c.key, c.value]));
  } catch {
    return {};
  }
}

/**
 * Syncs maintenance_mode to Upstash Redis so the edge middleware can read it
 * without hitting Prisma. Uses raw fetch (HTTP REST) to stay edge-compatible.
 */
async function syncMaintenanceModeToRedis(value: string): Promise<void> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return;
  try {
    await fetch(`${url}/set/maintenance_mode/${encodeURIComponent(value)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // Non-critical: maintenance mode persists in DB and will be synced on next write
    console.error("Failed to sync maintenance_mode to Redis");
  }
}

export async function setSystemConfig(key: ConfigKey, value: string): Promise<void> {
  await prisma.systemConfig.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
  if (key === CONFIG_KEYS.MAINTENANCE_MODE) {
    await syncMaintenanceModeToRedis(value);
  }
}

export async function setSystemConfigs(data: Partial<Record<ConfigKey, string>>): Promise<void> {
  const entries = Object.entries(data) as [ConfigKey, string][];
  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.systemConfig.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    )
  );
}

export async function isMaintenanceMode(): Promise<boolean> {
  const val = await getSystemConfig(CONFIG_KEYS.MAINTENANCE_MODE);
  return val === "true";
}
