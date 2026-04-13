"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  CreditCard,
  Settings,
  LogOut,
  Shield,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface AdminNavProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

const navItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Usuarios",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Negocios",
    href: "/admin/businesses",
    icon: Building2,
  },
  {
    title: "Suscripciones",
    href: "/admin/subscriptions",
    icon: CreditCard,
  },
  {
    title: "Estadísticas",
    href: "/admin/analytics",
    icon: BarChart3,
  },
  {
    title: "Configuración",
    href: "/admin/settings",
    icon: Settings,
  },
];

export function AdminNav({ user }: AdminNavProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card">
      {/* Header */}
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-red-500 to-orange-500">
          <Shield className="h-4 w-4 text-white" />
        </div>
        <div>
          <span className="font-bold">MyStack</span>
          <span className="ml-1 text-xs text-muted-foreground">Admin</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== "/admin" && pathname.startsWith(item.href));
          
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
              {item.title}
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* User section */}
      <div className="p-3 space-y-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Building2 className="h-4 w-4" />
          Ir al Dashboard
        </Link>
        
        <div className="flex items-center gap-3 px-3 py-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.image || undefined} />
            <AvatarFallback className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs">
              {user.name?.charAt(0) || user.email?.charAt(0) || "A"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 truncate">
            <p className="text-sm font-medium truncate">{user.name || "Admin"}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-destructive"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar sesión
        </Button>
      </div>
    </div>
  );
}
