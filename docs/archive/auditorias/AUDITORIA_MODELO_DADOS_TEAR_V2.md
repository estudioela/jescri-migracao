# TEAR V2 — Auditoria do Modelo de Dados

Data: 2026-07-20
Papel do autor: Arquiteto de Dados (agente), a pedido do responsável do
projeto.
Status: **auditoria. Nenhum código foi escrito, nenhuma migration criada,
nenhuma tela alterada para produzir este documento.**

**Escopo:** exclusivamente `tear-v2-app/backend` (Laravel 13). Não toca no
Portal legado GAS (`src/`) nem em `CONTRATO_SOBERANO.md` — domínio
soberano, trilha de decisão separada.

---

## 0. Fontes analisadas

1. `docs/HANDOFF_PRODUCTIZACAO_TEAR_V2.md` — estado técnico do MVP.
2. `docs/ESPECIFICACAO_FUNCIONAL_TEAR_V2.5.md` — especificação de produto
   campo a campo, com priorização P0/P1/P2.
3. `docs/PLANO_IMPLEMENTACAO_TEAR_V2.5.md` — sequência de sprints e
   decisões pendentes de aprovação.
4. `docs/RELATORIO_SPRINT_1_FUNDACAO_DADOS.md` — relatório de execução:
   **Sprint 1 já concluída** (7 commits, `eefcc02`…`ba15f78`), com RBAC de
   leitura, `Parceira.user_id`, cadastro avançado, medidas, consentimento
   e Briefing 1:N já entregues.
5. Leitura direta do código nesta sessão: as 18 migrations de
   `database/migrations/`, os 10 models de `app/Models/`,
   `ParceiraPolicy.php` e `ParceiraController.php` (estado atual, incluindo
   trabalho não commitado em andamento sobre fluxo de senha da
   influenciadora — não avaliado aqui como entrega, só como contexto do
   estado real do RBAC).

**Nota importante:** o Relatório da Sprint 1 já responde grande parte do
que esta auditoria investigaria do zero. Este documento não repete esse
relatório — confirma seus achados contra o código atual e foca no que ele
deixou em aberto: leitura consolidada do schema completo, avaliação de
risco para SaaS futuro, e o que fica fora de escopo agora.

---

## 1. Estado atual do schema

18 migrations, 10 models. Nenhuma tabela de organização/tenant,
produto/variante, logística, contrato ou permuta existe ainda — todas
são território de Sprints 3+ (`PLANO_IMPLEMENTACAO_TEAR_V2.5.md`), não
desta fase.

| Tabela | Colunas de negócio principais | Chaves estrangeiras | Observação |
|---|---|---|---|
| `users` | `name`, `email`, `password` | — | Papéis via Spatie (`ADMIN`, `GESTOR_MARCA`, `INFLUENCIADORA`); só `ADMIN` e (parcialmente) `INFLUENCIADORA` em uso real. |
| `parceiras` | `nome` (unique), `status` (Ativa/Inativa), `email`, `telefone`, `instagram`, `cnpj`, `chave_pix`, endereço (`cep/rua/bairro/cidade/uf/numero/complemento/endereco_completo`), `aprovado_por`, `aprovado_em` | `user_id` → `users` (nullable), `aprovado_por` → `users` (nullable) | `endereco_completo` recalculado em `booted()` a cada save. `status`/`user_id` fora do `$fillable` de propósito — só mudam por `aprovar()`/`vincularUsuario()`. |
| `medidas_influenciadora` | enums fechados de sutiã/calcinha/linha noite | `parceira_id` → `parceiras` (restrict) | **Append-only por design** — cada alteração é uma linha nova (versionamento por histórico natural de linhas, não coluna de versão). |
| `consentimentos` | `aceito_em`, `ip` | `parceira_id`, `user_id` → `users` (ambos restrict) | Um registro por aceite. Escopo **fixo em `Parceira`** — ver §2.3 e §3. |
| `historico_alteracoes` | `campo`, `valor_anterior`, `valor_novo`, `ip` | `parceira_id`, `user_id` (ambos restrict) | Sem `updated_at` (`UPDATED_AT = null`, correto para log imutável). Escopo **fixo em `Parceira`**, mesmo ponto do item acima. |
| `marcas` | `nome` (unique), contato, `cnpj`, `status` | — | CRUD simples. |
| `campanhas` | `nome`, `descricao`, `data_inicio`, `data_fim`, `status` (PLANEJADA/ATIVA/ENCERRADA/CANCELADA) | `marca_id` → `marcas` (restrict) | |
| `participacoes_na_campanha` | `valor_contratado`, `reels_qtd`, `carrossel_qtd`, `stories_qtd`, `tiktok_qtd`, `ugc_qtd`, `status` (ATIVA/CANCELADA) | `campanha_id`, `parceira_id` (ambos restrict); `unique(campanha_id, parceira_id)` | Ponto de entrada real de Briefing/Material/Pagamento. |
| `briefings` | `tipo` (FEED/REELS/STORIES/TIKTOK/UGC), `orientacoes`, `prazo`, `referencias` (JSON), `entregaveis_esperados`, `observacoes` | `participacao_id` → `participacoes_na_campanha` (restrict); `unique(participacao_id, tipo)` | **Já reorganizado de 1:1 para 1:N** (migration `2026_07_20_130000`). |
| `materiais` | `tipo` (REELS/STORIES/FOTOS/OUTROS), `nome_arquivo`, `drive_file_id`, `drive_file_url`, `status` (PENDENTE/APROVADO/REPROVADO), `motivo_reprovacao` | `participacao_id` (restrict), `aprovado_por` → `users` (nullable) | `drive_file_url` é snapshot, não recalculado. |
| `pagamentos` | `valor`, `status` (PENDENTE/APROVADO/PAGO) | `participacao_id` (unique, restrict), `aprovado_por` (nullable) | 1:1 com participação — uma campanha só gera um pagamento por participação, não por entrega individual. |

---

## 2. Avaliação por entidade principal

### 2.1 Influenciadora/Parceira

- **Campos:** dados pessoais completos (§3 da Especificação: nome, email,
  telefone, instagram, cnpj, chave_pix) + endereço com auto-preenchimento
  de CEP (`CepLookupService`, falha não bloqueante) já implementados.
  CPF **não existe** — decisão explícita do responsável do projeto
  registrada no Relatório Sprint 1 §2.4 ("TEAR é B2B, não há cadastro de
  consumidor final"); não é uma lacuna, é escopo fechado.
- **Relacionamentos:** `belongsTo(User)`, `belongsTo(User, aprovado_por)`,
  `hasMany(MedidaInfluenciadora)` (ordenado desc, `medidaAtual()` pega o
  topo). `User::parceira()` é `hasOne` — o vínculo é 1:1 real (`user_id`
  único por parceira, embora a coluna não tenha `unique()` no schema —
  ver §3, risco 3).
- **Histórico:** `historico_alteracoes` grava campo a campo, na mesma
  transação da alteração (`AtualizarCadastroComConsentimentoService`).
  Cobre exatamente o que a Especificação pede em §5.
- **Consentimento:** tabela dedicada, `aceito_em` + `ip` (IP só
  capturado quando fizer sentido — hoje sempre, porque o Portal ainda não
  existe para diferenciar origem). RBAC de leitura e posse (`view`/`update`
  na `ParceiraPolicy`) já implementados e checados no controller — mais
  avançado do que o Relatório Sprint 1 registrou como débito (`store`/
  `update` "sem checagem de posse" — isso já mudou no código atual: `update`
  chama `$this->authorize('update', $parceira)`; **`store` continua sem
  policy**, qualquer autenticado cria uma Parceira nova).

**Avaliação:** modelo sólido e alinhado à especificação para tudo que é
Sprint 1. Não há gap de schema aqui — só o débito já conhecido de
`store` sem `authorize()`, que será relevante quando o Portal (Sprint 2)
tiver um fluxo de autocadastro fora do admin.

### 2.2 Campanhas

- **Marcas:** CRUD simples, sem gap.
- **Participação:** vínculo Parceira↔Campanha com quantidades contratadas
  por tipo de conteúdo (`reels_qtd`…`ugc_qtd`) e `status` próprio
  (ATIVA/CANCELADA), independente do `status` da Campanha — exatamente o
  desenho que a Especificação §6 pede para a regra de visibilidade do
  Portal (a participação, não a campanha, decide o que a influenciadora vê).
- **Status:** máquina de estados simples (enum), sem histórico de
  transição de status de Campanha ou Participação — se o produto pedir
  auditoria de "quando a campanha virou ATIVA/ENCERRADA", isso não existe
  hoje. Não é um gap apontado por nenhum documento-fonte; registrado aqui
  como observação, não como bloqueador.

**Avaliação:** modelo já suporta o V2.5 sem migração adicional.

### 2.3 Briefings

**Pergunta do prompt: o modelo suporta a estrutura Briefing → Tipo de
conteúdo?** Sim — **já implementado**, não é mais gap. A migration
`2026_07_20_130000_reorganize_briefings_para_1n_por_tipo.php` moveu
`briefings` de 1:1 (unique só em `participacao_id`) para 1:N
(`unique(participacao_id, tipo)`), com `tipo` livre em `string` (não enum
de banco) validado na camada de aplicação contra os 5 valores
(FEED/REELS/STORIES/TIKTOK/UGC — `Model::quantidadeContratadaPara()` e,
presumivelmente, um Form Request equivalente).

**Observação de risco herdada, não desta auditoria:** o próprio Relatório
Sprint 1 já registra que `FEED` reaproveita `carrossel_qtd` como
assunção não confirmada com a operação (§2.7/§4 do relatório) — mantido
aqui como pendência ativa, não resolvida por este documento.

**Nota de schema:** `tipo` é `string` livre, não `enum` de banco nem FK
para uma tabela de tipos — o domínio fechado vive só na aplicação
(`match()` no model). Funciona hoje porque os 5 valores são estáveis e
conhecidos; se o produto pedir tipos configuráveis por operação/cliente
no futuro (ex. SaaS multi-organização com tipos de conteúdo distintos por
plano), essa modelagem precisaria evoluir para uma tabela
`tipos_de_conteudo` — não é urgente, é uma nota para quando a Fase SaaS
for revisitada, não para agora.

### 2.4 Materiais

- **Uploads:** `drive_file_id`/`drive_file_url` já existentes;
  abstração `Storage` do Laravel (disco local hoje, Drive real sem
  credenciais). Sem gap de schema.
- **Aprovação:** `status` + `aprovado_por` + `aprovado_em` +
  `motivo_reprovacao` — ciclo completo (`aprovar()`/`reprovar()` no
  model). Sem gap.
- **Vínculo com campanha:** via `participacao_id`, nunca direto com
  `campanha_id` — correto, porque um Material pertence a uma
  participação específica (Parceira × Campanha), não à Campanha em geral.

**Avaliação:** sem gap identificado por nenhum documento-fonte nem por
esta auditoria.

### 2.5 Pagamentos

- **Histórico:** não existe tabela de histórico de transição de status
  de Pagamento (equivalente a `historico_alteracoes`, mas para
  `PENDENTE→APROVADO→PAGO`) — hoje só se sabe o estado atual e
  `aprovado_por`/`aprovado_em` do último evento relevante (aprovação).
  Quando o pagamento é marcado `PAGO`, não há registro de quem/quando
  fez essa transição especificamente (só a de aprovação é capturada).
  Nenhum documento-fonte pede isso para o V2.5 — registrado como
  observação de auditoria, não como gap bloqueante.
- **Status:** máquina de estados testada ponta a ponta, preserva
  RN-09/RN-11 da V1. Sem gap.
- **Auditoria:** ver ponto acima — é a única lacuna real encontrada
  nesta entidade, e é menor (não bloqueia operação, só limita
  rastreabilidade de "quem pagou e quando" além do último evento).

---

## 3. Riscos para SaaS futuro

Nenhum destes deve virar migration agora — são levantados apenas para
constar no radar, conforme o próprio `PLANO_IMPLEMENTACAO_TEAR_V2.5.md`
§6 já exige decisão fechada por escrito antes de qualquer
`organization_id`.

1. **`unique()` globais que vão quebrar em multi-tenant.**
   `parceiras.nome` e `marcas.nome` são `unique()` na tabela inteira. Em
   um cenário multi-organização, duas organizações diferentes não
   poderão ter cada uma sua própria "Marca X" ou uma influenciadora de
   mesmo nome — essas constraints precisarão migrar para
   `unique(['organization_id', 'nome'])` no Sprint 5. Risco concreto de
   migration quebrada se feita às pressas sem revisar todos os
   `unique()` existentes.
2. **Nenhuma tabela tem `organization_id`.** Confirmado por leitura
   direta de todas as 18 migrations — o achado já esperado pelos
   documentos-fonte. A lista de tabelas que precisarão da coluna é maior
   do que a citada no Plano: além de `parceiras`, `marcas`, `campanhas`,
   `participacoes_na_campanha`, `briefings`, `materiais`, `pagamentos` —
   também `medidas_influenciadora`, `consentimentos` e
   `historico_alteracoes` (dados pessoais/sensíveis, isolamento entre
   organizações é ainda mais crítico aqui do ponto de vista de LGPD).
3. **`users.user_id` ↔ `parceiras.user_id` sem `unique()` no schema.**
   O relacionamento é tratado como 1:1 na aplicação (`vincularUsuario()`
   só roda uma vez, condicionado a `user_id === null`), mas o banco não
   impede dois registros de `Parceira` apontarem para o mesmo `user_id`
   se algum código futuro pular essa checagem. Hoje não é um risco ativo
   (só um caminho de escrita existe), mas se o modelo de Assessoria
   (§14 da Especificação, pendente de decisão) permitir um usuário
   representar múltiplas Parceiras, essa ausência de constraint deixa de
   ser proteção por design e passa a depender só de disciplina de código.
4. **Log de auditoria acoplado a `Parceira`, não polimórfico.**
   `historico_alteracoes` e `consentimentos` têm `parceira_id` como FK
   fixa. O `PLANO_IMPLEMENTACAO_TEAR_V2.5.md` (Sprint 3) já prevê
   "Histórico/auditoria como funcionalidade transversal (log de alteração
   por entidade), não tela isolada" — o schema atual não suporta isso
   sem uma segunda tabela (ou uma reformulação polimórfica) quando
   Campanha, Material ou Pagamento também precisarem de trilha de
   auditoria. Não é urgente agora (só Parceira tem esse requisito no
   V2.5), mas é a tabela mais provável de precisar de redesenho
   arquitetural — não só de coluna — quando o Sprint 3 chegar lá. Vale
   registrar como decisão a antecipar (ADR), não implementar hoje.
5. **SQLite em desenvolvimento.** Já sinalizado no Plano (Sprint 2, risco
   de concorrência de escrita) — reafirmado aqui só para constar no
   documento de auditoria: é troca de driver, não de arquitetura, e já
   está na lista de decisões pendentes (§6 do Plano), não desta
   auditoria.
6. **Nenhuma tabela usa soft delete (`deleted_at`).** Hoje isso não é um
   problema — não há rota de exclusão física exposta (`apiResource(...)
   ->except(['destroy'])` em `parceiras`, e as demais tabelas não têm
   `destroy` nas rotas revisadas). Mas se uma fase futura precisar de
   "arquivar" em vez de excluir (histórico legado, §7 da Especificação,
   já trata isso como registros `origem: legado`, não exclusão), vale
   confirmar que nenhuma tabela de negócio ganhe uma rota de `DELETE`
   físico sem decisão explícita — perda de dado é uma das restrições do
   próprio `CLAUDE.md` do projeto.

---

## 4. O que NÃO deve ser alterado agora

Consolidado das regras já registradas nos quatro documentos-fonte,
confirmadas contra o código:

- **Núcleo Campanha → Participação → Material → Pagamento.** Todos os
  documentos-fonte concordam: "sem gap". Qualquer alteração de schema
  aqui sem uma dor real observada contraria a regra do próprio
  `HANDOFF_PRODUCTIZACAO_TEAR_V2.md` §5 ("não refatorar sem motivo").
- **Briefing reorganizado (1:N por tipo).** Acabou de ser entregue na
  Sprint 1 — mexer de novo sem uma dor concreta é retrabalho. A única
  pendência é a confirmação de negócio sobre `FEED`↔`carrossel_qtd`
  (decisão do responsável do projeto, não um redesenho de schema).
- **CPF em `parceiras`.** Decisão já fechada (B2B, sem necessidade) —
  não reabrir sem novo fato de negócio.
- **`organization_id` / multi-tenant.** Bloqueado por decisão escrita
  pendente (`PLANO_IMPLEMENTACAO_TEAR_V2.5.md` §6, item 11). Nenhuma
  migration de organização antes disso.
- **Modelo de Assessoria (campo vs. entidade própria).** Depende de dado
  operacional real (quantas influenciadoras têm assessoria hoje) que
  não está em nenhuma fonte analisada — não decidir no schema por conta
  própria.
- **Produto/variante/estoque, logística, contratos, permutas.** Desenho
  físico já existe em `docs/ROADMAP_MESTRE_TEAR_V2.md` Parte 2 — não
  redesenhar aqui nem antecipar migrations dessas tabelas antes do
  Sprint 3 abrir formalmente.
- **Provedor de assinatura digital e regras contratuais.** Decisão de
  negócio/jurídica, fora do escopo de dados.
- **Stack (Laravel/React/SQLite→Postgres).** Nenhuma troca sem dor
  técnica concreta, conforme regra já registrada.
- **Domínio soberano do Portal legado GAS (`src/`, `CONTRATO_SOBERANO.md`).**
  Fora de escopo desta auditoria e de qualquer trilha do `tear-v2-app`.

---

## 5. Respostas diretas

**1. O modelo atual suporta o TEAR V2.5?**
Para o que já é Sprint 1 (RBAC, `Parceira.user_id`, cadastro avançado,
medidas versionadas, consentimento/histórico, Briefing 1:N): **sim, já
implementado e validado por teste**. Para Sprints 2 (Portal) e além: o
schema de Campanha/Participação já suporta a regra de visibilidade sem
migração nova — falta só a camada de autorização (Sprint 2, fora do
escopo desta auditoria de dado). Para Sprint 3+ (produto/variante,
logística, contratos, permutas, assessoria): **não** — são tabelas que
ainda não existem, por desenho, aguardando as respectivas fases.

**2. Quais tabelas precisam evoluir?**
Nenhuma tabela atual tem um gap de campo pendente para o escopo do V2.5
já especificado (Sprint 1 fechou os gaps que existiam). O que precisa
*nascer* — não evoluir — são as tabelas de Sprint 3 já listadas no Plano
(`products`, `product_variants`, `stock`, `permutas`, `shipments`,
`shipment_items`, `contract_templates`, `contracts`,
`contract_signatures`, `contract_events`, `assessorias` ou campo
equivalente) e, eventualmente, uma generalização de
`historico_alteracoes`/`consentimentos` para além de `Parceira` (§3,
risco 4) quando o Sprint 3 pedir auditoria transversal.

**3. Quais riscos existem para SaaS futuro?**
Ver §3 completo. Resumo: `unique()` globais que vão quebrar por
organização, ausência de `organization_id` em mais tabelas do que o Plano
lista explicitamente (incluindo as de dado sensível/LGPD), ausência de
constraint de unicidade em `parceiras.user_id`, e acoplamento do log de
auditoria a `Parceira` em vez de um desenho polimórfico — este último é
o único risco que pode exigir decisão arquitetural (ADR) antes de crescer
mais, não só migration.

**4. O que NÃO deve ser alterado agora?**
Ver §4 completo. Resumo: núcleo operacional validado (Campanha →
Participação → Material → Pagamento), Briefing recém-reorganizado, CPF
(decisão fechada), `organization_id` (decisão pendente), Assessoria
(decisão pendente), produto/logística/contratos/permutas (fora de
sequência — Sprint 3 ainda não abriu), stack tecnológica, e o domínio
soberano do Portal legado.

---

Nenhum código foi escrito, nenhuma migration criada e nenhuma
arquitetura alterada para produzir este documento.
