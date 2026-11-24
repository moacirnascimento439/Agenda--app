// =============================================================================
// Envio de e-mails (Resend)
//
// Sem RESEND_API_KEY no .env, os e-mails são apenas exibidos no terminal.
// Assim você consegue desenvolver sem criar conta em lugar nenhum.
// =============================================================================
import { Resend } from "resend";
import type { Appointment, Business, Customer, Professional, Service } from "@prisma/client";
import { formatDateTime } from "./time";
import { formatPrice, PAYMENT_POLICY_LABEL } from "@/lib/utils";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM || "Agendaí <onboarding@resend.dev>";
const APP_URL = process.env.APP_URL || "http://localhost:3000";

async function sendEmail(to: string, subject: string, html: string) {
  if (!resend) {
    console.log(`\n📧 [e-mail simulado] Para: ${to}\n   Assunto: ${subject}\n`);
    return;
  }
  const { error } = await resend.emails.send({ from: FROM, to, subject, html });
  // Falha no e-mail não deve desfazer o agendamento: só registramos o erro.
  if (error) console.error("Falha ao enviar e-mail:", error);
}

// Evita que um nome como "<script>" vire código dentro do e-mail
const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

type FullAppointment = Appointment & { service: Service; professional: Professional; customer: Customer };

export async function sendBookingConfirmation(business: Business, a: FullAppointment) {
  const link = `${APP_URL}/agendamento/${a.publicToken}`;
  const when = formatDateTime(a.startsAt, business.timezone);
  const html = `
  <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#18181b">
    <h2 style="color:${business.primaryColor}">Agendamento confirmado ✅</h2>
    <p>Olá, ${esc(a.customer.name)}! Seu horário em <b>${esc(business.name)}</b> está confirmado.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:6px 0;color:#71717a">Serviço</td><td><b>${esc(a.service.name)}</b></td></tr>
      <tr><td style="padding:6px 0;color:#71717a">Quando</td><td><b>${when}</b></td></tr>
      <tr><td style="padding:6px 0;color:#71717a">Profissional</td><td>${esc(a.professional.name)}</td></tr>
      <tr><td style="padding:6px 0;color:#71717a">Valor</td><td>${formatPrice(a.priceCents)} · ${PAYMENT_POLICY_LABEL[a.paymentPolicy]}</td></tr>
      <tr><td style="padding:6px 0;color:#71717a">Endereço</td><td>${esc(business.address)}, ${esc(business.city)}</td></tr>
    </table>
    <p><a href="${link}" style="background:${business.primaryColor};color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Ver meu agendamento</a></p>
    <p style="font-size:12px;color:#71717a">Política de cancelamento: ${esc(business.refundPolicy)}</p>
  </div>`;
  await sendEmail(a.customer.email, `Agendamento confirmado — ${business.name}`, html);
}
