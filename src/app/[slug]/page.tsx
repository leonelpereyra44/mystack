import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { BookingForm } from "@/components/booking/booking-form";
import { getBusinessType } from "@/lib/business-types";
import type { Metadata } from "next";

interface BusinessPageProps {
  params: Promise<{ slug: string }>;
}

const siteUrl = process.env.NEXTAUTH_URL || "https://mystack.com";

export async function generateMetadata({ params }: BusinessPageProps): Promise<Metadata> {
  const { slug } = await params;
  const business = await prisma.business.findUnique({
    where: { slug },
  });

  if (!business) {
    return { title: "Negocio no encontrado" };
  }

  const title = `${business.name} - Reserva tu turno`;
  const description = business.description || `Reserva tu turno en ${business.name}. Sistema de reservas online 24/7.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteUrl}/${slug}`,
      siteName: "MyStack",
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
    },
  });

  if (!business) {
    notFound();
  }

  // Convertir Decimal a number para evitar error de serialización
  const services = business.services.map((service) => ({
    ...service,
    price: Number(service.price),
  }));

  // Obtener el tipo de negocio y su icono
  const businessTypeConfig = getBusinessType(business.businessType);
  const BusinessIcon = businessTypeConfig.icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/50">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            {business.logo ? (
              <Image
                src={business.logo}
                alt={business.name}
                width={64}
                height={64}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className={`flex h-16 w-16 items-center justify-center rounded-full ${businessTypeConfig.color} text-white`}>
                <BusinessIcon className="h-8 w-8" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{business.name}</h1>
              {business.description && (
                <p className="text-muted-foreground">{business.description}</p>
              )}
            </div>
          </div>
          {business.address && (
            <p className="mt-4 text-sm text-muted-foreground">
              📍 {business.address}
            </p>
          )}
          {business.phone && (
            <p className="mt-1 text-sm text-muted-foreground">
              📞 {business.phone}
            </p>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-6 text-xl font-semibold">Reserva tu turno</h2>
          
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
      </main>

      {/* Footer */}
      <footer className="border-t py-6">
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
    </div>
  );
}
