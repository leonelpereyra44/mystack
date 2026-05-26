export interface CookiePreferences {
  necessary: true
  analytics: boolean
  marketing: boolean
  hasConsented: boolean
  updatedAt: number
}

export interface CookieConsent {
  analytics: boolean
  marketing: boolean
}
