"use client";

import Script from "next/script";

const GA_MEASUREMENT_ID = "AW-18064393765";
const CONVERSION_ID = "AW-18064393765/cwlaCNuSzpccEKWM46VD";

export function GoogleAnalytics() {
  return (
    <>
      {/* Google tag (gtag.js) */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  );
}

// Función para trackear conversión de compra de suscripción PRO
export function trackPurchaseConversion(transactionId: string, value?: number) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", "conversion", {
      send_to: CONVERSION_ID,
      transaction_id: transactionId,
      value: value || 0,
      currency: "ARS",
    });
    console.log("[Google Ads] Conversion tracked:", transactionId);
  }
}

// Función para trackear registro de usuario (puede ser útil para otra acción de conversión)
export function trackSignupConversion(userId: string) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    // Usar el mismo CONVERSION_ID o crear uno específico para registros
    window.gtag("event", "conversion", {
      send_to: CONVERSION_ID,
      transaction_id: `signup_${userId}`,
    });
    console.log("[Google Ads] Signup conversion tracked:", userId);
  }
}

// Declarar gtag en el tipo Window
declare global {
  interface Window {
    gtag: (
      command: string,
      action: string,
      params?: Record<string, unknown>
    ) => void;
    dataLayer: unknown[];
  }
}
