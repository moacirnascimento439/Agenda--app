// =============================================================================
// Rate limiting (limite de requisições)
//
// Impede que alguém tente milhares de senhas por minuto ou encha a agenda
// com agendamentos falsos. Esta versão guarda os contadores na memória do
// servidor: é suficiente para desenvolvimento e para um único servidor.
//
// ⚠️ Em produção na Vercel (vários servidores) troque por um armazenamento
// compartilhado, como Upstash Redis (@upstash/ratelimit).
// =============================================================================
import { ApiError } from "./api";

const hits = new Map<string, number[]>();

/**
 * Lança erro 429 se a chave passar de `limit` requisições em `windowMs`.
 * Ex.: rateLimit(`login:${ip}`, 5, 60_000) → no máximo 5 tentativas por minuto.
 */
export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    throw new ApiError(429, "Muitas tentativas. Aguarde um pouco e tente novamente.");
  }
  recent.push(now);
  hits.set(key, recent);

  // Limpeza ocasional para a memória não crescer para sempre
  if (hits.size > 10_000) {
    for (const [k, v] of hits) if (v.every((t) => now - t > windowMs)) hits.delete(k);
  }
}

/** Descobre o IP de quem fez a requisição (atrás de proxy, vem no cabeçalho). */
export function getClientIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
}
