import { requireOwnerPage } from "@/server/page-guard";
import { PageHeader } from "@/components/panel/page-header";
import { BusinessForm } from "@/components/panel/business-form";
import { CopyLink } from "@/components/panel/copy-link";

export const metadata = { title: "Configurações" };

export default async function SettingsPage() {
  const { business } = await requireOwnerPage();
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  return (
    <>
      <PageHeader title="Configurações" description="Dados do negócio e regras de agendamento." />
      <div className="mb-6">
        <CopyLink url={`${appUrl}/${business.slug}`} />
      </div>
      <BusinessForm initial={business} appUrl={appUrl} />
    </>
  );
}
