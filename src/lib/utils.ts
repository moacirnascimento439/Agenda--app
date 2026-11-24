// Funções utilitárias usadas tanto no frontend quanto no backend.
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Junta classes do Tailwind resolvendo conflitos (padrão do shadcn/ui). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 4990 → "R$ 49,90". Guardamos dinheiro em centavos para evitar erros de arredondamento. */
export function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** 540 → "09:00" (minutos desde a meia-noite). */
export function minutesToTime(min: number) {
  const h = Math.floor(min / 60).toString().padStart(2, "0");
  const m = (min % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

/** "09:00" → 540 */
export function timeToMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** "Barbearia do João" → "barbearia-do-joao" (para o link público). */
export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

export const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export const CATEGORIES = [
  "Barbearia",
  "Salão de beleza",
  "Manicure e pedicure",
  "Estética",
  "Clínica / Consultório",
  "Odontologia",
  "Psicologia / Terapia",
  "Fisioterapia",
  "Personal trainer",
  "Estúdio (tatuagem, pilates, yoga)",
  "Pet shop / Veterinária",
  "Aulas particulares",
  "Outro",
];

export const PAYMENT_POLICY_LABEL = {
  ONLINE_REQUIRED: "Pagamento online obrigatório",
  DEPOSIT: "Sinal para reservar",
  ON_SITE: "Pagar no local",
} as const;

export const STATUS_LABEL = {
  PENDENTE_PAGAMENTO: "Aguardando pagamento",
  CONFIRMADO: "Confirmado",
  EM_ATENDIMENTO: "Em atendimento",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
  EXPIRADO: "Expirado",
  FALTOU: "Faltou",
  REEMBOLSADO: "Reembolsado",
} as const;

/** Classes de cor para cada status (usadas na agenda e nos badges). */
export const STATUS_COLOR: Record<keyof typeof STATUS_LABEL, string> = {
  PENDENTE_PAGAMENTO: "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800",
  CONFIRMADO: "bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800",
  EM_ATENDIMENTO: "bg-violet-100 text-violet-900 border-violet-300 dark:bg-violet-950 dark:text-violet-200 dark:border-violet-800",
  CONCLUIDO: "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800",
  CANCELADO: "bg-zinc-100 text-zinc-600 border-zinc-300 line-through dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-700",
  EXPIRADO: "bg-zinc-100 text-zinc-600 border-zinc-300 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-700",
  FALTOU: "bg-red-100 text-red-900 border-red-300 dark:bg-red-950 dark:text-red-200 dark:border-red-800",
  REEMBOLSADO: "bg-zinc-100 text-zinc-600 border-zinc-300 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-700",
};

/** Faixa colorida à esquerda do cartão na agenda. */
export const STATUS_ACCENT: Record<keyof typeof STATUS_LABEL, string> = {
  PENDENTE_PAGAMENTO: "border-l-amber-500",
  CONFIRMADO: "border-l-blue-500",
  EM_ATENDIMENTO: "border-l-violet-500",
  CONCLUIDO: "border-l-emerald-500",
  CANCELADO: "border-l-zinc-400 opacity-60",
  EXPIRADO: "border-l-zinc-400 opacity-60",
  FALTOU: "border-l-red-500",
  REEMBOLSADO: "border-l-zinc-400 opacity-60",
};
