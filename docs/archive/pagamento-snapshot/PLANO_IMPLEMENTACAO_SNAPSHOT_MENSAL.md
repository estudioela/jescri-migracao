# Revisão Conceitual — Snapshot Mensal / Agregado Operacional (TEAR V2.5)

**Data:** 2026-07-20
**Tipo:** Revisão conceitual (Business Analyst + Arquitetura). **Nenhuma
migration, model ou código foi criado para este documento.** Só leitura de
`docs/history/CONTRATO_SOBERANO.md`, `docs/specs/SPEC-005.md`, models e
migrations de `tear-v2-app/backend`.
**Gatilho:** antes de implementar P0-3 (`docs/CONSOLIDACAO_REGRAS_CRITICAS_P0_TEAR_V2.md`),
validar se `campanha_snapshots` é o agregado certo, a pedido do responsável
do projeto.
**Decisão sobre implementar:** **nenhuma migration será criada a partir
deste documento.** Aguardamos autorização explícita, conforme pedido.

---

## 0. Achado-chave, antes de responder às 3 perguntas

O legado (Sistema A) **não tem o conceito de Campanha**. O agregado por
competência ali é `Colaboração Mensal (Parceira × MesReferencia)`
(`CONTRATO_SOBERANO.md` §6.3) — todo mês, para toda Parceira ativa, existe
uma Colaboração, independente de qualquer "campanha" ou marca. É um modelo
de **uma agência com um cliente só** (Estúdio Elã), operando em ciclos
mensais uniformes.

O Sistema B **introduziu `Marca` e `Campanha`** (`tear-v2-app/backend/app/Models/Campanha.php`):
uma Campanha pertence a uma Marca, tem `data_inicio`/`data_fim` **livres**
(não amarradas a um mês calendário — podem durar semanas ou vários meses),
e `ParticipacaoNaCampanha` é quem carrega os termos comerciais
(`valor_contratado`, `reels_qtd`/`carrossel_qtd`/`stories_qtd`/`tiktok_qtd`/`ugc_qtd`).
Isso é uma mudança de modelo de negócio real (potencialmente multi-marca/
multi-cliente), não um detalhe de implementação — e já está construído e
testado (Sprint 1).

**Consequência direta:** a proposta do enunciado —
`Mês de ativação → Campanha → Participações → Produtos/Briefings/Pagamentos`
— coloca "Mês" como **pai** de Campanha. Isso não encaixa no modelo já
implementado: uma Campanha com `data_inicio: 2026-01-15` e
`data_fim: 2026-03-20` pertenceria a 3 meses ao mesmo tempo. "Mês" não é um
container natural de Campanha — é uma **dimensão de tempo que corta através
dela**, relevante só onde o negócio precisa de um corte periódico (hoje,
isso só existe explicitamente para pagamento).

A hierarquia que **já está implementada e é sólida** é:

```
Marca → Campanha → ParticipacaoNaCampanha → { Briefing, Material, Pagamento }
```

"Mês" não entra como container acima de Campanha. Entra (se entrar) como
uma dimensão **dentro** de `ParticipacaoNaCampanha`, só onde o negócio
realmente precisar de recorrência mensal (ver §2/§3).

---

## 1. Qual entidade representa melhor o "fechamento de um mês operacional"?

**Nenhuma, hoje — e talvez nenhuma seja necessária.** O modelo atual de
`Pagamento` é **1:1 com `ParticipacaoNaCampanha`** (`Pagamento::participacao()`,
`hasOne` em `ParticipacaoNaCampanha::pagamento()`) — um único pagamento por
participação, pela duração inteira dela, sem coluna de mês/competência em
`pagamentos`. Ou seja: **o Sistema B, como está construído, não tem hoje
nenhum processo recorrente mensal** — o "fechamento" que existe é o
fechamento da *participação*, não do *mês*.

Isso significa que a pergunta "qual entidade fecha o mês operacional" só
faz sentido **se** a operação realmente precisar de pagamento/compilação
recorrente mensal para participações de duração longa (ex.: uma
influenciadora contratada por 3 meses recebendo por competência, não de
uma vez). Essa é exatamente a pergunta 3 de P0-3, ainda 🟠 aberta para o
PO: *"compilação mensal em lote (modelo legado) ou vínculo individual por
campanha (modelo atual)?"* — este documento não a resolve, só a
reformula com mais precisão:

- Se a resposta for **"pagamento é por participação inteira, não mensal"**
  (o que o schema atual já reflete, sem ter sido uma decisão consciente até
  agora): **não existe fechamento de mês nenhum a modelar.** O trabalho de
  P0-3 se reduz só ao congelamento (§2), sem nova entidade de "mês".
- Se a resposta for **"algumas participações têm pagamento recorrente
  mensal"**: a entidade correta não é um pai de Campanha, é um **filho de
  `ParticipacaoNaCampanha`** — algo como `parcelas_da_participacao`
  (`participacao_id`, `mes_referencia`, `valor`, `status`), assumindo o
  papel que `Pagamento` tem hoje, mas fatiado por competência. Nome
  candidato mais preciso que `ativacao_mensal` (que sugere um agregado
  novo e independente): **`competencia_da_participacao`** ou
  `parcela_mensal` — deixa explícito que é uma fatia de tempo *de uma
  participação já existente*, não um novo container acima da hierarquia.

**Recomendação:** não nomear/criar essa entidade agora — é a decisão de
maior impacto do documento de consolidação P0 e depende do PO. Este
documento existe para não a resolver por engano ao escrever a migration
antes da hora.

---

## 2. O snapshot deve congelar a campanha inteira ou cada participação?

**Cada participação — nunca a campanha inteira.** Três razões, todas do
schema já implementado, não de preferência de estilo:

1. **Onde vivem os termos comerciais.** `Campanha` não tem
   `valor_contratado` nem quantidades — só `ParticipacaoNaCampanha` tem.
   Não existe "condição comercial da campanha" para congelar; existe
   condição comercial *de cada parceira dentro da campanha*.
2. **Ciclo de vida independente.** Uma Campanha é um container de longa
   duração ao qual participações são adicionadas/editadas/canceladas em
   momentos diferentes (`participacoes_na_campanha.status`
   `ATIVA`/`CANCELADA`, sem trava de edição hoje). Congelar a campanha
   inteira travaria participações que nada têm a ver entre si só porque
   compartilham uma Campanha — uma participação nova, ainda em negociação,
   ficaria presa pelo congelamento de outra já paga.
3. **Precedente do próprio legado.** `CondicaoComercialSnapshot`
   (`SPEC-005.md` §6) já era por Parceira × MesReferência — nunca por um
   agregado maior que agrupasse várias Parceiras. O equivalente estrutural
   em Sistema B é por `ParticipacaoNaCampanha`, não por `Campanha`.

**Chamar isso de `campanha_snapshots` é o nome errado** — sugere que o
congelamento é no nível de Campanha, quando na verdade ele é (e deve ser)
no nível de Participação. Se a intenção era "snapshot da campanha para
cada participante", o nome deveria refletir a participação, não a
campanha.

**Como implementar o congelamento (P0-3, item 1 — não bloqueado por PO):**
não precisa de tabela nova. Mesmo padrão já usado no legado
(`Object.freeze` + histórico) e já disponível em Sistema B:
- `participacoes_na_campanha` ganha `congelado_em` (timestamp, nullable) —
  setado quando a participação é confirmada/ativada.
- Edição de `valor_contratado`/quantidades após `congelado_em` não
  setado → passa normalmente; depois de setado → bloqueada, **ou** gera
  registro auditável (a decisão entre bloquear vs. permitir-com-histórico
  é a mesma pergunta já registrada em P0-3, não nova).
- Auditoria: `historico_alteracoes` hoje é **específica de `Parceira`**
  (FK direta `parceira_id`, não é polimórfica) — não dá para reaproveitar
  como está. Duas opções, ambas pequenas: (a) tabela irmã
  `historico_alteracoes_participacao` no mesmo formato; (b) generalizar
  `historico_alteracoes` para polimórfica (`auditable_type`/`auditable_id`).
  (b) é mais correto a longo prazo mas é uma mudança que atravessa
  `Parceira` também — maior, merece ser avaliada à parte, não decidida
  de lado dentro do P0-3.

---

## 3. Como isso conversa com contratos, logística, pagamentos e histórico?

- **Contratos (P0-2):** os dados contratuais (razão social, canais/prazo
  de uso de imagem) ficam em `Parceira` (cadastral, não muda por
  participação); mas quantidades/valor **do contrato gerado** devem ler o
  snapshot da **Participação**, nunca da Campanha — um documento gerado
  hoje para a Participação #42 não pode mudar retroativamente se alguém
  editar outra participação da mesma campanha amanhã. Reforça a resposta
  do item 2.
- **Logística (P0-4):** ainda não modelada em Sistema B. No legado,
  logística é por Colaboração Mensal (Parceira × Mês). Em Sistema B, dado
  que `Briefing`/`Material`/`Pagamento` já chaveiam por `participacao_id`
  (não por mês), a logística deveria seguir o mesmo padrão — chavear por
  `participacao_id` — para não introduzir uma chave de granularidade
  diferente das dos módulos vizinhos sem necessidade.
- **Pagamentos (P0-1, já implementado):** o gate de aprovação já
  implementado (`docs/IMPLEMENTACAO_P0_GATE_PAGAMENTO.md`) verifica
  `Material` por `participacao_id` — compatível com qualquer uma das duas
  respostas da pergunta em aberto (§1): se pagamento continuar 1:1 por
  participação, nada muda; se virar parcelado por competência, o gate
  passa a rodar por parcela, mesma lógica, sem redesenho.
- **Histórico:** ver §2 — a auditoria de edição pós-congelamento é o único
  ponto novo de histórico que este trabalho introduz; não cria um
  "histórico mensal" separado.

---

## 4. Resumo da recomendação

| Pergunta do enunciado | Resposta |
|---|---|
| `campanha_snapshots` é o nome/modelo certo? | **Não.** Implica congelar a Campanha inteira; os termos comerciais e o ciclo de vida que precisam de congelamento são da Participação. |
| `ativacao_mensal` (ou outro agregado mensal) é o certo? | **Só parcialmente, e só se o PO confirmar que existe pagamento recorrente mensal** (pergunta 3 de P0-3, ainda aberta). Mesmo nesse caso, não é um agregado pai de Campanha — é uma fatia de tempo dentro de `ParticipacaoNaCampanha` (nome sugerido: `competencia_da_participacao` / `parcela_mensal`, não `ativacao_mensal`, para não sugerir um container novo no topo da hierarquia). |
| Hierarquia real | `Marca → Campanha → ParticipacaoNaCampanha → {Briefing, Material, Pagamento}`, já implementada; "mês" não é container, é dimensão condicional dentro de Participação. |
| Granularidade do snapshot | Participação, sempre. |
| Nova tabela necessária agora? | **Não.** Congelamento = coluna `congelado_em` em `participacoes_na_campanha` + tabela de histórico (nova, pequena, ou generalização de `historico_alteracoes`). Nenhuma tabela "snapshot" separada. |

---

## 5. O que fica pendente de decisão do PO (não resolvido aqui)

Mesma pergunta já registrada em `docs/CONSOLIDACAO_REGRAS_CRITICAS_P0_TEAR_V2.md`
(P0-3, pergunta 3), reformulada com a precisão desta revisão:

> **Existe pagamento recorrente mensal para participações de longa duração,
> ou todo pagamento é uma vez só, pela participação inteira (como o schema
> de `pagamentos` já implementa hoje, sem que isso tenha sido uma decisão
> explícita)?**

Se a resposta for "uma vez só" — P0-3 se resume ao congelamento (§2 acima),
sem nenhuma entidade nova de competência/mês, e pode ser implementado sem
mais nenhuma decisão pendente.

---

## 6. Próximo passo

Aguardando autorização para implementar **apenas o congelamento** (§2 —
não bloqueado por PO) como primeira fatia de P0-3, deixando a
parcela/competência mensal (§1/§5) para depois da resposta do PO. Nenhuma
migration foi criada até este ponto.
