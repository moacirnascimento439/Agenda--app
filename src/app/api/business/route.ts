// POST  /api/business — cria o negócio (onboarding) e torna o usuário DONO
// PATCH /api/business — atualiza dados e regras do negócio
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/server/db";
import { ApiError, readJson, route } from "@/server/api";
import { requireOwner } from "@/server/guard";
import { businessSchema } from "@/server/validators";

export const POST = route(async (req) => {
  const session = await auth();
  if (!session?.user?.id) throw new ApiError(401, "Faça login para continuar");

  const already = await db.businessMember.findFirst({ where: { userId: session.user.id } });
  if (already) throw new ApiError(409, "Você já tem um negócio cadastrado");

  const data = businessSchema.parse(await readJson(req));
  if (await db.business.findUnique({ where: { slug: data.slug } })) {
    throw new ApiError(409, "Este link já está em uso, escolha outro");
  }

  // Cria o negócio e o vínculo de dono na mesma operação (tudo ou nada)
  const business = await db.business.create({
    data: {
      ...data,
      logoUrl: data.logoUrl || null,
      members: { create: { userId: session.user.id, role: "OWNER" } },
    },
  });
  return NextResponse.json(business, { status: 201 });
});

export const PATCH = route(async (req) => {
  const { businessId } = await requireOwner();
  const data = businessSchema.parse(await readJson(req));

  const slugOwner = await db.business.findUnique({ where: { slug: data.slug } });
  if (slugOwner && slugOwner.id !== businessId) throw new ApiError(409, "Este link já está em uso, escolha outro");

  const business = await db.business.update({
    where: { id: businessId },
    data: { ...data, logoUrl: data.logoUrl || null },
  });
  return NextResponse.json(business);
});
