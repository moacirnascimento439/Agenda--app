import { db } from "@/server/db";
import { requireOwnerPage } from "@/server/page-guard";
import { formatDateTime, toLocalDateStr } from "@/server/time";
import { PageHeader } from "@/components/panel/page-header";
import { TimeOffManager } from "@/components/panel/time-off-manager";

export const metadata = { title: "Folgas e bloqueios" };

export default async function TimeOffPage() {
  const { business } = await requireOwnerPage();
  const tz = business.timezone;
  const [items, professionals] = await Promise.all([
    db.timeOff.findMany({
      where: { businessId: business.id, endsAt: { gte: new Date() } },
      include: { professional: { select: { name: true } } },
      orderBy: { startsAt: "asc" },
    }),
    db.professional.findMany({ where: { businessId: business.id, active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  const short: Intl.DateTimeFormatOptions = { weekday: "short", month: "short" };
  return (
    <>
      <PageHeader title="Folgas e bloqueios" description="Nesses períodos ninguém consegue agendar." />
      <TimeOffManager
        today={toLocalDateStr(new Date(), tz)}
        professionals={professionals}
        items={items.map((t) => ({
          id: t.id,
          label: `${formatDateTime(t.startsAt, tz, short)} → ${formatDateTime(t.endsAt, tz, short)}`,
          who: t.professional?.name ?? "Negócio inteiro",
          reason: t.reason,
        }))}
      />
    </>
  );
}
