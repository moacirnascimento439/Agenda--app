// PATCH  /api/professionals/:id — edita nome, status e serviços
// DELETE /api/professionals/:id — desativa
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { ApiError, readJson, route } from "@/server/api";
import { requireOwner } from "@/server/guard";
import { professionalSchema } from "@/server/validators";
import { limitsFor } from "@/server/plans";

type Ctx = { params: Promise<{ id: string }> };

async function findOwn(id: string, businessId: string) {
  const pro = await db.professional.findFirst({ where: { id, businessId } });
  if (!pro) throw new ApiError(404, "Profissional não encontrado");
  return pro;
}

export const PATCH = route<Ctx>(async (req, { params }) => {
  const { businessId, business } = await requireOwner();
  const { id } = await params;
  const current = await findOwn(id, businessId);
  const data = professionalSchema.parse(await readJson(req));

  // Reativar alguém também conta no limite do plano
  if (data.active && !current.active) {
    const activeCount = await db.professional.count({ where: { businessId, active: true } });
    if (activeCount >= limitsFor(business).professionals) {
      throw new ApiError(403, "Limite de profissionais do seu plano atingido.");
    }
  }

  const services = await db.service.findMany({ where: { businessId, id: { in: data.serviceIds } }, select: { id: true } });

  // Transação: troca a lista de serviços de uma vez (apaga as antigas e cria as novas)
  const professional = await db.$transaction(async (tx) => {
    await tx.professionalService.deleteMany({ where: { professionalId: id } });
    return tx.professional.update({
      where: { id },
      data: {
        name: data.name,
        active: data.active,
        services: { create: services.map((s) => ({ serviceId: s.id })) },
      },
    });
  });
  return NextResponse.json(professional);
});

export const DELETE = route<Ctx>(async (_req, { params }) => {
  const { businessId } = await requireOwner();
  const { id } = await params;
  await findOwn(id, businessId);
  await db.professional.update({ where: { id }, data: { active: false } });
  return NextResponse.json({ ok: true });
});
