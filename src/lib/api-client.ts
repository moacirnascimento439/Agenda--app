// =============================================================================
// Como o FRONTEND conversa com o BACKEND.
// Toda chamada à API passa por aqui: se der erro, lançamos uma exceção com a
// mensagem amigável que o backend enviou (e os erros por campo do formulário).
// =============================================================================
export class ClientApiError extends Error {
  constructor(
    message: string,
    public fields: Record<string, string> = {},
    public status = 0,
  ) {
    super(message);
  }
}

export async function api<T = unknown>(url: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(url, {
    method: options.method ?? (options.body ? "POST" : "GET"),
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ClientApiError(data.error ?? "Algo deu errado", data.fields, res.status);
  return data as T;
}
