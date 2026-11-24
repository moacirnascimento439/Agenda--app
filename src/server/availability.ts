// =============================================================================
// Cálculo de horários disponíveis
//
// Ideia geral, para um dia e um serviço:
//   1. Pega os profissionais que fazem o serviço.
//   2. Para cada um, pega o expediente daquele dia da semana.
//   3. Gera horários candidatos a cada 15 min (ex.: 09:00, 09:15, 09:30...)
//      onde o serviço inteiro CABE antes do fim do expediente.
//   4. Remove os que batem com agendamentos existentes, folgas/feriados,
//      ou que desrespeitam a antecedência mínima/máxima.
// O que sobra é mostrado ao cliente.
// =============================================================================
import type { AppointmentStatus, Business, Prisma } from "@prisma/client";
import { db } from "./db";
import { ApiError } from "./api";
import { weekdayOf, zonedDateTime } from "./time";
import { minutesToTime } from "@/lib/utils";

const SLOT_STEP_MIN = 15;

/** Status que OCUPAM um horário na agenda. */
export const BLOCKING_STATUSES: AppointmentStatus[] = [
  "PENDENTE_PAGAMENTO",
  "CONFIRMADO",
  "EM_ATENDIMENTO",
  "CONCLUIDO",
  "FALTOU",
];

/**
 * Filtro do Prisma para "agendamentos que ocupam horário agora".
 * Um agendamento aguardando pagamento cuja reserva de 15 min já venceu
 * NÃO ocupa mais o horário (Fase 2).
 */
export function blockingWhere(now: Date): Prisma.AppointmentWhereInput {
  return {
    status: { in: BLOCKING_STATUSES },
    NOT: { status: "PENDENTE_PAGAMENTO", holdExpiresAt: { lt: now } },
  };
}

export type Slot = { time: string; startsAt: string; professionalIds: string[] };

type Params = {
  business: Pick<Business, "id" | "timezone" | "minAdvanceMinutes" | "maxAdvanceDays">;
  serviceId: string;
  date: string; // "YYYY-MM-DD" no fuso do negócio
  professionalId?: string; // vazio = qualquer profissional
  now?: Date;
};

export async function getAvailability({ business, serviceId, date, professionalId, now = new Date() }: Params) {
  const tz = business.timezone;

  const service = await db.service.findFirst({
    where: { id: serviceId, businessId: business.id, active: true },
    include: {
      professionals: {
        include: { professional: { include: { workingHours: true } } },
      },
    },
  });
  if (!service) throw new ApiError(404, "Serviço não encontrado");

  let pros = service.professionals.map((ps) => ps.professional).filter((p) => p.active);
  if (professionalId) pros = pros.filter((p) => p.id === professionalId);
  if (pros.length === 0) return { service, slots: [] as Slot[] };

  // Limites do dia e da janela permitida para agendar
  const dayStart = zonedDateTime(date, 0, tz);
  const dayEnd = zonedDateTime(date, 24 * 60, tz);
  const earliest = new Date(now.getTime() + business.minAdvanceMinutes * 60_000);
  const latest = new Date(now.getTime() + business.maxAdvanceDays * 24 * 60 * 60_000);
  if (dayEnd <= earliest || dayStart > latest) return { service, slots: [] as Slot[] };

  const proIds = pros.map((p) => p.id);

  // Tudo que ocupa tempo nesse dia: agendamentos + folgas/bloqueios
  const [appointments, timeOffs] = await Promise.all([
    db.appointment.findMany({
      where: {
        professionalId: { in: proIds },
        startsAt: { lt: dayEnd },
        endsAt: { gt: dayStart },
        ...blockingWhere(now),
      },
      select: { professionalId: true, startsAt: true, endsAt: true },
    }),
    db.timeOff.findMany({
      where: {
        businessId: business.id,
        startsAt: { lt: dayEnd },
        endsAt: { gt: dayStart },
        OR: [{ professionalId: null }, { professionalId: { in: proIds } }],
      },
      select: { professionalId: true, startsAt: true, endsAt: true },
    }),
  ]);

  const weekday = weekdayOf(date, tz);
  const durationMs = service.durationMin * 60_000;
  const slotMap = new Map<string, Slot>();

  for (const pro of pros) {
    // Períodos ocupados deste profissional (folga sem profissional = vale para todos)
    const busy = [
      ...appointments.filter((a) => a.professionalId === pro.id),
      ...timeOffs.filter((t) => t.professionalId === null || t.professionalId === pro.id),
    ].map((b) => [b.startsAt.getTime(), b.endsAt.getTime()] as const);

    for (const interval of pro.workingHours.filter((w) => w.weekday === weekday)) {
      for (let m = interval.startMin; m + service.durationMin <= interval.endMin; m += SLOT_STEP_MIN) {
        const start = zonedDateTime(date, m, tz).getTime();
        const end = start + durationMs;
        if (start < earliest.getTime() || start > latest.getTime()) continue;

        // Dois períodos se sobrepõem se um começa antes do outro terminar (e vice-versa)
        const conflict = busy.some(([bs, be]) => start < be && end > bs);
        if (conflict) continue;

        const key = minutesToTime(m);
        const slot = slotMap.get(key) ?? { time: key, startsAt: new Date(start).toISOString(), professionalIds: [] };
        slot.professionalIds.push(pro.id);
        slotMap.set(key, slot);
      }
    }
  }

  const slots = [...slotMap.values()].sort((a, b) => a.time.localeCompare(b.time));
  return { service, slots };
}
