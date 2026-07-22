# Deploy — TEAR V2 (`tear-v2-app`)

Runbook operacional. Ver `docs/release/TEAR_V2.5_GO_LIVE_CHECKLIST.md` (raiz do
repositório) para o checklist de prontidão e a lista de pendências P0/P1/P2.

## 1. Pré-requisitos

- Docker + Docker Compose no host de destino.
- Domínio com HTTPS (certificado via reverse proxy do provedor de
  hosting ou Let's Encrypt — não incluído neste repositório, é decisão de
  infraestrutura do responsável do projeto).
- Credenciais reais: Postgres (`DB_PASSWORD`), Google Drive service
  account (`GOOGLE_DRIVE_*`) se o upload de Material for usar Drive em vez
  do fallback local.

## 2. Primeiro deploy (homologação ou produção)

```bash
cd tear-v2-app
cp backend/.env.production.example backend/.env
# Editar backend/.env: preencher todo campo marcado CHANGE_ME

# Gerar APP_KEY antes da primeira subida (o build ainda não existe na
# primeira vez, então roda-se via imagem base do Composer/PHP):
docker compose run --rm app php artisan key:generate --show
# copiar o valor impresso para APP_KEY= no backend/.env

docker compose up -d --build
```

O container `app` roda `migrate --force` automaticamente no boot
(`backend/docker/entrypoint.sh`) antes de subir o PHP-FPM. Não é
necessário rodar migration manualmente no primeiro deploy.

## 3. Provisionar o primeiro Administrador

Não existe seed de admin em produção por padrão (`DevUserSeeder` só roda
em `local`/`testing` — decisão deliberada, ver código). Depois do
primeiro deploy:

```bash
docker compose exec app php artisan admin:create \
  --name="Nome Completo" \
  --email="admin@dominio.com" \
  # --password é opcional; se omitido, o comando pergunta de forma oculta
```

Comando idempotente — pode ser rodado de novo com o mesmo e-mail para
resetar a senha de um admin existente.

## 4. Smoke test pós-deploy

Rodar sempre, em qualquer deploy (primeiro ou subsequente), antes de
considerar o release concluído:

1. `docker compose ps` → todos os serviços `healthy` (`app`, `nginx`,
   `frontend`, `db`); `queue` sem healthcheck dedicado, mas deve aparecer
   `Up`, não reiniciando em loop (`docker compose logs queue` se suspeitar
   de crash loop).
2. `curl -f http://SEU_DOMINIO/up` → 200 (health check nativo do Laravel).
3. `curl -f http://SEU_DOMINIO/api/health` → `{"status":"ok",...}`.
4. Login funcional na SPA (`FRONTEND_URL`/porta do serviço `frontend`) com
   um usuário `ADMIN` real (ver `php artisan admin:create`, §3).
5. Uma rota autenticada de leitura responde (ex.: `GET /api/parceiras`)
   sem 500 — confirma que a sessão/cookie/CORS/Sanctum estão coerentes
   entre `APP_URL`/`FRONTEND_URL`/`SANCTUM_STATEFUL_DOMAINS`.
6. `/pulse` acessível só para usuário com papel `ADMIN` (403/redirect para
   qualquer outro papel ou anônimo) — ver `docs/MONITORING.md`.
7. Resposta de qualquer endpoint carrega o header `X-Request-Id`
   (confirma que o middleware `RequestId` subiu com o release).
8. Se o release tocou upload de Material: um envio real de arquivo dentro
   dos tipos permitidos retorna sucesso (ou 503 esperado, se
   `GOOGLE_DRIVE_*` ainda não estiver configurado no ambiente — nunca
   500).

## 5. Critérios para declarar produção saudável

Só declarar o deploy concluído (não só "no ar") quando **todos** os itens
abaixo forem verdadeiros:

- Smoke test da §4 passou sem nenhum item falho.
- `docker compose logs app --since 10m` sem exceção não tratada
  recorrente (uma exceção isolada de um teste manual do smoke test não
  conta; um padrão repetido, sim).
- `/pulse` (aba Exceptions/Slow requests) sem taxa de erro anômala nos
  primeiros minutos de tráfego real — comparar contra o baseline do
  ambiente anterior, se houver.
- Nenhum container em `Restarting` (`docker compose ps`) 5 minutos após o
  `up -d`.
- Backup de banco válido e recente existe **antes** de considerar o
  ambiente em produção operando (rodar `./scripts/backup-db.sh` uma vez
  manualmente se o cron ainda não tiver executado, ver §8).
- Se o deploy incluiu migration nova: `php artisan migrate:status` dentro
  do container `app` mostra todas como `Ran`, nenhuma pendente.

Se qualquer item falhar, tratar como deploy não concluído — seguir §7
(Rollback) em vez de deixar o ambiente em estado parcialmente saudável.

## 6. Deploys subsequentes

```bash
git pull
docker compose up -d --build
```

Isto reconstrói as imagens (`app`, `queue`, `frontend`) com o código
novo, roda `migrate --force` de novo no boot (idempotente — migrations já
aplicadas são puladas) e reinicia os containers. `nginx` e `db` não
precisam rebuild a menos que `docker/nginx.conf` ou a versão do Postgres
mudem.

**Conteúdo de `public/` do backend** (ver comentário em
`docker-compose.yml`, volume `app_public`): se um deploy futuro mudar
algo dentro de `backend/public/` (raro — é só `index.php`, `favicon.ico`,
`robots.txt` e o symlink de storage), o volume nomeado já existente não
vai reabsorver o novo conteúdo sozinho. Nesse caso específico:

```bash
docker compose down
docker volume rm tear-v2-app_app_public
docker compose up -d --build
```

## 7. Rollback

Sem migration destrutiva conhecida no histórico atual (auditoria de
`database/migrations`, ver `docs/release/TEAR_V2.5_GO_LIVE_CHECKLIST.md` §Banco) — toda
migration tem `down()` implementado. Para reverter um deploy problemático:

```bash
git checkout <commit-anterior-conhecido-bom>
docker compose up -d --build
# só se a migration do release com problema precisar ser desfeita:
docker compose exec app php artisan migrate:rollback --step=1
```

Sempre rodar `./scripts/backup-db.sh` **antes** de qualquer rollback que
envolva `migrate:rollback` — reverter migration não restaura dado
apagado por ela.

## 8. Backup

```bash
./scripts/backup-db.sh                # ./backups/tear_AAAAMMDD_HHMMSS.sql.gz
./scripts/restore-db.sh <arquivo.sql.gz>   # destrutivo, pede confirmação
```

Agendar `backup-db.sh` via cron do **host** (fora dos containers — não há
scheduler configurado na aplicação, ver `docs/MONITORING.md` §Automações).
Exemplo de crontab (diário às 3h, retendo os últimos 14 arquivos):

```cron
0 3 * * * cd /caminho/para/tear-v2-app && ./scripts/backup-db.sh && find ./backups -name '*.sql.gz' -mtime +14 -delete
```

## 9. O que este runbook não cobre (decisão externa, fora de escopo de código)

- Escolha de provedor de hosting/domínio.
- Certificado HTTPS / reverse proxy externo ao `docker-compose.yml` (o
  `nginx` do compose escuta em HTTP puro na porta interna 8080 — TLS deve
  terminar num proxy na frente, ex.: Caddy/Traefik/load balancer do
  provedor).
- Escala horizontal (múltiplas réplicas do `app`) — o volume `storage`
  local não é compartilhado entre hosts; migrar para Google Drive real
  (`GOOGLE_DRIVE_*`) ou S3-compatível antes de escalar horizontalmente
  (mesma recomendação de `docs/planning/TEAR_V2.5_PRODUCTIZACAO_ROADMAP.md` §5).
