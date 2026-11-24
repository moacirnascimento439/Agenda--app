# Agendaí

Plataforma SaaS de agendamento online para negócios que atendem com hora marcada: barbearias, salões, clínicas, consultórios, personal trainers, estúdios, pet shops e outros.

> **Status: Fase 1 (MVP) concluída.** O negócio se cadastra, configura serviços, equipe e horários, e os clientes agendam pelo link público. O pagamento online entra na Fase 2.

---

## 1. Como rodar no seu computador

### Pré-requisitos

| Ferramenta | Para quê | Onde baixar |
|---|---|---|
| **Node.js 20 ou mais novo** | Roda o JavaScript/TypeScript | https://nodejs.org (versão LTS) |
| **PostgreSQL 16** | Banco de dados | https://www.postgresql.org/download, ou grátis na nuvem em https://neon.tech |
| **VS Code** (recomendado) | Editor de código | https://code.visualstudio.com |

> **Dica para iniciantes:** em vez de instalar o PostgreSQL, crie um banco grátis no **Neon** (neon.tech) e copie a "connection string" que ele mostra. Ela vai no `DATABASE_URL`.

### Passo a passo

**1. Instale as dependências** (baixa as bibliotecas listadas no `package.json`):

```bash
npm install
```

**2. Crie seu arquivo de configuração** a partir do modelo:

```bash
cp .env.example .env
```

Abra o `.env` e preencha:
- `DATABASE_URL`: o endereço do seu banco PostgreSQL.
- `AUTH_SECRET`: gere um valor com o comando abaixo e cole no arquivo.

```bash
npx auth secret
```

**3. Crie as tabelas no banco** (aplica as "migrations"):

```bash
npm run db:migrate
```

**4. (Opcional) Carregue os dados de demonstração:**

```bash
npm run db:seed
```

Isso cria a "Barbearia Demo". Login: `demo@agendai.com`, senha: `demo12345`.

**5. Inicie o servidor:**

```bash
npm run dev
```

Abra http://localhost:3000. Para ver a página pública de exemplo, acesse http://localhost:3000/barbearia-demo.

### Comandos úteis

| Comando | O que faz |
|---|---|
| `npm run dev` | Roda em modo desenvolvimento (recarrega sozinho ao salvar) |
| `npm run build` | Gera a versão otimizada para produção |
| `npm run db:migrate` | Aplica mudanças do `schema.prisma` no banco |
| `npm run db:seed` | Recria os dados de demonstração |
| `npm run db:studio` | Abre uma interface visual para ver/editar o banco |
| `npm run typecheck` | Verifica erros de tipo do TypeScript |
| `npm run lint` | Verifica problemas no código |

---

## 2. Como o projeto está organizado

```
agendai/
├── prisma/
│   ├── schema.prisma        ← ESTRUTURA DO BANCO (tabelas e relações)
│   ├── migrations/          ← histórico de mudanças do banco
│   └── seed.ts              ← dados de demonstração
│
├── src/
│   ├── app/                 ← ROTAS (cada pasta vira uma URL)
│   │   ├── page.tsx                 → /               (landing page)
│   │   ├── (auth)/entrar            → /entrar
│   │   ├── (auth)/cadastro          → /cadastro
│   │   ├── comecar                  → /comecar        (cadastro do negócio)
│   │   ├── painel/                  → /painel/...     (área do dono)
│   │   ├── [slug]                   → /barbearia-x    (página pública)
│   │   ├── agendamento/[token]      → confirmação do cliente
│   │   └── api/                     ← BACKEND: rotas HTTP (JSON)
│   │
│   ├── server/              ← BACKEND: regras de negócio (só roda no servidor)
│   │   ├── availability.ts  → cálculo de horários livres
│   │   ├── booking.ts       → criação segura de agendamento
│   │   ├── guard.ts         → quem pode acessar o quê
│   │   ├── validators.ts    → validação de dados (Zod)
│   │   ├── email.ts         → envio de e-mails
│   │   ├── rate-limit.ts    → limite de tentativas
│   │   ├── plans.ts         → limites dos planos Grátis/Pro
│   │   └── time.ts          → fuso horário
│   │
│   ├── components/          ← FRONTEND: pedaços de interface reutilizáveis
│   │   ├── ui/              → botões, inputs, cards (padrão shadcn/ui)
│   │   ├── panel/           → telas do painel
│   │   └── booking/         → fluxo de agendamento do cliente
│   │
│   ├── lib/                 ← utilitários usados nos dois lados
│   └── auth.ts              ← configuração do login (Auth.js)
```

### Como uma requisição percorre o sistema

Exemplo: o cliente clica em **"Confirmar agendamento"**.

```
Navegador (booking-wizard.tsx)
   │  POST /api/public/barbearia-demo/appointments  { serviço, horário, dados }
   ▼
app/api/public/[slug]/appointments/route.ts     ← porta de entrada
   │  1. limita tentativas por IP (rate-limit.ts)
   │  2. valida os dados com Zod (validators.ts)
   ▼
server/booking.ts                               ← regra de negócio
   │  3. recalcula os horários livres (availability.ts)
   │  4. abre uma transação e "tranca" a agenda do profissional
   │  5. salva o cliente, o consentimento LGPD e o agendamento
   ▼
PostgreSQL                                      ← última barreira
   │  6. a constraint "Appointment_no_overlap" recusa sobreposições
   ▼
server/email.ts → envia a confirmação → resposta { token } → página de confirmação
```

---

## 3. Decisões importantes (e por quê)

| Decisão | Motivo |
|---|---|
| **Dinheiro em centavos** (`priceCents: 4990`) | `0.1 + 0.2 = 0.30000000000000004` em JavaScript. Inteiros não têm esse erro. |
| **Datas em UTC no banco + fuso do negócio** | 09:00 em Manaus não é 09:00 em São Paulo. Cada negócio tem seu `timezone`. |
| **Três camadas contra agendamento duplo** | Recalcular no servidor, usar um *advisory lock* e uma *exclusion constraint* no banco. Testado com 5 pedidos simultâneos para o mesmo horário: só 1 foi aceito. |
| **Todas as consultas filtram por `businessId`** | É um sistema multi-tenant: um negócio nunca pode ver os dados de outro. |
| **"Soft delete" em serviços e profissionais** | Agendamentos antigos continuam apontando para eles. |
| **Preço "congelado" no agendamento** | Se o negócio mudar o preço, os agendamentos já feitos não mudam. |
| **Token aleatório no link do cliente** | O cliente vê seu agendamento sem login, e ninguém consegue adivinhar o link de outra pessoa. |

---

## 4. Segurança e LGPD (o que já está feito)

- ✅ Senhas guardadas com hash bcrypt (nunca em texto puro)
- ✅ Validação com Zod em todas as entradas do backend
- ✅ Checagem de permissão em todas as rotas do painel
- ✅ Isolamento entre negócios (multi-tenant)
- ✅ Rate limiting no login, no cadastro e no agendamento
- ✅ Consentimento LGPD obrigatório e registrado (`ConsentLog`, com IP, navegador e versão do texto)
- ✅ Política de cancelamento exibida antes de confirmar
- ✅ Nenhum dado clínico é coletado (só dados de agendamento)
- ⚠️ **Antes de ir para produção:** troque o rate limit em memória por Upstash Redis e peça a um advogado para revisar `/termos` e `/privacidade`.

---

## 5. Roteiro das próximas fases

### Fase 2: Pagamentos e check-in
- [ ] Integração com o Mercado Pago (Pix com QR code e cartão)
- [ ] Split de pagamento: o negócio conecta a conta dele via OAuth
- [ ] Reserva de 15 min (`holdExpiresAt`) e expiração automática por cron
- [ ] Webhook do Mercado Pago com validação de assinatura → `CONFIRMADO`
- [ ] QR code no e-mail e tela de check-in com PAGO / SINAL / NÃO PAGO

### Fase 3: Automação e relatórios
- [ ] Lembretes 24h e 2h antes (Vercel Cron + Resend)
- [ ] Cliente cancela/reagenda pelo link, respeitando o prazo
- [ ] Dashboard: faturamento, taxa de faltas, serviços mais vendidos
- [ ] Convite de funcionários (papel STAFF) com login próprio

### Fase 4: Monetização e lançamento
- [ ] Assinatura do plano Pro (cobrança recorrente)
- [ ] Upload de logo
- [ ] Deploy na Vercel + Neon, domínio próprio

---

## 7. Publicar na Vercel

1. Crie um banco grátis no [Neon](https://neon.tech) e copie a *connection string* (`postgresql://...`).
2. Na [Vercel](https://vercel.com/new), clique em **Import** neste repositório.
3. Em **Environment Variables**, adicione:
   - `DATABASE_URL`: a connection string do Neon
   - `AUTH_SECRET`: gere com `npx auth secret` (ou `openssl rand -base64 32`)
   - `APP_URL`: o endereço do site, ex.: `https://agenda-app.vercel.app` (pode ajustar depois do primeiro deploy)
4. Clique em **Deploy**. O comando de build (`prisma migrate deploy`) cria as tabelas no banco automaticamente.
5. (Opcional) Para criar a Barbearia Demo no banco de produção, rode no seu computador, com o `DATABASE_URL` do Neon no `.env`:

```bash
npm run db:seed
```

---

## 6. Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | Sim | Conexão com o PostgreSQL |
| `AUTH_SECRET` | Sim | Chave que protege os cookies de login (`npx auth secret`) |
| `APP_URL` | Sim | Endereço do site (usado nos links dos e-mails) |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Não | Ativa o botão "Continuar com Google" |
| `RESEND_API_KEY` | Não | Sem ela, os e-mails aparecem só no terminal |
| `EMAIL_FROM` | Não | Remetente dos e-mails |
