import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iniciar Sesión | MyStack - Sistema de Turnos Online",
  description:
    "Accede a tu cuenta de MyStack para gestionar los turnos de tu negocio. Panel de control fácil de usar.",
  openGraph: {
    title: "Iniciar Sesión | MyStack",
    description:
      "Accede a tu cuenta para gestionar los turnos de tu negocio.",
    type: "website",
    url: "https://mystack.com.ar/login",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
