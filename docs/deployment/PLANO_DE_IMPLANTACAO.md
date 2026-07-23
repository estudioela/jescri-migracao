# PLANO_DE_IMPLANTACAO.md — TEAR V2.5 (Go-Live)

- **Status:** documento operacional único para a implantação em produção.
- **Data:** 2026-07-22
- **Escopo:** `tear-v2-app` (Laravel 12 + React 19). Não cobre o legado
  GAS (`src/`), que continua em produção sem alteração.
- **Este documento é a fonte única de execução do Go-Live** — consolida e
  substitui, para fins de **execução**, `docs/deployment/PLANO_IMPLEMENTACAO.md`,
  `docs/deployment/CONFIGURACAO_PRODUCAO.md`, `docs/deployment/DEPLOY.md`
  e a seção de infraestrutura de `docs/release/TEAR_V2.5_GO_LIVE_CHECKLIST.md`.
  Esses documentos não foram apagados nem archivados — continuam valendo
  como referência técnica detalhada (auditoria de variáveis, histórico de
  P0/P1/P2, runbook narrativo) — mas a **ordem de execução e os critérios
  de aceite oficiais do Go-Live são os deste arquivo**, corrigidos para
  refletir o estado real do código em 2026-07-22 (ver §0).
- **Não reavalia nenhuma decisão de arquitetura.** Decisões já fechadas e
  não reabertas aqui: `docs/deployment/ARQUITETURA_PRODUCAO.md` (Locaweb
  Hospedagem Linux compartilhada, sem Docker/root, PostgreSQL gerenciado,
  deploy via GitHub Actions + SSH, zero custo recorrente adicional) e
  `docs/adrs/ADR-015-frontend-servido-pelo-laravel.md` (Laravel serve o
  build do Vite, origem única).
- **Este documento não implementa nenhuma funcionalidade nova.** Cobre
  exclusivamente implantação, configuração, segurança, validação e
  operação.

---

## 0. Pré-requisitos já satisfeitos — não repetir

Tudo abaixo já está pronto em código, commitado e testado. Listado aqui
só para não ser confundido com trabalho pendente:

| Item | Onde está |
|---|---|
| CI de testes/lint (backend + frontend) | `.github/workflows/tear-v2-ci.yml` |
| Job de build do frontend + deploy via SSH (Etapas 5/6 da Macrofase A, `ac5180f` — numeração de commit histórico, não as Etapas deste documento) | `.github/workflows/tear-v2-deploy.yml` — ⚠️ presume SSH por chave, não suportado pelo painel real (ver nota na Etapa 9) |
| Script de deploy atômico (`releases/` + symlink `current`) | `scripts/deploy-locaweb.sh` — ⚠️ mesma ressalva acima |
| Suporte a Shared Drive institucional (`supportsAllDrives`, `corpora=drive`) | `backend/app/Services/GoogleDriveService.php` |
| `TRUSTED_PROXIES` condicionado a variável de ambiente (proxy reverso da Locaweb) | `backend/bootstrap/app.php` |
| Backup do banco sem Docker (`pg_dump` direto) + upload ao Drive + alerta de falha por e-mail | `scripts/backup-db.sh`, `app/Console/Commands/BackupDatabaseToDrive.php`, `app/Notifications/BackupFalhouNotification.php` |
| Linhas de crontab prontas para copiar no host | `scripts/crontab.example` |
| Provisionamento do primeiro ADMIN (`php artisan admin:create`, idempotente) | `app/Console/Commands/CreateAdminCommand.php` |
| Frontend servido pelo Laravel a partir de `public/build` (origem única) | `backend/routes/web.php`, `frontend/vite.config.ts` (`npm run build:locaweb`) |
| Security headers, rate limit no login, whitelist de mime, RBAC em todas as rotas de escrita, recuperação de acesso do Portal | Ver `docs/release/TEAR_V2.5_GO_LIVE_CHECKLIST.md` §1 — todos os P0 de código estão ✅ resolvidos |
| Observabilidade de backend (Pulse, `/pulse`, restrito a ADMIN) + correlação de logs (`X-Request-Id`) | `app/Providers/AppServiceProvider.php`, `app/Http/Middleware/RequestId.php` |
| Template de variáveis de produção | `backend/.env.production.example` |
| Suíte de testes | 192/192 verdes, Pint limpo, `tsc -b`/`oxlint`/`vite build` do frontend limpos (2026-07-22) |

**Correção de escopo em relação a documentos anteriores:** `docs/deployment/CONFIGURACAO_PRODUCAO.md` e `docs/deployment/MONITORING.md` ainda descrevem comandos de uma arquitetura Docker/docker-compose anterior (ex.: `docker compose run --rm app php artisan key:generate`, cron de `schedule:run` "não necessário" citando ausência de container). A arquitetura vigente é Locaweb sem Docker (`ARQUITETURA_PRODUCAO.md`, 2026-07-21) — este documento (§2) já traduz os comandos certos para esse ambiente. Os dois arquivos citados continuam corretos quanto **a quais variáveis existem e o que cada uma faz** — só os comandos de exemplo (`docker compose ...`) devem ser lidos como Locaweb/SSH equivalentes descritos aqui.

---

## 1. Inventário de dependências externas — visão geral em ordem de execução

Nenhum item abaixo depende de escrever código. Todos dependem de acesso,
credencial ou decisão que só o responsável do projeto tem.

| # | Item | Bloqueia | Tipo |
|---|---|---|---|
| 1 | Confirmar domínio/subdomínio definitivo | 3, 8 | Decisão |
| 2 | Confirmar acesso à hospedagem Locaweb (SSH, painel) | 3–13 | Acesso |
| 3 | Provisionar PostgreSQL gerenciado | 8, 11 | Infraestrutura |
| 4 | Configurar DNS do subdomínio | 11, 16 | Infraestrutura |
| 5 | Confirmar Google Shared Drive + Service Account | 8, 11 | Credencial |
| 6 | Confirmar/contratar SMTP | 8, 11 | Credencial |
| 7 | Gerar `APP_KEY` real de produção | 8 | Segurança |
| 8 | Preencher `.env` real de produção (`shared/.env` no host) | 11 | Configuração |
| 9 | Cadastrar secrets do GitHub Actions | 11 | Configuração |
| 10 | Criar estrutura `releases/`/`current`/`shared/` no host | 11 | Infraestrutura |
| 11 | Primeiro deploy (homologação) | 12–17 | Implantação |
| 12 | Provisionar o primeiro Administrador | 16 | Operação |
| 13 | Agendar backup no crontab do host | 16 | Operação |
| 14 | Agendar fila/scheduler no crontab do host | 16 | Operação |
| 15 | Configurar uptime check externo | 16 | Operação |
| 16 | Smoke test e critérios de produção saudável | 17 | Validação |
| 17 | Corte para produção (go-live) | — | Operação |
| 18 | Rotina pós-go-live | — | Operação (não é "Etapa 18" em §2 — conteúdo está em §4, ver abaixo) |

---

## 2. Passo a passo — do ambiente local atual ao primeiro acesso em produção

### Etapa 1 — Confirmar domínio/subdomínio definitivo ✅ concluída (2026-07-22)

- **Objetivo:** travar o nome exato que vai ser usado antes de qualquer
  variável de ambiente ou registro DNS ser criado — mudar depois implica
  refazer SSL, CORS, `SESSION_DOMAIN` e `SANCTUM_STATEFUL_DOMAINS`.
- **Decisão (responsável do projeto, 2026-07-22): `influencia.estudioela.com`.**
  Substitui o exemplo ilustrativo `tear.estudioela.com` usado nos
  documentos anteriores a esta data — onde aparecer, é o nome antigo de
  exemplo, não uma decisão diferente.
- **Onde configurar:** propagado às Etapas 4 (DNS) e 8 (`.env` real —
  `APP_URL`, `FRONTEND_URL`, `SANCTUM_STATEFUL_DOMAINS`, `SESSION_DOMAIN`
  já preenchidos com este valor em
  `backend/.env.production.example`, restam só os campos que
  dependem de credencial externa).
- **Como validar:** o nome `influencia.estudioela.com` aparece de forma
  idêntica em `APP_URL`, `FRONTEND_URL`, `SANCTUM_STATEFUL_DOMAINS`,
  `SESSION_DOMAIN` e no registro DNS (Etapa 4) — nenhuma variação de
  `www.`/subdomínio diferente.
- **Critérios de aceite:** ✅ subdomínio definitivo escrito por extenso
  neste documento. Pronto para a Etapa 4 assim que a Etapa 2 (acesso
  Locaweb) estiver confirmada.

---

### Etapa 2 — Confirmar acesso à hospedagem Locaweb ⏳ parcialmente validada (2026-07-22)

- **Auditoria completa do painel realizada (read-only) — ver
  `docs/deployment/AUDITORIA_LOCAWEB.md`.** Confirmado: hospedagem correta
  já existe (`estudioela.com`, Hospedagem I Linux, mesmo plano de
  `elafashionmkt.com.br`, sem custo adicional), PHP 8.3 ativo, PostgreSQL
  disponível, Crontab nativo disponível. **Achado que corrige a premissa
  abaixo:** o painel **não oferece SSH por chave** — só senha (a mesma do
  FTP), com sessão de 3h e renovação manual. Isso afeta diretamente as
  Etapas 9–11 (secrets de SSH, estrutura de diretórios e primeiro deploy)
  e o workflow já commitado em `.github/workflows/tear-v2-deploy.yml`/
  `scripts/deploy-locaweb.sh` (§0), que presume autenticação por chave
  (`SSH_PRIVATE_KEY` + `authorized_keys`) — **não suportada pelo painel**.
  Precisa ser revisado contra essa restrição real antes de ser usado — não
  corrigido nesta sessão, só documentado (auditoria, sem execução de
  etapa). Ver nota na Etapa 9 e checklist de decisão em
  `AUDITORIA_LOCAWEB.md` §5.
- **Ainda pendente para fechar esta etapa:** validar via SSH (usuário
  precisa habilitar no painel, ação manual) — `php -v`, `which composer`,
  `crontab -l`, conexão de teste ao Postgres. Não feito nesta sessão por
  exigir habilitação manual do SSH pelo responsável do projeto.
- **Objetivo:** validar que o plano já contratado tem, de fato, os
  recursos que a arquitetura assume, antes de depender deles nas etapas
  seguintes.
- **Dependências:** credenciais de acesso ao painel Locaweb (login) e
  habilitar o SSH manualmente pelo painel antes de cada uso (auditoria
  confirmou que **não há cadastro de chave SSH** — a autenticação é por
  usuário/senha, a mesma do FTP, com sessão de 3h).
- **Onde configurar:** painel de controle da Locaweb, seção
  Configurações → SSH (botão "Habilitar", renovação manual a cada 3h).
  Nenhum arquivo do repositório envolvido.
- **Como validar (via SSH, depois de habilitar no painel):**
  ```bash
  ssh <usuario>@<host-locaweb>   # autenticação por senha, não por chave
  php -v            # confirmar versão do PHP
  crontab -l         # confirmar acesso a crontab
  git --version
  psql --version     # ou testar conexão ao gerenciado
  ```
- **Critérios de aceite:** SSH conecta (usuário/senha, habilitado no
  painel); PHP confirmado (`^8.3`); `crontab -e` funciona; conexão de
  teste ao banco gerenciado bem-sucedida. **`which composer` não é mais
  critério de aceite** — `ADR-016` decidiu que Composer nunca roda no
  host (auditoria já confirmou, à parte, que está ausente globalmente);
  `vendor/` é gerado no runner do CI e enviado pronto via `rsync`.
- **Risco (resolvido, `ADR-016`):** o limite de CPU/memória do plano para
  `composer install --no-dev` deixou de ser um risco — essa etapa nunca
  roda no host, só no runner do GitHub Actions.

---

### Etapa 3 — Provisionar o PostgreSQL gerenciado

- **Objetivo:** ter o banco de produção (Postgres, decisão já fechada em
  `ARQUITETURA_PRODUCAO.md` §2) acessível, com credenciais dedicadas —
  resolve P0-2 do `GO_LIVE_CHECKLIST.md`.
- **Dependências:** Etapa 2 concluída (acesso ao painel confirmado).
- **Onde configurar:** painel Locaweb (criar/confirmar a instância e o
  banco dedicado, usuário e senha fortes).
- **Como validar:**
  ```bash
  psql "postgresql://<usuario>:<senha>@<host-banco>:<porta>/<database>" -c '\conninfo'
  ```
- **Critérios de aceite:** conexão bem-sucedida; host/porta/nome do
  banco/usuário/senha guardados num gestor de senhas (nunca commitados)
  para uso na Etapa 8.

---

### Etapa 4 — Configurar DNS do subdomínio

- **Objetivo:** apontar o subdomínio definido na Etapa 1 para o host
  Locaweb, sem alterar os nameservers de todo `estudioela.com`.
- **Dependências:** Etapa 1 (nome definitivo) e Etapa 2 (IP/CNAME do
  host Locaweb, informado pelo painel).
- **Onde configurar:** painel de DNS onde `estudioela.com` já está
  hospedado hoje — criar um registro `A`/`CNAME` isolado (nome = o
  subdomínio escolhido, TTL 300–3600).
- **Como validar:**
  ```bash
  dig +short influencia.estudioela.com
  ```
- **Critérios de aceite:** resolve para o IP/host correto a partir de
  pelo menos duas redes diferentes. Resto de `estudioela.com` (e-mail,
  site) continua intocado.

---

### Etapa 5 — Confirmar pasta do Google Drive + conta dedicada (OAuth) ✅ mecanismo definido (2026-07-22, `ADR-017`, adendo 2026-07-22)

> **Correção de 2026-07-22:** esta etapa descrevia autenticação via
> Service Account Key (`GOOGLE_DRIVE_CLIENT_EMAIL`/`_PRIVATE_KEY`). A
> organização `elafashionmkt-org` tem a Org Policy
> `constraints/iam.disableServiceAccountKeyCreation` habilitada, que
> bloqueia a geração dessa chave — confirmado ao tentar executar esta
> etapa. `ADR-017` decidiu trocar o mecanismo por OAuth de conta dedicada
> (`refresh_token`), sem abrir exceção na política da organização.
>
> **Correção de 2026-07-22 (adendo):** a versão anterior deste
> procedimento ainda assumia um **Shared Drive** — recurso exclusivo de
> Google Workspace. O projeto não tem Workspace: a conta usada é pessoal,
> `elafashionmkt@gmail.com`. O procedimento abaixo usa uma **pasta comum
> no Meu Drive** dessa conta, não um Shared Drive — `GoogleDriveService`
> foi ajustado de acordo (removidos os parâmetros `corpora`/`driveId` que
> exigiam Shared Drive).

- **Objetivo:** credenciais para upload de Material e backup de banco,
  sem depender de Service Account Key nem de Google Workspace.
- **Dependências:** acesso à conta Google `elafashionmkt@gmail.com`
  (administra o projeto no Google Cloud) e a um projeto no Google Cloud
  Console vinculado a ela.
- **Onde configurar:** Google Cloud Console + Google Drive + terminal
  (`php artisan google-drive:obter-refresh-token`, uso único):
  1. Confirmar/criar, no Meu Drive de `elafashionmkt@gmail.com`, a pasta
     raiz dedicada (ex.: "TEAR — Materiais de Campanha") e, dentro dela,
     a subpasta `Backup`.
  2. Habilitar a Google Drive API no projeto do Cloud Console
     (**APIs & Services → Library**).
  3. Criar um OAuth Client ID (**APIs & Services → Credentials → Create
     Credentials → OAuth client ID**), tipo **Desktop app** ("App para
     computador" na UI em português) — **não** "TVs and Limited Input
     devices": o Device Flow não suporta o escopo `drive` completo,
     só `drive.file`/`drive.appdata` (ver ADR-017, adendo 2026-07-22).
  4. Na tela de permissão OAuth (**Google Auth Platform → Público-alvo**),
     em "Usuários de teste", adicionar `elafashionmkt@gmail.com` — sem
     isso, a autorização falha com "Acesso bloqueado" (app em fase de
     testes, `Erro 403: access_denied`).
  5. Rodar `php artisan google-drive:obter-refresh-token` (informando o
     Client ID/Secret do passo 3), abrir a URL exibida, logar com
     `elafashionmkt@gmail.com` e autorizar (Authorization Code + redirect
     loopback local — RFC 8252, sem servidor de callback externo, execução
     manual única).
  6. O comando imprime `GOOGLE_DRIVE_CLIENT_ID`/`_CLIENT_SECRET`/
     `_REFRESH_TOKEN` prontos para o `.env`. IDs das pastas
     (`GOOGLE_DRIVE_ROOT_FOLDER_ID`/`_BACKUP_FOLDER_ID`) vêm da URL de
     cada pasta no Drive (trecho após `/folders/`).
  7. Preencher os 5 valores no `.env` e rodar
     `php artisan google-drive:test` — valida variáveis, token, acesso à
     pasta ROOT, existência/criação da pasta BACKUP, permissão de
     escrita, upload, leitura e exclusão de um arquivo de diagnóstico,
     com relatório de sucesso/falha por etapa.
- **Como validar:** `php artisan google-drive:test` termina com "Todas as
  etapas passaram". Validação funcional real (upload de Material de
  verdade) acontece na Etapa 16, em homologação.
- **Critérios de aceite:** os cinco valores (`CLIENT_ID`, `CLIENT_SECRET`,
  `REFRESH_TOKEN`, `ROOT_FOLDER_ID`, `BACKUP_FOLDER_ID`) preenchidos no
  `.env` e `google-drive:test` verde. Sem eles, upload de Material
  retorna 503 para todo usuário (comportamento já implementado, sem
  fallback local — ver `MaterialController::store`).

---

### Etapa 6 — Confirmar/contratar SMTP

- **Objetivo:** envio real de e-mail transacional (convite de
  influenciadora, redefinição de senha) — sem isto, onboarding fica
  bloqueado.
- **Dependências:** decisão do responsável do projeto: relay incluso no
  plano/domínio Locaweb (default assumido em `ARQUITETURA_PRODUCAO.md`
  §6) ou provedor dedicado (Resend/Postmark/SES, melhoria opcional se o
  volume superar o limite do relay incluso).
- **Onde configurar:** painel Locaweb (relay incluso) ou painel do
  provedor escolhido — gerar credenciais SMTP dedicadas e verificar o
  domínio de envio (SPF/DKIM/DMARC) para reduzir chance de spam.
- **Como validar:** enviar um e-mail de teste real via `tinker` ou pelo
  próprio fluxo (convite de influenciadora) em homologação (Etapa 16).
- **Critérios de aceite:** `MAIL_HOST`/`MAIL_PORT`/`MAIL_USERNAME`/
  `MAIL_PASSWORD`/`MAIL_FROM_ADDRESS` preenchidos e testados; e-mail real
  chega à caixa de entrada (não à pasta de spam).

---

### Etapa 7 — Gerar `APP_KEY` real de produção

- **Objetivo:** chave de criptografia própria do ambiente de produção —
  nunca reaproveitar a de dev/homologação (invalidaria todas as
  sessões/cookies se trocada depois, e uma chave compartilhada entre
  ambientes é uma superfície de risco desnecessária).
- **Dependências:** nenhuma além de PHP/composer disponíveis (local ou
  no host, via SSH).
- **Onde configurar:** gerar localmente ou via SSH no host:
  ```bash
  php artisan key:generate --show
  ```
- **Como validar:** o valor gerado começa com `base64:` e tem o
  comprimento esperado (32 bytes codificados).
- **Critérios de aceite:** valor colado em `APP_KEY=` no `.env` real
  (Etapa 8) e guardado num gestor de segredos — nunca commitado.

---

### Etapa 8 — Preencher o `.env` real de produção

- **Objetivo:** consolidar todas as credenciais das Etapas 3, 5, 6, 7 (+
  domínio da Etapa 1) num único `.env` real, que vai viver em
  `shared/.env` no host (persistente entre releases, nunca dentro do
  `git`).
- **Dependências:** Etapas 1, 3, 5, 6, 7 concluídas.
- **Onde configurar:** copiar `backend/.env.production.example`
  para `shared/.env` no host (criado na Etapa 10) e preencher todo campo
  `CHANGE_ME`. Lista completa de variáveis e o que cada uma faz:
  `docs/deployment/CONFIGURACAO_PRODUCAO.md` §1 (continua válido — só os
  comandos de exemplo daquele arquivo referem-se à arquitetura Docker
  anterior). Resumo do que precisa de valor real:

  | Grupo | Variáveis |
  |---|---|
  | Aplicação | `APP_ENV=production`, `APP_KEY` (Etapa 7), `APP_DEBUG=false`, `APP_URL` (Etapa 1) |
  | Banco | `DB_CONNECTION=pgsql`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` (Etapa 3) |
  | Sessão/origem única (ADR-015) | `SESSION_DOMAIN` (sem ponto inicial, host exato — Etapa 1), `SESSION_SECURE_COOKIE=true` |
  | CORS/Sanctum | `FRONTEND_URL` = mesma origem de `APP_URL`; `SANCTUM_STATEFUL_DOMAINS` = mesmo host, sem protocolo |
  | Proxy reverso | `TRUSTED_PROXIES` (IP/CIDR do proxy da Locaweb — confirmar com o suporte do plano na Etapa 2) |
  | E-mail | `MAIL_MAILER=smtp`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM_ADDRESS` (Etapa 6) |
  | Google Drive | `GOOGLE_DRIVE_CLIENT_ID`, `GOOGLE_DRIVE_CLIENT_SECRET`, `GOOGLE_DRIVE_REFRESH_TOKEN`, `GOOGLE_DRIVE_ROOT_FOLDER_ID`, `GOOGLE_DRIVE_BACKUP_FOLDER_ID` (Etapa 5, `ADR-017`) |

- **Como validar:** nenhum `CHANGE_ME` remanescente:
  ```bash
  grep CHANGE_ME shared/.env   # deve retornar vazio
  ```
- **Critérios de aceite:** arquivo completo, sem placeholders, com
  permissão de arquivo restrita (`chmod 600`) no host; cópia do conteúdo
  guardada num gestor de senhas como *break-glass*.

---

### Etapa 9 — Cadastrar secrets do GitHub Actions ⚠️ pressupõe SSH por chave — não suportado pelo painel (nota de 2026-07-22)

- **⚠️ Achado da auditoria (`AUDITORIA_LOCAWEB.md` §4.1):** o texto original
  desta etapa (abaixo) presume `SSH_PRIVATE_KEY` + `authorized_keys`, mas o
  painel Locaweb **não oferece cadastro de chave pública** — só habilitação
  manual por sessão de 3h, autenticado por usuário/senha. Um par de chaves
  gerado para CI não tem onde ser instalado no host. **Esta etapa não pode
  ser executada como descrita até a decisão de estratégia de deploy ser
  tomada** (`AUDITORIA_LOCAWEB.md` §5, recomendação de análise: modelo
  híbrido — FTP automatizado para código/build, SSH manual só para
  `migrate`/cache quando necessário). Mantido o texto original abaixo como
  registro do desenho anterior, para referência na hora de decidir.
- **Objetivo:** permitir que `.github/workflows/tear-v2-deploy.yml`
  publique de fato no host — hoje o workflow já existe e falha rápido e
  visível (`::error::`) exatamente por faltar isto.
- **Dependências:** Etapa 2 (acesso SSH confirmado) e uma chave SSH
  dedicada ao deploy (recomendado: **não** reaproveitar a chave pessoal
  do responsável do projeto — gerar um par novo só para CI).
- **Onde configurar:** GitHub → Settings do repositório → Secrets and
  variables → Actions. Quatro secrets:
  - `SSH_HOST`
  - `SSH_USER`
  - `SSH_PRIVATE_KEY` (chave privada; a pública correspondente vai em
    `~/.ssh/authorized_keys` do usuário de deploy no host)
  - `DEPLOY_BASE_PATH` (caminho absoluto no host onde `releases/`/
    `current`/`shared/` vão viver, ex.: `/home/usuario/tear`)
- **Como validar:** disparar o workflow manualmente
  (`workflow_dispatch`) numa branch de teste e conferir que o step
  "Verifica secrets"/conexão SSH não falha por ausência de credencial.
- **Critérios de aceite:** os 4 secrets cadastrados; um disparo manual
  do workflow chega pelo menos até o `rsync` sem erro de autenticação.

---

### Etapa 10 — Criar a estrutura de diretórios no host

- **Objetivo:** convenção de deploy atômico por symlink (mesmo princípio
  de Capistrano/Deployer, sem precisar de container).
- **Dependências:** Etapa 2 (acesso SSH).
- **Onde configurar:** via SSH, uma única vez, antes do primeiro deploy:
  ```bash
  mkdir -p ~/tear/releases ~/tear/shared/storage
  # copiar/criar shared/.env aqui (Etapa 8)
  # sub-estrutura mínima que o Laravel espera dentro de shared/storage:
  mkdir -p ~/tear/shared/storage/framework/{cache/data,sessions,views,testing}
  mkdir -p ~/tear/shared/storage/{app/public,logs}
  ```
  (ajustar `~/tear` para o mesmo caminho de `DEPLOY_BASE_PATH`, Etapa 9).
- **Como validar:** `ls -la ~/tear` mostra `releases/` e `shared/`
  criados; `shared/.env` existe e não está vazio (Etapa 8 já concluída).
- **Critérios de aceite:** estrutura criada; `deploy-locaweb.sh` (rodado
  na Etapa 11) encontra `shared/.env` e não aborta com a mensagem
  "Faltando .../shared/.env".

---

### Etapa 11 — Primeiro deploy (homologação)

- **Objetivo:** validar o pipeline completo (`composer install` +
  build do frontend, ambos no runner do CI → `rsync` → `migrate --force` →
  cache → symlink `current`) antes de apontar tráfego real.
- **Dependências:** Etapas 3, 4, 8, 9, 10 concluídas.
- **Onde configurar:** disparo **manual**, via `workflow_dispatch` em
  `.github/workflows/tear-v2-deploy.yml` — não há mais disparo automático
  por push (o SSH do plano Locaweb exige habilitação manual no painel e
  expira em ~3h, decisão em `docs/adrs/ADR-016-composer-no-ci-deploy-manual.md`).
  Habilitar o SSH no painel antes de acionar o workflow.
- **Como validar:**
  ```bash
  curl -f https://influencia.estudioela.com/up
  curl -f https://influencia.estudioela.com/api/health
  # via SSH, dentro de current/:
  php artisan migrate:status   # todas as migrations "Ran"
  ```
- **Critérios de aceite:** workflow conclui sem erro até o swap do
  symlink `current`; `/up` e `/api/health` respondem 200; certificado
  HTTPS válido (Etapa 4 + SSL do painel Locaweb, emissão a confirmar se é
  automática ou manual); nenhum tráfego real depende disso ainda.
- **Rollback:** apagar a release recém-criada em `~/tear/releases/<id>/`
  e manter `current` apontando para a release anterior (ou nenhuma, se
  for a primeira execução).

---

### Etapa 12 — Provisionar o primeiro Administrador

- **Objetivo:** ter um usuário `ADMIN` real para operar o sistema.
- **Dependências:** Etapa 11 concluída (aplicação respondendo).
- **Onde configurar:** via SSH, dentro de `~/tear/current/`:
  ```bash
  php artisan admin:create --name="Nome Completo" --email="admin@estudioela.com"
  ```
- **Como validar:** login bem-sucedido em `https://influencia.estudioela.com`
  com o e-mail/senha cadastrados.
- **Critérios de aceite:** papel `ADMIN` confirmado após login. Comando
  é idempotente — rodar de novo com o mesmo e-mail reseta a senha.

---

### Etapa 13 — Agendar backup no crontab do host

- **Objetivo:** backup automatizado do PostgreSQL com cópia fora do host
  e alerta de falha por e-mail — resolve o restante do P0-5.
- **Dependências:** Etapa 11 (banco populado) e Etapa 5 (pasta de backup
  no Drive pronta).
- **Onde configurar:** copiar as linhas de `scripts/crontab.example`
  para o crontab real do host (`crontab -e`), ajustando o caminho se
  `~/tear/current` for outro:
  ```cron
  0 3 * * * cd ~/tear/current && ./scripts/backup-db.sh \
    && php artisan backup:upload-to-drive --latest \
    && find ./backups -name '*.sql.gz' -mtime +14 -delete
  ```
- **Como validar:** rodar manualmente uma vez antes de agendar
  (`./scripts/backup-db.sh` + `php artisan backup:upload-to-drive --latest`)
  e confirmar que o dump aparece na pasta de backup do Shared Drive.
  Testar o alerta forçando uma falha controlada (credencial temporariamente
  inválida) e confirmar que o e-mail de falha chega.
- **Critérios de aceite:** dump real no Drive; `crontab -l` lista a
  linha agendada; alerta de falha testado e funcional.

---

### Etapa 14 — Agendar fila e scheduler no crontab do host

- **Objetivo:** processar jobs de fila e rotinas agendadas sem depender
  de um worker de longa duração (a hospedagem compartilhada não suporta
  systemd/processo persistente).
- **Dependências:** Etapa 11.
- **Onde configurar:** `crontab -e` no host:
  ```cron
  * * * * * cd ~/tear/current && php artisan schedule:run >> /dev/null 2>&1
  * * * * * cd ~/tear/current && php artisan queue:work --stop-when-empty >> /dev/null 2>&1
  ```
- **Como validar:** enfileirar um job de teste e confirmar que é
  processado em até 1-2 minutos.
- **Critérios de aceite:** `crontab -l` lista as duas linhas. Nota: hoje
  não existe nenhum `Job`/rotina agendada real no código (`Schedule::`
  vazio) — a linha de `schedule:run` é preparação para quando isso
  existir, não bloqueia o Go-Live.

---

### Etapa 15 — Configurar uptime check externo

- **Objetivo:** alerta se a hospedagem inteira sair do ar (cenário que
  o Pulse, rodando dentro da própria app, não detecta).
- **Dependências:** Etapa 11 (domínio respondendo).
- **Onde configurar:** `scripts/healthcheck.sh` via cron do
  host (a cada 5 min) **ou** um monitor externo gratuito (UptimeRobot,
  Better Uptime) apontando direto para `/up` e `/api/health` — decisão
  de preferência do responsável do projeto, ambos cobrem o mesmo cenário.
  ```cron
  */5 * * * * TEAR_URL=https://influencia.estudioela.com /caminho/scripts/healthcheck.sh
  ```
- **Como validar:** derrubar a aplicação propositalmente por um instante
  (ou simular via `TEAR_URL` apontando para uma porta fechada) e
  confirmar que o alerta dispara (Slack, se `SLACK_WEBHOOK_URL`
  configurada).
- **Critérios de aceite:** alerta chega em menos de 5-10 minutos de uma
  indisponibilidade real.

---

### Etapa 16 — Smoke test e critérios de produção saudável

- **Objetivo:** validar ponta a ponta antes de declarar o ambiente
  pronto para uso real.
- **Dependências:** Etapas 11, 12, 13, 14 concluídas.
- **Onde validar:** runbook completo em `docs/deployment/DEPLOY.md` §4/§5
  (já correto para o fluxo Locaweb/SSH).
- **Como validar (checklist executável):**
  - [ ] `/up` e `/api/health` → 200.
  - [ ] Certificado HTTPS válido (sem aviso no navegador).
  - [ ] `php artisan migrate:status` sem pendências.
  - [ ] Login funcional na SPA com o `ADMIN` real (Etapa 12).
  - [ ] Uma rota autenticada de leitura responde sem 500 (confirma
        sessão/cookie/CORS/Sanctum coerentes).
  - [ ] `/pulse` acessível só para `ADMIN` (403/redirect para qualquer
        outro papel ou anônimo).
  - [ ] `X-Request-Id` presente em qualquer resposta.
  - [ ] Upload real de Material em homologação — sucesso (Etapa 5
        preenchida) ou 503 esperado (nunca 500) se Drive ainda não
        estiver configurado.
  - [ ] E-mail real de convite/reset chega (Etapa 6 preenchida).
  - [ ] Backup válido e recente existe (Etapa 13 já rodou pelo menos uma
        vez).
  - [ ] Logs (`storage/logs/laravel.log` dentro de `current/`) sem
        exceção não tratada recorrente nos primeiros minutos de tráfego
        de teste.
- **Critérios de aceite:** todos os itens acima verdadeiros. Se qualquer
  item falhar, **não declarar o ambiente pronto** — voltar `current`
  para a release anterior boa conhecida (ou não ter release nenhuma
  ainda, se for a primeira).

---

### Etapa 17 — Corte para produção (go-live)

- **Objetivo:** passar a tratar o domínio de produção como o sistema
  real em uso pelos usuários (admin e influenciadoras).
- **Dependências:** Etapa 16 concluída com todos os critérios
  verdadeiros.
- **Onde configurar:** nenhum arquivo — etapa operacional/comunicacional.
- **Como validar:** uso real por pelo menos 24-48h sem incidente que
  exija rollback.
- **Critérios de aceite:**
  1. Comunicar a URL definitiva ao(s) usuário(s) `ADMIN` reais.
  2. Acompanhar de perto (Pulse, logs, backup) nas primeiras 24-48h.
  3. Manter o sistema legado GAS acessível e intocado durante esse
     período — é o *fallback* natural se o novo domínio precisar sair
     de produção temporariamente.

---

## 3. Rollback (qualquer etapa de deploy)

```bash
# via SSH, dentro de ~/tear/:
ln -sfn releases/<release-anterior-boa>/ current
# só se a migration do release problemático precisar ser desfeita:
cd current && php artisan migrate:rollback --step=1
```

Sempre rodar `./scripts/backup-db.sh` **antes** de qualquer
`migrate:rollback` — reverter migration não restaura dado apagado por
ela. O legado GAS continua no ar durante toda a operação.

---

## 4. Operação pós-go-live (rotina recorrente)

| Frequência | Ação |
|---|---|
| Diária | `scripts/backup-db.sh` + upload ao Drive (via cron, Etapa 13) |
| A cada 5 min | `scripts/healthcheck.sh` ou monitor externo (Etapa 15) |
| A cada minuto | `schedule:run` + `queue:work --stop-when-empty` (Etapa 14) |
| Semanal | Revisar PRs do Dependabot; checar `/pulse` (exceções e slow queries acumuladas) |
| A cada release | Conferir `/up`+`/api/health` e `X-Request-Id` numa resposta de teste, como smoke test de que nada regrediu |

---

## 5. Referências

- `docs/deployment/ARQUITETURA_PRODUCAO.md` — decisão de arquitetura
  (não reaberta aqui).
- `docs/adrs/ADR-015-frontend-servido-pelo-laravel.md` — origem única
  frontend/backend.
- `docs/deployment/PLANO_IMPLEMENTACAO.md` — runbook original das 12
  etapas (histórico; a ordem de execução oficial agora é a deste
  documento).
- `docs/deployment/IMPLEMENTACAO_TECNICA.md` — mapeamento técnico do que
  mudou em código para a arquitetura aprovada existir (§12 tem o resumo
  consolidado de status).
- `docs/deployment/CONFIGURACAO_PRODUCAO.md` — auditoria completa de
  cada variável de ambiente (o que faz, impacto se ausente).
- `docs/deployment/DEPLOY.md` — runbook narrativo de deploy/smoke
  test/rollback/backup.
- `docs/deployment/MONITORING.md` — o que já existe de observabilidade
  e o que fica para depois do Go-Live (P1/P2).
- `docs/release/TEAR_V2.5_GO_LIVE_CHECKLIST.md` — histórico completo de
  P0/P1/P2 e o que foi resolvido em cada sessão.
- `docs/_workspace/TASK_ROUTER.md` §18 em diante — registro de execução
  desta fase (§22: consolidação deste plano; §23: Etapa 1 concluída; §24:
  auditoria Locaweb / Etapa 2).
