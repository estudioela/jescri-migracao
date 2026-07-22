# IMPLEMENTACAO_TECNICA.md — TEAR V2.5

**Base:** `ARQUITETURA_PRODUCAO.md` (revisado, decisão definitiva
2026-07-21 — Locaweb Hospedagem Linux, PostgreSQL gerenciado, deploy via
GitHub Actions + SSH, zero custo recorrente adicional).
**Escopo:** `tear-v2-app/` (Laravel + Sanctum + Spatie Permission / React +
Vite). Não cobre o legado GAS.
**Natureza deste documento:** mapeamento técnico do que precisa mudar
para a arquitetura aprovada existir de fato. **Nenhum código foi
alterado, nenhuma dependência foi instalada, nenhum commit de código foi
feito nesta revisão.** A execução real é trabalho de uma sessão separada.

Arquitetura aprovada, resumida: Locaweb Hospedagem Linux (compartilhada,
PHP 8.3, sem Docker/root) → PostgreSQL gerenciado pelo próprio plano →
deploy via GitHub Actions (build do frontend no CI + job de deploy via
SSH, `releases/` + symlink `current`) → Google Shared Drive (Service
Account dedicada, também destino do backup) → SMTP incluso no
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
   senha), confirmação do Shared Drive + Service Account já existentes
   (Material + nova subpasta de backup).
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
   `PLANO_IMPLEMENTACAO.md` revisado.

---

## 2. Arquivos que serão modificados

| Arquivo | Motivo | STATUS |
|---|---|---|
| `tear-v2-app/backend/app/Services/GoogleDriveService.php` | Suporte a Shared Drive exige `supportsAllDrives=true` (em `files.create`/upload) e `includeItemsFromAllDrives=true`+`corpora=drive`+`driveId` (em `files.list`, usado por `ensureFolder`) — hoje nenhum dos dois existe no código. Sem isso, `ensureFolder`/`uploadFile` falham silenciosamente contra um Shared Drive, mesmo com credenciais corretas. Necessário independente da hospedagem escolhida. | precisa ajustar |
| `tear-v2-app/backend/bootstrap/app.php` | `$middleware->trustProxies(at: [...])` — a Locaweb compartilhada expõe a aplicação atrás de um proxy reverso do próprio provedor; sem confiar nesse proxy, `Request::ip()` (rate-limit de `/login`) e a detecção de HTTPS ficam incorretas. O IP/CIDR exato só é confirmável na Etapa 1 do `PLANO_IMPLEMENTACAO.md` — usar variável de ambiente (`TRUSTED_PROXIES`), nunca hardcode. | precisa ajustar |
| `tear-v2-app/backend/composer.json` | Nenhuma dependência nova obrigatória — `resend/resend-laravel` e `sentry/sentry-laravel` saem do caminho crítico (viram melhoria opcional, só entram se/quando habilitadas). | sem mudança obrigatória |
| `tear-v2-app/backend/.env.production.example` | Remover qualquer referência a host de serviço Docker (`DB_HOST=db`); apontar `DB_*` para o banco gerenciado da Locaweb; `MAIL_MAILER=smtp` com host/porta do relay incluso no plano (não Resend); adicionar `TRUSTED_PROXIES`, `GOOGLE_DRIVE_BACKUP_FOLDER_ID`; manter `SESSION_DOMAIN`/`APP_URL`/`SANCTUM_STATEFUL_DOMAINS` apontando para o subdomínio de produção. | precisa ajustar |
| `tear-v2-app/docker-compose.yml` | **Deixa de ser o artefato de deploy de produção.** Mantido só como ambiente de desenvolvimento local (uso já existente) — nenhuma referência de produção deve apontar para ele. | mantido só para dev local |
| `tear-v2-app/scripts/backup-db.sh` | Reescrever: remover qualquer referência a `docker compose exec`; rodar `pg_dump` direto contra host/porta do banco gerenciado (via `PGPASSWORD`/`.pgpass`); ao final, chamar o comando Artisan novo (§3) que sobe o dump ao Google Drive. | precisa ajustar |
| `tear-v2-app/docs/DEPLOY.md` | Runbook assume hoje deploy manual via Docker Compose — precisa de reescrita completa para o fluxo GitHub Actions + SSH + symlink. **Registrado como pendência desta revisão, não reescrito nesta sessão** (fora do escopo dos três documentos pedidos) — sinalizar antes de iniciar a Etapa 11 do `PLANO_IMPLEMENTACAO.md`. | pendente (fora do escopo desta revisão) |
| `docs/release/TEAR_V2.5_GO_LIVE_CHECKLIST.md` | P0-2 (banco em produção) e P0-9 (variáveis reais) precisam ser reescritos à luz da nova arquitetura (Postgres gerenciado da Locaweb, não Droplet/Docker). **Mesma nota acima** — pendência registrada, não reescrito nesta sessão. | pendente (fora do escopo desta revisão) |
| `docs/_workspace/TASK_ROUTER.md` | Registrar a mudança de arquitetura (substituição da decisão DigitalOcean/Coolify por Locaweb) quando a execução real começar — convenção já usada no projeto. | precisa ajustar (só na execução) |

---

## 3. Novos arquivos necessários

| Arquivo | Motivo | STATUS |
|---|---|---|
| `.github/workflows/tear-v2-deploy.yml` | Job de build do frontend (`npm ci && npm run build`) + deploy via SSH (rsync/scp + comandos remotos) para o host Locaweb, com deploy atômico por symlink. | precisa criar |
| `tear-v2-app/scripts/deploy-locaweb.sh` | Script chamado pelo job de deploy — cria `releases/<id>/`, roda `composer install`/`migrate`/`cache`, faz o swap do symlink `current`. | precisa criar |
| `tear-v2-app/backend/app/Console/Commands/BackupDatabaseToDrive.php` | Comando Artisan que sobe o dump gerado por `backup-db.sh` para o Google Shared Drive, reaproveitando `GoogleDriveService` — substitui o upload para object storage externo da versão anterior. | precisa criar |
| `tear-v2-app/scripts/crontab.example` | Documentar as linhas de cron do host Locaweb (backup, `schedule:run`, `queue:work --stop-when-empty`) de forma reprodutível. | precisa criar |
| Registro DNS `A`/`CNAME` do subdomínio escolhido apontando para o host Locaweb | Não é arquivo do repositório. | precisa criar (fora do repo) |

---

## 4. Variáveis de ambiente

| Variável | Já existe no template? | Valor esperado na arquitetura aprovada |
|---|---|---|
| `APP_URL` | sim | `https://<subdominio-escolhido>.estudioela.com` (ou `api.<subdominio>`, a confirmar na Etapa 1/3 do plano) |
| `FRONTEND_URL` | sim | `https://<subdominio-escolhido>.estudioela.com` |
| `SANCTUM_STATEFUL_DOMAINS` | sim | domínio do frontend, sem protocolo |
| `SESSION_DOMAIN` | sim | `.estudioela.com` (ou subdomínio exato) |
| `DB_CONNECTION`/`HOST`/`PORT`/`DATABASE`/`USERNAME`/`PASSWORD` | sim | apontam para o **PostgreSQL gerenciado da Locaweb** (host/porta/credenciais do painel, obtidos na Etapa 2 do `PLANO_IMPLEMENTACAO.md`) |
| `MAIL_MAILER`/`MAIL_HOST`/`MAIL_PORT`/`MAIL_USERNAME`/`MAIL_PASSWORD` | sim | relay SMTP incluso no plano/domínio Locaweb |
| `GOOGLE_DRIVE_CLIENT_EMAIL` / `_PRIVATE_KEY` / `_ROOT_FOLDER_ID` | sim | Service Account do Shared Drive institucional |
| `GOOGLE_DRIVE_BACKUP_FOLDER_ID` | **não** | pasta dedicada dentro do mesmo Shared Drive, destino dos dumps de backup |
| `TRUSTED_PROXIES` | **não** | IP(s)/CIDR do proxy reverso da Locaweb, confirmado na Etapa 1 do plano |
| `QUEUE_CONNECTION` | sim (`database` já é opção válida) | `database` — sem worker de longa duração, processado via Crontab (`queue:work --stop-when-empty`) |
| `RESEND_API_KEY` / `SENTRY_LARAVEL_DSN` / `VITE_SENTRY_DSN` | não aplicável | **removidos do caminho obrigatório** — só entram se uma melhoria opcional (`ARQUITETURA_PRODUCAO.md` §16) for habilitada |

---

## 5. Dependências

Nenhuma dependência nova é obrigatória para a arquitetura crítica.
`resend/resend-laravel`, `sentry/sentry-laravel` e `@sentry/react` só
entram no `composer.json`/`package.json` se/quando uma melhoria opcional
correspondente for habilitada — não fazem parte desta sprint nem de
nenhuma etapa do `PLANO_IMPLEMENTACAO.md`.

---

## 6. Configuração de build/deploy

| Item | STATUS | Detalhe |
|---|---|---|
| `backend/Dockerfile` / `frontend/Dockerfile` | mantidos só para **dev local** | Não são mais o artefato de produção — produção não usa Docker. |
| `docker-compose.yml` | mantido só para **dev local** | Nenhuma referência de produção deve apontar para ele. |
| `.github/workflows/tear-v2-deploy.yml` | precisa criar | Ver §3 — build do frontend + deploy via SSH. |
| `tear-v2-app/scripts/deploy-locaweb.sh` | precisa criar | Ver §3 — estrutura `releases/`/`current`. |
| Estrutura de diretórios no host Locaweb (`releases/`, `current` symlink, `shared/` para `.env`/storage persistente entre releases) | precisa criar | Convenção padrão de deploy atômico via SSH, criada manualmente na primeira execução da Etapa 6/7 do plano. |

---

## 7. Configuração do host Locaweb

Tudo abaixo é configuração feita no painel/SSH da Locaweb, não em arquivo
do repositório:

| Item | STATUS |
|---|---|
| Confirmação de acesso SSH + chave já cadastrada | precisa confirmar (Etapa 1 do plano) |
| Estrutura `releases/`/`current`/`shared/` no diretório do domínio | precisa criar |
| Variáveis de ambiente reais em `shared/.env` (preservado entre releases) | precisa criar |
| Configuração do domínio/subdomínio no painel + SSL | precisa criar |
| Secrets do GitHub Actions (`SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`, caminho de deploy) | precisa criar |

---

## 8. Configuração do PostgreSQL

| Item | STATUS | Detalhe |
|---|---|---|
| `docker-compose.yml`, serviço `db` | mantido só para **dev local** | Produção não usa esse serviço — usa o banco gerenciado da Locaweb. |
| `backend/.env.production.example` (`DB_*`) | precisa ajustar | Valores reais vêm do banco gerenciado (host/porta/credenciais do painel), não de um serviço `db` de compose. |
| Instância real provisionada/confirmada no painel Locaweb | precisa criar/confirmar | Etapa 2 do `PLANO_IMPLEMENTACAO.md`. |

---

## 9. Configuração CI/CD

| Item | STATUS | Detalhe |
|---|---|---|
| `.github/workflows/tear-v2-ci.yml` (testes/lint) | já existe | Inalterado — continua rodando em cada push/PR. |
| `.github/workflows/tear-v2-docker.yml` (build+push GHCR) | **aposentar** | Deixa de fazer sentido — produção não consome imagem Docker. Remoção é limpeza a ser feita na sessão de execução, não bloqueia nada. |
| `.github/workflows/tear-v2-deploy.yml` | precisa criar | Ver §3/§6 — build do frontend + deploy via SSH, job novo do fluxo de produção. |
| Secrets do GitHub (`SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`) | precisa criar | Nas Settings do repositório, usados pelo job de deploy. |

---

## 10. Configuração de Backup e Monitoramento obrigatório

| Item | STATUS | Detalhe |
|---|---|---|
| `scripts/backup-db.sh` | precisa ajustar | Ver §2 — remove dependência de `docker compose exec`, roda `pg_dump` direto contra o banco gerenciado. |
| `app/Console/Commands/BackupDatabaseToDrive.php` | precisa criar | Ver §3 — upload do dump ao Google Drive via `GoogleDriveService`. |
| Alerta de falha por e-mail nativo | precisa criar | Lógica simples dentro do comando acima ou do script: se `pg_dump`/upload falhar, dispara `Mail::raw(...)` para o admin, usando o mesmo SMTP do §6 de `ARQUITETURA_PRODUCAO.md`. |
| Agendamento via Crontab do host | precisa criar | `scripts/crontab.example` (§3) documenta as linhas exatas. |
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
- Necessidade de ajuste em `GoogleDriveService.php` (Shared Drive) —
  necessária independente da hospedagem escolhida.

---

## 12. Resumo por STATUS

- **já existe** (nenhuma ação): `config/mail.php`, `config/services.php`,
  `config/cors.php`, `config/sanctum.php`, `config/session.php`, ambos
  `Dockerfile` (uso restrito a dev local), `tear-v2-ci.yml`,
  `docker-compose.yml` (uso restrito a dev local).
- **precisa ajustar**: `GoogleDriveService.php`, `bootstrap/app.php`
  (`trustProxies`, sem bloco Sentry), `.env.production.example` (banco
  gerenciado + SMTP incluso + `TRUSTED_PROXIES` + pasta de backup),
  `scripts/backup-db.sh`.
- **precisa criar**: `.github/workflows/tear-v2-deploy.yml`,
  `scripts/deploy-locaweb.sh`,
  `app/Console/Commands/BackupDatabaseToDrive.php`,
  `scripts/crontab.example`, estrutura `releases/`/`current`/`shared/` no
  host, secrets do GitHub Actions.
- **pendente, fora do escopo desta revisão** (sinalizado, não reescrito
  agora): `tear-v2-app/docs/DEPLOY.md`, `docs/release/TEAR_V2.5_GO_LIVE_CHECKLIST.md`
  — ambos ainda descrevem o fluxo Docker/Coolify antigo e precisam de
  reescrita própria antes da Etapa 11 do `PLANO_IMPLEMENTACAO.md`.
