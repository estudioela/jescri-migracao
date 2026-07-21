# ARQUITETURA_PRODUCAO.md — TEAR V2.5

**Papel:** CTO / Arquiteto de Infraestrutura
**Data:** 2026-07-21
**Escopo:** `tear-v2-app/` (Laravel 12 + Sanctum + Spatie Permission / React 19 +
Vite). Não cobre o legado GAS (`src/`), que continua rodando no Apps Script/
Google Sheets como hoje.
**Premissa desta análise:** nenhuma decisão de infraestrutura foi tomada
ainda (mesmo havendo artefatos Docker/CI já implementados em sessões
anteriores — ver `TEAR_V2.5_GO_LIVE_CHECKLIST.md` §0). Este documento
projeta a infraestrutura ideal do zero e escolhe uma arquitetura única.
**Este documento é só design.** Nenhum código foi alterado, nenhum deploy
foi feito.

---

## 0. Perfil do problema (por que isso molda a escolha)

- **Mantenedor único** (Daniel), sem equipe de infra dedicada.
- **Escala atual:** 1 marca (Jescri), poucas dezenas de influenciadoras,
  tráfego administrativo — não é ainda um SaaS multi-tenant público (o
  papel `Marca` com tenant próprio está registrado como "porta aberta,
  não implementada" no roteador do projeto).
- **Público majoritariamente brasileiro** (empresa e usuárias no Brasil) —
  latência a partir do Brasil é um critério real, não cosmético.
- **Stack já decidida no nível de aplicação** (não revisitada aqui):
  Laravel + Postgres + Sanctum SPA cookie-based + integração obrigatória
  com Google Drive para upload de Material + envio de e-mail transacional
  (convite, reset de senha).
- **Domínio próprio já existe** (`estudioela.com`) — não é necessário
  comprar um domínio novo.
- Critérios de decisão, em ordem de peso para este projeto: **simplicidade
  operacional para 1 pessoa > custo > segurança/backup > zero downtime >
  escalabilidade futura**. Escalabilidade importa, mas não ao preço de
  complexidade que ninguém vai operar sozinho.

---

## 1. Hospedagem

| Opção | Prós | Contras | Custo/mês |
|---|---|---|---|
| **A — DigitalOcean Droplet (São Paulo, `sao1`)** | Datacenter no Brasil (latência baixa para o público real); ecossistema integrado (Droplet + Managed DB + Spaces + Load Balancer no mesmo painel); documentação/tutoriais abundantes; painel simples, curva de aprendizado baixa | Um pouco mais caro que Hetzner para a mesma CPU/RAM | 2 vCPU/4GB ≈ **US$24/mês** |
| **B — Hetzner Cloud (EU/US)** | Melhor custo-benefício de CPU/RAM do mercado; API/painel simples | **Sem região no Brasil** — latência ~180-220ms a partir do Brasil, perceptível na UX da SPA; suporte em inglês, comunidade menor no BR | 2 vCPU/4GB ≈ **US$6-8/mês** |
| **C — Railway / Render (PaaS)** | Deploy via git push, zero gestão de servidor, TLS/zero-downtime nativos | Sem região BR (US/EU); custo escala rápido com add-ons (Postgres, worker, egress) e fica imprevisível; menos controle fino sobre o host; vendor lock-in de configuração | US$20-60+/mês dependendo de uso |
| **D — AWS EC2/Lightsail + RDS (São Paulo)** | Região BR disponível; "padrão de mercado", caminho de crescimento quase ilimitado | Curva de aprendizado alta (IAM, VPC, security groups); custo real maior que parece no calculador; overhead de operação incompatível com 1 dev | US$40-80+/mês |

**Escolha: A — DigitalOcean Droplet, região São Paulo.** Latência real para
o público-alvo, ecossistema simples o suficiente para uma pessoa, e permite
migrar peças isoladas (ex.: banco) para managed depois sem trocar de
provedor.

---

## 2. Banco de dados

| Opção | Prós | Contras | Custo/mês |
|---|---|---|---|
| **A — Postgres self-hosted no próprio Droplet (Docker)** | Custo zero incremental (já incluso no compute do Droplet); já modelado no `docker-compose.yml` existente; controle total | Backup/patch/upgrade de versão são responsabilidade do dev (mitigável com script + cron, já existe) | **US$0** (embutido no Droplet) |
| **B — DigitalOcean Managed Postgres** | Backup automático + point-in-time recovery + patch de segurança automático — remove uma classe inteira de trabalho operacional | Custo dedicado adicional; ainda assim precisa do Droplet para o resto da stack | a partir de **US$15/mês** (1GB) |
| **C — Neon / Supabase (Postgres serverless)** | Free tier generoso, branching de banco para testes, autoscale-to-zero | Cold start em plano free pode adicionar latência à primeira query após inatividade; menos maduro para sessão/cache gravando a cada request (Sanctum usa `SESSION_DRIVER=database`) sem tuning de pooler | Free–US$19/mês |

**Escolha: A — Postgres self-hosted, com gatilho de migração documentado.**
No estágio atual (1 marca, tráfego baixo), o backup script já existente
(`scripts/backup-db.sh`) + offsite (ver §7) entrega segurança comparável a
managed por uma fração do custo. **Gatilho de migração para B:** quando o
Postgres passar a exigir atenção operacional real (>1 incidente de
performance/corrupção por trimestre, ou quando um segundo tenant real
depender de uptime formal).

---

## 3. Estratégia de deploy

| Opção | Prós | Contras | Custo/mês |
|---|---|---|---|
| **A — Docker Compose + Caddy + GitHub Actions (SSH deploy)** | Zero abstração nova (o dev já é fluente no `docker-compose.yml` existente); controle total, fácil de depurar porque não há camada escondida | Não dá zero-downtime "de graça" (`docker compose up -d` recria o container = alguns segundos de interrupção); rollback é manual (checkout do commit anterior + redeploy) | **US$0** |
| **B — Coolify self-hosted (no mesmo Droplet)** | Zero-downtime nativo (troca de container só depois do healthcheck passar); rollback de 1 clique; painel visual de logs/métricas/deploy; integra com webhook do GitHub; backup de banco agendável na própria UI | Mais uma peça de software para manter atualizada (mitigado: atualiza sozinho, é Docker); curva de aprendizado inicial de algumas horas | **US$0** (open-source, roda no mesmo Droplet) |
| **C — PaaS gerenciado (Railway/Render/Fly.io)** | Deploy trivial (`git push`), zero-downtime e rollback nativos da plataforma | Acoplamento à plataforma; runners de fila/worker cobrados à parte; menos previsível em custo | Incluído no custo de hospedagem (opção C acima) |
| **D — Kubernetes (gerenciado)** | Zero-downtime, autoscaling horizontal, padrão de indústria | Overkill total para 1 dev e a escala atual; custo de control plane + nós; curva de aprendizado íngreme | US$40-100+/mês |

**Escolha: B — Coolify self-hosted no mesmo Droplet.** É a única opção que
entrega **zero-downtime real** sem sair do orçamento de US$0 incremental e
sem trocar de provedor de hospedagem. O `docker-compose.yml`/Dockerfiles já
existentes continuam sendo o artefato de build — Coolify só assume a
orquestração de deploy/TLS/rollback em cima deles.

---

## 4. Estratégia de storage

O sistema tem duas necessidades de storage distintas, que **não devem ser
resolvidas pela mesma peça**:

1. **Material enviado pelas influenciadoras** — já modelado no código para
   ir direto ao Google Drive (ver §5). Não é negociável mudar isso agora
   (mudaria regra de negócio, fora do escopo "não altere código").
2. **Arquivos internos da aplicação** (documentos gerados, uploads
   temporários antes de subir ao Drive, cache de disco) — hoje usam disco
   local do container (`FILESYSTEM_DISK=local`).

| Opção (para o item 2) | Prós | Contras | Custo/mês |
|---|---|---|---|
| **A — Disco local do Droplet (volume Docker)** | Simples, já é o default, custo zero | Não sobrevive a troca de host; não escala horizontalmente (2º nó de app não veria os mesmos arquivos) | US$0 |
| **B — DigitalOcean Spaces (S3-compatible)** | Durável, sobrevive a qualquer incidente de host; pré-requisito para escalar para mais de 1 nó de app no futuro | Mais uma credencial/serviço para configurar; custo incremental | **US$5/mês** (250GB) |

**Escolha: A por enquanto, com gatilho para B.** Com 1 Droplet e sem
necessidade de múltiplas réplicas do `app` hoje, disco local é suficiente
(mesma conclusão já registrada em `TEAR_V2.5_PRODUCTIZACAO_ROADMAP.md` §5).
**Gatilho de migração:** no momento em que houver 2º nó de aplicação
(escala horizontal) ou geração de documentos virar volumétrica.

---

## 5. Estratégia para Google Drive

Não é uma escolha de "qual serviço" (o produto já exige Google Drive) — é
uma escolha de **modelo de propriedade e credencial**.

| Opção | Prós | Contras | Custo/mês |
|---|---|---|---|
| **A — Service Account vinculada à conta pessoal do operador (My Drive)** | Setup mais rápido | Service Account não tem cota própria em "My Drive" pessoal (erro clássico de quota); e, mais grave: **fica atrelada a uma pessoa** — se ela sair, o acesso quebra | US$0 |
| **B — Shared Drive institucional (Google Workspace) + Service Account com acesso Editor** | Propriedade é da organização, não de uma pessoa; sem limite de quota de "My Drive"; sobrevive a troca de funcionário; é o padrão recomendado pela própria documentação do Google para automações | Exige que a organização já tenha (ou crie) um Shared Drive — geralmente já incluso no plano Workspace existente | US$0 incremental (se já há Workspace) |

**Escolha: B — Shared Drive institucional.** É estritamente melhor e sem
custo adicional (a empresa já opera em Google Workspace, a julgar pelo
domínio `estudioela.com`). A chave privada da Service Account deve viver
só no `.env` do servidor (permissão de arquivo restrita) + uma cópia em
gerenciador de senhas como *break-glass*; não é necessário um secrets
manager dedicado (Doppler/Infisical) no estágio atual de 1 mantenedor —
reavaliar se a equipe crescer.

---

## 6. Melhor SMTP

Volume atual: baixo e só transacional (convite, redefinição de senha) —
não é e-mail de marketing/campanha em massa.

| Opção | Prós | Contras | Custo/mês |
|---|---|---|---|
| **A — Resend** | DX moderna, setup de DNS simples, pacote oficial para Laravel, free tier de 3.000 e-mails/mês (muito acima do volume atual) | Marca mais nova no mercado (menos histórico de reputação que Postmark) | **US$0** no volume atual |
| **B — Postmark** | Reputação de deliverability específica para e-mail transacional, considerada referência do mercado | Free tier só por 30 dias de trial; depois é pago desde o primeiro e-mail | ~US$15/mês (10k e-mails) |
| **C — Amazon SES** | Mais barato em volume alto (US$0,10/1000) | Setup mais burocrático (sair do sandbox, configurar SPF/DKIM/DMARC manualmente); overhead de conta AWS só para isso | ~US$0-2/mês no volume atual |
| **D — Relay SMTP do Google Workspace** | Zero custo incremental, já disponível se há Workspace | Limite de ~2.000 e-mails/dia por usuário; mistura reputação transacional com o domínio de e-mail "humano" da empresa; não é desenhado para isso | US$0 |

**Escolha: A — Resend.** Melhor equilíbrio custo/simplicidade/deliverability
para o volume atual, sem burocracia de sandbox. **Gatilho de migração:**
se o volume crescer muito além de milhares/mês, reavaliar SES pelo custo
marginal.

---

## 7. Melhor backup

| Opção | Prós | Contras | Custo/mês |
|---|---|---|---|
| **A — Cron + `pg_dump` local (scripts já existentes)** | Já implementado, custo zero | Backup fica no mesmo Droplet que ele protege — se o Droplet for perdido/corrompido, o backup vai junto (viola a regra 3-2-1) | US$0 |
| **B — Cron + `pg_dump` + upload para object storage externo (Spaces/R2)** | Corrige o problema de A com custo mínimo; sobrevive à perda total do Droplet | Mais um destino a configurar (credencial de bucket) | **US$5/mês** (Spaces) ou **~US$0** (Cloudflare R2, free tier generoso) |
| **C — Backup automático de banco gerenciado (se Postgres fosse managed)** | Zero manutenção, PITR incluso | Só existe se a opção 2-B (Managed Postgres) for adotada — não é o caso aqui | incluso no managed DB |

**Escolha: B — cron + `pg_dump` + upload para Cloudflare R2** (10GB free,
sem custo de egress — ideal para dumps de banco pequenos). Retenção
sugerida: 14 diários + 8 semanais. Adicionar **Healthchecks.io** (free) como
"dead man's switch" — alerta se o cron de backup deixar de rodar, não só se
o backup falhar (essa é a lacuna real do estado atual: os scripts existem
mas não há nada que avise se o cron parar de disparar).

---

## 8. Melhor domínio

A empresa **já possui** `estudioela.com` — a decisão não é "qual domínio
comprar", é "qual convenção de subdomínio usar" e "onde gerenciar o DNS".

| Opção | Prós | Contras | Custo/mês |
|---|---|---|---|
| **A — Subdomínio do domínio já existente** (ex.: `portal.estudioela.com` ou `tear.estudioela.com`) | Custo zero; reforça marca; não exige comprar/renovar nada novo | Nenhum real, dado o estágio atual (1 marca, uso interno) | US$0 |
| **B — Domínio novo dedicado** (ex.: `usetear.com`, `teartech.com.br`) | Faz sentido **se** o TEAR virar produto vendido a outras agências (multi-tenant `Marca` real) — separa a marca do produto da marca da agência | Custo de registro/renovação; mais um ativo para gerenciar (renovação, DNS) sem benefício hoje, já que `Marca` multi-tenant está registrada como "fora de escopo por decisão de produto" no código atual | US$10-40/ano |
| **C — `.com.br` via registro.br** | ccTLD brasileiro, reforça confiança local | Processo de registro mais manual que gTLD; mesmo racional de B — só compensa se virar produto externo | ~R$40/ano |

**Escolha: A — subdomínio de `estudioela.com`** (ex.: `tear.estudioela.com`).
**Gatilho de migração para B:** no dia em que `Marca` deixar de ser
"cadastro interno sem login próprio" e virar tenant externo real vendido a
outras agências — aí sim um domínio de produto próprio se justifica.

**Importante (risco a evitar):** gerenciar o DNS deste subdomínio **não**
deve exigir mudar os nameservers de todo o `estudioela.com` (isso arriscaria
e-mail/site institucional que já rodam nesse domínio). A forma segura é
criar apenas o registro `A`/`CNAME` do subdomínio no provedor de DNS atual
apontando para o Droplet — sem delegação de zona inteira.

---

## 9. Melhor HTTPS

| Opção | Prós | Contras | Custo/mês |
|---|---|---|---|
| **A — Let's Encrypt automático via Traefik (embutido no Coolify)** | Zero configuração manual, renovação automática, zero custo, sem peça extra além do que já foi escolhido em §3 | Sem CDN/WAF/proteção DDoS embutida | US$0 |
| **B — Cloudflare (proxy laranja) na frente + certificado de origem** | Adiciona CDN, WAF, proteção DDoS gratuitos; esconde IP real do Droplet | Uma camada a mais para depurar quando algo dá errado (ex.: modo de cache agressivo mascarando erro real); exige decidir modo SSL (Full Strict) corretamente para não criar loop de redirect | US$0 (plano free) |
| **C** — Certificado manual/comprado | Nenhuma vantagem real hoje | Processo manual de renovação, risco de expirar sem aviso | US$0-100/ano |

**Escolha: A agora, B como upgrade fácil e opcional depois.** No estágio
atual (baixo tráfego, sem exposição pública de marketing pesada), Let's
Encrypt via Coolify entrega HTTPS válido, automático e com uma peça a menos
para operar. **Gatilho de migração para B:** se o tráfego crescer, se
houver necessidade de esconder o IP de origem, ou se abuso/DDoS virar um
problema real — ativar Cloudflare é uma mudança de DNS de poucos minutos,
não uma reforma de arquitetura.

---

## 10. Melhor CI/CD

O CI (testes) e a build de imagem Docker **já existem e funcionam**
(`.github/workflows/tear-v2-ci.yml`, `tear-v2-docker.yml`) — a única peça
em aberto é o gatilho de **deploy** depois do build.

| Opção | Prós | Contras | Custo/mês |
|---|---|---|---|
| **A — GitHub Actions com passo de SSH (`appleboy/ssh-action`)** rodando `docker compose pull && up -d` | Nenhuma peça nova além do já existente | Reforça a lacuna de zero-downtime do §3-A; rollback = re-executar workflow de um commit anterior | US$0 |
| **B — Webhook do GitHub → Coolify** (deploy nativo, integrado à escolha do §3-B) | Consistente com a escolha de deploy já feita; zero-downtime e rollback de 1 clique herdados de graça | Nenhum real, dado que Coolify já foi escolhido | US$0 |
| **C — Watchtower** (polling de nova tag de imagem) | Mais simples ainda de configurar | Não dá controle sobre ordem de migration/deploy, arriscado com mudanças de schema; sem gate de aprovação | US$0 |

**Escolha: B — webhook do GitHub para o Coolify.** É a opção coerente com a
escolha já feita em §3, aproveita o CI existente sem reescrevê-lo, e fecha
o zero-downtime ponta a ponta (build → teste → deploy → swap sem
interrupção).

---

## 11. Monitoramento (transversal às escolhas acima)

Não pedido como item numerado isolado, mas é pré-requisito para "operar em
produção com segurança" — registrado aqui para a arquitetura ficar completa:

- **Laravel Pulse** (já implementado): exceções, slow queries, filas — cobre o backend por dentro.
- **UptimeRobot** (free): ping externo em `/up` e `/api/health` a cada 5 min — cobre o cenário que o Pulse não vê (Droplet inteiro fora do ar).
- **Healthchecks.io** (free): dead-man's-switch no cron de backup (§7).
- **Sentry** (free tier, ~5k eventos/mês): única lacuna real hoje — o **frontend não tem nenhum monitoramento de erro** (Pulse só cobre backend). Sentry cobre os dois lados com uma conta.

---

## 12. Arquitetura recomendada (consolidada)

```
                         ┌──────────────────────────┐
   Usuário (BR) ───────► │ DNS: tear.estudioela.com  │
                         │  (registro A, provedor    │
                         │   de DNS já existente)     │
                         └────────────┬──────────────┘
                                      │ HTTPS (Let's Encrypt)
                                      ▼
                    ┌───────────────────────────────────┐
                    │   DigitalOcean Droplet — São Paulo │
                    │        (4GB / 2vCPU, Ubuntu)       │
                    │                                     │
                    │  ┌───────────────────────────────┐  │
                    │  │   Coolify (orquestração)       │  │
                    │  │  - Traefik (TLS, zero-downtime)│  │
                    │  │  - Deploy via webhook GH        │  │
                    │  │  - Backup agendado do Postgres  │  │
                    │  └──────────┬──────────────────────┘  │
                    │             │                          │
                    │  ┌──────────▼─────┐  ┌───────────────┐│
                    │  │ app (Laravel,   │  │ frontend       ││
                    │  │ PHP-FPM)        │  │ (React/Vite,   ││
                    │  │ + queue worker  │  │  build estático)││
                    │  └──────────┬──────┘  └───────────────┘│
                    │             │                          │
                    │  ┌──────────▼─────┐                    │
                    │  │ Postgres 16     │                    │
                    │  │ (Docker volume) │                    │
                    │  └─────────────────┘                    │
                    └───────────────────┬───────────────────┘
                                        │
              ┌─────────────────────────┼─────────────────────────┐
              ▼                         ▼                         ▼
     ┌─────────────────┐      ┌──────────────────┐      ┌──────────────────┐
     │ Google Shared    │      │ Resend (SMTP)    │      │ Cloudflare R2     │
     │ Drive (Material) │      │ e-mail transac.  │      │ (backup off-host) │
     └─────────────────┘      └──────────────────┘      └──────────────────┘

     Monitoramento: Laravel Pulse (in-app) + UptimeRobot (externo) +
                    Healthchecks.io (cron) + Sentry (erros back+front)
```

### Resumo das escolhas

| Área | Escolha |
|---|---|
| 1. Hospedagem | DigitalOcean Droplet, região São Paulo, 2vCPU/4GB |
| 2. Banco | Postgres 16 self-hosted no mesmo Droplet (Docker) |
| 3. Deploy | Coolify self-hosted no mesmo Droplet (zero-downtime, rollback 1-clique) |
| 4. Storage interno | Disco local (volume Docker) — sem gatilho de migração ainda |
| 5. Google Drive | Shared Drive institucional + Service Account dedicada |
| 6. SMTP | Resend |
| 7. Backup | `pg_dump` agendado (via Coolify) + upload para Cloudflare R2, dead-man's-switch via Healthchecks.io |
| 8. Domínio | Subdomínio de `estudioela.com` (ex.: `tear.estudioela.com`), sem delegação de zona inteira |
| 9. HTTPS | Let's Encrypt automático via Traefik/Coolify (Cloudflare como upgrade futuro opcional) |
| 10. CI/CD | GitHub Actions (já existente, inalterado) + webhook de deploy para Coolify |
| Monitoramento | Pulse + UptimeRobot + Healthchecks.io + Sentry |

---

## 13. Custo mensal estimado

| Item | Custo |
|---|---|
| Droplet DigitalOcean (São Paulo, 2vCPU/4GB) | US$24 |
| Coolify | US$0 (self-hosted) |
| Postgres | US$0 (embutido no Droplet) |
| Google Shared Drive | US$0 (dentro do Workspace já existente) |
| Resend (SMTP) | US$0 (dentro do free tier no volume atual) |
| Cloudflare R2 (backup) | US$0-1 (dentro do free tier para dumps pequenos) |
| Domínio | US$0 (subdomínio de ativo já existente) |
| HTTPS | US$0 (Let's Encrypt) |
| UptimeRobot / Healthchecks.io / Sentry | US$0 (free tiers) |
| **Total estimado** | **≈ US$24-25/mês** (~R$130/mês) |

Isso é deliberadamente enxuto: quase todo o custo está concentrado em um
único item (o compute), e todas as outras peças usam free tiers legítimos
para o volume atual — não é uma conta que "estoura" silenciosamente com
uso normal.

---

## 14. Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Único Droplet = ponto único de falha físico | Backup off-host (R2) + runbook de restore testado trimestralmente; aceitável no estágio atual (não é um SLA de 99,9% contratual) |
| Coolify como camada nova de operação | É Dockerizado e auto-atualizável; documentação ativa; se falhar, o `docker-compose.yml` original continua funcional por baixo (fallback para deploy manual do §3-A) |
| Dependência total do Google Drive para upload de Material | Já é uma decisão de produto (fora de escopo desta análise); mitigação de infra = monitorar erros do Pulse/Sentry especificamente para falhas de Drive |
| Crescimento inesperado de tráfego além do Droplet único | Gatilhos de migração já documentados por área (§2, §4, §9) — nenhuma escolha aqui é uma parede, todas têm caminho de upgrade incremental |

---

## 15. Gatilhos de evolução (quando reabrir esta arquitetura)

- **Banco:** migrar para Managed Postgres quando houver >1 incidente de
  operação de banco por trimestre, ou um 2º tenant real dependente de SLA.
- **Storage:** migrar arquivos internos para object storage (Spaces/R2)
  quando houver 2º nó de aplicação.
- **HTTPS/CDN:** ativar Cloudflare quando o produto passar a ter tráfego
  público relevante (ex.: página de marketing, múltiplas marcas externas)
  ou sofrer abuso/DDoS real.
- **Domínio:** domínio de produto dedicado quando `Marca` virar tenant
  externo vendido de fato (mudança de escopo de produto, não de infra).
- **Hospedagem:** reconsiderar Kubernetes/multi-nó só se o número de
  marcas/tenants crescer a ponto de um único Droplet não bastar nem em CPU
  vertical (upgrade de tamanho do Droplet é o primeiro passo antes disso,
  não uma migração de arquitetura).

---

## 16. Não incluído nesta sessão (por instrução explícita)

Nenhuma decisão acima foi implementada, nenhum recurso foi provisionado,
nenhum deploy foi feito, nenhum código foi alterado. Este documento é
input para decisão do responsável do projeto; a execução (se aprovada) é
trabalho de uma sessão separada, seguindo `TEAR_V2.5_GO_LIVE_CHECKLIST.md`
§4 (ordem de execução) já existente, adaptado às escolhas feitas aqui.
