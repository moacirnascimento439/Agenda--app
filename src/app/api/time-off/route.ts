// GET  /api/time-off — lista folgas/bloqueios futuros
// POST /api/time-off — cria folga, feriado ou bloqueio
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { ApiError, readJson, route } from "@/server/api";
import { requireMember, requireOwner } from "@/server/guard";
import { timeOffSchema } from "@/server/validators";
import { zonedDateTime } from "@/server/time";
import { timeToMinutes } from "@/lib/utils";

/** "2026-12-25T08:00" → Date, no fuso do negócio */
const fromLocal = (v: string, tz: string) => zonedDateTime(v.slice(0, 10), timeToMinutes(v.slice(11)), tz);

export const GET = route(async () => {
  const { businessId } = await requireMember();
  const items = await db.timeOff.findMany({
    where: { businessId, endsAt: { gte: new Date() } },
    include: { professional: { select: { name: true } } },
    orderBy: { startsAt: "asc" },
  });
  return NextResponse.json(items);
});

export const POST = route(async (req) => {
  const { businessId, business } = await requireOwner();
  const data = timeOffSchema.parse(await readJson(req));
  if (data.professionalId) {
    const pro = await db.professional.findFirst({ where: { id: data.professionalId, businessId } });
    if (!pro) throw new ApiError(404, "Profissional não encontrado");
  }
  const item = await db.timeOff.create({
    data: { businessId, professionalId: data.professionalId || null, startsAt: fromLocal(data.start, business.timezone), endsAt: fromLocal(data.end, business.timezone), reason: data.reason },
  });
  return NextResponse.json(item, { status: 201 });
});
