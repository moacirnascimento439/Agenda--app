// POST /api/public/:slug/appointments — o cliente cria um agendamento
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { ApiError, readJson, route } from "@/server/api";
import { createAppointment } from "@/server/booking";
import { sendBookingConfirmation } from "@/server/email";
import { bookingSchema } from "@/server/validators";
import { getClientIp, rateLimit } from "@/server/rate-limit";

type Ctx = { params: Promise<{ slug: string }> };

export const POST = route<Ctx>(async (req, { params }) => {
  const ip = getClientIp(req);
  rateLimit(`booking:${ip}`, 10, 60 * 60_000); // até 10 agendamentos por hora por IP

  const { slug } = await params;
  const business = await db.business.findUnique({ where: { slug } });
  if (!business) throw new ApiError(404, "Negócio não encontrado");

  const input = bookingSchema.parse(await readJson(req));
  const appointment = await createAppointment(business, input, { ip, userAgent: req.headers.get("user-agent") });

  await sendBookingConfirmation(business, appointment);

  // Devolvemos só o token público; o resto o cliente vê na página de confirmação
  return NextResponse.json({ token: appointment.publicToken }, { status: 201 });
});
