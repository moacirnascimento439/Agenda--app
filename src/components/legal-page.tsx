import { Logo } from "@/components/logo";

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <Logo />
        <h1 className="mt-8 text-3xl font-bold">{title}</h1>
        <p className="mt-2 rounded-md border border-amber-400/50 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          ⚠️ Modelo inicial. Antes de cobrar clientes reais, peça a um advogado para revisar este texto.
        </p>
        <div className="mt-6 grid gap-4 leading-relaxed [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:pl-6">{children}</div>
      </div>
    </div>
  );
}
