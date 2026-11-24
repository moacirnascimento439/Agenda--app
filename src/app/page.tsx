// Landing page da plataforma (agendai.com)
import Link from "next/link";
import { BellRing, CalendarCheck, Check, Clock, Link2, Smartphone, UserX, Wallet } from "lucide-react";
import { auth } from "@/auth";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

const FEATURES = [
  { icon: Link2, title: "Seu link de agendamento", text: "Coloque na bio do Instagram e no WhatsApp. O cliente agenda sozinho, 24h por dia." },
  { icon: Clock, title: "Só horários realmente livres", text: "Respeita expediente, intervalos, folgas e a duração de cada serviço. Sem agendamento duplo." },
  { icon: Wallet, title: "Pix e cartão", text: "Cobre o valor inteiro ou um sinal para reservar. O dinheiro cai direto na sua conta.", soon: true },
  { icon: UserX, title: "Menos faltas", text: "Quem paga um sinal aparece. E você sabe na hora, no check-in, quem já pagou.", soon: true },
  { icon: BellRing, title: "Lembretes automáticos", text: "Confirmação na hora e lembretes 24h e 2h antes do horário.", soon: true },
  { icon: Smartphone, title: "Feito para o celular", text: "Painel e página de agendamento pensados para a tela do celular." },
];

const SEGMENTS = ["Barbearias", "Salões", "Clínicas", "Consultórios", "Personal trainers", "Estúdios", "Pet shops", "Professores"];

export default async function LandingPage() {
  const loggedIn = Boolean((await auth())?.user);
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Logo />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          {loggedIn ? (
            <Button asChild><Link href="/painel">Ir para o painel</Link></Button>
          ) : (
            <>
              <Button asChild variant="ghost" className="hidden sm:inline-flex"><Link href="/entrar">Entrar</Link></Button>
              <Button asChild><Link href="/cadastro">Começar grátis</Link></Button>
            </>
          )}
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-10 text-center sm:pt-20">
          <p className="mx-auto mb-4 w-fit rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            Para quem atende com hora marcada
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-6xl">
            Seus clientes agendam sozinhos. <span className="text-primary">Você só atende.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground text-pretty">
            Agenda online com link próprio, horários sempre atualizados e cobrança antecipada para acabar com as faltas.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg"><Link href="/cadastro">Criar minha agenda grátis</Link></Button>
            <Button asChild size="lg" variant="outline"><Link href="/barbearia-demo">Ver uma página de exemplo</Link></Button>
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-2">
            {SEGMENTS.map((s) => (
              <span key={s} className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">{s}</span>
            ))}
          </div>
        </section>

        {/* COMO FUNCIONA */}
        <section className="border-y bg-card">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:grid-cols-3">
            {[
              ["1", "Cadastre seus serviços", "Duração, preço e quem atende."],
              ["2", "Compartilhe seu link", "agendai.com/seu-negocio"],
              ["3", "Receba agendamentos", "Tudo organizado na sua agenda."],
            ].map(([n, t, d]) => (
              <div key={n} className="flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-lg font-bold text-primary-foreground">{n}</span>
                <div>
                  <h3 className="font-semibold">{t}</h3>
                  <p className="text-sm text-muted-foreground">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* RECURSOS */}
        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-center text-3xl font-bold tracking-tight">Tudo o que você precisa, sem complicação</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text, soon }) => (
              <div key={title} className="rounded-xl border bg-card p-5">
                <Icon className="size-6 text-primary" />
                <h3 className="mt-3 flex items-center gap-2 font-semibold">
                  {title}
                  {soon && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">em breve</span>}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* PREÇOS */}
        <section className="bg-muted/50 py-16" id="precos">
          <div className="mx-auto max-w-4xl px-4">
            <h2 className="text-center text-3xl font-bold tracking-tight">Preço justo para quem está começando</h2>
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              <Plan name="Grátis" price="R$ 0" desc="Para testar e para quem atende sozinho." items={["1 profissional", "Até 50 agendamentos/mês", "Link de agendamento", "Confirmação por e-mail"]} cta="Começar grátis" />
              <Plan highlight name="Pro" price="R$ 49" desc="Para negócios em crescimento." items={["Profissionais ilimitados", "Agendamentos ilimitados", "Pagamento por Pix e cartão", "Lembretes automáticos", "Relatórios", "Sem a marca Agendaí"]} cta="Assinar o Pro" />
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground">
        <span className="flex items-center gap-2"><CalendarCheck className="size-4" /> © {new Date().getFullYear()} Agendaí</span>
        <nav className="flex gap-4">
          <Link href="/termos" className="hover:text-foreground">Termos</Link>
          <Link href="/privacidade" className="hover:text-foreground">Privacidade</Link>
        </nav>
      </footer>
    </div>
  );
}

function Plan({ name, price, desc, items, cta, highlight }: { name: string; price: string; desc: string; items: string[]; cta: string; highlight?: boolean }) {
  return (
    <div className={`relative rounded-2xl border bg-card p-6 ${highlight ? "border-primary shadow-lg ring-1 ring-primary" : ""}`}>
      {highlight && <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">Mais escolhido</span>}
      <h3 className="text-lg font-semibold">{name}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
      <p className="mt-4"><span className="text-4xl font-bold">{price}</span><span className="text-muted-foreground">/mês</span></p>
      <ul className="mt-6 grid gap-2 text-sm">
        {items.map((i) => <li key={i} className="flex gap-2"><Check className="size-4 shrink-0 text-primary" /> {i}</li>)}
      </ul>
      <Button asChild className="mt-6 w-full" variant={highlight ? "default" : "outline"}><Link href="/cadastro">{cta}</Link></Button>
    </div>
  );
}
