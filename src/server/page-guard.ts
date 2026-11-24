// Versão do controle de acesso para PÁGINAS (em vez de erro, redireciona).
import { redirect } from "next/navigation";
import { getMembership } from "./guard";

export async function requireMemberPage() {
  const result = await getMembership();
  if (!result) redirect("/entrar");
  if (!result.membership) redirect("/comecar");
  return { userId: result.userId, role: result.membership.role, business: result.membership.business };
}

export async function requireOwnerPage() {
  const m = await requireMemberPage();
  if (m.role !== "OWNER") redirect("/painel");
  return m;
}
