> # ⛔ DOCUMENTO RECLASSIFICADO — PESQUISA PARA UMA FUTURA V3, NÃO EXECUTAR
>
> **Decisão do usuário em 2026-07-08**: a **V2 não é migração de infraestrutura**. A stack atual (GitHub Pages + Google Apps Script + Google Sheets + Google Drive) **permanece**. Supabase, Postgres, ETL, Next.js e a migração *strangler* descritos abaixo estão **suspensos** e preservados apenas como pesquisa para uma futura **V3**, a ser planejada só depois que a V2 estiver madura e estabilizada.
>
> **O que vale para a V2 é `docs/V2_ROADMAP.md` deste repositório.** Comece por `NEXT_AGENT.md` na raiz. Nada deste documento deve ser implementado.
>
> Preservação do trabalho já feito: repo `estudioela/plataforma`, tag `v3-research-parked`.

# V2 (histórico) — Especificação Técnica: Plataforma Jescri / Estúdio Elã

> Versão 0.1 (2026-07-08). Documento de arquitetura — nenhum código da V1 é alterado por este documento. A V1 (Apps Script + Google Sheets, deployment `@37`, commit `aa55252`) está **estabilizada e congelada**: só correções críticas até a V2 assumir.
>
> Fontes de verdade da V1 usadas como insumo: `CLAUDE.md`, `SYSTEM_TRUTH.md`, `SYSTEM_MAP.md`, `FLOW.md`, `docs/AUDITORIA_TECNICA_2026-07-07.md`, `SYSTEM_SCHEMA.md` (schema real da planilha, 2026-07-08) e a suíte de testes (`test/`, 163 testes) — que documenta o comportamento esperado de cada fluxo.

---

## 1. Por que uma V2 (motivação técnica honesta)

A V1 funciona e está protegida por testes, mas tem tetos estruturais que nenhuma evolução incremental remove:

1. **Google Sheets como banco**: sem transações, sem constraints, sem índices; qualquer editor humano pode corromper dados silenciosamente (toda a engenharia recente — resolução por nome, validação de célula, IDs estáveis — existe para mitigar exatamente isso).
2. **Apps Script como backend**: quotas de execução (6 min/execução, ~30 execuções simultâneas), sem staging real, deploy acoplado à conta Google, `clasp run` inviável (dono ≠ operador), logs limitados.
3. **Autenticação de baixa entropia por design** (cupom + prefixo de CNPJ) — aceitável para 10 influenciadoras, não para escala.
4. **Sem ambiente de homologação**: toda mudança testa contra produção.
5. **Operação da equipe = editar planilha crua**: sem trilha de auditoria, sem permissões por papel, sem validação na entrada.

## 2. Escala real e princípio diretor

Hoje: ~10 influenciadoras ativas, ~17 ativações/mês, ~1.000 linhas de briefing, 1 marca (Jescri), equipe de gestão de 1-2 pessoas. Mesmo projetando crescimento 10x (100 influenciadoras, algumas marcas), isso é **carga minúscula** para qualquer stack moderna.

**Princípio diretor: monólito modular simples, serviços gerenciados, zero infraestrutura própria.** Nada de microserviços, filas, Kubernetes — a complexidade operacional mataria um time deste tamanho. "Escalável" aqui significa: schema relacional correto, camadas separadas (dados/API/UI), e capacidade de crescer 10-100x sem re-arquitetura — não significa arquitetura distribuída.

## 3. Stack recomendada (decisão a ratificar)

| Camada | Escolha | Justificativa | Alternativa considerada |
|---|---|---|---|
| Banco | **PostgreSQL gerenciado (Supabase)** | Relacional, constraints/transações reais, RLS (row-level security) nativa para o portal, backups automáticos, free tier suficiente para anos nesta escala | Neon + auth separada (mais peças) |
| Backend + Front | **Next.js (App Router, TypeScript)** — um único app com 3 áreas: API, painel admin, portal | Um deployável só; SSR; o ecossistema onde agentes de IA trabalham melhor; tipagem ponta a ponta | Backend separado (NestJS/FastAPI) + SPA — mais peças sem ganho nesta escala |
| Auth | **Supabase Auth** — e-mail + senha (magic link opcional) para influenciadoras; papéis `admin`/`influencer` | Elimina a senha-prefixo-de-CNPJ; sessões/refresh/reset prontos | Auth.js (mais código próprio) |
| Arquivos | **Google Drive mantido** (via service account, pasta por influenciadora — estrutura atual preservada) | A equipe já opera revisão/aprovação dentro do Drive; migrar arquivos não traz ganho agora. Abstraído atrás de uma interface `StorageProvider` para troca futura (ex. Supabase Storage/R2) | Migrar tudo para object storage (custo de migração sem benefício imediato) |
| Hospedagem | **Vercel** (free/hobby → pro se precisar) | Deploy por git push, preview por PR (= staging de verdade, que a V1 nunca teve) | Cloudflare Pages/Workers |
| E-mail transacional | Resend (ou SMTP do Workspace) | Convites, reset de senha, notificações | — |
| Integrações | BrasilAPI (CEP) e BRComerce (rastreio) mantidas, chamadas do backend | Mesmos contratos da V1 | — |

**Custo estimado**: R$ 0/mês no início (free tiers de Supabase + Vercel); teto realista ~US$ 45/mês se crescer para os planos pagos.

## 4. Modelo de dados (PostgreSQL)

Mapeamento direto das abas da V1 → tabelas, com as correções estruturais que a planilha nunca pôde ter:

```
users              (id uuid PK, email UNIQUE, role admin|influencer, created_at, ...)
                   -- auth gerenciada pelo Supabase Auth; esta tabela é o perfil.

influencers        (id uuid PK, user_id FK→users NULL até o convite ser aceito,
                    influ_key UNIQUE,          -- chave humana legada, preservada p/ migração
                    cupom UNIQUE, razao_social, cnpj, email, chave_pix,
                    cep, rua, numero, complemento, bairro, cidade, uf,
                    valor_total_centavos int,  -- dinheiro SEMPRE em centavos/int
                    qtd_reels int, qtd_carrossel int, qtd_stories int,
                    looks_qtd int, canais_uso_imagem, prazo_uso_imagem,
                    influ_sheet_url, pasta_drive_id,
                    status active|inactive, created_at, updated_at)

campaigns          (id uuid PK, brand text DEFAULT 'JESCRI', month int, year int,
                    UNIQUE(brand, month, year),    -- a colisão mês/ano vira impossível
                    resumo text, status draft|active|closed, created_at)

briefings          (id uuid PK, campaign_id FK, influencer_id FK,
                    UNIQUE(campaign_id, influencer_id),
                    look_reel, look_carrossel, look_stories_1, look_stories_2,
                    sobre_reel, sobre_carrossel, sobre_stories_1, sobre_stories_2,
                    pasta_drive_link)

activations        (id uuid PK, campaign_id FK, influencer_id FK, briefing_id FK,
                    formato reel|carrossel|stories_1|stories_2,
                    data_ativacao timestamptz, data_aprovacao timestamptz,  -- calculada, mas armazenada
                    status open|awaiting_material|in_review|approved|changes_requested|posted,
                    archived_at timestamptz NULL)  -- arquivar = flag, NUNCA mover linha

activation_files   (id uuid PK, activation_id FK, drive_file_id, nome, mime, tamanho,
                    uploaded_at)                   -- 1:N de verdade, fim do link concatenado com \n

payments           (id uuid PK, campaign_id FK, influencer_id FK,
                    tipo mensal|extra|ugc, valor_centavos int, chave_pix,
                    status open|awaiting|approved|paid, paid_at timestamptz,
                    mensagem_pix text, archived_at timestamptz NULL)

logistics          (id uuid PK, campaign_id FK, influencer_id FK,
                    endereco_snapshot text,        -- endereço no momento do envio (imutável)
                    rastreio_url, data_envio, status_revisao, status_logistica,
                    delivered_at, archived_at timestamptz NULL)

audit_log          (id, actor_user_id, entity, entity_id, action, diff jsonb, at timestamptz)
                   -- o que o onEdit silencioso nunca deu: quem mudou o quê, quando.

legacy_import      (id, source_sheet, source_row jsonb, imported_at, target_entity, target_id)
                   -- rastreabilidade completa da migração: toda linha importada guarda a origem.
```

Regras estruturais que substituem gambiarras da V1:
- **Histórico**: `archived_at` em vez de mover linhas entre abas — elimina `arquivarGenerico` e toda a classe de bug de cópia posicional.
- **Datas**: `timestamptz` nativo — elimina a família inteira de bugs de `dd/MM/yyyy` vs `M/D/YYYY`.
- **Dinheiro**: inteiro em centavos — elimina float e "R$ 720,00" como string.
- **Status**: enums do banco — elimina validação de célula como única guarda.
- **`calcularDataAprovacao`** (D-7, empurrado p/ segunda se cair sex/sáb/dom): reimplementada como função pura no backend, com os testes da V1 portados.

## 5. Módulos da aplicação

1. **Auth & Contas** — login influenciadora (e-mail+senha; convite por e-mail na migração), login admin, reset de senha, sessão JWT (Supabase). RLS: influenciadora só lê/escreve as próprias linhas.
2. **Portal da Influenciadora** (substitui `Index.html`) — mesmas 7 telas da V1: pendências por período, briefing, upload de material (resumable, direto ao Drive via URL assinada pelo backend), pagamentos (tracker), histórico, perfil (5 campos editáveis). O contrato funcional é o que a suíte de testes da V1 documenta.
3. **Painel Admin (ERP)** (substitui o menu da planilha) — CRUD de influenciadoras, ciclo mensal (gerar campanha: briefings+ativações+pagamentos+logística por influenciadora ativa), aprovação de material (fila "em revisão" → aprovado/ajustes/postado), pagamentos (marcar pago; mensagem PIX), logística (rastreios BRComerce), relatórios simples.
4. **API** — REST (rotas Next.js), autenticada por sessão; endpoints de serviço para o formulário público de cadastro (substitui `onFormSubmit`) com enriquecimento de CEP (BrasilAPI).
5. **Integrações** — BRComerce (job agendado de rastreio, Vercel Cron), BrasilAPI, Drive (service account), e-mail transacional.
6. **Auditoria & Observabilidade** — `audit_log` em toda mutação; Sentry (free) para erros; logs estruturados.
7. **Exportação/ponte Sheets** (transitório) — exportação das tabelas para uma planilha de leitura, para a equipe que quiser continuar *vendo* dados em Sheets durante a transição (leitura, nunca escrita).

## 6. Estratégia de migração (strangler, 4 fases, sem big bang)

**Fase 0 — Fundação (sem usuários)**
Repositório novo (`estudioela/plataforma` ou monorepo aqui em `v2/` — decisão do usuário), schema Postgres, CI (lint+testes+preview deploy), seeds. **ETL inicial**: importador que lê a planilha real (via API do Sheets, com `legacy_import` registrando cada linha) e popula o banco. O `SYSTEM_SCHEMA.md` é o contrato de entrada. Roda quantas vezes for preciso (idempotente por `influ_key`/`ID` de ativação — os UUIDs que acabamos de criar na planilha viram as PKs, de graça).

**Fase 1 — Portal V2 em paralelo (Sheets ainda é a fonte de verdade)**
Portal novo no ar em subdomínio de teste (`beta.portal.estudioela.com`), lendo do Postgres, sincronizado da planilha por job (15 min). Upload de material já escreve no Drive E marca a ativação no banco + **write-back na planilha** (via API do Sheets) para o ERP continuar funcionando. Validação com 1-2 influenciadoras reais convidadas. *Risco controlado: se a V2 falhar, o portal V1 continua intacto na URL oficial.*

**Fase 2 — Cutover do Portal**
`portal.estudioela.com` passa a apontar para a V2 (troca do redirecionador na branch `pages-portal` — 1 commit, reversível em 1 commit). Sheets ainda é onde a equipe opera; write-back mantém a planilha viva. Critério de saída: 1 ciclo mensal completo sem incidente.

**Fase 3 — Painel Admin e inversão da fonte de verdade**
Admin V2 assume o ciclo mensal, aprovações e pagamentos. A direção da sincronização inverte: Postgres é a fonte, a planilha vira **export somente-leitura** (módulo 7). `onEdit`/menu do Apps Script são desativados gradualmente por módulo migrado.

**Fase 4 — Descomissionamento**
Apps Script reduzido a um aviso de redirecionamento; planilha arquivada como histórico; QA Shadow aposentado (substituído por testes E2E da V2). Este repositório permanece como arquivo da V1.

**Reversibilidade**: até o fim da Fase 3, cada passo tem rollback de 1 commit (redirect) ou de configuração (direção do sync). Nenhum dado é apagado em nenhuma fase.

## 7. Testes e qualidade (aproveitando o que já existe)

- Os **163 testes da V1 são a especificação executável** dos fluxos: cada regra testada (lockout de login, seleção de briefing por formato, tracker de pagamento, filtro de histórico por ano, D-7 útil, etc.) vira caso de teste da V2 (Vitest para unidade, Playwright para E2E).
- **Testes de paridade na migração**: para cada influenciadora, comparar a resposta do portal V1 (via contrato conhecido) com a da V2 sobre os mesmos dados importados.
- CI em cada PR (padrão já estabelecido nesta base com GitHub Actions).

## 8. Segurança e conformidade (LGPD)

O banco carregará dados pessoais reais (CNPJ, endereço, PIX). Obrigações mínimas na V2: criptografia em repouso (padrão Supabase), RLS por influenciadora, trilha de auditoria de acesso admin, política de retenção definida, backups com restauração testada, e fim das senhas derivadas de dado público (CNPJ) — troca por senha própria + reset por e-mail no primeiro acesso (convite).

## 9. Roadmap de implementação

| Fase | Entregas | Estimativa* |
|---|---|---|
| 0 — Fundação | Repo, schema, CI, ETL da planilha real, seeds | 1-2 semanas |
| 1 — Portal beta | Auth, 7 telas do portal, upload→Drive, sync Sheets→PG + write-back, beta com 2 influenciadoras | 3-4 semanas |
| 2 — Cutover portal | Troca do redirect, monitoramento, 1 ciclo mensal de observação | 1 semana + 1 ciclo |
| 3 — Admin | Ciclo mensal, aprovação, pagamentos, logística, inversão da fonte de verdade | 3-4 semanas |
| 4 — Descomissionamento | Export-only, desativação do Apps Script, arquivamento | 1 semana |

*Estimativas em ritmo de sessões de trabalho como as atuais (agente + revisão sua), não de um time em tempo integral. Fases 1 e 3 são as que carregam o risco real.

## 10.a Revisão arquitetural da Fase 0 (2026-07-08 — aplicada)

Revisão completa do modelo vs. regras de negócio da V1 (163 testes + schema real da planilha como referência). Resultado: ~95% de cobertura no schema inicial; ajustes aplicados na migration `0002_revisao_arquitetural.sql` do repo `estudioela/plataforma`:

1. **Módulo Contratos** (lacuna descoberta na revisão): a V1 gera contratos via add-on **AutoCrat** (job "[JESCRI] CONTRATO", template Google Doc, campos da BASE como `VALOR_TOTAL_EXTENSO`/`CIDADE_ASSINATURA`/`DATA_ASSINATURA`) — funcionalidade que nem a auditoria V1 cobriu por não ser código do projeto. V2: tabela `contracts` + campos de assinatura em `influencers`; o AutoCrat permanece funcional na planilha até a Fase 3 (o export precisa incluir os campos derivados).
2. `influencers.email` NOT NULL UNIQUE (vira o login); dry-run do ETL reporta ausentes/duplicados antes de importar.
3. Idempotência universal do ETL via `legacy_import.source_hash` (resolve pagamentos, que não têm UUID na planilha).
4. Reconciliação da dupla entrada de datas da V1 (`ATIVAÇÕES.DATA_ATIVACAO` vs `BRIEFING.DATA_*`): ATIVAÇÕES vence; divergências são registradas, não gravadas.
5. `updated_at` automático (trigger), índice único parcial impedindo pagamento mensal duplicado, `app_settings` substituindo o `PropertiesService`.
6. **Coluna `SIM/NÃO` declarada legado obsoleto** (BASE col 30, BRIEFING col 22): verificação completa — zero referências em código/testes/AutoCrat da V1; não existe nem será importada na V2. Ressalva: fórmulas em células da planilha não são verificáveis por código.

## 10. Decisões em aberto (ratificar antes da Fase 0)

1. **Stack** (seção 3) — recomendo Supabase + Next.js + Vercel; alternativas anotadas.
2. **Repositório**: novo repo dedicado (recomendado — este vira arquivo da V1) ou diretório `v2/` aqui.
3. **Arquivos no Drive**: manter (recomendado) ou migrar para object storage já na V2.
4. **Login das influenciadoras**: e-mail+senha com convite (recomendado) ou manter cupom+senha na transição para reduzir atrito.
5. **Multi-marca**: o campo `brand` em `campaigns` deixa a porta aberta — confirmar se atender outras marcas além da Jescri é um objetivo real (afeta pouco agora, muito depois).
