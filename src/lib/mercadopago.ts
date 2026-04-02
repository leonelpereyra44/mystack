import { MercadoPagoConfig, PreApproval, PreApprovalPlan, Payment } from "mercadopago";

// Configuración del cliente de Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

// Instancias de los servicios
export const preApproval = new PreApproval(client);
export const preApprovalPlan = new PreApprovalPlan(client);
export const payment = new Payment(client);

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
    price: 1000, // $1.000 ARS (temporal para testing)
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
