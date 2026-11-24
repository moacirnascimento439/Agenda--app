// Onboarding: depois de criar a conta, o dono cadastra o negócio.
import { redirect } from "next/navigation";
import { getMembership } from "@/server/guard";
import { BusinessForm } from "@/components/panel/business-form";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata = { title: "Cadastre seu negócio" };

export default async function OnboardingPage() {
  const result = await getMembership();
  if (!result) redirect("/entrar");
  if (result.membership) redirect("/painel");

  return (
    <div className="min-h-dvh">
      <header className="flex items-center justify-between px-4 py-4 sm:px-8">
        <Logo />
        <ThemeToggle />
      </header>
      <main className="mx-auto max-w-3xl px-4 pb-16">
        <div className="mb-6">
          <p className="text-sm font-medium text-primary">Passo 1 de 3</p>
          <h1 className="text-2xl font-bold sm:text-3xl">Vamos configurar seu negócio</h1>
          <p className="text-muted-foreground">Leva 2 minutos. Você pode mudar tudo depois.</p>
        </div>
        <BusinessForm appUrl={process.env.APP_URL ?? "http://localhost:3000"} />
      </main>
    </div>
  );
}
