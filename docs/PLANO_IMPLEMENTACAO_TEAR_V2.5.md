# TEAR V2.5 — Plano de Implementação

Data: 2026-07-20
Papel do autor: Tech Lead de execução (agente), a pedido do responsável
do projeto.
Status: **plano de execução. Nenhum código foi escrito, nenhuma
migration criada, nenhum arquivo de aplicação alterado para produzir
este documento.**

**Escopo:** exclusivamente `tear-v2-app/` (Laravel 13 + React/Vite). Não
toca no Portal legado GAS (`src/`) nem no seu domínio soberano
(`CONTRATO_SOBERANO.md`) — trilhas de decisão separadas.

## 0. Fontes

Este plano não introduz nenhuma ideia nova. É a conversão em sequência
executável de quatro documentos já produzidos e aceitos como fonte de
verdade:

1. `docs/ROADMAP_MESTRE_TEAR_V2.md` — estabilização concluída (Parte 1) e
   roadmap de execução Fase 0-6 sem lente SaaS (Parte 2).
2. `docs/HANDOFF_PRODUCTIZACAO_TEAR_V2.md` — estado técnico atual do MVP
   e prioridades sugeridas na transição.
3. `docs/ESPECIFICACAO_FUNCIONAL_TEAR_V2.5.md` — especificação de produto
   campo a campo, regra a regra, com priorização P0/P1/P2 própria.
4. `TEAR_V2.5_PRODUCTIZACAO_ROADMAP.md` (raiz do repo) — plano
   estratégico com lente SaaS (Fases 1-4), decisões arquiteturais e lista
   "o que não fazer", referenciado pelos três documentos acima como fonte
   de detalhe por fase.

Onde os documentos-fonte divergem em nomenclatura de fase, este plano
adota a numeração de sprint própria e indica a equivalência.

---

## 1. Estado atual

### O que existe e funciona

Núcleo operacional completo, validado manualmente no navegador e por 84
testes automatizados de backend: Cadastro/Parceiras → Aprovação →
Campanhas → Participações → Briefings → Materiais (upload + aprovação) →
Pagamentos (`PENDENTE → APROVADO → PAGO`). Lint frontend limpo, build de
produção ok.

Arquitetura: React 19 + Vite + React Router no frontend (CSS Modules,
sem lib de estado global); Laravel 13 + PHP 8.3 + Sanctum (sessão via
cookie, mesma origem) + Spatie Permission (RBAC por papel) no backend;
SQLite em desenvolvimento; upload de mídia via abstração `Storage`
(Google Drive real implementado em código, sem credenciais — fallback
local ativo).

### O que está estável

- Padrão de Form Requests consistente em todos os módulos.
- Camada de API RESTful coerente, fácil de estender por convenção.
- Máquinas de estado (`Parceira` Ativa/Inativa, `Material`
  aprovar/reprovar, `Pagamento` PENDENTE→APROVADO→PAGO) preservam as
  regras já validadas na V1 legada (RN-01, RN-06, RN-07, RN-09/RN-11).

### Limitações atuais (lacunas estruturais, não bugs)

- **Nenhuma superfície de acesso para quem não é `ADMIN`.** O papel
  `INFLUENCIADORA` existe como seed, sem tela, rota ou login.
- **`Parceira.user_id` é scaffold morto.** Coluna e relação Eloquent já
  declaradas, nenhum controller ou fluxo as usa.
- **RBAC de leitura não existe.** Toda rota `GET` só exige
  `auth:sanctum` — qualquer usuário autenticado lê qualquer dado do
  sistema, de qualquer entidade.
- **Sem multi-tenant.** Nenhuma tabela tem `organization_id`; o sistema
  assume implicitamente uma única operação dona de tudo.
- **Módulos placeholder honestos:** Logística, Documentos, Histórico,
  Perfil — sem fluxo real em nenhum lugar do sistema.
- **Ausências completas:** contratos, consentimento LGPD, produto/
  variante/permuta, automação/IA, billing.
- **Cadastro básico, sem enriquecimento:** sem busca automática de CEP,
  sem validação formal de CNPJ/CPF/telefone, sem medidas/tamanhos, sem
  histórico de alteração.
- **Briefing menos granular que a V1**: hoje é um registro genérico
  1:1 por participação; a V1 tinha até 4 blocos por formato.
- **`APP_LOCALE=en`** — mensagens de validação em inglês num produto em
  português.

---

## 2. Estratégia de implementação

### Ordem lógica

```
Sprint 1 — Fundação de dados e acesso
        ↓
Sprint 2 — Portal/Experiência da Influenciadora
        ↓
Sprint 3 — Operação interna (produto, logística, contratos)
        ↓
Sprint 4 — Inteligência operacional
        ↓
Sprint 5 — Preparação SaaS
```

Migração do legado (Google Sheets) **não ocupa um sprint próprio**: os
dois roadmaps-fonte concordam que não é questão de produtização, é
tarefa pontual de dado histórico. Fica marcada como trabalho paralelo,
recomendada para correr ao lado do Sprint 3 ou 4, sem bloquear nem ser
bloqueada por eles (ver Sprint 3).

### Por que essa ordem

- **RBAC de leitura por papel e por dono do registro é o bloqueador
  universal.** Está citado como pré-requisito em todos os quatro
  documentos-fonte. Nenhum sprint que exponha uma rota nova a um papel
  além de `ADMIN` pode começar antes dele — por isso abre o Sprint 1 em
  vez de aparecer solto ou implícito.
- **Cadastro antes de portal**: não se autentica quem ainda não existe
  como entidade completa (dado + consentimento capturado). Ativar
  `Parceira.user_id` é pré-requisito técnico direto do Sprint 2.
- **Briefing granular entra no Sprint 1, não no Sprint 2**: é mudança de
  modelo de dado (1:1 → 1:N por tipo de conteúdo), e a especificação é
  explícita — "sem ele a influenciadora não tem o que consumir no Portal"
  (ESPECIFICACAO_FUNCIONAL §18, P0). Faz o Sprint 2 nascer já sobre o
  modelo certo, em vez de migrar o dado no meio do sprint de portal.
- **Portal antes de operação de produto**: a escolha de permuta e o
  consumo de briefing acontecem pela influenciadora autenticada — sem
  Sprint 2 pronto, Sprint 3 não tem quem execute a ponta operacional.
- **Contratos depois de produto/permuta**: contrato referencia produto e
  permuta escolhidos; gerar contrato sobre um modelo de produto ainda
  instável obriga reemissão depois.
- **Inteligência (IA/extração de URL) só depois de dado estruturado
  existir**: automatizar sobre produto/variante ainda mudando amplifica
  erro em vez de eliminá-lo — mesmo argumento nos quatro documentos.
- **SaaS por último**: multi-tenant sobre um modelo de negócio ainda
  mudando gera retrabalho caro depois de haver clientes reais. Nenhuma
  migration de `organization_id` deve ser escrita antes da decisão de
  estrutura multiempresa (§6 deste plano) estar fechada por escrito.

---

## 3. Sprints sugeridas

### Sprint 1 — Fundação de dados e acesso

**Objetivo:** fechar os bloqueadores de segurança e enriquecer o
cadastro da influenciadora a ponto de suportar autenticação própria e
consentimento de titular de dado.

**Entregas:**
- RBAC de leitura por papel **e por dono do registro** em toda rota
  `GET` (hoje só `auth:sanctum`, sem checagem de papel ou posse).
- Ativação do vínculo `Parceira.user_id`: decidir e implementar quando o
  `User` é criado (no cadastro público? só na aprovação?) e como a
  credencial inicial é entregue (convite por e-mail recomendado, evitar
  senha provisória visível em tela).
- `APP_LOCALE=pt_BR` nas mensagens de validação.
- Cadastro avançado: busca automática de endereço por CEP (ViaCEP ou
  BrasilAPI, com falha não bloqueante — campos ficam em branco para
  preenchimento manual); validação formal de CNPJ (e decisão pendente de
  aceitar CPF, ver §6); máscara e validação de telefone; padronização de
  formato de data.
- Tabela de medidas/tamanhos versionada (sutiã tamanho/numeração/taça,
  calcinha, linha noite) — não obrigatória no cadastro inicial, só
  quando a influenciadora entra em campanha com envio de produto.
- Consentimento LGPD + histórico de alteração campo a campo: diff antes
  de salvar, aceite explícito, registro de `user_id`/timestamp/IP
  (IP só quando a alteração parte do Portal, não do painel admin) por
  campo alterado, na mesma transação da alteração.
- Reorganização de `Briefing` de 1:1 para 1:N por tipo de conteúdo
  (Feed, Reels, Stories, TikTok, UGC), com instruções, prazo,
  referências e observações por item; incluir coluna de quantidade
  contratada para TikTok e UGC (hoje só `reels_qtd`/`carrossel_qtd`/
  `stories_qtd` existem).

**Arquivos/módulos impactados:** middleware e policies de autorização
Laravel; `Parceira` (model, controller, `StoreParceiraRequest`);
migrations novas (`medidas_influenciadora` ou equivalente, `consents`,
`influencer_history`); `Briefing` (model, migration, controller,
formulário frontend correspondente); `config/app.php`
(`APP_LOCALE`)/`.env`.

**Dependências:** nenhuma — é o ponto de partida.

**Critério de conclusão:** nenhuma rota `GET` retorna dado fora do
escopo do papel/dono autenticado (validado por teste automatizado, não
só inspeção manual); `Parceira.user_id` populado no fluxo real de
cadastro/aprovação; cadastro completo end-to-end com CEP automático,
validação de documento e consentimento registrado com prova; briefing
gravável por tipo de conteúdo.

---

### Sprint 2 — Portal/Experiência da influenciadora

**Objetivo:** dar à influenciadora um canal autenticado e próprio:
login, campanhas ativas, briefing, envio de material, histórico.

**Entregas:**
- Fluxo de login para o papel `INFLUENCIADORA` (reaproveitando Sanctum,
  sem nova biblioteca).
- Regra de visibilidade de campanha aplicada no backend: toda rota
  consumida por `INFLUENCIADORA` deriva `parceira_id` exclusivamente da
  sessão (nunca de parâmetro do cliente) e filtra por
  `participacoes_na_campanha.status = 'ATIVA' AND parceira_id = <sessão>`.
  Rotas auto-escopadas (`GET /me/participacoes`), não genéricas por ID.
- Frontend: área própria "Portal da Influenciadora", com layout e rotas
  distintas do `AppShell` administrativo — não reaproveitar as mesmas
  telas.
- Fluxos mínimos: login, listar/detalhar campanhas e participações
  ativas próprias, ler briefing por tipo de conteúdo, enviar material,
  ver histórico de materiais e pagamentos próprios, edição limitada de
  perfil (sujeita ao consentimento/histórico do Sprint 1).

**Arquivos/módulos impactados:** rotas e controllers de autenticação;
novos endpoints `GET /me/*`; `participacoes_na_campanha` (query de
visibilidade); novo conjunto de rotas/telas frontend fora do `AppShell`
atual.

**Dependências:** Sprint 1 completo — RBAC de leitura e
`Parceira.user_id` são pré-requisitos explícitos; sem eles, abrir login
para `INFLUENCIADORA` expõe todo o sistema.

**Critério de conclusão:** uma influenciadora real loga, vê só as
próprias campanhas/briefings/materiais/pagamentos, envia material pelo
próprio portal; existe teste automatizado de isolamento entre duas
parceiras distintas (uma nunca acessa dado da outra, nem por URL
direta).

---

### Sprint 3 — Operação interna (produto, logística, contratos)

**Objetivo:** preencher os módulos hoje placeholder com demanda
operacional real: produto/variante, permuta, ficha logística,
documentos e contratos.

**Entregas:**
- Modelo de produto/variante/estoque e regra de disponibilidade (schema
  físico já detalhado em `docs/ROADMAP_MESTRE_TEAR_V2.md` Parte 2, Fase
  3 — não redesenhar).
- Validação de variante: bloquear salvamento de escolha de produto sem
  cor/tamanho confirmados; checar disponibilidade no momento da
  confirmação, não da extração/cadastro do produto.
- Permutas: janela mensal de escolha pela influenciadora autenticada
  (duração pendente, ver §6), estado "solicitada" até confirmação,
  comportamento ao expirar pendente de decisão (§6).
- Ficha de retirada automática (foto, referência/SKU, produto/variante,
  nome e endereço da influenciadora), gerada quando o look da campanha é
  confirmado.
- Contratos: templates editáveis pelo ADMIN sem deploy, placeholders
  vinculados a Cadastro + Campanha/Participação, geração de PDF,
  integração com provedor de assinatura digital (fornecedor pendente,
  §6), versionamento imutável (nova geração nunca reescreve contrato já
  emitido).
- Histórico/auditoria como funcionalidade transversal (log de alteração
  por entidade), não tela isolada.
- Modelo de Assessoria como campo ou entidade (decisão pendente entre
  Modelo A/B, §6), sem portal próprio nesta fase.

**Trabalho paralelo (não bloqueia nem é bloqueado pelo restante do
sprint):** migração do histórico legado (Google Sheets) como registros
somente leitura, marcados `origem: legado` — ativações, pagamentos e
conteúdos já concluídos; não há conceito de produto na planilha legada,
então nada a migrar nesse ponto específico. Escopo exato pendente (§6).

**Arquivos/módulos impactados:** novas tabelas `products`,
`product_variants`, `stock`, `permutas`, `shipments`, `shipment_items`,
`contract_templates`, `contracts`, `contract_signatures`,
`contract_events`; extensão de `parceiras` ou nova tabela `assessorias`;
importadores de legado (idempotentes, por planilha) + tabela `imports`.

**Dependências:** Sprint 2 (a escolha de permuta é feita pela
influenciadora autenticada). Se a operação decidir manter a escolha de
permuta manual pelo ADMIN nesta fase, a dependência de Sprint 2 cai para
essa entrega específica — decisão de escopo a confirmar no início do
sprint, não por omissão.

**Critério de conclusão:** operação cadastra produto, disponibiliza em
campanha, recebe escolha/confirmação de permuta, gera ficha logística,
gera e envia contrato para assinatura — tudo pela plataforma, sem sair
para planilha, WhatsApp ou Word.

---

### Sprint 4 — Inteligência operacional

**Objetivo:** automações de alto valor sobre a base já estruturada pelo
Sprint 3: leitura de URL de produto, extração assistida de dados,
revisão humana obrigatória antes de qualquer efeito colateral.

**Entregas:**
- Fila de jobs real (tabela `jobs` do Laravel já existe no schema
  padrão, mas nenhum worker/dispatch está em uso hoje).
- Serviço de scraping/extração de URL de produto (foto, nome SEO bruto,
  cor, variante, referência/SKU).
- Regra de nome operacional: nome SEO extraído é guardado só como
  referência/auditoria, nunca usado como nome operacional; nome
  operacional é sempre editável manualmente, a extração é sugestão, não
  fonte de verdade.
- Painel de revisão humana da extração antes de qualquer gravação
  definitiva (a extração popula um formulário de conferência, nunca
  grava direto).
- Provedor de IA para normalização de dado extraído; log de execução das
  automações.

**Arquivos/módulos impactados:** `automation_jobs`, `url_extractions`,
`ai_runs`; integração com o modelo de produto/variante do Sprint 3
(consumidor, não redesenho).

**Dependências:** Sprint 3 concluído — automatizar sobre modelo de
produto ainda instável amplifica erro em vez de eliminá-lo.

**Critério de conclusão:** pelo menos um fluxo de automação em produção,
com métrica de taxa de acerto acompanhada e reversível a qualquer
momento.

---

### Sprint 5 — Preparação SaaS

**Objetivo:** transformar o mono-tenant implícito de hoje em
multi-tenant real — múltiplas organizações operando isoladas na mesma
instância.

**Entregas:**
- Entidade raiz `organizations`; `organization_id` obrigatório em toda
  tabela de negócio existente até aqui (`parceiras`, `marcas`,
  `campanhas`, `participacoes`, `briefings`, `materiais`, `pagamentos`,
  `products`, `contracts` etc.).
- Vínculo de usuário a organização (`users.organization_id` ou tabela
  pivô, se um usuário puder pertencer a mais de uma organização —
  decisão a fechar antes da migration).
- Global scope/middleware de resolução de tenant aplicado a **toda**
  query por padrão, nunca opt-in por controller.
- Billing: plano, limite de uso, integração com provedor de cobrança
  recorrente, bloqueio/degradação por inadimplência.
- Onboarding autosserviço: nova organização se cadastra e provisiona o
  próprio espaço sem intervenção da equipe TEAR.
- Decisões de infraestrutura já recomendadas para este momento (não
  antes): Postgres em vez de SQLite; avaliação de S3/R2 em vez de Google
  Drive para isolamento de armazenamento por organização.

**Arquivos/módulos impactados:** migration de `organizations` +
`organization_id` em cascata; policies/global scopes Spatie Permission
compostos por papel **e** organização; configuração de banco/driver de
armazenamento por ambiente.

**Dependências:** Sprints 1-4 maduros em operação real. Nenhuma
migration de `organization_id` deve ser escrita antes da decisão de
estrutura multiempresa (§6) estar fechada por escrito.

**Critério de conclusão:** uma segunda organização de teste opera na
mesma instância sem ver nenhum dado da primeira (validado por teste
automatizado de isolamento); cobrança automatizada funcional para pelo
menos um plano; onboarding de nova organização sem intervenção manual.

---

## 4. Priorização

Consolidado das priorizações de `docs/ESPECIFICACAO_FUNCIONAL_TEAR_V2.5.md`
§18 e `TEAR_V2.5_PRODUCTIZACAO_ROADMAP.md` §4 — as duas fontes
concordam entre si; a lista abaixo funde ambas.

### P0 — necessário para operação
- RBAC de leitura por papel e por dono do registro.
- Ativação do vínculo `Parceira.user_id`.
- Locale `pt_BR` nas mensagens de validação.
- Cadastro avançado (CEP automático, validação de CNPJ/CPF/telefone).
- Consentimento LGPD + histórico de alterações campo a campo.
- Regra de visibilidade de campanha por participação ativa (backend).
- Briefing reorganizado por tipo de conteúdo.
- Sprint 2 completo (login/Portal da Influenciadora).

### P1 — alto valor, não bloqueia uso atual como produto interno
- Tamanhos/medidas de vestuário.
- Produto/variante e validação de variante, sem a camada de extração
  automática.
- Logística e ficha de retirada automática.
- Permutas.
- Contratos — geração e template editável, mesmo sem assinatura digital
  integrada.
- Assessoria como campo/entidade de cadastro, sem portal próprio.
- Histórico legado (migração somente leitura).

### P2 — evolução futura
- Escolha inteligente de produto via extração de URL.
- Assessoria com portal/login próprio.
- Métricas com integração automática a redes sociais.
- Provedor de assinatura digital totalmente integrado (webhook de
  status).
- Preparação SaaS completa (multi-tenant, billing, onboarding
  autosserviço).
- 2FA, dashboards analíticos avançados, integrações de comunicação
  (e-mail transacional, WhatsApp oficial).

---

## 5. Riscos

### Técnicos
- **RBAC esquecido em algumas rotas.** Mesma lacuna já observada no MVP
  (leitura sem escopo). Mitigação: tratar "toda query de
  `INFLUENCIADORA` filtra por `parceira_id` própria" como regra de
  arquitetura testada (duas parceiras reais, isolamento validado), não
  detalhe de implementação opcional.
- **Concorrência de escrita em SQLite** aparece exatamente quando duas
  influenciadoras enviam material ao mesmo tempo (Sprint 2 em diante) —
  migrar para Postgres antes do Portal ir a usuário real evita esse
  limite, não depois que aparecer em produção.
- **Extração de IA (Sprint 4) errando silenciosamente** e propagando erro
  para contrato/logística. Mitigação: revisão humana obrigatória antes
  de qualquer efeito colateral, medir taxa de acerto antes de remover a
  revisão.
- **Multi-tenant (Sprint 5) com vazamento de dado entre organizações** —
  maior risco técnico do roadmap inteiro. Mitigação: global scope
  automático em toda query, nunca opt-in; teste de isolamento
  obrigatório antes de considerar a fase concluída.
- **Divergência de grafia entre `INFLU_KEY` (legado) e `nome` (chave
  atual de `Parceira`)** pode quebrar correspondência automática na
  migração de histórico — exige revisão manual, não join automático 1:1.

### De negócio
- **Contrato sem revisão jurídica prévia das cláusulas** é risco legal,
  não só técnico — bloqueia o critério de conclusão do Sprint 3 até
  revisão do jurídico.
- **Expor edição de dado pessoal pela influenciadora (Sprint 2) sem
  consentimento capturado (Sprint 1)** é a mesma classe de risco
  jurídico que RBAC sem isolamento — por isso Sprint 1 precede Sprint 2
  sem exceção.
- **Replicar o legado GAS célula a célula** em vez de reinterpretar como
  fluxo de negócio (Sprint 3, produto/logística) reproduz a mesma dívida
  que o próprio roadmap mestre já evita conscientemente na transição
  V1→V2.

### Dependências externas
- Provedor de assinatura digital (Sprint 3) — decisão e contratação fora
  do controle da equipe técnica.
- Serviço de CEP (ViaCEP/BrasilAPI, Sprint 1) e futuro provedor de IA
  (Sprint 4) — indisponibilidade não pode bloquear o fluxo principal
  (regra não-funcional já herdada da V1: falha de integração externa
  nunca impede salvar o dado principal).
- Futuro provedor de cobrança recorrente (Sprint 5, ex. Stripe).

---

## 6. Decisões que precisam de aprovação

Nenhuma destas deve ser assumida por omissão. Consolidado de
`docs/ROADMAP_MESTRE_TEAR_V2.md` §5,
`docs/ESPECIFICACAO_FUNCIONAL_TEAR_V2.5.md` §17 e
`TEAR_V2.5_PRODUCTIZACAO_ROADMAP.md` §5-6:

1. **CPF como alternativa a CNPJ** no cadastro (Sprint 1) — é
   necessidade real da operação hoje?
2. **Janela de escolha de permuta** (Sprint 3): quantos dias, e o que
   acontece ao expirar sem escolha (fallback automático vs. manual).
3. **Escopo exato da migração do histórico legado** (Sprint 3, trabalho
   paralelo): quais abas entram, quais campos são obrigatórios, o que
   pode ser descartado.
4. **Provedor de assinatura digital** para contratos (Sprint 3) —
   Clicksign, D4Sign, DocuSign, ZapSign ou outro.
5. **Modelo de Assessoria** (Sprint 3) — campo simples vs. entidade
   própria — depende de dado operacional real (quantas influenciadoras
   têm assessoria hoje, se compartilham a mesma assessoria).
6. **Prioridade do consentimento LGPD**: este plano trata como P0 (já
   herdado da especificação funcional) — confirmar se o jurídico
   concorda ou se pode permanecer P1.
7. **Regras contratuais**: cláusulas obrigatórias, versões por tipo de
   campanha, prazo de vigência, política de rescisão (Sprint 3).
8. **Regras de aprovação interna**: quem aprova campanha, envio e
   contrato — com ou sem etapa dupla (Sprint 3).
9. **Política de LGPD**: tempo de retenção, direito ao esquecimento,
   exportação de dados (Sprint 1 em diante).
10. **Perfis e permissões**: quais papéis existem além de `ADMIN` e
    `INFLUENCIADORA` (ex. `GESTOR_MARCA`, financeiro) e o que cada um vê
    — hoje `GESTOR_MARCA` é seed sem uso; Portal da Marca não tem fase
    própria definida.
11. **Estrutura multiempresa** (Sprint 5): confirmar por escrito antes
    da primeira migration de `organization_id` — recomendação técnica já
    registrada é schema único com `organization_id` em toda tabela
    (Laravel global scopes), reavaliar só se cliente concreto exigir
    isolamento físico.
12. **Critério de desligamento do legado**: quando o Google Sheets vira
    read-only definitivo.

---

Nenhum código foi escrito, nenhuma migration criada e nenhuma
arquitetura alterada para produzir este documento. Este plano é o
insumo de entrada para a próxima sessão de execução, seguindo o fluxo
obrigatório do projeto (Auditoria → Plano → Execução → Validação →
Commit) a partir do Sprint 1.
