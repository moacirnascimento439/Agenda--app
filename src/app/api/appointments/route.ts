// GET /api/appointments?from=ISO&to=ISO — agendamentos de um período (agenda)
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { ApiError, route } from "@/server/api";
import { requireMember } from "@/server/guard";

const querySchema = z.object({ from: z.coerce.date(), to: z.coerce.date() });

export const GET = route(async (req) => {
  const { businessId, role, userId } = await requireMember();
  const { searchParams } = new URL(req.url);
  const { from, to } = querySchema.parse(Object.fromEntries(searchParams));
  if (to.getTime() - from.getTime() > 45 * 24 * 60 * 60_000) throw new ApiError(400, "Período muito longo");

  const appointments = await db.appointment.findMany({
    where: {
      businessId,
      startsAt: { gte: from, lt: to },
      // Funcionário vê só a própria agenda
      ...(role === "STAFF" ? { professional: { userId } } : {}),
    },
    include: {
      service: { select: { name: true } },
      professional: { select: { name: true } },
      customer: { select: { name: true, phone: true, email: true } },
    },
    orderBy: { startsAt: "asc" },
  });
  return NextResponse.json(appointments);
});
