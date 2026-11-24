// =============================================================================
// Limites dos planos (modelo de negócio da plataforma)
// =============================================================================
import type { Business } from "@prisma/client";
import { db } from "./db";

export const PLAN_LIMITS = {
  FREE: { professionals: 1, appointmentsPerMonth: 50 },
  PRO: { professionals: Infinity, appointmentsPerMonth: Infinity },
} as const;

export function limitsFor(business: Pick<Business, "plan">) {
  return PLAN_LIMITS[business.plan];
}

/** Quantos agendamentos o negócio recebeu no mês atual (exceto cancelados). */
export async function appointmentsThisMonth(businessId: string, now = new Date()) {
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  return db.appointment.count({
    where: { businessId, createdAt: { gte: monthStart }, status: { notIn: ["CANCELADO", "EXPIRADO"] } },
  });
}
