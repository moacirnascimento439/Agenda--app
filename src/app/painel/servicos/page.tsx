// Página de serviços. Os dados são buscados NO SERVIDOR (direto do banco)
// e entregues prontos ao componente interativo.
import { db } from "@/server/db";
import { requireOwnerPage } from "@/server/page-guard";
import { PageHeader } from "@/components/panel/page-header";
import { ServicesManager } from "@/components/panel/services-manager";

export const metadata = { title: "Serviços" };

export default async function ServicesPage() {
  const { business } = await requireOwnerPage();
  const services = await db.service.findMany({ where: { businessId: business.id }, orderBy: { name: "asc" } });
  return (
    <>
      <PageHeader title="Serviços" description="O que seus clientes podem agendar." />
      <ServicesManager services={services} />
    </>
  );
}
