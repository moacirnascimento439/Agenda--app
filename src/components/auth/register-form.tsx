"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { api, ClientApiError } from "@/lib/api-client";

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setError("");
    const form = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    try {
      // 1) cria a conta no backend  2) faz login automaticamente  3) vai para o onboarding
      await api("/api/register", { body: form });
      await signIn("credentials", { email: form.email, password: form.password, redirect: false });
      router.push("/comecar");
      router.refresh();
    } catch (err) {
      if (err instanceof ClientApiError) {
        setErrors(err.fields);
        if (!Object.keys(err.fields).length) setError(err.message);
      }
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <Field label="Seu nome" htmlFor="name" error={errors.name}>
        <Input id="name" name="name" autoComplete="name" required />
      </Field>
      <Field label="E-mail" htmlFor="email" error={errors.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Senha" htmlFor="password" error={errors.password} hint="Mínimo de 8 caracteres">
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
      </Field>
      {error && <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading} className="w-full">
        {loading && <Loader2 className="animate-spin" />} Criar conta grátis
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Ao criar a conta você concorda com os{" "}
        <Link href="/termos" className="underline">Termos de Uso</Link> e a{" "}
        <Link href="/privacidade" className="underline">Política de Privacidade</Link>.
      </p>
    </form>
  );
}
