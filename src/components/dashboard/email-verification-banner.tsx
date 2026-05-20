"use client";

import { useState } from "react";
import { Mail, X, RefreshCw } from "lucide-react";

export function EmailVerificationBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (dismissed) return null;

  const handleResend = async () => {
    setIsSending(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" });
      if (res.ok) {
        setSent(true);
      } else {
        const data = await res.json();
        setError(data.error || "Error al enviar el email");
      }
    } catch {
      setError("Ocurrió un error. Intentá de nuevo.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <Mail className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-amber-900">Verificá tu email</h3>
          {sent ? (
            <p className="mt-1 text-sm text-amber-700">
              ¡Listo! Te reenviamos el email de verificación. Revisá tu bandeja de entrada.
            </p>
          ) : (
            <>
              <p className="mt-1 text-sm text-amber-700">
                Te enviamos un email de verificación al registrarte. Hacé clic en el enlace para activar tu cuenta.
              </p>
              {error && (
                <p className="mt-1 text-sm text-destructive">{error}</p>
              )}
              <button
                onClick={handleResend}
                disabled={isSending}
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-amber-800 underline-offset-2 hover:underline disabled:opacity-60"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSending ? "animate-spin" : ""}`} />
                {isSending ? "Enviando..." : "Reenviar email de verificación"}
              </button>
            </>
          )}
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-400 hover:text-amber-600"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
