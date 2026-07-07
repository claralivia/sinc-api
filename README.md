# SINC API

API do **SINC**, um app de organização financeira para casais. Cuida de autenticação, lançamentos (transações), divisão de gastos, categorias, cartões, metas, gastos fixos recorrentes, dashboard e integração com IA e WhatsApp.

O front-end correspondente vive no repositório [`sinc-web`](https://github.com/claralivia/sinc-web).

## Stack

- Node.js + [Express](https://expressjs.com/) 5, em TypeScript
- [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/)
- [Supabase Auth](https://supabase.com/auth) para login (a API só valida o token, não gerencia senha)
- [Gemini](https://ai.google.dev/) (`@google/generative-ai`) para interpretar lançamentos em linguagem natural
- WhatsApp Cloud API para registrar gastos por mensagem

## Conceitos de domínio

- **User**: espelho local (Mongo) de um usuário do Supabase. Tem `role` (`ADMIN` ou `USER`).
- **Household**: o "vínculo de casal". Cada `User` pode pertencer a um `Household`; todo dado (categoria, cartão, meta, gasto fixo, transação) é gravado com o `householdId` de quem criou, e as listagens só retornam registros do household de quem está pedindo. Isso permite múltiplos casais usando a mesma base sem um ver o dado do outro.
- **`managedUserId`** (em `User`, só faz sentido para `role: ADMIN`): permite que uma conta ADMIN "cadastre como" outro usuário — tudo que ela criar é atribuído a esse usuário em vez da própria conta ADMIN. Existe para contas administrativas que não representam uma pessoa "real" do casal.
- **Transaction**: um lançamento (receita ou despesa). `splitType` define como a despesa é dividida (`MINE`, `HERS`, `SHARED_50_50`, `SHARED_CUSTOM`); quando é compartilhada, `owedBy`/`owedAmount` guardam quem deve quanto. O parceiro de uma divisão **precisa** ser alguém do mesmo household (validado no backend).
- **RecurringExpense**: um "molde" de gasto fixo mensal; "lançar" (`launch`) cria uma `Transaction` de fato para o mês corrente.

## Pré-requisitos

- Node.js 18+
- Um banco MongoDB (Atlas ou local)
- Um projeto Supabase (Auth) — o front-end usa o mesmo projeto
- Uma API key do Gemini (opcional, só necessária para o parser de linguagem natural)
- Credenciais do WhatsApp Cloud API (opcional, só necessária para o webhook de WhatsApp)

## Configuração

```bash
npm install
cp .env.example .env   # preencha com suas credenciais
npm run dev
```

O servidor sobe em `http://localhost:3333` por padrão (ver `PORT`), com um health-check em `GET /health` e todas as rotas de negócio sob `/api`.

### Variáveis de ambiente

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `PORT` | não (padrão `3333`) | Porta HTTP do servidor |
| `MONGO_URI` | sim | Connection string do MongoDB |
| `SUPABASE_URL` | sim | URL do projeto Supabase |
| `SUPABASE_ANON_KEY` | sim | Chave anônima do Supabase, usada para validar o token do usuário |
| `GEMINI_API_KEY` | só para `/ai-parse` | API key do Google Gemini |
| `WHATSAPP_PHONE_NUMBER_ID` | só para o webhook | ID do número no WhatsApp Cloud API |
| `WHATSAPP_ACCESS_TOKEN` | só para o webhook | Token de acesso do WhatsApp Cloud API |
| `WHATSAPP_VERIFY_TOKEN` | só para o webhook | Token usado na verificação do webhook (`hub.verify_token`) |

## Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Sobe o servidor em modo desenvolvimento (`ts-node-dev`, com reload automático) |
| `npm run build` | Compila o TypeScript para `dist/` |
| `npm start` | Roda o build compilado (`dist/server.js`) — usado em produção |

`src/scripts/` tem utilitários de manutenção executados manualmente com `ts-node` (ex: `seedCategories.ts`, `checkAllUsers.ts`). Eles se conectam direto no `MONGO_URI` do `.env` — **rode com cuidado, é o mesmo banco de produção**.

## Autenticação e permissões

Toda rota (exceto `/health` e o webhook do WhatsApp) passa por `authMiddleware`: o token Bearer é validado contra o Supabase, e o usuário correspondente é encontrado (ou criado, no primeiro login) no MongoDB. Rotas administrativas (gerenciar categorias, cartões e usuários) passam ainda por `adminMiddleware`, que exige `role: ADMIN`.

## Rotas principais

Prefixo `/api` omitido abaixo por brevidade.

| Recurso | Rotas |
| --- | --- |
| Usuário | `GET /me`, `GET /users` (admin), `GET /users/partners`, `PUT /users/:id` (admin), `POST /users/household` (admin, vincula um casal) |
| Transações | `GET/POST /transactions`, `GET/PUT/DELETE /transactions/:id`, `GET /transactions/installments/summary` |
| Categorias | `GET /categories`, `POST/PUT/DELETE /categories(/:id)` (admin) |
| Cartões | `GET /cards`, `POST/PUT/DELETE /cards(/:id)` (admin) |
| Metas | `GET/POST /goals`, `PUT/DELETE /goals/:id`, `POST /goals/:id/contribute` |
| Gastos fixos | `GET/POST /recurring-expenses`, `PUT/DELETE /recurring-expenses/:id`, `POST /recurring-expenses/:id/launch` |
| Dashboard | `GET /dashboard?startDate&endDate` |
| IA | `POST /ai-parse` (interpreta uma frase e devolve os campos de uma transação) |
| WhatsApp | `GET/POST /webhook/whatsapp` |

## Estrutura

```
src/
├── app.ts               # monta o Express e registra as rotas
├── server.ts             # ponto de entrada (lê PORT e sobe o app)
├── config/database.ts    # conexão com o MongoDB
├── middlewares/auth.ts   # authMiddleware / adminMiddleware
├── models/               # schemas do Mongoose
├── routes/                # um arquivo de rotas por recurso
├── controllers/           # validação de request/response
├── services/              # regra de negócio
└── scripts/               # utilitários de manutenção (rodados manualmente)
```
