import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { BookingForm } from "@/components/booking/booking-form";
import { CollapsibleSection } from "@/components/booking/collapsible-section";
import { getBusinessType } from "@/lib/business-types";
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
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/50">
        {/* Header */}
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-4">
              {business.logo ? (
                <Image
                  src={business.logo}
                  alt={business.name}
                  width={80}
                  height={80}
                  className="h-20 w-20 rounded-full object-cover border-2 border-primary/20"
                />
              ) : (
                <div className={`flex h-20 w-20 items-center justify-center rounded-full ${businessTypeConfig.color} text-white shadow-lg`}>
                  <BusinessIcon className="h-10 w-10" />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{business.name}</h1>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${businessTypeConfig.color} text-white`}>
                    {businessTypeConfig.label}
                  </span>
                </div>
                {business.description && (
                  <p className="text-muted-foreground mt-1">{business.description}</p>
                )}
              </div>
            </div>
            
            {/* Contact Info */}
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
              {business.address && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  <span>{business.address}</span>
                </div>
              )}
              {business.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="h-4 w-4" />
                  <span>{business.phone}</span>
                </div>
              )}
            </div>
            
            {/* Social Media */}
            {(business.instagram || business.facebook || business.twitter || business.tiktok || business.website) && (
              <div className="mt-4 flex flex-wrap gap-3">
                {business.instagram && (
                  <a
                    href={`https://instagram.com/${business.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm hover:opacity-90 transition-opacity"
                  >
                    <Instagram className="h-4 w-4" />
                    <span>{business.instagram}</span>
                  </a>
                )}
                {business.facebook && (
                  <a
                    href={`https://facebook.com/${business.facebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1877F2] text-white text-sm hover:opacity-90 transition-opacity"
                  >
                    <Facebook className="h-4 w-4" />
                    <span>Facebook</span>
                  </a>
                )}
                {business.twitter && (
                  <a
                    href={`https://twitter.com/${business.twitter.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black text-white text-sm hover:opacity-90 transition-opacity"
                  >
                    <Twitter className="h-4 w-4" />
                    <span>{business.twitter}</span>
                  </a>
                )}
                {business.tiktok && (
                  <a
                    href={`https://tiktok.com/${business.tiktok.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black text-white text-sm hover:opacity-90 transition-opacity"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                    <span>{business.tiktok}</span>
                  </a>
                )}
                {business.website && (
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-white text-sm hover:opacity-90 transition-opacity"
                  >
                    <Globe className="h-4 w-4" />
                    <span>Sitio Web</span>
                  </a>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Business Info Cards */}
        <div className="container mx-auto px-4 py-6">
          <div className="mx-auto max-w-2xl grid gap-4 md:grid-cols-2 mb-8">
            {/* Horarios */}
            {business.schedules.length > 0 && (
              <CollapsibleSection
                icon={<Clock className="h-5 w-5 text-primary" />}
                title="Horarios de atención"
              >
                <div className="space-y-1.5 text-sm">
                  {Object.entries(schedulesByDay).map(([day, schedules]) => {
                    const isOpen = schedules.some(s => s.isOpen);
                    return (
                      <div key={day} className="flex justify-between">
                        <span className="text-muted-foreground">{DAYS_OF_WEEK[parseInt(day)]}</span>
                        <span className={`font-medium ${!isOpen ? "text-muted-foreground" : ""}`}>
                          {isOpen 
                            ? schedules.filter(s => s.isOpen).map(s => `${s.openTime} - ${s.closeTime}`).join(", ")
                            : "Cerrado"
                          }
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CollapsibleSection>
            )}

            {/* Profesionales */}
            {business.staff.length > 0 && (
              <CollapsibleSection
                icon={<Users className="h-5 w-5 text-primary" />}
                title="Nuestro equipo"
              >
                <div className="space-y-2">
                  {business.staff.map((member) => (
                    <div key={member.id} className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm">{member.name}</span>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}
          </div>

          {/* Booking Form */}
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-6 text-xl font-semibold flex items-center gap-2">
              <span className="h-8 w-1 bg-primary rounded-full"></span>
              Reserva tu turno
            </h2>
            
            {services.length === 0 ? (
              <div className="rounded-lg border bg-card p-8 text-center">
                <p className="text-muted-foreground">
                  Este negocio aún no tiene servicios disponibles.
                </p>
              </div>
            ) : (
              <BookingForm
                businessId={business.id}
                services={services}
                staff={business.staff}
                schedules={business.schedules}
                timezone={business.timezone}
              />
            )}
          </div>
        </div>

        {/* Footer - White-label: Ocultar branding para usuarios PRO */}
        {!isPro && (
          <footer className="border-t py-6 mt-8">
            <div className="container mx-auto px-4 text-center">
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                Powered by{" "}
                <Link href="/" className="inline-flex items-center gap-1 text-primary hover:underline">
                  <Image 
                    src="/mystacklogosinfondo.png" 
                    alt="MyStack" 
                    width={16} 
                    height={16}
                    className="h-4 w-auto"
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
