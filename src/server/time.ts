// =============================================================================
// Fuso horário
//
// O banco guarda datas em UTC (horário universal). Mas "09:00" para uma
// barbearia em São Paulo é 12:00 UTC. Estas funções fazem a conversão usando
// o fuso do negócio (Business.timezone), para o sistema funcionar em qualquer
// lugar do Brasil (Manaus, Fernando de Noronha...) e no exterior.
// =============================================================================
import { TZDate } from "@date-fns/tz";

/** ("2026-11-25", 540, "America/Sao_Paulo") → Date de 25/11/2026 09:00 em SP */
export function zonedDateTime(dateStr: string, minutes: number, tz: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(new TZDate(y, m - 1, d, Math.floor(minutes / 60), minutes % 60, tz).getTime());
}

/** Dia da semana (0 = domingo) de uma data "YYYY-MM-DD" no fuso do negócio. */
export function weekdayOf(dateStr: string, tz: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new TZDate(y, m - 1, d, 12, 0, tz).getDay();
}

/** Date → "YYYY-MM-DD" no fuso informado. */
export function toLocalDateStr(date: Date, tz: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(date);
}

/** Soma dias a uma data "YYYY-MM-DD" (sem se confundir com fuso). */
export function addDaysStr(dateStr: string, days: number) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

/** Formata data/hora no fuso do negócio, em português. */
export function formatDateTime(date: Date, tz: string, opts: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: tz,
    weekday: "long",
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    ...opts,
  }).format(date);
}

export function formatTime(date: Date, tz: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: tz, hour: "2-digit", minute: "2-digit" }).format(date);
}
