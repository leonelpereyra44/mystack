import Link from "next/link";
import { Shield, AlertCircle, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Política de Privacidad - MyStack",
  description: "Política de privacidad y protección de datos personales de MyStack conforme a la Ley 25.326",
};

export default function PrivacidadPage() {
  return (
    <div className="max-w-3xl">
      {/* Header del documento */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Política de Privacidad</h1>
            <p className="text-sm text-muted-foreground">Última actualización: Abril 2026</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3 p-4 rounded-lg border bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900">
          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Marco Legal:</strong> Esta Política se rige por la Ley 25.326 
            de Protección de Datos Personales, su Decreto Reglamentario 1558/2001, y las 
            disposiciones de la Agencia de Acceso a la Información Pública (AAIP).
          </p>
        </div>
      </div>

      {/* Contenido */}
      <article className="prose prose-gray dark:prose-invert max-w-none prose-headings:scroll-mt-20">
        <section className="mb-8 p-5 rounded-xl bg-muted/30 border">
          <h2 className="text-lg font-semibold mt-0 mb-3">1. Responsable del Tratamiento</h2>
          <p className="text-muted-foreground mb-2">
            MyStack, con domicilio en la República Argentina, es responsable del tratamiento 
            de sus datos personales.
          </p>
          <ul className="text-muted-foreground mb-0">
            <li><strong>Correo electrónico:</strong> privacidad@mystack.com</li>
            <li><strong>Correo electrónico general:</strong> soporte@mystack.com</li>
          </ul>
        </section>

          <h2>2. Base Legal para el Tratamiento</h2>
          <p>
            El tratamiento de sus datos personales se realiza conforme a las siguientes bases legales:
          </p>
          <ul>
            <li>
              <strong>Consentimiento informado:</strong> Al registrarse en la plataforma, usted 
              otorga su consentimiento libre, expreso e informado para el tratamiento de sus datos 
              (Art. 5 Ley 25.326)
            </li>
            <li>
              <strong>Ejecución contractual:</strong> Tratamiento necesario para la prestación 
              del servicio contratado
            </li>
            <li>
              <strong>Cumplimiento legal:</strong> Obligaciones fiscales y contables conforme 
              a la normativa argentina
            </li>
            <li>
              <strong>Interés legítimo:</strong> Mejora del servicio y seguridad de la plataforma
            </li>
          </ul>

          <h2>3. Datos Personales que Recopilamos</h2>
          
          <h3>3.1 Datos proporcionados por el usuario</h3>
          <ul>
            <li>
              <strong>Datos de identificación:</strong> nombre y apellido, dirección de correo 
              electrónico, número de teléfono
            </li>
            <li>
              <strong>Datos del negocio:</strong> nombre comercial, dirección, CUIT/CUIL (opcional), 
              descripción de servicios
            </li>
            <li>
              <strong>Datos de reserva:</strong> fecha y hora de citas, servicios solicitados, 
              notas adicionales
            </li>
            <li>
              <strong>Credenciales de acceso:</strong> contraseña (almacenada de forma encriptada)
            </li>
          </ul>

          <h3>3.2 Datos recopilados automáticamente</h3>
          <ul>
            <li>Dirección IP</li>
            <li>Tipo de navegador y dispositivo</li>
            <li>Sistema operativo</li>
            <li>Páginas visitadas y acciones realizadas en la plataforma</li>
            <li>Fecha, hora y duración de las sesiones</li>
            <li>Datos de cookies (ver{" "}
              <Link href="/legal/cookies" className="text-primary hover:underline">
                Política de Cookies
              </Link>)
            </li>
          </ul>

          <h3>3.3 Datos sensibles</h3>
          <p>
            MyStack <strong>NO recopila datos sensibles</strong> según la definición del artículo 2 
            de la Ley 25.326 (datos que revelen origen racial y étnico, opiniones políticas, 
            convicciones religiosas, filosóficas o morales, afiliación sindical, información 
            referente a la salud o a la vida sexual).
          </p>

          <h2>4. Finalidad del Tratamiento</h2>
          <p>Sus datos personales son tratados para las siguientes finalidades:</p>
          <ul>
            <li>Gestionar su registro y cuenta de usuario</li>
            <li>Procesar y administrar reservas de turnos</li>
            <li>Enviar confirmaciones, recordatorios y notificaciones del servicio</li>
            <li>Brindar soporte técnico y atención al cliente</li>
            <li>Emitir facturas y cumplir obligaciones fiscales</li>
            <li>Mejorar la calidad y seguridad de la plataforma</li>
            <li>Prevenir fraudes y usos indebidos</li>
            <li>Cumplir con obligaciones legales</li>
          </ul>
          <p>
            <strong>No utilizamos sus datos para:</strong> perfilado automatizado con efectos 
            jurídicos, venta a terceros, publicidad de terceros sin su consentimiento expreso.
          </p>

          <h2>5. Cesión y Transferencia de Datos</h2>
          <p>Sus datos pueden ser compartidos con:</p>
          <ul>
            <li>
              <strong>Negocios registrados:</strong> Los establecimientos donde usted realice 
              reservas tendrán acceso a sus datos de contacto necesarios para gestionar la cita
            </li>
            <li>
              <strong>Proveedores de servicios tecnológicos:</strong> Empresas que nos ayudan 
              a operar la plataforma bajo estrictos acuerdos de confidencialidad:
              <ul>
                <li>Supabase (base de datos - servidores en EE.UU.)</li>
                <li>Vercel (hosting - servidores en EE.UU.)</li>
                <li>Resend (envío de correos electrónicos)</li>
              </ul>
            </li>
            <li>
              <strong>Autoridades competentes:</strong> Cuando sea requerido por ley, orden 
              judicial o requerimiento de autoridad administrativa competente
            </li>
          </ul>
          <p>
            <strong>Transferencia internacional:</strong> Algunos de nuestros proveedores operan 
            fuera de Argentina. En estos casos, nos aseguramos de que cumplan con estándares 
            equivalentes de protección conforme al artículo 12 de la Ley 25.326.
          </p>
          <p>
            <strong>No vendemos, alquilamos ni comercializamos sus datos personales.</strong>
          </p>

          <h2>6. Derechos del Titular (ARCO)</h2>
          <p>
            Conforme a los artículos 14 y 16 de la Ley 25.326, usted tiene los siguientes derechos:
          </p>
          <ul>
            <li>
              <strong>Acceso:</strong> Conocer qué datos personales tenemos sobre usted y cómo 
              los tratamos. Este derecho puede ejercerse en forma gratuita en intervalos no 
              inferiores a seis meses, salvo interés legítimo acreditado (Art. 14)
            </li>
            <li>
              <strong>Rectificación:</strong> Solicitar la corrección de datos inexactos, 
              desactualizados o incompletos
            </li>
            <li>
              <strong>Cancelación/Supresión:</strong> Solicitar la eliminación de sus datos cuando 
              ya no sean necesarios para la finalidad que fueron recopilados
            </li>
            <li>
              <strong>Oposición:</strong> Oponerse al tratamiento de sus datos en determinadas 
              circunstancias
            </li>
            <li>
              <strong>Revocación del consentimiento:</strong> Retirar su consentimiento en 
              cualquier momento sin efecto retroactivo
            </li>
          </ul>
          <p>
            <strong>Plazo de respuesta:</strong> Conforme al artículo 14 de la Ley 25.326, 
            responderemos a su solicitud dentro de los DIEZ (10) días corridos de recibida.
          </p>
          <p>
            <strong>Cómo ejercer sus derechos:</strong> Envíe un correo a{" "}
            <strong>privacidad@mystack.com</strong> indicando su nombre completo, correo 
            electrónico registrado y el derecho que desea ejercer.
          </p>

          <h2>7. Medidas de Seguridad</h2>
          <p>
            Conforme al artículo 9 de la Ley 25.326, implementamos medidas técnicas y 
            organizativas para proteger sus datos:
          </p>
          <ul>
            <li>Encriptación de datos en tránsito mediante HTTPS/TLS</li>
            <li>Contraseñas almacenadas con hash criptográfico seguro (bcrypt)</li>
            <li>Acceso restringido a datos personales (principio de mínimo privilegio)</li>
            <li>Autenticación segura con tokens de sesión</li>
            <li>Copias de seguridad periódicas</li>
            <li>Monitoreo de seguridad y detección de intrusiones</li>
            <li>Capacitación del personal en protección de datos</li>
          </ul>

          <h2>8. Conservación de Datos</h2>
          <p>
            Conservamos sus datos personales durante el tiempo necesario para cumplir con 
            las finalidades descritas:
          </p>
          <ul>
            <li>
              <strong>Datos de cuenta:</strong> Mientras su cuenta permanezca activa y hasta 
              2 años después de su cancelación
            </li>
            <li>
              <strong>Datos de reservas:</strong> 5 años conforme a obligaciones fiscales y 
              contables (Ley 11.683)
            </li>
            <li>
              <strong>Datos de facturación:</strong> 10 años conforme al Código de Comercio
            </li>
            <li>
              <strong>Logs de seguridad:</strong> 1 año
            </li>
          </ul>
          <p>
            Una vez vencidos estos plazos, los datos serán eliminados o anonimizados.
          </p>

          <h2>9. Menores de Edad</h2>
          <p>
            MyStack no está dirigido a menores de 18 años. No recopilamos intencionalmente 
            datos de menores. Si un padre, madre o tutor detecta que un menor ha proporcionado 
            datos sin consentimiento, puede contactarnos para solicitar su eliminación inmediata.
          </p>

          <h2>10. Autoridad de Control</h2>
          <p>
            Si considera que el tratamiento de sus datos vulnera la normativa vigente, tiene 
            derecho a presentar una denuncia ante:
          </p>
          <div className="rounded-lg border bg-muted/30 p-4 my-4">
            <p className="font-semibold">Agencia de Acceso a la Información Pública (AAIP)</p>
            <p className="text-sm">Dirección Nacional de Protección de Datos Personales</p>
            <p className="text-sm">Av. Pte. Gral. Julio A. Roca 710, Piso 3 - CABA</p>
            <p className="text-sm">Tel: (011) 3988-3968</p>
            <p className="text-sm">
              Web:{" "}
              <a 
                href="https://www.argentina.gob.ar/aaip/datospersonales" 
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                www.argentina.gob.ar/aaip/datospersonales
              </a>
            </p>
          </div>

          <h2>11. Modificaciones a esta Política</h2>
          <p>
            Podemos actualizar esta Política de Privacidad periódicamente. Los cambios 
            significativos serán notificados con al menos TREINTA (30) días de anticipación 
            por correo electrónico y/o aviso en la plataforma.
          </p>
          <p>
            La fecha de última actualización figura al inicio de este documento.
          </p>

          <h2>12. Contacto</h2>
          <p>
            Para consultas sobre esta Política de Privacidad o el tratamiento de sus datos:
          </p>
          <ul>
            <li><strong>Email privacidad:</strong> privacidad@mystack.com</li>
            <li><strong>Email general:</strong> soporte@mystack.com</li>
          </ul>
        </article>

        {/* Resumen de derechos ARCO */}
        <div className="mt-8 rounded-xl border-2 border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/30 p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">Sus Derechos ARCO (Ley 25.326)</h3>
          </div>
          <ul className="grid sm:grid-cols-2 gap-3 text-sm text-green-800 dark:text-green-200">
            <li className="flex items-start gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
              <span><strong>Acceso:</strong> Conocer qué datos tenemos</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
              <span><strong>Rectificación:</strong> Corregir datos incorrectos</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
              <span><strong>Cancelación:</strong> Solicitar eliminación</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
              <span><strong>Oposición:</strong> Oponerse al tratamiento</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
              <span><strong>Plazo:</strong> 10 días corridos de respuesta</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
              <span><strong>Autoridad:</strong> AAIP - Protección de Datos</span>
            </li>
          </ul>
        </div>

        {/* Links a otras políticas */}
        <div className="mt-6 p-4 rounded-lg border bg-muted/30">
          <p className="text-sm text-muted-foreground">
            Al utilizar MyStack, aceptas esta Política, nuestra{" "}
            <Link href="/legal/cookies" className="text-primary hover:underline font-medium">
              Política de Cookies
            </Link>
            {" "}y los{" "}
            <Link href="/legal/terminos" className="text-primary hover:underline font-medium">
              Términos y Condiciones
            </Link>.
          </p>
        </div>
      </div>
  );
}
