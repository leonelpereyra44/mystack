import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { isMaintenanceMode } from "@/lib/system-config";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const isMaintenance = await isMaintenanceMode();

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <LoginForm isMaintenance={isMaintenance} />
    </Suspense>
  );
}
