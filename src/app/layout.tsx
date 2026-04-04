import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { SessionProvider } from "next-auth/react";

const inter = Inter({
  subsets: ["latin"],
});

const siteUrl = process.env.NEXTAUTH_URL || "https://mystack.com.ar";

export const viewport: Viewport = {
  themeColor: "#12b5a2",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "MyStack - Sistema de Reservas y Turnos Online para negocios",
    template: "%s | MyStack",
  },
  description: "Sistema de reservas online para negocios en Argentina. Agenda 24/7, notificaciones automáticas y panel de administración en un solo lugar.",
  keywords: [
    "turnos online",
    "reservas online", 
    "sistema de turnos",
    "agenda online",
    "gestión de citas",
    "turnos peluquería",
    "turnos consultorio",
    "reservas Argentina",
    "software de turnos",
    "booking system",
    "citas online",
    "calendario de reservas",
    "turnos gratis",
    "app de turnos",
  ],
  authors: [{ name: "MyStack", url: siteUrl }],
  creator: "MyStack",
  publisher: "MyStack",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  // Open Graph
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: siteUrl,
    siteName: "MyStack",
    title: "MyStack - Sistema de Reservas y Turnos Online",
    description: "La plataforma más fácil para gestionar turnos y citas de tu negocio. Reservas online 24/7, notificaciones automáticas y mucho más.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "MyStack - Sistema de Reservas Online",
      },
    ],
  },
  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "MyStack - Sistema de Reservas y Turnos Online",
    description: "La plataforma más fácil para gestionar turnos y citas de tu negocio. Reservas online 24/7.",
    images: ["/opengraph-image"],
  },
  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  // Verification (agregar cuando tengas las cuentas)
  // verification: {
  //   google: "tu-codigo-de-google-search-console",
  // },
  alternates: {
    canonical: siteUrl,
  },
  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <SessionProvider>
          {children}
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
