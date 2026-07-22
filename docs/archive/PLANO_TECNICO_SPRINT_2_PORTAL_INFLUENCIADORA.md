# TEAR V2.5 — Sprint 2: Plano Técnico
## Portal da Influenciadora

Data: 2026-07-20
Papel do autor: Tech Lead de execução (agente), a pedido do responsável
do projeto.
Status: **plano técnico. Nenhum código foi escrito, nenhuma migration
criada, nenhum arquivo de aplicação alterado para produzir este
documento.**

**Escopo:** exclusivamente `tear-v2-app/` (Laravel 13 + React/Vite).
Não toca no Portal legado GAS (`src/`), no seu domínio soberano
(`CONTRATO_SOBERANO.md`) nem nas SPECs 025/027/030/032/035 — sistema
separado, com stack de autenticação própria (OAuth Google), sem relação
de dependência com este plano. Onde esse sistema legado já resolveu um
problema equivalente (isolamento entre influenciadoras, `parceira_id`
sempre da sessão), ele é citado como referência de solução já validada
em produção, não como dependência.

## 0. Fontes

- `docs/RELATORIO_SPRINT_1_FUNDACAO_DADOS.md` — o que a Sprint 1 entregou
  (RBAC de leitura, `Parceira.user_id`, Briefing 1:N, consentimento/
  histórico) e os débitos que ela deixou explicitamente para esta sprint.
- `docs/PLANO_IMPLEMENTACAO_TEAR_V2.5.md` §3 (Sprint 2) — objetivo,
  entregas mínimas e critério de conclusão já pactuados.
- `docs/PRD.md` §6.8, §6, §9 (RF-026…RF-030), §10 — requisitos funcionais
  e não funcionais do Portal.
- `docs/ESPECIFICACAO_FUNCIONAL_TEAR_V2.5.md` §6, §8 — regra de
  visibilidade de campanha e especificação de Briefing 1:N (já
  implementada na Sprint 1).
- `docs/design/UX_FLOW.md` (Perfil: Influenciadora) e
  `docs/_workspace/TASK_ROUTER.md` §15 (governança do `tear-v2-app`,
  módulo por módulo, sem ADR/SPEC formal — mesmo padrão adotado aqui).
- Leitura direta do código atual (`tear-v2-app/backend/app/**`,
  `tear-v2-app/frontend/src/**`) — necessária porque a Sprint 1 avançou
  mais do que os documentos de planejamento registram (ver §1).

---

## 1. Estado atual reaproveitável (achado antes de planejar)

Antes de desenhar Sprint 2 do zero, uma leitura do código mostrou que a
Sprint 1 já implementou boa parte do que o Portal precisa — o plano
original tratava "regra de visibilidade de campanha" como entrega do
Sprint 2, mas ela já existe como efeito colateral do RBAC de leitura da
Sprint 1. Registrar isso aqui evita redesenhar o que já está pronto.

### 1.1 Já implementado e reaproveitável sem alteração

- **Login por sessão (Sanctum, guard `web`)** já funciona para qualquer
  papel: `POST /api/login` (`AuthController::login`, com
  `Auth::attempt` + `session()->regenerate()`), `POST /api/logout`,
  `GET /api/me` (retorna `role`). Frontend: `lib/auth.tsx`
  (`AuthProvider`/`useAuth`) já expõe `user.role` (`'ADMIN' |
  'GESTOR_MARCA' | 'INFLUENCIADORA'`) a toda a árvore. **Não é preciso
  nenhum mecanismo de autenticação novo** — a influenciadora já consegue
  logar hoje com e-mail/senha, só cai no `AppShell` administrativo
  porque o frontend não ramifica por papel ainda.
- **Papel `INFLUENCIADORA`** já existe (`RoleSeeder`), já é atribuído
  automaticamente em `ParceiraController::aprovar` (Sprint 1) junto com
  a criação do `User` e o convite por e-mail.
- **Isolamento por dono já implementado nas policies e nos controllers**
  (Sprint 1, achado "RBAC de leitura"):
  - `ParceiraPolicy::view` — só o dono (`parceira.user_id === user.id`).
  - `ParticipacaoNaCampanhaPolicy::view` — só participação `ATIVA` **e**
    do próprio dono (`app/Policies/ParticipacaoNaCampanhaPolicy.php:20`,
    comentário já cita a `ESPECIFICACAO_FUNCIONAL §6` como fonte).
  - `CampanhaController::index`/`show`, `ParticipacaoController::index`,
    `ParceiraController::index` já filtram por
    `when(!$user->hasRole('ADMIN'), fn ($q) => $q->where('parceira_id',
    $user->parceira?->id)->where('status', 'ATIVA'))` — exatamente a
    regra de PRD §6 ("`parceira_id` deriva exclusivamente da sessão").
  - `BriefingController::index`, `MaterialController::index`,
    `PagamentoController::show` já chamam
    `$this->authorize('view', $participacao)` — herdam o isolamento
    acima sem lógica própria.
  - `Gate::before` (`AppServiceProvider.php:24`) libera ADMIN
    incondicionalmente; nenhuma policy precisa tratar ADMIN como caso
    especial.

  **Conclusão prática:** a regra de negócio "influenciadora só vê o que
  é seu" já está no backend, testada (Sprint 1, `RbacIsolamentoTest`) e
  em produção-de-desenvolvimento. Sprint 2 **não redesenha isolamento**;
  consome o que já existe e fecha as duas lacunas reais (§1.2).

### 1.2 Lacunas reais (o que falta de verdade)

1. **Fluxo de "definir senha" não existe.** `ParceiraController::aprovar`
   já gera o token (`Password::broker()->createToken`) e dispara
   `InfluenciadoraConviteNotification`, cujo e-mail aponta para
   `{FRONTEND_URL}/definir-senha?token=...&email=...`
   (`InfluenciadoraConviteNotification.php:25`) — **essa rota não existe
   no frontend** (não há página nem entrada em `App.tsx`) **e não existe
   endpoint de backend que consuma o token** (`grep` por
   `Password::broker` no projeto só retorna a linha que *cria* o token;
   `routes/api.php` não tem nenhuma rota de reset). Toda influenciadora
   aprovada hoje recebe um e-mail com um link morto — **bloqueador
   absoluto**, sem ele ninguém jamais faz o primeiro login. `password_reset_tokens`
   (tabela padrão do Laravel) já existe via migration `0001_01_01_000000_create_users_table.php`
   — não precisa de migration nova.
2. **Frontend não ramifica por papel.** `App.tsx` sempre monta
   `<AppShell>` para qualquer `user` autenticado — a influenciadora, se
   conseguisse logar hoje, cairia no shell administrativo (nav de
   Marcas/Campanhas/Parceiras, RBAC de escrita bloqueado nas rotas, mas
   nenhuma tela pensada para ela). É preciso um shell e uma árvore de
   rotas próprios ("Portal", distinto do `AppShell`), conforme já
   decidido em `PLANO_IMPLEMENTACAO_TEAR_V2.5.md` §3 Sprint 2.
3. **Não existe endpoint "minhas participações" plano (fora de uma
   campanha específica).** `GET /campanhas/{campanha}/participacoes`
   exige já saber o `campanha_id` — bom para o admin (que navega por
   campanha), ruim para o dashboard da influenciadora (que precisa
   listar tudo que é dela, através de campanhas diferentes, numa
   chamada). Gap real de API, não de autorização (a autorização por
   trás já existe).
4. **Envio de material fechado para ADMIN.** `POST
   /participacoes/{participacao}/materiais` tem `middleware('role:ADMIN')`
   em `routes/api.php` — hoje só a equipe consegue subir material, nunca
   a própria influenciadora, mesmo sendo o RF explícito do Portal
   (PRD RF do §5.4/§6.8, "upload de material"). Único endpoint de
   escrita do domínio de campanha que precisa abrir para o dono, e
   precisa de guarda de posse (hoje `role:ADMIN` é suficiente porque só
   ADMIN chega lá; abrir para `INFLUENCIADORA` sem checar
   `participacao.parceira.user_id === user.id` reabriria a mesma classe
   de furo que a Sprint 1 fechou em leitura).
5. **Edição de perfil pela influenciadora não testada pela ótica do
   dono.** `PATCH /parceiras/{id}` já existe, já usa
   `AtualizarCadastroComConsentimentoService` (consentimento LGPD +
   histórico, Sprint 1) e já está atrás de `ParceiraPolicy` — mas
   `ParceiraPolicy` não tem método `update` declarado, então o Gate cai
   no comportamento padrão do Laravel para uma ability sem policy
   explícita: **nega por padrão caso `Gate::before` não intercepte**, e
   hoje ninguém chama `$this->authorize('update', ...)` em
   `ParceiraController::update` — a rota está aberta a **qualquer**
   autenticado, não só ao dono (débito já registrado no relatório da
   Sprint 1, §4 item 1: "mutação de Parceira sem checagem de posse").
   Precisa fechar antes do Portal permitir edição de perfil, senão uma
   influenciadora autenticada pode editar o cadastro de outra.

Essas cinco lacunas — e só elas — são o escopo real de backend da
Sprint 2. O resto é composição de UI sobre API que já existe.

---

## 2. Arquitetura

Nenhuma peça de infraestrutura nova. Mesma stack, mesmo processo, mesmo
banco, mesma sessão. A "camada de Portal" é uma composição de rotas e
telas novas no frontend consumindo endpoints que majoritariamente já
existem (mais 3 endpoints novos e 2 ajustes de autorização, ver §7).

### Frontend

- **Ramificação por papel em `App.tsx`**: hoje
  `user ? <AppShell> : <Login>`. Passa a ser um `switch` de 3 vias —
  `!user` → `Login`; `user.role === 'INFLUENCIADORA'` → novo
  `<PortalShell>` com sua própria árvore de `<Route>`; qualquer outro
  papel (`ADMIN`/`GESTOR_MARCA`) → `<AppShell>` atual, inalterado. Não
  reaproveitar componentes de página do `AppShell` no Portal (mesma
  decisão já registrada em `PLANO_IMPLEMENTACAO_TEAR_V2.5.md` §3: "não
  reaproveitar as mesmas telas") — o admin lista/edita qualquer parceira
  com paginação e filtros; a influenciadora só lê o próprio recorte,
  telas com formas diferentes mesmo quando o dado é parecido.
- **`PortalShell`**: novo componente-irmão de `AppShell.tsx`, mesmo
  padrão (CSS Modules, sem lib de estado global), nav própria
  (Dashboard/Campanhas/Financeiro/Perfil), sem os itens administrativos
  (Marcas, aprovação de parceiras).
- **Rota `/definir-senha`** fica **fora** da ramificação por papel (como
  `/cadastro` hoje) — acessível sem sessão, pois é ela que cria a
  primeira sessão utilizável.
- Nenhuma lib nova (sem React Query, sem Zustand/Redux) — mesmo padrão
  atual de `apiClient` + hooks locais de página.

### Backend

- Mesmo app Laravel, mesmo `routes/api.php`, novo grupo de rotas sob
  `/me/*` (auto-escopadas, `parceira_id` nunca vem de parâmetro —
  literalmente a recomendação de `ESPECIFICACAO_FUNCIONAL §6`) mais as
  rotas públicas de reset de senha.
- **Nenhuma tabela nova.** `password_reset_tokens` já existe (schema
  padrão do Laravel). Nenhuma entidade de domínio nova — ver §3.
- Upload de material reaproveita `GoogleDriveService`/fallback local já
  existente (`MaterialController::store`) — só muda o middleware da
  rota e adiciona guarda de posse.

### Diagrama de dependência (alto nível)

```
Login (existente)
   │
   ▼
GET /me  →  role
   │
   ├── ADMIN / GESTOR_MARCA → AppShell (existente, inalterado)
   │
   └── INFLUENCIADORA → PortalShell (novo)
          │
          ├── GET  /me/participacoes        (novo — dashboard/lista)
          ├── GET  /participacoes/{id}/briefings   (existente, já autoriza dono)
          ├── POST /participacoes/{id}/materiais   (existente, abrir p/ dono)
          ├── GET  /participacoes/{id}/pagamento   (existente, já autoriza dono)
          ├── GET  /me/parceira              (novo — perfil próprio)
          └── PATCH /parceiras/{id}          (existente, fechar p/ dono)
```

---

## 3. Entidades envolvidas

**Nenhuma entidade nova.** Sprint 2 é uma camada de consumo sobre o
modelo já existente:

| Entidade | Papel no Portal | Alteração necessária |
|---|---|---|
| `User` | identidade + `role` | nenhuma |
| `Parceira` | perfil, dono do vínculo (`user_id`) | nenhuma no schema; `ParceiraPolicy` ganha `update` |
| `Campanha` | contexto de cada participação | nenhuma |
| `ParticipacaoNaCampanha` | unidade central do Portal (status `ATIVA` = visível) | nenhuma |
| `Briefing` | leitura por tipo de conteúdo (1:N, já Sprint 1) | nenhuma |
| `Material` | upload pela própria influenciadora | rota de escrita reaberta para o dono |
| `Pagamento` | consulta previsto×pago | nenhuma |
| `Consentimento` / `HistoricoAlteracao` | efeito colateral de editar perfil (Sprint 1) | nenhuma |

Se alguma tela exigir agregação (ex.: "financeiro por período", como o
Portal legado GAS já tem em SPEC-030), a decisão é **não criar entidade
de projeção nova** — compor no controller/Resource a partir de
`ParticipacaoNaCampanha::with('campanha', 'pagamento')`, mesmo princípio
que o Portal legado já usa ("fachada sem agregado próprio", SPEC-027/030/
032). Ver §7.2.

---

## 4. Autenticação

**Decisão: reaproveitar integralmente o mecanismo atual (Sanctum SPA,
sessão via cookie, guard `web`, `Auth::attempt` com e-mail+senha).**
Nenhuma biblioteca nova, nenhum fluxo federado (diferente do Portal
legado GAS, que precisou de OAuth Google por estar hospedado em Apps
Script — `ADR-013` — restrição que não existe aqui: `tear-v2-app` é uma
SPA servida normalmente, sem sandbox de iframe).

O único trabalho de autenticação da Sprint 2 é fechar o ciclo que a
Sprint 1 deixou pela metade — **definir senha a partir do convite**:

- **Backend:** dois endpoints novos, públicos (sem `auth:sanctum`,
  mesmo padrão de `/login`), usando `Password::broker()` (já parte do
  Laravel, zero dependência nova):
  - `POST /api/password/reset` — recebe `token`, `email`, `password`,
    `password_confirmation`; chama `Password::broker()->reset(...)`.
    Fail-closed: token inválido/expirado retorna 422 com mensagem
    genérica (não revelar se o e-mail existe).
  - Reaproveitar `Password::broker()->createToken()` já usado em
    `ParceiraController::aprovar` — nenhum endpoint de "reenviar
    convite" nesta sprint (fora do escopo mínimo; se necessário, é uma
    entrega pequena e isolada depois).
- **Frontend:** página nova `ResetPasswordPage` (`/definir-senha`,
  fora da árvore autenticada) — lê `token`/`email` da query string
  (mesmo padrão de link já gerado pelo e-mail), formulário de nova
  senha + confirmação, chama o endpoint, redireciona para `/login` em
  caso de sucesso.
- **Sessão pós-login:** nenhuma mudança — `useAuth().login()` já
  funciona para qualquer papel; o Portal só precisa que, após
  `login()`, o `App.tsx` leia `user.role` e monte `PortalShell` em vez
  de `AppShell`.

**Fora de escopo desta sprint (não é bloqueador):** 2FA, expiração de
sessão diferenciada por papel, rate limit dedicado ao login da
influenciadora (o `/login` já não tem throttle específico hoje para
nenhum papel — débito pré-existente, não amplificado por esta sprint).

---

## 5. Permissões (RBAC)

Nenhuma mudança estrutural — o RBAC por papel (Spatie Permission) e por
dono (policies, Sprint 1) já é a fundação certa. Sprint 2 aplica o
padrão já estabelecido às duas superfícies que ainda não o tinham:

| Recurso | Regra hoje | Regra após Sprint 2 |
|---|---|---|
| `GET /me/participacoes` (novo) | — | `auth:sanctum`; sempre filtra por `user->parceira?->id` e `status = 'ATIVA'` — não precisa checar papel porque a própria query já restringe ao dono da sessão (ADMIN não usa esta rota, usa `/campanhas/{id}/participacoes`) |
| `POST /participacoes/{id}/materiais` | `role:ADMIN` | `auth:sanctum` + `$this->authorize('update', $participacao)` (novo método na policy, mesma condição de `view`: `status ATIVA && parceira.user_id === user.id`) **OU** `role:ADMIN`. Duas portas de entrada legítimas, mesmo recurso — ADMIN sobe material em nome da influenciadora (caso de suporte), influenciadora sobe o próprio. |
| `PATCH /parceiras/{id}` | qualquer autenticado (débito Sprint 1 §4.1) | `$this->authorize('update', $parceira)` — `ParceiraPolicy::update` novo, mesma regra de `view` (dono) `\|\|` `role:ADMIN` (via `Gate::before`, já automático) |
| `GET /me/parceira` (novo) | — | `auth:sanctum`; resolve sempre `request->user()->parceira`, nunca aceita ID — elimina a classe de bug "esqueci de checar posse" por construção |

**Princípio que se mantém de SPEC-025/027 do Portal legado (citado como
referência de solução já validada, não como dependência):** toda rota
consumida pelo papel `INFLUENCIADORA` deriva `parceira_id`
exclusivamente da sessão, nunca de parâmetro do cliente. As rotas
novas (`/me/*`) seguem esse princípio por construção; as rotas
reaproveitadas (`briefings`, `pagamento`, `materiais` de leitura) já o
seguem via policy desde a Sprint 1.

`GESTOR_MARCA` **não faz parte do escopo desta sprint** — papel já
existe como seed, mas `docs/PRD.md` §11 trata suporte a múltiplas
marcas/gestores como fora de escopo confirmado; nenhuma tela nem regra
nova para esse papel aqui (mesma decisão de escopo já registrada em
`TASK_ROUTER.md` §15 para o módulo Campanhas).

---

## 6. Telas

Cinco telas, todas novas (nenhuma reaproveitada do `AppShell`), sob o
`PortalShell`. Nomenclatura e responsabilidades alinhadas a
`docs/design/UX_FLOW.md` ("Perfil: Influenciadora" — dashboard pessoal,
visualização de campanhas, envio de materiais, acompanhamento de
pagamentos):

1. **Login** (`/login`) — **reaproveitado sem alteração** (`Login.tsx`
   já existe e já funciona para qualquer papel via `useAuth().login`).
2. **Definir senha** (`/definir-senha`) — nova, fora da árvore
   autenticada (§4).
3. **Dashboard / Pendências** (`/` dentro do `PortalShell`) — lista as
   participações `ATIVA` da influenciadora (`GET /me/participacoes`),
   cada card mostrando campanha, marca, entregáveis contratados vs.
   briefings já lidos/materiais já enviados. Ponto de entrada para as
   telas 4 e 5.
4. **Detalhe da participação** (`/campanhas/:participacaoId`) — um
   único painel por participação (diferente do admin, que separa
   Campanha de Participação): briefing por tipo de conteúdo (lista os
   itens de `GET /participacoes/{id}/briefings`, reaproveitando o
   contrato já existente da Sprint 1), formulário de envio de material
   por tipo (`POST /participacoes/{id}/materiais`, agora aberto ao
   dono), status de aprovação de cada material já enviado.
5. **Financeiro** (`/financeiro`) — consulta previsto×pago
   (`GET /me/participacoes` já traz `pagamento` embutido via
   `with('pagamento')`, ver §7.2 — sem endpoint dedicado nesta sprint,
   RF-030 "selecionar período" fica para entrega futura se o volume de
   participações por influenciadora justificar paginação por período;
   hoje a lista plana é suficiente).
6. **Perfil** (`/perfil`) — `GET /me/parceira` + `PATCH /parceiras/{id}`
   (form reaproveita os mesmos campos/validação de
   `AtualizarCadastroComConsentimentoService` já usados em
   `ParceiraFormPage` do admin, mas como componente próprio do Portal —
   inclui o campo `consentimento_aceito` obrigatório, RN de LGPD já
   implementada na Sprint 1).

**Fora desta sprint:** telas de Histórico (arquivamento) e Documentos —
`Placeholder` no admin hoje, sem módulo de dados por trás (arquivamento
e contratos são Sprint 3); o Portal não pode expor o que o backend
ainda não tem.

---

## 7. APIs

### 7.1 Endpoints novos

| Método | Rota | Autorização | Descrição |
|---|---|---|---|
| `POST` | `/api/password/reset` | pública | Consome token de `InfluenciadoraConviteNotification`, define senha via `Password::broker()->reset()` |
| `GET` | `/api/me/participacoes` | `auth:sanctum` | Lista participações `ATIVA` do `parceira` da sessão, com `campanha`, `campanha.marca`, `pagamento` carregados (`with`) — fonte única do Dashboard e do Financeiro |
| `GET` | `/api/me/parceira` | `auth:sanctum` | Retorna `request->user()->parceira` (404 se o `User` não tem `Parceira` vinculada — caso só deveria ocorrer para ADMIN/GESTOR_MARCA, que não usam esta rota) |

### 7.2 Endpoints reaproveitados sem mudança de contrato

`GET /api/participacoes/{participacao}/briefings`,
`GET /api/participacoes/{participacao}/pagamento` — nenhuma alteração;
já autorizam por posse desde a Sprint 1.

### 7.3 Endpoints com autorização ajustada (sem mudança de contrato de dados)

- `POST /api/participacoes/{participacao}/materiais` — remove
  `middleware('role:ADMIN')`; adiciona
  `$this->authorize('update', $participacao)` dentro do controller
  (ou policy equivalente) que aceita **ADMIN via `Gate::before`** OU
  dono da participação. Corpo da requisição (`multipart/form-data`,
  `tipo` + `arquivo`) inalterado.
- `PATCH /api/parceiras/{parceira}` — adiciona
  `$this->authorize('update', $parceira)`; `ParceiraPolicy` ganha:

  ```php
  public function update(User $user, Parceira $parceira): bool
  {
      return $parceira->user_id !== null && $parceira->user_id === $user->id;
  }
  ```

  (ADMIN continua liberado por `Gate::before`, já global.)

### 7.4 Fora de escopo desta sprint

- Reenvio de convite/token de senha expirado.
- Filtro de período no financeiro (RF-030) — ver §6.5.
- Qualquer endpoint de escrita para `GESTOR_MARCA`.

---

## 8. Riscos

### Técnicos

- **Fechar `PATCH /parceiras/{id}` para "dono ou ADMIN" pode quebrar o
  fluxo administrativo se algum teste/uso atual depender do
  comportamento aberto (débito Sprint 1 §4.1).** Mitigação: rodar a
  suíte completa antes/depois; `ParceiraFormPage` do admin sempre
  autentica como ADMIN em uso real, risco baixo, mas checar testes de
  `ParceiraController::update` existentes antes de alterar.
- **Abrir `POST /materiais` para `INFLUENCIADORA` sem a guarda de posse
  corretamente implementada reabre a mesma classe de furo que a Sprint 1
  fechou em leitura** (qualquer influenciadora sobe material em
  participação alheia). Mitigação: teste de isolamento dedicado (duas
  Parceiras reais, mesmo padrão de `RbacIsolamentoTest`), não só
  inspeção manual — mesmo critério de conclusão que a Sprint 1 já usou.
- **Token de reset com TTL padrão do Laravel (60 min)** — convite
  enviado na aprovação pode chegar à influenciadora depois da janela
  (e-mail lido dias depois). Mitigação: não é bloqueador para a
  Sprint 2 fechar (o fluxo de reset funciona; TTL é configurável via
  `config/auth.php` sem código novo) — mas vale considerar aumentar o
  TTL do broker específico de convite se a operação relatar o problema
  em uso real; não decidir por antecipação sem dado.
- **Duas árvores de rota (`AppShell` vs `PortalShell`) divergindo com o
  tempo** — mesmo componente de nav/layout reimplementado duas vezes
  tende a acumular inconsistência visual. Mitigação: extrair primitivas
  de layout comuns (ex. header, container) para `components/` compartilhado
  desde já, só as listas/formulários específicos de cada papel divergem.

### De produto / negócio

- **Se `frontend_url` de produção não estiver configurado corretamente
  no `.env` de deploy, o link do e-mail de convite aponta para
  `localhost:5173`** (default do `config/app.php`) — checar
  `FRONTEND_URL` no ambiente de produção antes de considerar esta
  sprint testável ponta a ponta fora do dev local.
- **Consentimento LGPD (Q-09, dívida herdada do Portal legado GAS,
  `TASK_ROUTER.md` §7) segue sem política formal de retenção** — a
  Sprint 1 já captura o aceite e o histórico por campo; esta sprint não
  amplia o risco (reaproveita o mesmo serviço), mas também não o
  resolve. Fica registrado, não é bloqueador.
- **Volume de participações por influenciadora ao longo do tempo** pode
  tornar `GET /me/participacoes` sem paginação um problema — hoje o
  volume real é baixo (poucas dezenas de campanhas), aceitável sem
  paginação nesta sprint; se crescer, é ajuste aditivo (mesmo padrão de
  `paginate(20)` já usado em `CampanhaController`/`ParceiraController`).

### Dependências externas

Nenhuma nova. Upload de material já depende de `GoogleDriveService`
(fallback local se não configurado, herdado, não afetado por esta
sprint).

---

## 9. Ordem de execução

Sequência que respeita dependência real (uma entrega depende
tecnicamente da anterior, não é preferência arbitrária):

1. **Fechar `PATCH /parceiras/{id}` para dono-ou-ADMIN** (`ParceiraPolicy::update`
   + `$this->authorize` no controller) — corrige o débito de segurança
   já registrado antes de expor qualquer tela nova de edição de perfil
   sobre ele. Não depende de nada; pode ser feito isoladamente.
2. **Fluxo "definir senha"** (`POST /api/password/reset` +
   `ResetPasswordPage`) — é o bloqueador absoluto (§1.2.1): sem ele
   nenhuma influenciadora loga, então nenhuma tela posterior é
   testável ponta a ponta com um usuário real.
3. **Ramificação de rota por papel** (`PortalShell` vazio, só o shell +
   nav, montado quando `role === 'INFLUENCIADORA'`) — infraestrutura de
   UI que as próximas entregas populam.
4. **`GET /me/participacoes` + `GET /me/parceira`** (backend) — dados
   que o Dashboard e o Perfil do Portal consomem; entram antes das
   telas para permitir construir a tela já contra a API real.
5. **Dashboard/Pendências** (tela) — primeira tela real do Portal,
   consome (4).
6. **Abrir `POST /materiais` para o dono** (autorização) + **Detalhe da
   participação** (tela, briefing + upload) — depende de (5) existir
   como ponto de entrada (link do card da participação).
7. **Financeiro** (tela) — reaproveita o mesmo payload de (4), é a
   entrega mais barata da sprint, pode vir a qualquer momento depois de
   (4); colocada aqui por ser a de menor prioridade de produto (RF-030
   é "consultar", não "agir").
8. **Perfil** (tela) — depende de (1) já estar fechado e de (4)
   (`GET /me/parceira`).
9. **Teste de isolamento dedicado** (duas Parceiras reais, mesmo padrão
   `RbacIsolamentoTest` da Sprint 1) cobrindo especificamente as rotas
   novas/reabertas desta sprint (`/me/*`, `materiais` aberto,
   `parceiras` fechado) — não é uma "etapa 10", é critério de conclusão
   de cada entrega de (1), (4) e (6), não um item isolado ao final.

**Critério de conclusão (herdado de `PLANO_IMPLEMENTACAO_TEAR_V2.5.md`
§3 Sprint 2, sem alteração):** uma influenciadora real loga, vê só as
próprias campanhas/briefings/materiais/pagamentos, envia material pelo
próprio portal; existe teste automatizado de isolamento entre duas
parceiras distintas (uma nunca acessa dado da outra, nem por URL
direta).

---

## 10. Decisões que precisam de aprovação

Nenhuma decisão bloqueante nova em relação ao que
`docs/PLANO_IMPLEMENTACAO_TEAR_V2.5.md` §6 já lista. Um ponto vale
confirmação explícita antes da execução, por ser reversível com custo
(não é bloqueador para começar):

1. **TTL do token de "definir senha"** (§8) — manter o padrão do
   Laravel (60 min) ou aumentar especificamente para o convite de
   aprovação, dado que o e-mail pode não ser lido de imediato. Não
   impede iniciar a sprint; pode ser ajustado depois do primeiro uso
   real sem retrabalho estrutural.

---

Nenhum código foi escrito, nenhuma migration criada e nenhuma
arquitetura alterada para produzir este documento. Este plano é o
insumo de entrada para a próxima sessão de execução, seguindo o fluxo
obrigatório do projeto (Auditoria → Plano → Execução → Validação →
Commit).
