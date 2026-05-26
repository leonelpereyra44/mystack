"use client"

import { useState, useEffect, useCallback } from "react"
import type { CookieConsent, CookiePreferences } from "@/types/cookies"
import { getCookiePreferences, saveCookiePreferences } from "@/lib/cookies"

interface UseCookiePreferencesReturn {
  preferences: CookiePreferences | null
  isLoaded: boolean
  showBanner: boolean
  isModalOpen: boolean
  acceptAll: () => void
  rejectOptional: () => void
  saveCustom: (consent: CookieConsent) => void
  openModal: () => void
  closeModal: () => void
}

export function useCookiePreferences(): UseCookiePreferencesReturn {
  const [preferences, setPreferences] = useState<CookiePreferences | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    const stored = getCookiePreferences()
    setPreferences(stored)
    setIsLoaded(true)
  }, [])

  // Only show the banner after hydration and when no preference is stored
  const showBanner = isLoaded && !preferences?.hasConsented

  const acceptAll = useCallback(() => {
    const prefs = saveCookiePreferences({ analytics: true, marketing: true })
    setPreferences(prefs)
    setIsModalOpen(false)
  }, [])

  const rejectOptional = useCallback(() => {
    const prefs = saveCookiePreferences({ analytics: false, marketing: false })
    setPreferences(prefs)
    setIsModalOpen(false)
  }, [])

  const saveCustom = useCallback((consent: CookieConsent) => {
    const prefs = saveCookiePreferences(consent)
    setPreferences(prefs)
    setIsModalOpen(false)
  }, [])

  const openModal = useCallback(() => setIsModalOpen(true), [])
  const closeModal = useCallback(() => setIsModalOpen(false), [])

  return {
    preferences,
    isLoaded,
    showBanner,
    isModalOpen,
    acceptAll,
    rejectOptional,
    saveCustom,
    openModal,
    closeModal,
  }
}
