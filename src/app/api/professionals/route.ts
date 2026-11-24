// GET  /api/professionals — lista profissionais
// POST /api/professionals — cria profissional (respeitando o limite do plano)
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { ApiError, readJson, route } from "@/server/api";
import { requireMember, requireOwner } from "@/server/guard";
import { professionalSchema } from "@/server/validators";
import { limitsFor } from "@/server/plans";

export const GET = route(async () => {
  const { businessId } = await requireMember();
  const professionals = await db.professional.findMany({
    where: { businessId },
    include: { services: true, workingHours: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(professionals);
});

export const POST = route(async (req) => {
  const { businessId, business } = await requireOwner();
  const data = professionalSchema.parse(await readJson(req));

  const activeCount = await db.professional.count({ where: { businessId, active: true } });
  if (activeCount >= limitsFor(business).professionals) {
    throw new ApiError(403, "O plano Grátis permite 1 profissional. Faça upgrade para o Pro para adicionar mais.");
  }

  // Só aceitamos serviços que são DESTE negócio (segurança multi-tenant)
  const services = await db.service.findMany({ where: { businessId, id: { in: data.serviceIds } }, select: { id: true } });

  const professional = await db.professional.create({
    data: {
      businessId,
      name: data.name,
      active: data.active,
      services: { create: services.map((s) => ({ serviceId: s.id })) },
      // Expediente padrão: segunda a sexta, 09:00–12:00 e 13:00–18:00
      workingHours: {
        create: [1, 2, 3, 4, 5].flatMap((weekday) => [
          { weekday, startMin: 9 * 60, endMin: 12 * 60 },
          { weekday, startMin: 13 * 60, endMin: 18 * 60 },
        ]),
      },
    },
  });
  return NextResponse.json(professional, { status: 201 });
});
