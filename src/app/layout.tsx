import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { SessionProvider } from "next-auth/react";

const inter = Inter({
  subsets: ["latin"],
});

const siteUrl = process.env.NEXTAUTH_URL || "https://mystack.com";

export const viewport: Viewport = {
  themeColor: "#12b5a2",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "MyStack - Sistema de Reservas Online",
    template: "%s | MyStack",
  },
  description: "La plataforma más fácil para gestionar turnos y citas de tu negocio. Reservas online 24/7.",
  keywords: ["turnos", "reservas", "citas", "agenda", "negocio", "booking", "appointments"],
  authors: [{ name: "MyStack" }],
  creator: "MyStack",
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
    title: "MyStack - Sistema de Reservas Online",
    description: "La plataforma más fácil para gestionar turnos y citas de tu negocio. Reservas online 24/7.",
  },
  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "MyStack - Sistema de Reservas Online",
    description: "La plataforma más fácil para gestionar turnos y citas de tu negocio. Reservas online 24/7.",
  },
  // Robots
  robots: {
    index: true,
    follow: true,
  },
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
