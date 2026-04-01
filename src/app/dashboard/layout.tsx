import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { DashboardNav } from "@/components/dashboard/nav";
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
    redirect("/onboarding");
  }

  return (
    <div className="flex min-h-screen">
      <DashboardNav business={business} user={session.user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar with notifications */}
        <header className="h-14 border-b bg-card flex items-center justify-end px-6">
          <NotificationsDropdown />
        </header>
        <main className="flex-1 overflow-y-auto bg-muted/30">
          <div className="container mx-auto p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
