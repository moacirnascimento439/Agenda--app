import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, googleEnabled } from "@/auth";
import { LoginForm } from "@/components/auth/login-form";
import { GoogleButton } from "@/components/auth/google-button";

export const metadata = { title: "Entrar" };

export default async function LoginPage() {
  if ((await auth())?.user) redirect("/painel");
  return (
    <div className="grid gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Bem-vindo de volta</h1>
        <p className="text-sm text-muted-foreground">Entre para acessar seu painel</p>
      </div>
      {googleEnabled && (
        <>
          <GoogleButton />
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
          </div>
        </>
      )}
      <LoginForm />
      <p className="text-center text-sm text-muted-foreground">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="font-medium text-primary hover:underline">Cadastre-se grátis</Link>
      </p>
    </div>
  );
}
