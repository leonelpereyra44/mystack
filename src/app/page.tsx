import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { LottiePlayer } from "@/components/ui/lottie-player";
import { Card, CardContent } from "@/components/ui/card";
import { PricingSection } from "@/components/landing/pricing-section";
import { AnnouncementBanner } from "@/components/landing/announcement-banner";
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
  Scissors,
  Heart,
  Trophy,
  GraduationCap,
  Briefcase,
  Camera,
  Music,
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
        {/* Announcement Banner */}
        <AnnouncementBanner />

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

      {/* Business Types Section */}
      <section className="py-16 bg-white border-b border-slate-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Perfecto para tu tipo de negocio
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Peluquerías, barberías, estudios de fotografía, canchas deportivas y más.
            </p>
          </div>
        </div>
          
        {/* Marquee Animation - 4 copies so content always fills screen */}
        <div className="relative overflow-hidden">
          <div className="animate-marquee">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-4 pr-4">
                <BusinessTypeChip icon={<Scissors className="w-5 h-5" />} name="Barberías" color="bg-amber-500" />
                <BusinessTypeChip icon={<Sparkles className="w-5 h-5" />} name="Peluquerías" color="bg-pink-500" />
                <BusinessTypeChip icon={<Heart className="w-5 h-5" />} name="Spa & Estética" color="bg-rose-400" />
                <BusinessTypeChip icon={<Trophy className="w-5 h-5" />} name="Canchas" color="bg-green-600" />
                <BusinessTypeChip icon={<GraduationCap className="w-5 h-5" />} name="Educación" color="bg-indigo-500" />
                <BusinessTypeChip icon={<Briefcase className="w-5 h-5" />} name="Consultoría" color="bg-cyan-600" />
                <BusinessTypeChip icon={<Camera className="w-5 h-5" />} name="Fotografía" color="bg-purple-500" />
                <BusinessTypeChip icon={<Music className="w-5 h-5" />} name="Música" color="bg-violet-500" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-gradient-to-r from-slate-900 to-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl sm:text-5xl font-bold text-white mb-2">-70%</div>
              <div className="text-slate-400">Menos cancelaciones</div>
            </div>
            <div>
              <div className="text-4xl sm:text-5xl font-bold text-white mb-2">5 min</div>
              <div className="text-slate-400">Para configurar</div>
            </div>
            <div>
              <div className="text-4xl sm:text-5xl font-bold text-white mb-2">100%</div>
              <div className="text-slate-400">Gratis para empezar</div>
            </div>
            <div>
              <div className="text-4xl sm:text-5xl font-bold text-white mb-2">24/7</div>
              <div className="text-slate-400">Disponibilidad</div>
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
              animationSrc="/animations/step1.json"
            />
            <StepCard
              number="2"
              title="Configura tus servicios"
              description="Agrega los servicios que ofreces con precios y duraciones."
              animationSrc="/animations/step3.json"
            />
            <StepCard
              number="3"
              title="Comparte tu página"
              description="Envía tu enlace personalizado y empieza a recibir reservas."
              animationSrc="/animations/step2.json"
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

      {/* Pricing Section - Dynamic from DB */}
      <PricingSection />

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
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-8">
            <div className="sm:col-span-2 lg:col-span-1">
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
              <h4 className="font-semibold text-slate-900 mb-4">Para tu negocio</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><Link href="/para/barberias" className="hover:text-[oklch(0.65_0.14_175)]">Barberías</Link></li>
                <li><Link href="/para/peluquerias" className="hover:text-[oklch(0.65_0.14_175)]">Peluquerías</Link></li>
                <li><Link href="/para/spa-estetica" className="hover:text-[oklch(0.65_0.14_175)]">Spa & Estética</Link></li>
                <li><Link href="/para/canchas-deportes" className="hover:text-[oklch(0.65_0.14_175)]">Canchas & Deportes</Link></li>
                <li><Link href="/para/educacion-clases" className="hover:text-[oklch(0.65_0.14_175)]">Educación & Clases</Link></li>
                <li><Link href="/para/fotografia" className="hover:text-[oklch(0.65_0.14_175)]">Fotografía</Link></li>
                <li><Link href="/para/musica" className="hover:text-[oklch(0.65_0.14_175)]">Música & Estudios</Link></li>
                <li><Link href="/para/consultoria" className="hover:text-[oklch(0.65_0.14_175)]">Consultoría</Link></li>
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
                <li>
                  <a href="mailto:contacto@mystack.com.ar" className="hover:text-[oklch(0.65_0.14_175)]">
                    contacto@mystack.com.ar
                  </a>
                </li>
                <li>
                  <Link href="/contacto" className="hover:text-[oklch(0.65_0.14_175)]">
                    Formulario de Contacto
                  </Link>
                </li>
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
  animationSrc,
}: {
  number: string;
  title: string;
  description: string;
  image?: string;
  animationSrc?: string;
}) {
  return (
    <div className="text-center">
      <div className="relative mb-6 rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-slate-50 to-slate-100">
        {animationSrc ? (
          <LottiePlayer src={animationSrc} className="w-full h-48" />
        ) : image ? (
          <Image
            src={image}
            alt={title}
            width={400}
            height={300}
            className="w-full h-48 object-cover"
          />
        ) : null}
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

function BusinessTypeChip({
  icon,
  name,
  color,
}: {
  icon: React.ReactNode;
  name: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-3 bg-white rounded-full border border-slate-200 shadow-sm whitespace-nowrap hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-white flex-shrink-0`}>
        {icon}
      </div>
      <span className="font-medium text-slate-800">{name}</span>
    </div>
  );
}
