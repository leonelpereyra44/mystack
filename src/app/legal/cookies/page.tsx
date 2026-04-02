import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Política de Cookies - MyStack",
  description: "Política de cookies y tecnologías similares de MyStack",
};

export default function CookiesPage() {
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
          <h1>Política de Cookies</h1>
          <p className="text-muted-foreground">
            Última actualización: Abril 2026
          </p>

          <div className="rounded-lg border bg-muted/50 p-4 mb-6">
            <p className="text-sm">
              Esta Política de Cookies complementa nuestra{" "}
              <Link href="/legal/privacidad" className="text-primary hover:underline">
                Política de Privacidad
              </Link>
              {" "}y se enmarca en la Ley 25.326 de Protección de Datos Personales de la 
              República Argentina.
            </p>
          </div>

          <h2>1. ¿Qué son las Cookies?</h2>
          <p>
            Las cookies son pequeños archivos de texto que se almacenan en su dispositivo 
            (computadora, tablet o teléfono móvil) cuando visita un sitio web. Permiten que 
            el sitio recuerde sus acciones y preferencias durante un período de tiempo.
          </p>
          <p>
            Además de cookies, podemos utilizar tecnologías similares como:
          </p>
          <ul>
            <li><strong>Local Storage:</strong> Almacenamiento local en el navegador</li>
            <li><strong>Session Storage:</strong> Almacenamiento temporal de sesión</li>
            <li><strong>Tokens de autenticación:</strong> Para mantener su sesión activa</li>
          </ul>

          <h2>2. Tipos de Cookies que Utilizamos</h2>

          <h3>2.1 Cookies Estrictamente Necesarias</h3>
          <p>
            Son esenciales para el funcionamiento de la plataforma. Sin ellas, el sitio no 
            puede funcionar correctamente. <strong>No requieren consentimiento</strong> ya que 
            son indispensables para la prestación del servicio.
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th>Cookie</th>
                  <th>Propósito</th>
                  <th>Duración</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>next-auth.session-token</code></td>
                  <td>Mantener su sesión de usuario activa</td>
                  <td>30 días o hasta cerrar sesión</td>
                </tr>
                <tr>
                  <td><code>next-auth.csrf-token</code></td>
                  <td>Protección contra ataques CSRF</td>
                  <td>Sesión</td>
                </tr>
                <tr>
                  <td><code>next-auth.callback-url</code></td>
                  <td>Redirección después del login</td>
                  <td>Sesión</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3>2.2 Cookies de Preferencias</h3>
          <p>
            Permiten recordar sus preferencias y personalizar su experiencia.
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th>Cookie</th>
                  <th>Propósito</th>
                  <th>Duración</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>theme</code></td>
                  <td>Recordar preferencia de tema (claro/oscuro)</td>
                  <td>1 año</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3>2.3 Cookies de Rendimiento y Análisis</h3>
          <p>
            Nos ayudan a entender cómo los usuarios interactúan con la plataforma para 
            mejorar su funcionamiento. Los datos son anónimos y agregados.
          </p>
          <p className="text-sm text-muted-foreground">
            Actualmente MyStack no utiliza cookies de análisis de terceros. Si en el futuro 
            implementamos herramientas de análisis, actualizaremos esta política y solicitaremos 
            su consentimiento.
          </p>

          <h2>3. Cookies de Terceros</h2>
          <p>
            Nuestra plataforma puede incluir servicios de terceros que establecen sus propias 
            cookies. Estos proveedores tienen sus propias políticas de privacidad:
          </p>
          <ul>
            <li>
              <strong>Vercel Analytics (opcional):</strong> Si está habilitado, recopila datos 
              anónimos de rendimiento
            </li>
          </ul>
          <p>
            No tenemos control sobre las cookies establecidas por terceros. Le recomendamos 
            revisar sus respectivas políticas de privacidad.
          </p>

          <h2>4. Base Legal</h2>
          <p>
            Conforme a la Ley 25.326 de Protección de Datos Personales:
          </p>
          <ul>
            <li>
              <strong>Cookies necesarias:</strong> Se basan en la ejecución del contrato y 
              el interés legítimo de proporcionar el servicio
            </li>
            <li>
              <strong>Cookies de preferencias:</strong> Se basan en su consentimiento implícito 
              al configurar dichas preferencias
            </li>
            <li>
              <strong>Cookies de análisis:</strong> Requieren su consentimiento expreso antes 
              de su instalación
            </li>
          </ul>

          <h2>5. Cómo Gestionar las Cookies</h2>
          <p>
            Usted puede controlar y/o eliminar las cookies según sus preferencias. Tiene 
            las siguientes opciones:
          </p>

          <h3>5.1 Configuración del Navegador</h3>
          <p>
            La mayoría de los navegadores permiten gestionar las cookies. Puede configurar 
            su navegador para:
          </p>
          <ul>
            <li>Bloquear todas las cookies</li>
            <li>Aceptar solo cookies de sitios que visita</li>
            <li>Eliminar cookies al cerrar el navegador</li>
            <li>Recibir alertas antes de que se instalen cookies</li>
          </ul>
          <p>
            <strong>Enlaces a instrucciones por navegador:</strong>
          </p>
          <ul>
            <li>
              <a 
                href="https://support.google.com/chrome/answer/95647" 
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google Chrome
              </a>
            </li>
            <li>
              <a 
                href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias" 
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Mozilla Firefox
              </a>
            </li>
            <li>
              <a 
                href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" 
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Safari
              </a>
            </li>
            <li>
              <a 
                href="https://support.microsoft.com/es-ar/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" 
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Microsoft Edge
              </a>
            </li>
          </ul>

          <h3>5.2 Consecuencias de Desactivar Cookies</h3>
          <p>
            Si desactiva las cookies estrictamente necesarias:
          </p>
          <ul>
            <li>No podrá iniciar sesión en su cuenta</li>
            <li>Algunas funcionalidades de la plataforma no estarán disponibles</li>
            <li>Sus preferencias no se guardarán entre sesiones</li>
          </ul>

          <h2>6. Actualizaciones de esta Política</h2>
          <p>
            Podemos actualizar esta Política de Cookies periódicamente. Los cambios 
            significativos serán notificados a través de la plataforma. La fecha de 
            última actualización figura al inicio de este documento.
          </p>

          <h2>7. Contacto</h2>
          <p>
            Si tiene preguntas sobre nuestra Política de Cookies o el uso de tecnologías 
            de seguimiento, puede contactarnos:
          </p>
          <ul>
            <li><strong>Email:</strong> privacidad@mystack.com</li>
            <li><strong>Email general:</strong> soporte@mystack.com</li>
          </ul>

          <div className="mt-8 rounded-lg border bg-blue-50 dark:bg-blue-950/30 p-4">
            <h3 className="text-lg font-semibold mb-2">🍪 Resumen</h3>
            <ul className="text-sm space-y-1">
              <li>✓ Usamos principalmente cookies esenciales para el funcionamiento</li>
              <li>✓ No vendemos datos recopilados mediante cookies</li>
              <li>✓ Puede gestionar cookies desde su navegador</li>
              <li>✓ Las cookies de análisis (si se implementan) requerirán su consentimiento</li>
            </ul>
          </div>

          <div className="mt-4 p-4 border rounded-lg">
            <p className="text-sm">
              Esta Política de Cookies forma parte de nuestros{" "}
              <Link href="/legal/terminos" className="text-primary hover:underline">
                Términos y Condiciones
              </Link>
              {" "}y{" "}
              <Link href="/legal/privacidad" className="text-primary hover:underline">
                Política de Privacidad
              </Link>.
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}
