// =============================================================================
// Criação de agendamento — a operação mais sensível do sistema.
//
// Problema clássico: duas pessoas veem o horário 14:00 livre e clicam em
// "Confirmar" ao mesmo tempo. Sem cuidado, as duas conseguem agendar.
//
// Usamos TRÊS camadas de proteção:
//   1. Recalculamos a disponibilidade no servidor (nunca confiamos na tela).
//   2. Dentro de uma transação, pegamos um "cadeado" (advisory lock) do
//      PostgreSQL para aquele profissional: quem chegar depois espera o
//      primeiro terminar e então vê o horário ocupado.
//   3. A constraint "Appointment_no_overlap" no banco recusa qualquer
//      sobreposição que tenha escapado das camadas anteriores.
// =============================================================================
import { Prisma, type Business } from "@prisma/client";
import { z } from "zod";
import { db } from "./db";
import { ApiError } from "./api";
import { blockingWhere, getAvailability } from "./availability";
import { toLocalDateStr } from "./time";
import { appointmentsThisMonth, limitsFor } from "./plans";
import { bookingSchema } from "./validators";

export const CONSENT_VERSION = "2026-11-v1";

type BookingInput = z.infer<typeof bookingSchema>;

export async function createAppointment(
  business: Business,
  input: BookingInput,
  meta: { ip?: string; userAgent?: string | null },
) {
  // Limite do plano gratuito
  const limit = limitsFor(business).appointmentsPerMonth;
  if (Number.isFinite(limit) && (await appointmentsThisMonth(business.id)) >= limit) {
    throw new ApiError(403, "Este negócio não está aceitando novos agendamentos online no momento.");
  }

  // 1) Recalcula a disponibilidade para o dia escolhido
  const date = toLocalDateStr(input.startsAt, business.timezone);
  const { service, slots } = await getAvailability({
    business,
    serviceId: input.serviceId,
    date,
    professionalId: input.professionalId ?? undefined,
  });
  const slot = slots.find((s) => s.startsAt === input.startsAt.toISOString());
  if (!slot) throw new ApiError(409, "Esse horário não está mais disponível. Escolha outro.");

  const startsAt = input.startsAt;
  const endsAt = new Date(startsAt.getTime() + service.durationMin * 60_000);

  try {
    return await db.$transaction(async (tx) => {
      // Se o cliente escolheu "qualquer profissional", tentamos cada um livre
      for (const professionalId of slot.professionalIds) {
        // 2) Cadeado por profissional (liberado automaticamente no fim da transação)
        await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtext(${professionalId}))`;

        const conflict = await tx.appointment.findFirst({
          where: {
            professionalId,
            startsAt: { lt: endsAt },
            endsAt: { gt: startsAt },
            ...blockingWhere(new Date()),
          },
          select: { id: true },
        });
        if (conflict) continue;

        // Cliente: cria ou atualiza pelo e-mail (dentro deste negócio)
        const customer = await tx.customer.upsert({
          where: { businessId_email: { businessId: business.id, email: input.customer.email } },
          update: { name: input.customer.name, phone: input.customer.phone },
          create: { businessId: business.id, ...input.customer },
        });

        // LGPD: registra o aceite dos termos
        await tx.consentLog.create({
          data: {
            businessId: business.id,
            customerId: customer.id,
            type: "TERMOS_E_PRIVACIDADE",
            version: CONSENT_VERSION,
            ip: meta.ip,
            userAgent: meta.userAgent?.slice(0, 300),
          },
        });

        // Fase 1: sem pagamento online, todo agendamento já nasce CONFIRMADO.
        // Na Fase 2, serviços com pagamento obrigatório/sinal nascerão como
        // PENDENTE_PAGAMENTO com holdExpiresAt = agora + 15 min.
        return tx.appointment.create({
          data: {
            businessId: business.id,
            serviceId: service.id,
            professionalId,
            customerId: customer.id,
            startsAt,
            endsAt,
            status: "CONFIRMADO",
            priceCents: service.priceCents,
            paymentPolicy: service.paymentPolicy,
            notes: input.notes || null,
          },
          include: { service: true, professional: true, customer: true },
        });
      }
      throw new ApiError(409, "Esse horário acabou de ser ocupado. Escolha outro.");
    });
  } catch (err) {
    // 3) A constraint do banco barrou uma sobreposição (código 23P01 do PostgreSQL)
    if (
      (err instanceof Prisma.PrismaClientKnownRequestError || err instanceof Prisma.PrismaClientUnknownRequestError) &&
      /23P01|Appointment_no_overlap/.test(err.message)
    ) {
      throw new ApiError(409, "Esse horário acabou de ser ocupado. Escolha outro.");
    }
    throw err;
  }
}
