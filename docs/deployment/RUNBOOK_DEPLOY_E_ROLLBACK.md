# Runbook — Deploy e Rollback do TEAR V2.5

## Quando usar

Use este runbook para o primeiro deploy, releases subsequentes e reversão de
uma release do `tear-v2-app` na Locaweb. Ele não substitui o gate de
autorização em `docs/release/GATE_FINAL_GO_LIVE.md`.

## Premissas

- Produção usa PostgreSQL gerenciado e uma origem única:
  `https://influencia.estudioela.com`.
- O build React está em `backend/public/build`.
- Cada release deve estar em `releases/<release-id>` e `current` deve apontar
  para a release ativa.
- `.env` e `storage` são compartilhados e nunca pertencem ao repositório.
- O host não possui Docker. Não usar comandos `docker compose` em produção.

## Pré-requisitos de acesso

- Acesso ao painel Locaweb, DNS e SSL.
- SSH temporariamente habilitado no painel.
- Acesso ao PostgreSQL e a um banco isolado de restauração.
- Acesso aos segredos de produção em gestor de senhas.
- Acesso à conta Google Drive e ao SMTP.

## Pré-deploy

1. Confirmar CI verde para o commit que será publicado.
2. Registrar `release-id`, commit e responsável pela execução.
3. Verificar que não há migration destrutiva ou incompatível com rollback.
4. Executar backup válido antes da janela de deploy.
5. Confirmar que a release anterior continua presente e identificável.
6. Confirmar que os seguintes valores existem no `.env` compartilhado:

   ```env
   APP_ENV=production
   APP_DEBUG=false
   DB_CONNECTION=pgsql
   SESSION_DRIVER=database
   SESSION_SECURE_COOKIE=true
   APP_URL=https://influencia.estudioela.com
   FRONTEND_URL=https://influencia.estudioela.com
   SANCTUM_STATEFUL_DOMAINS=influencia.estudioela.com
   ```

7. Garantir que o `.env` tem permissão restrita (`chmod 600`) e não contém
   placeholders.

## Deploy

> Não iniciar esta seção enquanto o mecanismo de publicação compatível com o
> SSH da Locaweb não tiver sido ensaiado. O workflow que requer chave SSH não
> deve ser tratado como procedimento comprovado para o host auditado.

1. Gerar dependências PHP no runner de CI:

   ```bash
   composer install --no-dev --optimize-autoloader --no-interaction
   ```

2. Gerar o frontend para a origem única:

   ```bash
   cd frontend
   npm ci
   npm run build:locaweb
   ```

3. Publicar o conteúdo de `backend/`, incluindo `vendor/` e
   `public/build`, em uma nova release sem sobrescrever `shared/.env` nem
   `shared/storage`.
4. No diretório da nova release, criar links para `.env` e `storage`
   compartilhados.
5. Validar `vendor/autoload.php` e `public/build/index.html` antes de ativar.
6. Executar, na nova release:

   ```bash
   php artisan migrate --force
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   ```

7. Trocar o symlink `current` para a nova release.
8. Se houver fila pendente, deixar a execução corrente terminar e disparar o
   worker de cron na nova release. Não há worker persistente nesse ambiente.

## Smoke tests pós-deploy

Executar imediatamente:

```bash
curl -fsS https://influencia.estudioela.com/up
curl -fsS https://influencia.estudioela.com/api/health
```

Depois validar pelo navegador:

1. página pública abre por HTTPS sem conteúdo misto;
2. login e reload preservam a sessão;
3. logout encerra a sessão;
4. usuário ADMIN acessa `/pulse`;
5. convite e reset de senha entregam e-mail;
6. upload de material e comprovante alcançam o Google Drive;
7. fluxo de aprovação e pagamento retorna respostas esperadas;
8. response contém `X-Request-Id`;
9. não há exceções novas em logs/Pulse.

## Rollback da aplicação

Use quando um gatilho do gate for atingido.

1. Colocar novas operações em pausa, se necessário.
2. Identificar a release estável anterior.
3. Reapontar `current` para essa release.
4. Limpar e recriar caches na release reativada:

   ```bash
   php artisan optimize:clear
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   ```

5. Reexecutar os smoke tests.
6. Preservar logs, request IDs e a release defeituosa para investigação.

## Rollback de banco

Não restaurar banco de produção por impulso. Primeiro, avaliar se uma
migration reversível ou correção forward é suficiente. Se a restauração for
necessária:

1. interromper escrita e registrar a janela de incidente;
2. confirmar o backup e restaurá-lo primeiro em banco isolado;
3. validar contagens, usuários, participações, pagamentos e relações;
4. restaurar com cliente PostgreSQL (`psql`), nunca com Docker;
5. validar a aplicação e os smoke tests antes de liberar escrita.

O procedimento exato de restore só é válido após ser ensaiado no ambiente
Locaweb com as credenciais e ferramentas reais.
