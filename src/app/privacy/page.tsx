import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Política de Privacidad | MyStack",
  description: "Política de privacidad y protección de datos de MyStack. Conoce cómo protegemos tu información.",
};

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-bold mb-2">Política de Privacidad</h1>
        <p className="text-muted-foreground mb-8">Última actualización: Abril 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Información que Recopilamos</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Recopilamos información que nos proporcionas directamente cuando:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Creas una cuenta (nombre, email, contraseña)</li>
              <li>Configuras tu negocio (nombre del negocio, dirección, horarios)</li>
              <li>Agregas servicios y personal</li>
              <li>Recibes reservas de clientes (datos de contacto de clientes)</li>
              <li>Te suscribes a un plan de pago</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Uso de la Información</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Utilizamos la información recopilada para:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Proporcionar, mantener y mejorar el Servicio</li>
              <li>Procesar transacciones y enviar notificaciones relacionadas</li>
              <li>Enviar comunicaciones sobre actualizaciones del servicio</li>
              <li>Responder a tus consultas y solicitudes de soporte</li>
              <li>Detectar y prevenir actividades fraudulentas</li>
              <li>Cumplir con obligaciones legales</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Compartición de Información</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              No vendemos tu información personal. Podemos compartir información con:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>Proveedores de servicios:</strong> MercadoPago para procesamiento de pagos</li>
              <li><strong>Por requerimiento legal:</strong> Cuando sea necesario por ley</li>
              <li><strong>Protección de derechos:</strong> Para proteger nuestros derechos y seguridad</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Seguridad de los Datos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Implementamos medidas de seguridad técnicas y organizativas para proteger tu información, 
              incluyendo encriptación de contraseñas, conexiones seguras (HTTPS) y acceso restringido 
              a datos personales. Sin embargo, ningún método de transmisión por Internet es 100% seguro.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Retención de Datos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Conservamos tu información mientras tu cuenta esté activa o según sea necesario para 
              proporcionarte el Servicio. Si deseas eliminar tu cuenta, puedes contactarnos y 
              eliminaremos tu información en un plazo razonable, salvo que debamos conservarla 
              por obligaciones legales.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Tus Derechos</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Tienes derecho a:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>Acceder</strong> a tu información personal</li>
              <li><strong>Rectificar</strong> datos inexactos o incompletos</li>
              <li><strong>Eliminar</strong> tu cuenta y datos asociados</li>
              <li><strong>Exportar</strong> tus datos en un formato legible</li>
              <li><strong>Oponerte</strong> al procesamiento de tus datos para marketing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Cookies y Tecnologías Similares</h2>
            <p className="text-muted-foreground leading-relaxed">
              Utilizamos cookies y tecnologías similares para mantener tu sesión activa, 
              recordar tus preferencias y analizar el uso del Servicio. Puedes configurar 
              tu navegador para rechazar cookies, aunque esto puede afectar la funcionalidad.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Google Analytics y Publicidad</h2>
            <p className="text-muted-foreground leading-relaxed">
              Utilizamos Google Analytics y Google Ads para analizar el uso del sitio y medir 
              la efectividad de nuestras campañas publicitarias. Estos servicios pueden recopilar 
              información sobre tu actividad en nuestro sitio. Puedes optar por no participar 
              instalando el complemento de inhabilitación de Google Analytics.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Menores de Edad</h2>
            <p className="text-muted-foreground leading-relaxed">
              El Servicio no está dirigido a menores de 18 años. No recopilamos intencionadamente 
              información de menores. Si descubrimos que hemos recopilado datos de un menor, 
              los eliminaremos inmediatamente.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Cambios a esta Política</h2>
            <p className="text-muted-foreground leading-relaxed">
              Podemos actualizar esta Política de Privacidad periódicamente. Te notificaremos 
              sobre cambios significativos por correo electrónico o mediante un aviso en el Servicio. 
              Te recomendamos revisar esta política regularmente.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. Contacto</h2>
            <p className="text-muted-foreground leading-relaxed">
              Si tienes preguntas sobre esta Política de Privacidad o deseas ejercer tus derechos, 
              puedes contactarnos en:{" "}
              <a href="mailto:privacidad@mystack.com.ar" className="text-primary hover:underline">
                privacidad@mystack.com.ar
              </a>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t">
          <p className="text-sm text-muted-foreground">
            Ver también:{" "}
            <Link href="/terms" className="text-primary hover:underline">
              Términos de Servicio
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
