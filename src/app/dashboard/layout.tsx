import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { DashboardNav } from "@/components/dashboard/nav";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { NotificationsDropdown } from "@/components/dashboard/notifications-dropdown";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Get user's business
  const business = await prisma.business.findFirst({
    where: { ownerId: session.user.id },
  });

  if (!business) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <DashboardNav business={business} user={session.user} />
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b bg-card flex items-center justify-between px-4 md:px-6">
          {/* Mobile menu button */}
          <MobileNav business={business} user={session.user} />
          
          {/* Logo for mobile */}
          <div className="flex items-center gap-2 md:hidden">
            <span className="font-bold text-lg">MyStack</span>
          </div>
          
          {/* Spacer for desktop */}
          <div className="hidden md:block" />
          
          <NotificationsDropdown />
        </header>
        
        <main className="flex-1 overflow-y-auto bg-muted/30">
          <div className="container mx-auto p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
