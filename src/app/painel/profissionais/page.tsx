import { db } from "@/server/db";
import { requireOwnerPage } from "@/server/page-guard";
import { limitsFor } from "@/server/plans";
import { PageHeader } from "@/components/panel/page-header";
import { ProfessionalsManager } from "@/components/panel/professionals-manager";

export const metadata = { title: "Equipe" };

export default async function ProfessionalsPage() {
  const { business } = await requireOwnerPage();
  const [professionals, services] = await Promise.all([
    db.professional.findMany({
      where: { businessId: business.id },
      include: { services: { select: { serviceId: true } }, workingHours: true },
      orderBy: [{ active: "desc" }, { name: "asc" }],
    }),
    db.service.findMany({ where: { businessId: business.id }, orderBy: { name: "asc" } }),
  ]);
  const activeCount = professionals.filter((p) => p.active).length;
  return (
    <>
      <PageHeader title="Equipe" description="Quem atende, quais serviços faz e em que horários." />
      <ProfessionalsManager
        professionals={professionals}
        services={services}
        canAddMore={activeCount < limitsFor(business).professionals}
      />
    </>
  );
}
