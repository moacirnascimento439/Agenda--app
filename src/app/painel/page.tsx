// =============================================================================
// Agenda (página inicial do painel)
// A navegação (dia/semana, anterior/próximo) é feita pela URL:
//   /painel?view=semana&date=2026-11-25
// Assim o servidor busca só os dados do período e o link pode ser compartilhado.
// =============================================================================
import Link from "next/link";
import { ChevronLeft, ChevronRight, CircleCheck, Circle } from "lucide-react";
import { db } from "@/server/db";
import { requireMemberPage } from "@/server/page-guard";
import { addDaysStr, formatTime, toLocalDateStr, weekdayOf, zonedDateTime } from "@/server/time";
import { appointmentsThisMonth, limitsFor } from "@/server/plans";
import { PageHeader } from "@/components/panel/page-header";
import { AppointmentCard, AppointmentChip, type AgendaItem } from "@/components/panel/appointment-card";
import { CopyLink } from "@/components/panel/copy-link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn, WEEKDAYS } from "@/lib/utils";

export const metadata = { title: "Agenda" };

type Props = { searchParams: Promise<{ view?: string; date?: string }> };

export default async function AgendaPage({ searchParams }: Props) {
  const { business, role, userId } = await requireMemberPage();
  const tz = business.timezone;
  const params = await searchParams;
  const view = params.view === "semana" ? "semana" : "dia";
  const today = toLocalDateStr(new Date(), tz);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(params.date ?? "") ? params.date! : today;

  // Semana começa na segunda-feira
  const weekStart = addDaysStr(date, -((weekdayOf(date, tz) + 6) % 7));
  const rangeStart = view === "dia" ? date : weekStart;
  const days = view === "dia" ? [date] : Array.from({ length: 7 }, (_, i) => addDaysStr(weekStart, i));
  const rangeEnd = addDaysStr(rangeStart, days.length);

  const [appointments, serviceCount, proCount, monthCount] = await Promise.all([
    db.appointment.findMany({
      where: {
        businessId: business.id,
        startsAt: { gte: zonedDateTime(rangeStart, 0, tz), lt: zonedDateTime(rangeEnd, 0, tz) },
        ...(role === "STAFF" ? { professional: { userId } } : {}),
      },
      include: { service: true, professional: true, customer: true },
      orderBy: { startsAt: "asc" },
    }),
    db.service.count({ where: { businessId: business.id, active: true } }),
    db.professional.count({ where: { businessId: business.id, active: true } }),
    appointmentsThisMonth(business.id),
  ]);

  // Agrupa por dia (no fuso do negócio) e converte para objetos simples
  const byDay = new Map<string, AgendaItem[]>(days.map((d) => [d, []]));
  for (const a of appointments) {
    byDay.get(toLocalDateStr(a.startsAt, tz))?.push({
      id: a.id,
      time: formatTime(a.startsAt, tz),
      endTime: formatTime(a.endsAt, tz),
      status: a.status,
      service: a.service.name,
      professional: a.professional.name,
      customer: a.customer.name,
      phone: a.customer.phone,
      priceCents: a.priceCents,
      paymentPolicy: a.paymentPolicy,
      notes: a.notes,
    });
  }

  const step = view === "dia" ? 1 : 7;
  const href = (v: string, d: string) => `/painel?view=${v}&date=${d}`;
  const fmtDay = (d: string, opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", ...opts }).format(new Date(`${d}T12:00:00Z`));
  const title =
    view === "dia"
      ? fmtDay(date, { weekday: "long", day: "numeric", month: "long" })
      : `${fmtDay(days[0], { day: "numeric", month: "short" })} – ${fmtDay(days[6], { day: "numeric", month: "short" })}`;

  const setupDone = serviceCount > 0 && proCount > 0;
  const limit = limitsFor(business).appointmentsPerMonth;

  return (
    <>
      <PageHeader title="Agenda" description={`Olá! Aqui estão os atendimentos de ${business.name}.`}>
        {Number.isFinite(limit) && (
          <span className="self-center text-xs text-muted-foreground">{monthCount}/{limit} agendamentos no mês (plano Grátis)</span>
        )}
      </PageHeader>

      {/* Checklist de primeiros passos (some quando tudo estiver pronto) */}
      {!setupDone && (
        <Card className="mb-6 p-5">
          <h2 className="font-semibold">Primeiros passos</h2>
          <ol className="mt-3 grid gap-2 text-sm">
            <Step done label="Cadastrar o negócio" />
            <Step done={serviceCount > 0} label="Cadastrar serviços" href="/painel/servicos" />
            <Step done={proCount > 0} label="Cadastrar profissionais e horários" href="/painel/profissionais" />
          </ol>
        </Card>
      )}
      {setupDone && (
        <div className="mb-6">
          <CopyLink url={`${process.env.APP_URL ?? "http://localhost:3000"}/${business.slug}`} />
        </div>
      )}

      {/* Barra de navegação da agenda */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex rounded-md border bg-card p-0.5">
          {(["dia", "semana"] as const).map((v) => (
            <Link
              key={v}
              href={href(v, date)}
              className={cn("rounded px-3 py-1.5 text-sm font-medium capitalize", view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              {v}
            </Link>
          ))}
        </div>
        <div className="flex items-center">
          <Button asChild variant="ghost" size="icon" aria-label="Anterior"><Link href={href(view, addDaysStr(date, -step))}><ChevronLeft /></Link></Button>
          <Button asChild variant="ghost" size="icon" aria-label="Próximo"><Link href={href(view, addDaysStr(date, step))}><ChevronRight /></Link></Button>
        </div>
        {date !== today && <Button asChild variant="outline" size="sm"><Link href={href(view, today)}>Hoje</Link></Button>}
        <h2 className="ml-1 text-lg font-semibold first-letter:uppercase">{title}</h2>
      </div>

      {view === "dia" ? (
        <div className="grid max-w-2xl gap-2">
          {byDay.get(date)!.length === 0 && <Card className="p-10 text-center text-muted-foreground">Nenhum agendamento neste dia.</Card>}
          {byDay.get(date)!.map((item) => <AppointmentCard key={item.id} item={item} />)}
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-7">
          {days.map((d) => (
            <div key={d} className="min-w-0">
              <Link
                href={href("dia", d)}
                className={cn("mb-2 flex items-baseline gap-1.5 rounded-md px-1 text-sm font-semibold hover:text-primary xl:flex-col xl:gap-0", d === today && "text-primary")}
              >
                <span>{WEEKDAYS[weekdayOf(d, tz)].slice(0, 3)}</span>
                <span className="text-xl tabular-nums xl:text-2xl">{d.slice(8)}</span>
                <span className="ml-auto text-xs font-normal text-muted-foreground xl:ml-0">{byDay.get(d)!.length || ""}</span>
              </Link>
              <div className="grid gap-2">
                {byDay.get(d)!.map((item) => <AppointmentChip key={item.id} item={item} href={href("dia", d)} />)}
                {byDay.get(d)!.length === 0 && <div className="hidden h-16 rounded-lg border border-dashed xl:block" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function Step({ done, label, href }: { done: boolean; label: string; href?: string }) {
  const Icon = done ? CircleCheck : Circle;
  const content = (
    <span className={cn("flex items-center gap-2", done ? "text-muted-foreground line-through" : "font-medium")}>
      <Icon className={cn("size-5", done ? "text-emerald-600" : "text-primary")} /> {label}
    </span>
  );
  return <li>{href && !done ? <Link href={href} className="hover:text-primary">{content}</Link> : content}</li>;
}
