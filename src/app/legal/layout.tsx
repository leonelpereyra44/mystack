import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, FileText, Shield, Cookie } from "lucide-react";

const legalPages = [
  {
    href: "/legal/terminos",
    label: "Términos y Condiciones",
    icon: FileText,
  },
  {
    href: "/legal/privacidad",
    label: "Política de Privacidad",
    icon: Shield,
  },
  {
    href: "/legal/cookies",
    label: "Política de Cookies",
    icon: Cookie,
  },
];

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header fijo */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image 
              src="/mystacklogosinfondo.png" 
              alt="MyStack Logo" 
              width={32} 
              height={32}
              className="h-8 w-auto"
            />
            <span className="text-xl font-bold">MyStack</span>
          </Link>
          <Link 
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Volver al inicio</span>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar de navegación */}
          <aside className="lg:w-64 shrink-0">
            <div className="lg:sticky lg:top-24">
              <h2 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">
                Documentos Legales
              </h2>
              <nav className="space-y-1">
                {legalPages.map((page) => (
                  <Link
                    key={page.href}
                    href={page.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <page.icon className="h-4 w-4" />
                    {page.label}
                  </Link>
                ))}
              </nav>

              <div className="mt-8 p-4 rounded-lg bg-muted/50 border">
                <h3 className="font-medium text-sm mb-2">¿Necesitas ayuda?</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Si tienes dudas sobre nuestras políticas, contáctanos.
                </p>
                <a 
                  href="mailto:soporte@mystack.com"
                  className="text-xs text-primary hover:underline"
                >
                  soporte@mystack.com
                </a>
              </div>
            </div>
          </aside>

          {/* Contenido principal */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© 2026 MyStack. Todos los derechos reservados.</p>
            <div className="flex items-center gap-4">
              {legalPages.map((page) => (
                <Link
                  key={page.href}
                  href={page.href}
                  className="hover:text-foreground transition-colors"
                >
                  {page.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
