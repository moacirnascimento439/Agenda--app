"use client";
// Formulário do negócio: usado no cadastro inicial (/comecar) e em Configurações.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { Business } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api, ClientApiError } from "@/lib/api-client";
import { CATEGORIES, slugify } from "@/lib/utils";

export function BusinessForm({ initial, appUrl }: { initial?: Business; appUrl: string }) {
  const router = useRouter();
  const isEdit = Boolean(initial);
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [color, setColor] = useState(initial?.primaryColor ?? "#4f46e5");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    const body = Object.fromEntries(new FormData(e.currentTarget));
    try {
      await api("/api/business", { method: isEdit ? "PATCH" : "POST", body });
      toast.success(isEdit ? "Alterações salvas" : "Negócio criado! Agora cadastre seus serviços.");
      router.push(isEdit ? "/painel/configuracoes" : "/painel/servicos");
      router.refresh();
    } catch (err) {
      if (err instanceof ClientApiError) {
        setErrors(err.fields);
        toast.error(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Dados do negócio</CardTitle>
          <CardDescription>Aparecem na sua página pública de agendamento.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome do negócio" htmlFor="name" error={errors.name}>
            <Input
              id="name"
              name="name"
              required
              value={name}
              placeholder="Ex.: Barbearia do João"
              onChange={(e) => {
                setName(e.target.value);
                // Sugere o link automaticamente enquanto o usuário não mexer nele
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
            />
          </Field>
          <Field label="Categoria" htmlFor="category" error={errors.category}>
            <Select id="category" name="category" defaultValue={initial?.category ?? ""} required>
              <option value="" disabled>Selecione…</option>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </Select>
          </Field>
          <Field
            label="Link da sua página"
            htmlFor="slug"
            error={errors.slug}
            hint={`${appUrl.replace(/^https?:\/\//, "")}/${slug || "seu-negocio"}`}
            className="sm:col-span-2"
          >
            <Input
              id="slug"
              name="slug"
              required
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
              }}
            />
          </Field>
          <Field label="Descrição (opcional)" htmlFor="description" error={errors.description} className="sm:col-span-2">
            <Textarea id="description" name="description" maxLength={500} defaultValue={initial?.description ?? ""} placeholder="Conte em poucas palavras o que você oferece" />
          </Field>
          <Field label="WhatsApp / telefone" htmlFor="phone" error={errors.phone}>
            <Input id="phone" name="phone" type="tel" required defaultValue={initial?.phone ?? ""} placeholder="(11) 99999-9999" />
          </Field>
          <Field label="Cidade" htmlFor="city" error={errors.city}>
            <Input id="city" name="city" required defaultValue={initial?.city ?? ""} placeholder="São Paulo - SP" />
          </Field>
          <Field label="Endereço" htmlFor="address" error={errors.address} className="sm:col-span-2">
            <Input id="address" name="address" required defaultValue={initial?.address ?? ""} placeholder="Rua, número - bairro" />
          </Field>
          <Field label="URL do logo (opcional)" htmlFor="logoUrl" error={errors.logoUrl} hint="Upload de imagem chega numa próxima fase">
            <Input id="logoUrl" name="logoUrl" type="url" defaultValue={initial?.logoUrl ?? ""} placeholder="https://…" />
          </Field>
          <Field label="Cor principal" htmlFor="primaryColor" error={errors.primaryColor}>
            <div className="flex gap-2">
              <input
                type="color"
                aria-label="Escolher cor"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-14 cursor-pointer rounded-md border bg-card p-1"
              />
              <Input id="primaryColor" name="primaryColor" value={color} onChange={(e) => setColor(e.target.value)} />
            </div>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Regras de agendamento</CardTitle>
          <CardDescription>O sistema aplica essas regras automaticamente para os clientes.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Field label="Antecedência mínima (min)" htmlFor="minAdvanceMinutes" error={errors.minAdvanceMinutes} hint="Ex.: 60 = até 1h antes">
            <Input id="minAdvanceMinutes" name="minAdvanceMinutes" type="number" min={0} required defaultValue={initial?.minAdvanceMinutes ?? 60} />
          </Field>
          <Field label="Agendar até (dias à frente)" htmlFor="maxAdvanceDays" error={errors.maxAdvanceDays}>
            <Input id="maxAdvanceDays" name="maxAdvanceDays" type="number" min={1} max={365} required defaultValue={initial?.maxAdvanceDays ?? 60} />
          </Field>
          <Field label="Prazo para cancelar (horas)" htmlFor="cancelLimitHours" error={errors.cancelLimitHours}>
            <Input id="cancelLimitHours" name="cancelLimitHours" type="number" min={0} required defaultValue={initial?.cancelLimitHours ?? 24} />
          </Field>
          <Field
            label="Política de cancelamento e reembolso"
            htmlFor="refundPolicy"
            error={errors.refundPolicy}
            hint="Exibida ao cliente antes de confirmar (exigência do Código de Defesa do Consumidor)"
            className="sm:col-span-3"
          >
            <Textarea
              id="refundPolicy"
              name="refundPolicy"
              required
              defaultValue={initial?.refundPolicy ?? "Cancelamentos com pelo menos 24h de antecedência são reembolsados integralmente. Após esse prazo, o sinal não é devolvido."}
            />
          </Field>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={loading}>
          {loading && <Loader2 className="animate-spin" />}
          {isEdit ? "Salvar alterações" : "Criar meu negócio"}
        </Button>
      </div>
    </form>
  );
}
