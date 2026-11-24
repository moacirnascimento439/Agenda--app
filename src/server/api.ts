// =============================================================================
// Utilitários para as rotas de API (app/api/**/route.ts)
//
// Envolvemos cada rota com `route(...)` para que TODOS os erros virem uma
// resposta JSON padronizada, sem repetir try/catch em cada arquivo.
// =============================================================================
import { NextResponse } from "next/server";
import { ZodError } from "zod";

/** Erro "esperado" que deve chegar ao usuário com uma mensagem amigável. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

type Handler<C> = (req: Request, ctx: C) => Promise<Response>;

export function route<C = unknown>(handler: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      if (err instanceof ApiError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      if (err instanceof ZodError) {
        // Devolve o primeiro problema de cada campo, para o formulário mostrar
        const fields: Record<string, string> = {};
        for (const issue of err.issues) {
          const key = issue.path.join(".") || "_";
          fields[key] ??= issue.message;
        }
        return NextResponse.json(
          { error: Object.values(fields)[0] ?? "Dados inválidos", fields },
          { status: 400 },
        );
      }
      // Erro inesperado: registra no servidor, mas NÃO mostra detalhes ao usuário
      // (detalhes internos podem revelar informações sensíveis).
      console.error(err);
      return NextResponse.json({ error: "Erro interno. Tente novamente." }, { status: 500 });
    }
  };
}

/** Lê o corpo JSON da requisição sem quebrar se vier vazio/inválido. */
export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new ApiError(400, "Corpo da requisição inválido");
  }
}
