"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Clock, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import type { Service } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api, ClientApiError } from "@/lib/api-client";
import { formatPrice, PAYMENT_POLICY_LABEL } from "@/lib/utils";

/** "45,90" ou "45.90" → 4590 centavos */
function parsePrice(value: string) {
  const n = Number(value.replace(/\./g, "").replace(",", ".").replace(/[^\d.]/g, ""));
  return Math.round((Number.isFinite(n) ? n : 0) * 100);
}

export function ServicesManager({ services }: { services: Service[] }) {
  const [editing, setEditing] = useState<Service | "new" | null>(null);
  const router = useRouter();

  async function deactivate(s: Service) {
    if (!confirm(`Desativar "${s.name}"? Ele deixa de aparecer para os clientes.`)) return;
    try {
      await api(`/api/services/${s.id}`, { method: "DELETE" });
      toast.success("Serviço desativado");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  const active = services.filter((s) => s.active);
  const inactive = services.filter((s) => !s.active);

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setEditing("new")}><Plus /> Novo serviço</Button>
      </div>

      {active.length === 0 && (
        <Card className="p-10 text-center text-muted-foreground">
          Nenhum serviço ainda. Cadastre o primeiro para começar a receber agendamentos.
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {[...active, ...inactive].map((s) => (
          <Card key={s.id} className={s.active ? "p-4" : "p-4 opacity-60"}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate font-semibold">{s.name}</h3>
                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="size-3.5" /> {s.durationMin} min · {formatPrice(s.priceCents)}
                </p>
              </div>
              <div className="flex shrink-0">
                <Button variant="ghost" size="icon" onClick={() => setEditing(s)} aria-label="Editar"><Pencil /></Button>
                {s.active && (
                  <Button variant="ghost" size="icon" onClick={() => deactivate(s)} aria-label="Desativar"><Trash2 /></Button>
                )}
              </div>
            </div>
            {s.description && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{s.description}</p>}
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Badge>
                {PAYMENT_POLICY_LABEL[s.paymentPolicy]}
                {s.paymentPolicy === "DEPOSIT" && ` (${s.depositPercent}%)`}
              </Badge>
              {!s.active && <Badge className="border-destructive/40 text-destructive">Inativo</Badge>}
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          {editing !== null && (
            <ServiceForm
              service={editing === "new" ? undefined : editing}
              onDone={() => {
                setEditing(null);
                router.refresh(); // pede ao servidor a lista atualizada
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function ServiceForm({ service, onDone }: { service?: Service; onDone: () => void }) {
  const [policy, setPolicy] = useState(service?.paymentPolicy ?? "ON_SITE");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    const f = new FormData(e.currentTarget);
    const body = {
      name: f.get("name"),
      description: f.get("description"),
      durationMin: Number(f.get("durationMin")),
      priceCents: parsePrice(String(f.get("price"))),
      paymentPolicy: policy,
      depositPercent: policy === "DEPOSIT" ? Number(f.get("depositPercent")) : null,
      active: service ? f.get("active") === "on" : true,
    };
    try {
      await api(service ? `/api/services/${service.id}` : "/api/services", { method: service ? "PATCH" : "POST", body });
      toast.success(service ? "Serviço atualizado" : "Serviço criado");
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
        <DialogTitle>{service ? "Editar serviço" : "Novo serviço"}</DialogTitle>
        <DialogDescription>Ex.: corte de cabelo, consulta, sessão de fisioterapia, banho e tosa…</DialogDescription>
      </DialogHeader>
      <Field label="Nome" htmlFor="name" error={errors.name}>
        <Input id="name" name="name" required defaultValue={service?.name} />
      </Field>
      <Field label="Descrição (opcional)" htmlFor="description" error={errors.description}>
        <Textarea id="description" name="description" defaultValue={service?.description ?? ""} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Duração (minutos)" htmlFor="durationMin" error={errors.durationMin}>
          <Input id="durationMin" name="durationMin" type="number" min={5} step={5} required defaultValue={service?.durationMin ?? 30} />
        </Field>
        <Field label="Preço (R$)" htmlFor="price" error={errors.priceCents}>
          <Input
            id="price"
            name="price"
            inputMode="decimal"
            required
            placeholder="0,00"
            defaultValue={service ? (service.priceCents / 100).toFixed(2).replace(".", ",") : ""}
          />
        </Field>
      </div>
      <Field
        label="Forma de pagamento"
        htmlFor="paymentPolicy"
        hint={policy !== "ON_SITE" ? "O pagamento online (Pix/cartão) será ativado na Fase 2. Até lá, o cliente paga no local." : undefined}
      >
        <Select id="paymentPolicy" value={policy} onChange={(e) => setPolicy(e.target.value as typeof policy)}>
          {Object.entries(PAYMENT_POLICY_LABEL).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </Select>
      </Field>
      {policy === "DEPOSIT" && (
        <Field label="Sinal (%)" htmlFor="depositPercent" error={errors.depositPercent}>
          <Input id="depositPercent" name="depositPercent" type="number" min={1} max={99} required defaultValue={service?.depositPercent ?? 30} />
        </Field>
      )}
      {service && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="active" defaultChecked={service.active} className="size-4 accent-[var(--primary)]" />
          Serviço ativo (visível para os clientes)
        </label>
      )}
      <Button type="submit" disabled={loading}>
        {loading && <Loader2 className="animate-spin" />} Salvar
      </Button>
    </form>
  );
}
