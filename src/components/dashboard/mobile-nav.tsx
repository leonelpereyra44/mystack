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
  Menu,
  BarChart3,
  HelpCircle,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetClose,
} from "@/components/ui/sheet";
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

interface MobileNavProps {
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

export function MobileNav({ business, user }: MobileNavProps) {
  const pathname = usePathname();

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Abrir menú</span>
          </Button>
        }
      />
      <SheetContent side="left" className="w-72 p-0" showCloseButton={false}>
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
              <SheetClose
                key={item.href}
                render={
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                }
              />
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
            <div className="flex flex-col gap-2">
              <SheetClose
                render={
                  <Link
                    href="/contacto"
                    className="flex items-center gap-2 text-xs text-primary hover:underline"
                  >
                    <Mail className="h-3 w-3" />
                    Formulario de contacto
                  </Link>
                }
              />
              <a
                href="mailto:contacto@mystack.com.ar"
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary"
              >
                <Mail className="h-3 w-3" />
                contacto@mystack.com.ar
              </a>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="border-t p-4 mt-auto">
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.image || undefined} />
              <AvatarFallback>
                {user.name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium text-sm">{user.name}</span>
              <span className="text-xs text-muted-foreground">{user.email}</span>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full justify-start gap-2 text-destructive hover:text-destructive"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
