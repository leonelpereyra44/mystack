import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Términos y Condiciones - MyStack",
  description: "Términos y condiciones de uso de la plataforma MyStack conforme a la legislación argentina",
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

          <div className="rounded-lg border bg-muted/50 p-4 mb-6">
            <p className="text-sm">
              <strong>Marco Legal Aplicable:</strong> Estos términos se rigen por la legislación 
              de la República Argentina, incluyendo la Ley 24.240 de Defensa del Consumidor y sus 
              modificatorias (Ley 26.361), el Código Civil y Comercial de la Nación, y la Ley 25.326 
              de Protección de Datos Personales.
            </p>
          </div>

          <h2>1. Identificación del Proveedor</h2>
          <p>
            MyStack es una plataforma de gestión de turnos y reservas operada en la República Argentina. 
            Para consultas puede contactarnos a través del correo electrónico: <strong>soporte@mystack.com</strong>
          </p>

          <h2>2. Aceptación de los Términos</h2>
          <p>
            Al acceder y utilizar MyStack (&ldquo;la Plataforma&rdquo;), usted acepta estar sujeto a estos 
            Términos y Condiciones de Uso. De conformidad con el artículo 1105 del Código Civil y 
            Comercial de la Nación, estos términos constituyen un contrato de consumo celebrado 
            a distancia por medios electrónicos.
          </p>
          <p>
            <strong>IMPORTANTE:</strong> Conforme al artículo 1110 del Código Civil y Comercial, 
            usted tiene derecho a revocar su aceptación dentro de los DIEZ (10) días corridos 
            desde la celebración del contrato, sin necesidad de expresar causa y sin penalidad alguna.
          </p>

          <h2>3. Descripción del Servicio</h2>
          <p>
            MyStack es una plataforma de gestión de turnos y reservas que permite a los negocios 
            administrar sus citas y a los clientes realizar reservas en línea. Los servicios incluyen:
          </p>
          <ul>
            <li>Reserva de turnos en línea las 24 horas</li>
            <li>Gestión de servicios y profesionales</li>
            <li>Notificaciones y recordatorios por correo electrónico</li>
            <li>Panel de administración para negocios</li>
            <li>Página personalizada de reservas para cada negocio</li>
          </ul>

          <h2>4. Registro y Cuenta de Usuario</h2>
          <p>
            Para utilizar ciertas funcionalidades de la Plataforma, deberá crear una cuenta. 
            De acuerdo con la normativa vigente, usted se compromete a:
          </p>
          <ul>
            <li>Proporcionar información veraz, exacta, actualizada y completa</li>
            <li>Mantener la confidencialidad de su contraseña y datos de acceso</li>
            <li>Ser responsable de todas las actividades que ocurran bajo su cuenta</li>
            <li>Notificarnos inmediatamente ante cualquier uso no autorizado de su cuenta</li>
            <li>No ceder ni transferir su cuenta a terceros sin autorización expresa</li>
          </ul>
          <p>
            MyStack se reserva el derecho de verificar la información proporcionada y solicitar 
            documentación adicional cuando lo considere necesario.
          </p>

          <h2>5. Obligaciones del Usuario</h2>
          <p>Al utilizar la Plataforma, usted se compromete a:</p>
          <ul>
            <li>No utilizar el servicio para fines ilícitos o contrarios a la moral y buenas costumbres</li>
            <li>No intentar acceder a datos de otros usuarios sin autorización</li>
            <li>No interferir con el funcionamiento normal de la Plataforma</li>
            <li>No distribuir virus, malware o contenido malicioso</li>
            <li>Respetar la propiedad intelectual de MyStack y de terceros</li>
            <li>No realizar prácticas de ingeniería inversa sobre el software</li>
            <li>Cumplir con toda la normativa aplicable en la República Argentina</li>
          </ul>

          <h2>6. Reservas, Cancelaciones y Derecho de Arrepentimiento</h2>
          <p>
            Las políticas específicas de cancelación y modificación de turnos son establecidas por 
            cada negocio de forma independiente. Sin perjuicio de ello:
          </p>
          <ul>
            <li>Los clientes deben revisar las políticas del negocio antes de confirmar una reserva</li>
            <li>Se recomienda cancelar con la anticipación establecida por cada negocio</li>
            <li>Debe proporcionar información de contacto válida para recibir confirmaciones</li>
          </ul>
          <p>
            <strong>Derecho de Arrepentimiento:</strong> Conforme al artículo 34 de la Ley 24.240 
            de Defensa del Consumidor, el consumidor tiene derecho a revocar la aceptación de 
            servicios contratados a distancia durante el plazo de DIEZ (10) días corridos contados 
            a partir de la fecha de celebración del contrato.
          </p>
          <p>
            MyStack actúa como intermediario tecnológico y no es responsable por disputas entre 
            clientes y negocios relacionadas con los servicios efectivamente prestados por estos últimos.
          </p>

          <h2>7. Planes y Facturación</h2>
          <p>
            MyStack ofrece diferentes planes de servicio. Los precios publicados incluyen IVA 
            cuando corresponda. Conforme al artículo 4 de la Ley 24.240:
          </p>
          <ul>
            <li>Los precios serán informados de manera clara, visible y con indicación de moneda</li>
            <li>Cualquier modificación de precios será notificada con 30 días de anticipación</li>
            <li>Se emitirá factura electrónica conforme a las disposiciones de AFIP</li>
          </ul>

          <h2>8. Propiedad Intelectual</h2>
          <p>
            Todos los derechos de propiedad intelectual de la Plataforma, incluyendo pero no 
            limitado a software, código fuente, diseño, logos, marcas, contenido y documentación, 
            son propiedad exclusiva de MyStack o sus licenciantes, y están protegidos por la 
            Ley 11.723 de Propiedad Intelectual y tratados internacionales aplicables.
          </p>
          <p>
            Queda expresamente prohibida la reproducción, distribución, modificación o uso no 
            autorizado de cualquier contenido de la Plataforma.
          </p>

          <h2>9. Limitación de Responsabilidad</h2>
          <p>
            Sin perjuicio de los derechos irrenunciables que le asisten conforme a la Ley de 
            Defensa del Consumidor, MyStack:
          </p>
          <ul>
            <li>Proporciona la Plataforma en las condiciones existentes al momento del uso</li>
            <li>No garantiza disponibilidad ininterrumpida del servicio, aunque realizará sus 
            mejores esfuerzos para mantener la operatividad</li>
            <li>No será responsable por daños derivados de caso fortuito o fuerza mayor</li>
            <li>No será responsable por el contenido publicado por los negocios usuarios</li>
          </ul>
          <p>
            De acuerdo con el artículo 40 de la Ley 24.240, MyStack responderá por los daños 
            causados por el riesgo o vicio de la cosa o de la prestación del servicio.
          </p>

          <h2>10. Protección de Datos Personales</h2>
          <p>
            El tratamiento de sus datos personales se rige por la Ley 25.326 de Protección de 
            Datos Personales y su decreto reglamentario 1558/2001. Para más información, consulte 
            nuestra{" "}
            <Link href="/legal/privacidad" className="text-primary hover:underline">
              Política de Privacidad
            </Link>
            .
          </p>

          <h2>11. Modificaciones a los Términos</h2>
          <p>
            Nos reservamos el derecho de modificar estos Términos. Las modificaciones serán 
            notificadas con al menos TREINTA (30) días de anticipación a través de la Plataforma 
            y/o por correo electrónico. El uso continuado del servicio después de dicho plazo 
            constituye aceptación de los nuevos términos.
          </p>
          <p>
            Las modificaciones que resulten en perjuicio del usuario le otorgan el derecho a 
            rescindir el contrato sin penalidad alguna.
          </p>

          <h2>12. Resolución de Conflictos</h2>
          <p>
            Ante cualquier controversia, las partes intentarán resolverla de buena fe mediante 
            negociación directa. El usuario puede realizar reclamos a través de:
          </p>
          <ul>
            <li>Correo electrónico: soporte@mystack.com</li>
            <li>
              <strong>Dirección Nacional de Defensa del Consumidor:</strong> Av. Julio A. Roca 651, 
              Planta Baja, Sector 3 - CABA - Tel: 0800-666-1518 - 
              <a href="https://www.argentina.gob.ar/produccion/defensadelconsumidor" 
                 className="text-primary hover:underline" 
                 target="_blank" 
                 rel="noopener noreferrer">
                www.argentina.gob.ar/produccion/defensadelconsumidor
              </a>
            </li>
            <li>
              <strong>Sistema de Resolución de Conflictos en las Relaciones de Consumo (COPREC):</strong>{" "}
              <a href="https://www.argentina.gob.ar/coprec" 
                 className="text-primary hover:underline"
                 target="_blank" 
                 rel="noopener noreferrer">
                www.argentina.gob.ar/coprec
              </a>
            </li>
          </ul>

          <h2>13. Suspensión y Terminación</h2>
          <p>
            MyStack puede suspender o terminar el acceso a la Plataforma en caso de 
            incumplimiento de estos Términos, previa notificación al usuario salvo en casos 
            de urgencia o gravedad manifiesta. El usuario puede dar de baja su cuenta en 
            cualquier momento desde la configuración de su perfil.
          </p>

          <h2>14. Ley Aplicable y Jurisdicción</h2>
          <p>
            Estos Términos se rigen por las leyes de la República Argentina. Para cualquier 
            controversia que no pueda resolverse por las vías mencionadas, serán competentes 
            los Tribunales Nacionales en lo Comercial con asiento en la Ciudad Autónoma de 
            Buenos Aires, sin perjuicio del derecho del consumidor a optar por los tribunales 
            correspondientes a su domicilio conforme al artículo 36 de la Ley 24.240.
          </p>

          <h2>15. Disposiciones Finales</h2>
          <p>
            Si alguna disposición de estos Términos fuera declarada nula o inaplicable, las 
            restantes disposiciones mantendrán plena vigencia y efecto. La falta de ejercicio 
            de cualquier derecho no implica renuncia al mismo.
          </p>

          <div className="mt-8 rounded-lg border bg-blue-50 dark:bg-blue-950/30 p-4">
            <h3 className="text-lg font-semibold mb-2">📋 Resumen de Derechos del Consumidor</h3>
            <ul className="text-sm space-y-1">
              <li>✓ Derecho de arrepentimiento: 10 días corridos</li>
              <li>✓ Información clara y veraz sobre precios y condiciones</li>
              <li>✓ Protección de datos personales (Ley 25.326)</li>
              <li>✓ Acceso a organismos de defensa del consumidor</li>
              <li>✓ Notificación previa de cambios en los términos (30 días)</li>
            </ul>
          </div>
        </article>
      </div>
    </div>
  );
}
