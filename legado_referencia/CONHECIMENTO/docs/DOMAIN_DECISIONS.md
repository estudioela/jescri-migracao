# DOMAIN_DECISIONS.md — Decisões de domínio congeladas (Projeto Tear)

> **Fonte oficial das decisões de domínio do Projeto TEAR.**
> Este documento encerra a fase de auditoria (`docs/MIGRATION_AUDIT.md`) e congela as
> quatro decisões abertas (Q1–Q4) antes de qualquer implementação. A partir daqui, o
> M1 (Compilador da Geração do Mês) e os itens seguintes devem obedecer a estas
> decisões; divergências exigem alteração **deste** documento primeiro.
>
> Autor responsável (humano): Daniel Perrut. Decisões redigidas pelo Engenheiro
> Responsável (IA) com base na regra de precedência do `CLAUDE.md`:
> **Filosofia → SYSTEM_MAP → SYSTEM_TRUTH → KNOWN_DECISIONS**, e para o produto
> **documentação + CSVs + comportamento do legado têm prioridade sobre a implementação atual.**
>
> Data do congelamento: **2026-07-11**. Referência de rastreio: achados A1–A12 em
> `docs/MIGRATION_AUDIT.md`.

---

## Índice de decisões

| # | Tema | Decisão em uma linha | Achados |
|---|---|---|---|
| D1 | Estados & parser de quantidades | Manter as 13 fases como superconjunto + mapa canônico dos 4 estados do CSV; **corrigir** o parser (cobrir "uma/duas/três"). | A7, A12 |
| D2 | Ganchos operacionais | Ancorar `Chave_PIX`, `Drive`, `Sheet_Url_Looks`, `Endereco_Entrega` como colunas do header canônico de `Parceiros_Influenciadoras`; a subpasta mensal (`Drive_Ciclo`) é **por ciclo**, não no mestre. | A5 |
| D3 | Natureza do Pagamento | **Persistido**: aba `Pagamentos` própria, criada no setup, escrita pelo compilador; status/PIX/data próprios. Remover o read-model como fonte da verdade. | A3, A4 |
| D4 | Briefing | **Entidade persistida** (aba `Briefings`), 1 por parceira/ciclo; o compilador cria o esqueleto, o conteúdo rico entra depois (M5). | A10 |
| D5 | CSV como contrato do Core | CSVs (com XLSX de arquitetura como fallback) definem o contrato do domínio; legado = regra de negócio; V2 = implementação; divergência V2×CSV = migração. | A5, A11 |

---

## D1 — Estados de ativação & parser de quantidades  *(resolve Q1)*

### Decisão tomada
1. **Máquina de estados:** a V2 **mantém as 13 fases** de `ESTADOS_ATIVACAO` (`tear/Infra.js`)
   como o domínio operacional canônico. Os **4 status do CSV** (`EM ABERTO`, `ATRASADO`,
   `APROVADO`, `POSTADO`) passam a ser tratados como **projeções** desse domínio, com um
   mapa canônico fixo:

   | Status CSV / legado | Fase V2 canônica | Observação |
   |---|---|---|
   | `EM ABERTO` | `Planejamento` | estado inicial gravado pelo compilador |
   | `ATRASADO` | *(derivado — não é estado armazenado)* | é `EM ABERTO`/em produção com prazo vencido → `Estado_Derivado` (apresentação) |
   | `APROVADO` | `Aprovada` | — |
   | `POSTADO` | `Publicada` | dispara o ciclo de vida rumo a `Elegível para Pagamento`/`Arquivada` |

2. **Parser de quantidades:** **corrigir** o comportamento do legado. O parser da V2 deve
   reconhecer numerais por extenso incluindo o **feminino e singular/plural**:
   `um/uma`=1, `dois/duas`=2, `três/tres`=3, etc. O bug `textToNumber('Duas') === 0` do
   legado **não é replicado**.

### Justificativa
- As 13 fases já modelam o fluxo operacional real (produção, aprovação, agendamento,
  upload HD, elegibilidade de pagamento) que o negócio executa; os 4 status do CSV são
  uma **visão resumida** desse mesmo fluxo, não um domínio concorrente. "A arquitetura
  existe para servir ao negócio": aparar para 4 estados perderia rastreabilidade que a
  operação usa. O CSV continua sendo honrado — os 4 valores são reproduzíveis por projeção.
- `ATRASADO` no legado nunca foi um estado persistido estável: é uma condição temporal
  (prazo vencido). Mantê-lo como `Estado_Derivado` preserva o significado sem poluir a
  máquina de transições.
- O parser: o CSV BASE traz "Duas" para Stories (uma entregável **real**). Replicar o bug
  geraria **0 stories** e apagaria trabalho contratado — contraria a regra "preserve o
  domínio". A intenção de negócio (2 stories) prevalece sobre o defeito de implementação.

### Impacto na arquitetura
- `ESTADOS_ATIVACAO`, `Ativacao.TRANSICOES_PERMITIDAS` (`tear/Modelos.js`) e
  `ESTADOS_LOGISTICA` **permanecem inalterados**.
- O grafo de transições (hoje **inferido**, `SCHEMA_V2.md:42`) passa a ser considerado
  **confirmado** por esta decisão — deixa de ser pendência de A7.
- Introduz-se (na implementação) um **mapa de projeção** status-CSV ↔ fase-V2 e um
  **parser de quantidades** próprio da V2 (não se importa o `textToNumber` do legado).
  `ATRASADO` é responsabilidade da camada de apresentação (`Estado_Derivado`), não do domínio.

### Impacto na migração
- **Habilita M1:** o compilador grava `Planejamento` como estado inicial e usa o parser
  corrigido para explodir `Qtd_Reels`/`Qtd_Carrossel`/`Qtd_Stories`.
- **Testes exigidos (M1):** casos "uma/duas/três/um/dois" no parser; verificação de que
  "Duas" → 2 stories.
- **Fecha A7 e A12.** Import/export que precise dos 4 rótulos do CSV usa o mapa de projeção.

---

## D2 — Ganchos operacionais no header canônico  *(resolve Q2)*

### Decisão tomada
Os atributos operacionais **estáveis por parceira** passam a ser **colunas explícitas** do
header canônico de `Parceiros_Influenciadoras` (`cabecalhoParceirosV2_()` `tear/DevTools.js`):

| Coluna canônica (nova) | Substitui a coluna V1 | Natureza |
|---|---|---|
| `Chave_PIX` | `CHAVE_PIX` / PIX do CSV BASE | financeiro, por parceira |
| `Drive` | `DRIVE` (pasta raiz da parceira) | link Drive, por parceira |
| `Sheet_Url_Looks` | `INFLU_SHEET_URL` | URL da planilha individual de looks, por parceira |
| `Endereco_Entrega` | endereço formatado de entrega | logística, por parceira |

A subpasta **mensal** do Drive (`DRIVE_CICLO` na V1) **não** vai para o mestre: é um dado
**por ciclo × parceira** e será ancorada no contexto do ciclo/ativação, nunca mutando a
linha-mestre a cada mês.

### Justificativa
- `Parceiros_Influenciadoras` é horizontal (1 linha/parceira); PIX, pasta raiz, URL de
  looks e endereço são propriedades **estáveis da parceira** — pertencem ao mestre.
- Hoje esses ganchos são referenciados em runtime (`Services.js:78/324/335/639/686`) mas
  **não existem** no header → falham dentro de `try` fail-safe, em **silêncio** (A5). Trazer
  as colunas para o header é o que faz os fluxos (looks, provisionamento, PIX) voltarem a
  funcionar após a migração.
- `DRIVE_CICLO` é mutável a cada mês; guardá-lo no mestre reintroduziria a mutação de
  linha-mestre da V1. Como a V2 tem `Ciclos`/`Ativacoes`, o link mensal vive no escopo do
  ciclo — mais limpo e sem corrida de escrita no mestre.

### Impacto na arquitetura
- Amplia o header canônico e o **De-Para do ETL** (`tear/DevTools.js`) e o `SCHEMA_V2.md`.
- `AtivacaoService._looksDoBriefing`, `CicloService._provisionarPastasDoCiclo` e
  `ParceiroService.salvar/provisionar*` passam a resolver colunas **existentes** — o
  fail-safe deixa de mascarar ausência estrutural.
- Mantém a regra de ouro "acesso por NOME de coluna, nunca por índice".

### Impacto na migração
- É o escopo de **M4** (reancorar ganchos). O ETL de parceiros (Fase 2, `MIGRACAO_HABILITADA`)
  precisa mapear V1→V2 essas quatro colunas.
- **Risco de ordenação:** M4 mexe no header canônico enquanto o ETL da Fase 2 está ativo —
  executar apenas em **dry-run** primeiro e validar o De-Para antes de qualquer escrita real.
- **Fecha A5.** `Drive_Ciclo` por ciclo entra junto com o compilador (M1) e/ou M4.

---

## D3 — Natureza do Pagamento: persistido  *(resolve Q3)*

### Decisão tomada
Pagamento é uma **entidade persistida**, não um read-model derivado:
- A aba **`Pagamentos`** passa a ser **criada por `setupV2Database()`** e documentada no
  `SCHEMA_V2.md`, com `CAMPOS_PAGAMENTO` (ID, Ciclo, Influenciadora, `Valor_Cache`,
  `Chave_PIX`, `Status_Pagamento`, `Data_Pagamento`, `Mensagem_Pagamento`).
- O **compilador (M1)** grava **1 pagamento por parceira/ciclo** com status inicial
  `em aberto`.
- O `Status_Pagamento` evolui de forma **independente** (`em aberto` → `pago`), como ato
  administrativo próprio, com data e mensagem.
- O cruzamento `Planos × Ativacoes` deixa de ser a **fonte da verdade** do pagamento; no
  máximo alimenta a **elegibilidade** (postagem precede pagamento), mas o registro é persistido.

### Justificativa
- Precedência: **CSVs + legado** têm prioridade. A V1 tem aba `PAGAMENTOS` com
  `STATUS_PAGAMENTO`, PIX e arquivamento; o CSV reflete o mesmo. Pagamento tem **estado
  próprio** (`em aberto`/`pago`), data efetiva e mensagem — informação que **não é derivável**
  de Ativações (o pagamento é um evento financeiro posterior e independente da postagem).
- Resolve a ambiguidade A4 na direção correta: hoje a entidade `Pagamento` +
  `PagamentoRepository` estão órfãs porque a aba nunca é criada; a decisão as **integra** em
  vez de descartá-las.
- Corrige A3 na raiz: com pagamento persistido escrito pelo compilador,
  `apiListarPagamentosDoCiclo` para de devolver `[]`.

### Impacto na arquitetura
- `PagamentoRepository` (`tear/Repositories.js`) e a entidade `Pagamento` (`tear/Modelos.js`)
  saem de **código morto** para **caminho ativo**.
- `PagamentoService` muda de **derivador** (`Planos × Ativacoes`) para **leitor/gravador**
  da aba persistida.
- `cabecalhosV2_` (`tear/DevTools.js`) e `setupV2Database` passam a incluir a aba `Pagamentos`.
- Mantém "só Repository toca `SpreadsheetApp`" e o envelope `{success,data|error}`.

### Impacto na migração
- Escopo de **M3**, com dependência lógica de **M1** (o compilador é quem cria os registros).
- **Risco de ordenação (crítico):** promover Pagamento a persistido **sem** alterar
  `setupV2Database` causa `"Aba Pagamentos não encontrada"` em runtime — a criação da aba
  deve entrar **antes** ou **junto** da escrita.
- **Idempotência:** re-rodar o mês não pode duplicar pagamentos (1 por parceira/ciclo).
- **Fecha A4; contribui para A3** (A3 é encerrado de fato quando M1 grava planos e pagamentos).

---

## D4 — Briefing como entidade persistida  *(resolve Q4)*

### Decisão tomada
Briefing é uma **entidade persistida** própria (aba **`Briefings`**), **1 por parceira/ciclo**:
- Campos conforme o CSV BRIEFING: `Resumo_Do_Mes`, `Sobre_Reel`, `Sobre_Carrossel`,
  `Sobre_Stories` e as datas de aprovação por formato.
- O **compilador (M1)** cria o **esqueleto** (1 linha por parceira/ciclo, campos de conteúdo
  vazios), garantindo que a entidade exista para o ciclo.
- O **conteúdo rico** (resumo, textos "sobre", datas) é editado depois — modelagem e UI de
  edição são escopo de **M5**, não da Sprint 01.
- Os **looks ao vivo** (planilha individual, via `BriefingService.puxarLooks`) **continuam**
  como estão; o Briefing persistido não substitui a leitura de looks — a complementa.

### Justificativa
- O CSV BRIEFING (estrutura final por instrução do usuário) traz dados que **não têm onde
  morar** hoje (A10): `RESUMO DO MÊS`, textos "sobre" por formato e datas de aprovação. São
  1 por parceira/ciclo — cardinalidade de **entidade**, não de coluna solta em `Ativacoes`
  (que é por peça, N por parceira/ciclo). Colocar em `Ativacoes` duplicaria o resumo em cada
  peça.
- A Sprint 01 lista "Criar Briefings" — criar o esqueleto no compilador cumpre a sprint sem
  arrastar toda a UI de edição para o M1, preservando "uma responsabilidade por commit".

### Impacto na arquitetura
- Introduz (na implementação futura) aba `Briefings`, `CAMPOS_BRIEFING`, entidade e
  Repository próprios; `BriefingService` ganha persistência além da leitura de looks.
- `setupV2Database`/`cabecalhosV2_` (`tear/DevTools.js`) e `SCHEMA_V2.md` passam a incluir a aba.
- Relacionamento 1→1 parceira/ciclo; alimenta `Ativacoes` (`Look_Referencia`, `prazoAprovacao`).

### Impacto na migração
- M1 cria o **esqueleto** do Briefing (parte da explosão do mês); **M5** modela o conteúdo
  rico e a edição.
- **Idempotência:** 1 briefing por parceira/ciclo — re-rodar o mês não duplica.
- **Fecha A10** (parcial em M1, completo em M5).

---

## D5 — CSVs como contrato definitivo do Core Domain

### Decisão tomada
1. **Os CSVs definem o contrato definitivo do Core Domain:** nomes de abas, estrutura de abas,
   nomes de colunas, relacionamentos e entidades são definidos **exclusivamente** pelos CSVs
   (`DOCUMENTOS TEAR/PLANILHAS 2/NOVAS PLANILHA/`). Quando um CSV ainda não tiver sido exportado,
   a **aba correspondente no XLSX de arquitetura** (`[ELÃ] PROJETO TEAR 1.0.xlsx`) vale como
   **contrato provisório**, registrando-se que a exportação para CSV está pendente.
2. **O Apps Script legado (`mae/`) define exclusivamente as regras de negócio** — nunca a estrutura
  do domínio. A `PLANILHA ANTIGA.xlsx` é legado e, no fechamento do F0, foi usada de forma
  transitória para formalizar o contrato de dados de `PAGAMENTOS` (aba `PAGAMENTOS`).
3. **A arquitetura V2 (`tear/`) define exclusivamente a implementação.**
4. **Divergências entre V2 e CSV representam etapas de migração e nunca redefinem o domínio.**

### Justificativa
- A missão do projeto é **reconstruir o Core Domain** a partir de um contrato estável. Fixar os CSVs
  (e o XLSX de arquitetura como fallback) como fonte única elimina a ambiguidade de tratar a
  implementação atual como verdade — encerrando a raiz das divergências A5/A11.

### Impacto na arquitetura
- O documento `docs/CORE_DOMAIN.md` passa a ser o mapa oficial do contrato. Qualquer nome de aba/coluna
  da V2 que difira do CSV é **dívida de migração**, não referência.

### Impacto na migração
- Habilita o congelamento do domínio antes do M1. A renomeação de abas V2 → nomes de contrato torna-se
  uma **etapa estrutural** própria (alto risco, plano dedicado).
- **Ressalva atualizada (fechamento F0):** a entidade **PAGAMENTOS** foi formalizada por contrato de
  dados na aba `PAGAMENTOS` de `PLANILHA ANTIGA.xlsx`, com divergências mapeadas contra a V2 em
  `docs/CORE_DOMAIN.md`. A ausência continua restrita ao XLSX de arquitetura
  `[ELÃ] PROJETO TEAR 1.0.xlsx` e ao conjunto `NOVAS PLANILHA` (sem CSV exportado).

---

## Consequências transversais (efeito destas decisões sobre a fila de migração)

- **M1 (Compilador)** passa a ter escopo fechado: por parceira **ATIVA** de
  `Parceiros_Influenciadoras`, explode Ativações (parser corrigido — D1), 1 Logística,
  1 `Plano_Colaboracao`, **1 Pagamento persistido `em aberto`** (D3) e **1 esqueleto de
  Briefing** (D4); tudo **idempotente por ciclo**. Corrige A1/A2/A3.
- **Pré-requisito de setup (D3):** a aba `Pagamentos` (e, quando M5 chegar, `Briefings`)
  precisa existir em `setupV2Database` **antes** de o compilador escrever nelas.
- **D1** confirma o grafo de estados antes inferido — remove a incerteza de A7 para o M1.
- **D2** é pré-condição para o pós-migração parar de falhar em silêncio (A5), mas é
  independente de M1 e pode seguir em M4.

---

## Status

- **Congelado em 2026-07-11.** Estas decisões (D1–D5) são a **fonte oficial** das
  decisões de domínio do Projeto TEAR. **D5** (CSV como contrato) foi acrescentada na auditoria
  final de encerramento do domínio, sem alterar D1–D4.
- Alterar qualquer decisão exige editar **este documento** antes de tocar código.
- **Próximo passo:** iniciar **M1** (Compilador da Geração do Mês) sob D1–D4, com
  `test/tear-geracao-ciclo.test.js`, seguindo "uma responsabilidade por commit" e explicação
  pré-commit.
