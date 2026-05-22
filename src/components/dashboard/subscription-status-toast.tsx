"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

export function SubscriptionStatusToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const status = searchParams.get("subscription");
    if (!status) return;

    // Limpiar el query param de la URL sin recargar la página
    const params = new URLSearchParams(searchParams.toString());
    params.delete("subscription");
    const newUrl = params.size > 0 ? `${pathname}?${params.toString()}` : pathname;
    router.replace(newUrl, { scroll: false });

    switch (status) {
      case "success":
        toast.success("¡Suscripción activada!", {
          description: "Tu pago fue procesado. El plan se activará en instantes.",
          duration: 6000,
        });
        break;
      case "pending":
        toast.info("Pago en proceso", {
          description: "Tu pago está siendo procesado por MercadoPago. Recibirás una notificación cuando se confirme.",
          duration: 8000,
        });
        break;
      case "error":
        toast.error("Error en el pago", {
          description: "No pudimos procesar tu pago. Podés intentarlo nuevamente desde Suscripción.",
          duration: 8000,
        });
        break;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
