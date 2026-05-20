import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock Resend ──────────────────────────────────────────────────────────────
// vi.hoisted ensures mockSend is available inside the vi.mock factory (which is hoisted)
const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }));

vi.mock("resend", () => ({
  Resend: vi.fn(function () {
    return { emails: { send: mockSend } };
  }),
}));

import {
  sendAppointmentConfirmation,
  sendAppointmentPendingConfirmation,
  sendAppointmentCancellation,
  sendContactEmail,
} from "@/lib/email";

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const baseAppointment = {
  customerName: "Juan Pérez",
  customerEmail: "juan@example.com",
  businessName: "Barbería Central",
  serviceName: "Corte de cabello",
  staffName: "Carlos",
  date: "lunes 20 de mayo de 2026",
  startTime: "10:00",
  endTime: "10:30",
  appointmentId: "apt-123",
  businessAddress: "Av. Corrientes 1234",
  businessPhone: "+54 11 1234-5678",
};

beforeEach(() => {
  vi.resetAllMocks();
  mockSend.mockResolvedValue({ data: { id: "email-id-1" }, error: null });
  delete process.env.NEXTAUTH_URL;
  delete process.env.VERCEL_URL;
  delete process.env.EMAIL_FROM;
});

// ─── sendAppointmentConfirmation ──────────────────────────────────────────────
describe("sendAppointmentConfirmation", () => {
  it("llama a resend con el destinatario y asunto correctos", async () => {
    const result = await sendAppointmentConfirmation(baseAppointment);

    expect(mockSend).toHaveBeenCalledOnce();
    const call = mockSend.mock.calls[0][0];
    expect(call.to).toBe("juan@example.com");
    expect(call.subject).toContain("Barbería Central");
    expect(call.subject).toContain("confirmado");
    expect(result).toEqual({ success: true, data: { data: { id: "email-id-1" }, error: null } });
  });

  it("el HTML contiene los datos del turno", async () => {
    await sendAppointmentConfirmation(baseAppointment);

    const { html } = mockSend.mock.calls[0][0];
    expect(html).toContain("Juan Pérez");
    expect(html).toContain("Barbería Central");
    expect(html).toContain("Corte de cabello");
    expect(html).toContain("Carlos");
    expect(html).toContain("10:00");
    expect(html).toContain("10:30");
    expect(html).toContain("Av. Corrientes 1234");
    expect(html).toContain("+54 11 1234-5678");
  });

  it("incluye URLs de cancelar y reprogramar con el appointmentId", async () => {
    process.env.NEXTAUTH_URL = "https://myapp.com";
    await sendAppointmentConfirmation(baseAppointment);

    const { html } = mockSend.mock.calls[0][0];
    expect(html).toContain("https://myapp.com/appointments/apt-123/cancel");
    expect(html).toContain("https://myapp.com/appointments/apt-123/reschedule");
  });

  it("omite el profesional del HTML si no se provee staffName", async () => {
    await sendAppointmentConfirmation({ ...baseAppointment, staffName: undefined });

    const { html } = mockSend.mock.calls[0][0];
    expect(html).not.toContain("Profesional");
  });

  it("usa EMAIL_FROM del entorno si está definido", async () => {
    process.env.EMAIL_FROM = "Custom <custom@example.com>";
    await sendAppointmentConfirmation(baseAppointment);

    expect(mockSend.mock.calls[0][0].from).toBe("Custom <custom@example.com>");
  });

  it("retorna { success: false } si Resend lanza un error", async () => {
    mockSend.mockRejectedValue(new Error("API Error"));

    const result = await sendAppointmentConfirmation(baseAppointment);

    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(Error);
  });
});

// ─── sendAppointmentPendingConfirmation ───────────────────────────────────────
describe("sendAppointmentPendingConfirmation", () => {
  const pendingData = {
    ...baseAppointment,
    confirmationToken: "tok-abc-123",
    expiresInMinutes: 30,
  };

  it("llama a resend con el destinatario y asunto correctos", async () => {
    const result = await sendAppointmentPendingConfirmation(pendingData);

    expect(mockSend).toHaveBeenCalledOnce();
    const call = mockSend.mock.calls[0][0];
    expect(call.to).toBe("juan@example.com");
    expect(call.subject).toContain("Barbería Central");
    expect(result.success).toBe(true);
  });

  it("construye la URL de confirmación con NEXTAUTH_URL", async () => {
    process.env.NEXTAUTH_URL = "https://myapp.com";
    await sendAppointmentPendingConfirmation(pendingData);

    const { html } = mockSend.mock.calls[0][0];
    expect(html).toContain(
      "https://myapp.com/appointments/apt-123/confirm/tok-abc-123"
    );
  });

  it("construye la URL de confirmación con VERCEL_URL como fallback", async () => {
    process.env.VERCEL_URL = "myapp.vercel.app";
    await sendAppointmentPendingConfirmation(pendingData);

    const { html } = mockSend.mock.calls[0][0];
    expect(html).toContain(
      "https://myapp.vercel.app/appointments/apt-123/confirm/tok-abc-123"
    );
  });

  it("usa localhost como fallback si no hay variables de entorno", async () => {
    await sendAppointmentPendingConfirmation(pendingData);

    const { html } = mockSend.mock.calls[0][0];
    expect(html).toContain(
      "http://localhost:3000/appointments/apt-123/confirm/tok-abc-123"
    );
  });

  it("muestra los minutos de expiración en el HTML", async () => {
    await sendAppointmentPendingConfirmation(pendingData);

    const { html } = mockSend.mock.calls[0][0];
    expect(html).toContain("30");
  });

  it("retorna { success: false } si Resend lanza un error", async () => {
    mockSend.mockRejectedValue(new Error("Network Error"));

    const result = await sendAppointmentPendingConfirmation(pendingData);

    expect(result.success).toBe(false);
  });
});

// ─── sendAppointmentCancellation ─────────────────────────────────────────────
describe("sendAppointmentCancellation", () => {
  it("llama a resend con el destinatario y asunto correctos", async () => {
    const result = await sendAppointmentCancellation(baseAppointment);

    expect(mockSend).toHaveBeenCalledOnce();
    const call = mockSend.mock.calls[0][0];
    expect(call.to).toBe("juan@example.com");
    expect(call.subject).toContain("cancelado");
    expect(call.subject).toContain("Barbería Central");
    expect(result.success).toBe(true);
  });

  it("el HTML contiene los datos del turno cancelado", async () => {
    await sendAppointmentCancellation(baseAppointment);

    const { html } = mockSend.mock.calls[0][0];
    expect(html).toContain("Juan Pérez");
    expect(html).toContain("Barbería Central");
    expect(html).toContain("Corte de cabello");
    expect(html).toContain("10:00");
  });

  it("retorna { success: false } si Resend lanza un error", async () => {
    mockSend.mockRejectedValue(new Error("API Error"));

    const result = await sendAppointmentCancellation(baseAppointment);

    expect(result.success).toBe(false);
  });
});

// ─── sendContactEmail ─────────────────────────────────────────────────────────
describe("sendContactEmail", () => {
  const contactData = {
    name: "Ana García",
    email: "ana@example.com",
    category: "Soporte técnico",
    subject: "No puedo acceder",
    message: "Tengo un problema para iniciar sesión.",
  };

  it("envía exactamente 2 emails (al equipo y al usuario)", async () => {
    await sendContactEmail(contactData);

    expect(mockSend).toHaveBeenCalledTimes(2);
  });

  it("el primer email va al equipo de soporte con replyTo del usuario", async () => {
    await sendContactEmail(contactData);

    const supportCall = mockSend.mock.calls[0][0];
    expect(supportCall.to).toBe("contacto@mystack.com.ar");
    expect(supportCall.replyTo).toBe("ana@example.com");
    expect(supportCall.subject).toContain("Soporte técnico");
    expect(supportCall.subject).toContain("No puedo acceder");
  });

  it("el segundo email va al usuario como confirmación", async () => {
    await sendContactEmail(contactData);

    const userCall = mockSend.mock.calls[1][0];
    expect(userCall.to).toBe("ana@example.com");
    expect(userCall.subject).toContain("MyStack");
  });

  it("el email al soporte contiene el mensaje del usuario", async () => {
    await sendContactEmail(contactData);

    const { html } = mockSend.mock.calls[0][0];
    expect(html).toContain("Ana García");
    expect(html).toContain("ana@example.com");
    expect(html).toContain("Tengo un problema para iniciar sesión.");
  });

  it("retorna { success: false } si el primer envío falla", async () => {
    mockSend.mockRejectedValue(new Error("API Error"));

    const result = await sendContactEmail(contactData);

    expect(result.success).toBe(false);
  });
});
