// PUT /api/professionals/:id/hours — substitui o expediente semanal inteiro
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { ApiError, readJson, route } from "@/server/api";
import { requireOwner } from "@/server/guard";
import { workingHoursSchema } from "@/server/validators";
import { timeToMinutes } from "@/lib/utils";

type Ctx = { params: Promise<{ id: string }> };

export const PUT = route<Ctx>(async (req, { params }) => {
  const { businessId } = await requireOwner();
  const { id } = await params;
  const pro = await db.professional.findFirst({ where: { id, businessId } });
  if (!pro) throw new ApiError(404, "Profissional não encontrado");

  const { intervals } = workingHoursSchema.parse(await readJson(req));
  const rows = intervals.map((i) => ({
    professionalId: id,
    weekday: i.weekday,
    startMin: timeToMinutes(i.start),
    endMin: timeToMinutes(i.end),
  }));

  // Verifica se há intervalos sobrepostos no mesmo dia (ex.: 09–12 e 11–14)
  for (const a of rows) {
    for (const b of rows) {
      if (a !== b && a.weekday === b.weekday && a.startMin < b.endMin && b.startMin < a.endMin) {
        throw new ApiError(400, "Há intervalos sobrepostos no mesmo dia");
      }
    }
  }

  await db.$transaction([
    db.workingHours.deleteMany({ where: { professionalId: id } }),
    db.workingHours.createMany({ data: rows }),
  ]);
  return NextResponse.json({ ok: true });
});
