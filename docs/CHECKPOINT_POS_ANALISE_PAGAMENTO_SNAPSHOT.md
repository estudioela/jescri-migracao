# Checkpoint — Pós Análise de Pagamento/Snapshot (TEAR V2.5)

**Data:** 2026-07-20
**Tipo:** Checkpoint de sessão. **Nada foi executado a partir deste
documento** — só consolida o que já foi decidido/feito nas etapas
anteriores desta mesma sessão.

---

## Decisões tomadas

1. **P0-1 implementado e aprovado.** Gate de pagamento por aprovação de
   conteúdo: `Pagamento` só aprova se todo `Material` da participação
   estiver `APROVADO` (vacuidade permitida). Commit `bca3d64`, documentado
   em `docs/IMPLEMENTACAO_P0_GATE_PAGAMENTO.md`. Testes 121/121 verde.
2. **Governança de PRs consolidada.** PR #42 retargetada de `main` para
   `feat/ui-design-system-ela` e mergeada, junto com a #43 — nenhum
   conflito. Nova PR **#44** (`feat/ui-design-system-ela` → `main`) aberta
   e testada (backend 121/121, `pint`/`tsc`/`oxlint` limpos, `vite build`
   ok), cobrindo Sprint 2.1 + P0-1 + as duas auditorias. Detalhe completo
   em `docs/RELATORIO_CONSOLIDACAO_FINAL_TEAR_V2.md`.
3. **Hierarquia operacional confirmada como já implementada e correta:**
   `Marca → Campanha → ParticipacaoNaCampanha → {Briefing, Material, Pagamento}`.
   "Mês" não é container acima de `Campanha` — é dimensão condicional,
   só relevante dentro de `ParticipacaoNaCampanha` (ver decisões
   rejeitadas). Análise em `docs/PLANO_IMPLEMENTACAO_SNAPSHOT_MENSAL.md`.
4. **Granularidade do futuro congelamento definida:** por
   `ParticipacaoNaCampanha`, nunca por `Campanha` inteira — é onde vivem
   `valor_contratado` e as quantidades contratadas; `Campanha` não tem
   termos comerciais próprios para congelar.
5. **Diagnóstico do modelo de pagamento concluído.** Confirmado, por
   evidência de schema (não suposição): o Sistema B **não suporta**
   pagamento recorrente hoje — bloqueado por `unique(participacao_id)` em
   `pagamentos`, relação `HasOne`, e API/frontend construídos em torno de
   um único `Pagamento` por participação. Análise em
   `docs/ANALISE_MODELO_PAGAMENTO_RECORRENTE_TEAR_V2.md`.

---

## Decisões rejeitadas

1. **`campanha_snapshots` como nome/modelo de congelamento** — rejeitado.
   Erra a granularidade: sugere congelar a `Campanha` inteira, mas os
   termos comerciais e o ciclo de vida que precisam de imutabilidade são
   da `Participação`, não da `Campanha` (que agrupa participações com
   vidas independentes).
2. **`ativacao_mensal` como agregado pai de `Campanha`** — rejeitado.
   `Campanha` tem `data_inicio`/`data_fim` livres (não presas a um mês
   calendário); uma campanha de janeiro a março pertenceria a 3 "meses"
   ao mesmo tempo se "mês" fosse container. Se uma dimensão mensal for
   necessária (condicionado à decisão nº 2 abaixo), ela entra **dentro**
   de `ParticipacaoNaCampanha`, nunca acima de `Campanha`.
3. **Criar `parcelas_mensais` como tabela nova, agora** — não
   implementado. Não é uma mudança aditiva (exige remover constraint de
   unicidade, trocar `HasOne`→`HasMany`, redesenhar rotas e a tela
   `PagamentoPage.tsx` inteira) — custo bem maior que o congelamento
   simples. Recomendado (se um dia aprovado): estender `pagamentos` com
   `tipo` (`UNICO`/`RECORRENTE`) + `mes_referencia`, seguindo o precedente
   do legado (`ObrigacaoFinanceira.tipo` Mensal/Avulso), em vez de criar
   uma entidade paralela.
4. **Fechar PRs antigas (#1, #13, #17, #27) automaticamente** — não
   executado, por instrução explícita ("não fechar automaticamente").
   Ficam como recomendação registrada em
   `docs/RELATORIO_CONSOLIDACAO_FINAL_TEAR_V2.md`.
5. **Mergear PR #44 em `main`** — ainda não executado. Está pronta
   (`CLEAN`/testada), mas essa ação específica não foi autorizada nesta
   sessão; segue aberta aguardando decisão.

---

## Modelo operacional escolhido

- **Hierarquia de agregados:** `Marca → Campanha → ParticipacaoNaCampanha
  → {Briefing, Material, Pagamento}` — já implementada, validada como
  correta nesta sessão, sem mudança de schema proposta aqui.
- **Congelamento (quando implementado):** campo `congelado_em` (timestamp
  nullable) em `participacoes_na_campanha` + auditoria (tabela irmã de
  `historico_alteracoes` ou generalização polimórfica dela — decisão de
  detalhe, não de modelo). **Ainda não implementado** — depende da
  definição de forma (ver "Próxima tarefa").
- **Pagamento:** permanece 1:1 por participação, sem recorrência, até
  decisão em contrário do responsável do projeto.
- **Perguntas abertas para o PO, acumuladas até aqui** (nenhuma bloqueia
  o congelamento):
  - P0-1: "Aprovado" basta ou publicação é obrigatória? (não bloqueante,
    já implementado com o default do legado)
  - P0-2: `canais_uso_imagem` — lista fechada ou texto livre?
  - P0-3 pergunta 3 (reformulada nesta sessão): existe pagamento
    recorrente mensal, ou todo pagamento é único por participação (como
    o schema já implementa hoje)?
  - Nova, desta análise: **se** parcelas forem aprovadas, o gate de
    aprovação (P0-1) roda por parcela ou pela participação inteira?

---

## Próxima tarefa recomendada

1. **Decisão do responsável:** escolher entre as duas formas de
   congelamento —
   (a) só `congelado_em` (aditivo, baixo risco, não depende de resposta
   sobre recorrência) ou
   (b) esperar a resposta do PO sobre pagamento recorrente antes de
   desenhar qualquer coisa que toque `Pagamento`.
   Recomendação técnica: **seguir com (a) agora** — é independente da
   pergunta de recorrência e destrava P0-3 item 1 sem esperar o PO.
2. Em paralelo, decisão sobre mergear a **PR #44** em `main` (pronta,
   testada, sem pendência técnica).
3. Depois de (1) e (2): retomar a fila de P0 já definida em
   `docs/PLANO_PROXIMA_SPRINT_TEAR_V2.md` — próximo item é **P0-5**
   (cálculo automático da data de aprovação de briefing).

Nenhum código, migration ou merge foi executado a partir deste checkpoint.
