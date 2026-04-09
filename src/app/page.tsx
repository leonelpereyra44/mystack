import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Calendar,
  Clock,
  Users,
  TrendingUp,
  CheckCircle2,
  Star,
  ArrowRight,
  Sparkles,
  ChevronDown,
} from "lucide-react";

// FAQ Item Component
function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group bg-white rounded-xl border border-slate-200 overflow-hidden">
      <summary className="flex items-center justify-between p-6 cursor-pointer list-none hover:bg-slate-50 transition-colors">
        <span className="font-semibold text-slate-900 text-left pr-4">{question}</span>
        <ChevronDown className="h-5 w-5 text-slate-500 flex-shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <div className="px-6 pb-6 text-slate-600 leading-relaxed">
        {answer}
      </div>
    </details>
  );
}

// JSON-LD Structured Data - SoftwareApplication
const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "MyStack",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description: "Plataforma de gestión de turnos y reservas online para negocios en Argentina. Agenda citas 24/7, notificaciones automáticas y panel de administración.",
  url: "https://mystack.com.ar",
  author: {
    "@type": "Organization",
    name: "MyStack",
    url: "https://mystack.com.ar",
  },
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "ARS",
    description: "Plan gratuito disponible",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    ratingCount: "200",
  },
  featureList: [
    "Reservas online 24/7",
    "Gestión de personal",
    "Notificaciones automáticas",
    "Panel de administración",
    "Página personalizada de reservas",
  ],
};

// JSON-LD FAQPage
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "¿Necesito conocimientos técnicos para usar MyStack?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No, MyStack está diseñado para ser súper simple. Te registrás, configurás tus servicios y horarios, y ya podés compartir tu link de reservas con tus clientes. Todo en menos de 5 minutos.",
      },
    },
    {
      "@type": "Question",
      name: "¿Cómo reciben los clientes la confirmación de su turno?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Automáticamente enviamos un email de confirmación al cliente con todos los detalles: fecha, hora, servicio y la opción de agregar el turno a su Google Calendar.",
      },
    },
    {
      "@type": "Question",
      name: "¿Puedo usar MyStack desde el celular?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "¡Sí! MyStack es 100% responsive. Tanto vos como tus clientes pueden usarlo desde cualquier dispositivo: celular, tablet o computadora.",
      },
    },
    {
      "@type": "Question",
      name: "¿Qué pasa si supero las 150 reservas del plan gratuito?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Cuando te acerques al límite, te avisaremos. Podés actualizar al Plan Profesional en cualquier momento para tener reservas ilimitadas, staff ilimitado y muchas más funciones.",
      },
    },
    {
      "@type": "Question",
      name: "¿Cómo funciona el pago del Plan Profesional?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "El pago es mensual a través de Mercado Pago. Podés pagar con tarjeta de crédito o débito. La suscripción se renueva automáticamente y podés cancelar cuando quieras sin compromisos.",
      },
    },
    {
      "@type": "Question",
      name: "¿Puedo tener varios empleados o profesionales?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "En el plan gratuito podés tener 1 profesional. Con el Plan Profesional, podés agregar todos los profesionales que necesites, cada uno con sus propios horarios y servicios.",
      },
    },
  ],
};

// JSON-LD Organization
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://www.mystack.com.ar/#organization",
  name: "MyStack",
  url: "https://www.mystack.com.ar",
  logo: {
    "@type": "ImageObject",
    url: "https://www.mystack.com.ar/logo-google.png",
    width: 512,
    height: 512,
  },
  image: "https://www.mystack.com.ar/logo-google.png",
  description: "Plataforma de gestión de turnos y reservas online para negocios en Argentina.",
  foundingDate: "2024",
  areaServed: {
    "@type": "Country",
    name: "Argentina",
  },
  contactPoint: {
    "@type": "ContactPoint",
    email: "soporte@mystack.com.ar",
    contactType: "customer service",
    availableLanguage: "Spanish",
  },
  sameAs: [
    // Agregar URLs de redes sociales cuando existan
  ],
};

// JSON-LD WebSite (importante para Google Search)
const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://www.mystack.com.ar/#website",
  name: "MyStack",
  url: "https://www.mystack.com.ar",
  description: "Sistema de reservas y turnos online para negocios en Argentina",
  publisher: {
    "@id": "https://www.mystack.com.ar/#organization",
  },
  potentialAction: {
    "@type": "SearchAction",
    target: "https://www.mystack.com.ar/{business_slug}",
    "query-input": "required name=business_slug",
  },
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/mystacklogosinfondo.png"
                alt="MyStack Logo"
                width={40}
                height={40}
                className="h-9 w-auto"
                priority
              />
              <span className="text-xl font-bold">
                <span className="text-slate-800">my</span>
                <span className="text-[oklch(0.55_0.15_230)]">stack</span>
              </span>
            </Link>
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/login">
                <Button variant="ghost" className="text-slate-600 hover:text-[oklch(0.65_0.14_175)] text-sm px-2 sm:px-4">
                  <span className="hidden sm:inline">Iniciar Sesión</span>
                  <span className="sm:hidden">Ingresar</span>
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-gradient-to-r from-[oklch(0.65_0.14_175)] to-[oklch(0.62_0.18_250)] hover:opacity-90 text-white shadow-lg shadow-[oklch(0.65_0.14_175)]/25 text-sm px-3 sm:px-4">
                  <span className="hidden sm:inline">Comenzar Gratis</span>
                  <span className="sm:hidden">Comenzar</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-[oklch(0.65_0.14_175)]/10 rounded-full blur-3xl" />
          <div className="absolute top-60 -left-40 w-80 h-80 bg-[oklch(0.62_0.18_250)]/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[oklch(0.65_0.14_175)]/10 text-[oklch(0.55_0.14_175)] text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                Sistema de reservas moderno
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-6">
                Gestiona tus citas de forma{" "}
                <span className="bg-gradient-to-r from-[oklch(0.65_0.14_175)] to-[oklch(0.62_0.18_250)] bg-clip-text text-transparent">
                  simple y profesional
                </span>
              </h1>
              <p className="text-lg text-slate-600 mb-8 max-w-xl mx-auto lg:mx-0">
                La plataforma todo-en-uno para negocios de servicios. Agenda online,
                gestión de personal, notificaciones automáticas y mucho más.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/register">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-[oklch(0.65_0.14_175)] to-[oklch(0.62_0.18_250)] hover:opacity-90 text-white shadow-xl shadow-[oklch(0.65_0.14_175)]/30 h-12 px-8 text-base w-full sm:w-auto"
                  >
                    Comenzar Gratis
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-slate-300 text-slate-700 hover:bg-slate-50 h-12 px-8 text-base w-full sm:w-auto"
                  >
                    Ver Características
                  </Button>
                </Link>
              </div>
              {/* Trust indicators */}
              <div className="mt-10 flex items-center gap-6 justify-center lg:justify-start">
                <div className="flex -space-x-2">
                  <Image
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop&crop=face"
                    alt="Usuario"
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full border-2 border-white"
                  />
                  <Image
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face"
                    alt="Usuario"
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full border-2 border-white"
                  />
                  <Image
                    src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face"
                    alt="Usuario"
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full border-2 border-white"
                  />
                  <Image
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
                    alt="Usuario"
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full border-2 border-white"
                  />
                </div>
                <div className="text-sm text-slate-600">
                  <span className="font-semibold text-slate-900">+500</span> negocios confían en nosotros
                </div>
              </div>
            </div>
            {/* Hero Image */}
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-slate-900/20">
                <Image
                  src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop"
                  alt="Dashboard de MyStack"
                  width={800}
                  height={600}
                  className="w-full h-auto"
                  priority
                />
                {/* Overlay cards */}
                <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur rounded-xl p-4 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Nueva reserva confirmada</p>
                      <p className="text-xs text-slate-500">María López - Corte de cabello - 10:00</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 bg-white rounded-xl p-3 shadow-lg border border-slate-100">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <span className="font-semibold text-slate-900">4.9</span>
                  <span className="text-sm text-slate-500">(200+)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Todo lo que necesitas para tu negocio
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Herramientas poderosas diseñadas para simplificar la gestión de tu agenda
              y mejorar la experiencia de tus clientes.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={<Calendar className="w-6 h-6" />}
              title="Reservas Online 24/7"
              description="Tus clientes pueden agendar citas desde cualquier dispositivo, a cualquier hora."
            />
            <FeatureCard
              icon={<Users className="w-6 h-6" />}
              title="Gestión de Personal"
              description="Asigna horarios y servicios específicos a cada miembro de tu equipo."
            />
            <FeatureCard
              icon={<Clock className="w-6 h-6" />}
              title="Recordatorios Automáticos"
              description="Reduce ausencias con notificaciones por email antes de cada cita."
            />
            <FeatureCard
              icon={<TrendingUp className="w-6 h-6" />}
              title="Panel de Control"
              description="Visualiza todas tus citas, servicios y estadísticas en un solo lugar."
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Comienza en 3 simples pasos
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Configura tu cuenta en minutos y empieza a recibir reservas hoy mismo.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              number="1"
              title="Crea tu cuenta"
              description="Regístrate gratis y configura los datos básicos de tu negocio."
              image="https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=300&fit=crop"
            />
            <StepCard
              number="2"
              title="Configura tus servicios"
              description="Agrega los servicios que ofreces con precios y duraciones."
              image="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=300&fit=crop"
            />
            <StepCard
              number="3"
              title="Comparte tu página"
              description="Envía tu enlace personalizado y empieza a recibir reservas."
              image="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&h=300&fit=crop"
            />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-gradient-to-br from-[oklch(0.65_0.14_175)] to-[oklch(0.62_0.18_250)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Lo que dicen nuestros usuarios
            </h2>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              Descubre por qué miles de negocios eligen MyStack para gestionar sus citas.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <TestimonialCard
              quote="MyStack transformó la forma en que gestiono mi salón. Ahora mis clientes reservan solos y yo me enfoco en lo importante."
              author="María García"
              role="Dueña de Salón de Belleza"
              avatar="https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=60&h=60&fit=crop&crop=face"
            />
            <TestimonialCard
              quote="Los recordatorios automáticos redujeron mis cancelaciones en un 70%. Una herramienta indispensable."
              author="Carlos Rodríguez"
              role="Fisioterapeuta"
              avatar="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face"
            />
            <TestimonialCard
              quote="Fácil de usar y con todas las funciones que necesito. El soporte es excelente."
              author="Ana Martínez"
              role="Consultora de Nutrición"
              avatar="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&crop=face"
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Planes simples y transparentes
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Elige el plan que mejor se adapte a tu negocio. Sin costos ocultos.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <PricingCard
              name="Gratuito"
              price="$0"
              period=""
              description="Ideal para empezar"
              features={[
                "1 profesional",
                "Hasta 150 reservas/mes",
                "Página de reservas con tu URL",
                "Notificaciones por email",
                "Calendario de disponibilidad",
                "Soporte por email",
              ]}
              buttonText="Comenzar Gratis"
              buttonVariant="outline"
            />
            <PricingCard
              name="Profesional"
              price="$15.000"
              period="/mes"
              description="Para negocios en crecimiento"
              features={[
                "Staff ilimitado",
                "Reservas ilimitadas",
                "Recordatorios automáticos",
                "Reportes y estadísticas",
                "Sin marca MyStack",
                "Soporte prioritario WhatsApp",
              ]}
              buttonText="Comenzar Prueba"
              buttonVariant="primary"
              popular
            />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Preguntas Frecuentes
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Resolvemos tus dudas más comunes sobre MyStack.
            </p>
          </div>
          <div className="space-y-4">
            <FAQItem
              question="¿Necesito conocimientos técnicos para usar MyStack?"
              answer="No, MyStack está diseñado para ser súper simple. Te registrás, configurás tus servicios y horarios, y ya podés compartir tu link de reservas con tus clientes. Todo en menos de 5 minutos."
            />
            <FAQItem
              question="¿Cómo reciben los clientes la confirmación de su turno?"
              answer="Automáticamente enviamos un email de confirmación al cliente con todos los detalles: fecha, hora, servicio y la opción de agregar el turno a su Google Calendar. También pueden cancelar o reprogramar desde el mismo email."
            />
            <FAQItem
              question="¿Puedo usar MyStack desde el celular?"
              answer="¡Sí! MyStack es 100% responsive. Tanto vos como tus clientes pueden usarlo desde cualquier dispositivo: celular, tablet o computadora."
            />
            <FAQItem
              question="¿Qué pasa si supero las 150 reservas del plan gratuito?"
              answer="Cuando te acerques al límite, te avisaremos. Podés actualizar al Plan Profesional en cualquier momento para tener reservas ilimitadas, staff ilimitado y muchas más funciones."
            />
            <FAQItem
              question="¿Cómo funciona el pago del Plan Profesional?"
              answer="El pago es mensual a través de Mercado Pago. Podés pagar con tarjeta de crédito o débito. La suscripción se renueva automáticamente y podés cancelar cuando quieras sin compromisos."
            />
            <FAQItem
              question="¿Puedo tener varios empleados o profesionales?"
              answer="En el plan gratuito podés tener 1 profesional. Con el Plan Profesional, podés agregar todos los profesionales que necesites, cada uno con sus propios horarios y servicios."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            ¿Listo para transformar tu negocio?
          </h2>
          <p className="text-lg text-slate-400 mb-8 max-w-2xl mx-auto">
            Únete a cientos de negocios que ya optimizaron su gestión de citas con MyStack.
            Comienza gratis hoy mismo.
          </p>
          <Link href="/register">
            <Button
              size="lg"
              className="bg-gradient-to-r from-[oklch(0.65_0.14_175)] to-[oklch(0.62_0.18_250)] hover:opacity-90 text-white h-14 px-10 text-lg shadow-xl shadow-[oklch(0.65_0.14_175)]/30"
            >
              Crear Mi Cuenta Gratis
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <Link href="/" className="flex items-center gap-2 mb-4">
                <Image
                  src="/mystacklogosinfondo.png"
                  alt="MyStack Logo"
                  width={40}
                  height={40}
                  className="h-9 w-auto"
                />
                <span className="text-xl font-bold">
                  <span className="text-slate-800">my</span>
                  <span className="text-[oklch(0.55_0.15_230)]">stack</span>
                </span>
              </Link>
              <p className="text-sm text-slate-600">
                La plataforma de reservas más simple para tu negocio.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Producto</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><Link href="#features" className="hover:text-[oklch(0.65_0.14_175)]">Características</Link></li>
                <li><Link href="#pricing" className="hover:text-[oklch(0.65_0.14_175)]">Precios</Link></li>
                <li><Link href="#faq" className="hover:text-[oklch(0.65_0.14_175)]">Preguntas Frecuentes</Link></li>
                <li><Link href="/register" className="hover:text-[oklch(0.65_0.14_175)]">Registro</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><Link href="/legal/terminos" className="hover:text-[oklch(0.65_0.14_175)]">Términos y Condiciones</Link></li>
                <li><Link href="/legal/privacidad" className="hover:text-[oklch(0.65_0.14_175)]">Política de Privacidad</Link></li>
                <li><Link href="/legal/cookies" className="hover:text-[oklch(0.65_0.14_175)]">Política de Cookies</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Contacto</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>soporte@mystack.com</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-slate-200 text-center text-sm text-slate-500">
            © {new Date().getFullYear()} MyStack. Todos los derechos reservados.
          </div>
        </div>
      </footer>
      </div>
    </>
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
    <Card className="border-0 shadow-lg shadow-slate-900/5 hover:shadow-xl transition-shadow duration-300">
      <CardContent className="p-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[oklch(0.65_0.14_175)] to-[oklch(0.62_0.18_250)] flex items-center justify-center text-white mb-4">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
        <p className="text-slate-600 text-sm">{description}</p>
      </CardContent>
    </Card>
  );
}

function StepCard({
  number,
  title,
  description,
  image,
}: {
  number: string;
  title: string;
  description: string;
  image: string;
}) {
  return (
    <div className="text-center">
      <div className="relative mb-6 rounded-2xl overflow-hidden shadow-lg">
        <Image
          src={image}
          alt={title}
          width={400}
          height={300}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-4 left-4 w-10 h-10 rounded-full bg-gradient-to-br from-[oklch(0.65_0.14_175)] to-[oklch(0.62_0.18_250)] flex items-center justify-center text-white font-bold">
          {number}
        </div>
      </div>
      <h3 className="text-xl font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600">{description}</p>
    </div>
  );
}

function TestimonialCard({
  quote,
  author,
  role,
  avatar,
}: {
  quote: string;
  author: string;
  role: string;
  avatar: string;
}) {
  return (
    <Card className="border-0 bg-white/10 backdrop-blur">
      <CardContent className="p-6">
        <div className="flex gap-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          ))}
        </div>
        <p className="text-white mb-6">&ldquo;{quote}&rdquo;</p>
        <div className="flex items-center gap-3">
          <Image
            src={avatar}
            alt={author}
            width={48}
            height={48}
            className="w-12 h-12 rounded-full"
          />
          <div>
            <p className="font-semibold text-white">{author}</p>
            <p className="text-sm text-white/70">{role}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PricingCard({
  name,
  price,
  period = "/mes",
  description,
  features,
  buttonText,
  buttonVariant,
  popular,
}: {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  buttonText: string;
  buttonVariant: "primary" | "outline";
  popular?: boolean;
}) {
  return (
    <Card className={`relative overflow-visible border-2 ${popular ? "border-[oklch(0.65_0.14_175)] shadow-xl shadow-[oklch(0.65_0.14_175)]/20" : "border-slate-200"}`}>
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-[oklch(0.65_0.14_175)] to-[oklch(0.62_0.18_250)] text-white text-sm font-medium rounded-full whitespace-nowrap">
          Más Popular
        </div>
      )}
      <CardContent className="p-6 pt-8">
        <h3 className="text-xl font-semibold text-slate-900 mb-1">{name}</h3>
        <p className="text-sm text-slate-500 mb-4">{description}</p>
        <div className="mb-6">
          <span className="text-4xl font-bold text-slate-900">{price}</span>
          {period && <span className="text-slate-500">{period}</span>}
        </div>
        <ul className="space-y-3 mb-8">
          {features.map((feature, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
              <CheckCircle2 className="w-4 h-4 text-[oklch(0.65_0.14_175)]" />
              {feature}
            </li>
          ))}
        </ul>
        <Link href="/register" className="block">
          <Button
            className={`w-full ${
              buttonVariant === "primary"
                ? "bg-gradient-to-r from-[oklch(0.65_0.14_175)] to-[oklch(0.62_0.18_250)] hover:opacity-90 text-white"
                : "border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
            variant={buttonVariant === "primary" ? "default" : "outline"}
          >
            {buttonText}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
