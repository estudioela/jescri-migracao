# PLANO_IMPLEMENTACAO.md — TEAR V2.5

**Fonte única desta implementação:** `ARQUITETURA_PRODUCAO.md` (revisado,
decisão definitiva 2026-07-21 — Locaweb Hospedagem Linux, PostgreSQL
gerenciado, deploy via GitHub Actions + SSH, zero custo recorrente
adicional). Este documento não reavalia nenhuma escolha registrada lá —
apenas a transforma em etapas executáveis, em ordem.

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
| 1 | Confirmar acesso e recursos do plano Locaweb (SSH, Crontab, banco gerenciado, SSL, Git) | — |
| 2 | Provisionar/confirmar o banco PostgreSQL gerenciado | 1 |
| 3 | Configurar DNS do subdomínio apontando para o host Locaweb | 1 |
| 4 | Confirmar Google Shared Drive + Service Account (Material + backup) | — |
| 5 | Ajustar o CI do GitHub Actions: job de build do frontend | — |
| 6 | Configurar o job de deploy via SSH no GitHub Actions | 1, 5 |
| 7 | Primeiro deploy | 2, 3, 6 |
| 8 | Provisionar o primeiro Administrador | 7 |
| 9 | Configurar backup (`pg_dump` + Crontab + upload para Google Drive + alerta de e-mail nativo) | 7 |
| 10 | Configurar Crontab da fila (`queue:work --stop-when-empty`) | 7 |
| 11 | Smoke test e critérios de produção saudável | 7, 8, 9, 10 |
| 12 | Corte para produção (go-live) | 11 |

---

## Etapa 1 — Confirmar acesso e recursos do plano Locaweb

**Objetivo:** validar que o plano já contratado tem, de fato, tudo que a
arquitetura assume, antes de desenhar os passos seguintes em cima de uma
capacidade que pode não existir na prática.

**Pré-requisitos:** acesso ao painel de controle da Locaweb e às
credenciais SSH do plano.

**Comandos (verificação via SSH, após obter as credenciais no painel):**
```bash
ssh <usuario>@<host-locaweb>
php -v            # confirmar PHP 8.3
which composer    # confirmar composer disponível (ou subir um .phar)
crontab -l        # confirmar acesso a crontab
git --version     # confirmar git disponível
psql --version    # confirmar cliente Postgres, ou testar conexão ao gerenciado
```

**Arquivos envolvidos:** nenhum do repositório.

**Critérios de sucesso:**
- SSH conecta com a chave já cadastrada no painel.
- PHP 8.3 confirmado.
- `composer` disponível (binário do plano, ou `.phar` que possa rodar sem
  instalação de sistema).
- Crontab do usuário editável (`crontab -e` funciona).
- Conexão de teste ao banco gerenciado (host/porta/credenciais do painel)
  bem-sucedida via `psql` ou script PHP simples.

**Riscos a verificar nesta etapa (ver `ARQUITETURA_PRODUCAO.md` §14):**
- Limite de memória/CPU do plano pode impedir `composer install --no-dev`
  completo em um único processo — se ocorrer, alternativa é rodar
  `composer install` localmente/no CI e subir `vendor/` já pronto via
  deploy (decisão a tomar na Etapa 6, não aqui).
- Timeout de sessão SSH do plano — relevante para migrations mais longas.

**Rollback:** nenhum — etapa só de verificação, nenhuma infraestrutura é
criada ou alterada.

---

## Etapa 2 — Provisionar/confirmar o banco PostgreSQL gerenciado

**Objetivo:** ter o banco de produção (PostgreSQL, conforme §2 de
`ARQUITETURA_PRODUCAO.md`) acessível, com credenciais dedicadas.

**Pré-requisitos:** Etapa 1 concluída (acesso ao painel/SSH confirmado).

**Comandos (verificação, após criar/confirmar o banco no painel):**
```bash
psql "postgresql://<usuario>:<senha>@<host-banco>:<porta>/<database>" -c '\conninfo'
```

**Arquivos envolvidos:** nenhum do repositório (as credenciais só serão
usadas como variável de ambiente na Etapa 7, nunca commitadas).

**Critérios de sucesso:** conexão bem-sucedida com as credenciais do
banco gerenciado; host/porta/nome do banco/usuário/senha documentados em
local seguro (gerenciador de senhas) para uso na Etapa 7.

**Rollback:** nenhum dado de produção existe ainda neste ponto — revogar
as credenciais no painel, se necessário, é reversível sem custo.

---

## Etapa 3 — Configurar DNS do subdomínio

**Objetivo:** apontar `tear.estudioela.com` (ou o subdomínio definitivo
escolhido, conforme §8 de `ARQUITETURA_PRODUCAO.md`) para o host Locaweb,
**sem alterar os nameservers de todo `estudioela.com`** — só um registro
isolado.

**Pré-requisitos:** Etapa 1 concluída (IP ou CNAME do host Locaweb
conhecido, conforme instrução do painel); acesso ao painel de DNS onde
`estudioela.com` está hospedado hoje.

**Comandos (verificação, após criar o registro no painel de DNS):**
```bash
dig +short tear.estudioela.com
# deve retornar o IP ou CNAME do host Locaweb
```

**Arquivos envolvidos:** nenhum do repositório.

**Registro a criar no provedor de DNS atual:**
| Tipo | Nome | Valor | TTL |
|---|---|---|---|
| A ou CNAME (conforme o painel Locaweb indicar) | `tear` | `<IP ou host indicado pela Locaweb>` | 300-3600 |

**Critérios de sucesso:** `dig +short tear.estudioela.com` resolve para o
valor correto a partir de pelo menos duas redes diferentes.

**Rollback:** remover o registro criado. Nenhuma delegação de zona foi
feita — o restante de `estudioela.com` (e-mail, site) nunca foi tocado.

---

## Etapa 4 — Confirmar Google Shared Drive + Service Account

**Objetivo:** credenciais de Drive institucionais (não atreladas a uma
pessoa), conforme §5 de `ARQUITETURA_PRODUCAO.md`, para preencher
`GOOGLE_DRIVE_CLIENT_EMAIL` / `GOOGLE_DRIVE_PRIVATE_KEY` /
`GOOGLE_DRIVE_ROOT_FOLDER_ID` / `GOOGLE_DRIVE_BACKUP_FOLDER_ID`.

**Pré-requisitos:** acesso de administrador ao Google Workspace de
`estudioela.com` e a um projeto no Google Cloud Console vinculado a esse
Workspace.

**Comandos:** nenhum (fluxo é via console web).

**Passos:**
1. Confirmar (ou criar) o **Shared Drive** dedicado (ex.: "TEAR —
   Materiais de Campanha").
2. Confirmar (ou criar) a **Service Account** dedicada
   (ex.: `tear-drive-uploader`), com chave JSON gerada.
3. Adicionar o e-mail da Service Account como membro do Shared Drive com
   papel **Content Manager**.
4. Criar (se ainda não existir) uma **subpasta dedicada a backup de
   banco** dentro do mesmo Shared Drive.
5. Extrair `client_email` → `GOOGLE_DRIVE_CLIENT_EMAIL`; `private_key` →
   `GOOGLE_DRIVE_PRIVATE_KEY`; ID do Shared Drive →
   `GOOGLE_DRIVE_ROOT_FOLDER_ID`; ID da subpasta de backup →
   `GOOGLE_DRIVE_BACKUP_FOLDER_ID`.

**Arquivos envolvidos:** nenhum do repositório (os valores só serão
usados como variáveis de ambiente na Etapa 7, nunca commitados).

**Critérios de sucesso:** a Service Account aparece como membro do Shared
Drive com permissão de escrita; os quatro valores extraídos estão
guardados em local seguro para uso na Etapa 7.

**Rollback:** revogar/excluir a chave JSON no Console GCP e remover a
Service Account do Shared Drive. Nenhum dado de produção é afetado.

---

## Etapa 5 — Ajustar o CI do GitHub Actions: job de build do frontend

**Objetivo:** o Vite precisa gerar os assets estáticos (`public/build`)
**fora** do servidor de produção (a hospedagem compartilhada não tem
Node/npm), conforme §3/§10 de `ARQUITETURA_PRODUCAO.md`.

**Pré-requisitos:** nenhum além do repositório atual (`tear-v2-ci.yml` já
existe e já roda `npm run build` como parte do job de frontend — ver
`.github/workflows/tear-v2-ci.yml`).

**Comandos:** nenhum novo — a mudança é garantir que o artefato de build
(`frontend/dist` ou `public/build`, conforme configuração do Vite) seja
exportado como *artifact* do workflow, para ser consumido pelo job de
deploy da Etapa 6.

**Arquivos envolvidos:**
- `.github/workflows/tear-v2-ci.yml` (adicionar upload do artefato de
  build, se ainda não existir) **ou**
- `.github/workflows/tear-v2-deploy.yml` (novo — pode incluir seu próprio
  passo de build, sem depender do CI de testes).

**Critérios de sucesso:** o workflow gera e disponibiliza o diretório de
build do frontend como artifact, pronto para ser baixado pelo job de
deploy.

**Rollback:** reverter o commit do workflow — nenhum impacto em produção
(esta etapa só prepara o pipeline).

---

## Etapa 6 — Configurar o job de deploy via SSH no GitHub Actions

**Objetivo:** publicar o código + assets buildados no host Locaweb, de
forma atômica (`releases/` + symlink `current`), disparado
automaticamente após o CI passar em `main` (ou branch de produção
definida pelo responsável do projeto).

**Pré-requisitos:** Etapas 1 e 5 concluídas (acesso SSH confirmado,
artefato de build disponível no workflow).

**Comandos (dentro do workflow, via ação de SSH):**
```bash
# no runner do GitHub Actions:
rsync -avz --exclude='.env' ./ <usuario>@<host-locaweb>:~/releases/<id>/

# via SSH no host, após o rsync:
cd ~/releases/<id>/
composer install --no-dev --optimize-autoloader
ln -sfn ~/shared/.env .env
php artisan migrate --force
php artisan config:cache && php artisan route:cache && php artisan view:cache
ln -sfn ~/releases/<id>/ ~/current
```

**Arquivos envolvidos:**
- `.github/workflows/tear-v2-deploy.yml` (novo)
- `tear-v2-app/scripts/deploy-locaweb.sh` (novo — encapsula os comandos
  acima, chamado pelo workflow)
- `tear-v2-app/backend/.env.production.example` (referência para o
  `shared/.env` real do host, nunca commitado)

**Secrets do GitHub a cadastrar:** `SSH_HOST`, `SSH_USER`,
`SSH_PRIVATE_KEY`, caminho absoluto do diretório de deploy no host.

**Critérios de sucesso:** um push de teste em `main` (ou branch de
produção) dispara o workflow e ele conclui sem erro até o swap do
symlink — sem ainda apontar tráfego real (isso só acontece após a Etapa
7 validar o resultado).

**Rollback:** apagar a release recém-criada em `~/releases/<id>/` e
manter `current` apontando para a release anterior (ou para nenhuma, se
for a primeira execução). Nenhum tráfego real depende disso ainda.

---

## Etapa 7 — Primeiro deploy

**Objetivo:** subir a aplicação completa pela primeira vez neste
ambiente, com migrations rodando (via `deploy-locaweb.sh`, Etapa 6).

**Pré-requisitos:** Etapas 2, 3 e 6 concluídas (banco acessível, DNS
resolvendo, pipeline de deploy configurado).

**Comandos:** disparo é automático via push (Etapa 6). Verificação
pós-deploy:
```bash
curl -f https://tear.estudioela.com/up
curl -f https://tear.estudioela.com/api/health
```

**Arquivos envolvidos:** os mesmos da Etapa 6 (nenhum arquivo novo — este
é o primeiro run real deles).

**Critérios de sucesso:**
- `curl -f .../up` retorna 200.
- `curl -f .../api/health` retorna `{"status":"ok",...}`.
- Certificado HTTPS válido (sem aviso de certificado no navegador).
- Via SSH: `php artisan migrate:status` (dentro de `~/current/`) mostra
  todas as migrations como `Ran`.

**Rollback:** apontar `current` para a release anterior (ou nenhuma) via
SSH manual. O sistema legado GAS continua sendo a única produção real
neste ponto — nenhum usuário foi direcionado para o novo domínio ainda
(isso só acontece na Etapa 12).

---

## Etapa 8 — Provisionar o primeiro Administrador

**Objetivo:** ter um usuário `ADMIN` real para operar o sistema.

**Pré-requisitos:** Etapa 7 concluída (aplicação respondendo).

**Comandos (via SSH, dentro de `~/current/`):**
```bash
php artisan admin:create \
  --name="Nome Completo" \
  --email="admin@estudioela.com"
```

**Arquivos envolvidos:** nenhum (comando já implementado —
`app/Console/Commands/CreateAdminCommand.php`, não tocado nesta etapa).

**Critérios de sucesso:** login bem-sucedido em
`https://tear.estudioela.com` com o e-mail/senha cadastrados, papel
`ADMIN` confirmado.

**Rollback:** comando é idempotente — rodar de novo com o mesmo e-mail
reseta a senha.

---

## Etapa 9 — Configurar backup (`pg_dump` + Crontab + Google Drive)

**Objetivo:** backup automatizado do PostgreSQL, com cópia fora do host
(Google Drive já contratado) e alerta por e-mail se o backup falhar,
conforme §7 de `ARQUITETURA_PRODUCAO.md`.

**Pré-requisitos:** Etapa 7 concluída (banco populado, mesmo que vazio);
Etapa 4 concluída (Service Account/pasta de backup no Drive prontas).

**Comandos:**
```bash
# 1) validar o script existente manualmente antes de agendar
cd ~/current && ./scripts/backup-db.sh

# 2) validar o upload manual do último dump para o Drive
php artisan backup:upload-to-drive --file=./backups/tear_$(date +%Y%m%d).sql.gz

# 3) agendar via crontab do host:
crontab -e
0 3 * * * cd ~/current && ./scripts/backup-db.sh \
  && php artisan backup:upload-to-drive --latest \
  && find ./backups -name '*.sql.gz' -mtime +14 -delete
```

**Arquivos envolvidos:**
- `tear-v2-app/scripts/backup-db.sh` (ajustado — ver
  `IMPLEMENTACAO_TECNICA.md` §2)
- `tear-v2-app/backend/app/Console/Commands/BackupDatabaseToDrive.php`
  (novo — ver `IMPLEMENTACAO_TECNICA.md` §3)

**Critérios de sucesso:**
- Um dump aparece na pasta de backup do Shared Drive após a execução
  manual de teste.
- Se o `pg_dump` ou o upload falhar, um e-mail de alerta chega ao admin
  (testar forçando uma falha controlada, ex. credencial temporariamente
  inválida).
- `crontab -l` no host lista a linha agendada corretamente.

**Rollback:** remover a linha do `crontab`; nenhum impacto na aplicação.
Dumps já enviados ao Drive permanecem como backup válido independente do
cron estar ativo ou não.

---

## Etapa 10 — Configurar Crontab da fila

**Objetivo:** processar jobs de fila sem depender de um worker de longa
duração (que a hospedagem compartilhada, sem systemd/root, não suporta).

**Pré-requisitos:** Etapa 7 concluída.

**Comandos:**
```bash
crontab -e
* * * * * cd ~/current && php artisan schedule:run >> /dev/null 2>&1
* * * * * cd ~/current && php artisan queue:work --stop-when-empty >> /dev/null 2>&1
```

**Arquivos envolvidos:** nenhum novo — usa a infraestrutura de
`schedule`/`queue` já existente no Laravel, só muda o mecanismo de
disparo (cron, não daemon).

**Critérios de sucesso:** um job de teste enfileirado é processado dentro
de, no máximo, 1-2 minutos (intervalo do cron); `crontab -l` lista as
duas linhas.

**Rollback:** remover as linhas do `crontab` — jobs ficam enfileirados
sem processamento até serem reativados, sem perda de dados.

---

## Etapa 11 — Smoke test e critérios de produção saudável

**Objetivo:** validar ponta a ponta antes de declarar o ambiente pronto
para receber usuários reais.

**Pré-requisitos:** Etapas 7, 8, 9 e 10 concluídas.

**Comandos:** seguir o runbook de smoke test já existente em
`tear-v2-app/docs/DEPLOY.md` — **atenção:** esse documento ainda descreve
o fluxo Docker/Coolify anterior e precisa de revisão própria antes desta
etapa ser executada de fato (pendência registrada em
`IMPLEMENTACAO_TECNICA.md` §2, fora do escopo desta revisão de
arquitetura).

**Arquivos envolvidos:**
- `tear-v2-app/docs/DEPLOY.md` (pendente de revisão — ver nota acima)
- `docs/release/TEAR_V2.5_GO_LIVE_CHECKLIST.md` (pendente de revisão — mesma nota)

**Critérios de sucesso:** containers/processos saudáveis (equivalente
`php-fpm`/cron ativo), `/up` e `/api/health` OK, login ADMIN funcional,
rota autenticada sem 500, `/pulse` restrito a ADMIN, upload de Material
funcional, logs sem exceção recorrente, backup válido e recente
existente, `migrate:status` sem pendências.

**Rollback:** se qualquer item falhar, **não declarar o deploy
concluído** — apontar `current` para a release anterior boa conhecida
via SSH.

---

## Etapa 12 — Corte para produção (go-live)

**Objetivo:** passar a tratar `https://tear.estudioela.com` como o
sistema real em uso pelos usuários (admin e influenciadoras).

**Pré-requisitos:** Etapa 11 concluída com todos os critérios
verdadeiros.

**Comandos:** nenhum técnico adicional — etapa operacional/
comunicacional.

**Arquivos envolvidos:** nenhum.

**Passos:**
1. Comunicar a URL definitiva ao(s) usuário(s) ADMIN reais.
2. Acompanhar de perto (Pulse, logs, backup) nas primeiras 24-48h de uso
   real.
3. Manter o sistema legado GAS acessível e intocado durante esse período.

**Critérios de sucesso:** uso real por pelo menos 24-48h sem incidente
que exija rollback.

**Rollback:** como o legado GAS nunca foi desligado, o rollback
definitivo é simplesmente **não** direcionar os usuários reais para
`tear.estudioela.com` e continuar operando no sistema legado até o
incidente ser resolvido.

---

## O que este plano não cobre (fora de escopo por instrução explícita)

- Execução de qualquer comando acima.
- Alteração de qualquer arquivo do repositório.
- Criação real de contas, banco gerenciado, DNS records ou secrets do
  GitHub.
- Reavaliação de qualquer escolha de `ARQUITETURA_PRODUCAO.md`.
- Reescrita de `tear-v2-app/docs/DEPLOY.md` e
  `docs/release/TEAR_V2.5_GO_LIVE_CHECKLIST.md` (pendência registrada, tratada em
  sessão própria antes da Etapa 11).

Execução real é trabalho de uma sessão futura, autorizada explicitamente
para isso.
