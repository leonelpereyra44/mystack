"use client"

import { useEffect } from "react"
import { useCookiePreferences } from "@/hooks/useCookiePreferences"
import { CookieBanner } from "./CookieBanner"
import { CookiePreferencesModal } from "./CookiePreferencesModal"
import { GoogleAnalytics } from "@/components/analytics/google-analytics"

/**
 * CookieConsentManager
 *
 * Drop this once in your root layout (inside <body>).
 * It handles:
 *  - Showing the consent banner on first visit
 *  - Opening the preferences modal on demand
 *  - Conditionally loading Google Analytics only when analytics consent is granted
 *  - Listening for the "mystack:open-cookie-settings" custom event so any
 *    component in the tree (e.g. a footer link) can open the modal without
 *    needing shared context.
 */
export function CookieConsentManager() {
  const {
    preferences,
    showBanner,
    isModalOpen,
    acceptAll,
    rejectOptional,
    saveCustom,
    openModal,
    closeModal,
  } = useCookiePreferences()

  // Listen for external "open settings" trigger (e.g. from footer button)
  useEffect(() => {
    const handler = () => openModal()
    window.addEventListener("mystack:open-cookie-settings", handler)
    return () => window.removeEventListener("mystack:open-cookie-settings", handler)
  }, [openModal])

  return (
    <>
      {/* Load Google Analytics only after analytics consent */}
      {preferences?.analytics && <GoogleAnalytics />}

      {/* Consent banner — visible until user makes a choice */}
      {showBanner && (
        <CookieBanner
          onAccept={acceptAll}
          onReject={rejectOptional}
          onConfigure={openModal}
        />
      )}

      {/* Preferences modal — opened from banner or from any CookieSettingsButton */}
      <CookiePreferencesModal
        isOpen={isModalOpen}
        preferences={preferences}
        onSave={saveCustom}
        onClose={closeModal}
      />
    </>
  )
}
