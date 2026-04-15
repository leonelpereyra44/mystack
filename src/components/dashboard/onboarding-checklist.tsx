"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Check,
  Circle,
  Briefcase,
  Users,
  Clock,
  Settings,
  Share2,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  completed: boolean;
}

interface OnboardingChecklistProps {
  businessSlug: string;
  hasServices: boolean;
  hasStaff: boolean;
  hasSchedule: boolean;
  hasLogo: boolean;
  className?: string;
}

export function OnboardingChecklist({
  businessSlug,
  hasServices,
  hasStaff,
  hasSchedule,
  hasLogo,
  className,
}: OnboardingChecklistProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const steps: OnboardingStep[] = [
    {
      id: "services",
      title: "Agrega tu primer servicio",
      description: "Define qué ofreces con precios y duración",
      href: "/dashboard/services",
      icon: Briefcase,
      completed: hasServices,
    },
    {
      id: "staff",
      title: "Agrega miembros del equipo",
      description: "Añade a las personas que atienden clientes",
      href: "/dashboard/staff",
      icon: Users,
      completed: hasStaff,
    },
    {
      id: "schedule",
      title: "Configura tus horarios",
      description: "Define cuándo estás disponible para turnos",
      href: "/dashboard/schedule",
      icon: Clock,
      completed: hasSchedule,
    },
    {
      id: "settings",
      title: "Personaliza tu negocio",
      description: "Agrega logo, descripción y redes sociales",
      href: "/dashboard/settings",
      icon: Settings,
      completed: hasLogo,
    },
  ];

  const completedSteps = steps.filter((s) => s.completed).length;
  const progress = (completedSteps / steps.length) * 100;
  const allCompleted = completedSteps === steps.length;

  // Si completó todo o lo descartó, no mostrar
  if (isDismissed || allCompleted) {
    return null;
  }

  return (
    <Card className={cn("border-primary/20 bg-gradient-to-br from-primary/5 to-transparent", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Configura tu negocio</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setIsDismissed(true)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <Progress value={progress} className="h-2 flex-1" />
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {completedSteps}/{steps.length} completados
          </span>
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="pt-0">
          <div className="space-y-2">
            {steps.map((step, index) => (
              <Link
                key={step.id}
                href={step.href}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg transition-colors",
                  step.completed
                    ? "bg-primary/10 text-muted-foreground"
                    : "hover:bg-muted"
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full shrink-0",
                    step.completed
                      ? "bg-primary text-primary-foreground"
                      : "border-2 border-muted-foreground/30"
                  )}
                >
                  {step.completed ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span className="text-sm font-medium text-muted-foreground">
                      {index + 1}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "font-medium text-sm",
                      step.completed && "line-through"
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {step.description}
                  </p>
                </div>
                <step.icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    step.completed ? "text-primary" : "text-muted-foreground"
                  )}
                />
              </Link>
            ))}
          </div>

          {/* Share link CTA */}
          <div className="mt-4 p-3 rounded-lg bg-muted/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Share2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Comparte tu página de reservas</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(
                  `${window.location.origin}/${businessSlug}`
                );
              }}
            >
              Copiar link
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
