import { LegalPage } from "@/components/legal-page";

export const metadata = { title: "Política de Privacidade" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Política de Privacidade">
      <p>Esta política explica como o Agendaí trata dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (Lei 13.709/2018 — LGPD).</p>
      <h2>Quais dados coletamos</h2>
      <ul>
        <li><b>Clientes que agendam:</b> nome, e-mail, telefone e os dados do agendamento (serviço, data, horário).</li>
        <li><b>Donos de negócio:</b> nome, e-mail e dados do estabelecimento.</li>
        <li>Registros técnicos: endereço IP e navegador no momento do aceite dos termos.</li>
      </ul>
      <h2>Para que usamos</h2>
      <p>Exclusivamente para realizar e gerenciar agendamentos, enviar confirmações e lembretes, e cumprir obrigações legais. Não vendemos dados.</p>
      <h2>Dados de saúde</h2>
      <p>O Agendaí armazena apenas dados de agendamento. Não coletamos prontuários, diagnósticos ou qualquer informação clínica.</p>
      <h2>Pagamentos</h2>
      <p>Dados de cartão são processados diretamente pelo meio de pagamento. O Agendaí não armazena número de cartão.</p>
      <h2>Compartilhamento</h2>
      <p>Seus dados são compartilhados apenas com o negócio em que você agendou e com fornecedores essenciais (hospedagem, envio de e-mail e pagamentos).</p>
      <h2>Seus direitos</h2>
      <p>Você pode solicitar acesso, correção, exportação ou exclusão dos seus dados a qualquer momento pelo e-mail de contato da plataforma.</p>
    </LegalPage>
  );
}
