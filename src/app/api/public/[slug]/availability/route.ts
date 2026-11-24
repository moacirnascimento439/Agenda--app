// GET /api/public/:slug/availability?serviceId=&professionalId=&date=YYYY-MM-DD
// Rota PÚBLICA (sem login): usada pela página de agendamento do cliente.
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { ApiError, route } from "@/server/api";
import { getAvailability } from "@/server/availability";
import { availabilityQuerySchema } from "@/server/validators";
import { getClientIp, rateLimit } from "@/server/rate-limit";

type Ctx = { params: Promise<{ slug: string }> };

export const GET = route<Ctx>(async (req, { params }) => {
  rateLimit(`avail:${getClientIp(req)}`, 120, 60_000);
  const { slug } = await params;
  const business = await db.business.findUnique({ where: { slug } });
  if (!business) throw new ApiError(404, "Negócio não encontrado");

  const query = availabilityQuerySchema.parse(Object.fromEntries(new URL(req.url).searchParams));
  const { slots } = await getAvailability({ business, ...query });

  // Não expomos quais profissionais estão livres quando o cliente escolheu "qualquer um"
  return NextResponse.json({ slots: slots.map((s) => ({ time: s.time, startsAt: s.startsAt })) });
});
