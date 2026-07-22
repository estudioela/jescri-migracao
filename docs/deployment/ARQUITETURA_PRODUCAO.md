# ARQUITETURA_PRODUCAO.md — TEAR V2.5

**Papel:** CTO / Arquiteto de Infraestrutura
**Data:** 2026-07-21
**Status:** Aprovada e definitiva — decisão soberana do responsável do
projeto (2026-07-21): **zero custo recorrente adicional, zero serviço
contratado novo.** Toda a infraestrutura roda sobre ativos já pagos
(Locaweb, domínio, Google Drive).
**Escopo:** `tear-v2-app/` (Laravel 12 + Sanctum + Spatie Permission / React 19 +
Vite). Não cobre o legado GAS (`src/`), que continua rodando no Apps Script/
Google Sheets como hoje.
**Este documento é só design.** Nenhum código foi alterado, nenhum deploy
foi feito.

---

## 0. Perfil do problema (por que isso molda a escolha)

- **Mantenedor único** (Daniel), sem equipe de infra dedicada.
- **Escala atual:** 1 marca (Jescri), poucas dezenas de influenciadoras,
  tráfego administrativo — não é ainda um SaaS multi-tenant público.
- **Público majoritariamente brasileiro** — latência a partir do Brasil
  importa.
- **Stack de aplicação já decidida** (não revisitada aqui): Laravel +
  Postgres + Sanctum SPA cookie-based + upload de Material direto ao
  Google Drive + e-mail transacional (convite, reset de senha).
- **Domínio próprio já existe** (`estudioela.com`).
- **Hospedagem já contratada:** Locaweb Hospedagem Linux (compartilhada) —
  PHP 8.3, acesso SSH, Crontab, banco de dados gerenciado (PostgreSQL),
  SSL, Git — **sem Docker, sem acesso root**.
- **Restrição soberana (2026-07-21):** zero custo recorrente adicional;
  zero contratação de serviço novo (nem VPS, nem PaaS, nem object storage
  externo). Toda a infraestrutura roda sobre o que já é pago: Locaweb +
  domínio + Google Drive.
- Critérios de decisão, em ordem de peso: **zero custo recorrente
  adicional > simplicidade operacional para 1 pessoa > segurança/backup >
  menor downtime possível dentro da restrição > escalabilidade futura.**

---

## 1. Hospedagem

**Decisão: Locaweb Hospedagem Linux, plano já contratado.**

Compartilhada — sem Docker, sem acesso root, sem systemd. Recursos
confirmados: PHP 8.3, SSH, Crontab, banco de dados gerenciado
(PostgreSQL), SSL, Git. Custo incremental: **US$0** — já é um ativo pago
independente deste projeto.

---

## 2. Banco de dados

**Decisão: PostgreSQL gerenciado, oferecido pelo próprio plano Locaweb.**

Mantém o motor já modelado no código (migrations, queries, testes) — sem
esforço de portar para MySQL. Backup e patch de versão são de
responsabilidade do provedor (escopo exato a confirmar na execução — ver
§7). Custo incremental: **US$0**.

---

## 3. Estratégia de deploy

**Decisão: GitHub Actions + deploy via SSH, sem Docker/Coolify/VPS.**

Sem containers e sem orquestrador, o deploy é um pipeline direto:

1. CI (testes, já existente em `tear-v2-ci.yml`) roda em cada push/PR.
2. Um job novo de **build** roda `npm ci && npm run build` no runner do
   GitHub Actions — o Vite gera os assets estáticos (`public/build`).
   Node/npm **não é dependência do servidor de produção**.
3. Um job novo de **deploy** (só em push para a branch de produção)
   conecta via SSH ao host Locaweb e publica os arquivos (`rsync`/`scp`)
   em um diretório de release novo (`releases/<id>/`), depois:
   - `composer install --no-dev --optimize-autoloader`
   - `php artisan migrate --force`
   - `php artisan config:cache && php artisan route:cache && php artisan view:cache`
   - swap do symlink `current` → nova release (deploy atômico por
     symlink, mesmo princípio de Capistrano/Deployer, sem precisar de
     container).
4. Rollback: apontar `current` de volta para a release anterior
   (`ln -sfn`) — não precisa reconstruir nada.

Não há zero-downtime "de graça" (o swap de symlink é quase instantâneo,
mas requests em voo durante `composer install`/migrations podem ver um
estado transitório) — aceitável para o perfil de tráfego atual (uso
administrativo interno, não um SaaS público de alto tráfego). Custo
incremental: **US$0** (usa só SSH, já incluso no plano).

---

## 4. Estratégia de storage

Duas necessidades distintas, resolvidas por peças diferentes:

1. **Material enviado pelas influenciadoras** — vai direto para o
   **Google Drive** (Shared Drive institucional + Service Account
   dedicada, §5). Decisão de produto, fora de escopo desta análise.
2. **Arquivos internos da aplicação** (documentos gerados, uploads
   temporários, cache de disco) — disco local do próprio plano Locaweb
   (`FILESYSTEM_DISK=local`). Sem múltiplas réplicas de app, disco local
   é suficiente. Custo incremental: **US$0**.

---

## 5. Estratégia para Google Drive

Sem mudança em relação à decisão original: **Shared Drive institucional
(Google Workspace) + Service Account com acesso Editor**, propriedade da
organização, não de uma pessoa. Custo incremental: **US$0** (dentro do
Workspace já existente). A chave privada da Service Account vive só no
`.env` do servidor (permissão de arquivo restrita) + cópia em
gerenciador de senhas como *break-glass*.

---

## 6. E-mail transacional (SMTP)

**Decisão: relay SMTP incluso no domínio/plano de hospedagem da Locaweb.**

Volume atual é baixo e só transacional (convite, redefinição de senha) —
dentro do limite esperado de qualquer relay padrão de hospedagem. Custo
incremental: **US$0**. Se o volume crescer além do limite do relay
incluso, um provedor dedicado (Resend, Postmark, SES) vira uma
**melhoria opcional** (ver §16) — não é dependência da arquitetura
crítica.

---

## 7. Backup

**Decisão: `pg_dump` agendado via Crontab do próprio plano + upload para
o Google Drive já contratado.**

- Cron (recurso nativo do plano) roda `pg_dump` do banco gerenciado.
- Um comando Artisan novo reaproveita a `GoogleDriveService`/Service
  Account já existente (§5) para subir o dump a uma pasta dedicada no
  mesmo Shared Drive — sem nenhum object storage externo (Cloudflare R2
  removido da arquitetura crítica).
- Alerta de falha: e-mail nativo (Laravel Mail, mesmo SMTP do §6)
  disparado se o dump não for gerado ou o upload falhar — sem
  dead-man's-switch de terceiro.

Retenção sugerida: 14 diários + 8 semanais, limitada pelo espaço do
Shared Drive/plano. Custo incremental: **US$0**.

---

## 8. Domínio

Sem mudança: **subdomínio de `estudioela.com`** (ex.: `tear.estudioela.com`),
registro `A`/`CNAME` isolado no provedor de DNS atual, sem delegar a zona
inteira. Custo incremental: **US$0**.

---

## 9. HTTPS

**Decisão: SSL emitido pelo painel da Locaweb.**

A confirmar durante a execução se a emissão é automática (tipo Let's
Encrypt) ou exige upload manual de certificado — ambos com custo
**US$0** no plano já contratado.

---

## 10. CI/CD

**Decisão: GitHub Actions cobre build + deploy, sem peça de orquestração
terceira.**

O CI de testes (`tear-v2-ci.yml`) já existe e continua inalterado. Dois
jobs novos (build do frontend, deploy via SSH — §3) fecham o ciclo push
→ teste → build → deploy, sem depender de Coolify/webhook de PaaS.
Custo incremental: **US$0**.

---

## 11. Monitoramento (transversal às escolhas acima)

**Obrigatório (dependência crítica):**
- **Laravel Pulse** (já implementado) — exceções, slow queries, filas,
  cobre o backend por dentro.
- **Alerta de e-mail nativo** do backup (§7) — única verificação externa
  mínima necessária.

Qualquer monitoramento adicional (erro de frontend, ping de
disponibilidade externo, dead-man's-switch dedicado) é tratado como
**melhoria opcional** — ver §16. Nenhum é pré-requisito para operar em
produção com segurança dentro do perfil atual do projeto.

---

## 12. Arquitetura recomendada (consolidada)

```
                         ┌──────────────────────────┐
   Usuário (BR) ───────► │ DNS: tear.estudioela.com  │
                         │  (registro A, provedor    │
                         │   de DNS já existente)     │
                         └────────────┬──────────────┘
                                      │ HTTPS (SSL do painel Locaweb)
                                      ▼
                    ┌────────────────────────────────────┐
                    │   Locaweb Hospedagem Linux           │
                    │   (compartilhada, PHP 8.3, sem        │
                    │    Docker/root)                       │
                    │                                        │
                    │  releases/<id>/ + symlink `current`     │
                    │  (deploy atômico via SSH, disparado      │
                    │   por GitHub Actions)                    │
                    │                                        │
                    │  ┌──────────────────────────────────┐  │
                    │  │ app Laravel (PHP-FPM do plano)    │  │
                    │  │ + Crontab (schedule:run,           │  │
                    │  │   queue:work --stop-when-empty,    │  │
                    │  │   backup pg_dump)                  │  │
                    │  └───────────────┬─────────────────────┘  │
                    │                  │                          │
                    │  ┌───────────────▼───────────────┐          │
                    │  │ PostgreSQL (gerenciado pela      │          │
                    │  │ própria Locaweb)                 │          │
                    │  └───────────────────────────────────┘          │
                    └────────────────────┬───────────────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    ▼                                          ▼
          ┌──────────────────┐                       ┌──────────────────┐
          │ Google Shared     │                       │ SMTP incluso no   │
          │ Drive (Material + │                       │ plano Locaweb     │
          │ backup de banco)  │                       │ (e-mail transac.) │
          └──────────────────┘                       └──────────────────┘

     Monitoramento obrigatório: Laravel Pulse (in-app) + alerta de
     e-mail nativo do backup. Opcionais em §16.
```

### Resumo das escolhas

| Área | Escolha |
|---|---|
| 1. Hospedagem | Locaweb Hospedagem Linux (já contratada), compartilhada, sem Docker/root |
| 2. Banco | PostgreSQL gerenciado da própria Locaweb |
| 3. Deploy | GitHub Actions + SSH, deploy atômico por symlink (`releases/` + `current`) |
| 4. Storage interno | Disco local do plano compartilhado |
| 5. Google Drive | Shared Drive institucional + Service Account dedicada |
| 6. SMTP | Relay incluso no domínio/plano Locaweb |
| 7. Backup | `pg_dump` via Crontab + upload para o próprio Google Drive; alerta por e-mail nativo |
| 8. Domínio | Subdomínio de `estudioela.com` |
| 9. HTTPS | SSL do painel Locaweb |
| 10. CI/CD | GitHub Actions (teste + build + deploy via SSH) |
| 11. Monitoramento obrigatório | Pulse + alerta de e-mail nativo |

---

## 13. Custo mensal estimado

| Item | Custo |
|---|---|
| Locaweb Hospedagem Linux | **US$0 incremental** (ativo já pago, independente deste projeto) |
| PostgreSQL gerenciado | US$0 (incluso no plano) |
| Google Shared Drive | US$0 (dentro do Workspace já existente) |
| SMTP | US$0 (incluso no plano/domínio) |
| Backup (Google Drive) | US$0 |
| Domínio | US$0 (subdomínio de ativo já existente) |
| HTTPS | US$0 (SSL do painel) |
| **Total estimado** | **US$0/mês incremental** |

---

## 14. Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Hospedagem compartilhada = limites de CPU/memória/processo fora do controle direto do projeto | Validar na execução (Etapa 1 do plano) se `composer install`/`artisan migrate` rodam dentro dos limites do plano; se não, alternativa é rodar `composer install` localmente/no CI e subir `vendor/` já pronto via deploy |
| Sem zero-downtime real (deploy é symlink swap, não container) | Aceitável para o perfil atual (uso administrativo interno); requests em voo durante `migrate` são a única janela de risco — migrations devem ser aditivas/retrocompatíveis quando possível |
| Backup dependente só do Google Drive (sem redundância de outro provedor) | Aceitável no estágio atual — Drive já tem redundância própria do Google; redundância adicional (ex.: R2) fica como melhoria opcional (§16) se o risco for reavaliado |
| SMTP incluso pode ter limite de envio diário mais baixo que um provedor dedicado | Volume atual é baixo (só transacional); monitorar e migrar para provedor dedicado (melhoria opcional) se o volume crescer |
| Único ponto de falha físico (a hospedagem compartilhada em si) | Backup off-host (Drive) + runbook de restore testado periodicamente |

---

## 15. Gatilhos de evolução (quando reabrir esta arquitetura)

- **Hospedagem:** migrar para VPS/Cloud próprio só se os limites de
  recurso da hospedagem compartilhada (CPU/memória/processos) se
  mostrarem insuficientes na prática (não hipoteticamente) — decisão do
  responsável do projeto, dado que reabre a restrição soberana de custo.
- **SMTP:** migrar para provedor dedicado se o volume transacional
  ultrapassar o limite do relay incluso.
- **Backup:** adicionar redundância externa (R2 ou similar) se o Google
  Drive deixar de ser considerado suficiente como destino único.
- **Domínio:** domínio de produto dedicado quando `Marca` virar tenant
  externo vendido de fato — mudança de escopo de produto, não de infra.

---

## 16. Melhorias Opcionais

Fora da arquitetura crítica — todas gratuitas, todas removíveis sem
redesenho, habilitáveis individualmente quando fizer sentido:

- **Sentry** (backend + frontend) — monitoramento de erro externo,
  complementa o Pulse (que só cobre o backend).
- **UptimeRobot** — ping externo de disponibilidade (`/up`,
  `/api/health`), cobre o cenário de a hospedagem inteira sair do ar
  (algo que o Pulse, rodando dentro da própria app, não vê).
- **Healthchecks.io** — dead-man's-switch dedicado para o backup,
  complementa/substitui o alerta de e-mail nativo do §7.
- **Cloudflare R2 (ou similar)** — destino secundário de backup,
  redundância além do Google Drive.
- **Provedor de SMTP dedicado** (Resend/Postmark/SES) — se o volume
  transacional superar o limite do relay incluso no plano (§6).

Nenhum destes é pré-requisito para as Etapas do `PLANO_IMPLEMENTACAO.md`
nem para o go-live.

---

## 17. Não incluído nesta sessão (por instrução explícita)

Nenhuma decisão acima foi implementada, nenhum recurso foi provisionado,
nenhum deploy foi feito, nenhum código foi alterado nesta revisão de
documento. Execução é trabalho de sessão(ões) separada(s), seguindo
`PLANO_IMPLEMENTACAO.md` (revisado) a partir da Etapa 1.
