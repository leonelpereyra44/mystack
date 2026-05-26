"use client"

import { cn } from "@/lib/utils"

interface CookieSettingsButtonProps {
  className?: string
  children?: React.ReactNode
}

/**
 * CookieSettingsButton
 *
 * A plug-and-play button you can place anywhere (footer, settings page, etc.).
 * When clicked, it opens the CookiePreferencesModal via a custom DOM event,
 * so no shared context or prop drilling is needed.
 *
 * Usage:
 *   <CookieSettingsButton className="text-sm text-muted-foreground underline" />
 */
export function CookieSettingsButton({
  className,
  children = "Configurar cookies",
}: CookieSettingsButtonProps) {
  const handleClick = () => {
    window.dispatchEvent(new CustomEvent("mystack:open-cookie-settings"))
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        "text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors",
        className
      )}
    >
      {children}
    </button>
  )
}
