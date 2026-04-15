"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import {
  Briefcase,
  Users,
  Clock,
  ExternalLink,
  ArrowRight,
  Calendar,
  Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickAction {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

interface GettingStartedCardsProps {
  businessSlug: string;
  hasServices: boolean;
  hasStaff: boolean;
  hasSchedule: boolean;
  className?: string;
}

export function GettingStartedCards({
  businessSlug,
  hasServices,
  hasStaff,
  hasSchedule,
  className,
}: GettingStartedCardsProps) {
  // Determinar qué acciones mostrar basado en lo que falta configurar
  const quickActions: QuickAction[] = [];

  if (!hasServices) {
    quickActions.push({
      id: "services",
      title: "Crea tu primer servicio",
      description: "Define qué ofreces, con precios y duración",
      href: "/dashboard/services",
      icon: Briefcase,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-950",
    });
  }

  if (!hasStaff) {
    quickActions.push({
      id: "staff",
      title: "Agrega tu equipo",
      description: "Añade a las personas que atenderán clientes",
      href: "/dashboard/staff",
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-950",
    });
  }

  if (!hasSchedule) {
    quickActions.push({
      id: "schedule",
      title: "Configura tus horarios",
      description: "Establece cuándo están disponibles para reservas",
      href: "/dashboard/schedule",
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-950",
    });
  }

  // Si ya tiene todo configurado, mostrar acciones de uso diario
  if (hasServices && hasStaff && hasSchedule) {
    return (
      <div className={cn("grid gap-4 md:grid-cols-2", className)}>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Ver turnos de hoy</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Revisa y gestiona las citas del día
                </p>
                <Link 
                  href="/dashboard/appointments"
                  className="inline-flex items-center text-sm text-primary hover:underline underline-offset-4 mt-2"
                >
                  Ir a turnos <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <Share2 className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Compartir tu página</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Envía tu link de reservas a clientes
                </p>
                <button
                  className="inline-flex items-center text-sm text-primary hover:underline underline-offset-4 mt-2"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/${businessSlug}`
                    );
                  }}
                >
                  Copiar link <ExternalLink className="ml-1 h-4 w-4" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mostrar acciones pendientes
  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Primeros pasos</h2>
        <span className="text-sm text-muted-foreground">
          {3 - quickActions.length}/3 completados
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {quickActions.map((action) => (
          <Link key={action.id} href={action.href}>
            <Card className="h-full hover:shadow-md transition-all hover:scale-[1.02] cursor-pointer">
              <CardContent className="p-6">
                <div
                  className={cn("rounded-lg w-fit p-3 mb-4", action.bgColor)}
                >
                  <action.icon className={cn("h-6 w-6", action.color)} />
                </div>
                <h3 className="font-semibold">{action.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {action.description}
                </p>
                <div className="flex items-center mt-4 text-primary text-sm font-medium">
                  Empezar <ArrowRight className="ml-1 h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
