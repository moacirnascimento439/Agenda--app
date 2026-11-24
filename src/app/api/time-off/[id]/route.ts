// DELETE /api/time-off/:id — remove uma folga/bloqueio
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { route } from "@/server/api";
import { requireOwner } from "@/server/guard";

type Ctx = { params: Promise<{ id: string }> };

export const DELETE = route<Ctx>(async (_req, { params }) => {
  const { businessId } = await requireOwner();
  const { id } = await params;
  // deleteMany com businessId: se o id for de outro negócio, nada é apagado
  await db.timeOff.deleteMany({ where: { id, businessId } });
  return NextResponse.json({ ok: true });
});
