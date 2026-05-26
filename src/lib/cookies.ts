import type { CookieConsent, CookiePreferences } from "@/types/cookies"

const STORAGE_KEY = "mystack-cookie-prefs"

export function getCookiePreferences(): CookiePreferences | null {
  if (typeof window === "undefined") return null
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null
    return JSON.parse(stored) as CookiePreferences
  } catch {
    return null
  }
}

export function saveCookiePreferences(
  consent: CookieConsent
): CookiePreferences {
  const prefs: CookiePreferences = {
    necessary: true,
    analytics: consent.analytics,
    marketing: consent.marketing,
    hasConsented: true,
    updatedAt: Date.now(),
  }
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  }
  return prefs
}

export function clearCookiePreferences(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY)
  }
}

/**
 * Returns true if the user has consented to analytics cookies.
 * Safe to call on the server (returns false).
 */
export function canUseAnalytics(): boolean {
  return getCookiePreferences()?.analytics ?? false
}

/**
 * Returns true if the user has consented to marketing cookies.
 * Safe to call on the server (returns false).
 */
export function canUseMarketing(): boolean {
  return getCookiePreferences()?.marketing ?? false
}
