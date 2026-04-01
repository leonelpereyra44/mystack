import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users, Zap, Check, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image 
              src="/mystacklogosinfondo.png" 
              alt="MyStack Logo" 
              width={40} 
              height={40}
              className="h-10 w-auto"
            />
            <span className="text-2xl font-bold">MyStack</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Iniciar Sesión</Button>
            </Link>
            <Link href="/register">
              <Button>Comenzar Gratis</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
          Gestiona tus turnos
          <span className="text-primary"> de forma simple</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-xl text-muted-foreground">
          La plataforma más fácil para que tus clientes reserven citas online.
          Sin llamadas, sin WhatsApp, disponible 24/7.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/register">
            <Button size="lg" className="gap-2">
              Crear mi página gratis <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="#demo">
            <Button size="lg" variant="outline">
              Ver demo
            </Button>
          </Link>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          ✓ Sin tarjeta de crédito &nbsp; ✓ Setup en 5 minutos &nbsp; ✓ Gratis para siempre
        </p>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-center text-3xl font-bold">
          Todo lo que necesitas para gestionar tu negocio
        </h2>
        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            icon={<Calendar className="h-10 w-10" />}
            title="Reservas Online"
            description="Tus clientes reservan desde tu página personalizada, disponible 24/7."
          />
          <FeatureCard
            icon={<Clock className="h-10 w-10" />}
            title="Horarios Flexibles"
            description="Configura horarios, duración de servicios y disponibilidad de tu equipo."
          />
          <FeatureCard
            icon={<Users className="h-10 w-10" />}
            title="Gestión de Clientes"
            description="Historial de citas, recordatorios automáticos y comunicación directa."
          />
          <FeatureCard
            icon={<Zap className="h-10 w-10" />}
            title="Notificaciones"
            description="Emails y recordatorios automáticos para reducir cancelaciones."
          />
        </div>
      </section>

      {/* Pricing */}
      <section className="container mx-auto px-4 py-20" id="pricing">
        <h2 className="text-center text-3xl font-bold">Planes simples y transparentes</h2>
        <p className="mt-4 text-center text-muted-foreground">
          Empieza gratis, escala cuando crezcas
        </p>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          <PricingCard
            name="Gratis"
            price="$0"
            description="Para empezar"
            features={[
              "1 servicio",
              "Hasta 50 turnos/mes",
              "Página de reservas",
              "Notificaciones email",
            ]}
          />
          <PricingCard
            name="Básico"
            price="$9.99"
            description="Para negocios pequeños"
            features={[
              "Servicios ilimitados",
              "Turnos ilimitados",
              "Múltiples empleados",
              "Recordatorios SMS",
              "Sin marca MyStack",
            ]}
            highlighted
          />
          <PricingCard
            name="Pro"
            price="$24.99"
            description="Para negocios en crecimiento"
            features={[
              "Todo de Básico",
              "Dominio personalizado",
              "API access",
              "Integraciones",
              "Soporte prioritario",
            ]}
          />
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <div className="rounded-2xl bg-primary px-8 py-16 text-center text-primary-foreground">
          <h2 className="text-3xl font-bold">¿Listo para simplificar tu agenda?</h2>
          <p className="mt-4 text-lg opacity-90">
            Únete a miles de negocios que ya usan MyStack
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="mt-8">
              Comenzar ahora - Es gratis
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <Image 
                src="/mystacklogosinfondo.png" 
                alt="MyStack Logo" 
                width={24} 
                height={24}
                className="h-6 w-auto"
              />
              <span className="font-bold">MyStack</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} MyStack. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
      <div className="text-primary">{icon}</div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function PricingCard({
  name,
  price,
  description,
  features,
  highlighted,
}: {
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-8 ${
        highlighted
          ? "border-primary bg-primary/5 ring-2 ring-primary"
          : "bg-card"
      }`}
    >
      <h3 className="text-xl font-bold">{name}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
      <div className="mt-4">
        <span className="text-4xl font-bold">{price}</span>
        <span className="text-muted-foreground">/mes</span>
      </div>
      <ul className="mt-6 space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex items-center gap-2">
            <Check className="h-4 w-4 text-primary" />
            <span className="text-sm">{feature}</span>
          </li>
        ))}
      </ul>
      <Link href="/register">
        <Button
          className="mt-8 w-full"
          variant={highlighted ? "default" : "outline"}
        >
          Comenzar
        </Button>
      </Link>
    </div>
  );
}
