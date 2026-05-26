import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";

export default async function OnboardingPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // If user already has a business, go to dashboard
  const business = await prisma.business.findFirst({
    where: { ownerId: session.user.id },
  });

  if (business) {
    redirect("/dashboard");
  }

  return (
    <OnboardingForm
      userName={session.user.name ?? ""}
      userEmail={session.user.email ?? ""}
    />
  );
}
