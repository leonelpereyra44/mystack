import { MercadoPagoConfig, PreApproval, PreApprovalPlan, Payment, PaymentRefund } from "mercadopago";

// Configuración del cliente de Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

// Instancias de los servicios
export const preApproval = new PreApproval(client);
export const preApprovalPlan = new PreApprovalPlan(client);
export const payment = new Payment(client);
export const paymentRefund = new PaymentRefund(client);

// Constantes de planes
export const PLANS = {
  FREE: {
    name: "Gratuito",
    price: 0,
    maxReservations: 150,
    maxStaff: 1,
    features: [
      "1 profesional",
      "Hasta 150 reservas/mes",
      "Página de reservas con tu URL",
      "Notificaciones por email",
      "Calendario de disponibilidad",
      "Soporte por email",
    ],
  },
  PRO: {
    name: "Profesional",
    price: 15000, // $15.000 ARS
    maxReservations: Infinity,
    maxStaff: Infinity,
    features: [
      "Staff ilimitado",
      "Reservas ilimitadas",
      "Recordatorios automáticos",
      "Reportes y estadísticas",
      "Sin marca MyStack",
      "Soporte prioritario WhatsApp",
    ],
  },
} as const;

export type PlanType = keyof typeof PLANS;

// URLs de retorno
const BASE_URL = process.env.NEXTAUTH_URL || "https://mystack.com.ar";

export const MP_URLS = {
  success: `${BASE_URL}/dashboard/settings?subscription=success`,
  failure: `${BASE_URL}/dashboard/settings?subscription=error`,
  pending: `${BASE_URL}/dashboard/settings?subscription=pending`,
  webhook: `${BASE_URL}/api/webhooks/mercadopago`,
};

// Crear una suscripción de Mercado Pago
export async function createSubscription(params: {
  payerEmail: string;
  externalReference: string; // businessId
}) {
  try {
    const response = await preApproval.create({
      body: {
        reason: "MyStack Plan Profesional",
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: PLANS.PRO.price,
          currency_id: "ARS",
        },
        payer_email: params.payerEmail,
        external_reference: params.externalReference,
        back_url: MP_URLS.success,
        status: "pending",
      },
    });

    return {
      success: true,
      subscriptionId: response.id,
      initPoint: response.init_point,
    };
  } catch (error) {
    console.error("Error creating MP subscription:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Cancelar una suscripción
export async function cancelSubscription(subscriptionId: string) {
  try {
    await preApproval.update({
      id: subscriptionId,
      body: {
        status: "cancelled",
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error cancelling MP subscription:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Obtener estado de una suscripción
export async function getSubscriptionStatus(subscriptionId: string) {
  try {
    const response = await preApproval.get({ id: subscriptionId });
    
    return {
      success: true,
      status: response.status,
      nextPaymentDate: response.next_payment_date,
      lastModified: response.last_modified,
    };
  } catch (error) {
    console.error("Error getting MP subscription:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Constante para el plazo de derecho de arrepentimiento (Ley 24.240)
export const REFUND_PERIOD_DAYS = 10;

// Reembolsar un pago (para derecho de arrepentimiento)
export async function refundPayment(paymentId: string) {
  try {
    // Mercado Pago SDK v2 usa PaymentRefund para reembolsos
    const response = await paymentRefund.create({
      payment_id: paymentId,
      body: {},
    });

    return {
      success: true,
      refundId: response.id,
      status: response.status,
      amount: response.amount,
    };
  } catch (error) {
    console.error("Error refunding payment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al procesar el reembolso",
    };
  }
}

// Verificar si una suscripción es elegible para reembolso por arrepentimiento
export function isEligibleForRefund(currentPeriodStart: Date | null | undefined): boolean {
  if (!currentPeriodStart) return false;
  
  const now = new Date();
  const startDate = new Date(currentPeriodStart);
  const diffTime = now.getTime() - startDate.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  
  return diffDays <= REFUND_PERIOD_DAYS;
}

// Obtener días restantes para solicitar reembolso
export function getDaysLeftForRefund(currentPeriodStart: Date | null | undefined): number {
  if (!currentPeriodStart) return 0;
  
  const startDate = new Date(currentPeriodStart);
  const deadline = new Date(startDate.getTime() + REFUND_PERIOD_DAYS * 24 * 60 * 60 * 1000);
  const now = new Date();
  
  const diffTime = deadline.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
}
