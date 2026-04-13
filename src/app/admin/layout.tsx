import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminNav } from "@/components/admin/nav";



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
      {/* Sidebar */}
      <AdminNav user={session.user} />
      
      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-muted/30">
        <div className="container mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
