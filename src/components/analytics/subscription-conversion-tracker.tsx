"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { trackPurchaseConversion } from "@/components/analytics/google-analytics";

interface ConversionTrackerProps {
  businessId: string;
}

export function SubscriptionConversionTracker({ businessId }: ConversionTrackerProps) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const subscription = searchParams.get("subscription");
    
    // Si el usuario volvió de MercadoPago con éxito, trackear conversión
    if (subscription === "success") {
      trackPurchaseConversion(businessId);
      
      // Opcional: limpiar el parámetro de la URL para no trackear de nuevo
      const url = new URL(window.location.href);
      url.searchParams.delete("subscription");
      window.history.replaceState({}, "", url.pathname);
    }
  }, [searchParams, businessId]);

  return null; // Este componente no renderiza nada
}
