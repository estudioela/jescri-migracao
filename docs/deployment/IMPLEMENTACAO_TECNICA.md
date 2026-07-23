# IMPLEMENTACAO_TECNICA.md — TEAR V2.5

**Base:** `ARQUITETURA_PRODUCAO.md` (revisado, decisão definitiva
2026-07-21 — Locaweb Hospedagem Linux, PostgreSQL gerenciado, deploy via
GitHub Actions + SSH, zero custo recorrente adicional).
**Escopo:** `tear-v2-app` (Laravel + Sanctum + Spatie Permission / React +
Vite). Não cobre o legado GAS.
**Natureza deste documento:** mapeamento técnico do que precisa mudar
para a arquitetura aprovada existir de fato. Nasceu como mapeamento
apenas (nenhum código alterado); a partir de 2026-07-22 passou a ser
executado — ver nota de status em cada item da tabela de §2/§3 e
`docs/_workspace/TASK_ROUTER.md` §18 para o registro da execução.
**Decisão de arquitetura fechada nesta execução:** o frontend é servido
pelo Laravel a partir de `public/build`, origem única — ver ADR-015
(`docs/adrs/ADR-015-frontend-servido-pelo-laravel.md`), que
resolve a lacuna que existia entre este documento (já assumia
`public/build`) e o código (ainda não tinha a fiação).

Arquitetura aprovada, resumida: Locaweb Hospedagem Linux (compartilhada,
PHP 8.3, sem Docker/root) → PostgreSQL gerenciado pelo próprio plano →
deploy via GitHub Actions (build do frontend no CI + job de deploy via
SSH, `releases/` + symlink `current`) → Google Drive (pasta comum, conta
dedicada via OAuth, também destino do backup) → SMTP incluso no
plano/domínio → backup `pg_dump` + Crontab + upload para o Drive + alerta
de e-mail nativo → subdomínio de `estudioela.com` → SSL do painel Locaweb
→ CI (GitHub Actions, já existente) + CD (job novo de deploy via SSH) →
monitoramento obrigatório (Pulse + alerta de e-mail nativo); Sentry/
UptimeRobot/Healthchecks.io/R2/SMTP dedicado como melhorias opcionais.

---

## 1. Ordem das alterações

A ordem segue dependência real:

1. **Decisões de nomenclatura/valor que travam tudo:** domínio(s) exato(s)
   (frontend/API), credenciais do banco gerenciado (host/porta/usuário/
   senha), confirmação da pasta do Google Drive + conta dedicada OAuth já
   existentes (Material + nova subpasta de backup — ver `ADR-017`).
2. **Confirmação de recursos do plano Locaweb** (fora do repo): SSH,
   Crontab, PHP 8.3, banco gerenciado, SSL, espaço em disco suficiente
   para o histórico de `releases/`.
3. **Ajustes de código de aplicação que a nova arquitetura exige** (§2) —
   precisam existir antes do primeiro deploy real.
4. **Ajustes do pipeline de CI/CD** (§9) — job de build do frontend + job
   de deploy via SSH, sem Docker/Coolify.
5. **Configuração do deploy no host Locaweb** (§7) — estrutura de
   diretórios `releases/`/`current`/`shared/`, script de deploy,
   variáveis de ambiente reais.
6. **Backup + monitoramento obrigatório** (§10) — só faz sentido depois
   do ambiente estar de pé.
7. **Primeiro deploy de homologação → smoke test → produção**, seguindo
   `PLANO_DE_IMPLANTACAO.md`.

---

## 2. Arquivos que serão modificados

| Arquivo | Motivo | STATUS |
|---|---|---|
| `backend/app/Services/GoogleDriveService.php` | Autenticação via OAuth de conta dedicada (`refresh_token`), não Service Account Key — `elafashionmkt-org` bloqueia a criação dessa chave via Org Policy, e o projeto não tem Google Workspace (conta pessoal). Pasta comum no Meu Drive da conta dedicada, não Shared Drive (`corpora=drive`/`driveId` removidos; `supportsAllDrives`/`includeItemsFromAllDrives` mantidos como flags inofensivas). | ✅ ajustado (`ADR-017`, 2026-07-22) |
| `backend/bootstrap/app.php` | `$middleware->trustProxies(at: [...])` — a Locaweb compartilhada expõe a aplicação atrás de um proxy reverso do próprio provedor; sem confiar nesse proxy, `Request::ip()` (rate-limit de `/login`) e a detecção de HTTPS ficam incorretas. O IP/CIDR exato só é confirmável na Etapa 2 do `PLANO_DE_IMPLANTACAO.md` — usar variável de ambiente (`TRUSTED_PROXIES`), nunca hardcode. | ✅ ajustado (commit `29a8306`) — `TRUSTED_PROXIES` já lido via `env()`; valor real do CIDR ainda depende da Etapa 1 |
| `backend/composer.json` | Nenhuma dependência nova obrigatória — `resend/resend-laravel` e `sentry/sentry-laravel` saem do caminho crítico (viram melhoria opcional, só entram se/quando habilitadas). | sem mudança obrigatória |
| `backend/.env.production.example` | Remover qualquer referência a host de serviço Docker (`DB_HOST=db`); apontar `DB_*` para o banco gerenciado da Locaweb; `MAIL_MAILER=smtp` com host/porta do relay incluso no plano (não Resend); adicionar `TRUSTED_PROXIES`, `GOOGLE_DRIVE_BACKUP_FOLDER_ID`; manter `SESSION_DOMAIN`/`APP_URL`/`SANCTUM_STATEFUL_DOMAINS` apontando para o subdomínio de produção. | ✅ ajustado (commits `29a8306` + `ac5180f` — `SESSION_DOMAIN`/`FRONTEND_URL` corrigidos para origem única, ver ADR-015); valores `CHANGE_ME` só preenchíveis com credenciais reais (Etapa 1-4) |
| `docker-compose.yml` | **Deixa de ser o artefato de deploy de produção.** Mantido só como ambiente de desenvolvimento local (uso já existente) — nenhuma referência de produção deve apontar para ele. | mantido só para dev local |
| `scripts/backup-db.sh` | Reescrever: remover qualquer referência a `docker compose exec`; rodar `pg_dump` direto contra host/porta do banco gerenciado (via `PGPASSWORD`/`.pgpass`); ao final, chamar o comando Artisan novo (§3) que sobe o dump ao Google Drive. | ✅ ajustado (commit `29a8306`) |
| `docs/deployment/DEPLOY.md` | Runbook assume hoje deploy manual via Docker Compose — precisa de reescrita completa para o fluxo GitHub Actions + SSH + symlink. | ✅ já reescrito (commit `ef18225`, anterior a esta tabela — a nota de "pendente" abaixo estava desatualizada). Alinhado nesta revisão (2026-07-22) para citar `npm run build:locaweb` (ADR-015) em vez do script genérico. |
| `docs/release/TEAR_V2.5_GO_LIVE_CHECKLIST.md` | P0-2 (banco em produção) e P0-9 (variáveis reais) precisam ser reescritos à luz da nova arquitetura (Postgres gerenciado da Locaweb, não Droplet/Docker). | ✅ já reescrito (commit `ef18225`) — P0-2/P0-9 já descrevem corretamente Postgres gerenciado da Locaweb; ambos permanecem 🔴 abertos só pela credencial/instância real, não por texto desatualizado. |
| `docs/_workspace/TASK_ROUTER.md` | Registrar a mudança de arquitetura (substituição da decisão DigitalOcean/Coolify por Locaweb) quando a execução real começar — convenção já usada no projeto. | ✅ ajustado (§18 registrou o bloqueio, §19 registrou a resolução via ADR-015) |

---

## 3. Novos arquivos necessários

| Arquivo | Motivo | STATUS |
|---|---|---|
| `.github/workflows/tear-v2-deploy.yml` | Job de build do frontend (`npm run build:locaweb`, ver ADR-015) + deploy via SSH (rsync/scp + comandos remotos) para o host Locaweb, com deploy atômico por symlink. | ✅ criado (commit `ac5180f`) — sintaticamente pronto; execução real depende dos secrets de SSH (§7/§9), ainda não cadastrados |
| `scripts/deploy-locaweb.sh` | Script chamado pelo job de deploy — verifica que `vendor/` veio pronto na release, roda `migrate`/`cache`, faz o swap do symlink `current`. Não roda mais `composer install` (host confirmado sem Composer global; `vendor/` é gerado no runner do CI, ver `ADR-016`). | ✅ criado (commit `ac5180f`), ajustado (`ADR-016`, 2026-07-22) |
| `backend/app/Console/Commands/BackupDatabaseToDrive.php` | Comando Artisan que sobe o dump gerado por `backup-db.sh` para a pasta BACKUP do Google Drive, reaproveitando `GoogleDriveService` — substitui o upload para object storage externo da versão anterior. | ✅ criado (commit `29a8306`), com teste dedicado e notificação de falha (`BackupFalhouNotification`) |
| `scripts/crontab.example` | Documentar as linhas de cron do host Locaweb (backup, `schedule:run`, `queue:work --stop-when-empty`) de forma reprodutível. | ✅ criado (commit `29a8306`) — arquivo pronto; instalação real no crontab do host depende do host existir (Etapa 1/9/10) |
| Registro DNS `A`/`CNAME` do subdomínio escolhido apontando para o host Locaweb | Não é arquivo do repositório. | pendente — só infraestrutura externa (Etapa 3) |

---

## 4. Variáveis de ambiente

| Variável | Já existe no template? | Valor esperado na arquitetura aprovada |
|---|---|---|
| `APP_URL` | sim | `https://portal.estudioela.com` (decisão definitiva de 2026-07-22, renomeada de `influencia.estudioela.com` em 2026-07-23, ver `PLANO_DE_IMPLANTACAO.md` Etapa 1 — já preenchido em `.env.production.example`) |
| `FRONTEND_URL` | sim | `https://portal.estudioela.com` |
| `SANCTUM_STATEFUL_DOMAINS` | sim | `portal.estudioela.com`, sem protocolo |
| `SESSION_DOMAIN` | sim | `portal.estudioela.com` (host exato, sem ponto inicial — não o domínio pai) |
| `DB_CONNECTION`/`HOST`/`PORT`/`DATABASE`/`USERNAME`/`PASSWORD` | sim | apontam para o **PostgreSQL gerenciado da Locaweb** (host/porta/credenciais do painel, obtidos na Etapa 3 do `PLANO_DE_IMPLANTACAO.md`) |
| `MAIL_MAILER`/`MAIL_HOST`/`MAIL_PORT`/`MAIL_USERNAME`/`MAIL_PASSWORD` | sim | relay SMTP incluso no plano/domínio Locaweb |
| `GOOGLE_DRIVE_CLIENT_ID` / `_CLIENT_SECRET` / `_REFRESH_TOKEN` / `_ROOT_FOLDER_ID` | sim | OAuth de conta dedicada — pessoal, sem Workspace (`ADR-017`) — não Service Account; `elafashionmkt-org` bloqueia Service Account Key via Org Policy |
| `GOOGLE_DRIVE_BACKUP_FOLDER_ID` | **não** | pasta dedicada dentro da mesma pasta raiz, destino dos dumps de backup |
| `TRUSTED_PROXIES` | **não** | IP(s)/CIDR do proxy reverso da Locaweb, confirmado na Etapa 1 do plano |
| `QUEUE_CONNECTION` | sim (`database` já é opção válida) | `database` — sem worker de longa duração, processado via Crontab (`queue:work --stop-when-empty`) |
| `RESEND_API_KEY` / `SENTRY_LARAVEL_DSN` / `VITE_SENTRY_DSN` | não aplicável | **removidos do caminho obrigatório** — só entram se uma melhoria opcional (`ARQUITETURA_PRODUCAO.md` §16) for habilitada |

---

## 5. Dependências

Nenhuma dependência nova é obrigatória para a arquitetura crítica.
`resend/resend-laravel`, `sentry/sentry-laravel` e `@sentry/react` só
entram no `composer.json`/`package.json` se/quando uma melhoria opcional
correspondente for habilitada — não fazem parte desta sprint nem de
nenhuma etapa do `PLANO_DE_IMPLANTACAO.md`.

---

## 6. Configuração de build/deploy

| Item | STATUS | Detalhe |
|---|---|---|
| `backend/Dockerfile` / `frontend/Dockerfile` | mantidos só para **dev local** | Não são mais o artefato de produção — produção não usa Docker. |
| `docker-compose.yml` | mantido só para **dev local** | Nenhuma referência de produção deve apontar para ele. |
| `.github/workflows/tear-v2-deploy.yml` | ✅ criado | Ver §3 — build do frontend + deploy via SSH. |
| `scripts/deploy-locaweb.sh` | ✅ criado | Ver §3 — estrutura `releases/`/`current`. |
| Estrutura de diretórios no host Locaweb (`releases/`, `current` symlink, `shared/` para `.env`/storage persistente entre releases) | pendente — só infraestrutura externa | Convenção padrão de deploy atômico via SSH, criada manualmente na primeira execução da Etapa 6/7 do plano (depende do host existir). |

---

## 7. Configuração do host Locaweb

Tudo abaixo é configuração feita no painel/SSH da Locaweb, não em arquivo
do repositório:

| Item | STATUS |
|---|---|
| Confirmação de acesso SSH (usuário/senha, **não há cadastro de chave** — auditoria de 2026-07-22, ver `AUDITORIA_LOCAWEB.md` §4.1) | parcialmente confirmado (`PLANO_DE_IMPLANTACAO.md` Etapa 2) |
| Estrutura `releases/`/`current`/`shared/` no diretório do domínio | precisa criar |
| Variáveis de ambiente reais em `shared/.env` (preservado entre releases) | precisa criar |
| Configuração do domínio/subdomínio no painel + SSL | precisa criar |
| Secrets do GitHub Actions (`SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`, caminho de deploy) | ⚠️ pressupõe SSH por chave, não suportado pelo painel — estratégia de deploy em decisão, ver `AUDITORIA_LOCAWEB.md` §5 |

---

## 8. Configuração do PostgreSQL

| Item | STATUS | Detalhe |
|---|---|---|
| `docker-compose.yml`, serviço `db` | mantido só para **dev local** | Produção não usa esse serviço — usa o banco gerenciado da Locaweb. |
| `backend/.env.production.example` (`DB_*`) | ✅ ajustado | Template já aponta `DB_CONNECTION=pgsql` com campos `CHANGE_ME` para host/porta/credenciais do banco gerenciado — não referencia mais serviço `db` de compose. |
| Instância real provisionada/confirmada no painel Locaweb | pendente — só infraestrutura externa | Etapa 3 do `PLANO_DE_IMPLANTACAO.md`. |

---

## 9. Configuração CI/CD

| Item | STATUS | Detalhe |
|---|---|---|
| `.github/workflows/tear-v2-ci.yml` (testes/lint) | já existe | Inalterado — continua rodando em cada push/PR. |
| `.github/workflows/tear-v2-docker.yml` (build+push GHCR) | ✅ removido (commit `ac5180f`) | Produção não consome mais imagem Docker. |
| `.github/workflows/tear-v2-deploy.yml` | ✅ criado (commit `ac5180f`) | Ver §3/§6 — build do frontend + deploy via SSH, job novo do fluxo de produção. |
| Secrets do GitHub (`SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`, `DEPLOY_BASE_PATH`) | pendente — só infraestrutura externa | Nas Settings do repositório, usados pelo job de deploy. Workflow já falha rápido e visível (`::error::`) se ausentes, em vez de tentar conectar com credenciais vazias. |

---

## 10. Configuração de Backup e Monitoramento obrigatório

| Item | STATUS | Detalhe |
|---|---|---|
| `scripts/backup-db.sh` | ✅ ajustado | Ver §2 — sem dependência de `docker compose exec`, roda `pg_dump` direto contra o banco gerenciado. |
| `app/Console/Commands/BackupDatabaseToDrive.php` | ✅ criado | Ver §3 — upload do dump ao Google Drive via `GoogleDriveService`, com `BackupFalhouNotification`. |
| Alerta de falha por e-mail nativo | ✅ criado | Implementado como `Notification` (não `Mail::raw()`, que é no-op sob `Mail::fake()` — ver commit `29a8306`), disparado para ADMINs em falha de `pg_dump`/upload. |
| Agendamento via Crontab do host | ✅ documentado (`scripts/crontab.example`, §3) | Instalação real no crontab do host pendente — só infraestrutura externa, depende do host existir (Etapa 1/9/10). |
| Laravel Pulse (`/pulse`) | já existe | Sem mudança — observabilidade backend já implementada, continua sendo o monitoramento obrigatório. |

---

## 11. O que **não** muda com esta arquitetura

- `config/cors.php`, `config/sanctum.php`, `config/session.php`,
  `config/cache.php`, `config/queue.php`, `config/filesystems.php` — já
  100% orientados a `env()`.
- `backend/Dockerfile`, `frontend/Dockerfile`, `docker-compose.yml` —
  continuam existindo, restritos a uso de desenvolvimento local, nunca
  produção.
- `.github/workflows/tear-v2-ci.yml`.
- `SESSION_SECURE_COOKIE`, security headers (`SecurityHeaders`
  middleware), `RequestId` middleware, `php artisan admin:create`.
- Laravel Pulse.
- `scripts/healthcheck.sh`.
- Ajuste em `GoogleDriveService.php` para OAuth de conta dedicada
  (`ADR-017`) — já aplicado, independente da hospedagem escolhida.

---

## 12. Resumo por STATUS

**Atualizado em 2026-07-22 (pós-execução das Etapas 5/6 de
`PLANO_IMPLEMENTACAO.md`, commits `29a8306` e `ac5180f`).** Todo o
trabalho de código e documentação possível sem acesso externo está
concluído. O que resta é exclusivamente infraestrutura/credenciais reais.

- **já existe** (nenhuma ação): `config/mail.php`, `config/services.php`,
  `config/cors.php`, `config/sanctum.php`, `config/session.php`, ambos
  `Dockerfile` (uso restrito a dev local), `tear-v2-ci.yml`,
  `docker-compose.yml` (uso restrito a dev local), Laravel Pulse.
- **✅ ajustado/criado nesta execução**: `GoogleDriveService.php`,
  `bootstrap/app.php` (`trustProxies`), `.env.production.example` (banco
  gerenciado + SMTP incluso + `TRUSTED_PROXIES` + pasta de backup +
  origem única para `SESSION_DOMAIN`/`FRONTEND_URL`, ADR-015),
  `scripts/backup-db.sh`, `.github/workflows/tear-v2-deploy.yml`,
  `scripts/deploy-locaweb.sh`,
  `app/Console/Commands/BackupDatabaseToDrive.php` +
  `BackupFalhouNotification`, `scripts/crontab.example`,
  `backend/routes/web.php` (catch-all da SPA), `frontend/vite.config.ts`
  (`build:locaweb`), `docs/adrs/ADR-015-frontend-servido-pelo-laravel.md`.
  `.github/workflows/tear-v2-docker.yml` removido.
- **já estava correto, só a nota desta tabela estava desatualizada**:
  `docs/deployment/DEPLOY.md` e `docs/release/TEAR_V2.5_GO_LIVE_CHECKLIST.md`
  já haviam sido reescritos para o fluxo Locaweb/SSH no commit `ef18225`
  (anterior a esta tabela) — a entrada anterior deste resumo, que dizia
  "pendente, fora do escopo", estava obsoleta e foi corrigida agora.
- **pendente — exclusivamente infraestrutura/credenciais externas, fora
  do alcance do agente**: registro DNS do subdomínio; estrutura
  `releases/`/`current`/`shared/` no host; instância real do Postgres
  gerenciado; secrets do GitHub Actions (`SSH_HOST`, `SSH_USER`,
  `SSH_PRIVATE_KEY`, `DEPLOY_BASE_PATH`); credenciais reais de Google
  Drive/SMTP/domínio para preencher `.env` de produção; instalação do
  crontab no host real. Ver `docs/deployment/PLANO_DE_IMPLANTACAO.md`
  Etapas 2-5, 11-14 e 16-17 para o detalhe etapa a etapa.
