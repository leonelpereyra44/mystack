"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Calendar,
  LayoutDashboard,
  Settings,
  Users,
  Clock,
  Briefcase,
  LogOut,
  ExternalLink,
  BarChart3,
  HelpCircle,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Business {
  id: string;
  name: string;
  slug: string;
}

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface DashboardNavProps {
  business: Business;
  user: User;
}

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Inicio" },
  { href: "/dashboard/appointments", icon: Calendar, label: "Turnos" },
  { href: "/dashboard/services", icon: Briefcase, label: "Servicios" },
  { href: "/dashboard/staff", icon: Users, label: "Equipo" },
  { href: "/dashboard/schedule", icon: Clock, label: "Horarios" },
  { href: "/dashboard/analytics", icon: BarChart3, label: "Reportes" },
  { href: "/dashboard/settings", icon: Settings, label: "Configuración" },
];

export function DashboardNav({ business, user }: DashboardNavProps) {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Image 
          src="/mystacklogosinfondo.png" 
          alt="MyStack Logo" 
          width={28} 
          height={28}
          className="h-7 w-auto"
        />
        <span className="font-bold">MyStack</span>
      </div>

      {/* Business Info */}
      <div className="border-b p-4">
        <p className="font-medium">{business.name}</p>
        <Link
          href={`/${business.slug}`}
          target="_blank"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
        >
          Ver página pública
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Help Section */}
      <div className="border-t p-4">
        <div className="rounded-lg bg-muted/50 p-3">
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">¿Necesitas ayuda?</span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Contacta con nuestro equipo de soporte
          </p>
          <Link
            href="/contacto"
            className="inline-flex items-center gap-2 text-xs bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-md transition-colors"
          >
            <Mail className="h-3 w-3" />
            Formulario de contacto
          </Link>
        </div>
      </div>

      {/* User Menu */}
      <div className="border-t p-4">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.image || undefined} />
                  <AvatarFallback>
                    {user.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start text-sm">
                  <span className="font-medium">{user.name}</span>
                  <span className="text-xs text-muted-foreground">{user.email}</span>
                </div>
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => window.location.href = "/dashboard/settings"}>
              <Settings className="mr-2 h-4 w-4" />
              Configuración
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
