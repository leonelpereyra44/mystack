import {
  Calendar,
  Bell,
  CreditCard,
  Users,
  Clock,
  Smartphone,
  BarChart2,
  Shield,
  MessageSquare,
  Camera,
  type LucideIcon,
} from "lucide-react";

export interface RubroFeature {
  title: string;
  description: string;
  Icon: LucideIcon;
}

export interface RubroFAQ {
  q: string;
  a: string;
}

export interface RubroPageData {
  slug: string;
  businessTypeId: string;
  /** Used for <title> tag */
  metaTitle: string;
  /** Used for <meta name="description"> */
  metaDescription: string;
  /** Short label for breadcrumb & footer link */
  breadcrumbLabel: string;
  h1: string;
  tagline: string;
  intro: string;
  /** Unsplash photo ID (without "photo-" prefix) */
  unsplashId: string;
  unsplashAlt: string;
  /** Tailwind accent text color class */
  accentColor: string;
  /** Tailwind accent bg class (solid) */
  accentBg: string;
  /** Tailwind accent bg class (light/10%) */
  accentLight: string;
  features: RubroFeature[];
  faq: RubroFAQ[];
  ctaText: string;
}

export const RUBRO_PAGES: Record<string, RubroPageData> = {
  barberias: {
    slug: "barberias",
    businessTypeId: "barbershop",
    metaTitle: "Software de turnos para barberías en Argentina",
    metaDescription:
      "Digitalizá tu barbería con MyStack. Agenda online 24/7, recordatorios automáticos y gestión de múltiples barberos. Gratis para comenzar.",
    breadcrumbLabel: "Barberías",
    h1: "El sistema de turnos que toda barbería necesita",
    tagline: "Agenda digital para barberías",
    intro:
      "MyStack es el software de gestión de turnos pensado para dueños de barberías que quieren dejar de depender del WhatsApp y enfocarse en lo que realmente importa: el arte del corte. Automatizá tu agenda, reducí ausencias y administrá varios barberos desde un mismo panel, todo sin conocimientos técnicos.",
    unsplashId: "1503951914875-452162b0f3f1",
    unsplashAlt: "Barbero trabajando en una barbería moderna",
    accentColor: "text-amber-700",
    accentBg: "bg-amber-600",
    accentLight: "bg-amber-50",
    features: [
      {
        title: "Reservas online las 24 horas",
        description:
          "Tus clientes reservan corte, barba o combo en cualquier momento del día, desde el celular, sin que tengas que responder un solo mensaje.",
        Icon: Calendar,
      },
      {
        title: "Gestión de múltiples barberos",
        description:
          "Asigná servicios y horarios a cada integrante de tu equipo. Cada barbero tiene su propia agenda y tus clientes eligen a quién prefieren.",
        Icon: Users,
      },
      {
        title: "Recordatorios automáticos",
        description:
          "El sistema envía notificaciones antes del turno para reducir ausencias y mantener tus sillones ocupados todo el día.",
        Icon: Bell,
      },
      {
        title: "Cobros anticipados (próximamente)",
        description:
          "Próximamente podrás cobrar señas o el total del servicio al momento de la reserva vía MercadoPago. Estamos trabajando en esta integración.",
        Icon: CreditCard,
      },
    ],
    faq: [
      {
        q: "¿Puedo tener varios barberos con agendas independientes?",
        a: "Sí. En el Plan Profesional podés agregar barberos ilimitados, cada uno con sus propios horarios, servicios asignados y vista de agenda.",
      },
      {
        q: "¿Los clientes necesitan descargar una app para reservar?",
        a: "No. Tus clientes reservan desde una página web única de tu barbería, sin instalaciones ni registros previos.",
      },
      {
        q: "¿Puedo configurar la duración exacta de cada servicio (corte, barba, combo)?",
        a: "Sí. Podés crear tus servicios con nombre, duración en minutos y precio. El sistema bloquea el tiempo exacto en la agenda de cada barbero.",
      },
      {
        q: "¿Funciona si recién estoy empezando mi barbería?",
        a: "Perfecto para empezar. El plan gratuito incluye 150 reservas mensuales y un profesional, más que suficiente para arrancar y crecer.",
      },
    ],
    ctaText: "Digitalizá tu barbería gratis",
  },

  peluquerias: {
    slug: "peluquerias",
    businessTypeId: "salon",
    metaTitle: "Software de turnos para peluquerías y salones de belleza",
    metaDescription:
      "Gestioná tu peluquería con MyStack. Agenda online para salones de belleza, recordatorios por email, gestión de estilistas y cobros integrados. Empezá gratis.",
    breadcrumbLabel: "Peluquerías",
    h1: "La agenda online que tu peluquería necesitaba",
    tagline: "Sistema de reservas para salones de belleza",
    intro:
      "MyStack es la solución todo-en-uno para peluquerías y salones de belleza que quieren crecer sin perder tiempo en la gestión manual. Ofrecé reservas en línea las 24 horas, administrá a tu equipo de estilistas y enviá recordatorios automáticos, todo desde un panel súper intuitivo.",
    unsplashId: "1560066984-138daaa952da",
    unsplashAlt: "Estilista trabajando en un salón de belleza moderno",
    accentColor: "text-pink-600",
    accentBg: "bg-pink-500",
    accentLight: "bg-pink-50",
    features: [
      {
        title: "Agenda online para tus clientas",
        description:
          "Reservan corte, tinte, peinado o tratamiento capilar desde cualquier dispositivo, a cualquier hora, sin que tengas que atender el teléfono.",
        Icon: Smartphone,
      },
      {
        title: "Administrá a todo tu equipo",
        description:
          "Cada estilista tiene su propia agenda con horarios y servicios personalizados. Tus clientes eligen a quién reservar.",
        Icon: Users,
      },
      {
        title: "Recordatorios que reducen ausencias",
        description:
          "Enviamos notificaciones automáticas antes del turno para que nadie se olvide, manteniendo tu salón productivo cada hora.",
        Icon: Bell,
      },
      {
        title: "Estadísticas de tu negocio",
        description:
          "Visualizá cuántas reservas tuviste, qué servicios se piden más y el rendimiento de cada profesional en tiempo real.",
        Icon: BarChart2,
      },
    ],
    faq: [
      {
        q: "¿Puedo ofrecer servicios de distintas duraciones (corte 45 min, tinte 2 horas)?",
        a: "Sí. Cada servicio tiene su propia duración configurable. El sistema bloquea el tiempo correcto en la agenda de manera automática.",
      },
      {
        q: "¿Mis clientes pueden elegir a qué estilista reservarle?",
        a: "Sí. Al reservar, tus clientes ven a los profesionales disponibles y pueden elegir a su favorito según los horarios libres.",
      },
      {
        q: "¿Funciona en el celular de mis clientes?",
        a: "100%. La página de reservas es mobile-first: tus clientas la usan desde el celular sin necesidad de descargar nada.",
      },
      {
        q: "¿Puedo cobrar una seña para asegurar el turno?",
        a: "¡Próximamente! Estamos desarrollando la integración de pagos con MercadoPago para que puedas cobrar señas o el total del servicio al reservar. Por ahora podés coordinar el cobro de manera presencial.",
      },
    ],
    ctaText: "Empezá a usar MyStack gratis",
  },

  "spa-estetica": {
    slug: "spa-estetica",
    businessTypeId: "spa",
    metaTitle: "Software de turnos para spa, estética y centros de wellness",
    metaDescription:
      "Organizá los tratamientos de tu spa con MyStack. Agenda online para estética, recordatorios automáticos y gestión de profesionales. Gratis para comenzar.",
    breadcrumbLabel: "Spa & Estética",
    h1: "Gestión de turnos para spas y centros de estética",
    tagline: "Agenda digital para centros de bienestar",
    intro:
      "En un spa o centro de estética, la experiencia del cliente empieza mucho antes de entrar. Con MyStack, ofrecés una reserva fluida y profesional: tus clientes eligen tratamiento, profesional y horario en minutos. Vos te enfocás en brindar la mejor experiencia, nosotros manejamos la agenda.",
    unsplashId: "1544161515-4ab6ce6db874",
    unsplashAlt: "Sesión de spa y bienestar en un centro de estética",
    accentColor: "text-rose-600",
    accentBg: "bg-rose-500",
    accentLight: "bg-rose-50",
    features: [
      {
        title: "Reservas para cada tratamiento",
        description:
          "Masajes, limpiezas faciales, depilación, manicura y más. Cada tratamiento con su duración exacta para una agenda sin superposiciones.",
        Icon: Calendar,
      },
      {
        title: "Equipo de profesionales",
        description:
          "Cada terapeuta o esteticista tiene su propia agenda. Tus clientes eligen a su profesional favorito de manera fácil.",
        Icon: Users,
      },
      {
        title: "Confirmaciones y recordatorios",
        description:
          "Enviamos confirmación inmediata y un recordatorio antes del turno, reduciendo las ausencias y mejorando la experiencia de tus clientes.",
        Icon: MessageSquare,
      },
      {
        title: "Cobros online (próximamente)",
        description:
          "Próximamente podrás cobrar anticipos y señas vía MercadoPago al momento de la reserva. Estamos trabajando en esta integración.",
        Icon: CreditCard,
      },
    ],
    faq: [
      {
        q: "¿Puedo configurar tratamientos de diferentes duraciones?",
        a: "Sí. Cada servicio tiene su duración configurable (30 min, 1 hora, 2 horas, etc.). El sistema bloquea el tiempo exacto en la agenda de cada profesional.",
      },
      {
        q: "¿Los clientes pueden reservar tratamientos sin llamar?",
        a: "Exactamente. Tu centro tiene una página de reservas pública donde los clientes reservan el tratamiento, el profesional y el horario sin intermediarios.",
      },
      {
        q: "¿Puedo tener turnos para varios profesionales al mismo tiempo?",
        a: "Sí. Cada profesional de tu spa tiene su propia agenda independiente, lo que permite que múltiples clientes estén atendidos simultáneamente.",
      },
    ],
    ctaText: "Automatizá tu spa hoy",
  },

  "canchas-deportes": {
    slug: "canchas-deportes",
    businessTypeId: "sports",
    metaTitle: "Sistema de reservas de canchas deportivas online | MyStack",
    metaDescription:
      "Gestioná las reservas de tu complejo deportivo con MyStack. Reservas online 24/7 para canchas de fútbol, pádel y tenis. Simple, rápido y gratis para empezar.",
    breadcrumbLabel: "Canchas & Deportes",
    h1: "El sistema de reservas de canchas más simple de Argentina",
    tagline: "Reservas online para complejos deportivos",
    intro:
      "Con MyStack, los jugadores reservan sus canchas online en cualquier momento sin tener que llamarte o mandarte mensajes. Gestioná la disponibilidad de todas tus canchas y olvidate de los conflictos de horario.",
    unsplashId: "1551698618-1dfe5d97d256",
    unsplashAlt: "Cancha de pádel en un complejo deportivo",
    accentColor: "text-green-700",
    accentBg: "bg-green-600",
    accentLight: "bg-green-50",
    features: [
      {
        title: "Reservas online las 24/7",
        description:
          "Tus jugadores reservan la cancha desde el celular a cualquier hora. Sin llamadas, sin WhatsApp, sin malentendidos.",
        Icon: Smartphone,
      },
      {
        title: "Gestión de múltiples canchas",
        description:
          "Configurá cada cancha como un profesional independiente con sus propios horarios. El sistema evita superposiciones automáticamente.",
        Icon: Shield,
      },
      {
        title: "Cobros anticipados (próximamente)",
        description:
          "Próximamente podrás cobrar la reserva al momento de confirmarla vía MercadoPago. Estamos trabajando en esta integración.",
        Icon: CreditCard,
      },
      {
        title: "Horarios flexibles",
        description:
          "Configurá el horario de apertura y cierre de cada cancha por día. Ideal para complejos con horarios extendidos o fines de semana distintos.",
        Icon: Clock,
      },
    ],
    faq: [
      {
        q: "¿Puedo gestionar canchas de pádel, fútbol y tenis en el mismo sistema?",
        a: "Sí. Cada cancha se configura como un profesional o servicio dentro de tu complejo. Podés tener todas las canchas en un mismo panel.",
      },
      {
        q: "¿Los jugadores pueden reservar desde el celular?",
        a: "Exactamente. Tu complejo tiene una página de reservas 100% mobile-friendly donde los jugadores eligen cancha, fecha y horario en segundos.",
      },
      {
        q: "¿Puedo cobrar la cancha al reservar?",
        a: "¡Próximamente! Estamos desarrollando la integración con MercadoPago para cobrar reservas de manera anticipada. Por ahora podés gestionar el cobro de manera presencial al llegar.",
      },
      {
        q: "¿Qué pasa si una cancha está en mantenimiento?",
        a: "Podés bloquear horarios específicos en la agenda de cada cancha. Los jugadores solo ven los horarios disponibles.",
      },
    ],
    ctaText: "Gestioná tus canchas online",
  },

  "educacion-clases": {
    slug: "educacion-clases",
    businessTypeId: "education",
    metaTitle: "Software de gestión de clases particulares y academia | MyStack",
    metaDescription:
      "Organizá tus clases y alumnos con MyStack. Agenda online para profesores particulares, academias y talleres. Recordatorios automáticos. Gratis para comenzar.",
    breadcrumbLabel: "Educación & Clases",
    h1: "La agenda digital para profesores y academias",
    tagline: "Gestión de clases y alumnos sin complicaciones",
    intro:
      "Si dás clases particulares, dirigís una academia o coordinás talleres, MyStack organiza toda tu agenda para que te concentres en enseñar. Tus alumnos reservan su lugar online, reciben recordatorios automáticos y vos tenés un control total de tu calendario.",
    unsplashId: "1522202176988-66273c2fd55f",
    unsplashAlt: "Clase particular con alumno y profesor",
    accentColor: "text-indigo-700",
    accentBg: "bg-indigo-500",
    accentLight: "bg-indigo-50",
    features: [
      {
        title: "Reservas de clases online",
        description:
          "Tus alumnos reservan clase individual o grupal desde el celular, eligiendo el horario que mejor les conviene según tu disponibilidad.",
        Icon: Calendar,
      },
      {
        title: "Múltiples profesores",
        description:
          "Coordiná un equipo de docentes con agendas independientes. Cada profesor gestiona sus propios alumnos y horarios.",
        Icon: Users,
      },
      {
        title: "Recordatorios que reducen ausencias",
        description:
          "Enviamos notificaciones automáticas antes de cada clase para que tus alumnos nunca olviden su reserva.",
        Icon: Bell,
      },
      {
        title: "Cobro de clases (próximamente)",
        description:
          "Próximamente podrás cobrar las clases al momento de la reserva vía MercadoPago. Estamos trabajando en esta integración.",
        Icon: CreditCard,
      },
    ],
    faq: [
      {
        q: "¿Puedo ofrecer clases individuales y grupales?",
        a: "Sí. Podés configurar clases de distintos tipos con su duración y precio. Cada clase aparece disponible según tu calendario.",
      },
      {
        q: "¿Funciona para academias con varios profesores?",
        a: "Perfecto. En el Plan Profesional cada docente tiene su propia agenda y tus alumnos pueden elegir a su profesor preferido.",
      },
      {
        q: "¿Puedo bloquear feriados o semanas de exámenes?",
        a: "Sí. Podés crear bloqueos de tiempo en cualquier parte de la agenda para indicar que no hay clases disponibles.",
      },
    ],
    ctaText: "Organizá tus clases hoy",
  },

  fotografia: {
    slug: "fotografia",
    businessTypeId: "photography",
    metaTitle: "Software de gestión de sesiones fotográficas | MyStack",
    metaDescription:
      "Automatizá la agenda de tu estudio fotográfico con MyStack. Reservas de sesiones online, recordatorios automáticos y cobros integrados. Empezá gratis.",
    breadcrumbLabel: "Fotografía",
    h1: "Automatizá la agenda de tu estudio fotográfico",
    tagline: "Sistema de reservas para fotógrafos profesionales",
    intro:
      "Gestioná tus sesiones fotográficas con una herramienta profesional. Con MyStack, tus clientes reservan sesiones de retrato, familia, producto o maternidad online, y vos recibís confirmación automática y un calendario siempre organizado para enfocarte en la fotografía.",
    unsplashId: "1492691527719-9d1e07e534b4",
    unsplashAlt: "Fotógrafo profesional trabajando en su estudio",
    accentColor: "text-purple-700",
    accentBg: "bg-purple-500",
    accentLight: "bg-purple-50",
    features: [
      {
        title: "Reservas de sesiones online",
        description:
          "Tus clientes eligen el tipo de sesión (retrato, familiar, producto, maternidad) y el horario disponible en tu estudio, sin intermediarios.",
        Icon: Camera,
      },
      {
        title: "Cobros anticipados (próximamente)",
        description:
          "Próximamente podrás cobrar una seña o el total al reservar vía MercadoPago. Estamos trabajando en esta integración.",
        Icon: CreditCard,
      },
      {
        title: "Recordatorios automáticos",
        description:
          "El sistema notifica a tus clientes antes de la sesión para que lleguen preparados y a tiempo, reduciendo cancelaciones.",
        Icon: Bell,
      },
      {
        title: "Gestión de sesiones largas",
        description:
          "Configurá sesiones de 1 hora, 2 horas o más. El sistema bloquea el tiempo exacto en tu agenda de manera automática.",
        Icon: Clock,
      },
    ],
    faq: [
      {
        q: "¿Puedo ofrecer distintos tipos de sesiones con precios diferentes?",
        a: "Sí. Cada tipo de sesión se configura con su nombre, duración y precio. Tus clientes ven todo claramente al reservar.",
      },
      {
        q: "¿Puedo cobrar una seña para confirmar la sesión?",
        a: "¡Próximamente! Estamos desarrollando la integración con MercadoPago para cobrar señas o el total de la sesión al momento de reservar. Por ahora podés coordinar el cobro de manera presencial o por transferencia.",
      },
      {
        q: "¿Funciona para fotógrafos que trabajan en distintas locaciones?",
        a: "Sí. Podés agregar la dirección o indicaciones de locación en la descripción de cada servicio para que tus clientes siempre sepan a dónde ir.",
      },
    ],
    ctaText: "Organizá tu estudio gratis",
  },

  musica: {
    slug: "musica",
    businessTypeId: "music",
    metaTitle: "Software de turnos para clases de música y academias | MyStack",
    metaDescription:
      "Gestioná las clases de tu academia de música con MyStack. Agenda online para profesores de guitarra, piano, canto y más. Gratis para empezar.",
    breadcrumbLabel: "Música & Estudios",
    h1: "La agenda digital para profesores de música",
    tagline: "Sistema de clases para academias y profesores de música",
    intro:
      "MyStack facilita la gestión de clases de guitarra, piano, canto, batería y cualquier instrumento. Tus alumnos reservan su clase online y vos tenés un calendario organizado sin necesidad de coordinarlo por mensajes. Ideal tanto para profesores independientes como para academias con múltiples docentes.",
    unsplashId: "1514320291840-2e0a9bf2a9ae",
    unsplashAlt: "Clase de música con guitarra en un estudio",
    accentColor: "text-violet-700",
    accentBg: "bg-violet-500",
    accentLight: "bg-violet-50",
    features: [
      {
        title: "Reservas de clases online",
        description:
          "Tus alumnos eligen instrumento, horario y profesor desde el celular. Sin mensajes de coordinación, sin idas y vueltas.",
        Icon: Calendar,
      },
      {
        title: "Equipo de profesores",
        description:
          "Gestioná a todos los profesores de tu academia con agendas independientes. Cada docente maneja sus propios alumnos y horarios.",
        Icon: Users,
      },
      {
        title: "Recordatorios automáticos",
        description:
          "Notificaciones automáticas antes de cada clase para que tus alumnos lleguen preparados y no falten sin aviso.",
        Icon: Bell,
      },
      {
        title: "Cobros de clases (próximamente)",
        description:
          "Próximamente podrás cobrar las clases al reservar vía MercadoPago. Estamos trabajando en esta integración.",
        Icon: CreditCard,
      },
    ],
    faq: [
      {
        q: "¿Puedo gestionar clases de distintos instrumentos?",
        a: "Sí. Cada clase (guitarra, piano, canto, etc.) se configura como un servicio con su duración y precio. Tus alumnos ven toda la oferta al reservar.",
      },
      {
        q: "¿Funciona para academias grandes con muchos profesores?",
        a: "Perfecto. En el Plan Profesional podés agregar docentes ilimitados, cada uno con su propia agenda y disponibilidad.",
      },
      {
        q: "¿Puedo configurar clases de prueba o primer clase gratuita?",
        a: "Sí. Podés crear un servicio llamado 'Clase de prueba' con precio $0 y duración a tu elección.",
      },
    ],
    ctaText: "Gestioná tu academia gratis",
  },

  consultoria: {
    slug: "consultoria",
    businessTypeId: "consulting",
    metaTitle: "Sistema de turnos para consultorías y profesionales independientes",
    metaDescription:
      "Agendá reuniones y consultas online con MyStack. Sistema de turnos para consultores, abogados, contadores y coaches. Sin llamadas, sin fricciones. Gratis.",
    breadcrumbLabel: "Consultoría",
    h1: "La agenda profesional para consultores y profesionales independientes",
    tagline: "Sistema de reuniones online para profesionales",
    intro:
      "Si sos consultor, coach, abogado, contador o cualquier profesional que atiende clientes por turnos, MyStack organiza toda tu agenda de manera automática. Tus clientes reservan reuniones online, reciben confirmación instantánea y vos eliminás el tiempo perdido en coordinar horarios por mail o teléfono.",
    unsplashId: "1600880292203-757bb62b4baf",
    unsplashAlt: "Reunión de consultoría profesional en oficina",
    accentColor: "text-cyan-700",
    accentBg: "bg-cyan-600",
    accentLight: "bg-cyan-50",
    features: [
      {
        title: "Agenda de reuniones online",
        description:
          "Tus clientes reservan consultas, reuniones de trabajo o asesorías directamente desde tu página personalizada, sin intermediarios.",
        Icon: Calendar,
      },
      {
        title: "Gestión de tu disponibilidad",
        description:
          "Configurá los días y horarios en que recibís clientes. El sistema solo muestra los slots realmente disponibles.",
        Icon: Clock,
      },
      {
        title: "Recordatorios automáticos",
        description:
          "Tanto vos como tu cliente reciben una notificación antes de la reunión para asegurar que nadie olvide el compromiso.",
        Icon: Bell,
      },
      {
        title: "Profesionalismo desde el primer contacto",
        description:
          "Presentá una imagen sólida con una página de reservas personalizada con el nombre y logo de tu consultoría o estudio.",
        Icon: Shield,
      },
    ],
    faq: [
      {
        q: "¿Puedo ofrecer distintos tipos de consultas con duraciones diferentes?",
        a: "Sí. Configurás cada tipo de reunión (consulta inicial de 30 min, sesión completa de 60 min, etc.) con su precio y duración.",
      },
      {
        q: "¿Funciona para profesionales que atienden en más de un lugar?",
        a: "Podés agregar la dirección o modalidad (presencial/virtual) en la descripción de cada servicio para que tus clientes siempre estén informados.",
      },
      {
        q: "¿Puedo cobrar la consulta al momento de la reserva?",
        a: "¡Próximamente! Estamos desarrollando la integración con MercadoPago para cobrar consultas o señas al reservar. Por ahora podés coordinar el cobro de manera presencial o por transferencia.",
      },
    ],
    ctaText: "Profesionalizá tu agenda hoy",
  },
};

/** Ordered list of slugs for footer links */
export const RUBRO_SLUGS = Object.keys(RUBRO_PAGES);
