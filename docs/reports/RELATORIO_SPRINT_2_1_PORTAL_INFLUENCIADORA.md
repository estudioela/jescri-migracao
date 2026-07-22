# TEAR V2.5 — Sprint 2.1: Relatório
## Primeiro acesso e perfil da influenciadora

Data: 2026-07-20
Papel do autor: Tech Lead de execução (agente), a pedido do responsável
do projeto.
Fluxo seguido: Auditoria → Plano → Execução → Validação → Commit.

**Escopo:** exclusivamente `tear-v2-app/` (Laravel 12 + React/Vite). Não
toca no Portal legado GAS (`src/`), no domínio soberano
(`CONTRATO_SOBERANO.md`) nem nas SPECs 025/027/030/032/035 — sistema
separado, com stack de autenticação própria.

Entrega intencionalmente **menor** que o plano técnico completo já
existente (`docs/archive/sprints/PLANO_TECNICO_SPRINT_2_PORTAL_INFLUENCIADORA.md`): por
instrução explícita de abertura desta sessão, só dashboard inicial e
perfil. Campanhas, briefing, upload de materiais e pagamentos ficam para
a próxima entrega — o plano técnico e o backlog em
`docs/_workspace/TASK_ROUTER.md` §15 seguem válidos para essa parte.

---

## 1. Auditoria (estado antes de codar)

Leitura de `TASK_ROUTER.md`, do plano técnico já redigido em sessão
anterior, e do código atual (`tear-v2-app/backend`, `tear-v2-app/frontend`)
confirmou:

- Backend do fluxo "definir senha" (`POST /api/password/reset`,
  `Password::broker()`) já implementado em sessão anterior
  (`fix: complete influencer password setup flow`) — só faltava a página
  no frontend.
- `ParceiraController::update` **não tinha nenhuma checagem de posse**
  (débito já registrado no relatório da Sprint 1, §4 item 1) — qualquer
  autenticado editava qualquer Parceira. Bloqueador real para abrir a
  tela de Perfil: sem fechar isso primeiro, uma influenciadora logada
  poderia editar o cadastro de outra.
- `PATCH /parceiras/{id}` exige `consentimento_aceito: true` desde a
  Sprint 1 (LGPD) — nenhuma tela do frontend enviava esse campo ainda
  (nem a do admin), então a tela de Perfil precisava do checkbox desde o
  início para funcionar.
- `User::parceira()` (relação inversa) já existia — não era um gap, como
  uma nota antiga de backlog sugeria.
- `GET/POST /parceiras/{id}/medidas` já autorizava por posse
  (`ParceiraPolicy::view`) desde a Sprint 1, sem gate de papel — a
  influenciadora já podia gravar as próprias medidas antes desta entrega,
  só não existia UI nem client de API no frontend.
- Suíte de testes na baseline: 109/109 verde, lint limpo.

---

## 2. O que foi entregue

### 2.1 Débito de segurança fechado (pré-requisito da tela de Perfil)

`ParceiraPolicy` ganhou `update()` (mesma regra de `view`: dono do
registro) e `ParceiraController::update` passou a chamar
`$this->authorize('update', $parceira)`. `ADMIN` continua liberado
incondicionalmente via `Gate::before` — nenhuma mudança de comportamento
para o fluxo administrativo real. Dois testes existentes
(`ParceiraTest::test_pode_editar_dados_cadastrais` e
`test_edicao_nao_altera_status`) autenticavam como um usuário qualquer,
sem papel nem posse — não exercitavam o cenário que o teste pretendia
(edição pelo admin) e foram corrigidos para autenticar como ADMIN; nenhum
comportamento de produto mudou. `ConsentimentoHistoricoTest` também
precisou vincular a Parceira ao usuário de teste para continuar
representando um dono editando o próprio cadastro. Dois testes novos:
dono edita o próprio cadastro (sucesso) e usuário sem posse é barrado
(403).

### 2.2 Backend: `GET /me/parceira`

Novo método em `ParceiraController` + rota `auth:sanctum`. Resolve
sempre `request->user()->parceira` — nunca aceita um ID como parâmetro,
eliminando por construção a classe de bug "esqueci de checar posse"
(mesmo princípio já usado pelo Portal legado GAS, SPEC-025/027, citado
aqui só como referência de padrão validado, não como dependência). 404
se o usuário autenticado não tiver Parceira vinculada (caso esperado
para ADMIN/GESTOR_MARCA, que não usam esta rota). Nenhuma tabela nova.

### 2.3 Frontend: fluxo "definir senha"

`ResetPasswordPage` (`/definir-senha`, fora da árvore autenticada, mesmo
padrão de `/cadastro`) lê `token`/`email` da query string (formato já
gerado pelo e-mail de convite, `InfluenciadoraConviteNotification`),
formulário de nova senha + confirmação, consome o endpoint que já
existia (`POST /api/password/reset`), tela de sucesso com link para
`/login`. Fecha o ciclo que a Sprint 1 deixou pela metade — antes desta
entrega, toda influenciadora aprovada recebia um e-mail com link morto.

### 2.4 Frontend: ramificação por papel

`App.tsx` deixou de ser um binário `user ? AppShell : Login` para uma
ramificação de 3 vias: sem sessão → `Login`; `role === 'INFLUENCIADORA'`
→ novo `PortalShell`; qualquer outro papel → `AppShell` (inalterado,
nenhuma tela nem rota administrativa tocada). `PortalShell` reaproveita
o CSS do `AppShell` (`AppShell.module.css`) — mesma casca visual, nav
própria e reduzida (Painel / Perfil, sem itens administrativos).

### 2.5 Dashboard inicial (`PortalDashboardPage`)

Saudação por horário + primeiro nome, status da conta (`StatusBadge`
reaproveitado), e um card de "próximos passos" que muda dinamicamente
conforme o perfil está completo (endereço preenchido) ou não — com link
direto para `/perfil` no segundo caso. Consome `GET /me` (já existente,
via `useAuth`) e `GET /me/parceira` (novo). Nenhuma campanha, briefing,
material ou pagamento — fora de escopo desta entrega por instrução
explícita.

### 2.6 Perfil (`PortalPerfilPage`)

Dois formulários independentes na mesma página:

- **Dados pessoais** — nome, email, telefone, Instagram, chave PIX e
  endereço completo (CEP com auto-preenchimento server-side já
  existente, rua/número/complemento/bairro/cidade/UF). Instagram e
  chave PIX entraram no formulário mesmo não estando no escopo
  originalmente listado ("nome, email, telefone, endereço") porque
  `UpdateParceiraRequest` os exige em **toda** atualização (mesma regra
  que já vale para o admin) — omiti-los quebraria o salvamento.
  Checkbox de consentimento LGPD obrigatório (reaproveita
  `AtualizarCadastroComConsentimentoService` da Sprint 1: grava
  `Consentimento` + `HistoricoAlteracao` por campo alterado, mesma
  transação). Submete via `PATCH /parceiras/{id}` (agora fechado por
  posse, ver §2.1).
- **Medidas** — sutiã (tamanho/numeração/taça), calcinha, linha noite,
  todos `SelectField` com os domínios fechados já validados no backend.
  Submete via `POST /parceiras/{id}/medidas` (já existia, sem mudança).
  Cada envio cria uma nova linha versionada (comportamento já existente,
  append-only) — não há edição/exclusão de medida antiga, por design da
  Sprint 1.

Nenhuma entidade nova, nenhuma migration nova.

---

## 3. Permissões

| Recurso | Regra |
|---|---|
| `GET /me/parceira` | `auth:sanctum`; resolve sempre da sessão, nunca de parâmetro |
| `PATCH /parceiras/{id}` | `auth:sanctum` + `authorize('update', $parceira)` — dono **ou** ADMIN (via `Gate::before`) |
| `GET/POST /parceiras/{id}/medidas` | `auth:sanctum` + `authorize('view', $parceira)` — dono **ou** ADMIN (sem mudança nesta entrega) |

Influenciadora autenticada só acessa e só edita os próprios dados —
validado por teste automatizado com duas Parceiras reais (§4). ADMIN
mantém acesso irrestrito, sem exceção nova.

---

## 4. Validação

**Automatizada** (backend, `php artisan test`):

- 117/117 verde (109 baseline + 8 novos: 2 em `ParceiraTest`, 3 em
  `MeParceiraTest`, 3 em `PortalIsolamentoTest`), `vendor/bin/pint --test`
  limpo.
- `PortalIsolamentoTest` cobre especificamente o critério de sucesso
  desta sprint: influenciadora nunca edita, lê ou grava medidas de
  cadastro alheio; `/me/parceira` sempre retorna a própria Parceira da
  sessão mesmo com outra Parceira ativa no banco.

Frontend: `tsc -b` sem erros, `oxlint` sem warnings novos (o único
warning existente é pré-existente em `auth.tsx`, não tocado nesta
entrega), `vite build` OK.

**Manual, ponta a ponta, no navegador** (dev server local): criada uma
Parceira real como ADMIN → aprovada (dispara convite) → token extraído
do log de e-mail (`MAIL_MAILER=log` em dev) → `/definir-senha` aceitou o
token e criou a senha → login como a influenciadora → `PortalShell`
carregado (nav só Painel/Perfil, sem itens administrativos) → Dashboard
mostrou saudação, status `ATIVA` e "complete seu perfil" com link →
Perfil: dados pessoais salvos com sucesso (CEP `01310-100` preencheu
automaticamente o bairro "Bela Vista"), medidas salvas com sucesso →
Dashboard recarregado passou a mostrar "Seu perfil está completo."

---

## 5. Dívidas e decisões registradas

- **Instagram/chave PIX no formulário de Perfil** — não estavam no
  escopo literal do prompt de abertura ("nome, email, telefone,
  endereço"), incluídos por necessidade técnica (ver §2.6). Não é
  scope creep de produto, é o mínimo para o `PATCH` existente aceitar a
  requisição.
- **`ParceiraFormPage` do admin não envia `consentimento_aceito`** —
  achado durante a auditoria desta sessão: `UpdateParceiraRequest` exige
  esse campo desde a Sprint 1, mas a tela administrativa de edição nunca
  foi atualizada para enviá-lo, então hoje `PATCH /parceiras/{id}` pelo
  admin retorna 422 (campo ausente) sempre que usado por essa tela.
  **Não corrigido nesta sessão** — fora do escopo desta entrega (só
  Portal/Perfil da influenciadora) e é uma tela separada; registrado
  aqui para não ser perdido. Próxima sessão que tocar `ParceiraFormPage`
  deve adicionar o checkbox de consentimento nela também.
- **Fora desta entrega, backlog continua em `TASK_ROUTER.md` §15:**
  campanhas, briefing, upload de material e pagamentos no Portal —
  plano técnico já redigido cobre a extensão natural (`GET
  /me/participacoes`, abrir `POST /materiais` para o dono, telas de
  Detalhe da Participação e Financeiro).
- **TTL do token de "definir senha"** — padrão do Laravel (60 min),
  mesma decisão não bloqueante já registrada no plano técnico; não
  ajustado nesta sessão por falta de dado de uso real.

---

## 6. Critério de sucesso (do prompt de abertura da sprint)

- ✅ Influenciadora recebe convite (fluxo de aprovação da Sprint 1,
  inalterado).
- ✅ Define senha (`/definir-senha`, novo).
- ✅ Faz login (mecanismo existente, sem mudança).
- ✅ Vê seu dashboard (novo, saudação/status/próximos passos).
- ✅ Visualiza/edita seu perfil, incluindo medidas (novo).
- ✅ Isolamento entre influenciadoras validado por teste automatizado
  com duas Parceiras reais.

---

Commit: `feat: complete influencer portal foundation flow` (código,
gerado automaticamente pelo hook de commit do ambiente ao final da
unidade de trabalho) + este relatório.
