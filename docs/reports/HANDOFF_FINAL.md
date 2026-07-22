# HANDOFF FINAL — Snapshot Executivo TEAR V2.5 (Estabilização)

**Data:** 2026-07-21
**Branch:** `feat/ui-design-system-ela` (sincronizada com origin, working tree limpa)
**Escopo:** `tear-v2-app/` (Laravel 13.20 + Sanctum + Spatie Permission /
React 19 + Vite 8 + TypeScript). Não cobre o Portal legado GAS/Google
Sheets (`src/`), que segue sendo o sistema em produção hoje e cujo domínio
soberano (`knowledge/specs/CONTRATO_SOBERANO.md`) não foi tocado nesta fase.

Este documento substitui a versão anterior deste mesmo arquivo (auditoria
estática isolada de uma sessão) por um snapshot único e consolidado,
reunindo o que foi encontrado e corrigido em todas as sessões de
estabilização de 2026-07-20/21. Fontes: `docs/_workspace/TASK_ROUTER.md`
§15, `docs/release/TEAR_V2.5_GO_LIVE_CHECKLIST.md`,
`docs/reports/STATUS_MVP_OPERACIONAL_TEAR_V2.md`,
`docs/planning/BACKLOG_FUNCIONAL_V2_6.md`, histórico de commits e
verificação direta no código nesta sessão (`php artisan test`, `tsc -b`,
`vite build`, `oxlint`).

---

## 1. Funcionalidades concluídas

Fluxo ponta a ponta funcional e validado manualmente (QA operacional +
smoke test via browser real, 2026-07-21):

- **Cadastro público de Parceira** (`/cadastro`, sem auth, `throttle:6,1`) → nasce `Inativa`.
- **Aprovação administrativa** (ADMIN aprova → `Ativa`, convite disparado).
- **Primeiro acesso / definir senha** e **login** (Sanctum SPA, cookie-based).
- **Recuperação de acesso**: esqueci senha + reenvio de convite pelo admin.
- **Marcas** e **Campanhas**: CRUD administrativo.
- **Participações/Colaborações**: vincular Parceira ativa a Campanha, cancelar participação.
- **Briefing**: CRUD 1:1 por participação (formato ainda simples — ver B-01 em §5).
- **Materiais**: upload (Portal e admin), aprovação/reprovação pelo admin.
- **Pagamentos**: criação, fluxo `PENDENTE → APROVADO → PAGO`, bloqueio de aprovação quando há Material não aprovado na participação.
- **Portal da Influenciadora** completo: login federado, campanhas próprias, briefing, upload de material, status de pagamento, perfil, logout.
- **Consentimento LGPD e histórico de consentimentos** na edição de cadastro (tabela `consentimentos`) — ainda não no cadastro público inicial (ver CD-02 em §5).
- **CEP automático, máscaras e validação** de telefone/CNPJ/e-mail no cadastro (público, Portal e admin).
- **Isolamento entre influenciadoras** coberto por teste automatizado (`PortalIsolamentoTest`) — campanha, briefing e pagamento de participação alheia retornam 403.
- **Provisionamento de ADMIN em produção**: `php artisan admin:create` (idempotente).
- **Backup/restore de banco**: scripts prontos (`scripts/backup-db.sh`/`restore-db.sh`).

Smoke test end-to-end (13 passos, identidade nova, Playwright) executado em
2026-07-21 sem bug bloqueante.

## 2. Funcionalidades estabilizadas nesta fase

Correções e endurecimentos aplicados sobre funcionalidades já existentes,
sem novas regras de negócio:

- **Paginação** nas listagens de Marcas/Campanhas/Parceiras (evita payload sem limite acima de 20 registros) — commit `8cffaa9`.
- **Remoção de TikTok/UGC** das opções de tipo de Briefing (o backend nunca aceitou essas quantidades; a opção existia na UI e falhava 100% das vezes) — commit `7d8273f`.
- **Interceptor global de 401** — sessão expirada agora redireciona para `/login` em vez de deixar a UI num estado inconsistente — commit `a86bf39`.
- **Ocultação de ações de escrita para não-ADMIN** — botões/formulários de criar/editar Marca, Campanha, Parceira, Colaboração, Briefing, Material (aprovar/reprovar/enviar) e Pagamento agora só aparecem para `role === 'ADMIN'`, alinhado ao que o backend já impõe (`role:ADMIN` em rotas + `Gate::before`) — commit `c07fc9f`. Não altera autorização de backend.
- **Segurança**: rate limit em `/login` (`throttle:6,1`, commit `d37526f`), allowlist de MIME no upload de Material (commit `28c6ba4`), gate `role:ADMIN` fechado em `POST /parceiras` (commit `0a2bc5b`, achado de QA operacional).
- **Navegação lateral sem destino** — rotas `/colaboracoes`, `/briefings`, `/materiais`, `/aprovacoes`, `/pagamentos` que caíam em `PlaceholderPage` agora redirecionam para `/campanhas`, ponto de entrada real desses fluxos.
- **i18n de validação** — atributos de validação ausentes (briefing, campanha, parceira, marca) traduzidos.
- **Observabilidade**: Laravel Pulse (`/pulse`, restrito a ADMIN), `RequestId` middleware (correlação de logs), `composer audit` + `npm audit` no CI, Dependabot.
- **Produtização de infraestrutura**: CI (`tear-v2-ci.yml`), Docker multi-stage (backend/frontend), `docker-compose.yml` com healthcheck em todo serviço, CD para GHCR a partir de `main`, template `.env.production.example`, `SecurityHeaders` middleware.
- **Governança documental**: reorganização de `docs/` em categorias temáticas (`architecture/`, `planning/`, `release/`, `reports/`, `governance/`, `archive/`, `design/`, `deployment/`, `history/`), remoção de duplicatas em `knowledge/specs/` e de referências mortas no `README.md` (ver `docs/governance/REPOSITORY_GOVERNANCE_AUDIT.md`).

## 3. Bugs corrigidos durante a estabilização

- URL de Material apontando para porta errada (`APP_URL` sem porta gerava link para `:80` em vez de `:8000` em dev) — corrigido no `.env`/`.env.example`, sem alteração de código de aplicação.
- `POST /parceiras` sem gate `role:ADMIN` — qualquer autenticado (inclusive INFLUENCIADORA) podia criar `Parceira` arbitrária via API, contornando o fluxo de cadastro público. Corrigido (`0a2bc5b`).
- Ausência de forma de recuperar acesso ao Portal (senha esquecida ou janela de convite de 60min perdida) — lockout permanente antes, corrigível só via `tinker`. Corrigido com broker nativo de reset + reenvio de convite (`392de04`).
- Comentário falso em `.env.example`/`.env.production.example` afirmando que a ausência de `GOOGLE_DRIVE_*` faz o upload cair em armazenamento local — o código na verdade retorna 503 sem fallback. Comentário corrigido nos dois arquivos.
- Grade de 3 colunas com 4 cards no dashboard admin (`b71bc70`).
- Tela de editar Parceira não enviava `consentimento_aceito` (`1b02ef7`).
- Ações de escrita visíveis para não-ADMIN que resultariam em 403 garantido (ver §2, commit `c07fc9f`).
- Referências mortas de documentação (`docs/engenharia_reversa/`, seção "Documentação" duplicada no `README.md`) e duplicatas byte-idênticas de `TASK_ROUTER.md`/`CONTRATO_SOBERANO.md` em `knowledge/specs/`.

## 4. Riscos conhecidos

- **Papel `GESTOR_MARCA` sem modelo de leitura real no backend.** A correção desta sessão (§2) resolveu a parte de **escrita** (botões ocultos para não-ADMIN). Mas a auditoria encontrou um problema mais amplo, não corrigido: `MarcaPolicy::viewAny` é sempre `false` fora de ADMIN, e `ParticipacaoNaCampanhaPolicy::view`/`CampanhaPolicy::view` só reconhecem a própria Influenciadora dona da participação — ou seja, se `GESTOR_MARCA` for atribuído a um usuário real, a maior parte da **leitura** (Marcas, detalhe de Campanha, Participações, Briefings, Materiais, Pagamento) também 403a, não só a escrita. Hoje sem risco ativo: esse papel só existe em `DevUserSeeder` (`local`/`testing`), nenhum fluxo de produção o atribui. Requer decisão de produto (o que um `GESTOR_MARCA` deveria enxergar) antes de ativar o papel — não é decisão de engenharia.
- **Frontend sem nenhum teste automatizado** (0 arquivos `*.test.*`/`*.spec.*`). Toda a camada React depende de QA manual. Uma regressão de UI só é pega por inspeção humana ou pela suíte de smoke test.
- **Ambiente de desenvolvimento único, sem isolamento de sessões paralelas.** Já houve write race real entre duas sessões de agente na mesma working dir (evidência: commit concorrente `794c849` durante auditoria). Sessões futuras devem checar `git status`/`git log`/`git fetch` antes de assumir que o working dir e o remoto estão como a última leitura — nesta própria sessão o remoto avançou 8 commits (reorganização de `docs/`) entre o início e o fim do trabalho.
- **`Pagamento::$fillable` inclui `status`** sem necessidade (nenhum controller faz mass-assignment desse campo hoje) — superfície mais permissiva do que o preciso; não explorável agora, mas frágil a um endpoint futuro descuidado.
- **`laravel/pulse` documentado como restrito a ADMIN em produção, mas sem `Gate::define('viewPulse', ...)` customizado** — o gate padrão do pacote bloqueia todo mundo em produção (falha de forma segura), mas a funcionalidade documentada não funciona até alguém adicionar o gate.
- **Consentimento LGPD não capturado no cadastro público inicial** (só na edição) — risco de compliance, detalhado como CD-02 em §5.

## 5. Itens adiados para V2.6

Backlog funcional formal em `docs/planning/BACKLOG_FUNCIONAL_V2_6.md`
(Product Architect, 2026-07-21) — não implementado nesta fase de
estabilização por ser evolução de produto, não correção. Itens já
sequenciados pelo próprio documento para a versão V2.6 ("fechamento de
lacunas do MVP já em produção", prioridade MUST de baixo risco e sem
dependência externa):

- **CD-01 · Suporte a CPF** — hoje `parceiras` só tem `cnpj`; boa parte das influenciadoras reais opera como pessoa física.
- **CD-02 · Consentimento LGPD no cadastro público inicial** — hoje só capturado na edição (ver §4).
- **B-01 · Arquitetura formal de Briefing** — separar data de entrega/postagem e portar o cálculo automático de data de aprovação (RN-04 do V1), hoje ausente.
- **C-01 · Geração automática de contrato em PDF** — hoje a tela "Documentos" é `PlaceholderPage`; nenhuma geração de contrato existe.

Itens de versões posteriores (V2.7 em diante — Assessorias, assinatura
eletrônica, Logística, importação de histórico do V1) estão fora do
horizonte de V2.6 e detalhados no próprio backlog, com dependências e
pendências de decisão do PO explícitas por item.

## 6. Pendências obrigatórias antes do Go-Live

Nenhuma é código — todas são infraestrutura/decisão externa:

- **Credenciais reais do Google Drive** (`GOOGLE_DRIVE_CLIENT_EMAIL`, `GOOGLE_DRIVE_PRIVATE_KEY`, `GOOGLE_DRIVE_ROOT_FOLDER_ID`). Sem isso, upload de Material fica bloqueado com 503 (comportamento correto, não é degradação silenciosa) — verificado no smoke test.
- **Postgres de produção provisionado** e apontado no `.env` real (`DB_CONNECTION=pgsql` já é o default do `.env.production.example`; dev usa SQLite, inadequado sob concorrência real).
- **SMTP/SES real** (`MAIL_MAILER` hoje é `log` — nenhum e-mail de convite/redefinição de senha chega a caixa real).
- **Variáveis de produção reais**: `APP_ENV=production`, `APP_DEBUG=false`, `APP_KEY` gerada, `APP_URL`, `FRONTEND_URL`, `SESSION_DOMAIN`, `SESSION_SECURE_COOKIE=true`, `SANCTUM_STATEFUL_DOMAINS`, `VITE_API_URL` — template completo e pronto em `.env.production.example`, campos marcados `CHANGE_ME`.
- **Domínio e hosting de produção definidos** — decisão do responsável do projeto, bloqueia todo o resto.
- **Primeiro deploy de homologação** via `docker-compose.yml` (valida build, migrate, health check, security headers) antes de produção.
- **`php artisan admin:create`** em homologação/produção para provisionar o primeiro usuário ADMIN (não há seed de admin em produção por design).
- **Backup agendado** via cron real no host de produção chamando `scripts/backup-db.sh` (script pronto, falta só o agendamento).

## 7. Pendências opcionais

Débito técnico/polimento registrado, não bloqueia Go-Live nem faz parte do
backlog funcional de §5:

- Policy dedicada para Material/Pagamento/Briefing/Medida (hoje reaproveitam `ParticipacaoNaCampanhaPolicy`) — frágil a mudanças futuras de regra por recurso.
- Rate limiting global (`throttle:api`) nas rotas autenticadas restantes (só `/login`, `/parceiras/cadastro` e `/password/reset` têm throttle dedicado hoje).
- Propagar `error.response.data.message` do backend nos erros genéricos de upload de Material e aprovação de Pagamento (hoje mensagem genérica mascara causas reais como 409/503) — fix único, baixo risco, maior valor/menor esforço da lista.
- Formatação pt-BR de valores monetários (`R$ 2273.98` em vez de `R$ 2.273,98`) em Campanha e Pagamento.
- Máscara de exibição de Telefone/CNPJ em `ParceiraProfilePage` (a máscara só existe no formulário de entrada, não na exibição).
- Template de e-mail transacional mistura "Regards," em inglês no corpo em português.
- `GET /marcas`/`GET /marcas/{marca}` sem `role:ADMIN` explícito na rota (hoje só a Policy bloqueia) — hardening barato contra regressão futura.
- Sanitizar `nome_arquivo` original do Material antes de persistir/exibir.
- Code-splitting/lazy loading de rotas (`React.lazy`) e Error Boundary React global.
- Padronizar tratamento de erro de fetch entre páginas (algumas falham silenciosamente, outras já têm UI de erro consistente).
- Monitoramento de erro frontend (Sentry ou equivalente) — Pulse cobre só backend.
- Consolidar os dois health-checks (`/up` nativo vs. `GET /api/health` customizado).
- Definir uso real de filas ou remover o worker `QUEUE_CONNECTION=database` (configurado, nenhum Job/Listener existe ainda).
- 2FA para usuários ADMIN; Scheduler; migração de storage para S3/R2 (multi-tenant); CSP no frontend — todos P2, evolução futura sem urgência hoje.
- Resolver o modelo de leitura para `GESTOR_MARCA` (ver §4) antes de ativar o papel — decisão de produto pendente.
- Telas próprias para Histórico/Perfil (admin) — hoje `PlaceholderPage`; Documentos entra no backlog formal como H-02 (V2.7).

## 8. Estado dos testes

- **Backend:** 149/149 testes verdes, 384 assertions (`php artisan test`, verificado nesta sessão). `vendor/bin/pint --test` limpo. `composer audit` limpo.
- **Frontend:** 0 arquivos de teste automatizado (`*.test.*`/`*.spec.*`) — toda a cobertura de UI é QA manual/smoke test via browser. `oxlint` limpo (1 warning pré-existente e não relacionado em `src/lib/auth.tsx:80`, sobre fast-refresh). `npm audit --omit=dev --audit-level=high` limpo em produção (única vulnerabilidade conhecida é devDependency de tooling local, `concurrently`/`shell-quote`, fora do build).
- **QA manual:** cobertura funcional completa registrada em `docs/_workspace/TASK_ROUTER.md` §15 (CRUD Parceiras, Materiais, Pagamentos, Documentos/Histórico/Perfil admin, jornada completa do Portal) + smoke test end-to-end via Playwright em 2026-07-21, sem bug bloqueante.

## 9. Estado do frontend

React 19.2 + Vite 8 + TypeScript 6 + React Router 7. Build de produção
(`tsc -b && vite build`) limpo, validado nesta sessão. Papéis reconhecidos:
`ADMIN`, `GESTOR_MARCA`, `INFLUENCIADORA` (tipo `Role` em `lib/auth.tsx`).
Roteamento por papel em `App.tsx`: INFLUENCIADORA → `PortalShell`; demais
papéis → `AppShell` administrativo. Ações de escrita agora consistentemente
condicionadas a `role === 'ADMIN'` nas páginas administrativas (ver §2).
Sem lazy loading de rotas (bundle único, ~362KB/~108KB gzip — ainda
pequeno) e sem Error Boundary global (débitos registrados em §7).

## 10. Estado do backend

Laravel 13.20 + Sanctum (SPA, cookie-based) + Spatie Permission. Todas as
rotas de negócio atrás de `auth:sanctum`; escrita administrativa atrás de
`role:ADMIN` explícito na rota **ou** Policy (`Gate::before` libera ADMIN
globalmente para qualquer ability). 4 Policies (`ParceiraPolicy`,
`MarcaPolicy`, `CampanhaPolicy`, `ParticipacaoNaCampanhaPolicy`) — Material,
Briefing, Pagamento e Medida reaproveitam `ParticipacaoNaCampanhaPolicy`
(débito registrado em §7). CORS restrito a `FRONTEND_URL`, sem wildcard.
Security headers via middleware global. Todas as 20 migrations têm `down()`
implementado. Seeders estruturais (`RoleSeeder`) seguros para produção;
`DevUserSeeder` isolado a `local`/`testing`.

## 11. Estado da documentação

- `docs/_workspace/TASK_ROUTER.md` é a fonte única de estado do projeto (convenção desde a SPEC-025) — §15 concentra todo o histórico de `tear-v2-app` por não ter SPEC formal própria (achado de governança registrado em 2026-07-20: o sistema nasceu sem SPEC/ADR/entrada no roteador).
- **`docs/` reorganizado em categorias** nesta janela (`architecture/`, `planning/`, `release/`, `reports/`, `governance/`, `archive/`, `design/`, `deployment/`, `history/`) — ver `docs/governance/REPOSITORY_GOVERNANCE_AUDIT.md` para o diagnóstico completo e `docs/archive/README.md` para o índice do que foi arquivado.
- `docs/release/TEAR_V2.5_GO_LIVE_CHECKLIST.md` — checklist completo P0/P1/P2 + checklist consolidado por área (infra/banco/segurança/frontend/backend/deploy).
- `docs/planning/BACKLOG_FUNCIONAL_V2_6.md` — backlog funcional formal, priorizado por versão (V2.6 a V3.0), fonte de verdade para "o que vem depois" (ver §5).
- `tear-v2-app/docs/DEPLOY.md` — runbook de deploy (pré-requisitos, deploy, rollback, backup, smoke test pós-deploy formalizado em 8 passos, critérios de produção saudável).
- `tear-v2-app/docs/MONITORING.md` — o que observar e como.
- Este arquivo (`docs/reports/HANDOFF_FINAL.md`) — snapshot executivo único, substitui a versão anterior (auditoria estática isolada) para evitar documentação duplicada.
- **Risco de concorrência já materializado:** múltiplas sessões de agente escreveram nos mesmos arquivos de documentação na mesma janela de tempo em 2026-07-21 (sem worktree), incluindo uma reorganização estrutural de `docs/` que moveu este próprio arquivo (`docs/HANDOFF_FINAL.md` → `docs/reports/HANDOFF_FINAL.md`) entre o início e o fim desta sessão. Nenhum conflito de fato ocorreu, mas é um risco real, não hipotético, para sessões futuras na mesma working dir — sempre `git fetch`/comparar com origin antes de commitar documentação.

## 12. Estado da infraestrutura

Pronto em código, pendente de provisionamento real (ver §6):

- **CI**: `.github/workflows/tear-v2-ci.yml` (backend + frontend, jobs paralelos, roda em todo push/PR que toque `tear-v2-app/**`).
- **CD**: `.github/workflows/tear-v2-docker.yml` (build/push de imagens para GHCR, só a partir de `main`).
- **Docker**: Dockerfiles multi-stage (backend PHP 8.3-FPM Alpine com opcache; frontend build Vite + nginx estático), `docker-compose.yml` com healthcheck em todo serviço HTTP (app, nginx, frontend) e dependência de saúde entre eles.
- **Templates de produção**: `.env.production.example` completo, campos sensíveis marcados `CHANGE_ME`.
- **Backup/restore**: scripts prontos (`scripts/backup-db.sh`/`restore-db.sh`), falta só agendamento no host real.
- **Observabilidade**: Laravel Pulse (`/pulse`), `RequestId` middleware, script de uptime (`scripts/healthcheck.sh`, alerta Slack opcional).
- **Dependabot**: updates semanais automatizados (composer/npm/Docker/GitHub Actions).
- **Ainda não existe**: instância real de Postgres de produção, domínio/hosting definidos, credenciais Google Drive/SMTP reais, nenhum deploy de homologação ou produção executado até agora.

## 13. Próximos passos sugeridos

1. **Decisão externa primeiro** (bloqueia tudo abaixo): domínio/hosting de produção, credenciais reais do Google Drive, credenciais SMTP/SES — só o responsável do projeto decide.
2. Provisionar Postgres real e apontar o `.env` de produção para ele.
3. Primeiro deploy de homologação via `docker-compose.yml` — valida o pipeline inteiro antes de produção.
4. `php artisan admin:create` em homologação — valida o provisionamento ponta a ponta.
5. Deploy de produção, com backup agendado (cron do host) já no primeiro dia.
6. Em paralelo ou depois, atacar os itens de §7 (pendências opcionais) conforme capacidade — nenhum bloqueia o Go-Live.
7. Depois do Go-Live, iniciar V2.6 pelo backlog formal de §5 (`docs/planning/BACKLOG_FUNCIONAL_V2_6.md`), começando pelos itens MUST sem dependência externa (CD-01, CD-02, B-01, C-01).
8. Antes de ativar o papel `GESTOR_MARCA` para qualquer usuário real, resolver o risco de leitura descrito em §4 (decisão de produto + trabalho de backend/frontend correspondente).
