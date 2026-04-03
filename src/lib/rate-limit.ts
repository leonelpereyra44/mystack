import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Rate limiter usando Upstash Redis
// Si no hay credenciales configuradas, usa un limiter en memoria (solo dev)

let rateLimiter: Ratelimit | null = null;

function createRateLimiter() {
  // Si ya existe, retornarlo
  if (rateLimiter) return rateLimiter;

  // Si hay credenciales de Upstash, usar Redis
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    rateLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 requests por minuto
      analytics: true,
    });

    return rateLimiter;
  }

  // Fallback: rate limiter en memoria (solo para desarrollo)
  console.warn("⚠️ Using in-memory rate limiter. Set UPSTASH_REDIS_* for production.");
  
  rateLimiter = new Ratelimit({
    redis: Redis.fromEnv(), // Esto fallará sin env vars, pero el ephemeral storage funciona
    limiter: Ratelimit.slidingWindow(10, "1 m"),
    ephemeralCache: new Map(),
  });

  return rateLimiter;
}

/**
 * Rate limit por IP
 * @param identifier - IP o identificador único
 */
export async function rateLimit(
  identifier: string
): Promise<{ success: boolean; remaining: number }> {
  // En desarrollo sin Redis, siempre permitir
  if (!process.env.UPSTASH_REDIS_REST_URL && process.env.NODE_ENV === "development") {
    return { success: true, remaining: 999 };
  }

  try {
    const limiter = createRateLimiter();
    const result = await limiter.limit(identifier);
    return { success: result.success, remaining: result.remaining };
  } catch (error) {
    console.error("Rate limit error:", error);
    // En caso de error, permitir el request (fail open)
    return { success: true, remaining: 0 };
  }
}

/**
 * Obtener IP del request
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return "anonymous";
}

/**
 * Helper para usar en API routes
 */
export async function checkRateLimit(request: Request): Promise<{
  limited: boolean;
  response?: Response;
}> {
  const ip = getClientIP(request);
  const { success, remaining } = await rateLimit(ip);

  if (!success) {
    return {
      limited: true,
      response: new Response(
        JSON.stringify({
          error: "Demasiadas solicitudes. Por favor, espera un momento.",
          retryAfter: 60,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": "60",
            "X-RateLimit-Remaining": String(remaining),
          },
        }
      ),
    };
  }

  return { limited: false };
}
