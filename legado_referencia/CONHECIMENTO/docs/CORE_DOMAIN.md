# CORE_DOMAIN.md — Domínio congelado do Projeto TEAR

> **Referência oficial do Core Domain do TEAR.** Este documento congela as entidades,
> abas, campos, relacionamentos e responsabilidades antes da implementação do M1. A partir
> daqui, toda a implementação é **execução** — não reinterpretação.
>
> Autor responsável (humano): Daniel Perrut. Redigido pelo Engenheiro de Implementação (IA).
> Data do congelamento: **2026-07-11**.
>
> **Regra soberana (D5 — CSVs como contrato do Core Domain):** nomes de abas, estrutura de
> abas, nomes de colunas, relacionamentos e entidades são definidos **exclusivamente pelos
> CSVs** (`DOCUMENTOS TEAR/PLANILHAS.zip → NOVAS PLANILHA/`). O Apps Script legado (`mae/`)
> define **apenas regras de negócio**. A arquitetura V2 (`tear/`) define **apenas a forma de
> implementação**. Onde a implementação V2 usar aba/coluna diferente do CSV, isso é uma
> **etapa de migração**, não uma verdade arquitetural.
>
> Precedência (CLAUDE.md): **Filosofia → SYSTEM_MAP → SYSTEM_TRUTH → KNOWN_DECISIONS**; para
> o produto, **CSV (contrato) → legado (regra de negócio) → V2 (implementação)**.
> Rastreio: achados A1–A12 (`docs/MIGRATION_AUDIT.md`), decisões D1–D5 (`docs/DOMAIN_DECISIONS.md`).

---

## Convenções

- **Aba (contrato CSV):** nome soberano da aba conforme o CSV. É o alvo da migração.
- **Aba (V2 atual):** nome usado hoje pela implementação. Divergência = etapa de migração.
- **Campos do CSV:** cabeçalho literal extraído do CSV (contrato). Ordem preservada.
- **Estado do consumidor:** ✅ ativo · 🟨 parcial · ❌ ausente/stub · 💀 código morto.
- Fonte dos símbolos V2: `tear/Repositories.js`, `tear/Services.js`, `tear/Modelos.js`,
  `tear/Roteador.js`, `tear/DevTools.js` (verificados nesta sessão).

---

## Entidades do Core Domain

### 1. FORMS  *(intake — antessala do cadastro)*

- **Entidade:** FORMS
- **Aba (contrato CSV):** `FORMS`
- **Aba (V2 atual):** `CADASTROS` *(migração: renomear → `FORMS`)*
- **Origem dos dados:** Google Forms (submissão da influenciadora).
- **Destino dos dados:** consumida por BASE (funil de consolidação) e por regras de senha padrão.
- **Repository:** `CadastroRepository` (`Repositories.js:414`)
- **Service:** consumido por `ParceiroService` (`Services.js:604`) — não tem service próprio.
- **Controller:** — (automação `onFormSubmit`, sem controller HTTP dedicado)
- **Modelo:** — (dicionário RAW; sem classe de modelo; sem `CAMPOS_CADASTRO`)
- **Campos do CSV:** `Carimbo de data/hora`, `como prefere ser chamada (apelido + sobrenome)`,
  `seu melhor e-mail (usado para assinar o contrato)`, `chave PIX`, `razão social`, `CNPJ`,
  `CEP`, `número (prédio, casa, condomínio...)`, `complemento (bloco, torre, apto...)`
- **Regras herdadas do legado:** resolução de endereço por CEP multi-API
  (ViaCEP→BrasilAPI→AwesomeAPI→OpenCEP, fail-safe); CNPJ → senha padrão (5 primeiros dígitos, só hash).
- **Cria os registros:** `onFormSubmit` (automação do Google Forms).
- **Altera os registros:** ninguém (RAW imutável — antessala).
- **Consulta os registros:** `ParceiroService` (funil de cadastro + fonte de CNPJ para senha padrão).

---

### 2. BASE  *(planejamento da colaboração por influenciadora — mestre)*

- **Entidade:** BASE
- **Aba (contrato CSV):** `BASE`
- **Aba (V2 atual):** `Parceiros_Influenciadoras` *(migração: renomear → `BASE`)*
- **Origem dos dados:** FORMS (`onFormSubmit` → funil) + ETL da V1 (`PLANILHA ANTIGA`, Fase 2).
- **Destino dos dados:** **entrada do compilador da Geração do Mês** (linhas ATIVAS/`ON`).
- **Repository:** `ParceiroRepository` (`Repositories.js:194`) · `CAMPOS_PARCEIRO` (`:185`)
- **Service:** `ParceiroService` (`Services.js:604`)
- **Controller:** `ParceiroController` (montado em `Roteador.js:205`)
- **Modelo:** dicionário via `CAMPOS_PARCEIRO` (sem classe dedicada em `Modelos.js`)
- **Campos do CSV:** `INFLUENCER`, `CUPOM`, `STATUS`, `RAZÃO SOCIAL`, `PIX`, `REEL`, `CARROSSEL`,
  `STORIES`, `FEE`, `LOOKS`, `ENDEREÇO`, `SENHA`, `DRIVE`, `LOOKS` *(2ª coluna `LOOKS` = URL da
  planilha individual de looks; a 1ª = quantidade)*
- **Regras herdadas do legado:**
  - `STATUS` = `ON`/`OFF` (V2: `ATIVO`/`INATIVO`). "Sem ON, sem trabalho."
  - `REEL`/`CARROSSEL`/`STORIES` = quantidades por extenso (`Um/Uma`, `Dois/Duas`, `Três`).
    Parser da V2 **corrige** o feminino (`Duas`→2), não replica o bug `textToNumber('Duas')===0` (D1/A12).
  - `FEE` = cachê (ex.: `"R$ 720,00"`) → normalizar para número.
  - `SENHA` = 5 primeiros dígitos do CNPJ (só hash `salt$hash` na V2).
  - Endereço formatado padrão Autocrat: `RUA, Nº, COMPL, BAIRRO - CIDADE/UF, CEP`.
  - Identidade da influenciadora = apelido em caixa-alta.
- **Cria os registros:** `onFormSubmit`→`ParceiroService` (funil) + ETL V1 (Fase 2, `MIGRACAO_HABILITADA`).
- **Altera os registros:** `apiSalvarParceira` → `ParceiroService.salvar` (wizard admin).
- **Consulta os registros:** **compilador** (`CicloService`, lê ATIVAS — corrige A2),
  `AtivacaoService` (looks/briefing), `AuthService` (login por cupom).

---

### 3. CICLO  *(entidade do Core Domain com contrato de dados próprio)*

- **Entidade:** CICLO (mês de competência)
- **Aba (contrato de dados):** `Ciclos`
- **Aba (V2 atual):** `Ciclos`
- **Origem dos dados:** ação admin (`apiGerarCicloMensal`).
- **Destino dos dados:** contexto temporal de BRIEFING, ATIVAÇÕES, LOGÍSTICA, PAGAMENTOS, PLANO.
- **Repository:** `CicloRepository` (`Repositories.js:110`) · `CAMPOS_CICLO` (`:103`)
- **Service:** `CicloService` (`Services.js:213`) — **hospeda o compilador da Geração do Mês**.
- **Controller:** `CicloController` (montado em `Roteador.js:39`)
- **Modelo:** dicionário via `CAMPOS_CICLO` (sem classe dedicada)
- **Campos do contrato:** `ID_Ciclo` (`AAAA-MM`), `Nome_Ciclo`, `Data_Inicio_Logistica`, `Data_Fim_Operacao`
- **Regras herdadas do legado:** id = `AAAA-MM`; janela logística amarra datas de aprovação ao
  cronograma (datas de operação hoje não preenchidas — A9).
- **Cria os registros:** `CicloService.gerarCicloMensal` (idempotente por ciclo).
- **Altera os registros:** — (hoje não há edição de ciclo).
- **Consulta os registros:** todos os serviços operacionais (filtro por `ID_Ciclo`).

---

### 4. PLANO_COLABORAÇÃO  *(entidade do Core Domain — junção BASE × CICLO)*

- **Entidade:** PLANO_COLABORAÇÃO
- **Aba (contrato de dados):** `Planos_Colaboracao` (`[ELÃ] PROJETO TEAR 1.0.xlsx`)
- **Aba (V2 atual):** `Planos_Colaboracao`
- **Origem dos dados:** **compilador** (M1) — hoje **ninguém escreve** (A3).
- **Destino dos dados:** base de elegibilidade/valor de PAGAMENTOS.
- **Repository:** `PlanoRepository` (`Repositories.js:161`, só `findByCiclo`) · `CAMPOS_PLANO` (`:153`)
- **Service:** consumido por `PagamentoService` (`Services.js:412`)
- **Controller:** — (sem controller próprio)
- **Modelo:** dicionário via `CAMPOS_PLANO` (sem classe dedicada)
- **Campos do contrato:** `ID_Plano`, `ID_Influenciadora`, `ID_Ciclo`, `Qtd_Entregaveis`, `Valor_Cache`
- **Regras herdadas do legado:** 1 plano por parceira/ciclo; volume e valor acordados; N→1 BASE, N→1 CICLO.
- **Cria os registros:** **compilador** (M1 — passa a escrever; hoje inexistente).
- **Altera os registros:** —
- **Consulta os registros:** `PagamentoService` (cálculo/elegibilidade).

---

### 5. BRIEFING  *(planejamento criativo do mês)*

- **Entidade:** BRIEFING
- **Aba (contrato CSV):** `BRIEFING`
- **Aba (V2 atual):** ❌ inexistente *(migração: criar `Briefings` — D4)*
- **Origem dos dados:** compilador cria o **esqueleto** (1 por parceira/ciclo — D4); looks ao vivo
  da planilha individual (linha N); resumo/sobre pelo admin; datas puxadas de ATIVAÇÕES.
- **Destino dos dados:** alimenta ATIVAÇÕES (`Look_Referencia`, prazo de aprovação); Portal da parceira.
- **Repository:** `BriefingRepository` (`Repositories.js:445`) *(hoje sem `CAMPOS_BRIEFING`; formalizar em D4/M5)*
- **Service:** `BriefingService` (`Services.js:1195`, hoje só `puxarLooks`)
- **Controller:** — (consumido via serviços de ativação/portal)
- **Modelo:** ❌ sem classe/`CAMPOS_BRIEFING` (a criar — D4)
- **Campos do CSV:** `INFLUENCIADORA`, `RESUMO DO MÊS`, `LOOK REEL`, `LOOK CARROSSEL`,
  `LOOK STORIES 1`, `LOOK STORIES 2`, `DATA REEL`, `DATA CARROSSEL`, `DATA STORIES 1`,
  `DATA STORIES 2`, `SOBRE REEL`, `SOBRE CARROSSEL`, `SOBRE STORIES 1`, `SOBRE STORIES 2`,
  `APROVACAO REEL`, `APROVACAO CARROSSEL`, `APROVACAO STORIES 1`, `APROVACAO STORIES 2`
- **Regras herdadas do legado:**
  - `RESUMO DO MÊS` e `SOBRE *` = texto preenchido pelo admin.
  - `LOOK *` = puxado da planilha individual da parceira (linha N, "mesmo esquema do script antigo", Title Case).
  - `DATA *` = puxado da aba ATIVAÇÕES.
  - `APROVACAO *` = **entrega − 7 dias corridos + ajuste para dia útil** (Sex/Sáb/Dom→segunda, 12h) — A6.
  - Rótulo `STORIES 1/2` quando houver mais de um stories.
- **Cria os registros:** **compilador** (M1 — esqueleto vazio, 1 por parceira/ciclo, D4).
- **Altera os registros:** admin (resumo/sobre/datas — conteúdo rico, M5).
- **Consulta os registros:** `BriefingService.puxarLooks` (looks ao vivo) + Portal.

---

### 6. ATIVAÇÕES  *(peça de conteúdo — unidade operacional central)*

- **Entidade:** ATIVAÇÕES
- **Aba (contrato CSV):** `ATIVAÇÕES`
- **Aba (V2 atual):** `Ativacoes` *(migração de grafia/acento)*
- **Origem dos dados:** **compilador** (M1) — hoje não nasce (A1 stub).
- **Destino dos dados:** dispara elegibilidade de PAGAMENTOS; consumida pelo Portal.
- **Repository:** `AtivacaoRepository` (`Repositories.js:24`) · `CAMPOS_ATIVACAO` (`:12`)
- **Service:** `AtivacaoService` (`Services.js:16`)
- **Controller:** `AtivacaoController` (montado em `Roteador.js:35`)
- **Modelo:** `Ativacao` (`Modelos.js:160`, `ESTADOS_ATIVACAO` + `TRANSICOES_PERMITIDAS`)
- **Campos do CSV:** `MÊS`, `INFLUENCER`, `TIPO`, `STATUS`, `PASTA`, `CARIMBO UP`
  - `MÊS` = ciclo; `INFLUENCER` = coluna B de FORMS; `TIPO` = `REEL`/`CARROSSEL`/`STORIES`;
    `PASTA` = URL de pasta Drive; `CARIMBO UP` = timestamp de upload; tudo ordenado cronologicamente.
- **Regras herdadas do legado:**
  - Explosão: por parceira ATIVA → `Qtd_Reels`×REEL + `Qtd_Carrossel`×CARROSSEL + `Qtd_Stories`×STORIES
    (rótulo `STORIES_1/2` quando >1). Estado inicial `EM ABERTO` → `Planejamento` (D1). Ordena por data.
  - Máquina de 13 estados (`ESTADOS_ATIVACAO`), `Arquivada` terminal — grafo **confirmado** por D1.
  - Projeção dos 4 status do CSV (D1): `EM ABERTO`→`Planejamento`; `ATRASADO`→derivado (prazo vencido,
    `Estado_Derivado`, não armazenado); `APROVADO`→`Aprovada`; `POSTADO`→`Publicada`.
  - Prazo de aprovação = entrega − 7 dias + ajuste de dia útil (A6/M2).
- **Cria os registros:** **compilador** (M1 — explosão do mês).
- **Altera os registros:** `AtivacaoService` — `apiAlterarEstadoDaAtivacao` (parceira),
  `apiAlterarEstadoAtivacaoAdmin` (admin), pela máquina de estados.
- **Consulta os registros:** `apiListarAtivacoesDoCiclo`, `apiObterAtivacao`,
  `apiListarHistoricoDoCiclo`, `apiListarAtivacoesAdmin`.

---

### 7. LOGÍSTICA  *(envio físico)*

- **Entidade:** LOGÍSTICA
- **Aba (contrato CSV):** `LOGÍSTICA`
- **Aba (V2 atual):** `Logistica` *(migração de grafia/acento)*
- **Origem dos dados:** **compilador** (M1) — hoje não nasce.
- **Destino dos dados:** condiciona conteúdo ("sem produto, sem cobrança"); Portal da parceira.
- **Repository:** `LogisticaRepository` (`Repositories.js:619`) · `CAMPOS_LOGISTICA` (`:598`)
- **Service:** `LogisticaService` (`Services.js:1024`)
- **Controller:** `LogisticaController` (montado em `Roteador.js:291`)
- **Modelo:** `Logistica` (`Modelos.js:241`, `ESTADOS_LOGISTICA`)
- **Campos do CSV:** `MÊS`, `INFLUENCER`, `ENDEREÇO`, `RASTREIO`, `DATA DE ENVIO`, `STATUS`
  - `MÊS` = do ciclo criado; `ENDEREÇO` = da influenciadora; `RASTREIO` = código colado pelo painel
    admin (ex.: BrComerce); `DATA DE ENVIO` = carimbo automático ao subir o rastreio.
- **Regras herdadas do legado:**
  - 1 linha = 1 envio. Estados: `Pendente`→`Aguardando Envio`→`Enviado`→`Entregue`; `Cancelado` terminal.
  - Regra de ouro: logística **precede** conteúdo. Evento `LogisticaEnviada` (notificação como evento).
  - `STATUS` "tal qual o script antigo".
- **Cria os registros:** **compilador** (M1 — 1 logística por parceira/ciclo, estado inicial `Pendente`).
- **Altera os registros:** `LogisticaService` — `apiAlterarStatusLogistica` (admin),
  `registrarEnvio`/`CHANGE_STATUS` (parceira).
- **Consulta os registros:** `apiListarLogisticaDoCiclo`.

---

### 8. PAGAMENTOS  *(contrapartida financeira — cachê)*

- **Entidade:** PAGAMENTOS
- **Contrato (XLSX):** `PLANILHA ANTIGA.xlsx` → aba `PAGAMENTOS`.
- **Aba (V2 atual):** ❌ inexistente *(migração: criar `Pagamentos` no setup — D3)*
- **Origem dos dados:** **compilador** (M1) — 1 pagamento `em aberto` por parceira/ciclo (D3).
- **Destino dos dados:** `apiListarPagamentosDoCiclo`; Portal/relatório financeiro.
- **Repository:** `PagamentoRepository` (`Repositories.js:691`) · `CAMPOS_PAGAMENTO` (`:608`)
- **Service:** `PagamentoService` (`Services.js:412`) — passa de derivador a leitor/gravador (D3)
- **Controller:** `PagamentoController` (montado em `Roteador.js:373`)
- **Modelo:** `Pagamento` (`Modelos.js:303`)
- **Campos do contrato (ordem da aba `PAGAMENTOS`):**
  1. `INFLU_KEY`
  2. `MES_REFERENCIA`
  3. `VALOR_TOTAL`
  4. `CHAVE_PIX`
  5. `STATUS_PAGAMENTO`
  6. `DATA_PAGAMENTO`
  7. `MENSAGEM_PIX`
  8. *(sem cabeçalho)*
  9. `ANO_REFERENCIA`
  10. *(sem cabeçalho)*
  11. *(sem cabeçalho)*
  12. *(sem cabeçalho)*
  13. *(sem cabeçalho)*
  14. *(sem cabeçalho)*
  15. *(sem cabeçalho)*
  16. *(sem cabeçalho)*
  17. *(sem cabeçalho)*
  18. *(sem cabeçalho)*
  19. *(sem cabeçalho)*
  20. *(sem cabeçalho)*
  21. *(sem cabeçalho)*
  22. *(sem cabeçalho)*
  23. *(sem cabeçalho)*
  24. *(sem cabeçalho)*
  25. *(sem cabeçalho)*
  26. *(sem cabeçalho)*
- **Divergências contrato × V2 (`CAMPOS_PAGAMENTO`/`PagamentoRepository`/`Pagamento`):**
  - contrato usa `INFLU_KEY`; V2 usa `ID_Influenciadora`.
  - contrato usa `MES_REFERENCIA` + `ANO_REFERENCIA`; V2 usa `ID_Ciclo`.
  - contrato usa `VALOR_TOTAL`; V2 usa `Valor_Cache`.
  - contrato usa `MENSAGEM_PIX`; V2 usa `Mensagem_Pagamento`.
  - V2 exige `ID_Pagamento`, inexistente no contrato da aba.
  - contrato possui colunas sem cabeçalho (8 e 10–26), não representadas na V2.
- **Regras herdadas do legado:**
  - Pagamento é **persistido** com estado próprio (`em aberto` → `pago`), data e mensagem (D3).
  - Postagem **precede** pagamento (elegibilidade vem de ATIVAÇÕES publicadas).
  - Arquivamento em HISTÓRICO DE PAGAMENTOS (na V2 = ciclo de vida do estado, não aba).
- **Cria os registros:** **compilador** (M1 — 1 por parceira/ciclo, `em aberto`).
- **Altera os registros:** `PagamentoService` (ato admin: `em aberto`→`pago`, com data e mensagem).
- **Consulta os registros:** `apiListarPagamentosDoCiclo`.

> **Excluídas do Core (infraestrutura, fora do escopo deste documento):** Sessão/Autenticação
> (`SessaoRepository`/`AuthService`), Drive (`DriveService`), Eventos (`EventDispatcher`).

---

## Matriz de dependências

```
FORMS
  ↓        (a) intake vira mestre
BASE
  ↓        (b) o compilador lê BASE dentro de um ciclo
CICLO
  ↓        (c) o ciclo gera as estruturas operacionais do mês
PLANO_COLABORAÇÃO ──┐
  ↓                 │ (d) plano define valor/volume do pagamento
BRIEFING            │
  ↓                 │ (e) briefing fornece look e prazo à peça
ATIVAÇÕES           │
  ↓                 │ (f) postagem torna o pagamento elegível
LOGÍSTICA           │ (g) logística precede o conteúdo
  ↓                 │
PAGAMENTOS ◄────────┘
```

**Explicação de cada dependência:**

- **(a) FORMS → BASE.** A parceira nasce como submissão crua no FORMS (intake) e é consolidada
  em BASE (mestre de planejamento) via `onFormSubmit`/funil do `ParceiroService`. BASE é o único
  artefato que carrega `STATUS`, quantidades e `FEE` — sem FORMS não há BASE.
- **(b) BASE → CICLO (compilação).** O CICLO é um contexto temporal criado pelo admin; a Geração
  do Mês **lê as linhas ATIVAS de BASE** dentro de um CICLO. BASE é a **entrada** do compilador;
  o CICLO é o **escopo**. As duas juntas habilitam a explosão operacional.
- **(c) CICLO → estruturas operacionais.** Para cada parceira ATIVA, dentro do CICLO, o compilador
  produz PLANO_COLABORAÇÃO, BRIEFING (esqueleto), ATIVAÇÕES, LOGÍSTICA e PAGAMENTOS — todos
  ancorados em `ID_Ciclo` e idempotentes por ciclo.
- **(d) PLANO_COLABORAÇÃO → PAGAMENTOS.** O plano fixa `Qtd_Entregaveis` e `Valor_Cache` da
  parceira no ciclo; o pagamento persiste esse valor. Sem plano, não há base de cálculo (A3).
- **(e) BRIEFING → ATIVAÇÕES.** O briefing fornece `Look_Referencia` e o prazo de aprovação
  (data − 7 dias + ajuste de dia útil) que a peça exibe.
- **(f) ATIVAÇÕES → PAGAMENTOS.** "Postagem precede pagamento": a ativação `Publicada` torna o
  pagamento **elegível**. O registro do pagamento existe desde a geração (`em aberto`), mas só
  evolui para `pago` após a postagem.
- **(g) LOGÍSTICA → ATIVAÇÕES/conteúdo.** Regra de ouro: "sem produto, sem cobrança". A logística
  (envio do look) precede a produção de conteúdo — condiciona o fluxo, não o registro.

---

## Plano definitivo de implementação (M1)

> **Executor:** `Claude Code` = raciocínio de domínio, TDD, decisões, idempotência, fiação
> multi-arquivo. `VS Code + Copilot` = tarefa mecânica seguindo padrão existente.
> **Complexidade:** ver definições ao final. Regra do projeto: 1 responsabilidade por commit,
> testes verdes antes do commit, sem push/clasp/deploy sem autorização.

| ID | Objetivo | Arquivos | Executor | Nível | Justificativa |
|---|---|---|---|---|---|
| **M1.01** | Núcleo do compilador: transformar linhas ATIVAS de **BASE** em `PlanoCompilado[]` em memória (sem persistir, sem outras planilhas, sem produzir estruturas). Parser de quantidades e normalização de `FEE` como detalhes internos. | `tear/Services.js` (CicloService), `test/tear-geracao-ciclo.test.js` (novo) | Claude Code | **3** | Regra de negócio central (fonte/filtro corretos — A2), design do DTO, normalização (parser D1). Requer TDD e decisões. |
| **M1.02** | Criar as abas `Pagamentos` e `Briefings` em `setupV2Database()` + cabeçalhos canônicos (pré-requisito de escrita — D3/D4). | `tear/DevTools.js` | VS Code + Copilot | **2** | Mecânico: adicionar arrays de cabeçalho e criação de aba seguindo o padrão existente. Baixo risco. |
| **M1.03** | Writer de `PlanoRepository` (`save`/upsert idempotente por parceira/ciclo). | `tear/Repositories.js`, `test/tear-geracao-ciclo.test.js` | Claude Code | **2** | Segue padrão de `save` já existente em outros repositories; foco em idempotência. |
| **M1.04** | Explosão de ATIVAÇÕES a partir de `PlanoCompilado[]`: N peças por quantidade (REEL/CARROSSEL/STORIES, rótulo `STORIES_1/2`), estado inicial `Planejamento`, idempotente. Grava via `AtivacaoRepository`. | `tear/Services.js`, `test/tear-geracao-ciclo.test.js` | Claude Code | **3** | Coração da Geração do Mês (A1); regra de rótulos, ordenação e idempotência. |
| **M1.05** | 1 LOGÍSTICA por parceira/ciclo (estado inicial `Pendente`), idempotente. | `tear/Services.js`, `test/tear-geracao-ciclo.test.js` | Claude Code | **2** | Escrita única por parceira/ciclo; padrão de repository conhecido. |
| **M1.06** | 1 PAGAMENTO persistido `em aberto` por parceira/ciclo (D3), via `PagamentoRepository`; integra a entidade hoje órfã. | `tear/Services.js`, `tear/Repositories.js`, `test/tear-geracao-ciclo.test.js` | Claude Code | **3** | Ativa entidade/repo órfãos (A4); risco de ordenação com M1.02 (aba precisa existir); idempotência. |
| **M1.07** | Esqueleto de BRIEFING (1 por parceira/ciclo, campos de conteúdo vazios — D4): `CAMPOS_BRIEFING`, entidade/leitura persistida e escrita pelo compilador. | `tear/Modelos.js`, `tear/Repositories.js`, `tear/Services.js`, `test/tear-geracao-ciclo.test.js` | Claude Code | **3** | Formaliza entidade nova (A10/D4); multi-arquivo; preserva `puxarLooks` ao vivo. |
| **M1.08** | Prazo de aprovação fiel ao legado: entrega − 7 dias + ajuste de dia útil (Sex/Sáb/Dom→segunda, 12h). | `tear/Modelos.js`, `tear/Services.js`, `test/tear-geracao-ciclo.test.js` | Claude Code | **4** | Regra temporal com fuso/horário; casos de borda por dia da semana; impacta datas em ATIVAÇÕES/BRIEFING (A6). |
| **M1.09** | Fiação final: `gerarCicloMensal` substitui o stub `_gerarEstruturasOperacionais` chamando o compilador completo; idempotência global (re-rodar o mês não duplica nada). | `tear/Services.js`, `test/tear-geracao-ciclo.test.js` | Claude Code | **3** | Integração de todas as escritas sob uma transação lógica idempotente; ponto de maior acoplamento. |

**Milestones seguintes (já definidos em `docs/MIGRATION_AUDIT.md` §6, sob D1–D5):**

| ID | Objetivo | Arquivos | Executor | Nível | Justificativa |
|---|---|---|---|---|---|
| **M4** | Reancorar ganchos operacionais de BASE no header canônico: `Chave_PIX`, `Drive`, `Sheet_Url_Looks`, `Endereco_Entrega` (D2) + De-Para do ETL. | `tear/DevTools.js`, `tear/Services.js`, `docs/spec/SCHEMA_V2.md` | Claude Code | **3** | Altera header canônico durante ETL ativo (risco de ordenação); dry-run antes (A5). |
| **M5** | BRIEFING — conteúdo rico (resumo/sobre/datas) + UI de edição. | `tear/*`, `docs/spec/SCHEMA_V2.md` | Claude Code | **3** | Modelagem + UI; depende de M1.07. |
| **M6** | Wizard admin de BASE → vocabulário canônico (`apiSalvarParceira`). | `tear/Services.js`, testes | Claude Code | **2** | Alinhamento de nomes; padrão conhecido. |
| **M7** | Sincronização documental: `SCHEMA_V2.md` (nomes de arquivo, aba Pagamentos), `KNOWN_DECISIONS`, A8 (`Nota_Fiscal_Anexa`), A9 (datas do ciclo). | `docs/*` | VS Code + Copilot | **1** | Documental/mecânico. |
| **(migração estrutural)** | Renomear abas V2 → nomes de contrato CSV (`CADASTROS→FORMS`, `Parceiros_Influenciadoras→BASE`, `Ativacoes→ATIVAÇÕES`, `Logistica→LOGÍSTICA`) com migração de dados. | `tear/DevTools.js`, ETL, testes | Claude Code | **4** | Renomeação de abas com dados vivos e acoplamento ao Autocrat; alto risco sistêmico. Requer plano dedicado + backup. |

---

## Definições de complexidade

- **Nível 1 — trivial/documental.** Sem lógica de negócio; risco desprezível. Ex.: sincronizar docs,
  adicionar constante. Reversível trivialmente.
- **Nível 2 — padrão conhecido.** Segue um padrão já existente no código (novo header/aba, `save` de
  repository análogo); baixo risco; testes diretos.
- **Nível 3 — regra de negócio central.** Lógica de domínio, múltiplos arquivos, idempotência ou
  máquina de estados; exige TDD e decisões. É o corpo do compilador.
- **Nível 4 — alto risco sistêmico.** Fuso/tempo, migração estrutural de dados vivos, ou acoplamento
  externo (Autocrat/Drive). Casos de borda numerosos; exige backup/plano dedicado antes de executar.

---

## Auditoria final de encerramento do domínio (2026-07-11)

Varredura localizada (`find` → `grep` → `ls` → leitura pontual) sobre `DOCUMENTOS TEAR/`,
`PLANILHAS 2/` e os XLSX de arquitetura/legado.

### Inventário de contratos encontrados

| # | Entidade | Contrato encontrado | Arquivo exato |
|---|---|---|---|
| 1 | **FORMS** | CSV ✅ | `PLANILHAS 2/NOVAS PLANILHA/arquitetura de [ELÃ] PROJETO TEAR 1.0 - FORMS.csv` |
| 2 | **BASE** | CSV ✅ | `PLANILHAS 2/NOVAS PLANILHA/base arquitetura de [ELÃ] PROJETO TEAR 1.0 - BASE.csv` |
| 3 | **BRIEFING** | CSV ✅ | `PLANILHAS 2/NOVAS PLANILHA/briefing arquitetura de [ELÃ] PROJETO TEAR 1.0 - BRIEFING.csv` |
| 4 | **ATIVAÇÕES** | CSV ✅ | `PLANILHAS 2/NOVAS PLANILHA/ativações arquitetura de [ELÃ] PROJETO TEAR 1.0 - ATIVAÇÕES.csv` |
| 5 | **LOGÍSTICA** | CSV ✅ | `PLANILHAS 2/NOVAS PLANILHA/logística arquitetura de [ELÃ] PROJETO TEAR 1.0 - LOGÍSTICA.csv` |
| — | **CICLO** | contrato de dados próprio (`Ciclos`) | `[ELÃ] PROJETO TEAR 1.0.xlsx` |
| — | **PLANO_COLABORAÇÃO** | contrato de dados próprio (aba `Planos_Colaboracao`) | `[ELÃ] PROJETO TEAR 1.0.xlsx` |
| — | **PAGAMENTOS** | contrato de dados próprio (aba `PAGAMENTOS`) | `PLANILHA ANTIGA.xlsx` |

### Fatos confirmados
- **5 CSVs** compõem o contrato do Core Domain — todos já documentados aqui; **nenhum ficou de fora**.
- **Nenhum CSV do Core não documentado** foi encontrado. Não existem arquivos
  `[JESCRI] INFLUÊNCIA 360º` no repositório.
- **`[ELÃ] PROJETO TEAR 1.0.xlsx`** (XLSX de arquitetura) contém as abas
  (`Respostas ao formulário 1, Parceiros_Influenciadoras, Logistica, Ciclos, Ativacoes,
  Planos_Colaboracao`) — **não** possui abas `PAGAMENTOS`, `BASE`, `FORMS` ou `BRIEFING`.
- **`PLANILHA ANTIGA.xlsx`** contém `PAGAMENTOS` e `HISTÓRICO DE PAGAMENTOS`; para PAGAMENTOS,
  a aba `PAGAMENTOS` foi formalizada como contrato de dados no fechamento do F0.

### Inconsistência documental registrada (resolvida no fechamento do F0)
- **PAGAMENTOS** passa a ter contrato de dados formalizado pela aba `PAGAMENTOS` de
  `PLANILHA ANTIGA.xlsx`, com divergências mapeadas contra a implementação V2 nesta seção.

### Divergências CSV × legado × V2 (registradas, não resolvidas)
| Tema | Contrato (CSV/XLSX) | Legado (V1) | V2 (implementação) | Consequência |
|---|---|---|---|---|
| Nome das abas | `FORMS, BASE, ATIVAÇÕES, LOGÍSTICA` | `CADASTROS, BASE DE DADOS, ATIVAÇÕES, FLUXO LOGÍSTICO` | `CADASTROS, Parceiros_Influenciadoras, Ativacoes, Logistica` | **migração estrutural futura** de renomeação |
| PAGAMENTOS | aba `PAGAMENTOS` em `PLANILHA ANTIGA.xlsx` | aba `PAGAMENTOS` | entidade/repo órfãos, sem aba | alinhar setup/mapeamento antes de M1.06 |
| CICLO / PLANO | CICLO com contrato de dados próprio (`Ciclos`); PLANO com contrato de dados próprio (`Planos_Colaboracao`) | — (implícito no fluxo) | abas `Ciclos` / `Planos_Colaboracao` | CICLO e PLANO classificados como contrato |

---

## Status

- **Congelado em 2026-07-11.** Fonte oficial do Core Domain.
- Alterar qualquer entidade/campo/relacionamento exige editar **este documento** antes de tocar código.
- **D5 registrado** em `docs/DOMAIN_DECISIONS.md` nesta sessão.
- **Bloqueio técnico remanescente:** para `M1.06`, ainda é necessário alinhar setup da aba `Pagamentos`
  e mapeamento contrato↔V2; isso não bloqueia `M1.01–M1.05`.
- **Próximo passo:** executar M1.01 sob D1–D5 e tratar o alinhamento de `PAGAMENTOS` na etapa M1.06.
