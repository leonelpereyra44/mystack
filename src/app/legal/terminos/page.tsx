import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Términos y Condiciones - MyStack",
  description: "Términos y condiciones de uso de la plataforma MyStack",
};

export default function TerminosPage() {
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
          <h1>Términos y Condiciones de Uso</h1>
          <p className="text-muted-foreground">
            Última actualización: Abril 2026
          </p>

          <h2>1. Aceptación de los Términos</h2>
          <p>
            Al acceder y utilizar MyStack (&ldquo;la Plataforma&rdquo;), usted acepta estar sujeto a estos 
            Términos y Condiciones de Uso. Si no está de acuerdo con alguna parte de estos términos, 
            no podrá acceder a la Plataforma.
          </p>

          <h2>2. Descripción del Servicio</h2>
          <p>
            MyStack es una plataforma de gestión de turnos y reservas que permite a los negocios 
            administrar sus citas y a los clientes realizar reservas en línea. Los servicios incluyen:
          </p>
          <ul>
            <li>Reserva de turnos en línea</li>
            <li>Gestión de servicios y profesionales</li>
            <li>Notificaciones y recordatorios por email</li>
            <li>Panel de administración para negocios</li>
          </ul>

          <h2>3. Registro y Cuenta</h2>
          <p>
            Para utilizar ciertas funcionalidades de la Plataforma, deberá crear una cuenta. 
            Usted es responsable de:
          </p>
          <ul>
            <li>Proporcionar información precisa y completa</li>
            <li>Mantener la seguridad de su contraseña</li>
            <li>Todas las actividades que ocurran bajo su cuenta</li>
            <li>Notificarnos inmediatamente cualquier uso no autorizado</li>
          </ul>

          <h2>4. Uso Aceptable</h2>
          <p>Al utilizar la Plataforma, usted se compromete a:</p>
          <ul>
            <li>No utilizar el servicio para fines ilegales</li>
            <li>No intentar acceder a datos de otros usuarios sin autorización</li>
            <li>No interferir con el funcionamiento de la Plataforma</li>
            <li>No enviar contenido malicioso o spam</li>
            <li>Respetar la propiedad intelectual de terceros</li>
          </ul>

          <h2>5. Reservas y Cancelaciones</h2>
          <p>
            Las políticas de cancelación y modificación de turnos son establecidas por cada negocio 
            de forma independiente. Los clientes deben:
          </p>
          <ul>
            <li>Revisar las políticas del negocio antes de reservar</li>
            <li>Cancelar con la anticipación requerida por el negocio</li>
            <li>Proporcionar información de contacto válida</li>
          </ul>
          <p>
            MyStack no es responsable por disputas entre clientes y negocios relacionadas con 
            cancelaciones o servicios prestados.
          </p>

          <h2>6. Propiedad Intelectual</h2>
          <p>
            Todos los derechos de propiedad intelectual de la Plataforma, incluyendo pero no 
            limitado a software, diseño, logos y contenido, son propiedad de MyStack o sus licenciantes.
          </p>

          <h2>7. Limitación de Responsabilidad</h2>
          <p>
            MyStack proporciona la Plataforma &ldquo;tal cual&rdquo; y no garantiza que esté libre de errores 
            o interrupciones. No seremos responsables por:
          </p>
          <ul>
            <li>Pérdidas indirectas o consecuentes</li>
            <li>Pérdida de datos o beneficios</li>
            <li>Interrupciones del servicio</li>
            <li>Acciones de terceros en la Plataforma</li>
          </ul>

          <h2>8. Privacidad</h2>
          <p>
            El uso de sus datos personales está regido por nuestra{" "}
            <Link href="/legal/privacidad" className="text-primary hover:underline">
              Política de Privacidad
            </Link>
            , que forma parte integral de estos Términos.
          </p>

          <h2>9. Modificaciones</h2>
          <p>
            Nos reservamos el derecho de modificar estos Términos en cualquier momento. 
            Las modificaciones serán efectivas al ser publicadas en la Plataforma. 
            El uso continuado después de los cambios constituye aceptación de los nuevos términos.
          </p>

          <h2>10. Terminación</h2>
          <p>
            Podemos suspender o terminar su acceso a la Plataforma en cualquier momento, 
            con o sin causa, con o sin previo aviso. En caso de terminación, las disposiciones 
            que por su naturaleza deban sobrevivir, permanecerán en vigor.
          </p>

          <h2>11. Ley Aplicable</h2>
          <p>
            Estos Términos se regirán e interpretarán de acuerdo con las leyes de la 
            República Argentina. Cualquier disputa será sometida a la jurisdicción de los 
            tribunales competentes de la Ciudad Autónoma de Buenos Aires.
          </p>

          <h2>12. Contacto</h2>
          <p>
            Si tiene preguntas sobre estos Términos, puede contactarnos a través de 
            los canales disponibles en la Plataforma.
          </p>
        </article>
      </div>
    </div>
  );
}
