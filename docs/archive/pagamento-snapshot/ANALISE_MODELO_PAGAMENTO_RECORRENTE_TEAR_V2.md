# Análise Complementar — Modelo de Pagamento Recorrente (TEAR V2.5)

**Data:** 2026-07-20
**Tipo:** Análise técnica (Business Analyst + Arquitetura). **Nenhum
código ou migration foi criado/alterado para este documento** — só
leitura de models, migrations, requests, controllers e frontend de
`tear-v2-app`.
**Gatilho:** complemento a `docs/PLANO_IMPLEMENTACAO_SNAPSHOT_MENSAL.md`
(aprovado) — antes de decidir a forma do congelamento (campo
`congelado_em` vs. entidade de parcelas), responder se o modelo de
pagamento atual sustenta recorrência.

---

## 1. O sistema atual suporta pagamentos recorrentes por participação?

**Não — e não é só ausência de feature, é uma restrição estrutural em três
camadas:**

1. **Banco de dados:** `pagamentos.participacao_id` tem
   `unique()` (`database/migrations/2026_07_20_120000_create_pagamentos_table.php`).
   O banco **fisicamente impede** mais de um `Pagamento` por participação —
   não é uma checagem de aplicação que dá pra contornar, é uma constraint.
2. **Modelo (Eloquent):** `ParticipacaoNaCampanha::pagamento()` é
   `HasOne` (singular), e `Pagamento::participacao()` é `BelongsTo`
   simples. O relacionamento em código já assume "um".
3. **API e frontend:** as rotas são singulares —
   `GET/POST /participacoes/{participacao}/pagamento` (não
   `/pagamentos`), `PagamentoController::show` faz
   `$participacao->pagamento()->firstOrFail()`. `PagamentoPage.tsx` (frontend)
   é construída inteira em torno de **um objeto `Pagamento`**, com uma
   máquina de estados `PENDENTE → APROVADO → PAGO` — não existe conceito
   de lista/parcela em nenhuma camada.

**Precedente do legado, para contraste:** Sistema A já resolve esse
problema com um discriminador, não com duas tabelas — `ObrigacaoFinanceira`
tem `tipo` (`Mensal` | `Avulso`): `Mensal` é ligada à competência
(`MesReferencia`) e passa pelo gate de aprovação por conteúdo (P0-1
desta trilha); `Avulso` não tem competência, não passa pelo gate, é
liberação manual (`TASK_ROUTER.md`, SPEC-020). **Um único agregado, um
campo que muda o comportamento** — não um agregado paralelo.

---

## 2. Qual seria o impacto de criar `parcelas_mensais`?

Maior do que uma migration aditiva — é uma mudança que atravessa 4 camadas
já construídas e testadas:

| Camada | Mudança necessária | Tamanho |
|---|---|---|
| **Banco** | Remover `unique(participacao_id)` de `pagamentos`; adicionar `mes_referencia` (nullable, para preservar o caso "avulso"/pagamento único); nova unicidade composta `(participacao_id, mes_referencia)` | Média — constraint estrutural muda, não é só coluna nova |
| **Model** | `ParticipacaoNaCampanha::pagamento()` (HasOne) → `pagamentos()` (HasMany); `Pagamento` ganha `mes_referencia` | Média |
| **API** | Rotas singulares (`/participacoes/{id}/pagamento`) → coleção (`/participacoes/{id}/pagamentos`); `PagamentoController::show/store/update` reescritos para lidar com lista + seleção de parcela | Média-alta — quebra de contrato de API já em uso |
| **Frontend** | `PagamentoPage.tsx` redesenhada: de "1 pagamento, 1 status" para "lista de parcelas, status por parcela"; `lib/pagamentos.ts` (tipos/chamadas) refeito | Alta — é a tela mais tocada por esta mudança |
| **Testes** | `PagamentoTest.php` (14 testes atuais, todos assumem 1 pagamento por participação) — reescrita parcial | Média |

**Comparação com o congelamento (`congelado_em`):** o congelamento é
aditivo puro (uma coluna nullable, sem quebrar nada existente, sem tocar
API/frontend). `parcelas_mensais` **não é aditivo** — muda a forma como
`Pagamento` já é consumido em produção de teste (rotas, tipos, telas).
São ordens de grandeza diferentes de risco/esforço, e não deveriam ser
decididas com o mesmo peso.

**Recomendação de forma, se e quando for aprovado:** seguir o precedente
do legado (`ObrigacaoFinanceira.tipo`) em vez de um nome que sugere uma
entidade nova e paralela. Seria mais barato e mais consistente:
- manter a tabela `pagamentos` (não criar `parcelas_mensais` como tabela
  separada);
- adicionar `tipo` (`UNICO` | `RECORRENTE`, nomes a calibrar) +
  `mes_referencia` (nullable, só preenchido quando `RECORRENTE`);
- `HasMany` continua sendo só uma consequência de permitir múltiplas
  linhas por participação, não uma entidade conceitualmente nova.

Isso é uma opção de desenho, não uma decisão — só registrada aqui para
não ser esquecida quando/se a pergunta do PO (§3 abaixo) for respondida
"sim, existe recorrência".

---

## 3. Impacto em contratos, logística, aprovação, histórico e relatórios

### Contratos (P0-2, ainda não implementado)
Sem impacto estrutural: os campos contratuais (razão social, canais/prazo
de uso de imagem) ficam em `Parceira`; valor/quantidades do contrato
gerado já vêm de `ParticipacaoNaCampanha.valor_contratado` (o total
acordado), não de `Pagamento`. Se `Pagamento` virar parcelado, o contrato
segue mostrando o valor total da participação — só caberia, no futuro,
uma validação de reconciliação (`soma das parcelas == valor_contratado`),
não implementada agora e não bloqueante.

### Logística (P0-4, ainda não implementado)
Sem acoplamento direto. Se logística vier a ser modelada, deve chavear
por `participacao_id` (mesmo padrão de Briefing/Material/Pagamento) —
independente de o pagamento ser único ou parcelado.

### Aprovação (P0-1, já implementado)
**Aqui há um efeito real, não hipotético.** O gate hoje
(`PagamentoController::existeMaterialNaoAprovado`) roda **uma vez**, no
momento em que o único `Pagamento` da participação muda para `APROVADO`.
Se `Pagamento` virar parcelado, a pergunta que fica em aberto — e que
**não é a mesma pergunta 3 de P0-3**, é uma consequência nova dela — é:

> **Cada parcela mensal exige material aprovado só daquele mês, ou de
> toda a participação até ali?**

O legado responde por analogia (`Obrigação Mensal exige todas as
Entregas **da competência**` — SPEC-020) — sugerindo "só daquele mês",
mas isso não foi perguntado ainda para o Sistema B especificamente e deve
ser registrado como pergunta nova ao PO, não assumido, se `parcelas`
avançar.

### Histórico
Mesmo mecanismo já proposto no documento de congelamento
(`docs/PLANO_IMPLEMENTACAO_SNAPSHOT_MENSAL.md` §2) — se parcelas
existirem, edição de uma parcela já aprovada/paga deveria seguir a mesma
regra de trava/auditoria já desenhada para `ParticipacaoNaCampanha`, sem
mecanismo novo.

### Relatórios (nenhum módulo de relatório existe em Sistema B hoje)
Ponto a favor de `parcelas`, **se** a recorrência for confirmada: com
`Pagamento` único por participação (hoje), uma pergunta como "quanto foi
pago em julho" é mal definida para uma participação que atravessa vários
meses — o pagamento único não tem mês para ser atribuído. Parcelado por
`mes_referencia` resolve isso de graça, no mesmo padrão do
`PortalFinanceiroService` do Sistema A (previsto × pago por competência,
SPEC-030). **Mas isso não é motivo suficiente para criar a estrutura
preventivamente** — só é relevante se a recorrência de pagamento for
real; se não for, a pergunta de relatório mensal também não existe
(pagamento por participação inteira não precisa de corte por mês).

---

## 4. Resumo

| Pergunta | Resposta |
|---|---|
| Sistema atual suporta recorrência? | Não — bloqueado por constraint de banco (`unique`), modelo (`HasOne`), API e frontend, nas quatro camadas. |
| Impacto de `parcelas_mensais`? | Maior que aditivo: muda banco (unicidade), model (`HasMany`), API (rotas), frontend (tela inteira) e testes. Não é comparável em risco ao congelamento (`congelado_em`), que é puramente aditivo. |
| Nome recomendado, se aprovado | Não `parcelas_mensais` como tabela nova — estender `pagamentos` com `tipo` (`UNICO`/`RECORRENTE`) + `mes_referencia` nullable, mesmo padrão de `ObrigacaoFinanceira.tipo` do legado (`Mensal`/`Avulso`). |
| Efeito colateral novo, não previsto em P0-3 | O gate de aprovação (P0-1) precisaria de uma regra explícita — "aprovado por parcela" vs. "aprovado a nível de participação inteira" — pergunta nova ao PO, não coberta pela pergunta 3 original. |

---

## 5. Próximo passo

Este documento **não decide** entre `congelado_em` isolado ou entidade de
parcelas — só mede o custo de cada caminho para essa decisão ser tomada
com informação completa. Aguardando definição do responsável do projeto:

- Se a decisão for **não implementar recorrência agora**: seguir só com
  `congelado_em` em `participacoes_na_campanha` (baixo risco, aditivo,
  conforme `docs/PLANO_IMPLEMENTACAO_SNAPSHOT_MENSAL.md`).
- Se a decisão for **implementar recorrência**: antes da migration,
  confirmar com o PO a pergunta nova de §3 (gate por parcela vs. por
  participação inteira), para não implementar o gate com uma regra
  presumida.

Nenhum código ou migration foi criado a partir desta análise.
