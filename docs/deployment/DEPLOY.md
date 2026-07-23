# Deploy — TEAR V2 (`tear-v2-app`)

> **Nota (2026-07-22):** a ordem de execução oficial do Go-Live, com
> critérios de aceite por etapa, é `docs/deployment/PLANO_DE_IMPLANTACAO.md`.
> Este runbook serve como detalhe narrativo do mesmo fluxo, com uma
> correção pontual — ver nota abaixo.
>
> **Correção factual (2026-07-22, `ADR-016`):** §2 e §6 abaixo descrevem
> `composer install` rodando no host via SSH e o deploy disparado
> automaticamente por push em `main` — ambos superados. O host Locaweb foi
> confirmado sem Composer instalado globalmente; `composer install` passou
> a rodar só no runner do GitHub Actions (`vendor/` chega pronto via
> `rsync`), e o disparo do workflow passou a ser manual
> (`workflow_dispatch`), já que o SSH do plano é temporário (~3h). Ver
> `docs/adrs/ADR-016-composer-no-ci-deploy-manual.md` e
> `docs/deployment/PLANO_DE_IMPLANTACAO.md` Etapa 11 para a mecânica
> corrigida.
>
> **Correção factual (2026-07-22, `ADR-017`):** as menções abaixo a
> "Service Account dedicada" para o Google Drive estão superadas — não há
> Google Workspace disponível (conta pessoal `elafashionmkt@gmail.com`),
> e a Org Policy do Google Cloud bloqueia Service Account Key. A
> autenticação passou a ser OAuth 2.0 de conta dedicada
> (`GOOGLE_DRIVE_CLIENT_ID`/`_CLIENT_SECRET`/`_REFRESH_TOKEN`), sem Shared
> Drive. Ver `docs/adrs/ADR-017-oauth-conta-dedicada-google-drive.md` e
> `docs/deployment/PLANO_DE_IMPLANTACAO.md` Etapa 5.

Runbook operacional. Ver `docs/release/TEAR_V2.5_GO_LIVE_CHECKLIST.md` (raiz do
repositório) para o checklist de prontidão e a lista de pendências P0/P1/P2, e
`docs/deployment/ARQUITETURA_PRODUCAO.md` para a decisão de arquitetura por
trás deste runbook (Locaweb Hospedagem Linux compartilhada, sem Docker/root —
decisão soberana de custo zero, aprovada e definitiva em 2026-07-21).

> **Nota de consolidação (2026-07-22):** este runbook já descreveu, em versão
> anterior, um fluxo baseado em Docker Compose. Essa versão ficou obsoleta no
> mesmo dia em que foi escrita — a arquitetura de produção definitiva optou
> por hospedagem compartilhada sem Docker/root (restrição soberana de custo
> zero), tornando o runbook anterior tecnicamente inexecutável no ambiente
> real. `docker-compose.yml` e os `Dockerfile` continuam existindo no
> repositório, mas **só para desenvolvimento local** — nenhuma referência de
> produção deve apontar para eles. `.github/workflows/tear-v2-docker.yml`
> (build/push de imagem para GHCR) está marcado para aposentar pelo mesmo
> motivo. Este documento substitui a versão Docker anterior pela versão
> alinhada à decisão vigente, seguindo o mapeamento técnico já registrado em
> `docs/deployment/IMPLEMENTACAO_TECNICA.md`.

## 1. Pré-requisitos

- Hospedagem Locaweb Linux já contratada: acesso SSH, Crontab, PHP 8.3,
  PostgreSQL gerenciado pelo próprio plano, SSL emitido pelo painel, Git.
- Domínio: `influencia.estudioela.com` (subdomínio de `estudioela.com`,
  definitivo desde 2026-07-22 — ver `docs/deployment/PLANO_DE_IMPLANTACAO.md`
  Etapa 1), registro DNS isolado apontando para o host Locaweb.
- Credenciais reais: banco gerenciado (host/porta/usuário/senha do painel),
  Google Drive (pasta comum + conta dedicada via OAuth — `ADR-017`,
  Material + backup), relay SMTP incluso no plano/domínio.
- Secrets do GitHub Actions: `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`,
  caminho absoluto de deploy no host.
- Ajustes de código que a arquitetura exige e que precisam existir antes do
  primeiro deploy real (detalhe em `IMPLEMENTACAO_TECNICA.md` §2): OAuth de
  conta dedicada em `GoogleDriveService.php` (`ADR-017`), `trustProxies()`
  em `bootstrap/app.php` (proxy reverso da Locaweb), `scripts/backup-db.sh`
  sem dependência de `docker compose exec`.

## 2. Pipeline de deploy (GitHub Actions + SSH, deploy atômico por symlink)

Sem containers e sem orquestrador — o deploy é direto:

1. CI (`tear-v2-ci.yml`, já existente) roda testes/lint em cada push/PR.
2. Job de **build** (`.github/workflows/tear-v2-deploy.yml`) roda
   `npm ci && npm run build:locaweb` no runner — o Vite gera os assets
   estáticos direto em `backend/public/build` (origem única, Laravel serve
   o frontend — ver ADR-015). Node/npm não são dependência do servidor de
   produção.
3. Job de **deploy** (mesmo workflow, só na branch de produção) conecta via
   SSH ao host Locaweb e publica os arquivos (`rsync`) em `releases/<id>/`,
   depois:
   ```bash
   cd ~/releases/<id>/
   composer install --no-dev --optimize-autoloader
   ln -sfn ~/shared/.env .env
   php artisan migrate --force
   php artisan config:cache && php artisan route:cache && php artisan view:cache
   ln -sfn ~/releases/<id>/ ~/current
   ```
4. O `.env` real vive em `~/shared/.env` no host (preservado entre releases,
   nunca commitado) — gerar a partir de `backend/.env.production.example`,
   preenchendo todo campo `CHANGE_ME` com os valores reais (banco gerenciado,
   SMTP incluso, OAuth do Google Drive, `TRUSTED_PROXIES`).
5. Primeiro `APP_KEY`: gerar localmente (`php artisan key:generate --show`)
   ou uma vez via SSH na primeira release, e copiar para `~/shared/.env`.

Não há zero-downtime "de graça" — o swap de symlink é quase instantâneo, mas
requests em voo durante `migrate`/`composer install` podem ver um estado
transitório. Aceitável para o perfil de tráfego atual (uso administrativo
interno, não SaaS público de alto tráfego).

## 3. Provisionar o primeiro Administrador

Não existe seed de admin em produção por padrão (`DevUserSeeder` só roda em
`local`/`testing`). Depois do primeiro deploy, via SSH dentro de `~/current/`:

```bash
php artisan admin:create \
  --name="Nome Completo" \
  --email="admin@estudioela.com"
  # --password é opcional; se omitido, o comando pergunta de forma oculta
```

Comando idempotente — pode ser rodado de novo com o mesmo e-mail para
resetar a senha de um admin existente.

## 4. Smoke test pós-deploy

Rodar sempre, em qualquer deploy (primeiro ou subsequente), antes de
considerar o release concluído:

1. `curl -f https://SEU_DOMINIO/up` → 200 (health check nativo do Laravel).
2. `curl -f https://SEU_DOMINIO/api/health` → `{"status":"ok",...}`.
3. Certificado HTTPS válido (sem aviso de certificado no navegador).
4. Via SSH, dentro de `~/current/`: `php artisan migrate:status` mostra
   todas as migrations como `Ran`, nenhuma pendente.
5. Login funcional na SPA com um usuário `ADMIN` real (ver §3).
6. Uma rota autenticada de leitura responde (ex.: `GET /api/parceiras`) sem
   500 — confirma que sessão/cookie/CORS/Sanctum estão coerentes entre
   `APP_URL`/`FRONTEND_URL`/`SANCTUM_STATEFUL_DOMAINS`.
7. `/pulse` acessível só para usuário com papel `ADMIN` (403/redirect para
   qualquer outro papel ou anônimo) — ver `docs/MONITORING.md`.
8. Resposta de qualquer endpoint carrega o header `X-Request-Id` (confirma
   que o middleware `RequestId` subiu com o release).
9. Se o release tocou upload de Material: um envio real de arquivo dentro
   dos tipos permitidos retorna sucesso, ou 503 esperado se
   `GOOGLE_DRIVE_*` ainda não estiver configurado no ambiente — nunca 500.

## 5. Critérios para declarar produção saudável

Só declarar o deploy concluído (não só "no ar") quando **todos** os itens
abaixo forem verdadeiros:

- Smoke test da §4 passou sem nenhum item falho.
- Logs do host (`storage/logs/laravel.log` dentro de `~/current/`) sem
  exceção não tratada recorrente nos primeiros minutos de tráfego real.
- `/pulse` (aba Exceptions/Slow requests) sem taxa de erro anômala.
- Backup de banco válido e recente existe **antes** de considerar o ambiente
  em produção operando (rodar `./scripts/backup-db.sh` uma vez manualmente
  se o cron ainda não tiver executado, ver §8).
- Crontab do host lista as linhas de `schedule:run` e
  `queue:work --stop-when-empty` (ver `IMPLEMENTACAO_TECNICA.md` §7).

Se qualquer item falhar, tratar como deploy não concluído — seguir §7
(Rollback) em vez de deixar o ambiente em estado parcialmente saudável.

## 6. Deploys subsequentes

Automático: um push na branch de produção dispara o workflow de deploy
(§2). Verificação pós-deploy é sempre a §4/§5, mesmo em releases pequenos.

## 7. Rollback

Sem migration destrutiva conhecida no histórico atual (todas têm `down()`
implementado, ver `docs/release/TEAR_V2.5_GO_LIVE_CHECKLIST.md` §Banco).
Para reverter um deploy problemático, via SSH:

```bash
ln -sfn ~/releases/<release-anterior-boa>/ ~/current
# só se a migration do release com problema precisar ser desfeita:
cd ~/current && php artisan migrate:rollback --step=1
```

Sempre rodar `./scripts/backup-db.sh` **antes** de qualquer rollback que
envolva `migrate:rollback` — reverter migration não restaura dado apagado
por ela. O sistema legado GAS continua no ar durante toda a operação — é o
fallback natural se o novo domínio precisar sair de produção temporariamente.

## 8. Backup

```bash
./scripts/backup-db.sh   # pg_dump direto contra o banco gerenciado da Locaweb
php artisan backup:upload-to-drive --latest   # sobe o dump à pasta BACKUP do Google Drive
./scripts/restore-db.sh <arquivo.sql.gz>   # destrutivo, pede confirmação
```

Agendar via crontab do host (retenção sugerida: 14 diários + 8 semanais):

```cron
0 3 * * * cd ~/current && ./scripts/backup-db.sh \
  && php artisan backup:upload-to-drive --latest \
  && find ./backups -name '*.sql.gz' -mtime +14 -delete
```

## 9. O que este runbook não cobre (decisão externa, fora de escopo de código)

- Escolha de domínio definitivo (subdomínio de `estudioela.com` já decidido
  em arquitetura; string exata a confirmar na execução).
- Provisionamento real do banco gerenciado, da conta dedicada OAuth do
  Google Drive (`ADR-017`) e dos secrets do GitHub Actions — passos
  manuais no painel Locaweb/Google Cloud/GitHub, detalhados em
  `docs/deployment/PLANO_DE_IMPLANTACAO.md`
  (Etapas 2-5 e 9).
- Limites de CPU/memória/processo da hospedagem compartilhada — só se
  confirmam na execução real (ver `ARQUITETURA_PRODUCAO.md` §14); se
  `composer install --no-dev` não couber no limite do plano, alternativa é
  rodar `composer install` no CI e subir `vendor/` já pronto via `rsync`.
- Escala horizontal (múltiplas réplicas do `app`) — fora de escopo enquanto
  o projeto operar sob uma hospedagem compartilhada única.
