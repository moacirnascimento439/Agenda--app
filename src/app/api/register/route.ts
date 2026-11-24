// POST /api/register — cria a conta do dono do negócio
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/server/db";
import { ApiError, readJson, route } from "@/server/api";
import { registerSchema } from "@/server/validators";
import { getClientIp, rateLimit } from "@/server/rate-limit";

export const POST = route(async (req) => {
  rateLimit(`register:${getClientIp(req)}`, 5, 60 * 60_000); // 5 contas por hora por IP
  const data = registerSchema.parse(await readJson(req));

  const exists = await db.user.findUnique({ where: { email: data.email } });
  if (exists) throw new ApiError(409, "Já existe uma conta com este e-mail");

  // bcrypt transforma a senha num "hash" irreversível. 12 = custo (mais alto = mais lento de quebrar)
  const passwordHash = await bcrypt.hash(data.password, 12);
  await db.user.create({ data: { name: data.name, email: data.email, passwordHash } });

  return NextResponse.json({ ok: true }, { status: 201 });
});
