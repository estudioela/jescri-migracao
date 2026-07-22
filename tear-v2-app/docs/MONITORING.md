# Observabilidade e Monitoramento — TEAR V2 (`tear-v2-app`)

## 1. O que existe hoje

### Health checks
- `GET /up` — nativo do Laravel 11+, liveness básico (processo responde).
- `GET /api/health` — customizado, retorna `{"status":"ok","app":"..."}`.
- `scripts/healthcheck.sh` — checa os dois de fora dos containers,
  pensado para cron do host ou um monitor de terceiros (UptimeRobot,
  Better Uptime, etc.), com alerta opcional via Slack webhook.
- `docker-compose.yml` — todo serviço HTTP (`app`, `nginx`, `frontend`,
  `db`) tem `healthcheck` próprio; `docker compose ps` mostra o estado.

### Laravel Pulse (`/pulse`)
Dashboard de performance em tempo real, restrito ao papel `ADMIN` (usa o
mesmo `Gate::before` que já libera ADMIN para tudo,
`app/Providers/AppServiceProvider.php` — nenhuma configuração extra
necessária). Recorders ativos por padrão (`config/pulse.php`):
- **Exceptions** — toda exceção não tratada, com contagem e stack trace.
- **Slow requests** / **Slow queries** / **Slow jobs** / **Slow outgoing
  requests** — indicam quando o `GoogleDriveService`/`CepLookupService`
  (as duas únicas chamadas HTTP de saída hoje) degradam.
- **Queues** — profundidade e throughput da fila `database`.
- **Cache interactions** — hit/miss.
- **User requests / User jobs** — top usuários por volume, útil pra
  detectar abuso de uma conta específica.

Driver de ingestão: `storage` (síncrono, grava direto nas tabelas
`pulse_*` a cada request — sem worker adicional necessário). Se o volume
de tráfego crescer a ponto de a escrita síncrona pesar na latência,
trocar para `PULSE_INGEST_DRIVER=redis` (requer Redis, não incluído no
`docker-compose.yml` atual — ver nota abaixo).

### Logs
- `LOG_STACK=daily` em produção (`.env.production.example`) — um arquivo
  por dia em `storage/logs/`, retenção padrão do Laravel (14 dias,
  `LOG_DAILY_DAYS` se precisar mudar).
- **Correlação por request**: todo response carrega o header
  `X-Request-Id` (`app/Http/Middleware/RequestId.php`) e toda linha de
  log da mesma requisição tem `request_id` no contexto — buscar por esse
  valor nos logs (ou pedir pro usuário reportar o header, se o front
  expuser em alguma tela de erro) localiza exatamente uma requisição.
- Nenhum dado sensível (senha, token, PIX, CPF/CNPJ) é logado hoje
  (auditado — único `Log::` real é em `CepLookupService`, só CEP e
  mensagem de erro).

### Segurança de dependências
- CI (`tear-v2-ci.yml`) roda `composer audit` e
  `npm audit --omit=dev --audit-level=high` a cada push/PR — falha o
  build se uma dependência de **produção** tiver vulnerabilidade alta ou
  crítica. (`--omit=dev` exclui `concurrently`, devDependency usada só em
  `npm run dev:all` local — vulnerabilidade conhecida nela, GHSA-395f-4hp3-45gv
  via `shell-quote`, sem exposição em produção porque o pacote não entra
  no build; ver `docs/release/TEAR_V2.5_GO_LIVE_CHECKLIST.md`.)
- `.github/dependabot.yml` — atualização semanal automatizada de
  composer, npm, imagens Docker e GitHub Actions.

## 2. O que falta (documentado, decisão externa)

- **Erro de frontend** (JS não capturado, promise rejeitada) não tem
  monitoramento — Pulse é só backend. Sentry (`@sentry/react` +
  `sentry/sentry-laravel`) é a recomendação natural, mas exige criar
  conta/projeto no Sentry (credencial que este agente não possui) —
  P1/P2, ver checklist.
- **Alertas automáticos** de exceção/queue travada: Pulse mostra no
  dashboard, mas não envia notificação proativa por padrão. Laravel tem
  `pulse:check` + canais de notificação configuráveis para isso, mas
  configurar (Slack, e-mail) exige decidir o canal — não implementado.
- **Redis** não está no `docker-compose.yml` atual (cache/queue/sessão
  usam o driver `database`, suficiente para o volume atual). Se
  necessário no futuro, adicionar serviço `redis` e trocar
  `CACHE_STORE`/`QUEUE_CONNECTION`/`PULSE_INGEST_DRIVER` para `redis`.

## 3. Automações já entregues

| Script | Propósito | Como agendar |
|---|---|---|
| `scripts/backup-db.sh` | Backup do Postgres (`pg_dump` via docker-compose) | cron do host, diário (ver `docs/DEPLOY.md` §8) |
| `scripts/restore-db.sh` | Restaura um backup (destrutivo, pede confirmação) | manual |
| `scripts/healthcheck.sh` | Uptime check com alerta opcional no Slack | cron do host, a cada 5 min, ou apontar um monitor externo (UptimeRobot etc.) direto pros endpoints |

## 4. Rotina sugerida de operação

- **Diário**: `scripts/backup-db.sh` via cron (já documentado).
- **A cada 5 min**: `scripts/healthcheck.sh` ou monitor externo nos dois
  endpoints de health.
- **Semanal**: revisar PRs do Dependabot; olhar `/pulse` (exceções e
  slow queries acumuladas na semana).
- **A cada release**: conferir `docker compose ps` (todos `healthy`) e
  `X-Request-Id` presente numa resposta de teste, como smoke test de que
  o middleware novo não regrediu.
