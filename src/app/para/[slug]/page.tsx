import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { LottiePlayer } from "@/components/ui/lottie-player";
import { RUBRO_PAGES, RUBRO_SLUGS } from "@/lib/rubro-seo-data";

/* ─────────────────────────────────────────────
   Static generation
───────────────────────────────────────────── */
export async function generateStaticParams() {
  return RUBRO_SLUGS.map((slug) => ({ slug }));
}

/* ─────────────────────────────────────────────
   Per-page metadata (SEO)
───────────────────────────────────────────── */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const rubro = RUBRO_PAGES[slug];
  if (!rubro) return {};

  const canonicalUrl = `https://mystack.com.ar/para/${slug}`;

  return {
    title: rubro.metaTitle,
    description: rubro.metaDescription,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: rubro.metaTitle,
      description: rubro.metaDescription,
      url: canonicalUrl,
      siteName: "MyStack",
      locale: "es_AR",
      type: "website",
      images: [
        {
          url: `https://images.unsplash.com/photo-${rubro.unsplashId}?auto=format&fit=crop&w=1200&q=80`,
          width: 1200,
          height: 630,
          alt: rubro.unsplashAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: rubro.metaTitle,
      description: rubro.metaDescription,
    },
  };
}

/* ─────────────────────────────────────────────
   Page component
───────────────────────────────────────────── */
export default async function RubroPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const rubro = RUBRO_PAGES[slug];
  if (!rubro) notFound();

  /* JSON-LD */
  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `https://mystack.com.ar/para/${slug}`,
    name: rubro.metaTitle,
    description: rubro.metaDescription,
    url: `https://mystack.com.ar/para/${slug}`,
    isPartOf: { "@id": "https://mystack.com.ar/#website" },
    about: {
      "@type": "SoftwareApplication",
      name: "MyStack",
      applicationCategory: "BusinessApplication",
    },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: rubro.faq.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        {/* ── Nav ────────────────────────────────── */}
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
                  <Button
                    variant="ghost"
                    className="text-slate-600 hover:text-[oklch(0.65_0.14_175)] text-sm px-2 sm:px-4"
                  >
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

        {/* ── Breadcrumb ─────────────────────────── */}
        <div className="pt-20 pb-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-slate-500">
              <Link href="/" className="hover:text-slate-700 transition-colors">
                Inicio
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-slate-400">Para tu negocio</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-slate-700 font-medium">{rubro.breadcrumbLabel}</span>
            </nav>
          </div>
        </div>

        {/* ── Hero ───────────────────────────────── */}
        <section className="relative pt-6 pb-20 overflow-hidden">
          {/* Background blobs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-[oklch(0.65_0.14_175)]/8 rounded-full blur-3xl" />
            <div className="absolute top-60 -left-40 w-80 h-80 bg-[oklch(0.62_0.18_250)]/8 rounded-full blur-3xl" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Text */}
              <div className="text-center lg:text-left">
                <div
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${rubro.accentLight} ${rubro.accentColor} text-sm font-medium mb-6`}
                >
                  <Sparkles className="w-4 h-4" />
                  {rubro.tagline}
                </div>

                <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight mb-6">
                  {rubro.h1}
                </h1>

                <p className="text-lg text-slate-600 mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0">
                  {rubro.intro}
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link href="/register">
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-[oklch(0.65_0.14_175)] to-[oklch(0.62_0.18_250)] hover:opacity-90 text-white shadow-lg shadow-[oklch(0.65_0.14_175)]/25 px-8 w-full sm:w-auto"
                    >
                      {rubro.ctaText}
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                  <Link href="/#pricing">
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-slate-200 text-slate-700 hover:border-slate-300 w-full sm:w-auto"
                    >
                      Ver precios
                    </Button>
                  </Link>
                </div>

                {/* Trust signals */}
                <div className="flex items-center gap-6 mt-8 justify-center lg:justify-start text-sm text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Gratis para empezar
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Sin tarjeta requerida
                  </div>
                </div>
              </div>

              {/* Image */}
              <div className="relative">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-100">
                  <Image
                    src={`https://images.unsplash.com/photo-${rubro.unsplashId}?auto=format&fit=crop&w=900&q=80`}
                    alt={rubro.unsplashAlt}
                    width={900}
                    height={600}
                    className="w-full h-[320px] sm:h-[400px] object-cover"
                    priority
                  />
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 to-transparent" />
                </div>
                {/* Floating badge */}
                <div className="absolute -bottom-4 -left-4 bg-white rounded-xl p-3 shadow-lg border border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 ${rubro.accentBg} rounded-lg flex items-center justify-center`}>
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900">Agenda digital</p>
                      <p className="text-xs text-slate-500">Reservas 24/7</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats bar ──────────────────────────── */}
        <section className="py-12 bg-gradient-to-r from-slate-900 to-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
              {[
                { value: "-70%", label: "Menos cancelaciones" },
                { value: "5 min", label: "Para configurar" },
                { value: "100%", label: "Gratis para empezar" },
                { value: "24/7", label: "Disponibilidad de agenda" },
              ].map(({ value, label }) => (
                <div key={label}>
                  <div className="text-3xl sm:text-4xl font-bold text-white mb-1">{value}</div>
                  <div className="text-slate-400 text-sm">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ───────────────────────────── */}
        <section className="py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                Todo lo que necesita tu negocio
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Herramientas pensadas para simplificar tu gestión y darle a tus clientes
                la mejor experiencia de reserva.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {rubro.features.map(({ title, description, Icon }) => (
                <div
                  key={title}
                  className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div
                    className={`w-12 h-12 ${rubro.accentBg} rounded-xl flex items-center justify-center mb-4 shadow-sm`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ───────────────────────── */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                Comienza en 3 simples pasos
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Configurá tu cuenta en minutos y empezá a recibir reservas hoy mismo.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  number: "1",
                  title: "Crea tu cuenta",
                  description: "Regístrate gratis y configurá los datos básicos de tu negocio.",
                  animationSrc: "/animations/step1.json",
                },
                {
                  number: "2",
                  title: "Configura tus servicios",
                  description: "Agregá los servicios que ofrecés con precios y duraciones.",
                  animationSrc: "/animations/step3.json",
                },
                {
                  number: "3",
                  title: "Comparte tu página",
                  description: "Enviá tu enlace personalizado y empezá a recibir reservas.",
                  animationSrc: "/animations/step2.json",
                },
              ].map(({ number, title, description, animationSrc }) => (
                <div key={number} className="text-center">
                  <div className="relative mb-6 rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-slate-50 to-slate-100">
                    <LottiePlayer src={animationSrc} className="w-full h-48" />
                    <div className="absolute top-4 left-4 w-10 h-10 rounded-full bg-gradient-to-br from-[oklch(0.65_0.14_175)] to-[oklch(0.62_0.18_250)] flex items-center justify-center text-white font-bold">
                      {number}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">{title}</h3>
                  <p className="text-slate-600">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ────────────────────────────────── */}
        <section className="py-20 bg-slate-50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 mb-3">
                Preguntas frecuentes
              </h2>
              <p className="text-slate-600">
                Todo lo que necesitás saber antes de empezar.
              </p>
            </div>

            <div className="space-y-3">
              {rubro.faq.map(({ q, a }) => (
                <details
                  key={q}
                  className="group bg-white rounded-xl border border-slate-200 overflow-hidden"
                >
                  <summary className="flex items-center justify-between p-6 cursor-pointer list-none hover:bg-slate-50 transition-colors">
                    <span className="font-semibold text-slate-900 text-left pr-4">{q}</span>
                    <ChevronDown className="h-5 w-5 text-slate-500 flex-shrink-0 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="px-6 pb-6 text-slate-600 leading-relaxed">{a}</div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA Banner ─────────────────────────── */}
        <section className="py-20 bg-gradient-to-r from-[oklch(0.65_0.14_175)] to-[oklch(0.62_0.18_250)]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              ¿Listo para digitalizar tu negocio?
            </h2>
            <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
              Más de 200 negocios ya usan MyStack. Empezá gratis hoy, sin tarjeta de crédito.
            </p>
            <Link href="/register">
              <Button
                size="lg"
                className="bg-white text-[oklch(0.55_0.14_175)] hover:bg-slate-100 font-semibold px-8 shadow-xl"
              >
                {rubro.ctaText}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </section>

        {/* ── Footer ─────────────────────────────── */}
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
                  <li><Link href="/#features" className="hover:text-[oklch(0.65_0.14_175)]">Características</Link></li>
                  <li><Link href="/#pricing" className="hover:text-[oklch(0.65_0.14_175)]">Precios</Link></li>
                  <li><Link href="/#faq" className="hover:text-[oklch(0.65_0.14_175)]">Preguntas Frecuentes</Link></li>
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
                  <li><a href="mailto:contacto@mystack.com.ar" className="hover:text-[oklch(0.65_0.14_175)]">Contacto</a></li>
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
