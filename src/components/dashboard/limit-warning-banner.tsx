"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, X, Zap } from "lucide-react";

interface LimitWarningBannerProps {
  currentReservations: number;
  maxReservations: number;
  plan: string;
}

export function LimitWarningBanner({
  currentReservations,
  maxReservations,
  plan,
}: LimitWarningBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  // Solo mostrar para plan gratuito
  if (plan !== "FREE" || dismissed) return null;

  const percentage = (currentReservations / maxReservations) * 100;
  const remaining = maxReservations - currentReservations;

  // No mostrar si está por debajo del 70%
  if (percentage < 70) return null;

  // Determinar el nivel de urgencia
  const isUrgent = percentage >= 90;
  const isCritical = percentage >= 100;

  if (isCritical) {
    return (
      <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-red-900">
              ¡Límite de reservas alcanzado!
            </h3>
            <p className="text-sm text-red-700 mt-1">
              Has alcanzado las {maxReservations} reservas mensuales del plan gratuito.
              Tus clientes no pueden hacer nuevas reservas hasta el próximo mes.
            </p>
            <div className="mt-3">
              <Link
                href="/dashboard/settings"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                <Zap className="h-4 w-4" />
                Actualizar a Plan Profesional
              </Link>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-red-400 hover:text-red-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`mb-6 rounded-lg p-4 ${
        isUrgent
          ? "bg-orange-50 border border-orange-200"
          : "bg-amber-50 border border-amber-200"
      }`}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle
          className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
            isUrgent ? "text-orange-600" : "text-amber-600"
          }`}
        />
        <div className="flex-1 min-w-0">
          <h3
            className={`font-semibold ${
              isUrgent ? "text-orange-900" : "text-amber-900"
            }`}
          >
            {isUrgent
              ? "¡Casi alcanzas el límite de reservas!"
              : "Te estás acercando al límite de reservas"}
          </h3>
          <p
            className={`text-sm mt-1 ${
              isUrgent ? "text-orange-700" : "text-amber-700"
            }`}
          >
            Has usado {currentReservations} de {maxReservations} reservas este mes.
            Te quedan <strong>{remaining}</strong> reservas disponibles.
          </p>
          <div className="mt-3">
            <Link
              href="/dashboard/settings"
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                isUrgent
                  ? "bg-orange-600 text-white hover:bg-orange-700"
                  : "border border-amber-600 text-amber-700 hover:bg-amber-100"
              }`}
            >
              <Zap className="h-4 w-4" />
              Actualizar a Plan Profesional
            </Link>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className={`${
            isUrgent
              ? "text-orange-400 hover:text-orange-600"
              : "text-amber-400 hover:text-amber-600"
          }`}
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
