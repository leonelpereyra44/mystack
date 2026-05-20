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
  Star,
  Link2,
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
  /** SEO keywords for <meta name="keywords"> and structured data */
  keywords?: string[];
  /** Short descriptor for structured data and headings */
  businessNoun?: string;
}

export const RUBRO_PAGES: Record<string, RubroPageData> = {
  barberias: {
    slug: "barberias",
    businessTypeId: "barbershop",
    metaTitle: "Sistema de Turnos Online para Barberías en Argentina | MyStack",
    metaDescription:
      "El software de turnos más fácil para barberías en Argentina. Agenda online 24/7, recordatorios automáticos, gestión de múltiples barberos y cobros con MercadoPago. Gratis, sin tarjeta.",
    breadcrumbLabel: "Barberías",
    businessNoun: "barbería",
    h1: "Sistema de turnos online para barberías argentinas",
    tagline: "Software de gestión de turnos para barberías",
    intro:
      "MyStack es el sistema de gestión de turnos online pensado especialmente para barberías argentinas. Dejá de perder tiempo respondiendo mensajes de WhatsApp y automatizá tu agenda completamente. Tus clientes reservan corte de pelo, arreglo de barba o combo directamente desde su celular, las 24 horas del día, sin que tengas que atender el teléfono. Gestioná a todos tus barberos desde un único panel, reducí las ausencias con recordatorios automáticos y concentrate en lo que más importa: el arte del corte.",
    unsplashId: "1503951914875-452162b0f3f1",
    unsplashAlt: "Barbero trabajando en una barbería moderna en Argentina",
    accentColor: "text-amber-700",
    accentBg: "bg-amber-600",
    accentLight: "bg-amber-50",
    keywords: [
      "sistema de turnos para barberías",
      "agenda online barbería argentina",
      "software para barberías",
      "turnos online barbería",
      "gestión de turnos barbería",
      "reservas online barbería argentina",
      "app para barberías argentina",
      "agenda digital barbería",
      "software de gestión barbería",
      "turnos barbería gratis",
      "digitalizar barbería argentina",
      "sistema reservas barbería",
    ],
    features: [
      {
        title: "Reservas online las 24 horas",
        description:
          "Tus clientes reservan corte, barba o combo en cualquier momento del día, desde el celular, sin que tengas que responder un solo mensaje de WhatsApp.",
        Icon: Calendar,
      },
      {
        title: "Gestión de múltiples barberos",
        description:
          "Asigná servicios y horarios a cada integrante de tu equipo. Cada barbero tiene su propia agenda independiente y tus clientes eligen a quién prefieren.",
        Icon: Users,
      },
      {
        title: "Recordatorios automáticos anti-ausencias",
        description:
          "El sistema envía notificaciones por email antes del turno para reducir ausencias y mantener tus sillones ocupados todo el día.",
        Icon: Bell,
      },
      {
        title: "Horarios personalizados por barbero",
        description:
          "Cada barbero puede tener sus propios días y horarios de trabajo. Configurá franjas horarias distintas para el fin de semana, días libres y feriados.",
        Icon: Clock,
      },
      {
        title: "Página de reservas única para tu barbería",
        description:
          "Tu barbería tiene su propia URL personalizada (ej. mystack.com.ar/tu-barberia). Compartila en Instagram, WhatsApp o Google y empezá a recibir turnos.",
        Icon: Link2,
      },
      {
        title: "Estadísticas de tu negocio",
        description:
          "Visualizá cuántos turnos tuviste, qué servicios se piden más y el rendimiento de cada barbero para tomar mejores decisiones en tu negocio.",
        Icon: BarChart2,
      },
      {
        title: "Sin app para tus clientes",
        description:
          "Tus clientes reservan desde cualquier navegador, sin descargar ninguna app ni crear una cuenta. Rápido, simple y desde el celular.",
        Icon: Smartphone,
      },
      {
        title: "Cobros anticipados con MercadoPago (próx.)",
        description:
          "Muy pronto podrás cobrar señas o el total del servicio al momento de la reserva vía MercadoPago, eliminando ausencias y asegurando el turno.",
        Icon: CreditCard,
      },
    ],
    faq: [
      {
        q: "¿Puedo tener varios barberos con agendas independientes?",
        a: "Sí. En el Plan Profesional podés agregar barberos ilimitados, cada uno con sus propios horarios, servicios asignados y vista de agenda. Cada barbero solo ve sus propios turnos.",
      },
      {
        q: "¿Los clientes necesitan descargar una app para reservar turno en mi barbería?",
        a: "No. Tus clientes reservan desde una página web única de tu barbería, sin instalar nada ni crear una cuenta. Solo abren el link y en 3 clics tienen su turno confirmado.",
      },
      {
        q: "¿Puedo configurar la duración exacta de cada servicio (corte, barba, combo)?",
        a: "Sí. Podés crear todos tus servicios con nombre, duración en minutos y precio. El sistema bloquea automáticamente el tiempo exacto en la agenda de cada barbero para evitar superposiciones.",
      },
      {
        q: "¿Funciona si recién estoy empezando mi barbería?",
        a: "Perfecto para empezar. El plan gratuito incluye 150 reservas mensuales y un profesional, más que suficiente para una barbería nueva. Cuando crezcas, podés escalar sin complicaciones.",
      },
      {
        q: "¿Cómo comparto la página de turnos de mi barbería con mis clientes?",
        a: "Recibís una URL única del estilo mystack.com.ar/tu-barberia. Podés compartirla por WhatsApp, en tu perfil de Instagram, en Google Maps o en cualquier red social. Tus clientes hacen click y reservan al instante.",
      },
      {
        q: "¿Puedo configurar intervalos entre turnos para la limpieza del puesto?",
        a: "Sí. Podés agregar un tiempo de buffer entre turnos para que el barbero tenga tiempo de preparar el puesto. Este tiempo se descuenta automáticamente de los slots disponibles.",
      },
      {
        q: "¿Los clientes pueden cancelar o cambiar su turno solos?",
        a: "Sí. Los clientes reciben un correo de confirmación con un link para cancelar su turno si es necesario. Esto libera el horario automáticamente para que otro cliente pueda reservarlo.",
      },
      {
        q: "¿MyStack reemplaza el WhatsApp para tomar turnos?",
        a: "Exactamente para eso fue diseñado. Con MyStack, los clientes reservan solos en cualquier momento sin enviarte mensajes. Vos solo abrís el panel y ves tu agenda organizada, sin tener que coordinar nada manualmente.",
      },
      {
        q: "¿Cuánto cuesta el sistema de turnos para mi barbería?",
        a: "MyStack tiene un plan 100% gratuito con hasta 150 reservas mensuales y 1 barbero, ideal para empezar. El Plan Profesional con barberos ilimitados tiene un costo mensual accesible. Podés ver los precios en detalle en mystack.com.ar/#pricing.",
      },
      {
        q: "¿Necesito saber de tecnología para configurar la barbería en MyStack?",
        a: "Para nada. En menos de 5 minutos podés tener tu barbería configurada con servicios, horarios y tu primer turno publicado. No necesitás ningún conocimiento técnico.",
      },
    ],
    ctaText: "Digitalizá tu barbería gratis",
  },

  peluquerias: {
    slug: "peluquerias",
    businessTypeId: "salon",
    metaTitle: "Sistema de Turnos Online para Peluquerías y Salones de Belleza | MyStack",
    metaDescription:
      "El software de turnos más completo para peluquerías en Argentina. Agenda online 24/7, recordatorios automáticos, gestión de estilistas y cobros con MercadoPago. Gratis, sin tarjeta.",
    breadcrumbLabel: "Peluquerías",
    businessNoun: "peluquería",
    h1: "Sistema de turnos online para peluquerías y salones de belleza",
    tagline: "Software de gestión de turnos para peluquerías argentinas",
    intro:
      "MyStack es el sistema de gestión de turnos online pensado para peluquerías y salones de belleza que quieren crecer sin perder tiempo en la gestión manual. Dejá de coordinar turnos por WhatsApp y ofrecé a tus clientas una reserva profesional las 24 horas: eligen estilista, servicio y horario desde su celular en menos de un minuto. Gestioná a todo tu equipo desde un único panel, reducí ausencias con recordatorios automáticos y concentrate en lo que más importa: hacer que cada clienta salga encantada.",
    unsplashId: "1562322140-8baeececf3df",
    unsplashAlt: "Estilista trabajando en un salón de belleza moderno en Argentina",
    accentColor: "text-pink-600",
    accentBg: "bg-pink-500",
    accentLight: "bg-pink-50",
    keywords: [
      "sistema de turnos para peluquerías",
      "agenda online peluquería argentina",
      "software para salones de belleza",
      "turnos online peluquería",
      "gestión de turnos salón de belleza",
      "reservas online peluquería argentina",
      "app para peluquerías argentina",
      "agenda digital peluquería",
      "software gestión salón belleza",
      "turnos peluquería gratis",
      "digitalizar peluquería argentina",
      "sistema reservas salón de belleza",
    ],
    features: [
      {
        title: "Reservas online las 24 horas",
        description:
          "Tus clientas reservan corte, tinte, peinado o tratamiento capilar en cualquier momento, desde el celular, sin que tengas que responder un solo mensaje.",
        Icon: Calendar,
      },
      {
        title: "Gestión de estilistas y profesionales",
        description:
          "Asigná servicios y horarios a cada estilista de tu equipo. Cada profesional tiene su propia agenda independiente y tus clientas eligen a quién prefieren.",
        Icon: Users,
      },
      {
        title: "Recordatorios automáticos anti-ausencias",
        description:
          "El sistema envía notificaciones por email antes del turno para reducir ausencias y mantener tu salón productivo todo el día.",
        Icon: Bell,
      },
      {
        title: "Horarios personalizados por estilista",
        description:
          "Cada estilista puede tener sus propios días y horarios de atención. Configurá franjas distintas para fin de semana y días libres sin conflictos.",
        Icon: Clock,
      },
      {
        title: "Página de reservas única para tu salón",
        description:
          "Tu peluquería tiene su propia URL personalizada. Compartila en Instagram, WhatsApp o Google Maps y empezá a recibir turnos al instante.",
        Icon: Link2,
      },
      {
        title: "Estadísticas de tu salón",
        description:
          "Visualizá qué servicios se piden más, el rendimiento de cada estilista y las tendencias de reservas para tomar mejores decisiones de negocio.",
        Icon: BarChart2,
      },
      {
        title: "Sin app para tus clientas",
        description:
          "Tus clientas reservan desde cualquier navegador sin descargar ninguna app ni crear una cuenta. Rápido, simple y 100% mobile.",
        Icon: Smartphone,
      },
      {
        title: "Cobros con MercadoPago (próx.)",
        description:
          "Muy pronto podrás cobrar señas o el total del servicio al momento de la reserva vía MercadoPago, asegurando el turno de manera anticipada.",
        Icon: CreditCard,
      },
    ],
    faq: [
      {
        q: "¿Puedo ofrecer servicios de distintas duraciones (corte 45 min, tinte 2 horas)?",
        a: "Sí. Cada servicio tiene su propia duración configurable. El sistema bloquea automáticamente el tiempo correcto en la agenda de cada estilista para evitar superposiciones.",
      },
      {
        q: "¿Mis clientas pueden elegir a qué estilista reservarle?",
        a: "Sí. Al reservar, tus clientas ven a los profesionales disponibles y pueden elegir a su favorita según los horarios libres de cada una.",
      },
      {
        q: "¿La página de reservas funciona bien desde el celular?",
        a: "100%. La página de reservas es mobile-first: tus clientas la usan desde el celular sin necesidad de descargar nada ni crear una cuenta.",
      },
      {
        q: "¿Puedo cobrar una seña para asegurar el turno?",
        a: "¡Próximamente! Estamos desarrollando la integración de pagos con MercadoPago. Por ahora podés coordinar el cobro de manera presencial o por transferencia.",
      },
      {
        q: "¿Cómo comparto la página de turnos con mis clientas?",
        a: "Recibís una URL única del estilo mystack.com.ar/tu-peluqueria. Podés compartirla en Instagram, WhatsApp, Google Maps o en tu bio. Tus clientas hacen click y reservan al instante.",
      },
      {
        q: "¿Puedo tener horarios diferentes para cada estilista?",
        a: "Sí. Cada estilista puede tener su propia grilla de horarios y días de trabajo. Podés configurar que un estilista trabaje martes a sábado y otro lunes a viernes, sin problema.",
      },
      {
        q: "¿Las clientas pueden cancelar o reprogramar su turno?",
        a: "Sí. Las clientas reciben un correo de confirmación con un link para cancelar su turno. El horario se libera automáticamente para que otra clienta pueda reservarlo.",
      },
      {
        q: "¿MyStack reemplaza el WhatsApp para tomar turnos?",
        a: "Exactamente para eso fue diseñado. Con MyStack, tus clientas reservan solas sin enviarte mensajes. Vos solo abrís el panel y ves tu agenda organizada.",
      },
      {
        q: "¿Cuánto cuesta el sistema de turnos para mi peluquería?",
        a: "MyStack tiene un plan 100% gratuito con hasta 150 reservas mensuales y 1 profesional. El Plan Profesional con estilistas ilimitados tiene un costo mensual accesible. Consultá los precios en mystack.com.ar/#pricing.",
      },
      {
        q: "¿Necesito conocimientos técnicos para configurar mi peluquería?",
        a: "Para nada. En menos de 5 minutos podés tener tu salón configurado con servicios, horarios y tu primera reserva publicada. Sin conocimientos técnicos requeridos.",
      },
    ],
    ctaText: "Digitalizá tu peluquería gratis",
  },

  "spa-estetica": {
    slug: "spa-estetica",
    businessTypeId: "spa",
    metaTitle: "Sistema de Turnos Online para Spa, Estética y Centros de Wellness | MyStack",
    metaDescription:
      "El software de turnos más profesional para spas y centros de estética en Argentina. Agenda online 24/7, recordatorios automáticos, gestión de terapeutas y cobros integrados. Gratis, sin tarjeta.",
    breadcrumbLabel: "Spa & Estética",
    businessNoun: "centro de estética",
    h1: "Sistema de turnos online para spas y centros de estética",
    tagline: "Software de gestión para centros de bienestar argentinos",
    intro:
      "En un spa o centro de estética, la experiencia del cliente empieza mucho antes de cruzar la puerta. Con MyStack, ofrecés una reserva fluida y completamente profesional: tus clientes eligen tratamiento, profesional y horario en minutos, desde su celular. Automatizá las confirmaciones, reducí ausencias con recordatorios y gestioná a todo tu equipo de terapeutas y esteticistas desde un único panel, sin perder tiempo en coordinaciones manuales.",
    unsplashId: "1544161515-4ab6ce6db874",
    unsplashAlt: "Sesión de spa y tratamiento estético en un centro de bienestar argentina",
    accentColor: "text-rose-600",
    accentBg: "bg-rose-500",
    accentLight: "bg-rose-50",
    keywords: [
      "sistema de turnos para spa",
      "agenda online spa argentina",
      "software para centros de estética",
      "turnos online estética argentina",
      "gestión de turnos spa",
      "reservas online spa argentina",
      "agenda digital spa",
      "software spa argentina",
      "turnos estética gratis",
      "gestión centro de bienestar",
      "digitalizar spa argentina",
      "sistema reservas spa wellness",
    ],
    features: [
      {
        title: "Reservas para cada tratamiento",
        description:
          "Masajes, limpiezas faciales, depilación, manicura y más. Cada tratamiento con su duración exacta para una agenda sin superposiciones.",
        Icon: Calendar,
      },
      {
        title: "Equipo de terapeutas y esteticistas",
        description:
          "Cada terapeuta tiene su propia agenda con horarios y tratamientos asignados. Tus clientes eligen a su profesional favorito de manera fácil.",
        Icon: Users,
      },
      {
        title: "Confirmaciones y recordatorios automáticos",
        description:
          "Enviamos confirmación inmediata y un recordatorio antes del turno, reduciendo ausencias y mejorando la experiencia de tus clientes.",
        Icon: MessageSquare,
      },
      {
        title: "Horarios personalizados por profesional",
        description:
          "Cada terapeuta puede tener su propia disponibilidad. Configurá turnos, descansos y vacaciones sin conflictos de agenda entre profesionales.",
        Icon: Clock,
      },
      {
        title: "Página de reservas de tu centro",
        description:
          "Tu spa tiene su propia URL personalizada. Compartila en Instagram, Google Maps o tu sitio web para recibir reservas de manera automática.",
        Icon: Link2,
      },
      {
        title: "Estadísticas de tratamientos",
        description:
          "Analizá qué tratamientos se reservan más, el rendimiento de cada profesional y las horas pico de tu centro para optimizar tu operación.",
        Icon: BarChart2,
      },
      {
        title: "Sin app para tus clientes",
        description:
          "Tus clientes reservan desde cualquier navegador sin descargar nada. La experiencia es fluida y profesional desde el primer clic.",
        Icon: Smartphone,
      },
      {
        title: "Cobros online con MercadoPago (próx.)",
        description:
          "Muy pronto podrás cobrar anticipos y señas vía MercadoPago al momento de la reserva, garantizando la asistencia de tus clientes.",
        Icon: CreditCard,
      },
    ],
    faq: [
      {
        q: "¿Puedo configurar tratamientos de diferentes duraciones (30 min, 1 hora, 2 horas)?",
        a: "Sí. Cada tratamiento tiene su duración configurable. El sistema bloquea automáticamente el tiempo exacto en la agenda de cada profesional para evitar superposiciones.",
      },
      {
        q: "¿Los clientes pueden reservar sus tratamientos sin llamar al spa?",
        a: "Exactamente. Tu centro tiene una página de reservas pública donde los clientes eligen tratamiento, profesional y horario sin intermediarios, disponible las 24 horas.",
      },
      {
        q: "¿Puedo tener varios profesionales atendiendo al mismo tiempo?",
        a: "Sí. Cada terapeuta o esteticista tiene su propia agenda independiente, lo que permite que múltiples clientes sean atendidos simultáneamente.",
      },
      {
        q: "¿Mis clientes pueden elegir a qué terapeuta reservarle?",
        a: "Sí. Al reservar, los clientes ven los profesionales disponibles para ese tratamiento y pueden elegir a su favorito según la disponibilidad horaria.",
      },
      {
        q: "¿Cómo comparto la página de mi spa con mis clientes?",
        a: "Recibís una URL personalizada que podés compartir en Instagram, WhatsApp, Google Maps o en tu sitio web. Los clientes hacen click y reservan al instante.",
      },
      {
        q: "¿Puedo bloquear tiempo entre tratamientos para limpieza de la sala?",
        a: "Sí. Podés agregar tiempos de buffer entre turnos para que el profesional tenga tiempo de preparar la sala. Este tiempo se descuenta automáticamente de los slots disponibles.",
      },
      {
        q: "¿Los clientes reciben confirmación de su turno?",
        a: "Sí. Al completar la reserva, los clientes reciben automáticamente un email de confirmación con todos los detalles del turno y un recordatorio antes de la cita.",
      },
      {
        q: "¿Cuánto cuesta usar MyStack para mi spa o centro de estética?",
        a: "MyStack tiene un plan 100% gratuito con hasta 150 reservas mensuales y 1 profesional. El Plan Profesional con terapeutas ilimitados tiene un costo mensual accesible. Consultá los precios en mystack.com.ar/#pricing.",
      },
    ],
    ctaText: "Automatizá tu spa hoy",
  },

  "canchas-deportes": {
    slug: "canchas-deportes",
    businessTypeId: "sports",
    metaTitle: "Reservas Online de Canchas Deportivas en Argentina | MyStack",
    metaDescription:
      "El sistema de reservas más simple para complejos deportivos en Argentina. Reservas online 24/7 para canchas de fútbol, pádel, tenis y más. Sin llamadas, sin mensajes. Gratis para empezar.",
    breadcrumbLabel: "Canchas & Deportes",
    businessNoun: "complejo deportivo",
    h1: "Sistema de reservas online para canchas deportivas",
    tagline: "Reservas online para complejos deportivos argentinos",
    intro:
      "MyStack es el sistema de reservas de canchas más simple de Argentina. Dejá de recibir llamadas y mensajes para coordinar horarios: tus jugadores reservan la cancha online en cualquier momento, desde el celular, sin intermediarios. Gestioná la disponibilidad de fútbol, pádel, tenis y cualquier disciplina desde un único panel, eliminá los conflictos de horario y hacé que tu complejo funcione solo.",
    unsplashId: "1551698618-1dfe5d97d256",
    unsplashAlt: "Cancha de pádel en un complejo deportivo argentino",
    accentColor: "text-green-700",
    accentBg: "bg-green-600",
    accentLight: "bg-green-50",
    keywords: [
      "reservas online canchas deportivas argentina",
      "sistema de reservas de canchas",
      "agenda online complejo deportivo",
      "reservas canchas de pádel argentina",
      "turnos canchas de fútbol online",
      "gestión complejo deportivo",
      "reservas canchas online argentina",
      "app reservas canchas argentina",
      "software complejo deportivo",
      "reservas fútbol pádel tenis online",
      "digitalizar complejo deportivo",
      "agenda digital canchas deportivas",
    ],
    features: [
      {
        title: "Reservas online las 24 horas",
        description:
          "Tus jugadores reservan la cancha desde el celular a cualquier hora del día. Sin llamadas, sin WhatsApp, sin malentendidos de horario.",
        Icon: Smartphone,
      },
      {
        title: "Gestión de múltiples canchas",
        description:
          "Configurá cada cancha como un recurso independiente con sus propios horarios. El sistema evita superposiciones automáticamente.",
        Icon: Shield,
      },
      {
        title: "Horarios flexibles por cancha",
        description:
          "Configurá horarios de apertura y cierre diferentes para cada cancha por día. Ideal para complejos con horarios extendidos los fines de semana.",
        Icon: Clock,
      },
      {
        title: "Notificaciones y recordatorios",
        description:
          "Los jugadores reciben confirmación inmediata y un recordatorio antes de la reserva, reduciendo ausencias y canchas desaprovechadas.",
        Icon: Bell,
      },
      {
        title: "Página del complejo deportivo",
        description:
          "Tu complejo tiene su propia URL pública. Compartila en redes sociales, WhatsApp o Google Maps para que tus jugadores reserven al instante.",
        Icon: Link2,
      },
      {
        title: "Estadísticas del complejo",
        description:
          "Analizá qué canchas se reservan más, los horarios con más demanda y la ocupación semanal para optimizar la gestión de tu complejo.",
        Icon: BarChart2,
      },
      {
        title: "Sin app para los jugadores",
        description:
          "Tus jugadores reservan desde cualquier navegador sin descargar ninguna app. La reserva tarda menos de 60 segundos.",
        Icon: Calendar,
      },
      {
        title: "Cobros anticipados con MercadoPago (próx.)",
        description:
          "Muy pronto podrás cobrar la reserva de la cancha al momento de confirmarla vía MercadoPago, asegurando la asistencia de los jugadores.",
        Icon: CreditCard,
      },
    ],
    faq: [
      {
        q: "¿Puedo gestionar canchas de pádel, fútbol y tenis en el mismo sistema?",
        a: "Sí. Cada cancha se configura como un recurso independiente dentro de tu complejo. Podés tener todas las canchas en un mismo panel con agendas separadas.",
      },
      {
        q: "¿Los jugadores pueden reservar desde el celular?",
        a: "Exactamente. Tu complejo tiene una página de reservas 100% mobile-friendly donde los jugadores eligen cancha, fecha y horario en menos de un minuto.",
      },
      {
        q: "¿Qué pasa si una cancha está en mantenimiento o fuera de servicio?",
        a: "Podés bloquear horarios específicos o días completos en la agenda de cada cancha. Los jugadores solo ven los horarios realmente disponibles.",
      },
      {
        q: "¿Puedo cobrar la reserva de la cancha por adelantado?",
        a: "¡Próximamente! Estamos desarrollando la integración con MercadoPago para cobrar reservas de forma anticipada. Por ahora podés gestionar el cobro presencialmente.",
      },
      {
        q: "¿Cómo comparto el link de reservas de mi complejo deportivo?",
        a: "Recibís una URL única del estilo mystack.com.ar/tu-complejo. Podés compartirla en Instagram, Facebook, WhatsApp o agregarla a tu Google Maps para que los jugadores reserven al instante.",
      },
      {
        q: "¿Puedo configurar el tiempo de duración de cada reserva de cancha?",
        a: "Sí. Cada tipo de reserva (1 hora de pádel, 2 horas de fútbol, etc.) se configura con su duración exacta. El sistema bloquea ese tiempo automáticamente.",
      },
      {
        q: "¿Los jugadores reciben confirmación de su reserva?",
        a: "Sí. Al completar la reserva, los jugadores reciben automáticamente un email de confirmación con los detalles de la cancha, fecha, hora y duración.",
      },
      {
        q: "¿Cuánto cuesta para un complejo deportivo?",
        a: "MyStack tiene un plan gratuito con hasta 150 reservas mensuales, ideal para complejos pequeños. El Plan Profesional con canchas ilimitadas tiene un costo mensual accesible. Consultá los precios en mystack.com.ar/#pricing.",
      },
    ],
    ctaText: "Gestioná tus canchas online",
  },

  "educacion-clases": {
    slug: "educacion-clases",
    businessTypeId: "education",
    metaTitle: "Sistema de Turnos para Clases Particulares y Academias | MyStack",
    metaDescription:
      "El software de gestión de clases más completo para profesores y academias en Argentina. Agenda online para alumnos, recordatorios automáticos y múltiples docentes. Gratis para comenzar.",
    breadcrumbLabel: "Educación & Clases",
    businessNoun: "academia",
    h1: "Sistema de turnos online para clases particulares y academias",
    tagline: "Software de gestión de clases para profesores y academias argentinas",
    intro:
      "MyStack organiza toda la agenda de tu academia o clases particulares para que te concentres en enseñar, no en coordinar horarios. Tus alumnos reservan su lugar online, eligen el profesor y el horario disponible desde el celular, y reciben recordatorios automáticos antes de cada clase. Gestioná múltiples docentes, bloqueá feriados y días libres, y tené siempre un control total de tu calendario educativo sin perder tiempo en mensajes.",
    unsplashId: "1522202176988-66273c2fd55f",
    unsplashAlt: "Alumno y profesor en una clase particular en Argentina",
    accentColor: "text-indigo-700",
    accentBg: "bg-indigo-500",
    accentLight: "bg-indigo-50",
    keywords: [
      "sistema de turnos para clases particulares",
      "agenda online academia argentina",
      "software gestión clases particulares",
      "turnos online profesor particular",
      "gestión de alumnos academia",
      "reservas clases online argentina",
      "app gestión clases particulares",
      "agenda digital academia",
      "software academia argentina",
      "clases particulares agenda online",
      "digitalizar academia argentina",
      "sistema reservas clases educación",
    ],
    features: [
      {
        title: "Reservas de clases online",
        description:
          "Tus alumnos reservan clase individual o grupal desde el celular, eligiendo el horario que mejor les conviene según la disponibilidad de cada docente.",
        Icon: Calendar,
      },
      {
        title: "Múltiples profesores con agendas propias",
        description:
          "Coordiná un equipo de docentes con agendas independientes. Cada profesor gestiona sus propios alumnos, horarios y materias.",
        Icon: Users,
      },
      {
        title: "Recordatorios automáticos para alumnos",
        description:
          "Enviamos notificaciones automáticas antes de cada clase para que tus alumnos nunca olviden su reserva y lleguen preparados.",
        Icon: Bell,
      },
      {
        title: "Horarios flexibles por docente",
        description:
          "Cada profesor puede tener su propia grilla horaria. Configurá disponibilidades distintas para diferentes materias, niveles y modalidades.",
        Icon: Clock,
      },
      {
        title: "Página de reservas de tu academia",
        description:
          "Tu academia tiene su propia URL pública que podés compartir con los alumnos. Reservan en línea sin necesidad de llamar ni enviar mensajes.",
        Icon: Link2,
      },
      {
        title: "Estadísticas académicas",
        description:
          "Visualizá cuántas clases se dictan por semana, qué materias tienen más demanda y el rendimiento de cada docente para optimizar tu academia.",
        Icon: BarChart2,
      },
      {
        title: "Sin app para tus alumnos",
        description:
          "Tus alumnos reservan desde cualquier navegador sin descargar nada. Funciona perfecto en el celular, tablet o computadora.",
        Icon: Smartphone,
      },
      {
        title: "Cobros de clases con MercadoPago (próx.)",
        description:
          "Muy pronto podrás cobrar las clases al momento de la reserva vía MercadoPago, garantizando la asistencia de tus alumnos.",
        Icon: CreditCard,
      },
    ],
    faq: [
      {
        q: "¿Puedo ofrecer clases individuales y grupales con distintas duraciones?",
        a: "Sí. Podés configurar clases de distintos tipos (individual 45 min, grupal 1 hora, taller 2 horas) con su duración y precio. Cada clase aparece disponible según el calendario del docente.",
      },
      {
        q: "¿Funciona para academias con varios profesores?",
        a: "Perfecto. En el Plan Profesional cada docente tiene su propia agenda independiente y tus alumnos pueden elegir a su profesor preferido según la disponibilidad.",
      },
      {
        q: "¿Puedo bloquear feriados, semanas de exámenes o vacaciones?",
        a: "Sí. Podés crear bloqueos de tiempo en cualquier parte de la agenda de cada docente para indicar que no hay clases disponibles en esas fechas.",
      },
      {
        q: "¿Los alumnos pueden cancelar o reprogramar su clase?",
        a: "Sí. Los alumnos reciben un correo de confirmación con un link para cancelar su reserva. El horario se libera automáticamente para que otro alumno pueda tomarlo.",
      },
      {
        q: "¿Cómo comparto el link de reservas de mi academia?",
        a: "Recibís una URL única del estilo mystack.com.ar/tu-academia. Podés compartirla en redes sociales, WhatsApp o en tu sitio web para que los alumnos reserven en cualquier momento.",
      },
      {
        q: "¿Puedo configurar una clase de prueba gratuita?",
        a: "Sí. Podés crear un servicio llamado \u2018Clase de prueba\u2019 con precio $0 y la duración que quieras. Es ideal para atraer nuevos alumnos sin barreras.",
      },
      {
        q: "¿Los alumnos reciben recordatorio antes de la clase?",
        a: "Sí. El sistema envía automáticamente un recordatorio por email antes de cada clase para que tus alumnos no olviden el horario y lleguen preparados.",
      },
      {
        q: "¿Cuánto cuesta para una academia o profesor particular?",
        a: "MyStack tiene un plan 100% gratuito con hasta 150 reservas mensuales y 1 docente. El Plan Profesional con docentes ilimitados tiene un costo mensual accesible. Consultá los precios en mystack.com.ar/#pricing.",
      },
    ],
    ctaText: "Organizá tus clases hoy",
  },

  fotografia: {
    slug: "fotografia",
    businessTypeId: "photography",
    metaTitle: "Sistema de Reservas para Fotógrafos y Estudios Fotográficos | MyStack",
    metaDescription:
      "El software de gestión de sesiones más profesional para fotógrafos en Argentina. Reservas de sesiones online, recordatorios automáticos y cobros con MercadoPago. Gratis para empezar.",
    breadcrumbLabel: "Fotografía",
    businessNoun: "estudio fotográfico",
    h1: "Sistema de reservas online para fotógrafos y estudios fotográficos",
    tagline: "Software de gestión de sesiones para fotógrafos argentinos",
    intro:
      "MyStack organiza la agenda de tu estudio fotográfico para que te concentres en la fotografía, no en coordinar sesiones. Tus clientes reservan sesiones de retrato, familia, producto, maternidad o cualquier tipo de sesión directamente online, eligiendo fecha y horario disponible desde su celular. Recibís confirmación automática, recordatorios anti-ausencias y tenés tu calendario siempre organizado, sin necesidad de intercambiar mensajes para cada reserva.",
    unsplashId: "1492691527719-9d1e07e534b4",
    unsplashAlt: "Fotógrafo profesional trabajando en su estudio en Argentina",
    accentColor: "text-purple-700",
    accentBg: "bg-purple-500",
    accentLight: "bg-purple-50",
    keywords: [
      "sistema de reservas para fotógrafos",
      "agenda online estudio fotográfico argentina",
      "software para fotógrafos profesionales",
      "reservas sesiones fotográficas online",
      "gestión estudio fotográfico",
      "turnos fotógrafo profesional argentina",
      "app gestión sesiones fotográficas",
      "agenda digital fotógrafo",
      "software estudio fotográfico argentina",
      "reservas fotógrafo online gratis",
      "digitalizar estudio fotográfico",
      "sistema reservas sesiones foto",
    ],
    features: [
      {
        title: "Reservas de sesiones fotográficas online",
        description:
          "Tus clientes eligen el tipo de sesión (retrato, familiar, producto, maternidad) y el horario disponible en tu estudio, sin intermediarios y sin mensajes.",
        Icon: Camera,
      },
      {
        title: "Recordatorios automáticos",
        description:
          "El sistema notifica a tus clientes antes de la sesión para que lleguen preparados y a tiempo, reduciendo cancelaciones de último momento.",
        Icon: Bell,
      },
      {
        title: "Gestión de sesiones de larga duración",
        description:
          "Configurá sesiones de 1 hora, 2 horas, 4 horas o más. El sistema bloquea el tiempo exacto en tu agenda sin posibilidad de superposiciones.",
        Icon: Clock,
      },
      {
        title: "Múltiples fotógrafos en el estudio",
        description:
          "Si trabajás en equipo, podés agregar a cada fotógrafo con su propia agenda. Los clientes eligen a quién quieren para su sesión.",
        Icon: Users,
      },
      {
        title: "Página de reservas de tu estudio",
        description:
          "Tu estudio tiene su propia URL que podés compartir en Instagram, tu sitio web o Google Maps. Los clientes reservan su sesión en cualquier momento.",
        Icon: Link2,
      },
      {
        title: "Estadísticas de tu estudio",
        description:
          "Analizá qué tipo de sesiones se reservan más, los meses con mayor demanda y el rendimiento general de tu estudio para planificar mejor.",
        Icon: BarChart2,
      },
      {
        title: "Sin app para tus clientes",
        description:
          "Tus clientes reservan desde cualquier navegador sin descargar ninguna app. La experiencia es profesional y fluida desde el primer clic.",
        Icon: Smartphone,
      },
      {
        title: "Cobros con MercadoPago (próx.)",
        description:
          "Muy pronto podrás cobrar una seña o el total de la sesión al momento de la reserva vía MercadoPago, asegurando la confirmación sin fricciones.",
        Icon: CreditCard,
      },
    ],
    faq: [
      {
        q: "¿Puedo ofrecer distintos tipos de sesiones con precios diferentes?",
        a: "Sí. Cada tipo de sesión se configura con su nombre, duración y precio. Tus clientes ven toda la oferta claramente al momento de reservar.",
      },
      {
        q: "¿Puedo cobrar una seña para confirmar la sesión fotográfica?",
        a: "¡Próximamente! Estamos desarrollando la integración con MercadoPago para cobrar señas o el total al reservar. Por ahora podés coordinar el cobro presencialmente o por transferencia.",
      },
      {
        q: "¿Funciona para fotógrafos que trabajan en distintas locaciones?",
        a: "Sí. Podés agregar la dirección o indicaciones de locación en la descripción de cada tipo de sesión para que tus clientes siempre sepan a dónde ir.",
      },
      {
        q: "¿Puedo tener sesiones de varias horas sin que el sistema genere conflictos?",
        a: "Sí. Cada tipo de sesión tiene su duración exacta configurada. Si agendás una sesión de 3 horas, el sistema bloquea ese tiempo completo en tu agenda.",
      },
      {
        q: "¿Cómo comparto mi página de reservas fotográficas?",
        a: "Recibís una URL personalizada del estilo mystack.com.ar/tu-estudio. Podés agregarla en tu Instagram, WhatsApp Business, sitio web o Google Maps.",
      },
      {
        q: "¿Los clientes reciben recordatorio de su sesión?",
        a: "Sí. El sistema envía automáticamente un email de confirmación al reservar y un recordatorio antes de la fecha de la sesión para que nadie llegue tarde ni olvide el turno.",
      },
      {
        q: "¿Puedo bloquear días completos cuando tengo eventos o viajes?",
        a: "Sí. Podés crear bloqueos de tiempo para días, rangos de fechas o franjas horarias específicas en tu agenda para cuando no estás disponible.",
      },
      {
        q: "¿Cuánto cuesta para un fotógrafo profesional?",
        a: "MyStack tiene un plan 100% gratuito con hasta 150 reservas mensuales, perfecto para fotógrafos independientes. El Plan Profesional con fotógrafos ilimitados es accesible. Consultá los precios en mystack.com.ar/#pricing.",
      },
    ],
    ctaText: "Organizá tu estudio gratis",
  },

  musica: {
    slug: "musica",
    businessTypeId: "music",
    metaTitle: "Sistema de Turnos para Clases de Música y Academias Musicales | MyStack",
    metaDescription:
      "El software de gestión más completo para academias de música en Argentina. Agenda online para clases de guitarra, piano, canto y más. Recordatorios automáticos. Gratis para empezar.",
    breadcrumbLabel: "Música & Estudios",
    businessNoun: "academia de música",
    h1: "Sistema de turnos online para clases de música y academias",
    tagline: "Software de gestión para academias musicales argentinas",
    intro:
      "MyStack organiza toda la agenda de tu academia de música o clases de instrumento para que dejes de perder tiempo coordinando horarios por mensajes. Tus alumnos reservan clases de guitarra, piano, canto, batería o cualquier instrumento online, eligen al profesor y el horario disponible desde el celular. Gestioná múltiples docentes con agendas independientes, reducí ausencias con recordatorios automáticos y concentrate en transmitir tu pasión por la música.",
    unsplashId: "1514320291840-2e0a9bf2a9ae",
    unsplashAlt: "Clase de música con guitarra en una academia argentina",
    accentColor: "text-violet-700",
    accentBg: "bg-violet-500",
    accentLight: "bg-violet-50",
    keywords: [
      "sistema de turnos academia de música",
      "agenda online clases de música argentina",
      "software academia musical argentina",
      "turnos clases de guitarra piano",
      "gestión academia de música",
      "reservas clases de música online",
      "app gestión academia musical",
      "agenda digital clases de música",
      "software profesor de música",
      "turnos academia música gratis",
      "digitalizar academia musical argentina",
      "sistema reservas clases instrumento",
    ],
    features: [
      {
        title: "Reservas de clases de música online",
        description:
          "Tus alumnos eligen instrumento, horario y profesor desde el celular. Sin mensajes de coordinación, sin idas y vueltas, sin confusiones de horario.",
        Icon: Calendar,
      },
      {
        title: "Equipo de profesores musicales",
        description:
          "Gestioná a todos los profesores de tu academia con agendas independientes. Cada docente maneja sus propios alumnos, instrumentos y horarios.",
        Icon: Users,
      },
      {
        title: "Recordatorios automáticos para alumnos",
        description:
          "Notificaciones automáticas antes de cada clase para que tus alumnos lleguen preparados, con su instrumento, y no falten sin aviso.",
        Icon: Bell,
      },
      {
        title: "Horarios por instrumento y docente",
        description:
          "Configurá disponibilidades distintas por instrumento y profesor. Un docente puede dar guitarra martes y jueves, y canto los sábados.",
        Icon: Clock,
      },
      {
        title: "Página de tu academia musical",
        description:
          "Tu academia tiene su propia URL pública. Compartila en redes sociales o WhatsApp para que nuevos alumnos encuentren y reserven clases fácilmente.",
        Icon: Link2,
      },
      {
        title: "Estadísticas de la academia",
        description:
          "Analizá qué instrumentos tienen más demanda, el rendimiento de cada docente y las tendencias de inscripción para tomar mejores decisiones.",
        Icon: BarChart2,
      },
      {
        title: "Sin app para tus alumnos",
        description:
          "Tus alumnos reservan desde cualquier navegador sin descargar nada. Funciona perfecto desde el celular, ideal para alumnos jóvenes y sus padres.",
        Icon: Smartphone,
      },
      {
        title: "Cobros de clases con MercadoPago (próx.)",
        description:
          "Muy pronto podrás cobrar las clases al momento de la reserva vía MercadoPago, garantizando la asistencia de tus alumnos de manera anticipada.",
        Icon: CreditCard,
      },
    ],
    faq: [
      {
        q: "¿Puedo gestionar clases de distintos instrumentos (guitarra, piano, canto, batería)?",
        a: "Sí. Cada instrumento o tipo de clase se configura como un servicio con su duración y precio. Tus alumnos ven toda la oferta de tu academia al momento de reservar.",
      },
      {
        q: "¿Funciona para academias grandes con muchos profesores?",
        a: "Perfecto. En el Plan Profesional podés agregar docentes ilimitados, cada uno con su propia agenda y disponibilidad horaria, sin límite de instrumentos.",
      },
      {
        q: "¿Puedo configurar una clase de prueba gratuita?",
        a: "Sí. Podés crear un servicio llamado \u2018Clase de prueba\u2019 con precio $0 y la duración que quieras. Es la mejor estrategia para captar nuevos alumnos sin barreras.",
      },
      {
        q: "¿Los alumnos pueden cancelar o reprogramar su clase de música?",
        a: "Sí. Los alumnos reciben un email de confirmación con un link para cancelar si es necesario. El horario se libera automáticamente para otro alumno.",
      },
      {
        q: "¿Puedo bloquear las vacaciones de verano o semanas de exámenes?",
        a: "Sí. Podés crear bloqueos de tiempo en cualquier parte de la agenda de cada docente para indicar que no hay clases en esas fechas.",
      },
      {
        q: "¿Cómo comparto el link de reservas de mi academia musical?",
        a: "Recibís una URL única que podés compartir en Instagram, Facebook, WhatsApp o en tu sitio web. Los alumnos potenciales hacen click y reservan su clase al instante.",
      },
      {
        q: "¿Los alumnos reciben recordatorio antes de la clase?",
        a: "Sí. El sistema envía automáticamente un recordatorio por email antes de cada clase para que los alumnos no olviden el horario ni lleguen sin su instrumento.",
      },
      {
        q: "¿Cuánto cuesta para una academia de música?",
        a: "MyStack tiene un plan 100% gratuito con hasta 150 reservas mensuales y 1 docente, ideal para arrancar. El Plan Profesional con docentes ilimitados es accesible. Consultá los precios en mystack.com.ar/#pricing.",
      },
    ],
    ctaText: "Gestioná tu academia gratis",
  },

  consultoria: {
    slug: "consultoria",
    businessTypeId: "consulting",
    metaTitle: "Sistema de Turnos Online para Consultores y Profesionales Independientes | MyStack",
    metaDescription:
      "El software de agenda más profesional para consultores, coaches, abogados y contadores en Argentina. Reservas online, recordatorios automáticos y cobros integrados. Gratis para comenzar.",
    breadcrumbLabel: "Consultoría",
    businessNoun: "consultoría",
    h1: "Sistema de turnos online para consultores y profesionales independientes",
    tagline: "Software de agenda para consultores y profesionales argentinos",
    intro:
      "Si sos consultor, coach, abogado, contador, psicólogo o cualquier profesional que atiende clientes por turnos, MyStack elimina el tiempo perdido en coordinar reuniones. Tus clientes reservan consultas, asesorías o sesiones online directamente desde tu página personalizada, reciben confirmación instantánea y vos tenés tu agenda siempre organizada y accesible desde cualquier dispositivo, sin más emails o llamadas para agendar.",
    unsplashId: "1600880292203-757bb62b4baf",
    unsplashAlt: "Reunión de consultoría profesional en una oficina moderna argentina",
    accentColor: "text-cyan-700",
    accentBg: "bg-cyan-600",
    accentLight: "bg-cyan-50",
    keywords: [
      "sistema de turnos para consultores",
      "agenda online profesionales independientes argentina",
      "software gestión consultoría",
      "turnos online coach profesional",
      "agenda digital abogado contador",
      "reservas online consultoría argentina",
      "app agenda profesional argentina",
      "sistema turnos psicólogo coach",
      "software consultor independiente",
      "turnos profesionales gratis argentina",
      "digitalizar agenda profesional",
      "sistema reservas consultoría",
    ],
    features: [
      {
        title: "Agenda de reuniones y consultas online",
        description:
          "Tus clientes reservan consultas, asesorías o sesiones directamente desde tu página personalizada, a cualquier hora, sin coordinación manual.",
        Icon: Calendar,
      },
      {
        title: "Gestión precisa de tu disponibilidad",
        description:
          "Configurá exactamente los días y horarios en que recibís clientes. El sistema solo muestra los slots realmente disponibles, sin sorpresas.",
        Icon: Clock,
      },
      {
        title: "Recordatorios automáticos",
        description:
          "Tanto vos como tu cliente reciben una notificación antes de la reunión para asegurar que nadie olvide el compromiso.",
        Icon: Bell,
      },
      {
        title: "Imagen profesional desde el primer contacto",
        description:
          "Presentá una imagen sólida con una página de reservas personalizada con el nombre y logo de tu consultoría o estudio profesional.",
        Icon: Shield,
      },
      {
        title: "Página personalizada de tu consultoría",
        description:
          "Tu consultoría tiene su propia URL. Agregála en tu firma de email, LinkedIn, sitio web o tarjeta digital para recibir reservas 24/7.",
        Icon: Link2,
      },
      {
        title: "Estadísticas de tus reuniones",
        description:
          "Analizá cuántas consultas tuviste, qué servicios tienen más demanda y las tendencias semanales para optimizar tu agenda profesional.",
        Icon: BarChart2,
      },
      {
        title: "Sin app para tus clientes",
        description:
          "Tus clientes reservan desde cualquier navegador sin descargar nada. Ideal para clientes corporativos que prefieren soluciones ágiles.",
        Icon: Smartphone,
      },
      {
        title: "Cobros de honorarios online (próx.)",
        description:
          "Muy pronto podrás cobrar consultas o señas al momento de la reserva vía MercadoPago, agilizando el proceso y confirmando el compromiso.",
        Icon: CreditCard,
      },
    ],
    faq: [
      {
        q: "¿Puedo ofrecer distintos tipos de consultas con duraciones diferentes?",
        a: "Sí. Configurás cada tipo de servicio (consulta inicial de 30 min, sesión completa de 60 min, asesoría de 90 min) con su duración y precio independiente.",
      },
      {
        q: "¿Funciona para profesionales que atienden de manera presencial y online?",
        a: "Podés agregar la modalidad (presencial/virtual) y las indicaciones de acceso en la descripción de cada servicio para que tus clientes siempre estén informados.",
      },
      {
        q: "¿Puedo cobrar la consulta al momento de la reserva?",
        a: "¡Próximamente! Estamos desarrollando la integración con MercadoPago para cobrar honorarios o señas al reservar. Por ahora podés coordinar el cobro presencialmente o por transferencia.",
      },
      {
        q: "¿Cómo comparto mi página de reservas profesional?",
        a: "Recibís una URL única del estilo mystack.com.ar/tu-consultoria. Podés agregarla en tu firma de email, LinkedIn, perfil de redes sociales o tarjeta de presentación.",
      },
      {
        q: "¿Los clientes reciben confirmación de su consulta?",
        a: "Sí. Al reservar, los clientes reciben automáticamente un email de confirmación con todos los detalles y un recordatorio antes de la fecha de la reunión.",
      },
      {
        q: "¿Puedo bloquear días de viaje o cuando no estoy disponible?",
        a: "Sí. Podés crear bloqueos en tu agenda para días, rangos de fechas o franjas horarias específicas. Tus clientes solo ven los horarios realmente disponibles.",
      },
      {
        q: "¿Funciona para equipos de consultores o estudios jurídicos?",
        a: "Sí. En el Plan Profesional podés agregar múltiples profesionales, cada uno con su propia agenda. Los clientes eligen con qué profesional quieren reunirse.",
      },
      {
        q: "¿Cuánto cuesta para un consultor independiente?",
        a: "MyStack tiene un plan 100% gratuito con hasta 150 reservas mensuales y 1 profesional, ideal para consultores independientes. El Plan Profesional es accesible. Consultá los precios en mystack.com.ar/#pricing.",
      },
    ],
    ctaText: "Profesionalizá tu agenda hoy",
  },
};

/** Ordered list of slugs for footer links */
export const RUBRO_SLUGS = Object.keys(RUBRO_PAGES);
