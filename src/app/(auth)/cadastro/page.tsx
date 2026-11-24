import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, googleEnabled } from "@/auth";
import { RegisterForm } from "@/components/auth/register-form";
import { GoogleButton } from "@/components/auth/google-button";

export const metadata = { title: "Criar conta" };

export default async function RegisterPage() {
  if ((await auth())?.user) redirect("/painel");
  return (
    <div className="grid gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Crie sua conta</h1>
        <p className="text-sm text-muted-foreground">Grátis para começar. Sem cartão de crédito.</p>
      </div>
      {googleEnabled && (
        <>
          <GoogleButton />
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
          </div>
        </>
      )}
      <RegisterForm />
      <p className="text-center text-sm text-muted-foreground">
        Já tem conta? <Link href="/entrar" className="font-medium text-primary hover:underline">Entrar</Link>
      </p>
    </div>
  );
}
