# IMPLEMENTACAO_TECNICA.md — TEAR V2.5

**Base:** `ARQUITETURA_PRODUCAO.md` (considerado **aprovado**, sem alternativas em
aberto).
**Escopo:** `tear-v2-app/` (Laravel 13 + Sanctum + Spatie Permission / React 19 +
Vite). Não cobre o legado GAS.
**Natureza deste documento:** mapeamento técnico do que precisa mudar para a
arquitetura aprovada existir de fato. **Nenhum código foi alterado, nenhuma
dependência foi instalada, nenhum commit foi feito.** A execução real é
trabalho de uma sessão separada.

Arquitetura aprovada, resumida: DigitalOcean Droplet (São Paulo, 2vCPU/4GB) →
Coolify self-hosted (Traefik/TLS/zero-downtime/webhook de deploy) → Postgres
16 self-hosted no mesmo Droplet → Google Shared Drive (Service Account
dedicada) → Resend (e-mail transacional) → backup `pg_dump` + Cloudflare R2 +
Healthchecks.io (dead-man's-switch) → subdomínio de `estudioela.com` →
Let's Encrypt via Coolify → CI (GitHub Actions, já existente) + CD (webhook
GitHub → Coolify) → monitoramento (Pulse + UptimeRobot + Healthchecks.io +
Sentry).

---

## 1. Ordem das alterações

A ordem segue dependência real (uma etapa não pode ser validada sem a
anterior existir):

1. **Decisões de nomenclatura/valor que travam tudo** (não são arquivo, mas
   precisam existir antes de preencher qualquer `.env`): domínio(s) exatos
   (ex.: `tear.estudioela.com` para o frontend, `api.tear.estudioela.com`
   para o backend — necessário para `SESSION_DOMAIN`/CORS/Sanctum
   funcionarem entre subdomínios), criação do Shared Drive + Service Account
   no Google Workspace, conta Resend + domínio verificado (SPF/DKIM),
   bucket Cloudflare R2, conta Healthchecks.io/UptimeRobot/Sentry.
2. **Provisionamento de infraestrutura** (fora do repo): Droplet
   DigitalOcean, instalação do Coolify, registro DNS do(s) subdomínio(s)
   apontando para o Droplet (só o registro `A`, sem delegar a zona).
3. **Ajustes de código de aplicação que a nova arquitetura exige** (§6, §8)
   — precisam existir **antes** do primeiro deploy real, porque alteram
   comportamento (Shared Drive quebra sem eles) ou adicionam dependência
   (Resend, Sentry).
4. **Ajustes de Docker/Compose** (§7) — adaptar o artefato de build para o
   modelo Coolify (remoção de publish de porta onde o Traefik assume o
   roteamento, variáveis de FQDN).
5. **Configuração do Coolify** (§8) — importar o repositório, apontar para
   `docker-compose.yml`, configurar domínios/HTTPS/variáveis de ambiente na
   UI, configurar backup agendado do Postgres.
6. **CI/CD** (§13) — configurar o webhook do GitHub apontando para o
   Coolify; decidir o destino do workflow de publicação no GHCR (§13).
7. **Backup offsite + monitoramento** (§11, §12) — só faz sentido depois do
   ambiente estar de pé.
8. **Primeiro deploy de homologação → smoke test → produção**, seguindo
   `docs/DEPLOY.md` adaptado (§9) e `TEAR_V2.5_GO_LIVE_CHECKLIST.md` §4.

---

## 2. Arquivos que serão modificados

| Arquivo | Motivo | STATUS |
|---|---|---|
| `tear-v2-app/backend/app/Services/GoogleDriveService.php` | Migrar de "My Drive pessoal" para Shared Drive institucional (§5 do ARQUITETURA) exige os parâmetros `supportsAllDrives=true` (em `files.create`/upload) e `includeItemsFromAllDrives=true`+`corpora=drive`+`driveId` (em `files.list`, usado por `ensureFolder`) nas chamadas REST — **hoje nenhum dos dois existe no código**. Sem isso, `ensureFolder`/`uploadFile` falham silenciosamente (404/"File not found") contra um Shared Drive, mesmo com credenciais corretas. | precisa ajustar |
| `tear-v2-app/backend/config/mail.php` | Nenhuma mudança de conteúdo — o transporte `resend` **já está definido** no template padrão do Laravel 13. Só confirmar que não foi removido. | já existe |
| `tear-v2-app/backend/config/services.php` | Nenhuma mudança — `resend.key` e `google_drive.*` já lidos de `env()`. | já existe |
| `tear-v2-app/backend/bootstrap/app.php` | Duas adições necessárias: (1) `Sentry\Laravel\Integration::handles($exceptions)` dentro do bloco `->withExceptions()` (novo monitoramento, §12); (2) `$middleware->trustProxies(at: [...])` com o IP interno do Traefik/Coolify — sem isso, `Request::ip()` (usado no rate-limit de `/login`) e a detecção de HTTPS ficam incorretas atrás do proxy. | precisa ajustar |
| `tear-v2-app/backend/composer.json` | Adicionar `resend/resend-laravel` e `sentry/sentry-laravel` a `require` (ver §5 Dependências). | precisa ajustar |
| `tear-v2-app/backend/.env.production.example` | Trocar bloco de `MAIL_*` genérico por valores default de Resend (`MAIL_MAILER=resend`, remover `MAIL_HOST`/`PORT`/`USERNAME`/`PASSWORD` do caminho obrigatório); adicionar `RESEND_API_KEY`, `SENTRY_LARAVEL_DSN`; `SESSION_DOMAIN=.estudioela.com` (ou o subdomínio exato escolhido) como exemplo real em vez de `.CHANGE_ME.com.br`. | precisa ajustar |
| `tear-v2-app/frontend/.env.example` | Adicionar `VITE_SENTRY_DSN` (monitoramento de erro frontend, §12 do ARQUITETURA — hoje não existe nenhum). | precisa ajustar |
| `tear-v2-app/frontend/src/main.tsx` (ou equivalente ponto de entrada) | Inicializar `Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN, ... })`. | precisa ajustar |
| `tear-v2-app/docker-compose.yml` | Remover `ports:` publicados em `nginx` (hoje `8000:8080`) e `frontend` (hoje `5173:8080`) — sob Coolify/Traefik o roteamento é por label/FQDN, não por publish de porta de host; decidir modelo do serviço `db` (manter como serviço do compose vs. migrar para recurso nativo "Database" do Coolify, que é o caminho que habilita "backup agendável na própria UI" citado no ARQUITETURA §3-B/§7). | precisa ajustar |
| `tear-v2-app/scripts/backup-db.sh` | Adicionar upload do dump para Cloudflare R2 (S3-compatible, via `aws s3 cp` ou `rclone`) e um `curl` de ping para Healthchecks.io ao final — nenhum dos dois existe hoje (script só grava local). **Só necessário se o backup continuar via cron/script em vez do recurso nativo do Coolify** — ver decisão pendente em §9. | precisa ajustar |
| `docs/_workspace/TASK_ROUTER.md` | Registrar a decisão de arquitetura (§15) quando a execução real começar — convenção já usada no projeto para não perder histórico. | precisa ajustar (só na execução) |
| `tear-v2-app/docs/DEPLOY.md` | Runbook assume hoje deploy manual (`git pull && docker compose up -d --build`) sem Coolify — precisa de uma seção nova descrevendo o fluxo real (push → CI → webhook → Coolify → healthcheck → swap), mantendo a seção atual como fallback manual (§3-A do ARQUITETURA já prevê isso como plano B). | precisa ajustar |
| `TEAR_V2.5_GO_LIVE_CHECKLIST.md` | Marcar P0-9 (variáveis de produção) como dependente desta arquitetura; adicionar os itens novos (Sentry, Resend, R2, Healthchecks.io, Coolify) à checklist consolidada §6. | precisa ajustar |

---

## 3. Novos arquivos necessários

| Arquivo | Motivo | STATUS |
|---|---|---|
| `tear-v2-app/.env.example` | Template das variáveis de **interpolação do próprio `docker-compose.yml`** (`DB_PASSWORD`, `DB_DATABASE`, `DB_USERNAME`, `VITE_API_URL`) — hoje não existe nenhum arquivo desse nível (só `backend/.env.example`); sem ele o `docker compose up` falha na leitura de `${DB_PASSWORD:?...}`. | precisa criar |
| `tear-v2-app/backend/config/sentry.php` | Gerado por `php artisan sentry:publish` ao instalar `sentry/sentry-laravel` — arquivo padrão do pacote, não escrito à mão. | precisa criar |
| `tear-v2-app/backend/app/Console/Commands/PingHealthchecks.php` **ou** ajuste inline no cron | Só necessário se o backup continuar via `scripts/backup-db.sh` (ver §9) — comando/linha que dispara o ping do dead-man's-switch depois do `pg_dump` bem-sucedido. | precisa criar (condicional) |
| `tear-v2-app/scripts/crontab.example` | Documentar as 2 linhas de cron do host (backup + healthcheck) de forma reprodutível, em vez de só texto solto no `DEPLOY.md`. | precisa criar |
| Registro DNS `A` (ou `CNAME`) do(s) subdomínio(s) escolhido(s) | Não é arquivo do repositório — configuração no provedor de DNS atual de `estudioela.com`. | precisa criar (fora do repo) |

---

## 4. Variáveis de ambiente

Todas em `tear-v2-app/backend/.env` real (nunca versionado); os nomes abaixo
já têm placeholder em `.env.production.example` **exceto os marcados**.

| Variável | Já existe no template? | Valor esperado na arquitetura aprovada |
|---|---|---|
| `APP_URL` | sim | `https://api.<subdominio-escolhido>.estudioela.com` |
| `FRONTEND_URL` | sim | `https://<subdominio-escolhido>.estudioela.com` |
| `SANCTUM_STATEFUL_DOMAINS` | sim | domínio do frontend, sem protocolo |
| `SESSION_DOMAIN` | sim (placeholder genérico) | `.estudioela.com` ou `.<subdominio>.estudioela.com` — depende da decisão de nomenclatura (§1, item 1) |
| `DB_CONNECTION`/`HOST`/`PORT`/`DATABASE`/`USERNAME`/`PASSWORD` | sim | apontam para o Postgres self-hosted (serviço `db` do compose ou host interno do Coolify, conforme decisão §9) |
| `MAIL_MAILER` | sim (hoje `smtp`) | `resend` |
| `RESEND_API_KEY` | **não** | chave da conta Resend |
| `MAIL_FROM_ADDRESS` | sim | domínio verificado no Resend (subdomínio de `estudioela.com`) |
| `GOOGLE_DRIVE_CLIENT_EMAIL` / `_PRIVATE_KEY` / `_ROOT_FOLDER_ID` | sim | Service Account do Shared Drive institucional (não a pessoal) |
| `SENTRY_LARAVEL_DSN` | **não** | DSN do projeto backend criado no Sentry |
| `VITE_SENTRY_DSN` (frontend) | **não** | DSN do projeto frontend criado no Sentry |
| `HEALTHCHECKS_PING_URL` | **não** | URL de ping do check criado no Healthchecks.io (só se backup continuar via script, §9) |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_DEFAULT_REGION` / `AWS_BUCKET` / `AWS_ENDPOINT` | parcial (`AWS_*` já existe mas hoje "não usado", ver auditoria de `CONFIGURACAO_PRODUCAO.md` §1.10) | passam a ser usados **se** o upload para R2 for feito via SDK S3 do backend; se for via `aws-cli`/`rclone` no script de backup, viram variáveis do **ambiente do host/cron**, não do `.env` do Laravel — decisão em §9 |
| `DB_PASSWORD`/`DB_DATABASE`/`DB_USERNAME`/`VITE_API_URL` (nível `tear-v2-app/.env`, não `backend/.env`) | **não** (arquivo não existe, §3) | interpolação do `docker-compose.yml` |

---

## 5. Dependências

| Pacote | Onde | Motivo | STATUS |
|---|---|---|---|
| `resend/resend-laravel` | `backend/composer.json` (`require`) | O transporte `resend` já está mapeado em `config/mail.php`, mas a classe do transporte vem deste pacote — sem ele, `MAIL_MAILER=resend` falha em runtime. | precisa criar (adicionar) |
| `sentry/sentry-laravel` | `backend/composer.json` (`require`) | Monitoramento de erro backend (§12 do ARQUITETURA). | precisa criar (adicionar) |
| `@sentry/react` | `frontend/package.json` (`dependencies`) | Monitoramento de erro frontend — hoje **nenhum** monitoramento de erro existe no frontend (lacuna já registrada no próprio ARQUITETURA §11). | precisa criar (adicionar) |
| Coolify (software, não dependência do projeto) | instalado no Droplet, fora do repositório | Orquestrador de deploy (§3-B do ARQUITETURA). | precisa criar (infra) |
| `aws-cli` ou `rclone` (só se backup via script, §9) | binário no host (ou imagem do container de backup), não no `composer.json`/`package.json` | Upload do dump para Cloudflare R2 (S3-compatible). | precisa criar (condicional) |

---

## 6. Configuração do Docker

| Item | STATUS | Detalhe |
|---|---|---|
| `backend/Dockerfile` | já existe | Nenhuma mudança — multi-stage PHP 8.3-FPM já pronto para o modelo Coolify (Coolify builda a partir do Dockerfile normalmente). |
| `frontend/Dockerfile` | já existe | Nenhuma mudança — `VITE_API_URL` já é `ARG`/`ENV` de build, Coolify injeta build args na hora do build. |
| `backend/.dockerignore` / `frontend/.dockerignore` | já existe | Nenhuma mudança. |
| `docker-compose.yml` — publish de portas (`nginx`, `frontend`) | precisa ajustar | Ver §2 — Traefik/Coolify assume o roteamento externo; portas host-a-container deixam de fazer sentido para os dois serviços web. |
| `docker-compose.yml` — serviço `db` | precisa ajustar (decisão pendente, §9) | Manter como serviço do compose (mínima mudança) vs. migrar para o recurso "Database" nativo do Coolify (habilita backup pela UI, citado no ARQUITETURA §3-B). |
| `docker-compose.yml` — rede | precisa ajustar | Serviços que o Traefik do Coolify precisa alcançar (`nginx`, `frontend`) precisam estar na rede externa que o Coolify cria (`coolify` por convenção) — hoje o compose só usa a rede default implícita. |
| `tear-v2-app/.env.example`/`.env` (nível compose) | precisa criar | Ver §3. |

---

## 7. Configuração do Coolify

Tudo abaixo é configuração feita **na UI/instalação do Coolify**, não em
arquivo do repositório — listado aqui só para não faltar nenhum passo do
mapeamento:

| Item | STATUS |
|---|---|
| Instalação do Coolify no Droplet (script oficial, roda como container) | precisa criar |
| Conexão do Coolify ao repositório Git (token/deploy key) | precisa criar |
| Importação do projeto como recurso "Docker Compose" apontando para `tear-v2-app/docker-compose.yml` | precisa criar |
| Configuração de domínio (FQDN) por serviço exposto (`nginx`→API, `frontend`→SPA) | precisa criar |
| Ativação de HTTPS automático (Let's Encrypt) por domínio, dentro da UI | precisa criar |
| Preenchimento das variáveis de ambiente do §4 na UI do Coolify (ou via `.env` gerenciado por ele) | precisa criar |
| Configuração do webhook de deploy (GitHub → Coolify) | precisa criar — ver §13 |
| Configuração do recurso Postgres (nativo do Coolify **ou** serviço do compose — decisão §9) + backup agendado na UI | precisa criar |

---

## 8. Configuração do PostgreSQL

| Item | STATUS | Detalhe |
|---|---|---|
| `docker-compose.yml`, serviço `db` (Postgres 16, healthcheck, volume nomeado) | já existe | Já modelado exatamente como o ARQUITETURA §2 escolheu ("self-hosted no mesmo Droplet, via Docker"). |
| `backend/.env.production.example` (`DB_CONNECTION=pgsql` e demais `DB_*`) | já existe | Só falta valor real de `DB_PASSWORD`/host. |
| Migração para recurso nativo "Database" do Coolify | precisa ajustar (decisão) | Só se optar por esse caminho em vez de manter o serviço `db` do compose — ver §9. |
| Instância real provisionada (dados/volume no Droplet real) | precisa criar | Ainda não existe fora de ambiente local/dev. |

---

## 9. Decisões que ainda precisam de um valor antes da execução

Não são alternativas de arquitetura (essa parte está fechada) — são
parâmetros que a arquitetura aprovada não fixou em nível de nome/arquivo:

1. **Nomenclatura exata dos subdomínios** (frontend vs. API) — necessário
   para `SESSION_DOMAIN`/CORS/Sanctum e para os FQDNs configurados no
   Coolify.
2. **Modelo do Postgres dentro do Coolify**: manter como serviço do
   `docker-compose.yml` (mudança mínima, mas backup continua dependendo do
   `scripts/backup-db.sh`) vs. migrar para o recurso nativo "Database" do
   Coolify (mudança maior no compose, mas ganha backup agendado + restore
   pela UI, que é o que o ARQUITETURA §3-B usa como justificativa central da
   escolha do Coolify). Essa decisão determina se `scripts/backup-db.sh`
   precisa mesmo ser editado (§2) ou se fica só como fallback manual.
3. **Onde roda o upload para o R2**: dentro do script de backup (via
   `aws-cli`/`rclone`, mais simples de manter no padrão atual) vs. como
   destino S3-compatible configurado direto na UI de backup do Coolify (se
   a decisão 2 for pelo recurso nativo). Determina se `AWS_*`/credenciais R2
   entram no `.env` do Laravel, num `.env` do host, ou só na UI do Coolify.

---

## 10. Configuração do Google Drive

| Item | STATUS | Detalhe |
|---|---|---|
| `config/services.php` (leitura de `GOOGLE_DRIVE_*`) | já existe | Nenhuma mudança de código. |
| `app/Services/GoogleDriveService.php` — suporte a Shared Drive | **precisa ajustar** | Ver §2 — sem `supportsAllDrives`/`includeItemsFromAllDrives`/`corpora=drive`+`driveId`, o upload/organização de pastas falha contra um Shared Drive real, mesmo com credenciais corretas. |
| Criação do Shared Drive institucional no Google Workspace | precisa criar | Fora do repositório. |
| Criação da Service Account dedicada + compartilhamento do Shared Drive (papel Editor/Content Manager) | precisa criar | Fora do repositório. |
| Preenchimento de `GOOGLE_DRIVE_CLIENT_EMAIL`/`_PRIVATE_KEY`/`_ROOT_FOLDER_ID` no `.env` real | precisa criar | Valor, não template — o template já existe. |

---

## 11. Configuração do Resend

| Item | STATUS | Detalhe |
|---|---|---|
| `config/mail.php` (`'resend' => ['transport' => 'resend']`) | já existe | Padrão do Laravel 13. |
| `config/services.php` (`'resend' => ['key' => env('RESEND_API_KEY')]`) | já existe | Padrão do Laravel 13. |
| Pacote `resend/resend-laravel` | precisa criar | Ver §5 — sem ele o transporte não tem implementação real. |
| `.env.production.example`: `MAIL_MAILER=resend`, `RESEND_API_KEY=CHANGE_ME` | precisa ajustar | Hoje o template assume SMTP genérico (`MAIL_HOST`/`PORT`/`USERNAME`/`PASSWORD`), que deixam de ser obrigatórios nesse caminho. |
| Conta Resend criada + domínio de envio verificado (SPF/DKIM) | precisa criar | Fora do repositório — domínio provavelmente um subdomínio de `estudioela.com` dedicado a e-mail transacional. |
| Correção do "Regards," em inglês no template de e-mail (P1 já registrado em `TEAR_V2.5_GO_LIVE_CHECKLIST.md`) | precisa ajustar | Não é causado pela troca de provedor, mas é o momento natural de revisar o template já que o e-mail vai finalmente sair de verdade. |

---

## 12. Configuração de Backup

| Item | STATUS | Detalhe |
|---|---|---|
| `scripts/backup-db.sh` (dump local `pg_dump`) | já existe | Cobre só a parte "gerar o dump". |
| `scripts/restore-db.sh` | já existe | Sem mudança necessária. |
| Upload do dump para Cloudflare R2 | precisa criar/ajustar | Ver decisão §9 (script vs. Coolify nativo). |
| Ping de dead-man's-switch (Healthchecks.io) | precisa criar | Não existe hoje em nenhuma forma — é a lacuna que o próprio ARQUITETURA §7 aponta como real no estado atual. |
| Agendamento via cron do host | precisa criar | Infra, não arquivo do repo (exemplo documentado em `scripts/crontab.example`, §3). |
| Conta Cloudflare R2 + bucket criado | precisa criar | Fora do repositório. |
| Conta Healthchecks.io + check criado | precisa criar | Fora do repositório. |
| Teste de restore (runbook trimestral, já mencionado no ARQUITETURA §14) | precisa criar | Prática operacional, não arquivo — mas vale um parágrafo em `docs/DEPLOY.md` (§2 acima). |

---

## 13. Configuração HTTPS

| Item | STATUS | Detalhe |
|---|---|---|
| Certificado Let's Encrypt | precisa criar | Emitido automaticamente pelo Traefik embutido no Coolify assim que o domínio for configurado na UI — nenhum arquivo do repo controla isso. |
| `backend/docker/nginx.conf` | já existe | Continua servindo HTTP puro internamente (porta 8080) — o TLS termina no Traefik do Coolify **na frente** do nginx, não dentro dele; nenhuma mudança necessária aqui. |
| `frontend/docker/nginx.conf` | já existe | Mesmo raciocínio acima. |
| `bootstrap/app.php` — `trustProxies()` | precisa ajustar | Ver §2 — sem isso, o Laravel não confia nos headers `X-Forwarded-Proto`/`X-Forwarded-For` que o Traefik injeta, afetando geração de URL, detecção de HTTPS e o IP usado pelo rate-limit de login. |
| `SESSION_SECURE_COOKIE=true` | já existe | Já no `.env.production.example`, correto para HTTPS. |

---

## 14. Configuração CI/CD

| Item | STATUS | Detalhe |
|---|---|---|
| `.github/workflows/tear-v2-ci.yml` (testes/lint) | já existe | ARQUITETURA §10 é explícito: "já existente e funciona", **inalterado**. |
| `.github/workflows/tear-v2-docker.yml` (build+push GHCR) | precisa ajustar (decisão) | Deixa de ser o caminho de deploy (Coolify builda direto do Dockerfile a partir do webhook) — decidir entre (a) manter só como cache/verificação de build em `main`, sem nenhuma mudança de conteúdo, ou (b) aposentar o workflow, já que o Coolify substitui essa função. Nenhuma ação é obrigatória — é uma limpeza opcional, não um bloqueio. |
| Webhook do GitHub → Coolify | precisa criar | Configurado nas Settings do repositório (Webhooks) apontando para a URL de deploy que o Coolify gera ao criar o recurso — não é um arquivo de workflow novo, é um webhook simples (evento `push` em `main`), consistente com ARQUITETURA §10-B. |
| Secret/token de autenticação do webhook | precisa criar | Gerado pelo Coolify na criação do recurso; guardado nas configurações do webhook do GitHub, não em arquivo do repositório. |

---

## 15. O que **não** muda com esta arquitetura

Para deixar explícito o que a auditoria confirma que já está pronto e não
precisa de nenhuma ação:

- `config/cors.php`, `config/sanctum.php`, `config/session.php`,
  `config/cache.php`, `config/queue.php`, `config/filesystems.php` — já
  100% orientados a `env()`, sem hardcode de infraestrutura.
- `backend/Dockerfile`, `frontend/Dockerfile`, `.dockerignore` de ambos.
- `.github/workflows/tear-v2-ci.yml`.
- `SESSION_SECURE_COOKIE`, security headers (`SecurityHeaders`
  middleware), `RequestId` middleware, `php artisan admin:create`.
- Laravel Pulse (`/pulse`) — observabilidade backend já implementada.
- `scripts/healthcheck.sh` — já cobre a checagem que o UptimeRobot vai
  duplicar externamente (mantém como checagem interna/local, sem conflito).

---

## 16. Resumo por STATUS

- **já existe** (nenhuma ação): `config/mail.php`, `config/services.php`,
  `config/cors.php`, `config/sanctum.php`, `config/session.php`,
  ambos `Dockerfile`, ambos `.dockerignore`, `tear-v2-ci.yml`,
  `docker-compose.yml` (serviço `db` como está, se a decisão §9 mantiver o
  modelo atual), `backend/.env.production.example` (estrutura geral).
- **precisa ajustar**: `GoogleDriveService.php`, `bootstrap/app.php`,
  `composer.json`, `.env.production.example` (bloco de e-mail e domínio),
  `frontend/.env.example`, `main.tsx` do frontend, `docker-compose.yml`
  (portas/rede), `scripts/backup-db.sh` (condicional), `docs/DEPLOY.md`,
  `TEAR_V2.5_GO_LIVE_CHECKLIST.md`, `tear-v2-docker.yml` (decisão de
  destino, não obrigatório).
- **precisa criar**: `tear-v2-app/.env.example`, `config/sentry.php`
  (gerado pelo pacote), `scripts/crontab.example`, dependências
  (`resend/resend-laravel`, `sentry/sentry-laravel`, `@sentry/react`),
  toda a configuração do Coolify (§7), contas/recursos externos (Shared
  Drive, Service Account, Resend, R2, Healthchecks.io, UptimeRobot,
  Sentry, DNS).
