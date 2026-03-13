# MyStack 📅

Sistema SaaS de gestión de turnos y citas online. Permite a negocios crear su propia página de reservas donde sus clientes pueden agendar turnos 24/7.

## 🚀 Demo

Cada negocio tiene su página pública en: `tudominio.com/nombre-del-negocio`

## ✨ Características

### Para Negocios (Dashboard)
- ✅ Gestión de servicios (nombre, duración, precio)
- ✅ Configuración de horarios de atención
- ✅ Gestión de equipo/empleados
- ✅ Vista de calendario con turnos
- ✅ Confirmación/cancelación de turnos
- ✅ Estadísticas básicas

### Para Clientes
- ✅ Página de reservas personalizada
- ✅ Selección de servicio y horario
- ✅ Ver disponibilidad en tiempo real
- ✅ Confirmación por email

### Próximamente
- [ ] Notificaciones por email (Resend)
- [ ] Recordatorios automáticos
- [ ] Pagos online (Stripe)
- [ ] Dominio personalizado
- [ ] Integraciones (Google Calendar, WhatsApp)

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js v5
- **Styling**: Tailwind CSS + shadcn/ui
- **Hosting**: Vercel

## 📦 Instalación

### Prerrequisitos
- Node.js 18+
- PostgreSQL (local o cloud: Supabase, Neon, Vercel Postgres)

### Setup

1. **Clonar e instalar dependencias**
```bash
git clone <tu-repo>
cd turnosweb
npm install
```

2. **Configurar variables de entorno**
```bash
cp .env.example .env
```

Edita `.env` con tus valores:
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="genera-con-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

3. **Configurar base de datos**
```bash
# Generar cliente Prisma
npx prisma generate

# Crear tablas en la DB
npx prisma db push

# (Opcional) Abrir Prisma Studio para ver datos
npx prisma studio
```

4. **Iniciar servidor de desarrollo**
```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## 🚀 Deploy en Vercel

1. Sube tu código a GitHub
2. Importa el proyecto en [Vercel](https://vercel.com)
3. Configura las variables de entorno:
   - `DATABASE_URL` (usa Vercel Postgres o Supabase)
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (tu dominio de Vercel)
4. Deploy! 🎉

### Base de datos recomendada para producción
- [Vercel Postgres](https://vercel.com/storage/postgres) - Integración nativa
- [Supabase](https://supabase.com) - Tier gratuito generoso
- [Neon](https://neon.tech) - Serverless PostgreSQL

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── api/              # API Routes
│   │   ├── auth/         # NextAuth endpoints
│   │   ├── appointments/ # CRUD turnos
│   │   ├── services/     # CRUD servicios
│   │   ├── staff/        # CRUD equipo
│   │   └── business/     # Config negocio
│   ├── dashboard/        # Panel de admin
│   │   ├── appointments/ # Gestión de turnos
│   │   ├── services/     # Gestión de servicios
│   │   ├── staff/        # Gestión de equipo
│   │   ├── schedule/     # Config horarios
│   │   └── settings/     # Configuración
│   ├── [slug]/           # Página pública del negocio
│   ├── login/            # Login
│   ├── register/         # Registro
│   └── page.tsx          # Landing page
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── dashboard/        # Componentes del dashboard
│   └── booking/          # Componentes de reserva
├── lib/
│   ├── auth.ts           # Config NextAuth
│   ├── prisma.ts         # Cliente Prisma
│   └── utils.ts          # Utilidades
└── types/                # TypeScript types
```

## 🔧 Scripts

```bash
npm run dev      # Desarrollo
npm run build    # Build producción
npm run start    # Iniciar producción
npm run lint     # Linter
```

## 📝 Licencia

MIT

---

Hecho con ❤️ usando Next.js y Vercel
