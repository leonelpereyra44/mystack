import Link from "next/link";
import Image from "next/image";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Página no encontrada",
  description: "La página que buscas no existe o fue movida. Vuelve al inicio de MyStack.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted/50 px-4">
      <div className="text-center">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <div className="flex items-center gap-2">
            <Image 
              src="/mystacklogosinfondo.png" 
              alt="MyStack Logo" 
              width={48} 
              height={48}
              className="h-12 w-auto"
            />
            <span className="text-3xl font-bold">MyStack</span>
          </div>
        </div>

        {/* 404 */}
        <h1 className="mb-2 text-8xl font-bold text-primary">404</h1>
        <h2 className="mb-4 text-2xl font-semibold">Página no encontrada</h2>
        <p className="mb-8 max-w-md text-muted-foreground">
          Lo sentimos, la página que buscas no existe o ha sido movida.
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/">
            <Button size="lg">
              <Home className="mr-2 h-4 w-4" />
              Ir al inicio
            </Button>
          </Link>
        </div>

        {/* Suggestions - SEO friendly links */}
        <div className="mt-12 pt-8 border-t border-border/50">
          <p className="text-sm text-muted-foreground mb-4">¿Buscabas alguno de estos?</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link
              href="/register"
              className="px-4 py-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Crear cuenta
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/#features"
              className="px-4 py-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Características
            </Link>
            <Link
              href="/#pricing"
              className="px-4 py-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Precios
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
