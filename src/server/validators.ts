// =============================================================================
// Validação com Zod
//
// REGRA DE OURO: nunca confie no que vem do navegador. Qualquer pessoa pode
// enviar dados alterados para a API. Por isso TODA entrada do backend passa
// por um destes schemas antes de chegar ao banco.
// =============================================================================
import { z } from "zod";

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horário inválido (use HH:MM)");
const phone = z
  .string()
  .trim()
  .transform((v) => v.replace(/\D/g, "")) // guarda só os números
  .pipe(z.string().min(10, "Telefone com DDD").max(13, "Telefone inválido"));

// Palavras que não podem ser usadas como link do negócio (são rotas do sistema)
const RESERVED_SLUGS = ["api", "painel", "entrar", "cadastro", "comecar", "agendamento", "privacidade", "termos", "admin", "_next"];

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(80),
  email: z.string().trim().toLowerCase().pipe(z.email("E-mail inválido")),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres").max(100),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1).max(100),
});

export const businessSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do negócio").max(80),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use apenas letras minúsculas, números e hífens")
    .min(3, "Mínimo de 3 caracteres")
    .max(50)
    .refine((s) => !RESERVED_SLUGS.includes(s), "Este link é reservado, escolha outro"),
  category: z.string().trim().min(2).max(60),
  description: z.string().trim().max(500).optional().nullable(),
  logoUrl: z.union([z.url("URL inválida"), z.literal("")]).optional().nullable(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida").default("#4f46e5"),
  phone,
  address: z.string().trim().min(5, "Informe o endereço").max(200),
  city: z.string().trim().min(2, "Informe a cidade").max(80),
  minAdvanceMinutes: z.coerce.number().int().min(0).max(60 * 24 * 7).default(60),
  maxAdvanceDays: z.coerce.number().int().min(1).max(365).default(60),
  cancelLimitHours: z.coerce.number().int().min(0).max(24 * 14).default(24),
  refundPolicy: z.string().trim().min(10, "Descreva a política de reembolso").max(1000),
});

export const serviceSchema = z
  .object({
    name: z.string().trim().min(2, "Informe o nome").max(80),
    description: z.string().trim().max(500).optional().nullable(),
    durationMin: z.coerce.number().int().min(5, "Mínimo de 5 minutos").max(60 * 12),
    priceCents: z.coerce.number().int().min(0).max(100_000_00),
    paymentPolicy: z.enum(["ONLINE_REQUIRED", "DEPOSIT", "ON_SITE"]),
    depositPercent: z.coerce.number().int().min(1).max(99).optional().nullable(),
    active: z.boolean().default(true),
  })
  // Regra que envolve dois campos: se for sinal, a porcentagem é obrigatória.
  .refine((s) => s.paymentPolicy !== "DEPOSIT" || !!s.depositPercent, {
    message: "Informe a porcentagem do sinal",
    path: ["depositPercent"],
  });

export const professionalSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome").max(80),
  active: z.boolean().default(true),
  serviceIds: z.array(z.string()).max(200).default([]),
});

export const workingHoursSchema = z.object({
  intervals: z
    .array(
      z
        .object({ weekday: z.number().int().min(0).max(6), start: hhmm, end: hhmm })
        .refine((i) => i.start < i.end, { message: "O fim precisa ser depois do início" }),
    )
    .max(50),
});

// Datas "locais" (como o dono digita: 2026-12-25T08:00). O backend converte
// para o fuso do negócio — assim não depende do fuso do navegador de quem digita.
const localDateTime = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Data/hora inválida");

export const timeOffSchema = z
  .object({
    professionalId: z.string().nullable().optional(), // vazio = negócio inteiro
    start: localDateTime,
    end: localDateTime,
    reason: z.string().trim().max(120).optional().nullable(),
  })
  .refine((t) => t.end > t.start, { message: "O fim precisa ser depois do início", path: ["end"] });

export const availabilityQuerySchema = z.object({
  serviceId: z.string().min(1),
  professionalId: z.string().optional(), // ausente = "qualquer profissional"
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
});

export const bookingSchema = z.object({
  serviceId: z.string().min(1),
  professionalId: z.string().nullable().optional(),
  startsAt: z.coerce.date(),
  customer: z.object({
    name: z.string().trim().min(2, "Informe seu nome").max(80),
    email: z.string().trim().toLowerCase().pipe(z.email("E-mail inválido")),
    phone,
  }),
  notes: z.string().trim().max(300).optional().nullable(),
  // LGPD: o cliente precisa aceitar explicitamente. z.literal(true) recusa false.
  consent: z.literal(true, { message: "Você precisa aceitar os termos para agendar" }),
});

export const appointmentStatusSchema = z.object({
  status: z.enum(["CONFIRMADO", "EM_ATENDIMENTO", "CONCLUIDO", "CANCELADO", "FALTOU"]),
});
