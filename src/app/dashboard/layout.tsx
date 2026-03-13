import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { DashboardNav } from "@/components/dashboard/nav";

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
      <main className="flex-1 overflow-y-auto bg-muted/30">
        <div className="container mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}
