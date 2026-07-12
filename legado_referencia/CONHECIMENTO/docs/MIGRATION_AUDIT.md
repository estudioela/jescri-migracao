# MIGRATION_AUDIT.md — Memória viva da migração V1 → V2 (Projeto Tear)

> Documento vivo. Atualizado continuamente durante a migração operacional.
> Responde: **o que descobrimos, o que está quebrado, o que falta migrar e em que ordem.**
>
> Autor responsável (humano): Daniel Perrut. Rascunho assistido por IA (Engenheiro Responsável).
> Início: 2026-07-11. Base de leitura: `DOCUMENTOS TEAR/` (MKs + CSVs + legado), `docs/` (estratégicos),
> CSVs `NOVAS PLANILHA/`, código legado `mae/`, arquitetura V2 `tear/`.
>
> Regra de precedência (CLAUDE.md → Fonte de decisão):
> **Filosofia → SYSTEM_MAP → SYSTEM_TRUTH → KNOWN_DECISIONS**, e para o produto:
> **documentação + CSVs têm prioridade sobre a implementação atual.**

---

## 0. Reconciliação de direção (conflito estratégico resolvido)

Há um conflito aparente entre documentos:

- **MK 04 / MK 05** descrevem uma **reconstrução total** para PostgreSQL + React (sessão Lovable).
- **`docs/V2_ROADMAP.md` (oficial)** afirma o oposto e **explícito**: a V2 **permanece em Google
  Apps Script**; migração para Supabase/PostgreSQL/Next.js/NestJS **não faz parte da V2** — fica para
  uma eventual V3.

**Decisão adotada (vale para toda esta migração):** a fonte de autoridade é o `V2_ROADMAP.md` +
`SYSTEM_MAP.md`. Os MKs são **mapa de conhecimento do domínio** (regras de negócio, fluxos,
semântica) — usados como especificação **de comportamento**, não de stack. Onde um MK sugerir stack
nova, ignora-se a stack e preserva-se a **regra de negócio**. Toda regra abaixo foi rastreada a um MK,
a um CSV ou ao código legado.

---

## 1. Estado atual (fatos)

- Branch: `feat/etl-parceiros-dryrun`. Sprint ativa: **Sprint 01 — Geração do Mês** (`docs/SPRINT_01_GERACAO_DO_MES.md`).
- Fase 1 (arquitetura + UI de Logística/Ativações) concluída. Fase 2 (ETL de parceiros) em andamento:
  transform + dry-run prontos; escrita real gated por `MIGRACAO_HABILITADA`.
- Arquitetura V2 (`tear/`, escopo global do Apps Script): `Roteador → Controllers → Services →
  Repositories → Infra/Modelos`. Só Repository toca `SpreadsheetApp`. Envelope `{success,data|error}`.
- Abas V2 criadas por `setupV2Database()`: **Parceiros_Influenciadoras, Logistica, Ciclos, Ativacoes,
  Planos_Colaboracao**. (Coexistem com as abas da V1; nomes distintos.)

---

## 2. Achados da auditoria

Severidade: 🔴 crítico (quebra regra de negócio central) · 🟠 alto · 🟡 médio · ⚪ baixo/doc.

### 🔴 A1 — O "Compilador" (Geração do Mês) é um stub: não gera nada
`CicloService.gerarCicloMensal` (`tear/Services.js:254`) chama `_gerarEstruturasOperacionais`
(`:286`) que **retorna contadores zerados** (`{briefings:0, ativacoes:0, logistica:0, pagamentos:0}`)
e **não cria nenhuma linha** de Ativações, Logística, Pagamentos, Planos nem Briefing.
Este é exatamente o objetivo da Sprint 01 e o fluxo mais crítico do negócio (MK 01 §3.1, MK 02 §3.1 —
"explosão de dados"). Hoje só cria o registro do ciclo e (tenta) subpastas do Drive.
- **Impacto:** a operação mensal inteira inexiste na V2. Nada para a parceira ver no Portal.
- **Correto (legado `gerarNovoMesCompleto` `mae/Código.js:86`):** para cada parceira **ATIVA**, explode
  `Qtd_Reels` REELs + `Qtd_Carrossel` CARROSSÉis + `Qtd_Stories` STORIES; 1 linha de Logística; 1 de
  Pagamento; 1 linha de Briefing; ordena por data.

### 🔴 A2 — Fonte de dados errada na geração + filtro que nunca casa
`_gerarEstruturasOperacionais` lê parceiras de `cadastroRepository.linhas()` — a aba **CADASTROS**
(entrada RAW do Forms), que **não tem** coluna `Status_Contrato` — e filtra por `ON/ATIVO`
(`tear/Services.js:291`). Como a coluna não existe, o filtro **sempre resulta 0**.
- **Correto:** ler de `ParceiroRepository` (aba canônica `Parceiros_Influenciadoras`) e filtrar
  `Status_Contrato === 'ATIVO'`. CADASTROS é antessala de cadastro, não a lista de ativas.

### 🔴 A3 — `Planos_Colaboracao` nunca é escrita → Pagamentos sempre vazio
`PlanoRepository` (`tear/Repositories.js:161`) só tem `findByCiclo` (leitura). **Nenhum código escreve
planos.** `PagamentoService.listarPorCiclo` depende deles (`tear/Services.js:436`), então
`apiListarPagamentosDoCiclo` **sempre devolve `[]`**. O compilador (A1) é quem deveria criar 1 plano por
parceira/ciclo (`Qtd_Entregaveis`, `Valor_Cache`).

### 🟠 A4 — Entidade `Pagamento` + `PagamentoRepository` são código morto e conflitam com o modelo de leitura
Há **duas concepções de Pagamento** que se contradizem:
1. **Modelo de leitura derivado** — `PagamentoService` cruza `Planos_Colaboracao` × `Ativacoes`, sem aba
   própria (`tear/Services.js:412`). É o que o entrypoint usa (`tear/Roteador.js:374`).
2. **Entidade persistida** — `Pagamento` (`tear/Modelos.js:303`) + `PagamentoRepository`
   (`tear/Repositories.js:691`) sobre uma aba `Pagamentos` com `CAMPOS_PAGAMENTO` (ID, Valor_Cache,
   Chave_PIX, Status_Pagamento, Data_Pagamento, Mensagem_Pagamento).
- **A #2 está totalmente órfã:** `PagamentoRepository`/`Pagamento` não são instanciados em nenhum
  Service/entrypoint; a aba `Pagamentos` **não é criada** por `setupV2Database` nem consta em
  `SCHEMA_V2.md`. Se usada, lançaria "Aba Pagamentos não encontrada".
- **Decisão de domínio pendente:** Pagamento é **derivado** (read-model) ou **persistido** (tem status
  próprio `em aberto/pago`, PIX, data — como na V1 e nos CSVs)? Os CSVs/legado sugerem **persistido**
  (a V1 tem aba PAGAMENTOS com STATUS_PAGAMENTO e arquivamento). Ver Q3.

### 🟠 A5 — Fluxos que quebram silenciosamente após a migração (colunas V1 ausentes no header canônico)
O header canônico `Parceiros_Influenciadoras` (`cabecalhoParceirosV2_()` `tear/DevTools.js:17`) é:
`ID_Influenciadora, Nome, Status_Contrato, Categoria, Cupom, Qtd_Reels, Qtd_Carrossel, Qtd_Stories,
Valor_Total_Contrato, Looks_Qtd, Endereço_Formatado, Senha_Hash`.
Mas o runtime V2 ainda referencia colunas **físicas da V1 que não existem nesse header**:
| Consumidor | Coluna V1 referenciada | Efeito pós-migração |
|---|---|---|
| `AtivacaoService._looksDoBriefing` (`Services.js:78`) | `INFLU_SHEET_URL` | looks do briefing sempre vazios |
| `CicloService._provisionarPastasDoCiclo` (`Services.js:324/335`) | `DRIVE`, `INFLU_KEY`, `DRIVE_CICLO` | subpasta mensal nunca gravada (no-op fail-safe) |
| `ParceiroService.salvar/provisionar*` (`Services.js:639/686`) | `INFLU_KEY`, `DRIVE`, `CUPOM` | wizard admin não casa (débito já registrado no PROJECT_STATUS) |
Todos estão dentro de `try` fail-safe → **falham em silêncio**, sem log de alerta claro para o operador.
- **Causa raiz:** o header canônico não carrega os "ganchos operacionais" da V1 (pasta raiz do Drive,
  URL da planilha individual de looks, PIX, endereço de entrega). Ver Q2.

### 🟠 A6 — Regra de data de aprovação incompleta na V2 (perde o ajuste de fim de semana)
Legado `calcularDataAprovacao` (`mae/Código.js:317`): entrega **− 7 dias**, **e então** empurra para
dia útil — Sexta→+3, Sábado→+2, Domingo→+1 (cai na segunda), fixando 12h. A V2
(`dataMenosDiasCorridos` `tear/Modelos.js:138`, usada em `AtivacaoService._paraDto:145`) faz **só −7
corridos, sem ajuste de fim de semana**. O CSV BRIEFING diz literalmente "usar regras conforme
planilha antiga/script antigo" → o ajuste faz parte da regra. **Divergência de comportamento.**

### 🟡 A7 — Vocabulário de estados: CSV/legado (4 estados) × V2 (13 estados)
CSV ATIVAÇÕES define STATUS = `EM ABERTO, ATRASADO, APROVADO, POSTADO` (+ derivado). O legado grava
`em aberto` e arquiva em `postado`. A V2 tem **13 estados** (`ESTADOS_ATIVACAO`) com grafo de
transições **inferido** (o próprio `SCHEMA_V2.md:42` pede confirmação). O CSV é "estrutura final" por
instrução do usuário. Precisa reconciliar: o conjunto V2 é um superconjunto — mapear os 4 do CSV para
subconjunto dos 13, ou aparar a máquina. Ver Q1.

### 🟡 A8 — `Nota_Fiscal_Anexa` é coluna documentada e nunca usada
`SCHEMA_V2.md:26` lista `Nota_Fiscal_Anexa` em `Ativacoes`, mas `CAMPOS_ATIVACAO`
(`tear/Repositories.js:12`) não a inclui — nenhum Repository/Service lê/escreve. Coluna órfã
(documentada, sem uso) ou campo a implementar. Decidir manter+usar ou remover do schema.

### 🟡 A9 — Ciclo nasce sem datas de operação
`gerarCicloMensal` grava só `ID_Ciclo` e `Nome_Ciclo` (`Services.js:262`). `Data_Inicio_Logistica` e
`Data_Fim_Operacao` (`CAMPOS_CICLO`) **nunca são preenchidas**. A janela logística do ciclo fica sem
âncora temporal (a V1 amarrava datas de aprovação ao cronograma).

### 🟡 A10 — Briefing não é entidade na V2 (perda de campos do CSV)
O CSV BRIEFING tem `RESUMO DO MÊS` (texto admin), `SOBRE REEL/CARROSSEL/STORIES` (briefing textual) e
`APROVACAO *` (datas). Na V2 **não há aba/entidade Briefing**: `BriefingService` só puxa **looks** ao
vivo da planilha individual. O `RESUMO DO MÊS` e os textos `SOBRE` não têm onde morar. A Sprint 01
lista "Criar Briefings" — hoje inexistente. **Entidade ausente.** Ver Q4.

### ⚪ A11 — Documentação com pequenas defasagens
- `SCHEMA_V2.md` referencia `tear/Config.js`, `tear/Ativacao.js`, `tear/Senha.js` — na verdade
  consolidados em `Infra.js`/`Modelos.js`. Nomes de arquivo divergem da árvore real.
- `SCHEMA_V2.md` **não documenta** a aba/entidade `Pagamentos` (existe em código, A4).
- `KNOWN_DECISIONS.md` diz "identificar parceiros por `INFLU_KEY`" e "buscar por EMAIL/CNPJ" — a base
  canônica migrada usa `ID_Influenciadora`/`Cupom`; a decisão está defasada face à Fase 2.

### ⚪ A12 — Quirk legado: `textToNumber('Duas') === 0`
`textToNumber` (`mae/Código.js:1151`) reconhece "dois" mas **não** "duas" (nem "três" via "tres" ok).
No BASE.csv a quantidade de Stories aparece como **"Duas"** → geraria **0** stories. Ao portar a
explosão para a V2, decidir se replicamos o bug (fidelidade) ou corrigimos (intenção). Recomendo
**corrigir** e cobrir "duas/três/uma" no parser da V2. Ver Q1.

---

## 3. Mapa do Domínio (V2)

> Objetivo: entender todo o domínio olhando só esta seção. Legenda de status:
> ✅ implementado · 🟨 parcial · ❌ ausente/stub · 💀 código morto.

### Parceira / Influenciadora ✅ (com dívidas A5/A11)
- **Finalidade:** cadastro mestre da influenciadora parceira (identidade, contrato, credencial).
- **Origem:** Google Forms → aba `CADASTROS` → `onFormSubmit` (canônico); e ETL da V1 (`BASE DE DADOS`).
- **Destino:** aba `Parceiros_Influenciadoras` (horizontal, 1 linha/parceira; acoplada ao Autocrat).
- **Repository:** `ParceiroRepository` · **Service:** `ParceiroService` · **Controller:** `ParceiroController`
- **Entrypoints:** `apiBuscarParceira`, `apiSalvarParceira` (admin), `onFormSubmit` (automação).
- **Relacionamentos:** 1→N `Ativacoes`, `Logistica`, `Planos_Colaboracao` (por `ID_Influenciadora`).
- **Regras:** identidade `ID_Influenciadora` (= apelido caixa-alta / `INFLU_KEY` da V1); `Cupom` = login;
  `Senha_Hash` (`salt$hash`, nunca em claro); Status ON/OFF→ATIVO/INATIVO; "Sem ON, sem trabalho".

### Ciclo (mês de competência) 🟨
- **Finalidade:** janela temporal que agrupa a operação de um mês.
- **Origem:** ação admin (`apiGerarCicloMensal`). **Destino:** aba `Ciclos`.
- **Repository:** `CicloRepository` (listar/criar idempotente) · **Service:** `CicloService` ·
  **Controller:** `CicloController`.
- **Relacionamentos:** 1→N `Ativacoes`, `Logistica`, `Planos_Colaboracao` (por `ID_Ciclo`; id = `AAAA-MM`).
- **Pendências:** datas de operação não preenchidas (A9); geração operacional stub (A1).

### Plano_Colaboracao (junção parceira×ciclo) 🟨 (só leitura)
- **Finalidade:** volume e valor acordados de uma parceira num ciclo (`Qtd_Entregaveis`, `Valor_Cache`).
- **Origem:** *deveria* ser o compilador (A3) — hoje **ninguém escreve**. **Destino:** aba `Planos_Colaboracao`.
- **Repository:** `PlanoRepository` (só `findByCiclo`) · **Service:** consumido por `PagamentoService`.
- **Relacionamentos:** N→1 `Parceira`, N→1 `Ciclo`. Base do cálculo de Pagamento.

### Ativação (peça de conteúdo) ✅ (fluxo unitário) / ❌ (geração)
- **Finalidade:** unidade operacional central — uma peça (REEL/CARROSSEL/STORIES) por parceira/ciclo.
- **Origem:** *deveria* ser o compilador (A1) — hoje não nasce. **Destino:** aba `Ativacoes`.
- **Repository:** `AtivacaoRepository` · **Service:** `AtivacaoService` · **Controller:** `AtivacaoController`.
- **Entrypoints:** `apiListarAtivacoesDoCiclo`, `apiObterAtivacao`, `apiAlterarEstadoDaAtivacao`,
  `apiListarHistoricoDoCiclo`, `apiListarAtivacoesAdmin`, `apiAlterarEstadoAtivacaoAdmin`.
- **Máquina de estados:** 13 estados (`Ativacao.TRANSICOES_PERMITIDAS`), `Arquivada` terminal. Grafo
  **inferido** (A7). `prazoAprovacao` derivado (−7 dias; ver A6). `Estado_Derivado` = apresentação,
  ignorado pelo domínio e preservado em `save` (fórmula).
- **Relacionamentos:** N→1 `Parceira`, N→1 `Ciclo`. Publicação dispara elegibilidade de Pagamento.

### Logística (envio físico) ✅ (fluxo) / ❌ (geração)
- **Finalidade:** envio de peças/looks à parceira. Uma linha = um envio.
- **Origem:** *deveria* ser o compilador — hoje não nasce. **Destino:** aba `Logistica`.
- **Repository:** `LogisticaRepository` · **Service:** `LogisticaService` · **Controller:** `LogisticaController`.
- **Entrypoints:** `apiListarLogisticaDoCiclo`, `apiAlterarStatusLogistica` (admin), `registrarEnvio`/`CHANGE_STATUS` (parceira).
- **Máquina de estados:** 5 estados (Pendente→Aguardando Envio→Enviado→Entregue; Cancelado terminal).
  Evento `LogisticaEnviada` (notificação como evento, sem e-mail acoplado). Grafo inferido da V1.
- **Regra de ouro:** logística precede conteúdo (sem produto, sem cobrança).

### Pagamento ⚠️ (ambíguo: read-model ✅ vazio / entidade 💀)
- **Finalidade:** contrapartida financeira (cachê) por parceira/ciclo.
- **Concepção atual (usada):** read-model derivado de `Planos × Ativacoes` (estado `Pendente`/`Elegível`).
  Sempre vazio hoje (A3). **Concepção órfã:** aba `Pagamentos` + `PagamentoRepository` + entidade
  `Pagamento` (💀, A4).
- **Service:** `PagamentoService` · **Controller:** `PagamentoController` · **Entrypoint:** `apiListarPagamentosDoCiclo`.
- **Regra de ouro:** postagem precede pagamento. Decisão pendente (Q3).

### Briefing ❌ (ausente como entidade)
- **Finalidade:** planejamento criativo do mês (resumo, looks por formato, textos "sobre", datas aprovação).
- **Origem/legado:** aba `BRIEFING` da V1 + looks da planilha individual (`LOOKS BRIEFING`).
- **V2 hoje:** só `BriefingService.puxarLooks` (looks ao vivo). Sem persistência de resumo/sobre/datas (A10).
- **Relacionamentos:** 1→1 parceira/ciclo; alimenta `Ativacoes` (Look_Referencia, prazoAprovacao).

### Sessão / Autenticação ✅
- **Finalidade:** sessão da parceira no Portal; autorização admin.
- **Repository:** `SessaoRepository` (CacheService; TTL, rate-limit) · **Service:** `AuthService`.
- **Entrypoints:** `apiLogin`, `apiSessaoAtual`, `apiLogout`; admin via `_exigirAdmin` + `ADMIN_TOKEN`.
- **Regras:** mensagens de erro indistinguíveis (anti-enumeração); comparação tempo-constante; identidade
  sempre do token, nunca do cliente.

### Cadastro (RAW) ✅
- **Finalidade:** antessala do cadastro (respostas cruas do Forms). **Aba:** `CADASTROS`.
- **Repository:** `CadastroRepository` · consumido por `ParceiroService` (funil + fonte de CNPJ p/ senha padrão).
- **Regra:** resolução de endereço por CEP multi-API (ViaCEP→BrasilAPI→AwesomeAPI→OpenCEP), fail-safe.

---

## 4. Regras de negócio descobertas (legado — a preservar)

1. **Explosão do mês** (`gerarNovoMesCompleto`): por parceira ATIVA → `Qtd_Reels`×REEL +
   `Qtd_Carrossel`×CARROSSEL + `Qtd_Stories`×STORIES (rótulo `STORIES_1/2` quando >1) + 1 Logística
   (`Aguardando Confirmação`/`pendente`) + 1 Pagamento (`em aberto`) + 1 linha Briefing. Status inicial
   `em aberto`. Ordena por data.
2. **Quantidades textuais**: "Um"=1, "Dois/Duas"=2, "Três"=3... (parser V2 deve cobrir feminino — A12).
3. **Data de aprovação**: entrega − 7 dias, empurrando para dia útil (Sex/Sáb/Dom → segunda), 12h (A6).
4. **Looks do briefing**: lidos da planilha individual da parceira (`LOOKS BRIEFING`, col A→B, Title Case).
5. **Arquivamento**: `postado` → HISTÓRICO DE CONTEÚDOS; `pago` → HISTÓRICO DE PAGAMENTOS (na V2, o
   estado `Arquivada` é terminal; "histórico" = ciclo de vida, não aba).
6. **Endereço**: CEP resolve Rua/Bairro/Cidade/UF; formato Autocrat "RUA, Nº, COMPL, BAIRRO - CIDADE/UF, CEP".
7. **Senha padrão**: 5 primeiros dígitos do CNPJ (só hash na V2), trocável depois.

---

## 5. Inconsistências CSV ↔ código (resumo)

| Tema | CSV / legado | Código V2 | Achado |
|---|---|---|---|
| Estados de ativação | 4 (EM ABERTO/ATRASADO/APROVADO/POSTADO) | 13 estados | A7 (reconciliar) |
| Data aprovação | −7d + ajuste fim de semana | −7d corridos apenas | A6 |
| Qtd Stories "Duas" | "Duas" | parser não cobre "duas" | A12 |
| Briefing (resumo/sobre) | colunas ricas no CSV | sem entidade | A10 |
| Pagamento | aba com STATUS/PIX/arquivo | read-model derivado + repo órfão | A4 |
| Pasta Drive / looks | `DRIVE`, `INFLU_SHEET_URL` na base | ausentes no header canônico | A5 |

---

## 6. Fila de Migração (ordenada)

> Ordem por dependência e risco. Cada item: objetivo · arquivos · impacto · riscos · testes · dependências.
> **Regra do projeto:** uma responsabilidade por commit; testes verdes antes do commit; sem push/deploy
> sem autorização; sem executar ETL/produção.

### M0 — Decisões de domínio (bloqueia M1+) 🟡 humano
- **Objetivo:** fechar as questões abertas (Q1–Q4 abaixo) antes de codar o compilador.
- **Impacto:** define máquina de estados, natureza do Pagamento, entidade Briefing, ganchos operacionais.
- **Dependências:** nenhuma. **Testes:** — (decisão).

### M1 — Compilador da Geração do Mês (núcleo Sprint 01) 🔴
- **Objetivo:** `gerarCicloMensal` passa a explodir, por parceira ATIVA de `Parceiros_Influenciadoras`:
  Ativações (por Qtd_*), 1 Logística, 1 Plano_Colaboracao (Qtd_Entregaveis+Valor_Cache); idempotente por ciclo.
- **Arquivos:** `tear/Services.js` (CicloService), `tear/Repositories.js` (writer de `PlanoRepository`;
  `Ativacao/Logistica` já têm `save`), possivelmente `tear/Modelos.js`.
- **Impacto:** a operação mensal passa a existir na V2; Portal ganha conteúdo real.
- **Riscos:** idempotência (não duplicar ao re-rodar o mês); parceira ATIVA vs CADASTROS (A2);
  desempenho (batch, evitar N chamadas SpreadsheetApp em loop — diretriz GAS).
- **Testes:** `test/tear-geracao-ciclo.test.js` (novo): N ativações por quantidade, 1 logística/plano por
  parceira, filtro ATIVO, idempotência, parser de quantidades (A12). Corrige A1, A2, A3.
- **Dependências:** M0 (Q1 quantidades/estados, Q3 pagamento).

### M2 — Regra de data de aprovação fiel ao legado 🟠
- **Objetivo:** portar o ajuste de fim de semana (Sex/Sáb/Dom→segunda) ao cálculo de prazo.
- **Arquivos:** `tear/Modelos.js` (`dataMenosDiasCorridos`→ nova `prazoAprovacaoLegado` ou flag),
  `tear/Services.js` (AtivacaoService).
- **Impacto:** prazos de aprovação corretos. **Riscos:** fuso horário (legado usa horário local/12h).
- **Testes:** casos de borda por dia da semana. Corrige A6. **Dependências:** M0 (Q1).

### M3 — Pagamento: decidir e consolidar (persistido × derivado) 🟠
- **Objetivo:** eliminar a ambiguidade A4. Ou (a) remover entidade/repo órfãos e manter read-model, ou
  (b) promover Pagamento a entidade persistida (aba `Pagamentos` no setup+schema, geração no compilador).
- **Arquivos:** `tear/Repositories.js`, `tear/Modelos.js`, `tear/Services.js`, `tear/DevTools.js`
  (`cabecalhosV2_`), `docs/spec/SCHEMA_V2.md`.
- **Testes:** `test/tear-pagamentos.test.js` (ajustar). Corrige A4 (+ A3 se persistido).
- **Dependências:** M0 (Q3), idealmente após M1.

### M4 — Reancorar ganchos operacionais no header canônico 🟠
- **Objetivo:** decidir e implementar onde vivem `Drive` (pasta raiz), `Drive_Ciclo`, `Sheet_Url` (looks),
  `Chave_PIX`, `Endereco_Entrega` na base canônica — para A5 parar de falhar em silêncio.
- **Arquivos:** `tear/DevTools.js` (header + De-Para), `tear/Services.js` (Ciclo/Ativacao/Parceiro),
  `docs/spec/SCHEMA_V2.md`. **Testes:** ETL parceiros + provisionamento. Corrige A5.
- **Dependências:** M0 (Q2).

### M5 — Entidade Briefing (resumo/sobre/datas) 🟡
- **Objetivo:** modelar o Briefing conforme CSV (resumo do mês, textos "sobre", datas de aprovação por
  formato), persistido e ligado a Ativações. **Dependências:** M0 (Q4), após M1.

### M6 — Wizard admin de parceiras → vocabulário canônico 🟡
- **Objetivo:** alinhar `ParceiroService.salvar`/`apiSalvarParceira` ao header canônico (débito do
  PROJECT_STATUS). **Testes:** `test/tear-parceira.test.js`, `tear-migracao-parceiros-v2.test.js`.

### M7 — Sincronização documental ⚪
- **Objetivo:** corrigir A11 (nomes de arquivo em `SCHEMA_V2.md`, aba Pagamentos, `KNOWN_DECISIONS`
  sobre identidade), A8 (Nota_Fiscal_Anexa), A9 (datas do ciclo). Atualizar `PROJECT_STATUS`/`CHANGELOG`.

---

## 7. Decisões abertas (aguardando o usuário)

- **Q1 — Estados & quantidades:** a máquina de 13 estados fica como está (superconjunto) e mapeamos os 4
  do CSV para um subconjunto? E o parser de quantidades deve cobrir "duas/uma/três" (corrigindo A12)?
- **Q2 — Ganchos operacionais:** onde ancorar `Drive`, `Sheet_Url` (looks), `Chave_PIX` no header
  canônico de `Parceiros_Influenciadoras`? (impacta ETL e provisionamento)
- **Q3 — Pagamento:** entidade **persistida** (aba própria, status/PIX/arquivo — como V1/CSV) ou
  **read-model derivado** (atual)?
- **Q4 — Briefing:** vira entidade persistida (aba) na V2, ou os campos "resumo/sobre" viram colunas em
  `Ativacoes`, ou fica fora de escopo desta sprint?

---

## 8. Log de progresso

- **2026-07-11** — Auditoria inicial completa (docs + CSVs + legado + V2). Achados A1–A12 registrados.
  Mapa de domínio e fila de migração definidos. Aguardando Q1–Q4 para iniciar M1.
</content>
</invoke>
