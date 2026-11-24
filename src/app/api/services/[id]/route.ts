// PATCH  /api/services/:id — edita um serviço
// DELETE /api/services/:id — desativa um serviço
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { ApiError, readJson, route } from "@/server/api";
import { requireOwner } from "@/server/guard";
import { serviceSchema } from "@/server/validators";

type Ctx = { params: Promise<{ id: string }> };

/** Garante que o serviço pertence ao negócio do usuário logado. */
async function findOwnService(id: string, businessId: string) {
  const service = await db.service.findFirst({ where: { id, businessId } });
  if (!service) throw new ApiError(404, "Serviço não encontrado");
  return service;
}

export const PATCH = route<Ctx>(async (req, { params }) => {
  const { businessId } = await requireOwner();
  const { id } = await params;
  await findOwnService(id, businessId);
  const data = serviceSchema.parse(await readJson(req));
  const service = await db.service.update({
    where: { id },
    data: { ...data, depositPercent: data.paymentPolicy === "DEPOSIT" ? data.depositPercent : null },
  });
  return NextResponse.json(service);
});

// Não apagamos de verdade: agendamentos antigos ainda apontam para o serviço.
// "Soft delete" = só marcamos como inativo, e ele some da página pública.
export const DELETE = route<Ctx>(async (_req, { params }) => {
  const { businessId } = await requireOwner();
  const { id } = await params;
  await findOwnService(id, businessId);
  await db.service.update({ where: { id }, data: { active: false } });
  return NextResponse.json({ ok: true });
});
