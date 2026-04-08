import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Términos de Servicio | MyStack",
  description: "Términos y condiciones de uso de la plataforma MyStack para gestión de turnos online.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image 
              src="/mystacklogosinfondo.png" 
              alt="MyStack Logo" 
              width={32} 
              height={32}
              className="h-8 w-auto"
            />
            <span className="text-xl font-bold">MyStack</span>
          </Link>
          <Link 
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">Términos de Servicio</h1>
        <p className="text-muted-foreground mb-8">Última actualización: Abril 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Aceptación de los Términos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Al acceder y utilizar MyStack (&quot;el Servicio&quot;), aceptas estar sujeto a estos Términos de Servicio. 
              Si no estás de acuerdo con alguna parte de estos términos, no podrás acceder al Servicio.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Descripción del Servicio</h2>
            <p className="text-muted-foreground leading-relaxed">
              MyStack es una plataforma de gestión de turnos y reservas online diseñada para negocios. 
              El servicio permite a los usuarios crear perfiles de negocio, gestionar servicios, 
              administrar personal y recibir reservas de clientes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Registro y Cuenta</h2>
            <p className="text-muted-foreground leading-relaxed">
              Para utilizar el Servicio, debes registrarte proporcionando información veraz y actualizada. 
              Eres responsable de mantener la confidencialidad de tu cuenta y contraseña, 
              así como de todas las actividades que ocurran bajo tu cuenta.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Uso Aceptable</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Te comprometes a utilizar el Servicio de manera legal y ética. Queda prohibido:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Usar el servicio para actividades ilegales</li>
              <li>Intentar acceder sin autorización a otros sistemas</li>
              <li>Transmitir virus o código malicioso</li>
              <li>Recopilar información de otros usuarios sin consentimiento</li>
              <li>Usar el servicio para enviar spam o contenido no solicitado</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Planes y Pagos</h2>
            <p className="text-muted-foreground leading-relaxed">
              MyStack ofrece planes gratuitos y de pago. Los planes de pago se facturan mensualmente 
              a través de MercadoPago. Puedes cancelar tu suscripción en cualquier momento desde 
              la configuración de tu cuenta.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Propiedad Intelectual</h2>
            <p className="text-muted-foreground leading-relaxed">
              El Servicio y su contenido original, características y funcionalidad son propiedad 
              de MyStack y están protegidos por leyes de propiedad intelectual. No puedes copiar, 
              modificar o distribuir ninguna parte del Servicio sin autorización.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Limitación de Responsabilidad</h2>
            <p className="text-muted-foreground leading-relaxed">
              MyStack se proporciona &quot;tal cual&quot; sin garantías de ningún tipo. No seremos 
              responsables por daños indirectos, incidentales o consecuentes derivados del uso 
              o la imposibilidad de uso del Servicio.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Modificaciones</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nos reservamos el derecho de modificar estos términos en cualquier momento. 
              Te notificaremos sobre cambios significativos por correo electrónico o mediante 
              un aviso destacado en el Servicio.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Terminación</h2>
            <p className="text-muted-foreground leading-relaxed">
              Podemos suspender o terminar tu acceso al Servicio inmediatamente, sin previo aviso, 
              si incumples estos Términos de Servicio. Tras la terminación, tu derecho a usar 
              el Servicio cesará inmediatamente.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Contacto</h2>
            <p className="text-muted-foreground leading-relaxed">
              Si tienes preguntas sobre estos Términos de Servicio, puedes contactarnos en:{" "}
              <a href="mailto:soporte@mystack.com.ar" className="text-primary hover:underline">
                soporte@mystack.com.ar
              </a>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t">
          <p className="text-sm text-muted-foreground">
            Ver también:{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              Política de Privacidad
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
