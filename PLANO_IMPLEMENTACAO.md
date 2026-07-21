# PLANO_IMPLEMENTACAO.md — TEAR V2.5

**Fonte única desta implementação:** `ARQUITETURA_PRODUCAO.md`. Este
documento não reavalia nenhuma escolha registrada lá — apenas a transforma
em etapas executáveis, em ordem.

**Natureza deste documento:** é um runbook para execução futura. Nenhum
comando aqui foi rodado, nenhum recurso foi provisionado, nenhum código foi
alterado nesta sessão.

**Escopo:** `tear-v2-app/`. O sistema legado GAS (`src/`) continua em
produção sem alteração durante toda a execução deste plano — é o
*fallback* natural de qualquer etapa que falhar (ver "Rollback" de cada
etapa).

---

## Visão geral da sequência

| # | Etapa | Depende de |
|---|---|---|
| 0 | Contas e credenciais | — |
| 1 | Provisionar o Droplet | 0 |
| 2 | Instalar o Coolify | 1 |
| 3 | Configurar DNS do subdomínio | 1 |
| 4 | Provisionar Google Shared Drive + Service Account | 0 |
| 5 | Provisionar Resend | 0, 3 (DNS do domínio de envio) |
| 6 | Configurar a aplicação no Coolify | 2, 4, 5 |
| 7 | Primeiro deploy | 3, 6 |
| 8 | Provisionar o primeiro Administrador | 7 |
| 9 | Configurar backup (pg_dump + R2 + dead-man's-switch) | 7 |
| 10 | Configurar monitoramento | 7 |
| 11 | Ligar o CI/CD ao deploy (webhook Coolify) | 6 |
| 12 | Smoke test e critérios de produção saudável | 7, 8, 9, 10 |
| 13 | Corte para produção (go-live) | 12 |

---

## Etapa 0 — Contas e credenciais

**Objetivo:** ter todo acesso administrativo necessário antes de tocar em
qualquer infraestrutura, para não interromper etapas seguintes esperando
aprovação de conta.

**Pré-requisitos:** acesso de responsável/administrador da organização
Estúdio Elã (Google Workspace, domínio `estudioela.com`, cartão para
contas de billing).

**Comandos:** nenhum (criação de conta é via painel web de cada provedor).

**Contas a criar/confirmar acesso:**
- DigitalOcean (billing configurado, região São Paulo disponível no plano).
- Google Cloud Console vinculado ao Workspace de `estudioela.com` (para a Service Account da Etapa 4).
- Resend.
- Cloudflare (para o bucket R2 de backup).
- Healthchecks.io.
- UptimeRobot.
- Sentry.
- Par de chaves SSH dedicado a este Droplet (`ssh-keygen -t ed25519 -C "tear-v2-prod"`), sem passphrase vazia.

**Arquivos envolvidos:** nenhum.

**Critérios de sucesso:** login bem-sucedido em cada painel listado; chave
SSH gerada e sua pública (`.pub`) disponível para a Etapa 1.

**Rollback:** nenhum — nenhuma infraestrutura foi tocada nesta etapa.

---

## Etapa 1 — Provisionar o Droplet

**Objetivo:** ter o host de produção no ar (DigitalOcean, São Paulo,
2vCPU/4GB, conforme §1 e §13 de `ARQUITETURA_PRODUCAO.md`), com acesso SSH
restrito a chave (sem senha).

**Pré-requisitos:** Etapa 0 concluída (conta DO com billing, chave SSH
pública disponível).

**Comandos:**
```bash
# criação (via doctl, ou equivalente no painel DO)
doctl compute droplet create tear-v2-prod \
  --region sao1 \
  --size s-2vcpu-4gb \
  --image ubuntu-24-04-x64 \
  --ssh-keys <fingerprint-da-chave-ssh>

# hardening básico, via SSH como root na primeira conexão
ssh root@<IP_DO_DROPLET>
adduser deploy
usermod -aG sudo deploy
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 8000/tcp   # painel do Coolify (Etapa 2) — restringir depois por IP se possível
ufw enable
```

**Arquivos envolvidos:** nenhum do repositório (infra pura).

**Critérios de sucesso:**
- `ssh deploy@<IP_DO_DROPLET>` funciona sem senha.
- `ssh root@<IP_DO_DROPLET>` com senha **não** funciona (login root por senha desabilitado).
- `ufw status` mostra só as portas listadas acima liberadas.

**Rollback:** destruir o Droplet (`doctl compute droplet delete tear-v2-prod`
ou painel DO). Nenhum dado de produção existe ainda neste ponto — custo
zero de reverter.

---

## Etapa 2 — Instalar o Coolify

**Objetivo:** ter a camada de orquestração de deploy (§3 e §10 de
`ARQUITETURA_PRODUCAO.md`) rodando no mesmo Droplet, pronta para gerenciar
o `docker-compose.yml` já existente no repositório.

**Pré-requisitos:** Etapa 1 concluída (Droplet acessível via SSH, Docker
ainda não precisa estar pré-instalado — o instalador do Coolify cuida
disso).

**Comandos:**
```bash
ssh deploy@<IP_DO_DROPLET>
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | sudo bash
# ao final, o instalador imprime a URL do painel:
# http://<IP_DO_DROPLET>:8000
```
Acessar essa URL no navegador para concluir o cadastro do usuário
administrador do Coolify (primeiro acesso).

**Arquivos envolvidos:** nenhum do repositório.

**Critérios de sucesso:**
- Painel do Coolify acessível em `http://<IP_DO_DROPLET>:8000` e login
  concluído.
- `docker ps` no Droplet mostra os containers internos do Coolify
  (`coolify`, `coolify-db`, `coolify-redis`, `coolify-proxy`) saudáveis.

**Rollback:**
```bash
curl -fsSL https://cdn.coollabs.io/coolify/uninstall.sh | sudo bash
```
Se o desinstalador falhar ou deixar resíduo, destruir e recriar o Droplet
(Etapa 1) é aceitável — nada de produção depende dele ainda.

---

## Etapa 3 — Configurar DNS do subdomínio

**Objetivo:** apontar `tear.estudioela.com` (ou o subdomínio definitivo
escolhido, conforme §8 de `ARQUITETURA_PRODUCAO.md`) para o Droplet, **sem
alterar os nameservers de todo `estudioela.com`** — só um registro `A`
isolado, para não arriscar e-mail/site institucional que já rodam nesse
domínio.

**Pré-requisitos:** Etapa 1 concluída (IP do Droplet conhecido); acesso ao
painel de DNS onde `estudioela.com` está hospedado hoje.

**Comandos (verificação, após criar o registro no painel de DNS):**
```bash
dig +short tear.estudioela.com
# deve retornar o IP do Droplet da Etapa 1
```

**Arquivos envolvidos:** nenhum do repositório.

**Registro a criar no provedor de DNS atual:**
| Tipo | Nome | Valor | TTL |
|---|---|---|---|
| A | `tear` | `<IP_DO_DROPLET>` | 300-3600 |

**Critérios de sucesso:** `dig +short tear.estudioela.com` resolve para o
IP correto a partir de pelo menos duas redes diferentes (propagação de DNS
concluída).

**Rollback:** remover o registro `A` criado. Como nenhuma delegação de
zona foi feita, o restante de `estudioela.com` (e-mail, site) nunca foi
tocado — reversão é de baixíssimo risco.

---

## Etapa 4 — Provisionar Google Shared Drive + Service Account

**Objetivo:** credenciais de Drive institucionais (não atreladas a uma
pessoa), conforme §5 de `ARQUITETURA_PRODUCAO.md`, para preencher
`GOOGLE_DRIVE_CLIENT_EMAIL` / `GOOGLE_DRIVE_PRIVATE_KEY` /
`GOOGLE_DRIVE_ROOT_FOLDER_ID`.

**Pré-requisitos:** acesso de administrador ao Google Workspace de
`estudioela.com` e a um projeto no Google Cloud Console vinculado a esse
Workspace.

**Comandos:** nenhum (fluxo é via console web).

**Passos:**
1. No Google Drive (conta institucional), criar um **Shared Drive**
   dedicado (ex.: "TEAR — Materiais de Campanha").
2. No Google Cloud Console, no projeto associado ao Workspace: criar uma
   **Service Account** dedicada (ex.: `tear-drive-uploader`).
3. Gerar uma chave JSON para essa Service Account (Console → IAM → Service
   Accounts → Keys → Add Key → JSON).
4. No Shared Drive criado no passo 1, adicionar o e-mail da Service
   Account como membro com papel **Content Manager** (equivalente a
   Editor, sem privilégio de exclusão de drive inteiro).
5. Extrair do JSON: `client_email` → `GOOGLE_DRIVE_CLIENT_EMAIL`;
   `private_key` → `GOOGLE_DRIVE_PRIVATE_KEY`.
6. Obter o ID do Shared Drive (visível na URL ao abrir o drive) →
   `GOOGLE_DRIVE_ROOT_FOLDER_ID`.

**Arquivos envolvidos:** nenhum do repositório (os três valores só serão
usados como variáveis de ambiente na Etapa 6, nunca commitados).

**Critérios de sucesso:** a Service Account aparece como membro do Shared
Drive com permissão de escrita; os três valores extraídos estão guardados
em local seguro (gerenciador de senhas) para uso na Etapa 6.

**Rollback:** revogar/excluir a chave JSON no Console GCP e remover a
Service Account do Shared Drive. Nenhum dado de produção é afetado — este
setup é paralelo e isolado.

---

## Etapa 5 — Provisionar Resend

**Objetivo:** SMTP transacional real (§6 de `ARQUITETURA_PRODUCAO.md`),
substituindo `MAIL_MAILER=log`.

**Pré-requisitos:** Etapa 3 concluída ou em andamento (o domínio de envio
de e-mail deve estar decidido — recomendado usar um subdomínio próprio,
ex. `mail.estudioela.com`, para isolar reputação de envio transacional do
domínio principal de e-mail humano da empresa).

**Comandos:** nenhum (fluxo é via painel Resend + registros DNS).

**Passos:**
1. Criar conta Resend, adicionar o domínio de envio.
2. Adicionar os registros DNS que o Resend exibir (SPF, DKIM, e
   opcionalmente DMARC) no mesmo provedor de DNS da Etapa 3 — só o
   subdomínio de envio, mesma lógica de isolamento de risco.
3. Gerar uma API key dedicada ao ambiente de produção.

**Arquivos envolvidos:** nenhum do repositório (a API key só será usada na
Etapa 6).

**Critérios de sucesso:** domínio marcado como "Verified" no painel
Resend; um e-mail de teste enviado via painel Resend chega numa caixa
real.

**Rollback:** remover os registros DNS adicionados; domínio principal de
e-mail da empresa não é afetado (registros são aditivos, específicos do
subdomínio de envio).

---

## Etapa 6 — Configurar a aplicação no Coolify

**Objetivo:** registrar `tear-v2-app` como uma Application dentro do
Coolify, usando os Dockerfiles/`docker-compose.yml` já existentes no
repositório, com todas as variáveis de produção preenchidas.

**Pré-requisitos:** Etapas 2, 4 e 5 concluídas (Coolify no ar; credenciais
de Drive e Resend em mãos).

**Comandos:** nenhum direto (configuração via painel do Coolify); comando
de referência para gerar `APP_KEY` antes de preencher o formulário:
```bash
docker run --rm -v $(pwd)/backend:/app -w /app php:8.3-cli \
  php artisan key:generate --show
```

**Arquivos envolvidos:**
- `tear-v2-app/backend/Dockerfile`
- `tear-v2-app/frontend/Dockerfile`
- `tear-v2-app/docker-compose.yml`
- `tear-v2-app/backend/docker/entrypoint.sh`
- `tear-v2-app/backend/docker/nginx.conf`
- `tear-v2-app/backend/.env.production.example` (modelo — cada `CHANGE_ME`
  vira uma variável de ambiente cadastrada no Coolify, não um arquivo
  `.env` commitado)

**Passos:**
1. No Coolify: New Resource → conectar ao repositório Git (branch de
   produção definida pelo responsável do projeto).
2. Apontar para `tear-v2-app/docker-compose.yml` como fonte de build.
3. Cadastrar todas as variáveis de `.env.production.example` no painel do
   Coolify, substituindo cada `CHANGE_ME` pelo valor real:
   `APP_KEY` (gerado acima), `APP_URL=https://tear.estudioela.com`,
   `DB_PASSWORD` (gerar senha forte nova), `SESSION_DOMAIN=.estudioela.com`,
   `FRONTEND_URL`, `SANCTUM_STATEFUL_DOMAINS=tear.estudioela.com`,
   `MAIL_HOST/USERNAME/PASSWORD/FROM_ADDRESS` (Resend, Etapa 5),
   `GOOGLE_DRIVE_CLIENT_EMAIL/PRIVATE_KEY/ROOT_FOLDER_ID` (Etapa 4).
4. Configurar o domínio da aplicação no Coolify como
   `tear.estudioela.com`, com emissão automática de certificado Let's
   Encrypt habilitada (Traefik).
5. Configurar os healthchecks do Coolify apontando para `/up` e
   `/api/health` (usados também na Etapa 12).
6. **Não disparar deploy ainda** — só salvar a configuração (deploy é a
   Etapa 7, isolada para poder validar cada coisa separadamente).

**Critérios de sucesso:** a Application aparece no Coolify com todas as
variáveis preenchidas (nenhum `CHANGE_ME` restante), domínio e healthcheck
configurados, sem erro de validação no painel.

**Rollback:** excluir a Application no Coolify e recomeçar a configuração;
nenhum container de produção chegou a subir com tráfego real nesta etapa.

---

## Etapa 7 — Primeiro deploy

**Objetivo:** subir a stack completa (`app`, `frontend`, `db`, `queue`)
pela primeira vez neste ambiente, com migrations rodando automaticamente
(`entrypoint.sh`, já implementado).

**Pré-requisitos:** Etapas 3 e 6 concluídas (DNS resolvendo, Application
configurada no Coolify).

**Comandos:** disparo do deploy é feito pelo botão "Deploy" no painel do
Coolify. Verificação pós-deploy:
```bash
curl -f https://tear.estudioela.com/up
curl -f https://tear.estudioela.com/api/health
```

**Arquivos envolvidos:** os mesmos da Etapa 6 (nenhum arquivo novo — este
é o primeiro build/run real deles).

**Critérios de sucesso:**
- Todos os serviços aparecem `healthy` no painel do Coolify (`app`,
  `nginx`/proxy, `frontend`, `db`).
- `curl -f .../up` retorna 200.
- `curl -f .../api/health` retorna `{"status":"ok",...}`.
- Certificado HTTPS válido emitido (sem aviso de certificado no navegador).
- `docker compose exec app php artisan migrate:status` (via terminal do
  Coolify) mostra todas as migrations como `Ran`.

**Rollback:** parar/reverter a Application pelo painel do Coolify (Stop ou
Rollback para o deploy anterior, que neste caso é "nenhum" — equivale a
parar os containers). O sistema legado GAS continua sendo a única
produção real neste ponto — nenhum usuário foi direcionado para o novo
domínio ainda (isso só acontece na Etapa 13), então uma falha aqui não
afeta ninguém.

---

## Etapa 8 — Provisionar o primeiro Administrador

**Objetivo:** ter um usuário `ADMIN` real para operar o sistema (não há
seed de admin em produção por design).

**Pré-requisitos:** Etapa 7 concluída (containers saudáveis).

**Comandos (via terminal do Coolify ou SSH + docker exec):**
```bash
docker compose exec app php artisan admin:create \
  --name="Nome Completo" \
  --email="admin@estudioela.com"
# senha solicitada de forma oculta se --password não for passado
```

**Arquivos envolvidos:** nenhum (comando já implementado —
`app/Console/Commands/CreateAdminCommand.php`, não tocado nesta etapa).

**Critérios de sucesso:** login bem-sucedido em
`https://tear.estudioela.com` com o e-mail/senha cadastrados, papel `ADMIN`
confirmado (acesso ao `AppShell` administrativo completo).

**Rollback:** comando é idempotente — rodar de novo com o mesmo e-mail
reseta a senha. Se o registro precisar ser removido por completo, é uma
operação de banco (`tinker` ou SQL direto), segura neste ponto porque
ainda não há tráfego de usuários reais.

---

## Etapa 9 — Configurar backup (pg_dump + R2 + dead-man's-switch)

**Objetivo:** backup automatizado do Postgres, com cópia fora do Droplet
(Cloudflare R2) e alerta se o backup parar de rodar (Healthchecks.io),
conforme §7 de `ARQUITETURA_PRODUCAO.md`.

**Pré-requisitos:** Etapa 7 concluída (banco populado, mesmo que vazio);
conta Cloudflare com bucket R2 criado; conta Healthchecks.io da Etapa 0.

**Comandos:**
```bash
# 1) validar o script existente manualmente antes de agendar
cd tear-v2-app && ./scripts/backup-db.sh

# 2) configurar destino R2 (S3-compatible) via rclone
rclone config
# criar remote "r2" com endpoint e credenciais do bucket R2

# 3) testar upload manual do último dump gerado
rclone copy ./backups/tear_$(date +%Y%m%d)*.sql.gz r2:tear-backups/

# 4) criar o check no Healthchecks.io e obter a URL de ping (ex.:
#    https://hc-ping.com/<uuid>)

# 5) agendar via cron do host (ou scheduled task do Coolify, se preferir
#    manter tudo no painel):
crontab -e
0 3 * * * cd /caminho/para/tear-v2-app && ./scripts/backup-db.sh \
  && rclone copy ./backups/ r2:tear-backups/ \
  && curl -fsS https://hc-ping.com/<uuid> >/dev/null \
  && find ./backups -name '*.sql.gz' -mtime +14 -delete
```

**Arquivos envolvidos:**
- `tear-v2-app/scripts/backup-db.sh` (usado como está — se o upload para
  R2 for incorporado ao script em vez de encadeado no cron, isso é uma
  alteração de código a ser feita numa sessão de execução, não nesta de
  planejamento)
- `tear-v2-app/scripts/restore-db.sh` (validado na Etapa 12, não alterado
  aqui)

**Critérios de sucesso:**
- Um dump aparece no bucket R2 após a execução manual de teste.
- O check no Healthchecks.io mostra "last ping: agora" após o teste manual.
- `crontab -l` no host lista a linha agendada corretamente.

**Rollback:** remover a linha do `crontab`; nenhum impacto na aplicação
(backup é auxiliar, não bloqueia funcionamento). Dumps já enviados ao R2
permanecem como backup válido independente do cron estar ativo ou não.

---

## Etapa 10 — Configurar monitoramento

**Objetivo:** visibilidade externa de disponibilidade e erro, conforme §11
de `ARQUITETURA_PRODUCAO.md` (Pulse já existe no código; esta etapa cobre
as três peças externas que faltam).

**Pré-requisitos:** Etapa 7 concluída (URLs de produção respondendo);
contas UptimeRobot/Healthchecks.io/Sentry da Etapa 0.

**Comandos:** nenhum direto (configuração via painel de cada serviço).

**Passos:**
1. **UptimeRobot:** criar monitor HTTP(S) para
   `https://tear.estudioela.com/up`, intervalo 5 min, e outro para
   `.../api/health`; configurar alerta por e-mail (e Slack, se desejado).
2. **Healthchecks.io:** já criado na Etapa 9 (backup); adicionar aqui,
   opcionalmente, alerta por e-mail além do padrão.
3. **Sentry:** criar projeto Laravel (backend) e projeto React (frontend);
   obter os dois DSNs. Instalar o SDK correspondente em cada lado e
   preencher os DSNs como variável de ambiente **é alteração de código**
   — fica registrado aqui como pendência para a sessão de execução, não
   feito neste plano.

**Arquivos envolvidos:** nenhum nesta etapa (a integração do SDK do
Sentry no código é trabalho de uma sessão de implementação futura).

**Critérios de sucesso:**
- UptimeRobot mostra os dois monitores "Up" após a primeira checagem.
- Healthchecks.io mostra o check de backup "Up" (herdado da Etapa 9).
- Os dois projetos Sentry existem e têm DSN gerado (mesmo que ainda não
  conectado ao código).

**Rollback:** remover os monitores/projetos criados; nenhum impacto na
aplicação, são observadores externos read-only.

---

## Etapa 11 — Ligar o CI/CD ao deploy (webhook Coolify)

**Objetivo:** fechar o ciclo de CI/CD — o CI (`tear-v2-ci.yml`) e a build
de imagem (`tear-v2-docker.yml`) já existem; falta o gatilho de deploy
automático após merge em `main`, conforme §10 de `ARQUITETURA_PRODUCAO.md`.

**Pré-requisitos:** Etapa 6 concluída (Application existe no Coolify, com
webhook de deploy disponível no painel).

**Comandos:** nenhum novo workflow — apenas um passo adicional no
workflow existente (edição de código, listada aqui como pendência de
execução, não feita nesta sessão de planejamento):
```yaml
# passo adicional ao final de .github/workflows/tear-v2-docker.yml,
# só depois que a imagem for publicada com sucesso:
- name: Disparar deploy no Coolify
  run: curl -X POST "${{ secrets.COOLIFY_DEPLOY_WEBHOOK }}"
```

**Arquivos envolvidos:**
- `.github/workflows/tear-v2-docker.yml` (edição futura, fora desta
  sessão — "não altere código")
- Secret novo no GitHub: `COOLIFY_DEPLOY_WEBHOOK` (URL obtida no painel do
  Coolify, Application → Webhooks)

**Critérios de sucesso:** um merge de teste em `main` (após esta etapa
estar implementada numa sessão futura) dispara automaticamente um novo
deploy no Coolify, visível no histórico de deploys do painel.

**Rollback:** remover o passo do workflow (ou desativar o secret) — deploy
volta a ser manual via botão "Deploy" no Coolify, sem impacto na
aplicação já rodando.

---

## Etapa 12 — Smoke test e critérios de produção saudável

**Objetivo:** validar ponta a ponta antes de declarar o ambiente pronto
para receber usuários reais, reaproveitando o runbook já existente no
repositório (não duplicado aqui).

**Pré-requisitos:** Etapas 7, 8, 9 e 10 concluídas.

**Comandos:** seguir literalmente `tear-v2-app/docs/DEPLOY.md` §4 (Smoke
test pós-deploy, 8 passos) e §5 (Critérios para declarar produção
saudável).

**Arquivos envolvidos:**
- `tear-v2-app/docs/DEPLOY.md` (runbook já existente, só executado aqui)
- `TEAR_V2.5_GO_LIVE_CHECKLIST.md` (checklist de referência cruzada)

**Critérios de sucesso:** todos os itens de `DEPLOY.md` §4 e §5 verdadeiros
simultaneamente (containers saudáveis, `/up` e `/api/health` OK, login
ADMIN funcional, rota autenticada sem 500, `/pulse` restrito a ADMIN,
`X-Request-Id` presente, upload de Material funcional ou 503 esperado só
se Drive não configurado — não deveria ser o caso após a Etapa 4, logs sem
exceção recorrente, nenhum container em `Restarting`, backup válido e
recente existente, `migrate:status` sem pendências).

**Rollback:** se qualquer item falhar, **não declarar o deploy concluído**
— seguir `tear-v2-app/docs/DEPLOY.md` §7 (Rollback): checkout do commit
anterior conhecido bom + redeploy via Coolify; `migrate:rollback --step=1`
só se a migration do release problemático precisar ser desfeita (sempre
precedido de backup manual, conforme o próprio runbook já determina).

---

## Etapa 13 — Corte para produção (go-live)

**Objetivo:** passar a tratar `https://tear.estudioela.com` como o sistema
real em uso pelos usuários (admin e influenciadoras), não mais um ambiente
de validação.

**Pré-requisitos:** Etapa 12 concluída com todos os critérios verdadeiros.

**Comandos:** nenhum técnico adicional — esta etapa é operacional/
comunicacional, não de infraestrutura.

**Arquivos envolvidos:** nenhum.

**Passos:**
1. Comunicar a URL definitiva ao(s) usuário(s) ADMIN reais.
2. Acompanhar de perto (Pulse, UptimeRobot, Healthchecks.io, logs) nas
   primeiras 24-48h de uso real.
3. Manter o sistema legado GAS acessível e intocado durante esse período
   — é o plano de contingência natural, não uma etapa técnica à parte.

**Critérios de sucesso:** uso real por pelo menos 24-48h sem incidente que
exija rollback; todos os critérios da Etapa 12 continuam verdadeiros
depois de tráfego real (não só no smoke test sintético).

**Rollback:** como o legado GAS nunca foi desligado, o rollback definitivo
é simplesmente **não** direcionar (ou parar de direcionar) os usuários
reais para `tear.estudioela.com` — colocar a Application em manutenção
pelo painel do Coolify (Stop) e continuar operando no sistema legado até
o incidente ser resolvido. Nenhuma etapa deste plano exige desligar ou
alterar o GAS em nenhum momento.

---

## O que este plano não cobre (fora de escopo por instrução explícita)

- Execução de qualquer comando acima.
- Alteração de qualquer arquivo do repositório.
- Criação real de contas, Droplets, Service Accounts ou DNS records.
- Reavaliação de qualquer escolha de `ARQUITETURA_PRODUCAO.md`.

Execução real é trabalho de uma sessão futura, autorizada explicitamente
para isso.
