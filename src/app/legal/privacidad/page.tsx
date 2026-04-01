import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Política de Privacidad - MyStack",
  description: "Política de privacidad y protección de datos de MyStack",
};

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Link 
          href="/" 
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </Link>

        <article className="prose prose-gray dark:prose-invert max-w-none">
          <h1>Política de Privacidad</h1>
          <p className="text-muted-foreground">
            Última actualización: Abril 2026
          </p>

          <h2>1. Introducción</h2>
          <p>
            En MyStack (&ldquo;nosotros&rdquo;, &ldquo;nuestro&rdquo;) nos comprometemos a proteger su privacidad. 
            Esta Política de Privacidad explica cómo recopilamos, usamos, divulgamos y 
            protegemos su información cuando utiliza nuestra plataforma de gestión de turnos.
          </p>

          <h2>2. Información que Recopilamos</h2>
          
          <h3>2.1 Información proporcionada por usted</h3>
          <ul>
            <li>
              <strong>Datos de registro:</strong> nombre, email, contraseña
            </li>
            <li>
              <strong>Datos del negocio:</strong> nombre del negocio, dirección, teléfono, 
              servicios ofrecidos
            </li>
            <li>
              <strong>Datos de reserva:</strong> nombre del cliente, email, teléfono, 
              fecha y hora de la cita
            </li>
          </ul>

          <h3>2.2 Información recopilada automáticamente</h3>
          <ul>
            <li>Dirección IP y datos del navegador</li>
            <li>Información sobre el dispositivo</li>
            <li>Páginas visitadas y acciones realizadas</li>
            <li>Fecha y hora de acceso</li>
          </ul>

          <h2>3. Uso de la Información</h2>
          <p>Utilizamos su información para:</p>
          <ul>
            <li>Proporcionar y mantener nuestros servicios</li>
            <li>Procesar y gestionar reservas</li>
            <li>Enviar confirmaciones y recordatorios de citas</li>
            <li>Enviar comunicaciones sobre el servicio</li>
            <li>Mejorar y personalizar la experiencia del usuario</li>
            <li>Detectar y prevenir fraudes o abusos</li>
            <li>Cumplir con obligaciones legales</li>
          </ul>

          <h2>4. Compartir Información</h2>
          <p>Podemos compartir su información con:</p>
          <ul>
            <li>
              <strong>Negocios:</strong> Los negocios donde realice reservas tendrán acceso 
              a su información de contacto para gestionar su cita
            </li>
            <li>
              <strong>Proveedores de servicios:</strong> Empresas que nos ayudan a operar 
              la plataforma (hosting, email, análisis)
            </li>
            <li>
              <strong>Autoridades:</strong> Cuando sea requerido por ley
            </li>
          </ul>
          <p>
            <strong>No vendemos</strong> su información personal a terceros.
          </p>

          <h2>5. Almacenamiento y Seguridad</h2>
          <p>
            Su información se almacena en servidores seguros. Implementamos medidas de 
            seguridad técnicas y organizativas apropiadas para proteger sus datos, incluyendo:
          </p>
          <ul>
            <li>Encriptación de datos en tránsito (HTTPS)</li>
            <li>Contraseñas hasheadas de forma segura</li>
            <li>Acceso restringido a datos personales</li>
            <li>Monitoreo de seguridad continuo</li>
          </ul>

          <h2>6. Retención de Datos</h2>
          <p>
            Conservamos su información mientras su cuenta esté activa o sea necesaria para 
            proporcionar servicios. Puede solicitar la eliminación de su cuenta en cualquier 
            momento. Algunos datos pueden conservarse por períodos más largos cuando sea 
            requerido por ley.
          </p>

          <h2>7. Sus Derechos</h2>
          <p>Usted tiene derecho a:</p>
          <ul>
            <li>
              <strong>Acceso:</strong> Solicitar una copia de sus datos personales
            </li>
            <li>
              <strong>Rectificación:</strong> Corregir datos inexactos o incompletos
            </li>
            <li>
              <strong>Eliminación:</strong> Solicitar la eliminación de sus datos
            </li>
            <li>
              <strong>Portabilidad:</strong> Recibir sus datos en formato estructurado
            </li>
            <li>
              <strong>Oposición:</strong> Oponerse al procesamiento de sus datos
            </li>
          </ul>
          <p>
            Para ejercer estos derechos, contacte con nosotros a través de los canales 
            disponibles en la plataforma.
          </p>

          <h2>8. Cookies</h2>
          <p>
            Utilizamos cookies y tecnologías similares para mejorar su experiencia, 
            recordar sus preferencias y analizar el uso de la plataforma. Puede configurar 
            su navegador para rechazar cookies, aunque esto puede afectar la funcionalidad.
          </p>

          <h2>9. Servicios de Terceros</h2>
          <p>Nuestra plataforma utiliza servicios de terceros que tienen sus propias políticas de privacidad:</p>
          <ul>
            <li>Supabase (base de datos)</li>
            <li>Vercel (hosting)</li>
            <li>Resend (envío de emails)</li>
          </ul>

          <h2>10. Menores de Edad</h2>
          <p>
            Nuestros servicios no están dirigidos a menores de 18 años. No recopilamos 
            intencionalmente información de menores. Si detectamos que hemos recopilado 
            información de un menor, la eliminaremos inmediatamente.
          </p>

          <h2>11. Transferencias Internacionales</h2>
          <p>
            Su información puede ser procesada en servidores ubicados fuera de su país de 
            residencia. Nos aseguramos de que estos proveedores cumplan con estándares 
            adecuados de protección de datos.
          </p>

          <h2>12. Cambios a esta Política</h2>
          <p>
            Podemos actualizar esta Política de Privacidad periódicamente. Le notificaremos 
            sobre cambios significativos publicando la nueva política en la plataforma y, 
            cuando sea apropiado, enviándole un aviso por email.
          </p>

          <h2>13. Contacto</h2>
          <p>
            Si tiene preguntas sobre esta Política de Privacidad o sobre cómo manejamos 
            sus datos, puede contactarnos a través de los canales disponibles en la plataforma.
          </p>

          <div className="mt-8 rounded-lg border bg-muted/50 p-4">
            <p className="text-sm">
              Al utilizar MyStack, usted acepta los términos de esta Política de Privacidad 
              y nuestros{" "}
              <Link href="/legal/terminos" className="text-primary hover:underline">
                Términos y Condiciones
              </Link>
              .
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}
