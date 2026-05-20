import { Suspense } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface VerifyEmailContentProps {
  searchParams: Promise<{ success?: string; error?: string }>;
}

async function VerifyEmailContent({ searchParams }: VerifyEmailContentProps) {
  const params = await searchParams;

  if (params.success === "true") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl">¡Email verificado!</CardTitle>
          <CardDescription>
            Tu cuenta está activa. Ya podés ingresar a tu dashboard.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/login" className="w-full">
            <Button className="w-full">Ir al login</Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  if (params.error === "expired") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <XCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Enlace expirado</CardTitle>
          <CardDescription>
            El enlace de verificación expiró o ya fue usado. Ingresá a tu cuenta y desde el dashboard podés solicitar uno nuevo.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/login" className="w-full">
            <Button variant="outline" className="w-full">Ir al login</Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  if (params.error) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <XCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Enlace inválido</CardTitle>
          <CardDescription>
            El enlace de verificación no es válido. Ingresá a tu cuenta y solicitá un nuevo email de verificación.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/login" className="w-full">
            <Button variant="outline" className="w-full">Ir al login</Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  // Default: pending state (user lands here after register)
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">Revisá tu email</CardTitle>
        <CardDescription>
          Te enviamos un enlace de verificación. Hacé clic en el enlace del email para activar tu cuenta.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center text-sm text-muted-foreground">
        El enlace expira en 24 horas. Si no lo ves, revisá la carpeta de spam.
      </CardContent>
      <CardFooter>
        <Link href="/login" className="w-full">
          <Button variant="outline" className="w-full">Ir al login</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4">
      <Suspense>
        <VerifyEmailContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
