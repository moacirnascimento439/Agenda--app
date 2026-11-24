// =============================================================================
// Controle de acesso (autorização)
//
// Autenticação = "quem é você?"  → resolvida pelo login (src/auth.ts)
// Autorização  = "o que você pode fazer?" → resolvida aqui
//
// Toda rota do painel chama requireMember(). Ela devolve o negócio do usuário
// logado, e todas as consultas usam ESSE businessId. Assim um negócio nunca
// consegue ler ou alterar dados de outro, mesmo alterando ids na requisição.
// =============================================================================
import type { MemberRole } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "./db";
import { ApiError } from "./api";

/** Para páginas: devolve o vínculo do usuário com o negócio, ou null. */
export async function getMembership() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;
  const membership = await db.businessMember.findFirst({
    where: { userId },
    include: { business: true },
    orderBy: { id: "asc" },
  });
  return { userId, session, membership };
}

/** Para rotas de API: exige login + vínculo com um negócio (+ papel, se informado). */
export async function requireMember(roles: MemberRole[] = ["OWNER", "STAFF"]) {
  const result = await getMembership();
  if (!result) throw new ApiError(401, "Faça login para continuar");
  const { membership, userId } = result;
  if (!membership) throw new ApiError(403, "Cadastre seu negócio primeiro");
  if (!roles.includes(membership.role)) throw new ApiError(403, "Você não tem permissão para isso");
  return { userId, role: membership.role, business: membership.business, businessId: membership.businessId };
}

/** Atalho: só o dono do negócio. */
export const requireOwner = () => requireMember(["OWNER"]);
