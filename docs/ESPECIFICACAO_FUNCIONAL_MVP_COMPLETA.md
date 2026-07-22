# TEAR V2.5 — Especificação Funcional Completa do MVP

Data: 2026-07-20
Papel do autor: Product Architect / Business Analyst (agente), a pedido do
responsável do projeto.
Status: **documento de consolidação e auditoria funcional. Nenhum código
foi escrito, nenhuma migration criada, nenhum Model/Controller alterado
para produzir este documento.**

**Escopo:** exclusivamente `tear-v2-app/` (Laravel 13 + React 19). Não
toca no Portal legado GAS (`src/`) nem em `CONTRATO_SOBERANO.md`/
`docs/_workspace/TASK_ROUTER.md` — trilhas de decisão separadas (mesmo
recorte já usado por todos os documentos-fonte abaixo).

## 0. Natureza deste documento — por que consolidação, não nova análise

Antes desta sessão, o processo de negócio da Jescri para `tear-v2-app`
já havia sido auditado em **15 documentos** produzidos ao longo do dia
2026-07-20, nesta ordem:

1. `docs/HANDOFF_PRODUCTIZACAO_TEAR_V2.md` (05:xx) — estado técnico do MVP.
2. `docs/ESPECIFICACAO_FUNCIONAL_TEAR_V2.5.md` (05:59) — especificação de
   produto campo a campo (Cadastro, Validação, Consentimento, Campanhas,
   Histórico legado, Briefing, Produto, Logística, Permuta, Contrato,
   Assessoria, Métricas), com priorização P0/P1/P2 própria.
3. `docs/PLANO_IMPLEMENTACAO_TEAR_V2.5.md` — plano de execução em sprints.
4. `docs/ROADMAP_MESTRE_TEAR_V2.md` — roadmap de fases 0-6.
5. `docs/AUDITORIA_REGRAS_NEGOCIO_LEGADO_TEAR.md` (10:29) — comparação
   regra a regra contra o V1 legado (`docs/PRD.md`, RN-01…RN-18).
6. `docs/CONSOLIDACAO_REGRAS_CRITICAS_P0_TEAR_V2.md` (10:35) — formaliza
   P0-1 a P0-5 como requisitos acionáveis.
7. `docs/IMPLEMENTACAO_P0_GATE_PAGAMENTO.md` — P0-1 implementado.
8. `docs/AUDITORIA_MODELO_DADOS_TEAR_V2.md` — leitura direta de todas as
   migrations/models existentes.
9. `docs/DIAGNOSTICO_AUTENTICACAO_TEAR_V2.md` — diagnóstico do login da
   influenciadora (bloqueio real encontrado e corrigido).
10. `docs/AUDITORIA_UX_PORTAL_INFLUENCIADORA.md` — especificação de UX das
    telas do Portal ainda não construídas.
11. `docs/PLANO_PROXIMA_SPRINT_TEAR_V2.md` — sequenciamento recomendado.
12. `docs/ANALISE_MODELO_PAGAMENTO_RECORRENTE_TEAR_V2.md`,
    `docs/CHECKPOINT_POS_ANALISE_PAGAMENTO_SNAPSHOT.md`,
    `docs/PLANO_IMPLEMENTACAO_SNAPSHOT_MENSAL.md` (17:xx) — análise
    conceitual de congelamento mensal e recorrência de pagamento.
13. `docs/PLANO_MERGE_CONSOLIDACAO_TEAR_V2.md` /
    `docs/RELATORIO_CONSOLIDACAO_FINAL_TEAR_V2.md` — governança de PRs.

Regra do projeto (`CLAUDE.md`): **não criar documentação duplicada**.
Este documento, portanto, **não reabre nem reproduz** o que já foi
decidido nos 13 documentos acima — cada afirmação abaixo cita sua fonte.
O valor adicionado aqui é exclusivamente:

- **Consolidar** o que hoje está espalhado em 13 arquivos na estrutura
  única que a auditoria funcional pede (módulos / regras faltantes /
  fluxos / requisitos / dependências / priorização) — nenhum outro
  documento existente tem essa visão de conjunto.
- **Fechar os pontos** explicitamente pedidos nesta auditoria que **não
  apareceram em nenhum dos 13 documentos-fonte** (medidas corporais em
  cm, comprovante de pagamento, viabilidade de importação do histórico
  legado, visibilidade de Portal da Marca — ver §3 e §11).
- **Apontar as decisões pendentes do responsável do projeto** de forma
  única e sem duplicidade, hoje espalhadas em 6 documentos diferentes.

---

## 1. Módulos existentes (funcionais, testados)

*Fonte: `HANDOFF_PRODUCTIZACAO_TEAR_V2.md` §2, `AUDITORIA_MODELO_DADOS_TEAR_V2.md` §1, `RELATORIO_CONSOLIDACAO_FINAL_TEAR_V2.md`.*

| Módulo | Estado | Observação |
|---|---|---|
| Cadastro público de Influenciadora | ✅ funcional | `POST /api/parceiras/cadastro`, `status=Inativa` por padrão (RN-01 preservada) |
| Aprovação administrativa | ✅ funcional | `Parceira::aprovar()`, `PATCH /api/parceiras/{id}/aprovar`, `role:ADMIN` |
| Marcas | ✅ funcional | CRUD simples |
| Campanhas | ✅ funcional | Vinculada a Marca, status `PLANEJADA/ATIVA/ENCERRADA/CANCELADA` |
| Participações | ✅ funcional | Vínculo Parceira×Campanha, `reels_qtd`/`carrossel_qtd`/`stories_qtd`, status `ATIVA/CANCELADA` |
| Briefings | ✅ funcional | Reorganizado de 1:1 para 1:N por tipo de conteúdo (Feed/Reels/Stories/TikTok/UGC) nesta mesma sessão de hoje |
| Materiais (upload) | ✅ funcional | Upload real testado; `Storage` local (Drive real implementado, sem credencial) |
| Aprovação de conteúdo | ✅ funcional | Ação `aprovar`/`reprovar` dentro de `Material`, sem tela de fila central |
| Pagamentos | ✅ funcional | Máquina `PENDENTE → APROVADO → PAGO`; gate de aprovação (P0-1) implementado e testado hoje |
| Medidas/tamanhos de vestuário | ✅ funcional | Sutiã (tamanho/numeração/taça), calcinha, linha noite — versionado (append-only) |
| Consentimento LGPD + histórico de alteração | ✅ funcional | Diff antes de salvar, aceite explícito, registro por campo — implementado na Sprint 1 |
| Login/Portal (acesso básico) | ✅ funcional | `PortalShell`, Dashboard, Perfil — reset de senha corrigido nesta sessão (bloqueava 100% dos primeiros logins antes da correção, `DIAGNOSTICO_AUTENTICACAO_TEAR_V2.md`) |

---

## 2. Módulos incompletos ou inexistentes

*Fonte: `HANDOFF_PRODUCTIZACAO_TEAR_V2.md` §2, `AUDITORIA_UX_PORTAL_INFLUENCIADORA.md` §1, `AUDITORIA_MODELO_DADOS_TEAR_V2.md` §1, `AUDITORIA_REGRAS_NEGOCIO_LEGADO_TEAR.md` §5/§7.*

| Módulo | Estado | Detalhe |
|---|---|---|
| Portal — Campanhas | ❌ inexistente | Tela e rota já especificadas em UX (`AUDITORIA_UX_PORTAL_INFLUENCIADORA.md` §4-9), zero código |
| Portal — Briefings | ❌ inexistente | Endpoint de leitura já autoriza dono; falta tela |
| Portal — Materiais (envio pela própria influenciadora) | ❌ inexistente | Rota de envio ainda `role:ADMIN`-only |
| Portal — Pagamentos | ❌ inexistente | Dado já embutido em `GET /me/participacoes`; falta tela |
| Portal da Marca (`GESTOR_MARCA`) | ❌ inexistente | Papel seedado sem uso; **sem nenhuma regra de visibilidade definida em nenhuma fonte** — decisão de escopo de produto em aberto |
| RBAC de leitura granular | ⚠️ parcial | Toda rota `GET` administrativa exige só `auth:sanctum`, sem checar papel/posse, exceto onde já corrigido (`update` de Parceira) |
| Logística | ❌ inexistente (placeholder) | Zero tabela; desenho mínimo já decidido em P0-4 (§5.6), não implementado |
| Produto/Variante/Estoque | ❌ inexistente | Território inteiramente novo (nunca existiu nem na V1) |
| Permutas | ❌ inexistente | Depende de Produto/Variante e de Portal maduro |
| Contratos | ❌ inexistente | Campos-pré-requisito (`razao_social`, `canais_uso_imagem`, `prazo_uso_imagem`) formalizados (P0-2), não implementados |
| Assessorias | ❌ inexistente | Modelo (campo vs. entidade própria) depende de dado operacional ainda não levantado |
| Congelamento mensal (Participação) | ❌ inexistente | Mecanismo decidido (`congelado_em`), não implementado; ver §5.3 |
| Histórico legado (importação) | ❌ inexistente | Nenhuma fonte trata viabilidade de importação — gap real, ver §11 |
| Comprovante de pagamento | ❌ inexistente | Não mencionado em nenhum dos 13 documentos — gap real, ver §5.11 |
| Métricas de perfil (seguidores/engajamento) | ❌ inexistente | Só especificado (`ESPECIFICACAO_FUNCIONAL_TEAR_V2.5.md` §16), não implementado |
| `pt_BR` nas mensagens de validação | ❌ pendente | `APP_LOCALE=en` hoje |

---

## 3. Regras de negócio faltantes, por domínio

Cada subseção segue o roteiro da auditoria original (cadastro, campanhas,
participações, briefings, produtos, logística, contratos, assessorias,
materiais, pagamentos, métricas, histórico).

### 3.1 Cadastro da Influenciadora

**Já especificado e decidido** (`ESPECIFICACAO_FUNCIONAL_TEAR_V2.5.md`
§3-§5, `CONSOLIDACAO_REGRAS_CRITICAS_P0_TEAR_V2.md` P0-2):
CEP automático (falha não bloqueia), validação formal de CNPJ (dígito
verificador), telefone com DDD, consentimento LGPD com diff+aceite
explícito, histórico de alteração campo a campo (`user_id`, timestamp,
IP só quando a origem é o Portal), medidas de **vestuário** versionadas
(sutiã tamanho/numeração/taça, calcinha, linha noite), campos de
contrato ausentes hoje no schema (`razao_social`, `canais_uso_imagem`,
`prazo_uso_imagem`, `valor_extenso`).

**Gap real — não coberto em nenhuma fonte:**
- **Medidas corporais em centímetros** (busto, cintura, quadril) — o que
  existe hoje é só **tamanho de peça** (P/M/G/GG, numeração de sutiã),
  nunca a medida corporal em si. Para uma marca de sleepwear/moda
  íntima, a medida em cm pode ser relevante para ajuste de produto além
  do tamanho de etiqueta — mas isso é uma decisão de produto/operação,
  não uma regra técnica: **confirmar com o responsável do projeto se
  medida corporal (cm) é necessária além do tamanho de peça já
  implementado**, e se sim, se entra na mesma tabela versionada de
  medidas ou em tabela própria.
- **Campo "observações" nas medidas** — nenhuma fonte confirma a
  existência desse campo livre na tabela de medidas hoje implementada;
  se não existir, é uma extensão simples (coluna nullable), a confirmar.
- **Validação de formato do campo Instagram** — o campo existe
  (`ESPECIFICACAO_FUNCIONAL_TEAR_V2.5.md` §3), mas nenhuma fonte define
  uma regra de validação (ex.: aceitar com ou sem `@`, validar contra
  formato de handle) — hoje é texto livre.
- **Deduplicação/normalização de identidade** — a V1 legada tem
  `ChaveInfluenciadora` (trim, colapso de espaço, case-insensitive); o
  MVP usa só `unique()` de banco sobre `nome`, sem normalização
  (`AUDITORIA_REGRAS_NEGOCIO_LEGADO_TEAR.md`, recomendação P1) — duas
  influenciadoras com grafia levemente diferente do mesmo nome não são
  detectadas.
- **`POST /parceiras/cadastro` administrativo** (distinto do público)
  ainda sem `authorize()` — qualquer autenticado cria Parceira
  (`AUDITORIA_MODELO_DADOS_TEAR_V2.md` §2.1).

**Decisão pendente do responsável do projeto** (já registrada em
`ESPECIFICACAO_FUNCIONAL_TEAR_V2.5.md` §17, não repetida em detalhe):
CPF como alternativa a CNPJ.

### 3.2 Campanhas

**Já decidido:** visibilidade da influenciadora = status da
**participação** (`ATIVA`), independente do status da campanha em si
(`ESPECIFICACAO_FUNCIONAL_TEAR_V2.5.md` §6, confirmado consistente pela
leitura de código em `AUDITORIA_MODELO_DADOS_TEAR_V2.md` §2.2).

**Gap real:**
- **Visibilidade para `GESTOR_MARCA` (Portal da Marca)** — não existe
  nenhuma regra de visibilidade definida em nenhuma das 13 fontes; o
  papel existe só como seed sem uso. **Decisão de escopo de produto em
  aberto**, sem precedente na V1 (que nunca teve conceito de acesso
  externo por marca).
- **Histórico de transição de status** da Campanha/Participação (quando
  virou `ATIVA`, quando `ENCERRADA`) não existe — observação registrada
  em `AUDITORIA_MODELO_DADOS_TEAR_V2.md` §2.2, não bloqueante, não
  pedida por nenhuma fonte.
- **"Quem pode visualizar campanhas encerradas"** — nenhuma fonte
  define uma regra distinta para campanha `ENCERRADA`/`CANCELADA` vs.
  `ATIVA`/`PLANEJADA` do ponto de vista de leitura administrativa (hoje
  todo `ADMIN` autenticado lê tudo, sem filtro).

### 3.3 Participações — status, congelamento mensal, aprovação

Esta é a área mais analisada nas últimas sessões
(`CONSOLIDACAO_REGRAS_CRITICAS_P0_TEAR_V2.md`,
`ANALISE_MODELO_PAGAMENTO_RECORRENTE_TEAR_V2.md`,
`CHECKPOINT_POS_ANALISE_PAGAMENTO_SNAPSHOT.md`,
`PLANO_IMPLEMENTACAO_SNAPSHOT_MENSAL.md`) — e a que tem mais decisão já
tomada, porém **nenhuma ainda implementada**.

**Já decidido:**
- Hierarquia fechada: `Marca → Campanha → ParticipacaoNaCampanha →
  {Briefing, Material, Pagamento}`. "Mês" foi explicitamente **rejeitado**
  como container acima de Campanha — `data_inicio`/`data_fim` são datas
  livres, não amarradas a calendário mensal
  (`PLANO_IMPLEMENTACAO_SNAPSHOT_MENSAL.md` §0).
- Granularidade do congelamento: **por Participação, nunca por
  Campanha** — só a Participação carrega `valor_contratado`/quantidades,
  e cada participação de uma mesma campanha tem ciclo de vida
  independente (`PLANO_IMPLEMENTACAO_SNAPSHOT_MENSAL.md` §2).
- Mecanismo proposto (decidido, não implementado): coluna
  `congelado_em` (timestamp nullable) em `participacoes_na_campanha`,
  preenchida na confirmação/ativação.
- Status: `ATIVA`/`CANCELADA` — nenhuma máquina de estados mais rica
  existe hoje.

**Gap real — decisão de princípio ainda em aberto, não só
implementação:**
- **Edição após congelamento:** bloquear a edição de
  `valor_contratado`/quantidades depois de `congelado_em` preenchido,
  ou permitir edição com trilha auditável? As duas opções foram
  levantadas e nenhuma foi escolhida
  (`CONSOLIDACAO_REGRAS_CRITICAS_P0_TEAR_V2.md` P0-3,
  `PLANO_IMPLEMENTACAO_SNAPSHOT_MENSAL.md` §2).
- **Pagamento recorrente/parcelado:** hoje o schema é estritamente 1:1
  (`participacao_id` único em `pagamentos`, `HasOne`, rota singular). A
  pergunta "uma Participação de longa duração pode gerar mais de um
  pagamento (parcelas mensais)?" é a questão mais repetida nas últimas
  três sessões e **segue sem resposta**
  (`ANALISE_MODELO_PAGAMENTO_RECORRENTE_TEAR_V2.md`,
  `CHECKPOINT_POS_ANALISE_PAGAMENTO_SNAPSHOT.md`). Se a resposta for
  "não, pagamento é sempre único por participação" — o que o schema
  atual já reflete, sem que isso tenha sido uma decisão consciente —
  então não existe necessidade de nenhuma entidade de fechamento
  mensal, e o congelamento se reduz só à coluna `congelado_em` acima.
  **Esta é a decisão de maior alavancagem pendente no módulo inteiro:**
  ela determina se P0-3 é uma tarefa pequena (uma coluna) ou uma
  mudança estrutural (nova tabela, `HasOne`→`HasMany`, rota, frontend,
  14 testes existentes a revisar).
- **Se a recorrência for aprovada:** o gate de pagamento (P0-1, já
  implementado para o caso 1:1) roda por parcela ou pela participação
  inteira? Pergunta nova, ainda não respondida em nenhuma fonte
  (`ANALISE_MODELO_PAGAMENTO_RECORRENTE_TEAR_V2.md` §3).
- **Trilha de auditoria do congelamento:** a tabela
  `historico_alteracoes` hoje só tem FK para `Parceira`, não é
  polimórfica — estender para Participação exige nova tabela irmã ou
  generalizar para `auditable_type`/`auditable_id`
  (`AUDITORIA_MODELO_DADOS_TEAR_V2.md` §3, sinalizado como possível ADR
  futuro, não decidido).
- **"Compilar Mês" em lote** (todas as Parceiras ativas de uma vez, como
  na V1) — ainda em aberto se é necessário ou se o modelo atual
  (participação individual, sem lote) já é a decisão definitiva de
  produto (`CONSOLIDACAO_REGRAS_CRITICAS_P0_TEAR_V2.md` P0-3,
  `PLANO_PROXIMA_SPRINT_TEAR_V2.md`).

### 3.4 Briefings

**Já decidido e implementado nesta sessão:** 1:N por tipo de conteúdo
(Feed/Reels/Stories/TikTok/UGC), `unique(participacao_id, tipo)`
(`AUDITORIA_REGRAS_NEGOCIO_LEGADO_TEAR.md`).

**Já decidido, não implementado (P0-5):** cálculo automático de
`data_aprovacao_interna` = data de postagem − 7 dias, com ajuste de fim
de semana (sexta→+3 dias úteis, sábado→+2, domingo→+1), campo sempre
derivado, nunca editável livre — regra herdada literalmente da V1 (RN-04)
(`CONSOLIDACAO_REGRAS_CRITICAS_P0_TEAR_V2.md`).

**Gap real:**
- 🟠 `FEED` reaproveita `carrossel_qtd` como quantidade contratada, ou
  precisa de contador próprio? Levantado em 3 documentos, sem resposta
  (`AUDITORIA_REGRAS_NEGOCIO_LEGADO_TEAR.md`,
  `CONSOLIDACAO_REGRAS_CRITICAS_P0_TEAR_V2.md`,
  `AUDITORIA_MODELO_DADOS_TEAR_V2.md`).
- **Descompasso de vocabulário `Material.tipo` (REELS/STORIES/FOTOS/
  OUTROS) × `Briefing.tipo` (FEED/REELS/STORIES/TIKTOK/UGC)** — não há
  mapeamento 1:1 entre os dois enums, e `Material` não tem `briefing_id`
  — não há vínculo estrutural entre "este material responde a este
  briefing específico". Sinalizado como **decisão de negócio inédita**,
  não uma escolha técnica — a auditoria de UX do Portal parou
  explicitamente neste ponto por mandato do projeto
  (`AUDITORIA_UX_PORTAL_INFLUENCIADORA.md` §8). **Bloqueia** a tela de
  Materiais do Portal da Influenciadora e o fluxo completo
  envio→aprovação→pagamento visto por tipo de conteúdo.

### 3.5 Produtos

**Território integralmente novo** — nunca existiu na V1 nem no MVP
atual (`AUDITORIA_REGRAS_NEGOCIO_LEGADO_TEAR.md` §4,
`AUDITORIA_MODELO_DADOS_TEAR_V2.md` §1: zero tabela hoje). Especificação
de comportamento já existe (`ESPECIFICACAO_FUNCIONAL_TEAR_V2.5.md`
§9-§10: extração por URL, regra de nome operacional vs. SEO, validação
obrigatória de variante/cor antes de salvar). Desenho físico de tabelas
(`products`, `product_variants`, `stock`) já antecipado em
`docs/ROADMAP_MESTRE_TEAR_V2.md` Parte 2 Fase 3 — não redesenhado aqui.
Nenhum gap novo encontrado além do que já está registrado como P1/P2.

### 3.6 Logística

**Maior lacuna funcional confirmada por 2 auditorias independentes**
(`AUDITORIA_REGRAS_NEGOCIO_LEGADO_TEAR.md` §5,
`AUDITORIA_MODELO_DADOS_TEAR_V2.md` §1) — zero tabela, módulo é
placeholder puro no frontend.

**Já decidido (P0-4, mínimo viável), não implementado:**
- Uma entidade `Envio` por `ParticipacaoNaCampanha` (não por mês).
- Status simples: `Pendente → Expedido → Entregue` (+ `Cancelado`).
- Endereço **lido ao vivo** do cadastro da Parceira, **nunca duplicado**
  na tabela de Envio — preserva a mesma proteção de PII que a V1 tinha
  por desenho (`INV-04` do domínio soberano legado, reaproveitada aqui
  por analogia, não por reabertura de contrato).
- Código de rastreio em texto livre, sem integração real de
  transportadora nesta fase.

**Ficha de retirada automática** — já especificada em
`ESPECIFICACAO_FUNCIONAL_TEAR_V2.5.md` §11 (conteúdo: foto, SKU,
produto/variante, nome completo, endereço), gerada no momento em que o
look da campanha é confirmado. Sem gap novo além do já registrado.

### 3.7 Contratos

**Não existe em nenhum dos dois sistemas.** Confirmado que a geração de
contrato na V1 já era um stub de texto simples, não o AutoCrat/Google
Docs real descrito no PRD — dívida técnica pré-existente, não causada
pela migração para `tear-v2-app` (`AUDITORIA_REGRAS_NEGOCIO_LEGADO_TEAR.md`
§7, referenciando `D-01` de SPEC-023 do sistema legado).

**Já decidido:** campos pré-requisito no cadastro (P0-2, §3.1); modelo
de template editável pelo ADMIN sem deploy como critério de aceite
obrigatório, não "nice to have"; PDF gerado é imutável, nova geração não
reescreve contrato emitido, gera nova versão
(`ESPECIFICACAO_FUNCIONAL_TEAR_V2.5.md` §13/§15); total do contrato lê
de `ParticipacaoNaCampanha.valor_contratado` (total da participação
inteira), não de `Pagamento` — sem acoplamento à pergunta de recorrência
do §3.3 (`ANALISE_MODELO_PAGAMENTO_RECORRENTE_TEAR_V2.md` §3).

**Decisão pendente do responsável do projeto:** provedor de assinatura
digital; cláusulas obrigatórias; versões por tipo de campanha; prazo de
vigência/rescisão — todas já registradas como abertas em
`ESPECIFICACAO_FUNCIONAL_TEAR_V2.5.md` §17 e
`docs/ROADMAP_MESTRE_TEAR_V2.md` §5, não repetidas em detalhe aqui.

### 3.8 Assessorias

**Não existe hoje.** Duas arquiteturas avaliadas (campo simples vs.
entidade própria), recomendação técnica pelo Modelo B (entidade),
**decisão explicitamente pendente de dado operacional real** (quantas
influenciadoras hoje têm assessoria, se compartilham a mesma) — não
decidível a partir de nenhuma fonte analisada
(`ESPECIFICACAO_FUNCIONAL_TEAR_V2.5.md` §14).

**Gap real, achado nesta consolidação:** `parceiras.user_id` não tem
constraint `unique()` no banco — hoje só é respeitado por disciplina de
aplicação. Isso importa especificamente para Assessoria: se o modelo
permitir uma assessoria (um `User`) representando várias Parceiras, a
ausência da constraint deixa de ser um risco teórico e vira uma decisão
de design ativa a ser tomada junto com a escolha de modelo
(`AUDITORIA_MODELO_DADOS_TEAR_V2.md` §3).

### 3.9 Materiais

**Backend sólido, sem gap de schema** — upload, `drive_file_id`/
`drive_file_url`, ciclo `status`+`aprovado_por`+`aprovado_em`+
`motivo_reprovacao` completo, chaveado corretamente por
`participacao_id` (`AUDITORIA_MODELO_DADOS_TEAR_V2.md` §2.4).

**UX já especificada, não construída** (`AUDITORIA_UX_PORTAL_INFLUENCIADORA.md`
§8): botão de envio só aparece se o briefing daquele tipo estiver
publicado E quantidade enviada < quantidade contratada; motivo de
reprovação sempre visível (nunca atrás de clique) com botão "enviar
novamente"; reenvio é sempre um novo registro, histórico de tentativas
anteriores preservado e visível (não sobrescrito).

**Gap real:**
- **Vínculo estrutural Material↔Briefing ausente** — mesmo achado do
  §3.4, é o mesmo bloqueio, citado aqui porque impede fechar o fluxo
  completo de Materiais no Portal.
- **Rota de "substituir material" não existe** — reenvio hoje só é
  possível como registro novo; confirmar se esse é o comportamento
  final desejado (parece ser, dado o requisito de histórico visível) ou
  se falta uma rota de substituição explícita.
- **Upload múltiplo pela influenciadora** — backend aceita hoje um
  arquivo por requisição; recomendação de UX pede múltiplos arquivos —
  decisão técnica de implementação (loop de chamadas vs. endpoint de
  array), não decisão de produto, resolúvel na execução
  (`AUDITORIA_UX_PORTAL_INFLUENCIADORA.md` §10).

### 3.10 Pagamentos

**Gate de aprovação (P0-1) — decidido e implementado nesta sessão:**
`Pagamento` só pode virar `APROVADO` se todo `Material` da participação
estiver `APROVADO` (vazio-verdadeiro se nenhum material esperado — mesma
regra da V1); testado, 121/121 verde
(`IMPLEMENTACAO_P0_GATE_PAGAMENTO.md`). 🟠 Aberto: a V1 aceitava
"Aprovado **ou** Publicado" como suficiente; `tear-v2-app` não tem
estado "Publicado" em `Material`, então o gate hoje é só `APROVADO` —
não bloqueante, mas confirmar se cobre a intenção original da regra.

**Recorrência — ver §3.3**, é a mesma decisão pendente, apenas descrita
aqui do ponto de vista do Pagamento: hoje 1:1 estrito com a Participação
em 3 camadas (constraint de banco, `HasOne`, rota singular) — mudar para
N pagamentos por participação **não é aditivo**: toca banco, model, API
(mudança de rota, quebra retrocompatibilidade) e os 14 testes
existentes que assumem 1:1 (`ANALISE_MODELO_PAGAMENTO_RECORRENTE_TEAR_V2.md`).

**Gaps reais, não cobertos em nenhuma das 13 fontes:**
- **Comprovante de pagamento** — nenhum documento menciona entidade,
  campo ou upload de comprovante/recibo. A auditoria original pergunta
  explicitamente por "comprovantes" — **gap total, sem nenhuma decisão
  prévia a citar**. Proposta mínima a validar com o responsável: campo
  de anexo (mesma abstração `Storage` já usada por Materiais) associado
  ao evento de confirmação de pagamento (`PAGO`).
- **Histórico de transição de status** — só o estado atual +
  `aprovado_por`/`aprovado_em` do último evento relevante existem; não
  há registro de quem/quando marcou `PAGO` especificamente
  (`AUDITORIA_MODELO_DADOS_TEAR_V2.md` §2.5) — observação menor, não
  bloqueante, nenhuma fonte pediu isso como requisito.
- **"Previsto × pago" no Portal** (RF-030 da V1) — adiado
  explicitamente para entrega futura
  (`AUDITORIA_REGRAS_NEGOCIO_LEGADO_TEAR.md`), sem data.
- `StorePagamentoRequest`/`UpdatePagamentoRequest::authorize()` ainda
  retornam `true` fixo — na prática coberto pelo middleware
  `role:ADMIN` da rota, mas o `authorize()` do Form Request continua
  permissivo por si só (`IMPLEMENTACAO_P0_GATE_PAGAMENTO.md`).

### 3.11 Métricas

Nenhuma fonte além de `ESPECIFICACAO_FUNCIONAL_TEAR_V2.5.md` §16 trata
do assunto — sem gap novo, sem implementação. Espaço já especificado:
autodeclaradas no cadastro, atualizáveis sob demanda (pela
influenciadora ou pela equipe), versionadas (nunca sobrescritas). Sem
integração automática a redes sociais nesta fase (P2).

### 3.12 Histórico

**Gap real — não coberto em nenhuma das 13 fontes.** Todas tratam o
histórico legado apenas do ponto de vista de **comparação de regra de
negócio** (V1 vs. `tear-v2-app`, para não regredir comportamento), nunca
da **viabilidade de importação de dado**. A pergunta original da
auditoria — "vale a pena importar do Google Sheets legado? quais riscos?
quais dados realmente importam?" — segue sem resposta documentada.

**Análise desta consolidação, a partir do que já é sabido do schema
legado** (`docs/history/PLANILHA_TEAR_2.0_MAPA.md`, citado por
`ESPECIFICACAO_FUNCIONAL_TEAR_V2.5.md` §7, mas não aprofundado lá):

- **Vale a pena?** Provavelmente sim para consulta (auditoria e
  histórico de relacionamento comercial), mas **não** para recriar
  comportamento — os dois roadmaps-fonte já concordam que a estratégia é
  "histórico somente leitura", nunca reabertura de fluxo
  (`ESPECIFICACAO_FUNCIONAL_TEAR_V2.5.md` §7).
- **Riscos:** a chave de junção da planilha (`INFLU_KEY`) não corresponde
  1:1 de forma confiável ao `nome` usado como chave em `tear-v2-app` —
  divergência de grafia exige revisão manual, não join automático
  (mesmo achado já registrado em `ESPECIFICACAO_FUNCIONAL_TEAR_V2.5.md`
  §7 e reforçado por `AUDITORIA_REGRAS_NEGOCIO_LEGADO_TEAR.md` P1 #8
  sobre falta de normalização de nome no MVP atual).
- **Dados que realmente importam:** ativações/conteúdos publicados,
  pagamentos concluídos, envios logísticos entregues — ou seja, só as
  linhas já **arquivadas** (estado terminal) do sistema legado, marcadas
  `origem: legado`, nunca as linhas ainda em fluxo ativo. Não existe
  conceito de produto na planilha legada, então não há o que migrar
  nesse ponto específico.
- **Ainda em aberto:** escopo exato (quais abas entram, quais campos são
  obrigatórios, o que pode ser descartado) — decisão do responsável do
  projeto, não decidível só com o que está documentado.

---

## 4. Fluxos operacionais

### 4.1 Fluxo principal (implementado e validado ponta a ponta)

```
Cadastro público (influenciadora)
    ↓
Aprovação (ADMIN, Ativa/Inativa)
    ↓
Vínculo em Campanha → Participação (ADMIN, só Parceira Ativa)
    ↓
Briefing por tipo de conteúdo (ADMIN escreve)
    ↓
Material (hoje só ADMIN registra em nome da influenciadora — Portal de
envio próprio ainda não existe)
    ↓
Aprovação/reprovação de Material (ADMIN)
    ↓
Pagamento (nasce PENDENTE → gate de Materiais aprovados → APROVADO →
PAGO)
```
*Fonte: `HANDOFF_PRODUCTIZACAO_TEAR_V2.md` §1, validado manualmente no
navegador com dados reais nesta mesma trilha de sessões.*

### 4.2 Fluxo do Portal da Influenciadora (parcialmente implementado)

```
Convite (e-mail, ao aprovar) ✅
    ↓
Definir senha (/definir-senha) ✅ (corrigido nesta sessão — bloqueava
100% dos primeiros logins antes da correção)
    ↓
Login ✅
    ↓
Dashboard (status da conta, alerta de perfil incompleto) ✅
    ↓
Perfil (dados pessoais + endereço + medidas) ✅ (UX ainda não revisada)
    ↓
Campanhas próprias ❌ (só tela administrativa existe)
    ↓
Briefing por tipo ❌ (endpoint já autoriza dono, falta tela)
    ↓
Envio de material pela própria influenciadora ❌ (rota ainda
`role:ADMIN`-only)
    ↓
Pagamento (visão própria) ❌ (dado já disponível em `GET /me/participacoes`,
falta tela)
```
*Fonte: `AUDITORIA_UX_PORTAL_INFLUENCIADORA.md` §1 (tabela de estado por
tela), `DIAGNOSTICO_AUTENTICACAO_TEAR_V2.md`.*

### 4.3 Fluxo de logística (especificado, não implementado)

```
Look/produto confirmado no briefing
    ↓
Ficha de retirada gerada automaticamente (foto, SKU, produto/variante,
nome, endereço)
    ↓
Envio (status Pendente → Expedido → Entregue, endereço lido ao vivo do
cadastro, nunca duplicado)
```
*Fonte: `CONSOLIDACAO_REGRAS_CRITICAS_P0_TEAR_V2.md` P0-4,
`ESPECIFICACAO_FUNCIONAL_TEAR_V2.5.md` §11.*

### 4.4 Fluxo de contrato (especificado, não implementado)

```
Template editável pelo ADMIN (sem deploy)
    ↓
Placeholders ({{nome}}, {{cnpj}}, {{valor_total}}, {{prazo_uso_imagem}}...)
    ↓
Preenchidos com dados de Cadastro + Participação vigente (valor lido de
ParticipacaoNaCampanha.valor_contratado)
    ↓
PDF gerado (versão imutável)
    ↓
Envio para assinatura digital (provedor a definir)
```
*Fonte: `ESPECIFICACAO_FUNCIONAL_TEAR_V2.5.md` §13/§15.*

---

## 5. Requisitos funcionais consolidados (não cobertos por RF-0xx da V1)

*Numeração própria deste documento (RFC = Requisito Funcional
Consolidado), para não colidir com RF-001…RF-032 do `docs/PRD.md`
(que descrevem o sistema V1/legado) nem com os RF de qualquer SPEC do
sistema GAS.*

| ID | Requisito | Prioridade | Fonte |
|---|---|---|---|
| RFC-01 | Preencher endereço automaticamente a partir do CEP, sem bloquear cadastro em caso de falha do serviço | P0 | `ESPECIFICACAO_FUNCIONAL_TEAR_V2.5.md` §3 |
| RFC-02 | Validar dígito verificador de CNPJ (e CPF, se aprovado) | P0 | idem §4 |
| RFC-03 | Capturar consentimento LGPD com diff campo a campo e aceite explícito antes de gravar alteração de dado pessoal | P0 | idem §5 |
| RFC-04 | Restringir visibilidade de Campanha/Briefing/Material/Pagamento da influenciadora autenticada à sua própria `parceira_id`, nunca por parâmetro do cliente | P0 | idem §6 |
| RFC-05 | Calcular `data_aprovacao_interna` do Briefing automaticamente (postagem − 7 dias, ajuste de fim de semana) | P0 | `CONSOLIDACAO_REGRAS_CRITICAS_P0_TEAR_V2.md` P0-5 |
| RFC-06 | Bloquear `Pagamento.APROVADO` se existir `Material` da participação não `APROVADO` | P0 — **implementado** | `IMPLEMENTACAO_P0_GATE_PAGAMENTO.md` |
| RFC-07 | Permitir à influenciadora enviar material pelo próprio Portal (hoje só ADMIN registra em seu nome) | P0 | `AUDITORIA_UX_PORTAL_INFLUENCIADORA.md` §8 |
| RFC-08 | Registrar `congelado_em` na Participação ao confirmar/ativar, definindo regra de edição pós-congelamento | P0 | `PLANO_IMPLEMENTACAO_SNAPSHOT_MENSAL.md` §2 |
| RFC-09 | Gerar ficha de retirada de estoque automaticamente ao confirmar o look da campanha | P1 | `ESPECIFICACAO_FUNCIONAL_TEAR_V2.5.md` §11 |
| RFC-10 | Bloquear salvamento de escolha de produto sem variante (cor/tamanho) confirmada e disponível | P1 | idem §10 |
| RFC-11 | Gerar contrato em PDF a partir de template editável pelo ADMIN sem deploy | P1 | idem §13/§15 |
| RFC-12 | Permitir upload/registro de comprovante de pagamento | P1 — **gap novo** | esta consolidação, §3.10 |
| RFC-13 | Importar registros terminais (arquivados) do histórico legado como `origem: legado`, somente leitura | P1 | idem §7, aprofundado em §3.12 |
| RFC-14 | Permitir atualização periódica de métricas de perfil, versionada | P2 | idem §16 |
| RFC-15 | Extrair automaticamente foto/nome/cor/SKU a partir de URL de produto, com revisão humana obrigatória antes de gravar | P2 | idem §9 |

---

## 6. Requisitos não funcionais

*Fonte: `docs/PRD.md` §10 (herdados da V1, ainda válidos), `AUDITORIA_MODELO_DADOS_TEAR_V2.md` §3, `PLANO_IMPLEMENTACAO_TEAR_V2.5.md` §5.*

- **Degradação de integração externa não bloqueia o fluxo principal** —
  falha de CEP ou de futura extração de URL nunca impede salvar o dado
  principal (herdado literalmente da V1, RNF já validado).
- **PII fora de log e nunca duplicado** — endereço de Envio lido ao vivo
  do cadastro (§3.6); `historico_alteracoes` não deve vazar valor
  anterior/novo em log de aplicação.
- **RBAC de leitura por papel e por dono do registro** é bloqueador de
  segurança, não melhoria de UX — nenhuma rota deve devolver dado fora
  do escopo do papel/posse autenticado (`HANDOFF_PRODUCTIZACAO_TEAR_V2.md` §5).
- **Concorrência de escrita em SQLite** é risco conhecido a partir do
  momento em que duas influenciadoras podem escrever ao mesmo tempo
  (Portal com envio próprio) — migrar para Postgres antes de abrir essa
  superfície, não depois de aparecer em produção
  (`PLANO_IMPLEMENTACAO_TEAR_V2.5.md` §5).
- **Auditabilidade** — toda alteração de dado pessoal e todo evento de
  aprovação/pagamento deve ser reconstruível (quem, quando, valor
  anterior/novo) — hoje cumprido para Parceira, não para Participação/
  Pagamento (gap registrado em §3.3/§3.10).
- **`pt_BR`** em toda mensagem de validação voltada ao usuário final
  (`APP_LOCALE=en` é bug de produto ativo hoje).

---

## 7. Dependências entre módulos

*Fonte: consolidada de `PLANO_IMPLEMENTACAO_TEAR_V2.5.md` §2-§3.*

| Módulo | Depende de |
|---|---|
| Portal (Campanhas/Briefing/Materiais/Pagamento) | RBAC de leitura por dono + `Parceira.user_id` ativo (já cumprido) |
| Congelamento de Participação | Decisão de recorrência de pagamento (§3.3) — determina se é mudança pequena ou estrutural |
| Contratos | Cadastro avançado (razão social, canais/prazo de uso de imagem) + Participação vigente |
| Ficha de retirada / Logística | Produto/Variante confirmado no briefing + endereço do cadastro |
| Permutas | Portal maduro (escolha pela própria influenciadora) + Produto/Variante |
| Extração automática de produto (IA) | Produto/Variante já maduro e estável — não adiantar sobre modelo instável |
| Importação de histórico legado | Modelo de destino estável (não migrar para algo que ainda vai mudar) |
| Preparação SaaS / multi-tenant | Todas as fases anteriores maduras em operação real |

---

## 8. Priorização consolidada (P0 / P1 / P2)

Funde `ESPECIFICACAO_FUNCIONAL_TEAR_V2.5.md` §18,
`CONSOLIDACAO_REGRAS_CRITICAS_P0_TEAR_V2.md` e
`PLANO_PROXIMA_SPRINT_TEAR_V2.md` — sem repetir o que já está descrito
em detalhe nesses documentos, só a lista final.

### P0 — obrigatório para o MVP substituir a operação real
- RBAC de leitura por papel e por dono do registro.
- Gate de pagamento por materiais aprovados (RFC-06 — **implementado**).
- Cálculo automático da data de aprovação do briefing (RFC-05, P0-5).
- Cadastro avançado: CEP automático, validação de CNPJ/CPF, consentimento
  LGPD + histórico (RFC-01/02/03).
- Campos de contrato no cadastro (razão social, canais/prazo de uso de
  imagem) — P0-2.
- Envio de material pela própria influenciadora no Portal (RFC-07).
- Decisão de recorrência de pagamento — **bloqueia** o dimensionamento
  real de P0-3 (congelamento).
- Congelamento mínimo (`congelado_em`) — RFC-08.

### P1 — alto valor, não bloqueia uso atual como produto interno
- Logística e ficha de retirada automática (P0-4 na numeração técnica,
  P1 de valor de produto — nomenclatura herdada, não reconciliada entre
  os dois documentos-fonte, sem impacto prático).
- Produto/variante e validação de variante, sem extração automática.
- Contratos — geração e template editável, mesmo sem assinatura digital.
- Comprovante de pagamento (RFC-12, gap novo).
- Assessoria como campo/entidade, sem portal próprio.
- Histórico legado (importação somente leitura, escopo terminal).
- Portal completo (Campanhas/Briefing/Pagamento — telas restantes).

### P2 — evolução futura
- Extração inteligente de produto via URL (IA).
- Portal da Marca (`GESTOR_MARCA`) — decisão de escopo ainda nem
  aberta formalmente.
- Métricas com integração automática a redes sociais.
- Provedor de assinatura digital totalmente integrado (webhook).
- Preparação SaaS (multi-tenant, billing, onboarding autosserviço).
- Permutas (dependem de Portal + Produto maduros).

---

## 9. Decisões pendentes do responsável do projeto (lista única)

Consolidado de 6 documentos-fonte diferentes — cada uma citada só uma
vez aqui, na ordem de bloqueio real:

1. **Pagamento recorrente/parcelado por Participação** — determina o
   tamanho real de P0-3 (§3.3). Maior alavancagem da lista.
2. **Bloquear ou permitir-com-auditoria** a edição após congelamento da
   Participação (§3.3).
3. **Vínculo estrutural Material↔Briefing** (taxonomia `tipo`) — bloqueia
   a tela de Materiais do Portal e o fluxo completo (§3.4/§3.9).
4. **CPF como alternativa a CNPJ** no cadastro (§3.1).
5. **Medida corporal em cm (busto/cintura/quadril)** além do tamanho de
   peça já implementado — necessidade real ou não (§3.1, gap novo desta
   consolidação).
6. **Escopo de Portal da Marca (`GESTOR_MARCA`)** — sem nenhum
   precedente, decisão de escopo do zero (§3.2).
7. **Modelo de Assessoria** — campo vs. entidade própria, depende de
   dado operacional real (§3.8).
8. **Provedor de assinatura digital** para contratos (§3.7).
9. **Cláusulas contratuais, versões por tipo de campanha, prazo de
   vigência/rescisão** (§3.7).
10. **Janela de permuta** — dias corridos e comportamento ao expirar sem
    escolha (herdado de `ESPECIFICACAO_FUNCIONAL_TEAR_V2.5.md` §12, não
    aprofundado aqui por não ter mudado).
11. **Escopo exato da importação do histórico legado** — quais abas,
    quais campos obrigatórios, o que descartar (§3.12).
12. **Comprovante de pagamento** — formato mínimo aceitável (upload de
    imagem/PDF é suficiente?) (§3.10, gap novo).

---

## 10. Resumo executivo — o que impede o TEAR de substituir integralmente a operação atual

O núcleo operacional (Cadastro → Aprovação → Campanha → Participação →
Briefing → Material → Aprovação → Pagamento) **já funciona e foi
validado ponta a ponta com dados reais** — esse não é o gargalo.

As lacunas que hoje impedem a substituição completa da operação manual
da Jescri, em ordem de urgência real:

1. **A influenciadora ainda não opera o próprio Portal.** Ela loga, mas
   não vê campanhas, não lê briefing, não envia material nem consulta
   pagamento por conta própria — toda essa parte do processo continua
   dependendo da equipe registrar em nome dela. Sem isso, o TEAR reduz
   trabalho manual da equipe, mas não elimina o intermediário.
2. **Duas decisões de negócio não tomadas travam o desenho técnico de
   Pagamento/Participação** (recorrência e congelamento) — enquanto
   pendentes, qualquer implementação corre o risco de reconstrução.
3. **Logística, Contratos, Produto/Variante e Permutas não existem** —
   são os módulos que fecham o ciclo físico e jurídico da campanha; sem
   eles, a operação continua saindo da plataforma para WhatsApp, Word e
   planilha para essas etapas específicas.
4. **LGPD e consentimento estão especificados e implementados no
   Cadastro**, mas a mesma disciplina de auditoria não existe ainda para
   Participação/Pagamento — risco jurídico residual enquanto o Portal
   abre mais edição de dado pessoal sem histórico correspondente nesses
   módulos.
5. **Histórico legado** segue sem decisão de escopo — não bloqueia a
   operação corrente, mas bloqueia o desligamento definitivo do Google
   Sheets como fonte de consulta histórica.

Nenhum desses pontos exige nova arquitetura ou troca de stack — todos
são extensões aditivas sobre o modelo já validado. O bloqueio real é de
**decisão de produto**, não de capacidade técnica: as 12 pendências do
§9, especialmente as 3 primeiras, são o que determina se as próximas
sprints constroem a coisa certa uma vez, ou reconstroem depois de uma
suposição errada.

---

Nenhum código foi escrito, nenhuma migration criada, nenhum Model ou
Controller alterado para produzir este documento. Este documento
consolida — sem duplicar — o conhecimento já produzido em 13 documentos
de `docs/` ao longo de 2026-07-20, e fecha os pontos da auditoria
funcional original que não haviam sido tratados em nenhuma fonte
anterior (§3.1 medidas corporais/observações/Instagram, §3.10
comprovante de pagamento, §3.12 viabilidade de importação do histórico
legado, §3.2/§9.6 Portal da Marca).
