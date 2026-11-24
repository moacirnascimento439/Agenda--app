"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, MoreHorizontal, Phone, Play, UserX, X } from "lucide-react";
import type { AppointmentStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api-client";
import { cn, formatPrice, PAYMENT_POLICY_LABEL, STATUS_ACCENT, STATUS_COLOR, STATUS_LABEL } from "@/lib/utils";

export type AgendaItem = {
  id: string;
  time: string;
  endTime: string;
  status: AppointmentStatus;
  service: string;
  professional: string;
  customer: string;
  phone: string;
  priceCents: number;
  paymentPolicy: keyof typeof PAYMENT_POLICY_LABEL;
  notes: string | null;
};

// Quais ações aparecem para cada status (espelha a máquina de estados do backend)
const ACTIONS: Partial<Record<AppointmentStatus, { to: AppointmentStatus; label: string; icon: typeof Check }[]>> = {
  CONFIRMADO: [
    { to: "EM_ATENDIMENTO", label: "Iniciar", icon: Play },
    { to: "FALTOU", label: "Faltou", icon: UserX },
    { to: "CANCELADO", label: "Cancelar", icon: X },
  ],
  EM_ATENDIMENTO: [{ to: "CONCLUIDO", label: "Concluir", icon: Check }],
  FALTOU: [{ to: "CONFIRMADO", label: "Desfazer falta", icon: MoreHorizontal }],
  PENDENTE_PAGAMENTO: [{ to: "CANCELADO", label: "Cancelar", icon: X }],
};

/** Versão resumida (visão de semana): um link que abre o dia com todas as ações. */
export function AppointmentChip({ item, href }: { item: AgendaItem; href: string }) {
  return (
    <Link href={href} className={cn("block rounded-md border border-l-4 bg-card px-2 py-1.5 text-xs shadow-xs transition hover:bg-muted", STATUS_ACCENT[item.status])}>
      <p className="font-semibold tabular-nums">{item.time}</p>
      <p className="truncate font-medium">{item.customer}</p>
      <p className="truncate text-muted-foreground">{item.service}</p>
    </Link>
  );
}

export function AppointmentCard({ item }: { item: AgendaItem }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function changeStatus(status: AppointmentStatus) {
    if (status === "CANCELADO" && !confirm(`Cancelar o agendamento de ${item.customer}?`)) return;
    setBusy(true);
    try {
      await api(`/api/appointments/${item.id}`, { method: "PATCH", body: { status } });
      toast.success(STATUS_LABEL[status]);
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  // Link direto para o WhatsApp do cliente (55 = código do Brasil)
  const whatsapp = `https://wa.me/55${item.phone}`;

  return (
    <div className={cn("rounded-lg border border-l-4 bg-card p-3 shadow-xs", STATUS_ACCENT[item.status])}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold tabular-nums">{item.time}–{item.endTime}</p>
          <p className="truncate font-medium">{item.customer}</p>
          <p className="truncate text-sm text-muted-foreground">
            {item.service} · {item.professional}
          </p>
        </div>
        <Badge className={cn("shrink-0", STATUS_COLOR[item.status])}>{STATUS_LABEL[item.status]}</Badge>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {formatPrice(item.priceCents)} · {PAYMENT_POLICY_LABEL[item.paymentPolicy]}
        {item.notes && <> · “{item.notes}”</>}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {ACTIONS[item.status]?.map(({ to, label, icon: Icon }) => (
          <Button key={to} size="sm" variant={to === "CANCELADO" || to === "FALTOU" ? "ghost" : "outline"} disabled={busy} onClick={() => changeStatus(to)}>
            <Icon /> {label}
          </Button>
        ))}
        <Button asChild size="sm" variant="ghost">
          <a href={whatsapp} target="_blank" rel="noreferrer" aria-label="WhatsApp do cliente"><Phone /></a>
        </Button>
      </div>
    </div>
  );
}
