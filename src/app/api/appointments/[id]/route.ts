// PATCH /api/appointments/:id — muda o status (iniciar, concluir, falta, cancelar)
import { NextResponse } from "next/server";
import type { AppointmentStatus } from "@prisma/client";
import { db } from "@/server/db";
import { ApiError, readJson, route } from "@/server/api";
import { requireMember } from "@/server/guard";
import { appointmentStatusSchema } from "@/server/validators";

type Ctx = { params: Promise<{ id: string }> };

// "Máquina de estados": de cada status, para quais é permitido ir.
// Isso impede, por exemplo, reabrir um agendamento cancelado.
// Obs.: PENDENTE_PAGAMENTO → CONFIRMADO só acontece pelo webhook de pagamento (Fase 2).
const TRANSITIONS: Partial<Record<AppointmentStatus, AppointmentStatus[]>> = {
  PENDENTE_PAGAMENTO: ["CANCELADO"],
  CONFIRMADO: ["EM_ATENDIMENTO", "CONCLUIDO", "FALTOU", "CANCELADO"],
  EM_ATENDIMENTO: ["CONCLUIDO", "CONFIRMADO"],
  FALTOU: ["CONFIRMADO"], // desfazer uma falta marcada por engano
};

export const PATCH = route<Ctx>(async (req, { params }) => {
  const { businessId, role, userId } = await requireMember();
  const { id } = await params;
  const { status } = appointmentStatusSchema.parse(await readJson(req));

  const appt = await db.appointment.findFirst({
    where: { id, businessId, ...(role === "STAFF" ? { professional: { userId } } : {}) },
  });
  if (!appt) throw new ApiError(404, "Agendamento não encontrado");

  if (!TRANSITIONS[appt.status]?.includes(status)) {
    throw new ApiError(400, "Essa mudança de status não é permitida");
  }

  const updated = await db.appointment.update({
    where: { id },
    data: { status, cancelledAt: status === "CANCELADO" ? new Date() : null },
  });
  return NextResponse.json(updated);
});
