import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const MAINTENANCE_BYPASS = [
  "/maintenance",
  "/admin",
  "/api",
  "/login",
  "/invalid-session",
];

/**
 * Reads maintenance_mode from Upstash Redis via HTTP REST API.
 * Edge-compatible (no Node.js dependencies).
 * Returns false on any error so requests are never blocked by Redis issues.
 */
async function getMaintenanceMode(): Promise<boolean> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return false;
  try {
    const res = await fetch(`${url}/get/maintenance_mode`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return false;
    const { result } = await res.json();
    return result === "true";
  } catch {
    return false;
  }
}

const { auth } = NextAuth(authConfig);

export default auth(async (req) => {
  const { pathname } = req.nextUrl;

  const skipMaintenance = MAINTENANCE_BYPASS.some((p) => pathname.startsWith(p));
  if (!skipMaintenance) {
    const isAdmin = (req.auth?.user as { role?: string } | undefined)?.role === "ADMIN";
    if (!isAdmin) {
      const maintenance = await getMaintenanceMode();
      if (maintenance) {
        return NextResponse.redirect(new URL("/maintenance", req.url));
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.png$|.*\\.svg$|.*\\.ico$|site\\.webmanifest).*)",
  ],
};
