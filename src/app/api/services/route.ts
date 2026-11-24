// GET  /api/services — lista os serviços do negócio
// POST /api/services — cria um serviço
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { readJson, route } from "@/server/api";
import { requireMember, requireOwner } from "@/server/guard";
import { serviceSchema } from "@/server/validators";

export const GET = route(async () => {
  const { businessId } = await requireMember();
  const services = await db.service.findMany({ where: { businessId }, orderBy: { name: "asc" } });
  return NextResponse.json(services);
});

export const POST = route(async (req) => {
  const { businessId } = await requireOwner();
  const data = serviceSchema.parse(await readJson(req));
  const service = await db.service.create({
    data: { ...data, depositPercent: data.paymentPolicy === "DEPOSIT" ? data.depositPercent : null, businessId },
  });
  return NextResponse.json(service, { status: 201 });
});
