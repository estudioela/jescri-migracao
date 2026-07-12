# Auditoria Vertical — Contexto 2: Planejamento Operacional

> Fase 2 · Passo 4 · Auditoria puramente analítica. **Nenhum código foi alterado.**
> Fontes de invariante: `SYSTEM_TRUTH.md` §3; `CLAUDE.md` §3 ("Ciclo mensal", "Briefing"), §6.
> Linhas conferidas em 2026-07-09 contra `main` @ `897e2dc`.

## Escopo

| Arquivo | Linhas | Papel |
|---|---|---|
| `mae/Código.js` | 85-166 | `gerarNovoMesCompleto()` — **recorte de Briefing** |
| `mae/Código.js` | 443-481 | `sincronizarLooks()` |
| `mae/Código.js` | 616-654 | `garantirColunaAnoReferenciaBriefing()` |
| `mae/WebApp.js` | 288-385 | `getBriefing()` |
| `mae/Index.html` | 1228-1261 | `abrirBriefing()` |

Aba de domínio: **`BRIEFING`**. Lê de `BASE DE DADOS` e de planilhas externas por influenciadora.

---

## 1. Fluxo Funcional

### 1.1 Entrada — o ciclo mensal

```
Menu " Planejamento & Campanhas → 1. Iniciar Novo Mês"
  → gerarNovoMesCompleto()                Código.js:85
      ui.prompt("Digite o MÊS e o ANO")   → parseMesAno() → {mes, ano}
      influON = BASE.filter(r[0] ON)      ← Gestão de Parceiros
      ┌─────────────────────────────────────────────────┐
      │ briefingSheet.getRange(2,1,last-1,lastCol)      │
      │              .clearContent()          L120-122  │  ⚠️ APAGA TUDO
      └─────────────────────────────────────────────────┘
      para cada influON, escreve na linha i+2:
        INFLU_KEY, CUPOM, MES, PASTA_DRIVE_LINK, ANO_REFERENCIA
      (demais colunas — SOBRE_*, LOOK_*, RESUMO_MES — ficam vazias)
```

### 1.2 Enriquecimento — looks externos

```
Menu " → 2. Puxar Looks da Planilha Externa"
  → sincronizarLooks()                    Código.js:443
      para cada linha ON de BASE com INFLU_SHEET_URL contendo docs.google.com:
        SpreadsheetApp.openByUrl(url)      ← abre planilha de terceiro
        aba "LOOKS BRIEFING" ou getSheets()[0]
        monta dict { COL_A_UPPER : COL_B }
        escreve LOOK_REEL / LOOK_CARROSSEL / LOOK_STORIES_1 / LOOK_STORIES_2
          em BRIEFING, com formatarTitleCase()
```

### 1.3 Enriquecimento — datas de aprovação (vindas de Execução)

`onEdit()` (`Código.js:204-228`, bloco `BRIEFING`) observa colunas cujo cabeçalho contenha `REEL`/`CARROSSEL`/`STORIES` **e não** `APROVACAO`, e escreve `calcularDataAprovacao(valor)` na coluna `APROVACAO_*` correspondente.

`onEdit()` (`Código.js:237-288`, bloco `ATIVAÇÕES`) faz o caminho inverso: ao preencher `DATA_ATIVACAO` numa ativação, **propaga** a data calculada de volta para `BRIEFING`, casando por `INFLU_KEY` + `MES` + `ANO_REFERENCIA`.

### 1.4 Saída — leitura pela parceira

```
Index.html:abrirBriefing(idAtivacao)      L1231
  → chamar('getBriefing', token, idAtivacao)
  → WebApp.js:getBriefing()               L288
      1. resolve a ativação por ID estável (encontrarLinhaAtivacaoPorId)
      2. verifica ownership: rowInfluKey === influKey → senão ACESSO_NEGADO
      3. extrai MES + FORMATO + ANO_REFERENCIA da ativação
      4. varre BRIEFING casando INFLU_KEY + MES + (ANO ou vazio)
      5. escolhe a coluna SOBRE_* pelo FORMATO
      6. devolve { campanha, formato, dataEntrega, dataAprovacao,
                   textoBriefing, resumoMes }
```

---

## 2. Entidades e Regras de Negócio

### Entidade: **Briefing de Campanha**

Cardinalidade real: **uma linha por influenciadora por mês** — mas com uma ressalva devastadora, ver §3, INV-01.

| Grupo de colunas | Escrito por | Lido por |
|---|---|---|
| `INFLU_KEY`, `CUPOM`, `MES`, `ANO_REFERENCIA`, `PASTA_DRIVE_LINK` | `gerarNovoMesCompleto` | `getBriefing`, `onEdit` |
| `LOOK_REEL`, `LOOK_CARROSSEL`, `LOOK_STORIES_1`, `LOOK_STORIES_2` | `sincronizarLooks` | ninguém no código |
| `SOBRE_REEL`, `SOBRE_CARROSSEL`, `SOBRE_STORIES_1`, `SOBRE_STORIES_2` | **humano** (digitação direta) | `getBriefing` |
| `RESUMO_MES` | **humano** | `getBriefing` |
| `APROVACAO_REEL`, `APROVACAO_CARROSSEL`, `APROVACAO_STORIES_*` | `onEdit` (2 blocos) | ninguém no código |

### Regras que o código de fato executa

1. **RN-08** — Um novo mês **destrói** o briefing do mês anterior. (`Código.js:120-122`)
2. **RN-09** — `parseMesAno()` (`Código.js:982`): se o ano não vier no texto, assume o ano corrente. `"AGOSTO"` → `{mes:"AGOSTO", ano:2026}`.
3. **RN-10** — `calcularDataAprovacao()` (`Código.js:316`): data de ativação **menos 7 dias**; se cair sexta → +3 (segunda); domingo → +1 (segunda); sábado → +2 (segunda). Hora fixada em 12:00.
4. **RN-11** — O texto do briefing é escolhido pelo `FORMATO` da ativação, não pelo briefing. `REEL`→`SOBRE_REEL`; `CARROSSEL`→`SOBRE_CARROSSEL`; `STORIES_1` ou `STORIES` exato→`SOBRE_STORIES_1`; `STORIES_2`→`SOBRE_STORIES_2`. (`WebApp.js:355-363`)
5. **RN-12** — Linha de `BRIEFING` com `ANO_REFERENCIA` vazia casa com **qualquer** ano (compatibilidade legado). (`WebApp.js:346`; `Código.js:266`)
6. **RN-13** — Ownership: a parceira só lê o briefing de uma ativação que lhe pertence. (`WebApp.js:314-316`)

---

## 3. Aderência às Invariantes

### ✅ Respeitadas

- **Casamento por `MES` + `ANO_REFERENCIA`** (`CLAUDE.md` §3, "Briefing"). Implementado nos dois lados: `getBriefing()` (`WebApp.js:341-348`) e `onEdit()` (`Código.js:260-268`). A lógica de compatibilidade ("ano vazio casa com tudo") é idêntica nos dois — comparei linha a linha.
- **Resolução de coluna 100% por nome.** `hBrief['RESUMO'] || hBrief['RESUMO_DO_MES'] || hBrief['RESUMO_MES']` (`WebApp.js:338`) — cadeia de fallback por nome, sem índice. `SYSTEM_TRUTH.md` §6 confirma que o cabeçalho real é `RESUMO_MES`.
- **`garantirColunaAnoReferenciaBriefing()` é idempotente e não-destrutiva** (`Código.js:626-644`): checa presença, pede confirmação, adiciona como última coluna. Re-executar é no-op. Bate com o descrito em `CLAUDE.md` §3.
- **Ativação inexistente ou de outra parceira** → `ATIVACAO_NAO_ENCONTRADA` / `ACESSO_NEGADO`, antes de qualquer leitura de `BRIEFING`.

### ❌ Violações e divergências

#### INV-01 · 🔴 **O `ANO_REFERENCIA` de `BRIEFING` resolve uma colisão que `gerarNovoMesCompleto()` torna impossível — e mascara uma perda de dados real**

`gerarNovoMesCompleto()` (`Código.js:119-122`):

```js
const lastRowBrief = briefingSheet.getLastRow();
if (lastRowBrief > 1) {
  briefingSheet.getRange(2, 1, lastRowBrief - 1, briefingSheet.getLastColumn()).clearContent();
}
```

A aba `BRIEFING` é **zerada** a cada início de mês, e reescrita com uma linha por influenciadora ativa, indexada por `i + 2` (L127). Logo:

> **`BRIEFING` nunca contém mais de uma campanha ao mesmo tempo.**

Duas consequências que se contradizem:

**(a) A correção de 2026-07-07 é, na prática, inerte.** `SYSTEM_TRUTH.md` §6 e `CLAUDE.md` §3 registram que o casamento por `MES` sozinho *"causava colisão entre campanhas do mesmo mês em anos diferentes"*, e que a coluna `ANO_REFERENCIA` foi criada para resolver. Mas para haver `AGOSTO/2025` e `AGOSTO/2026` simultaneamente em `BRIEFING`, seria preciso rodar `gerarNovoMesCompleto()` **duas vezes sem passar por agosto** — impossível, já que a primeira execução apaga tudo. A colisão só ocorre se alguém popular `BRIEFING` manualmente. O fix está correto e é barato; só não protege do que se pensava.

**(b) O problema real é o oposto: `getBriefing()` só funciona para o mês corrente.** Ativações de meses anteriores continuam vivas em `ATIVAÇÕES` até serem marcadas como `postado` e arquivadas (`Código.js:232`). Uma parceira que abra o Portal, navegue para um período anterior (`listarPeriodos()` oferece todos) e clique em "Ver briefing" recebe:

```js
let textoBriefing = "Briefing não encontrado para este formato/mês.";   // WebApp.js:333
```

E `getPendencias()` (`WebApp.js:276`) devolve **`temBriefing: true` incondicionalmente** — hardcoded, sem consultar `BRIEFING`. O front-end (`Index.html:1200`) sempre renderiza o botão "Ver briefing". A parceira sempre pode clicar, e para todo mês que não seja o corrente sempre recebe a mensagem de erro.

Isto não é um bug de código: é a modelagem. **Briefing é tratado como estado efêmero da campanha corrente, enquanto Ativação é tratada como registro histórico.** Os dois vivem no mesmo fluxo e são casados por `MES`+`ANO`. A assimetria é a violação.

Não confirmei o comportamento em produção (exigiria executar). O caminho no código é inequívoco.

#### INV-02 · 🟠 **`sincronizarLooks()` lê `BRIEFING` por posição — e escreve na linha errada quando `INFLU_KEY` não é a coluna 1**

`Código.js:466-468`:

```js
dataB.forEach((rb, idx) => {
  if (rb[0] === r[hBase['INFLU_KEY']-1]) {      // ← rb[0], posicional
    let row = idx + 1;
```

Todo o resto do arquivo resolve `BRIEFING` por `hB[...]`. Esta linha assume que `INFLU_KEY` é a **primeira coluna** de `BRIEFING`. Se não for — ou deixar de ser — a comparação nunca casa e `sincronizarLooks()` reporta silenciosamente `0 influenciadoras`, via `ss.toast()` (L479).

Pior: a comparação é `===` estrito, sem `String().trim().toUpperCase()`, ao contrário de todos os outros casamentos de `INFLU_KEY` do sistema (`WebApp.js:312`, `Código.js:263`, `Código.js:429`). Um espaço à direita na célula quebra o match.

`row = idx + 1` está correto (`dataB[1]` é a linha 2), mas só por sorte: o mesmo padrão em `onEdit()` (`Código.js:271`) usa `idxBrief + 1` sobre um array que também inclui o cabeçalho. Coincidem.

#### INV-03 · 🟠 **`sincronizarLooks()` abre planilhas de terceiros e engole toda exceção**

`Código.js:457-476`:

```js
try {
  let ssExterno = SpreadsheetApp.openByUrl(url.toString().trim());
  ...
} catch(e){}                                    // L476 — vazio
```

`openByUrl()` sobre uma planilha à qual o script perdeu acesso lança exceção. Ela é descartada sem log. `contagemSucesso` simplesmente não incrementa, e o toast final anuncia um número menor sem dizer quem falhou nem por quê.

Este é o **último `catch` vazio de `Código.js`** — os catches de `onEdit()` (L307) e `onFormSubmit()` (L878) ganharam `Logger.log` no endurecimento de 2026-07-07 (commit citado em `SYSTEM_TRUTH.md` §6). Ficaram para trás: este e `preencherEnderecoPorCEP()` (`Código.js:928`).

Risco adicional: `openByUrl()` sobre URL arbitrária de `INFLU_SHEET_URL`, editável pela equipe na sidebar (`SidebarBackend.js:97`), executa com a autorização do dono do script. Não é vulnerabilidade explorável por terceiro — a coluna só é escrita por quem já tem acesso à planilha-mãe — mas é uma superfície a manter em mente.

#### INV-04 · 🟡 **`onEdit()` bloco `BRIEFING` faz *string matching* frouxo no cabeçalho**

`Código.js:205-216`:

```js
let colHeader = sh.getRange(1, col).getValue().toString()...replace(/ /g, "_");
if (colHeader.includes("REEL") && !colHeader.includes("APROVACAO")) {
  colDestino = h['APROVACAO_REEL'];
```

Qualquer coluna cujo nome **contenha** `REEL` e não contenha `APROVACAO` dispara a regra. `LOOK_REEL` — escrita por `sincronizarLooks()` — satisfaz exatamente essa condição. Editar `LOOK_REEL` manualmente escreve uma data em `APROVACAO_REEL`.

Na prática, `calcularDataAprovacao()` (`Código.js:330`) devolve `""` para texto não-parseável e o `if (calcAprovacao !== "")` protege. Mas um look chamado `"12/08/2026 - vestido azul"` passaria. A guarda é acidental, não intencional.

O bloco `STORIES` é ainda mais frágil: `colHeader.includes("STORIES") && !colHeader.includes("2")` (L212). Uma coluna `SOBRE_STORIES_12` seria classificada como `STORIES_2`.

#### INV-05 · 🟡 **`gerarNovoMesCompleto()` escreve `BRIEFING` célula a célula**

`Código.js:126-133` — cinco `setValue()` por influenciadora, dentro de um `forEach`. Com 30 parceiras: **150 chamadas de API**. As outras três abas do mesmo loop (`FLUXO`, `PAGAMENTOS`, `ATIVAÇÕES`) acumulam arrays e gravam com um único `setValues()` (L157-159).

É uma violação direta de `CLAUDE.md` §11.1 ("nenhuma função nova pode reprocessar a planilha sem necessidade") — mas o código é anterior à regra, e o custo é pago uma vez por mês, num menu manual. **Não é urgente.** É, porém, o exemplo mais claro de padrão inconsistente dentro de uma única função.

---

## 4. Lixo Técnico e Riscos

| # | Item | Local | Natureza |
|---|---|---|---|
| L-09 | `LOOK_REEL`/`LOOK_CARROSSEL`/`LOOK_STORIES_*` — escritas por `sincronizarLooks()`, **lidas por nenhuma função** | `Código.js:469-472` | Só consumidas por humanos olhando a planilha. Não chegam ao Portal. |
| L-10 | `APROVACAO_REEL`/`APROVACAO_*` em `BRIEFING` — escritas por `onEdit()` (2 blocos), **lidas por nenhuma função** | `Código.js:222, 278` | Idem. A propagação bidirecional alimenta um campo que nada consome programaticamente. |
| L-11 | `PASTA_DRIVE_LINK` copiada de `BASE` para `BRIEFING` | `Código.js:131` | O Portal resolve a pasta por `PropertiesService` (`WebApp.js:617`), não por esta coluna. Resíduo da era "BASE DE APOIO". |
| L-12 | `catch(e){}` vazio | `Código.js:476` | Falha silenciosa em integração externa |
| L-13 | `getBriefing()` devolve `campanha: mes` — só o mês, sem o ano | `WebApp.js:373` | `getPendencias()` (L272) devolve `"MES ANO"`. Contrato divergente para o mesmo conceito. O front (`Index.html:1247`) exibe os dois no mesmo lugar. |
| L-14 | `res.mesReferencia` e `res.dataPostagem` — fallbacks para chaves que **nenhum backend produz** | `Index.html:1247, 1250` | Resíduo de contrato morto (mesmo padrão de `so.valoresCache`) |
| L-15 | `STATE.cacheBriefing = {}` declarado, **nunca escrito nem lido** | `Index.html:860` | Cache morto |

### Acoplamentos nocivos

- **`getBriefing()` é `[Contaminado]`** (leve): lê `ATIVAÇÕES` (Execução) para resolver identidade e formato, depois lê `BRIEFING` (Planejamento) para o conteúdo. As duas metades são separáveis: L294-320 é Execução; L329-369 é Planejamento.
- **`onEdit()` cruza a fronteira nos dois sentidos**: o bloco `BRIEFING` (L204-228) é Planejamento puro; o bloco `ATIVAÇÕES` (L237-288) é Execução escrevendo **dentro de** `BRIEFING`. Essa escrita cruzada — 40 linhas de casamento por `INFLU_KEY`+`MES`+`ANO` embutidas num handler de evento — é o acoplamento mais caro deste contexto.
- **`gerarNovoMesCompleto()` mistura destruição e criação** numa transação sem rollback. Se falhar entre L122 (`clearContent`) e L159 (`setValues`), o briefing do mês anterior já foi perdido e o novo não existe.

---

## 5. Recomendações de Migração (V2)

### 5.1 Serviços puros a extrair

```
BriefingRepository
  buscarPorParceiraEPeriodo(influKey, mes, ano)    ← encapsula RN-12
  substituirCampanha(mes, ano, linhas)             ← torna RN-08 explícita no nome
  atualizarLooks(influKey, looks)

BriefingService                                     ← puro, sem SpreadsheetApp
  selecionarTextoPorFormato(briefing, formato)     ← RN-11, hoje em WebApp.js:355-363
  casaAno(anoBriefing, anoAtivacao)                ← RN-12, hoje duplicada em 2 lugares

CalendarioService                                   ← puro
  calcularDataAprovacao(dataAtivacao)              ← RN-10, já é pura (Código.js:316)
  parseMesAno(texto)                               ← RN-09, já é pura (Código.js:982)

LooksExternosGateway                                ← única porta para openByUrl()
  importar(url) → {LOOK_REEL, LOOK_CARROSSEL, ...}
```

`calcularDataAprovacao()` e `parseMesAno()` **já são funções puras hoje** e já têm teste (`test/codigo-ano-referencia-briefing.test.js`, `test/codigo-gerar-novo-mes.test.js`). Mover é literalmente recortar e colar. Comece por elas.

`BriefingService.casaAno()` elimina a duplicação de RN-12 entre `WebApp.js:346` e `Código.js:264-267` — a mesma regra escrita duas vezes, com sintaxes diferentes, é uma bomba-relógio de divergência.

### 5.2 A decisão de modelagem que precede qualquer refatoração

**INV-01 não é resolvível refatorando.** Enquanto `BRIEFING` for sobrescrito a cada mês, `getBriefing()` vai continuar falhando para períodos anteriores, e `temBriefing: true` vai continuar mentindo.

Há três saídas, em ordem crescente de custo:

1. **Aceitar e ser honesto.** `getPendencias()` passa a consultar `BRIEFING` e devolver `temBriefing` de verdade. O botão some para meses passados. Muda comportamento observável (§12.4.1) — precisa de decisão do usuário.
2. **Arquivar o briefing junto com a ativação.** `arquivarGenerico()` já move `ATIVAÇÕES`→`HISTÓRICO DE CONTEÚDOS`. Copiar o `SOBRE_*` correspondente para uma coluna do histórico no momento do arquivamento torna o briefing imutável e recuperável.
3. **Parar de sobrescrever.** `BRIEFING` vira append-only, com `MES`+`ANO` como chave — e aí a coluna `ANO_REFERENCIA` finalmente serve para o que foi criada. Exige mudar `gerarNovoMesCompleto()` e todos os casamentos.

A opção 2 é a que menos toca comportamento e mais preserva dado. **Recomendo levá-la ao usuário antes de qualquer PR neste contexto.**

### 5.3 Tratamento das funções contaminadas

**`gerarNovoMesCompleto()` (`Código.js:85-166`) — recorte de Briefing (L119-133).**
Vira `BriefingRepository.substituirCampanha(mes, ano, parceirasAtivas)`. Duas melhorias vêm de graça:
- `setValues()` em bloco, matando L-15 (INV-05);
- o `clearContent()` fica **dentro** do repositório, junto do append — um único ponto onde a transação pode ganhar rollback.

**`getBriefing()` (`WebApp.js:288-385`).**
Cortar em L320. A metade superior (`AtivacaoRepository.buscarPorId` + checagem de ownership) pertence a Execução Operacional. A inferior é `BriefingRepository` + `BriefingService.selecionarTextoPorFormato()`. O orquestrador `getBriefing()` fica com ~15 linhas.

**`onEdit()` — bloco `BRIEFING` (`Código.js:204-228`).**
Extrair para `BriefingEventHandler.aoEditarLook(e, h)`. Aproveitar para trocar o `includes()` frouxo (INV-04) por um mapa explícito `{ SOBRE_REEL: 'APROVACAO_REEL', ... }` — **mas atenção**: hoje a regra dispara para `LOOK_REEL` também. Restringir a lista muda comportamento. Precisa de teste caracterizando o comportamento atual **antes** (`CLAUDE.md` §12.4.7).

**`onEdit()` — a escrita cruzada em `BRIEFING` (`Código.js:249-281`).**
Fica em Execução Operacional (é o `DATA_ATIVACAO` que dispara), mas passa a chamar `BriefingRepository.propagarDataAprovacao(influKey, mes, ano, formato, data)`. A busca linear sobre `getDataRange()` inteiro, dentro de um `onEdit`, sai do handler.

### 5.4 Cobertura de teste existente

- `test/webapp-briefing.test.js` — cobre `getBriefing()`.
- `test/codigo-ano-referencia-briefing.test.js` — cobre o casamento `MES`+`ANO`, nos dois lados.
- `test/codigo-gerar-novo-mes.test.js` — cobre o ciclo mensal (com `exportarSchemaAoIniciarNovoMes` stubado, L53-58).

**Sem cobertura:** `sincronizarLooks()` (nenhum teste o exercita) e o bloco `BRIEFING` de `onEdit()`. São exatamente as duas áreas com os achados INV-02, INV-03 e INV-04. Escrever teste antes de tocar.

---

## Resumo executivo

| Achado | Severidade | Ação |
|---|---|---|
| INV-01 · `BRIEFING` é sobrescrito todo mês; `getBriefing()` falha para períodos passados; `temBriefing:true` é hardcoded | 🔴 Crítico | Decisão de modelagem do usuário (3 opções em §5.2) |
| INV-02 · `sincronizarLooks()` casa `INFLU_KEY` por posição (`rb[0]`) e sem normalizar | 🟠 Alto | Teste + `BriefingRepository` |
| INV-03 · `catch(e){}` vazio engolindo falha de planilha externa | 🟠 Alto | `Logger.log` (paridade com `onEdit`/`onFormSubmit`) |
| INV-04 · `includes()` frouxo no cabeçalho dispara em `LOOK_*` | 🟡 Médio | Mapa explícito, após teste de caracterização |
| INV-05 · 5 `setValue()` por parceira em `BRIEFING` | 🟡 Baixo | Sai de graça na extração do repositório |
| INV-01(a) · A correção `ANO_REFERENCIA` de 2026-07-07 protege de uma colisão que não pode ocorrer | ℹ️ Registro | Nenhuma. Corrigir a documentação, não o código. |
