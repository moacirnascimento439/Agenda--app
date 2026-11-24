"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarOff, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api, ClientApiError } from "@/lib/api-client";

type Item = { id: string; label: string; who: string; reason: string | null };

export function TimeOffManager({ items, professionals, today }: { items: Item[]; professionals: { id: string; name: string }[]; today: string }) {
  const router = useRouter();
  const [allDay, setAllDay] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    const f = new FormData(e.currentTarget);
    const startDate = String(f.get("startDate"));
    const endDate = String(f.get("endDate") || startDate);
    // Dia inteiro = da 00:00 do primeiro dia até 23:59 do último
    const body = {
      professionalId: f.get("professionalId") || null,
      start: `${startDate}T${allDay ? "00:00" : f.get("startTime")}`,
      end: `${endDate}T${allDay ? "23:59" : f.get("endTime")}`,
      reason: f.get("reason"),
    };
    try {
      await api("/api/time-off", { body });
      toast.success("Bloqueio criado");
      (e.target as HTMLFormElement).reset();
      router.refresh();
    } catch (err) {
      if (err instanceof ClientApiError) setErrors(err.fields);
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    await api(`/api/time-off/${id}`, { method: "DELETE" });
    toast.success("Bloqueio removido");
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[400px_1fr] lg:items-start">
      <Card>
        <CardHeader>
          <CardTitle>Novo bloqueio</CardTitle>
          <CardDescription>Feriados, férias, folgas ou um horário reservado.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4">
            <Field label="Para quem" htmlFor="professionalId">
              <Select id="professionalId" name="professionalId" defaultValue="">
                <option value="">Negócio inteiro (todos)</option>
                {professionals.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} className="size-4 accent-[var(--primary)]" />
              Dia inteiro
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Field label="De" htmlFor="startDate"><Input id="startDate" name="startDate" type="date" min={today} required /></Field>
              <Field label="Até" htmlFor="endDate" hint={allDay ? "Vazio = mesmo dia" : undefined}>
                <Input id="endDate" name="endDate" type="date" min={today} required={!allDay} />
              </Field>
              {!allDay && (
                <>
                  <Field label="Hora início" htmlFor="startTime"><Input id="startTime" name="startTime" type="time" required /></Field>
                  <Field label="Hora fim" htmlFor="endTime" error={errors.end}><Input id="endTime" name="endTime" type="time" required /></Field>
                </>
              )}
            </div>
            <Field label="Motivo (opcional)" htmlFor="reason"><Input id="reason" name="reason" placeholder="Ex.: Natal, férias, consulta médica" /></Field>
            <Button type="submit" disabled={loading}>{loading && <Loader2 className="animate-spin" />} Bloquear</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-2">
        <h2 className="text-sm font-semibold text-muted-foreground">Próximos bloqueios</h2>
        {items.length === 0 && <Card className="p-8 text-center text-sm text-muted-foreground">Nenhum bloqueio agendado.</Card>}
        {items.map((t) => (
          <Card key={t.id} className="flex items-center gap-3 p-3">
            <CalendarOff className="size-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{t.label}</p>
              <p className="truncate text-xs text-muted-foreground">{t.who}{t.reason ? ` · ${t.reason}` : ""}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => remove(t.id)} aria-label="Remover"><Trash2 /></Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
