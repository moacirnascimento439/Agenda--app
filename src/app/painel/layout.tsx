// Layout do painel. Também é a "porta" de segurança das páginas:
// sem login → /entrar | sem negócio → /comecar
import Link from "next/link";
import { redirect } from "next/navigation";
import { ExternalLink, LogOut } from "lucide-react";
import { signOut } from "@/auth";
import { getMembership } from "@/server/guard";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { BottomNav, SideNav } from "@/components/panel/nav";
import { Button } from "@/components/ui/button";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const result = await getMembership();
  if (!result) redirect("/entrar");
  if (!result.membership) redirect("/comecar");
  const { business } = result.membership;

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[240px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col gap-6 border-r bg-card p-4 md:flex">
        <Logo href="/painel" />
        <div className="rounded-lg bg-muted p-3">
          <p className="truncate text-sm font-semibold">{business.name}</p>
          <p className="text-xs text-muted-foreground">Plano {business.plan === "PRO" ? "Pro" : "Grátis"}</p>
        </div>
        <SideNav />
        <div className="mt-auto grid gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/${business.slug}`} target="_blank">
              <ExternalLink /> Ver minha página
            </Link>
          </Button>
          <div className="flex items-center justify-between">
            <form action={logout}>
              <Button variant="ghost" size="sm" type="submit"><LogOut /> Sair</Button>
            </form>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Cabeçalho do celular */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-card/95 px-4 py-3 backdrop-blur md:hidden">
        <Logo href="/painel" />
        <div className="flex items-center">
          <Button asChild variant="ghost" size="icon" aria-label="Ver minha página">
            <Link href={`/${business.slug}`} target="_blank"><ExternalLink /></Link>
          </Button>
          <ThemeToggle />
          <form action={logout}>
            <Button variant="ghost" size="icon" type="submit" aria-label="Sair"><LogOut /></Button>
          </form>
        </div>
      </header>

      <main className="min-w-0 px-4 pb-24 pt-6 sm:px-8 md:pb-10">{children}</main>
      <BottomNav />
    </div>
  );
}
