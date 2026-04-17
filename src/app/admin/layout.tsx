import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminNav } from "@/components/admin/nav";
import { AdminMobileNav } from "@/components/admin/mobile-nav";
import { Shield } from "lucide-react";



export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Verificar autenticación
  if (!session?.user) {
    redirect("/login");
  }

  // Verificar si es admin por rol
  const isAdmin = session.user.role === "ADMIN";

  if (!isAdmin) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar - Desktop */}
      <AdminNav user={session.user} />
      
      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-muted/30">
        {/* Mobile Header */}
        <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4 md:hidden">
          <AdminMobileNav user={session.user} />
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-r from-red-500 to-orange-500">
              <Shield className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-semibold">Admin</span>
          </div>
        </header>
        
        <div className="container mx-auto p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
