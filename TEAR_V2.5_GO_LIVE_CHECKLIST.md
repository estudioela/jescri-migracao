# TEAR V2.5 — Checklist de Go-Live (Produtização)

Data: 2026-07-21
Autor: Agente B (sessão dedicada a produtização, mandato de operação
autônoma de 2026-07-16, `CLAUDE.md`)
Escopo: **somente `tear-v2-app/`** (Laravel 13 + React/Vite). Não toca no
Portal legado GAS (`src/`) nem no domínio soberano
(`CONTRATO_SOBERANO.md`). Não implementa feature de negócio nova, não
altera RBAC/multi-tenant (isso é do roadmap de produto em
`TEAR_V2.5_PRODUCTIZACAO_ROADMAP.md`, fora do escopo desta sessão).

Metodologia: auditoria read-only completa (infra, banco, segurança,
frontend, backend, CI/deploy) + implementação automática dos itens de
baixo risco que não tocam arquivos que o desenvolvimento de feature
(Agente A) edita ativamente. Itens que exigiriam editar `routes/api.php`,
Controllers, Policies ou qualquer arquivo de regra de negócio foram
**documentados, não implementados**, pelo risco de conflito com trabalho
em andamento.

---

## 0. O que já foi implementado nesta sessão

Todos os itens abaixo são arquivos novos ou edições isoladas em arquivos
estáveis (`bootstrap/app.php`, que só muda para registrar middleware
global — baixíssima frequência de edição por feature). Backend 104/104
testes verdes (99 pré-existentes + 5 novos), Pint limpo, frontend
lint/build limpos, validados nesta sessão.

- **CI**: `.github/workflows/tear-v2-ci.yml` — roda em todo push/PR que
  toque `tear-v2-app/**`: backend (Pint + `php artisan test`) e frontend
  (`oxlint` + `tsc -b && vite build`), em jobs paralelos.
- **Docker / ambiente de homologação-produção**:
  `tear-v2-app/backend/Dockerfile` (multi-stage, PHP 8.3-FPM Alpine,
  opcache configurado), `tear-v2-app/backend/docker/nginx.conf`,
  `tear-v2-app/backend/docker/entrypoint.sh` (migrate --force + config/
  route/view cache no boot), `tear-v2-app/frontend/Dockerfile`
  (multi-stage, build Vite + nginx estático com fallback de SPA),
  `tear-v2-app/docker-compose.yml` (app, nginx, queue worker, frontend,
  Postgres 16 com healthcheck).
- **Template de produção**: `tear-v2-app/backend/.env.production.example`
  (`APP_ENV=production`, `APP_DEBUG=false`, Postgres, `SESSION_SECURE_COOKIE=true`,
  log diário — separado do `.env.example` de desenvolvimento para não
  arriscar quebrar o fluxo local nem conflitar com edições recentes nesse
  arquivo).
- **Security headers**: `app/Http/Middleware/SecurityHeaders.php`
  (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
  `Permissions-Policy`, `Strict-Transport-Security` condicional a HTTPS),
  registrado globalmente em `bootstrap/app.php`. Teste:
  `tests/Feature/SecurityHeadersTest.php`.
- **Provisionamento do primeiro admin**: `php artisan admin:create`
  (`app/Console/Commands/CreateAdminCommand.php`) — hoje não existe
  nenhum caminho para criar o primeiro usuário ADMIN em produção
  (`DevUserSeeder` só roda em `local`/`testing`). Idempotente (promove
  usuário existente pelo e-mail). Teste:
  `tests/Feature/CreateAdminCommandTest.php`.
- **Backup/restore de banco**: `tear-v2-app/scripts/backup-db.sh` /
  `restore-db.sh` (Postgres via `pg_dump`/`psql` dentro do
  docker-compose, prontos para agendar via cron do host).

### 0.1 Segunda rodada (mesma sessão de produtização)

- **Observabilidade — Laravel Pulse** (`/pulse`, restrito a `ADMIN` via o
  `Gate::before` já existente, sem tocar rota de negócio nenhuma):
  exceções, slow requests/queries/jobs/outgoing-requests, filas, cache,
  top usuários por volume. `composer.json`: `laravel/pulse` em `require`
  (não `require-dev` — é runtime). Testes:
  `tests/Feature/PulseAccessTest.php` (guest/não-admin bloqueados, admin
  acessa).
- **Correlação de logs por request**: `app/Http/Middleware/RequestId.php`
  — gera/propaga `X-Request-Id`, injeta no contexto de todo log da
  requisição. Registrado em `bootstrap/app.php` (mesmo padrão de baixo
  risco do `SecurityHeaders`). Teste: `tests/Feature/RequestIdTest.php`.
- **Auditoria de dependências automatizada**: CI agora roda
  `composer audit` (limpo) e `npm audit --omit=dev --audit-level=high`
  (limpo — a única vulnerabilidade encontrada, em `concurrently`/
  `shell-quote`, é devDependency de tooling local, não entra no build de
  produção, por isso `--omit=dev`). `.github/dependabot.yml` — updates
  semanais automatizados de composer/npm/Docker/GitHub Actions.
- **`docker-compose.yml`**: healthcheck em todo serviço HTTP (`app` via
  `nc` na porta do PHP-FPM, `nginx`/`frontend` via `wget --spider`);
  `nginx` agora espera `app` ficar `healthy` antes de subir.
- **CD**: `.github/workflows/tear-v2-docker.yml` — builda e publica
  imagens Docker (backend/frontend) no GHCR, mas **só a partir de
  `main`** (nunca em branch de feature, pra não competir com o CI de PR
  nem publicar imagem de trabalho em andamento).
- **Documentação operacional**: `tear-v2-app/docs/DEPLOY.md` (runbook de
  primeiro deploy, deploys subsequentes, rollback, backup) e
  `tear-v2-app/docs/MONITORING.md` (o que observar, como, e o que falta).
- **Script de uptime**: `tear-v2-app/scripts/healthcheck.sh` — checa
  `/up` e `/api/health`, alerta opcional via Slack webhook.

Backend após esta rodada: 110/110 testes verdes (104 + 6 novos), Pint
limpo, `composer audit` limpo.

---

## 1. Bloqueios P0 (antes de operar como produto)

Itens que, se ignorados, resultam em incidente de segurança ou
indisponibilidade sob uso real — não em polimento.

| # | Item | Status | Por que não foi implementado agora |
|---|---|---|---|
| P0-1 | `POST /login` sem rate limiting (força bruta de senha) | 🟡 documentado | `routes/api.php` é editado a cada feature nova pelo Agente A (commit mais recente já mexeu nele) — risco real de conflito. Fix de uma linha: `->middleware('throttle:5,1')` na rota de login. |
| P0-2 | `DB_CONNECTION=sqlite` em produção — SQLite serializa escrita (lock de arquivo único) e `SESSION_DRIVER`/`CACHE_STORE`/`QUEUE_CONNECTION` todos escrevem no mesmo arquivo a cada request; sob concorrência real (duas influenciadoras enviando material ao mesmo tempo) trava. | ✅ mitigado | `docker-compose.yml` + `.env.production.example` já apontam para Postgres. Falta só: provisionar o Postgres real do ambiente de produção (não local) e rodar `migrate --force` contra ele — decisão de infraestrutura (provedor de hosting) que só o responsável do projeto pode tomar. |
| P0-3 | Sem caminho para criar o primeiro usuário ADMIN em produção | ✅ resolvido | `php artisan admin:create` (ver §0). |
| P0-4 | Sem CI — regressão só é pega manualmente | ✅ resolvido | `.github/workflows/tear-v2-ci.yml` (ver §0). |
| P0-5 | Sem estratégia de backup de banco | ✅ resolvido (scripts prontos) | Falta agendar via cron real no host de produção quando este existir — item operacional, não de código. |
| P0-6 | `SESSION_SECURE_COOKIE` indefinido (cookie de sessão sem flag `Secure` mesmo atrás de HTTPS) | ✅ resolvido | `.env.production.example` já define `SESSION_SECURE_COOKIE=true`. |
| P0-7 | Sem security headers (`X-Frame-Options`, `HSTS`, etc.) | ✅ resolvido | `SecurityHeaders` middleware (ver §0). |
| P0-8 | Upload de Material sem whitelist de mime/extensão (só limite de 50MB) | 🟡 documentado | `app/Http/Requests/Material/StoreMaterialRequest.php` é um arquivo de regra de negócio de upload — mesma frente do Agente A (Materiais é o módulo mais recente em desenvolvimento ativo, commits HU-1.4/HU-4.1). Fix sugerido: `'arquivo' => ['required','file','max:51200','mimes:jpg,jpeg,png,mp4,mov,pdf']` (ajustar lista de mimes ao que o produto realmente aceita). |
| P0-9 | Nenhuma variável de produção real preenchida (`APP_URL`, `SANCTUM_STATEFUL_DOMAINS`, `FRONTEND_URL`, domínio, `GOOGLE_DRIVE_*`) | 🔴 aberto | Depende de decisões externas ao código: domínio real, credenciais de service account do Drive, provedor de hosting. Não é tarefa de engenharia — é decisão do responsável do projeto. Template já pronto em `.env.production.example` com todos os campos marcados `CHANGE_ME`. |

---

## 2. Melhorias P1 (alto valor, não bloqueiam uso interno)

| Item | Nota |
|---|---|
| Policy dedicada para `Material`/`Pagamento`/`Briefing`/`Medida` (hoje reaproveitam `ParticipacaoNaCampanhaPolicy`) | Funciona hoje, mas é frágil a mudanças futuras de regra por recurso — arquivo de domínio, deixado para o Agente A. |
| Rate limiting global (`throttle:api`) para as demais rotas autenticadas | Mesma razão do P0-1 — edita `routes/api.php`/`bootstrap/app.php` de forma que se sobrepõe a rotas que mudam com frequência. |
| Sanitizar `nome_arquivo` original do Material antes de persistir/exibir | Arquivo de domínio (`MaterialController`), fora do escopo desta sessão. |
| Log rotation: `LOG_STACK=single` em dev não importa, mas produção já foi ajustada para `daily` no `.env.production.example`; falta só confirmar retenção (`LOG_DAILY_DAYS`, default Laravel = 14 dias — avaliar se é suficiente para auditoria). |
| Code-splitting / lazy loading de rotas no frontend (`React.lazy`) — hoje bundle único (~333KB/103KB gzip, ainda pequeno mas vai crescer) | Baixo risco técnico, mas exige tocar `App.tsx`/roteamento, que é onde o Agente A mais frequentemente adiciona páginas novas — deixado para não competir por esse arquivo. |
| Error Boundary React global — hoje um erro de render derruba a árvore inteira sem fallback | Mesmo motivo acima (`App.tsx` ou componente raiz de rotas). |
| Padronizar tratamento de erro de fetch entre páginas (ex.: `Dashboard.tsx` falha silenciosamente com `.catch(() => setX(null))`, enquanto `MateriaisPage.tsx` já tem UI de erro consistente) | Arquivo de página de feature — Agente A. |
| ~~Observabilidade de backend (exceções, slow query, filas)~~ | ✅ **resolvido nesta sessão** — Laravel Pulse em `/pulse`, ver §0.1. |
| ~~Correlação de logs por request~~ | ✅ **resolvido nesta sessão** — `RequestId` middleware, ver §0.1. |
| ~~Auditoria de dependências no CI~~ | ✅ **resolvido nesta sessão** — `composer audit` + `npm audit`, ver §0.1. |
| Monitoramento de erro **frontend** (Sentry ou equivalente) — Pulse cobre só o backend | Decisão de fornecedor + variável de ambiente nova (DSN); documentado, não decidido aqui — impacto de custo/produto que cabe ao responsável do projeto. |
| Alertas proativos (Slack/e-mail) quando uma exceção ou fila trava | `scripts/healthcheck.sh` já alerta uptime via Slack; falta o mesmo para exceções/filas do Pulse — decisão de canal pendente. |
| Consolidar os dois health-checks redundantes (`/up` nativo do Laravel vs. `GET /api/health` customizado) com propósitos diferentes (liveness vs. readiness — ex.: `/api/health` checando conexão real com o banco) | Pequena mudança em `routes/api.php` — mesmo motivo do P0-1, deixado como recomendação. |
| Definir uso real de filas ou remover o worker/`QUEUE_CONNECTION=database` (hoje configurado mas nenhum `Job`/`Listener` existe) | O `docker-compose.yml` já inclui um container `queue` pronto para quando isso for decidido; não custa deixá-lo rodando ocioso. |
| `concurrently`/`shell-quote` — vulnerabilidade alta conhecida (GHSA-395f-4hp3-45gv), devDependency de `npm run dev:all` local | Fix exigiria downgrade quebrando (`concurrently@9.2.4`, contradiz `^10.0.3` hoje fixado) — sem impacto em produção (não entra no build), documentado e excluído do gate de CI via `--omit=dev`. Reavaliar quando `concurrently` publicar um 10.x corrigido. |
| Redis para cache/queue/sessão (hoje `database`) | Só compensa com volume real de tráfego — `PULSE_INGEST_DRIVER=redis` também ganharia se isso acontecer. Não antecipar sem necessidade. |

---

## 3. Melhorias P2 (evolução futura, não urgente)

- 2FA para usuários ADMIN.
- Scheduler (`Schedule::` em `bootstrap/app.php`) — hoje nada usa; só relevante quando alguma rotina periódica for necessária (ex.: expirar convites, lembrete de pagamento).
- Migrar armazenamento de Google Drive (uma credencial única) para S3/R2 com isolamento por organização — só relevante quando a Fase 4 (SaaS/multi-tenant) do roadmap de produto avançar; decisão já registrada em `TEAR_V2.5_PRODUCTIZACAO_ROADMAP.md` §5.
- Observabilidade avançada (APM, métricas de negócio, dashboards) — prematuro para o volume atual.
- Content-Security-Policy — não incluída no `SecurityHeaders` porque a API não serve HTML de produção (o SPA é build/deploy separado); avaliar CSP no lado do nginx do frontend se o produto passar a embutir conteúdo de terceiros.
- Correlação de logs por request ID (middleware simples, mas só compensa quando houver volume de log real para justificar).

---

## 4. Ordem ideal de execução

1. **Decisão externa primeiro** (bloqueia tudo abaixo): provedor de
   hosting/domínio de produção, credenciais reais do Google Drive
   (P0-9). Sem isso nenhum deploy real acontece, independente do estado
   do código.
2. **P0-1 e P0-8** (rate limit no login, whitelist de mime em upload) —
   pequenos, mas exigem coordenação com o Agente A (janela sem edição
   concorrente em `routes/api.php`/`StoreMaterialRequest.php`, ou aplicar
   depois que a feature em andamento (HU-1.4/HU-4.1) for mesclada).
3. **Provisionar Postgres real** e apontar `.env` de produção para ele
   (resto do P0-2 já está pronto em código).
4. **Primeiro deploy de homologação** via `docker-compose.yml` — valida
   o pipeline inteiro (build, migrate, health check, security headers)
   antes de produção.
5. **`php artisan admin:create`** no ambiente de homologação — valida o
   fluxo de provisionamento ponta a ponta.
6. **Deploy de produção**, backup agendado (cron do host chamando
   `scripts/backup-db.sh`) já no primeiro dia, não depois.
7. **P1** conforme capacidade, sem bloquear o go-live — nenhum item P1
   impede operação segura.

---

## 5. Estimativa de esforço

Estimativa de esforço humano/agente, não de calendário (depende de fila
de decisões externas no passo 1 do §4).

| Item | Esforço |
|---|---|
| P0-1 (rate limit login) | 15 min |
| P0-8 (whitelist mime upload) | 30 min |
| P0-2 restante (provisionar Postgres real + apontar `.env`) | 1–3h (depende do provedor escolhido) |
| P0-9 (preencher `.env` de produção real) | 30 min de execução + tempo de espera por credenciais/domínio (fora do controle de engenharia) |
| Primeiro deploy de homologação via Docker | 2–4h (inclui debugging de ambiente na primeira vez) |
| P1 completo (Policies dedicadas, rate limit global, lazy loading, Error Boundary, Sentry, health-check consolidado) | 1–2 dias |
| P2 completo | Não estimado — evolução futura, sem urgência |

**Já entregue nesta sessão (§0):** CI, Docker, template de produção,
security headers, provisionamento de admin, backup/restore — sem custo
de esforço adicional, pronto para uso.

---

## 6. Checklist completo de Go-Live (consolidado)

### Infraestrutura
- [x] Logs configurados (`daily` em produção, `.env.production.example`)
- [x] Retenção de log explícita (`LOG_DAILY_DAYS=30` em `.env.production.example`, era default implícito de 14)
- [x] Storage/uploads com limite de tamanho (50MB)
- [ ] Storage/uploads com whitelist de mime (P0-8)
- [ ] Scheduler — não necessário até haver rotina periódica real (P2)
- [x] Backup de banco (script pronto, P0-5) — [ ] agendado no host real de produção
- [x] Filas com worker pronto no `docker-compose.yml` — [ ] decidir uso real ou remover (P1)
- [x] Cache configurado (`database`, já em uso por `GoogleDriveService`)
- [x] Healthcheck em todo serviço HTTP do `docker-compose.yml`
- [x] Auditoria automatizada de dependências no CI (`composer audit`, `npm audit`) + Dependabot

### Banco
- [x] Todas as 19 migrations têm `down()` implementado
- [x] Seeders estruturais (`RoleSeeder`) seguros para produção; dev seeder corretamente isolado por ambiente
- [x] Driver de produção definido (Postgres, `.env.production.example`) — [ ] instância real provisionada (P0-2)
- [ ] Runbook de migração/rollback em produção documentado (recomendado: `php artisan migrate --force` já é chamado no boot do container via `entrypoint.sh`; rollback manual via `php artisan migrate:rollback` dentro do container `app`)

### Segurança
- [x] Autenticação via Sanctum SPA, cookie-based, configurada
- [x] Autorização: Policies + `role:ADMIN` cobrindo rotas de escrita; nenhuma rota de negócio fora de `auth:sanctum`
- [ ] Rate limiting no login (P0-1)
- [ ] Rate limiting global nas demais rotas (P1)
- [x] `SESSION_SECURE_COOKIE=true` em produção (P0-6)
- [x] CORS restrito a `FRONTEND_URL` (sem wildcard)
- [x] Security headers (P0-7)
- [ ] Whitelist de mime em upload (P0-8)
- [ ] Sanitização de nome de arquivo exibido (P1)

### Frontend
- [x] Build de produção limpo (`tsc -b && vite build`, validado nesta sessão)
- [x] Estados de loading/erro/vazio consistentes na maior parte das páginas
- [ ] Padronizar tratamento de erro nas páginas restantes (P1)
- [ ] Lazy loading de rotas (P1)
- [ ] Error Boundary global (P1)
- [ ] Monitoramento de erro (Sentry ou equivalente) (P1) — Pulse cobre exceções de **backend**, frontend ainda sem cobertura

### Backend
- [x] Respostas de API em JSON consistente (`shouldRenderJsonWhen`)
- [x] Health check disponível (`/up` nativo + `/api/health` customizado)
- [ ] Consolidar os dois health-checks com propósitos claros (P1)
- [x] Correlação de request ID em logs (`RequestId` middleware + `X-Request-Id`)
- [x] Observabilidade de performance/exceções/filas (Laravel Pulse, `/pulse`, restrito a `ADMIN`)

### Deploy
- [x] CI configurado e validado (backend + frontend, P0-4)
- [x] Dockerfiles + docker-compose para homologação/produção
- [x] Healthcheck em todo serviço do `docker-compose.yml`
- [x] Template de variáveis de produção (`.env.production.example`)
- [x] CD — build/push de imagens Docker para GHCR (só a partir de `main`)
- [x] Documentação operacional (`docs/DEPLOY.md`, `docs/MONITORING.md`)
- [x] Script de uptime check com alerta Slack opcional (`scripts/healthcheck.sh`)
- [ ] Domínio e hosting de produção definidos (decisão externa, P0-9)
- [ ] Primeiro deploy de homologação executado
- [ ] Primeiro deploy de produção executado
