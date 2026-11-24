// Página pública do negócio: agendai.com/{slug}
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, MessageCircle } from "lucide-react";
import { db } from "@/server/db";
import { toLocalDateStr } from "@/server/time";
import { BookingWizard } from "@/components/booking/booking-wizard";
import { ThemeToggle } from "@/components/theme-toggle";

type Props = { params: Promise<{ slug: string }> };

async function getBusiness(slug: string) {
  return db.business.findUnique({
    where: { slug },
    include: {
      services: { where: { active: true }, orderBy: { name: "asc" } },
      professionals: { where: { active: true }, include: { services: { select: { serviceId: true } } }, orderBy: { name: "asc" } },
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const business = await getBusiness((await params).slug);
  if (!business) return {};
  return { title: `Agendar em ${business.name}`, description: business.description ?? `Agende online em ${business.name}` };
}

export default async function PublicBusinessPage({ params }: Props) {
  const business = await getBusiness((await params).slug);
  if (!business) notFound();

  // Só mostra serviços que algum profissional ativo realiza
  const offered = new Set(business.professionals.flatMap((p) => p.services.map((s) => s.serviceId)));
  const services = business.services.filter((s) => offered.has(s.id));

  return (
    // A cor do negócio vira a variável CSS --brand, usada nos botões (bg-brand)
    <div style={{ "--brand": business.primaryColor } as React.CSSProperties} className="min-h-dvh">
      <div className="h-28 bg-brand sm:h-36" />
      <main className="mx-auto -mt-14 max-w-xl px-4 pb-16">
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-start gap-4">
            {business.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={business.logoUrl} alt="" className="size-16 shrink-0 rounded-xl border object-cover" />
            ) : (
              <span className="grid size-16 shrink-0 place-items-center rounded-xl bg-brand text-2xl font-bold text-white">
                {business.name.slice(0, 1)}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold leading-tight">{business.name}</h1>
              <p className="text-sm text-muted-foreground">{business.category}</p>
            </div>
            <ThemeToggle />
          </div>
          {business.description && <p className="mt-3 text-sm">{business.description}</p>}
          <div className="mt-3 grid gap-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><MapPin className="size-4 shrink-0" /> {business.address}, {business.city}</span>
            <a href={`https://wa.me/55${business.phone}`} target="_blank" rel="noreferrer" className="flex w-fit items-center gap-2 hover:text-foreground">
              <MessageCircle className="size-4" /> Falar no WhatsApp
            </a>
          </div>
        </div>

        <div className="mt-6">
          <BookingWizard
            slug={business.slug}
            today={toLocalDateStr(new Date(), business.timezone)}
            maxDays={business.maxAdvanceDays}
            refundPolicy={business.refundPolicy}
            services={services.map((s) => ({
              id: s.id, name: s.name, description: s.description, durationMin: s.durationMin,
              priceCents: s.priceCents, paymentPolicy: s.paymentPolicy, depositPercent: s.depositPercent,
            }))}
            professionals={business.professionals.map((p) => ({ id: p.id, name: p.name, serviceIds: p.services.map((s) => s.serviceId) }))}
          />
        </div>

        {business.plan === "FREE" && (
          <p className="mt-10 text-center text-xs text-muted-foreground">
            Agendamento por <Link href="/" className="font-medium hover:underline">Agendaí</Link>
          </p>
        )}
      </main>
    </div>
  );
}
