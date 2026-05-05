import prisma from "@/lib/prisma";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ActivePromotion {
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: string;
  name: string;
  code: string | null;
  endsAt: string | null;
}

async function getPlansWithPromotions() {
  const [plans, promotions] = await Promise.all([
    prisma.planConfig.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.promotion.findMany({
      where: {
        isActive: true,
        startsAt: { lte: new Date() },
        OR: [{ endsAt: null }, { endsAt: { gte: new Date() } }],
      },
    }),
  ]);

  return { plans, promotions };
}

function applyDiscount(price: number, promo: ActivePromotion): number {
  const value = parseFloat(promo.discountValue);
  if (promo.discountType === "PERCENTAGE") {
    return price - (price * value) / 100;
  }
  return Math.max(0, price - value);
}

function formatPrice(amount: number): string {
  if (amount === 0) return "$0";
  return `$${amount.toLocaleString("es-AR")}`;
}

function daysUntil(dateStr: string): number {
  const end = new Date(dateStr);
  const now = new Date();
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export async function PricingSection() {
  const { plans, promotions } = await getPlansWithPromotions();

  // Fallback si no hay planes configurados aún
  const displayPlans =
    plans.length > 0
      ? plans
      : [
          {
            id: "free-default",
            plan: "FREE" as const,
            name: "Gratuito",
            description: "Ideal para empezar",
            price: "0",
            maxReservationsPerMonth: 150,
            maxStaff: 1,
            features: [
              "1 profesional",
              "Hasta 150 reservas/mes",
              "Página de reservas con tu URL",
              "Notificaciones por email",
              "Calendario de disponibilidad",
            ],
            isActive: true,
            sortOrder: 0,
          },
          {
            id: "pro-default",
            plan: "PRO" as const,
            name: "Profesional",
            description: "Para negocios en crecimiento",
            price: "15000",
            maxReservationsPerMonth: null,
            maxStaff: null,
            features: [
              "Staff ilimitado",
              "Reservas ilimitadas",
              "Recordatorios automáticos",
              "Reportes y estadísticas",
              "Sin marca MyStack",
              "Soporte prioritario WhatsApp",
            ],
            isActive: true,
            sortOrder: 1,
          },
        ];

  return (
    <section id="pricing" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Planes simples y transparentes
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Elige el plan que mejor se adapte a tu negocio. Sin costos ocultos.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto justify-items-center">
          {displayPlans.map((plan) => {
          const isPro = plan.plan === "PRO" || plan.plan === "PREMIUM";
            const basePrice = parseFloat(plan.price);

            // Buscar promoción activa que aplique a este plan
            const activePromo = promotions.find((p) =>
              (p.appliesTo as string[]).includes(plan.plan)
            ) as ActivePromotion | undefined;

            const discountedPrice = activePromo
              ? applyDiscount(basePrice, activePromo)
              : null;

            const features = Array.isArray(plan.features)
              ? (plan.features as string[])
              : [];

            const limits: string[] = [];
            if (plan.maxReservationsPerMonth !== null) {
              limits.push(`Hasta ${plan.maxReservationsPerMonth.toLocaleString("es-AR")} reservas/mes`);
            } else {
              limits.push("Reservas ilimitadas");
            }
            if (plan.maxStaff !== null) {
              limits.push(`${plan.maxStaff} profesional${plan.maxStaff !== 1 ? "es" : ""}`);
            } else {
              limits.push("Staff ilimitado");
            }

            const allFeatures = [...limits, ...features.filter(
              (f) => !f.toLowerCase().includes("reserva") && !f.toLowerCase().includes("staff") && !f.toLowerCase().includes("profesional")
            )];

            return (
              <DynamicPricingCard
                key={plan.id}
                plan={plan.plan}
                name={plan.name}
                description={plan.description ?? ""}
                price={basePrice}
                discountedPrice={discountedPrice}
                features={allFeatures}
                promotion={activePromo ?? null}
                popular={isPro}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

function DynamicPricingCard({
  plan,
  name,
  description,
  price,
  discountedPrice,
  features,
  promotion,
  popular,
}: {
  plan: string;
  name: string;
  description: string;
  price: number;
  discountedPrice: number | null;
  features: string[];
  promotion: ActivePromotion | null;
  popular?: boolean;
}) {
  const isFree = price === 0;
  const hasDiscount = discountedPrice !== null && discountedPrice !== price;
  const finalPrice = hasDiscount ? discountedPrice! : price;
  const daysLeft = promotion?.endsAt ? daysUntil(promotion.endsAt) : null;

  return (
    <Card
      className={`relative overflow-visible border-2 ${
        popular
          ? "border-[oklch(0.65_0.14_175)] shadow-xl shadow-[oklch(0.65_0.14_175)]/20"
          : "border-slate-200"
      }`}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-[oklch(0.65_0.14_175)] to-[oklch(0.62_0.18_250)] text-white text-sm font-medium rounded-full whitespace-nowrap">
          Más Popular
        </div>
      )}
      <CardContent className="p-6 pt-8">
        <h3 className="text-xl font-semibold text-slate-900 mb-1">{name}</h3>
        <p className="text-sm text-slate-500 mb-4">{description}</p>

        {/* Price display */}
        <div className="mb-2">
          {isFree ? (
            <span className="text-4xl font-bold text-slate-900">Gratis</span>
          ) : hasDiscount ? (
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-slate-900">
                {formatPrice(finalPrice)}
              </span>
              <span className="text-slate-500 line-through text-lg">
                {formatPrice(price)}
              </span>
              <span className="text-slate-500 text-sm">/mes</span>
            </div>
          ) : (
            <div>
              <span className="text-4xl font-bold text-slate-900">
                {formatPrice(price)}
              </span>
              <span className="text-slate-500">/mes</span>
            </div>
          )}
        </div>

        {/* Promotion badge */}
        {promotion && (
          <div className="mb-4 space-y-1.5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 border border-orange-200 px-3 py-1 text-xs font-semibold text-orange-700">
              🎉{" "}
              {promotion.discountType === "PERCENTAGE"
                ? `${parseFloat(promotion.discountValue)}% OFF`
                : `-${formatPrice(parseFloat(promotion.discountValue))}`}
              {" "}· {promotion.name}
              {promotion.code && (
                <Badge className="ml-1 bg-orange-600 text-white text-xs px-1.5 py-0 font-mono">
                  {promotion.code}
                </Badge>
              )}
            </div>
            {daysLeft !== null && daysLeft <= 7 && (
              <p className="text-xs text-orange-600 font-medium">
                ⏰ Termina en {daysLeft} día{daysLeft !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        )}

        <ul className="space-y-3 mb-8">
          {features.map((feature, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
              <CheckCircle2 className="w-4 h-4 text-[oklch(0.65_0.14_175)] shrink-0" />
              {feature}
            </li>
          ))}
        </ul>

        <Link href="/register" className="block">
          <Button
            className={`w-full ${
              popular
                ? "bg-gradient-to-r from-[oklch(0.65_0.14_175)] to-[oklch(0.62_0.18_250)] hover:opacity-90 text-white"
                : "border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
            variant={popular ? "default" : "outline"}
          >
            {isFree ? "Comenzar Gratis" : "Comenzar Prueba"}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
