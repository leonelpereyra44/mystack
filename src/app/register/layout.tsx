import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crear Cuenta | MyStack - Sistema de Turnos Online",
  description:
    "Registra tu negocio en MyStack y empieza a gestionar turnos online. Agenda automática 24/7, control de clientes y estadísticas. ¡Gratis para comenzar!",
  keywords: [
    "crear cuenta mystack",
    "registro sistema turnos",
    "gestión de turnos online",
    "agenda digital para negocios",
    "software de reservas gratis",
  ],
  openGraph: {
    title: "Crear Cuenta | MyStack",
    description:
      "Registra tu negocio y empieza a recibir reservas online. Gestión de turnos inteligente.",
    type: "website",
    url: "https://mystack.com.ar/register",
  },
  twitter: {
    card: "summary",
    title: "Crear Cuenta | MyStack",
    description:
      "Registra tu negocio y empieza a recibir reservas online.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
