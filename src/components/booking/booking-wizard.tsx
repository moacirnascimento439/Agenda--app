"use client";
// =============================================================================
// Fluxo de agendamento do cliente, em passos:
//   1. Serviço → 2. Profissional → 3. Data e horário → 4. Seus dados → confirmar
// Os horários vêm do backend (/api/public/:slug/availability); o frontend
// nunca "decide" o que está livre.
// =============================================================================
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Clock, Loader2, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { api, ClientApiError } from "@/lib/api-client";
import { cn, formatPrice, PAYMENT_POLICY_LABEL } from "@/lib/utils";

type Service = { id: string; name: string; description: string | null; durationMin: number; priceCents: number; paymentPolicy: keyof typeof PAYMENT_POLICY_LABEL; depositPercent: number | null };
type Pro = { id: string; name: string; serviceIds: string[] };
type Slot = { time: string; startsAt: string };

type Props = {
  slug: string;
  services: Service[];
  professionals: Pro[];
  today: string;
  maxDays: number;
  refundPolicy: string;
};

const STEPS = ["Serviço", "Profissional", "Horário", "Seus dados"];

/** Lista de datas a partir de hoje: ["2026-11-24", "2026-11-25", ...] */
function nextDates(today: string, count: number) {
  const [y, m, d] = today.split("-").map(Number);
  return Array.from({ length: count }, (_, i) => new Date(Date.UTC(y, m - 1, d + i)).toISOString().slice(0, 10));
}
const fmt = (d: string, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", ...opts }).format(new Date(`${d}T12:00:00Z`));

export function BookingWizard({ slug, services, professionals, today, maxDays, refundPolicy }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [service, setService] = useState<Service | null>(null);
  const [proId, setProId] = useState<string | null>(null); // null = qualquer profissional
  const [date, setDate] = useState(today);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const dates = useMemo(() => nextDates(today, Math.min(maxDays + 1, 60)), [today, maxDays]);
  const prosForService = professionals.filter((p) => service && p.serviceIds.includes(service.id));

  // Busca horários sempre que serviço, profissional ou data mudam
  useEffect(() => {
    if (!service || step !== 2) return;
    let cancelled = false; // evita mostrar resposta antiga se o usuário trocar de data rápido
    setSlots(null);
    const qs = new URLSearchParams({ serviceId: service.id, date, ...(proId ? { professionalId: proId } : {}) });
    api<{ slots: Slot[] }>(`/api/public/${slug}/availability?${qs}`)
      .then((r) => !cancelled && setSlots(r.slots))
      .catch(() => !cancelled && setSlots([]));
    return () => {
      cancelled = true;
    };
  }, [service, proId, date, step, slug]);

  function chooseService(s: Service) {
    setService(s);
    setSlot(null);
    const pros = professionals.filter((p) => p.serviceIds.includes(s.id));
    // Só um profissional faz esse serviço? Pula a etapa de escolha.
    if (pros.length === 1) {
      setProId(pros[0].id);
      setStep(2);
    } else {
      setStep(1);
    }
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!service || !slot) return;
    setSubmitting(true);
    setErrors({});
    setSubmitError("");
    const f = new FormData(e.currentTarget);
    try {
      const { token } = await api<{ token: string }>(`/api/public/${slug}/appointments`, {
        body: {
          serviceId: service.id,
          professionalId: proId,
          startsAt: slot.startsAt,
          customer: { name: f.get("name"), email: f.get("email"), phone: f.get("phone") },
          notes: f.get("notes"),
          consent: f.get("consent") === "on",
        },
      });
      router.push(`/agendamento/${token}?novo=1`);
    } catch (err) {
      if (err instanceof ClientApiError) {
        setErrors(err.fields);
        setSubmitError(err.message);
        // Horário foi ocupado por outra pessoa: volta para escolher outro
        if (err.status === 409) {
          setSlot(null);
          setStep(2);
        }
      }
      setSubmitting(false);
    }
  }

  const proName = proId ? professionals.find((p) => p.id === proId)?.name : "Qualquer profissional";

  return (
    <div className="grid gap-5">
      {/* Indicador de progresso */}
      <ol className="flex gap-1.5">
        {STEPS.map((label, i) => (
          <li key={label} className="flex-1">
            <div className={cn("h-1.5 rounded-full", i <= step ? "bg-brand" : "bg-muted")} />
            <span className={cn("mt-1 hidden text-xs sm:block", i === step ? "font-medium" : "text-muted-foreground")}>{label}</span>
          </li>
        ))}
      </ol>

      {step > 0 && (
        <button
          type="button"
          onClick={() => setStep(step === 2 && prosForService.length <= 1 ? 0 : step - 1)}
          className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Voltar
        </button>
      )}

      {/* PASSO 1 — Serviço */}
      {step === 0 && (
        <section className="grid gap-2">
          <h2 className="text-lg font-semibold">Escolha o serviço</h2>
          {services.length === 0 && <p className="text-muted-foreground">Nenhum serviço disponível no momento.</p>}
          {services.map((s) => (
            <button
              key={s.id}
              onClick={() => chooseService(s)}
              className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4 text-left transition hover:border-brand hover:shadow-sm"
            >
              <div className="min-w-0">
                <p className="font-medium">{s.name}</p>
                {s.description && <p className="line-clamp-2 text-sm text-muted-foreground">{s.description}</p>}
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Clock className="size-3" /> {s.durationMin} min</p>
              </div>
              <span className="shrink-0 font-semibold">{formatPrice(s.priceCents)}</span>
            </button>
          ))}
        </section>
      )}

      {/* PASSO 2 — Profissional */}
      {step === 1 && (
        <section className="grid gap-2">
          <h2 className="text-lg font-semibold">Com quem?</h2>
          <ProOption icon={<Users className="size-5" />} label="Qualquer profissional" hint="Mostra mais horários" onClick={() => { setProId(null); setSlot(null); setStep(2); }} />
          {prosForService.map((p) => (
            <ProOption key={p.id} icon={<User className="size-5" />} label={p.name} onClick={() => { setProId(p.id); setSlot(null); setStep(2); }} />
          ))}
        </section>
      )}

      {/* PASSO 3 — Data e horário */}
      {step === 2 && (
        <section className="grid gap-4">
          <h2 className="text-lg font-semibold">Escolha o dia e o horário</h2>
          {submitError && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{submitError}</p>}
          <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1">
            {dates.map((d) => (
              <button
                key={d}
                onClick={() => { setDate(d); setSlot(null); }}
                className={cn(
                  "flex w-16 shrink-0 snap-start flex-col items-center rounded-xl border bg-card py-2 transition",
                  d === date ? "border-brand bg-brand text-white" : "hover:border-brand",
                )}
              >
                <span className="text-xs capitalize opacity-80">{d === today ? "Hoje" : fmt(d, { weekday: "short" }).replace(".", "")}</span>
                <span className="text-lg font-semibold">{d.slice(8)}</span>
                <span className="text-xs capitalize opacity-80">{fmt(d, { month: "short" }).replace(".", "")}</span>
              </button>
            ))}
          </div>

          {slots === null ? (
            <div className="flex justify-center py-8"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
          ) : slots.length === 0 ? (
            <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Sem horários livres neste dia. Tente outra data.</p>
          ) : (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {slots.map((s) => (
                <button
                  key={s.startsAt}
                  onClick={() => setSlot(s)}
                  className={cn(
                    "rounded-lg border bg-card py-2.5 text-sm font-medium tabular-nums transition",
                    slot?.startsAt === s.startsAt ? "border-brand bg-brand text-white" : "hover:border-brand",
                  )}
                >
                  {s.time}
                </button>
              ))}
            </div>
          )}
          <Button variant="brand" size="lg" disabled={!slot} onClick={() => { setSubmitError(""); setStep(3); }}>
            Continuar
          </Button>
        </section>
      )}

      {/* PASSO 4 — Dados do cliente */}
      {step === 3 && service && slot && (
        <section className="grid gap-4">
          <div className="rounded-xl border bg-muted/50 p-4 text-sm">
            <p className="font-semibold">{service.name}</p>
            <p className="capitalize text-muted-foreground">
              {fmt(date, { weekday: "long", day: "numeric", month: "long" })} às {slot.time} · {proName}
            </p>
            <p className="mt-1">
              {formatPrice(service.priceCents)} · <span className="text-muted-foreground">Pagamento no local</span>
            </p>
          </div>
          <form onSubmit={submit} className="grid gap-4">
            <h2 className="text-lg font-semibold">Seus dados</h2>
            <Field label="Nome completo" htmlFor="name" error={errors["customer.name"]}>
              <Input id="name" name="name" autoComplete="name" required />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="WhatsApp" htmlFor="phone" error={errors["customer.phone"]}>
                <Input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="(11) 99999-9999" required />
              </Field>
              <Field label="E-mail" htmlFor="email" error={errors["customer.email"]} hint="Enviaremos a confirmação">
                <Input id="email" name="email" type="email" autoComplete="email" required />
              </Field>
            </div>
            <Field label="Observação (opcional)" htmlFor="notes">
              <Textarea id="notes" name="notes" maxLength={300} placeholder="Algo que o profissional deva saber?" />
            </Field>
            <div className="rounded-lg border p-3 text-xs text-muted-foreground">
              <p className="mb-1 font-medium text-foreground">Política de cancelamento</p>
              {refundPolicy}
            </div>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" name="consent" required className="mt-0.5 size-4 accent-[var(--brand)]" />
              <span>
                Li e aceito os <a href="/termos" target="_blank" className="underline">Termos de Uso</a> e a{" "}
                <a href="/privacidade" target="_blank" className="underline">Política de Privacidade</a>, e autorizo o uso dos meus dados para este agendamento.
              </span>
            </label>
            {errors.consent && <p className="text-xs text-destructive">{errors.consent}</p>}
            {submitError && !Object.keys(errors).length && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{submitError}</p>}
            <Button type="submit" variant="brand" size="lg" disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin" /> : <Check />} Confirmar agendamento
            </Button>
          </form>
        </section>
      )}
    </div>
  );
}

function ProOption({ icon, label, hint, onClick }: { icon: React.ReactNode; label: string; hint?: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-3 rounded-xl border bg-card p-4 text-left transition hover:border-brand hover:shadow-sm">
      <span className="grid size-10 place-items-center rounded-full bg-brand/10 text-brand">{icon}</span>
      <span>
        <span className="block font-medium">{label}</span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </span>
    </button>
  );
}
