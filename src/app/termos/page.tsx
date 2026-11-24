import { LegalPage } from "@/components/legal-page";

export const metadata = { title: "Termos de Uso" };

export default function TermsPage() {
  return (
    <LegalPage title="Termos de Uso">
      <p>O Agendaí é uma plataforma que conecta negócios que atendem com hora marcada aos seus clientes.</p>
      <h2>Responsabilidades</h2>
      <ul>
        <li>O <b>negócio</b> é o responsável pelo serviço prestado, pelos preços, pela política de cancelamento e pela emissão de nota fiscal.</li>
        <li>O <b>Agendaí</b> fornece a ferramenta de agendamento e não presta os serviços anunciados.</li>
        <li>O <b>cliente</b> deve informar dados verdadeiros e comparecer no horário ou cancelar dentro do prazo.</li>
      </ul>
      <h2>Cancelamentos e reembolsos</h2>
      <p>Seguem a política definida por cada negócio, exibida antes da confirmação do agendamento, respeitando o Código de Defesa do Consumidor.</p>
      <h2>Planos</h2>
      <p>O plano Grátis possui limites de uso. O plano Pro é cobrado mensalmente e pode ser cancelado a qualquer momento.</p>
    </LegalPage>
  );
}
