"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Briefcase,
  ContactRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TAB_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Inicio" },
  { href: "/dashboard/appointments", icon: Calendar, label: "Turnos" },
  { href: "/dashboard/services", icon: Briefcase, label: "Servicios" },
  { href: "/dashboard/clients", icon: ContactRound, label: "Clientes" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-card border-t safe-area-pb">
      <div className="flex h-16 items-stretch">
        {TAB_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 transition-transform",
                  isActive && "scale-110"
                )}
              />
              {item.label}
              {isActive && (
                <span className="absolute bottom-0 mb-0 h-0.5 w-8 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
