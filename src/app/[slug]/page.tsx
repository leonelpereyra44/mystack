import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { BookingForm } from "@/components/booking/booking-form";
import { getBusinessType, getBusinessTerminology } from "@/lib/business-types";
import { MapPin, Phone, Clock, Users, Instagram, Facebook, Twitter, Globe } from "lucide-react";
import type { Metadata } from "next";

interface BusinessPageProps {
  params: Promise<{ slug: string }>;
}

const siteUrl = process.env.NEXTAUTH_URL || "https://mystack.com.ar";

const DAYS_OF_WEEK = [
  "Domingo",
  "Lunes", 
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export async function generateMetadata({ params }: BusinessPageProps): Promise<Metadata> {
  const { slug } = await params;
  const business = await prisma.business.findUnique({
    where: { slug },
    include: {
      subscription: true,
    },
  });

  if (!business) {
    return { title: "Negocio no encontrado" };
  }

  const isPro = business.subscription?.plan === "PRO" && business.subscription?.status === "ACTIVE";
  const title = `${business.name} - Reserva tu turno`;
  const description = business.description || `Reserva tu turno en ${business.name}. Sistema de reservas online 24/7.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteUrl}/${slug}`,
      // White-label: No mostrar siteName para usuarios PRO
      ...(isPro ? {} : { siteName: "MyStack" }),
      locale: "es_AR",
      type: "website",
      images: business.logo ? [
        {
          url: business.logo,
          width: 400,
          height: 400,
          alt: business.name,
        },
      ] : undefined,
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: business.logo ? [business.logo] : undefined,
    },
  };
}

export default async function BusinessPage({ params }: BusinessPageProps) {
  const { slug } = await params;
  
  const business = await prisma.business.findUnique({
    where: { slug, isActive: true },
    include: {
      services: {
        where: { isActive: true },
        orderBy: { name: "asc" },
      },
      staff: {
        where: { isActive: true },
        orderBy: { name: "asc" },
      },
      schedules: {
        orderBy: { dayOfWeek: "asc" },
      },
      subscription: true,
    },
  });

  if (!business) {
    notFound();
  }

  // White-label: Determinar si es PRO para ocultar branding
  const isPro = business.subscription?.plan === "PRO" && business.subscription?.status === "ACTIVE";

  // Convertir Decimal a number para evitar error de serialización
  const services = business.services.map((service) => ({
    ...service,
    price: Number(service.price),
  }));

  // Obtener el tipo de negocio y su icono
  const businessTypeConfig = getBusinessType(business.businessType);
  const terminology = getBusinessTerminology(business.businessType);
  const BusinessIcon = businessTypeConfig.icon;

  // Agrupar horarios por día para mostrar (solo días abiertos)
  const schedulesByDay = business.schedules.reduce((acc, schedule) => {
    if (!acc[schedule.dayOfWeek]) {
      acc[schedule.dayOfWeek] = [];
    }
    acc[schedule.dayOfWeek].push(schedule);
    return acc;
  }, {} as Record<number, typeof business.schedules>);

  // Generar JSON-LD LocalBusiness (solo días abiertos)
  const openSchedules = business.schedules.filter(s => s.isOpen);
  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: business.name,
    description: business.description || `Reserva tu turno en ${business.name}`,
    url: `${siteUrl}/${business.slug}`,
    image: business.logo || undefined,
    address: business.address ? {
      "@type": "PostalAddress",
      streetAddress: business.address,
      addressCountry: "AR",
    } : undefined,
    telephone: business.phone || undefined,
    openingHoursSpecification: openSchedules.map((schedule) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][schedule.dayOfWeek],
      opens: schedule.openTime,
      closes: schedule.closeTime,
    })),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Servicios",
      itemListElement: services.map((service) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: service.name,
          description: service.description || undefined,
        },
        price: service.price,
        priceCurrency: "ARS",
      })),
    },
  };



  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />
      <div className="min-h-screen bg-slate-50">
        {/* Hero Header */}
        <header className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>
          
          {/* Accent color bar */}
          <div className={`absolute top-0 left-0 right-0 h-1 ${businessTypeConfig.color}`} />
          
          <div className="relative container mx-auto px-4 py-8 sm:py-12">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Logo/Avatar */}
              <div className="relative">
                {business.logo ? (
                  <div className="relative">
                    <Image
                      src={business.logo}
                      alt={business.name}
                      width={120}
                      height={120}
                      className="h-28 w-28 sm:h-32 sm:w-32 rounded-2xl object-cover border-4 border-white/20 shadow-2xl"
                    />
                    <div className={`absolute -bottom-2 -right-2 ${businessTypeConfig.color} p-2 rounded-xl shadow-lg`}>
                      <BusinessIcon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className={`flex h-28 w-28 sm:h-32 sm:w-32 items-center justify-center rounded-2xl ${businessTypeConfig.color} shadow-2xl border-4 border-white/20`}>
                    <BusinessIcon className="h-14 w-14 text-white" />
                  </div>
                )}
              </div>
              
              {/* Business Info */}
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                  <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{business.name}</h1>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${businessTypeConfig.color} text-white self-center sm:self-auto`}>
                    <BusinessIcon className="h-3 w-3" />
                    {businessTypeConfig.label}
                  </span>
                </div>
                
                {business.description && (
                  <p className="text-slate-300 mt-2 max-w-xl text-sm sm:text-base leading-relaxed">
                    {business.description}
                  </p>
                )}
                
                {/* Quick Info Pills */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-4">
                  {business.address && (
                    <a 
                      href={`https://maps.google.com/?q=${encodeURIComponent(business.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-sm text-slate-200 transition-colors"
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="truncate max-w-[200px]">{business.address}</span>
                    </a>
                  )}
                  {business.phone && (
                    <a 
                      href={`tel:${business.phone}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-sm text-slate-200 transition-colors"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      {business.phone}
                    </a>
                  )}
                </div>
                
                {/* Social Links */}
                {(business.instagram || business.facebook || business.twitter || business.tiktok || business.website) && (
                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-4">
                    {business.instagram && (
                      <a
                        href={`https://instagram.com/${business.instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Instagram: ${business.instagram}`}
                        className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 text-white transition-all hover:scale-110"
                      >
                        <Instagram className="h-4 w-4" />
                      </a>
                    )}
                    {business.facebook && (
                      <a
                        href={`https://facebook.com/${business.facebook}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Facebook: ${business.facebook}`}
                        className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-[#1877F2] text-white transition-all hover:scale-110"
                      >
                        <Facebook className="h-4 w-4" />
                      </a>
                    )}
                    {business.twitter && (
                      <a
                        href={`https://twitter.com/${business.twitter.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`X/Twitter: ${business.twitter}`}
                        className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-black text-white transition-all hover:scale-110"
                      >
                        <Twitter className="h-4 w-4" />
                      </a>
                    )}
                    {business.tiktok && (
                      <a
                        href={`https://tiktok.com/@${business.tiktok.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`TikTok: ${business.tiktok}`}
                        className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-black text-white transition-all hover:scale-110"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                        </svg>
                      </a>
                    )}
                    {business.website && (
                      <a
                        href={business.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Sitio web: ${business.website}`}
                        className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-primary text-white transition-all hover:scale-110"
                      >
                        <Globe className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-6 sm:py-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
              
              {/* Sidebar - Info Cards */}
              <aside className="lg:col-span-1 space-y-4 order-2 lg:order-1">
                {/* Horarios Card */}
                {business.schedules.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Clock className="h-4 w-4 text-primary" />
                        </div>
                        <h3 className="font-semibold text-slate-900">Horarios de atención</h3>
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="space-y-2.5">
                        {Object.entries(schedulesByDay).map(([day, schedules]) => {
                          const isOpen = schedules.some(s => s.isOpen);
                          const isToday = new Date().getDay() === parseInt(day);
                          return (
                            <div 
                              key={day} 
                              className={`flex justify-between items-center py-1.5 ${isToday ? 'bg-primary/5 -mx-2 px-2 rounded-lg' : ''}`}
                            >
                              <span className={`text-sm ${isToday ? 'font-medium text-primary' : 'text-slate-600'}`}>
                                {DAYS_OF_WEEK[parseInt(day)]}
                                {isToday && <span className="ml-1.5 text-xs text-primary/70">(Hoy)</span>}
                              </span>
                              <span className={`text-sm font-medium ${!isOpen ? "text-slate-400" : isToday ? "text-primary" : "text-slate-900"}`}>
                                {isOpen 
                                  ? schedules.filter(s => s.isOpen).map(s => `${s.openTime} - ${s.closeTime}`).join(", ")
                                  : "Cerrado"
                                }
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Equipo Card */}
                {business.staff.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <h3 className="font-semibold text-slate-900">Nuestro equipo</h3>
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="space-y-3">
                        {business.staff.map((member, index) => (
                          <div key={member.id} className="flex items-center gap-3">
                            <div 
                              className="h-10 w-10 rounded-full flex items-center justify-center text-white font-medium text-sm shadow-sm"
                              style={{
                                background: `linear-gradient(135deg, ${
                                  ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'][index % 5]
                                }, ${
                                  ['#1D4ED8', '#6D28D9', '#BE185D', '#D97706', '#059669'][index % 5]
                                })`
                              }}
                            >
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-slate-700">{member.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Servicios Preview (Mobile visible, Desktop hidden si hay sidebar) */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden lg:block">
                  <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <h3 className="font-semibold text-slate-900">{terminology.services}</h3>
                      </div>
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {services.length} disponibles
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="space-y-2">
                      {services.slice(0, 4).map((service) => (
                        <div 
                          key={service.id} 
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">{service.name}</p>
                            <p className="text-xs text-slate-500">{service.duration} min</p>
                          </div>
                          <span className="text-sm font-semibold text-primary ml-3">
                            ${service.price.toLocaleString("es-AR")}
                          </span>
                        </div>
                      ))}
                      {services.length > 4 && (
                        <p className="text-xs text-center text-slate-500 pt-2">
                          +{services.length - 4} {terminology.services.toLowerCase()} más
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </aside>

              {/* Main - Booking Form */}
              <div className="lg:col-span-2 order-1 lg:order-2">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-100 bg-gradient-to-r from-primary/5 to-transparent">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                      Reservá tu {terminology.appointment.toLowerCase()}
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                      Selecioná {terminology.service === "Clase" ? "una" : "un"} {terminology.service.toLowerCase()} y elegí el horario que más te convenga
                    </p>
                  </div>
                  
                  <div className="p-5 sm:p-6">
                    {services.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                          <Clock className="h-8 w-8 text-slate-400" />
                        </div>
                        <p className="text-slate-600 font-medium">Este negocio aún no tiene servicios disponibles</p>
                        <p className="text-sm text-slate-400 mt-1">Volvé a intentar más tarde</p>
                      </div>
                    ) : (
                    <BookingForm
                        businessId={business.id}
                        businessSlug={business.slug}
                        services={services}
                        staff={business.staff}
                        schedules={business.schedules}
                        timezone={business.timezone}
                        businessType={business.businessType}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer - White-label: Ocultar branding para usuarios PRO */}
        {!isPro && (
          <footer className="border-t border-slate-200 bg-white py-6 mt-8">
            <div className="container mx-auto px-4 text-center">
              <p className="text-sm text-slate-500 flex items-center justify-center gap-1.5">
                Powered by{" "}
                <Link 
                  href="/" 
                  className="inline-flex items-center gap-1.5 text-slate-700 hover:text-primary font-medium transition-colors"
                >
                  <Image 
                    src="/mystacklogosinfondo.png" 
                    alt="MyStack" 
                    width={18} 
                    height={18}
                    className="h-4.5 w-auto"
                  />
                  MyStack
                </Link>
              </p>
            </div>
          </footer>
        )}
      </div>
    </>
  );
}
