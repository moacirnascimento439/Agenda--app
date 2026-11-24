"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Clock, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import type { Professional, Service, WorkingHours } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api, ClientApiError } from "@/lib/api-client";
import { minutesToTime, WEEKDAYS } from "@/lib/utils";

type Pro = Professional & { services: { serviceId: string }[]; workingHours: WorkingHours[] };

export function ProfessionalsManager({ professionals, services, canAddMore }: { professionals: Pro[]; services: Service[]; canAddMore: boolean }) {
  const [editing, setEditing] = useState<Pro | "new" | null>(null);
  const [hoursOf, setHoursOf] = useState<Pro | null>(null);
  const router = useRouter();
  const serviceName = new Map(services.map((s) => [s.id, s.name]));

  async function deactivate(p: Pro) {
    if (!confirm(`Desativar ${p.name}? Os agendamentos já feitos continuam na agenda.`)) return;
    try {
      await api(`/api/professionals/${p.id}`, { method: "DELETE" });
      toast.success("Profissional desativado");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-end gap-3">
        {!canAddMore && <p className="text-sm text-muted-foreground">O plano Grátis permite 1 profissional.</p>}
        <Button onClick={() => setEditing("new")} disabled={!canAddMore}><Plus /> Novo profissional</Button>
      </div>

      {professionals.length === 0 && (
        <Card className="p-10 text-center text-muted-foreground">
          Cadastre quem atende (pode ser você mesmo). Cada profissional tem sua própria agenda.
        </Card>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        {professionals.map((p) => (
          <Card key={p.id} className={p.active ? "p-4" : "p-4 opacity-60"}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 font-semibold text-primary">
                  {p.name.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <h3 className="truncate font-semibold">{p.name}</h3>
                  <p className="text-xs text-muted-foreground">{summarizeHours(p.workingHours)}</p>
                </div>
              </div>
              <div className="flex shrink-0">
                <Button variant="ghost" size="icon" onClick={() => setHoursOf(p)} aria-label="Horários"><Clock /></Button>
                <Button variant="ghost" size="icon" onClick={() => setEditing(p)} aria-label="Editar"><Pencil /></Button>
                {p.active && <Button variant="ghost" size="icon" onClick={() => deactivate(p)} aria-label="Desativar"><Trash2 /></Button>}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {p.services.length === 0 && <Badge className="border-amber-400 text-amber-700 dark:text-amber-300">Nenhum serviço vinculado</Badge>}
              {p.services.map((s) => <Badge key={s.serviceId}>{serviceName.get(s.serviceId)}</Badge>)}
              {!p.active && <Badge className="border-destructive/40 text-destructive">Inativo</Badge>}
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          {editing !== null && (
            <ProfessionalForm
              pro={editing === "new" ? undefined : editing}
              services={services}
              onDone={() => { setEditing(null); router.refresh(); }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={hoursOf !== null} onOpenChange={(o) => !o && setHoursOf(null)}>
        <DialogContent className="max-w-2xl">
          {hoursOf && <HoursForm pro={hoursOf} onDone={() => { setHoursOf(null); router.refresh(); }} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

function summarizeHours(hours: WorkingHours[]) {
  const days = [...new Set(hours.map((h) => h.weekday))].sort();
  if (days.length === 0) return "Sem horário definido";
  return days.map((d) => WEEKDAYS[d].slice(0, 3)).join(", ");
}

function ProfessionalForm({ pro, services, onDone }: { pro?: Pro; services: Service[]; onDone: () => void }) {
  const [selected, setSelected] = useState<string[]>(pro?.services.map((s) => s.serviceId) ?? services.filter((s) => s.active).map((s) => s.id));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const f = new FormData(e.currentTarget);
    const body = { name: f.get("name"), active: pro ? f.get("active") === "on" : true, serviceIds: selected };
    try {
      await api(pro ? `/api/professionals/${pro.id}` : "/api/professionals", { method: pro ? "PATCH" : "POST", body });
      toast.success(pro ? "Profissional atualizado" : "Profissional criado. Ajuste os horários no ícone de relógio.");
      onDone();
    } catch (err) {
      if (err instanceof ClientApiError) setErrors(err.fields);
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>{pro ? "Editar profissional" : "Novo profissional"}</DialogTitle>
        <DialogDescription>Novos profissionais começam com horário de seg. a sex., 9h às 18h.</DialogDescription>
      </DialogHeader>
      <Field label="Nome" htmlFor="name" error={errors.name}>
        <Input id="name" name="name" required defaultValue={pro?.name} />
      </Field>
      <fieldset className="grid gap-2">
        <legend className="mb-1 text-sm font-medium">Serviços que realiza</legend>
        {services.filter((s) => s.active).length === 0 && <p className="text-sm text-muted-foreground">Cadastre serviços primeiro.</p>}
        {services.filter((s) => s.active).map((s) => (
          <label key={s.id} className="flex items-center gap-2 rounded-md border p-2.5 text-sm">
            <input
              type="checkbox"
              className="size-4 accent-[var(--primary)]"
              checked={selected.includes(s.id)}
              onChange={(e) => setSelected((cur) => (e.target.checked ? [...cur, s.id] : cur.filter((id) => id !== s.id)))}
            />
            {s.name}
          </label>
        ))}
      </fieldset>
      {pro && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="active" defaultChecked={pro.active} className="size-4 accent-[var(--primary)]" /> Ativo
        </label>
      )}
      <Button type="submit" disabled={loading}>{loading && <Loader2 className="animate-spin" />} Salvar</Button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Editor de horários: para cada dia, aberto/fechado + início/fim + intervalo.
// Internamente o banco guarda "intervalos" (ver WorkingHours no schema).
// ---------------------------------------------------------------------------
type DayState = { open: boolean; start: string; end: string; hasBreak: boolean; breakStart: string; breakEnd: string };

function toDayStates(hours: WorkingHours[]): DayState[] {
  return WEEKDAYS.map((_, weekday) => {
    const rows = hours.filter((h) => h.weekday === weekday).sort((a, b) => a.startMin - b.startMin);
    if (rows.length === 0) return { open: false, start: "09:00", end: "18:00", hasBreak: true, breakStart: "12:00", breakEnd: "13:00" };
    const first = rows[0], last = rows[rows.length - 1];
    return {
      open: true,
      start: minutesToTime(first.startMin),
      end: minutesToTime(last.endMin),
      hasBreak: rows.length > 1,
      breakStart: rows.length > 1 ? minutesToTime(first.endMin) : "12:00",
      breakEnd: rows.length > 1 ? minutesToTime(rows[1].startMin) : "13:00",
    };
  });
}

function HoursForm({ pro, onDone }: { pro: Pro; onDone: () => void }) {
  const [days, setDays] = useState<DayState[]>(() => toDayStates(pro.workingHours));
  const [loading, setLoading] = useState(false);
  const update = (i: number, patch: Partial<DayState>) => setDays((d) => d.map((day, j) => (j === i ? { ...day, ...patch } : day)));

  async function save() {
    const intervals = days.flatMap((d, weekday) => {
      if (!d.open) return [];
      return d.hasBreak
        ? [{ weekday, start: d.start, end: d.breakStart }, { weekday, start: d.breakEnd, end: d.end }]
        : [{ weekday, start: d.start, end: d.end }];
    });
    setLoading(true);
    try {
      await api(`/api/professionals/${pro.id}/hours`, { method: "PUT", body: { intervals } });
      toast.success("Horários salvos");
      onDone();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-4">
      <DialogHeader>
        <DialogTitle>Horários de {pro.name}</DialogTitle>
        <DialogDescription>Os clientes só verão horários dentro deste expediente.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-2">
        {days.map((d, i) => (
          <div key={i} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[110px_1fr] sm:items-center">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" className="size-4 accent-[var(--primary)]" checked={d.open} onChange={(e) => update(i, { open: e.target.checked })} />
              {WEEKDAYS[i]}
            </label>
            {d.open ? (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Input type="time" className="w-28" value={d.start} onChange={(e) => update(i, { start: e.target.value })} aria-label="Início" />
                até
                <Input type="time" className="w-28" value={d.end} onChange={(e) => update(i, { end: e.target.value })} aria-label="Fim" />
                <label className="ml-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <input type="checkbox" className="accent-[var(--primary)]" checked={d.hasBreak} onChange={(e) => update(i, { hasBreak: e.target.checked })} />
                  Intervalo
                </label>
                {d.hasBreak && (
                  <span className="flex items-center gap-2">
                    <Input type="time" className="w-28" value={d.breakStart} onChange={(e) => update(i, { breakStart: e.target.value })} aria-label="Início do intervalo" />
                    –
                    <Input type="time" className="w-28" value={d.breakEnd} onChange={(e) => update(i, { breakEnd: e.target.value })} aria-label="Fim do intervalo" />
                  </span>
                )}
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Fechado</span>
            )}
          </div>
        ))}
      </div>
      <Button onClick={save} disabled={loading}>{loading && <Loader2 className="animate-spin" />} Salvar horários</Button>
    </div>
  );
}
