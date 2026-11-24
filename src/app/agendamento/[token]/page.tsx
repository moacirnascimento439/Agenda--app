// Página que o cliente recebe por e-mail: agendai.com/agendamento/{token}
// O token é longo e aleatório — só quem tem o link consegue ver.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarPlus, CheckCircle2, MapPin, MessageCircle } from "lucide-react";
import { db } from "@/server/db";
import { formatDateTime } from "@/server/time";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatPrice, PAYMENT_POLICY_LABEL, STATUS_COLOR, STATUS_LABEL } from "@/lib/utils";

export const metadata: Metadata = { title: "Seu agendamento", robots: { index: false } };

type Props = { params: Promise<{ token: string }>; searchParams: Promise<{ novo?: string }> };

/** Link "Adicionar ao Google Agenda" (formato de data: 20261125T130000Z) */
function googleCalendarUrl(title: string, start: Date, end: Date, location: string) {
  const f = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const qs = new URLSearchParams({ action: "TEMPLATE", text: title, dates: `${f(start)}/${f(end)}`, location });
  return `https://calendar.google.com/calendar/render?${qs}`;
}

export default async function AppointmentPage({ params, searchParams }: Props) {
  const { token } = await params;
  const { novo } = await searchParams;
  const a = await db.appointment.findUnique({
    where: { publicToken: token },
    include: { business: true, service: true, professional: true, customer: true },
  });
  if (!a) notFound();
  const b = a.business;
  const location = `${b.address}, ${b.city}`;

  return (
    <div style={{ "--brand": b.primaryColor } as React.CSSProperties} className="min-h-dvh px-4 py-10">
      <main className="mx-auto grid max-w-md gap-5">
        {novo && a.status === "CONFIRMADO" && (
          <div className="text-center">
            <CheckCircle2 className="mx-auto size-14 text-emerald-600" />
            <h1 className="mt-2 text-2xl font-bold">Agendamento confirmado!</h1>
            <p className="text-sm text-muted-foreground">Enviamos os detalhes para {a.customer.email}.</p>
          </div>
        )}
        {!novo && <h1 className="text-2xl font-bold">Seu agendamento</h1>}

        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm text-muted-foreground">{b.name}</p>
              <p className="text-lg font-semibold">{a.service.name}</p>
            </div>
            <Badge className={cn(STATUS_COLOR[a.status])}>{STATUS_LABEL[a.status]}</Badge>
          </div>
          <dl className="mt-4 grid gap-3 text-sm">
            <div><dt className="text-muted-foreground">Quando</dt><dd className="font-medium capitalize">{formatDateTime(a.startsAt, b.timezone)}</dd></div>
            <div><dt className="text-muted-foreground">Profissional</dt><dd className="font-medium">{a.professional.name}</dd></div>
            <div><dt className="text-muted-foreground">Valor</dt><dd className="font-medium">{formatPrice(a.priceCents)} · {PAYMENT_POLICY_LABEL.ON_SITE}</dd></div>
            <div><dt className="text-muted-foreground">Cliente</dt><dd className="font-medium">{a.customer.name}</dd></div>
            <div className="flex items-start gap-1.5"><MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><dd>{location}</dd></div>
          </dl>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <Button asChild variant="brand">
            <a href={googleCalendarUrl(`${a.service.name} — ${b.name}`, a.startsAt, a.endsAt, location)} target="_blank" rel="noreferrer">
              <CalendarPlus /> Adicionar à agenda
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href={`https://wa.me/55${b.phone}`} target="_blank" rel="noreferrer"><MessageCircle /> Falar com o negócio</a>
          </Button>
        </div>

        <p className="rounded-lg border p-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Precisa cancelar ou remarcar?</span> Fale com {b.name} pelo WhatsApp.
          Política: {b.refundPolicy}
        </p>
        <Link href={`/${b.slug}`} className="text-center text-sm text-muted-foreground hover:text-foreground">Fazer outro agendamento</Link>
      </main>
    </div>
  );
}
