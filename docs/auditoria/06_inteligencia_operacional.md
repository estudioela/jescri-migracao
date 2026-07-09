# Auditoria Vertical — Contexto 6: Inteligência Operacional

> Fase 2 · Passo 4 · Auditoria puramente analítica. **Nenhum código foi alterado.**
> Fontes de invariante: `SYSTEM_TRUTH.md` §3, §5, §6; `CLAUDE.md` §2, §6, §11.
> Linhas conferidas em 2026-07-09 contra `main` @ `897e2dc`.

## Escopo

Este contexto não serve à parceira nem ao operador do dia a dia. Serve **ao próprio sistema**: observabilidade, verificação de integridade, memória histórica.

| Arquivo | Linhas | Papel |
|---|---|---|
| `mae/SchemaExporter.js` | 1-425 (integral) | Schema vivo + checklist de integridade |
| `mae/QaShadow.js` | 1-318 (integral) | Camada de teste E2E sem tocar produção |
| `mae/WebApp.js` | 71-127 | `detectarAbasHistoricoLegado()`, `listarAbasHistoricoLegado()` |
| `mae/WebApp.js` | 445-522 | `getHistorico()` |
| `mae/Código.js` | 534-579 | `limparHistoricoOficial()` |

> Nota de método: `SchemaExporter.js` e `QaShadow.js` foram lidos integralmente por pertencerem **exclusivamente** a este contexto. Os demais, por range.

Abas de domínio: **`HISTÓRICO DE CONTEÚDOS`**, **`HISTÓRICO DE PAGAMENTOS`**, **`HISTÓRICO LOGÍSTICO`**, mais N abas legado de nome variável. Saídas externas: `SYSTEM_SCHEMA.json` / `SYSTEM_SCHEMA.md` no Drive.

---

## 1. Fluxo Funcional

### 1.1 Schema vivo — três gatilhos, um núcleo

```
(1) menu " 📄 Schema Vivo → 1. Exportar Schema Agora"
      → exportarSchemaCompleto()          SchemaExporter.js:39
          executarExportacaoSchema({forcar:true, respeitarDebounce:false})
          + ui.alert com o resultado do checklist

(2) trigger INSTALÁVEL onEdit
      → aoEditarExportarSchemaSeNecessario(e)     L59
          executarExportacaoSchema({forcar:false, respeitarDebounce:true})
          catch vazio — nunca pode quebrar a edição

(3) trigger de tempo (a cada 15 min)
      → exportarSchemaAutomatico()        L68
          executarExportacaoSchema({forcar:false, respeitarDebounce:false})

(4) fim de gerarNovoMesCompleto()         Código.js:163
      → exportarSchemaAoIniciarNovoMes()  L75
          executarExportacaoSchema({forcar:true, respeitarDebounce:false})

                            ▼
    executarExportacaoSchema(opts)        L138
      debounce 20s (só se respeitarDebounce)
      LockService.tryLock(5000) → se ocupado, PULA (não espera)
      gerarSchemaPlanilha(ss)             L190
        ├─ abas.map(gerarSchemaAba)       L281  ← por aba: cabeçalho, amostra,
        │                                          valores únicos de colunas STATUS
        ├─ listarTriggersInstalados()     L334  ← ScriptApp
        ├─ verificarIntegridadeSistema()  L240  ← o checklist
        └─ calcularHashEstado(abas)       L276  ← SHA-256 do JSON das abas
      se !forcar e hash == hashAnterior → PULA a escrita
      salvarSchemaJson()  + salvarSchemaMarkdown()   → Drive, pasta da planilha
      props.setProperty(ULTIMO_HASH, hash)
```

O gatilho (2) precisa de instalação manual única (`instalarTriggersSchemaExporter()`, menu). O comentário L19-23 explica por que não pode reusar o `onEdit` de `Código.js`: **triggers simples não têm autorização para `DriveApp`**, e aquele `onEdit` engole erros. Esta é, aliás, a documentação interna que sustenta o achado V-03 de `01_gestao_parceiros.md`.

### 1.2 Checklist de integridade

`verificarIntegridadeSistema(ss)` (`SchemaExporter.js:240`) faz duas verificações:

1. Toda aba declarada em `SETUP.ABAS` (`Código.js:8-18`) existe na planilha?
2. As 13 colunas de `INTEGRIDADE_BASE_COLUNAS_ESPERADAS` (L230-234) existem no cabeçalho de `BASE DE DADOS`?

O comentário L212-227 documenta a evolução: antes comparava **posição**; após a migração de `MAP.BASE` para `getHeaderMap()` (2026-07-07), compara só **presença**, porque posição deixou de importar.

### 1.3 QA Shadow

```
doGet(?mode=qa&token=...)           WebApp.js:132-137
  token confere com PropertiesService[QA_SHADOW_TOKEN]?
    → ContentService.createTextOutput(JSON.stringify(runQA_E2E()))
  senão → serve o Portal normalmente

runQA_E2E()                          QaShadow.js:143
  influenciadora = { cadastro, login, perfil, pendencias,
                     briefing, envioMaterial, pagamentos, historico }   ← 8 FIXTURES
  gestor         = { login, listaInfluenciadoras,
                     dadosInfluenciadora, atualizacaoStatus }           ← 4 FIXTURES
  sistema        = { integridade:    validarIntegridadeRealQA(),        ← REAL
                     schemaExporter: validarSchemaExporterRealQA() }    ← REAL
  falhas = coletarFalhasQA(...)
  aprovado = falhas.length === 0
```

### 1.4 Histórico

```
arquivarGenerico()  [Código.js:769, chamado por 3 contextos]
    ATIVAÇÕES     --postado--▶  HISTÓRICO DE CONTEÚDOS
    PAGAMENTOS    --pago-----▶  HISTÓRICO DE PAGAMENTOS
    FLUXO         --entregue-▶  HISTÓRICO LOGÍSTICO
    + carimbo DATA_ARQUIVAMENTO

getHistorico()      [WebApp.js:445]
    lê HISTÓRICO DE CONTEÚDOS + HISTÓRICO DE PAGAMENTOS
    + N abas legado descobertas por detectarAbasHistoricoLegado()
    devolve { ativacoes[], pagamentos[] }
```

`detectarAbasHistoricoLegado()` (`WebApp.js:71`) — critério de admissão duplo, documentado em L62-70:

- **(a)** cabeçalho tem `INFLU_KEY` **e** `MES_REFERENCIA` (assinatura original), **ou**
- **(b)** o nome da aba contém `"HISTORICO"` (normalizado, sem acento)

`INFLU_KEY` é obrigatório nos dois casos. Resultado cacheado 5 min (só nomes+tipo, não os dados).

---

## 2. Entidades e Regras de Negócio

### Entidades

Este contexto não possui agregado próprio. Ele **observa** os agregados dos outros cinco.

Suas "entidades" são artefatos:

| Artefato | Onde vive | Ciclo de vida |
|---|---|---|
| `SYSTEM_SCHEMA.json` / `.md` | Drive, pasta da planilha | Recriado a cada exportação (`setTrashed` + `createFile`) |
| `hashEstado` (SHA-256) | `PropertiesService` | Sobrescrito |
| Relatório QA (`runQA_E2E()`) | efêmero — JSON de resposta ou `Logger.log` | Nunca persistido |
| Linha arquivada | `HISTÓRICO *` | Append-only, exceto `limparHistoricoOficial()` |

### Regras que o código de fato executa

1. **RN-31** — Exportação de schema **nunca** pode quebrar a operação. Três dos quatro gatilhos usam `catch{}` silencioso deliberado (L62, L71, L78).
2. **RN-32** — Se o hash do estado não mudou, não escreve. (L164-170)
3. **RN-33** — Lock com `tryLock(5000)`: se ocupado, **pula** — não enfileira. (L152-156)
4. **RN-34** — `hashEstado` cobre **só as abas** (`calcularHashEstado(abas)`, L277), não o timestamp nem a lista de triggers. Instalar um trigger não dispara reexportação.
5. **RN-35** — QA Shadow: `persistidoEmProducao: false` é afirmado no retorno (L173). As 12 simulações não escrevem nada.
6. **RN-36** — `limparHistoricoOficial()` apaga `HISTÓRICO DE CONTEÚDOS` e `HISTÓRICO DE PAGAMENTOS`, mantém o cabeçalho, exige `ui.alert` YES, e **não toca abas legado**.

---

## 3. Aderência às Invariantes

### ✅ Respeitadas

- **`QaShadow` é somente-leitura de verdade.** Verifiquei chamada por chamada: das 14 entradas de `runQA_E2E()`, 12 são fixtures literais e 2 chamam `verificarIntegridadeSistema()` (L208) e `gerarSchemaPlanilha()` (L216). Nenhuma das duas escreve. `gerarSchemaPlanilha()` monta o objeto em memória; quem grava é `salvarSchemaJson`/`salvarSchemaMarkdown`, que **não são chamadas** por `validarSchemaExporterRealQA()`. O comentário L216 (`// só gera em memória, não grava nada`) confere.
- **`doGet(?mode=qa)` preserva o fallback incondicional.** `WebApp.js:132-137`: sem token, ou com token errado, o `if` não retorna e o fluxo cai no `HtmlService` normal. `CLAUDE.md` §6 exige exatamente isso. Confirmado.
- **Token QA nunca no código.** Gerado por `Utilities.getUuid()` e guardado em `PropertiesService` (`QaShadow.js:55-59`).
- **`limparHistoricoOficial()` é conservadora.** Confirmação `YES_NO`, apaga só linhas de dados (`deleteRows(2, ultimaLinha-1)`), não toca outras abas, loga o total. O comentário L558-559 registra por que não usa `Session.getActiveUser().getEmail()`: o manifest não declara o escopo `userinfo.email`.
- **`arquivarGenerico()` copia por nome.** `Código.js:805-811`. Colunas da origem sem correspondente no destino são descartadas; `DATA_ARQUIVAMENTO` é resolvida por nome, com fallback posicional só se o destino não tiver cabeçalho.
- **Cache de abas legado guarda metadados, não dados.** `listarAbasHistoricoLegado()` (L108) cacheia `{nome, tipo}` por 5 min e relê os dados frescos a cada chamada. Decisão correta, documentada em L54-58.

### ❌ Violações e divergências

#### INT-01 · 🔴 **O QA Shadow não pode reprovar por causa das simulações — 12 das 14 verificações são constantes**

`coletarFalhasQA()` (`QaShadow.js:185-199`):

```js
Object.keys(influenciadora).forEach(function (k) {
  if (influenciadora[k] && influenciadora[k].ok === false) falhas.push(...);
});
```

E as 12 fontes de `influenciadora`/`gestor` são funções como (`QaShadow.js:232`):

```js
function simularLoginQA() {
  return { ok: true, token: 'QA-TOKEN-INFLUENCER-SIMULADO', nome: QA_INFLUENCER.nome, persistido: false };
}
```

**`ok: true` é um literal.** Não há caminho de execução em que `simularLoginQA()` devolva `ok: false`. O mesmo vale para as outras onze. `coletarFalhasQA()` testa `ok === false` contra doze constantes `true`.

Portanto:

> `runQA_E2E().aprovado` é determinado **exclusivamente** por `sistema.integridade` e `sistema.schemaExporter`.

O que o QA Shadow de fato valida:
1. Todas as abas de `SETUP.ABAS` existem;
2. As 13 colunas esperadas existem em `BASE DE DADOS`;
3. `gerarSchemaPlanilha()` roda sem lançar e devolve um hash e um array de abas.

Isso é um **smoke test de estrutura**, e valioso. Não é um teste E2E.

O cabeçalho do arquivo é honesto sobre o mecanismo (L4-9: *"módulo SEPARADO que só valida CONTRATO (formato das respostas)"*). Mas mesmo "validar contrato" é generoso: para validar um contrato seria preciso comparar o shape da fixture com o shape retornado pela função real. **Nada compara.** As fixtures são devolvidas ao chamador e inspecionadas apenas por `ok === false`.

O risco não é o código — é o que se conclui dele. `SYSTEM_TRUTH.md` §6 registra: *"QA Shadow rodado manualmente na planilha real logo após o deploy `@29` — **aprovado, 0 falhas, 2896ms**. Confirma que os fixes de performance (cache de influKey/nome por cupom, remoção de lock em funções só-leitura, cache de abas legado, `onEdit()` saindo mais cedo) não quebraram o contrato validado pelo QA Shadow."*

**Essa conclusão não se sustenta.** Nenhum dos quatro fixes citados é exercitado por `runQA_E2E()`. `getInfluKeyByCupomCached`, `getPendencias`, `listarAbasHistoricoLegado` e `onEdit` não são chamados. Um `aprovado: true` após aquele deploy significa apenas que as abas e colunas continuavam lá.

Não é um bug a corrigir. É uma **afirmação de governança a corrigir** (`CLAUDE.md` §11.3: *"se houver divergência, sinalizar ao usuário antes de alterar código ou doc"*). Sinalizo aqui.

#### INT-02 · 🟠 **`getHistorico()` fabrica status em vez de lê-los**

`WebApp.js:483` e `WebApp.js:501`:

```js
status: "PUBLICADO",   // extrairAtivacoes
etapa:  "PAGO",        // extrairPagamentos
```

Literais. As duas funções são aplicadas tanto às abas oficiais quanto às **abas legado** (L511-514), que são descobertas por **assinatura de cabeçalho**, não por garantia de conteúdo (`detectarAbasHistoricoLegado`, L71).

Para as abas oficiais a premissa se sustenta — `arquivarGenerico()` só move `postado`/`pago`. Para as legado, não há nada que a sustente. Uma aba pré-consolidação com `STATUS_CONTEUDO = 'em aberto'` aparece à parceira como **Publicado**.

Detalhe agravante: `detectarAbasHistoricoLegado()` (L94-101) classifica `tipo` por presença de `STATUS_CONTEUDO`/`STATUS_PAGAMENTO` no cabeçalho — e, se nenhum dos dois existir mas o nome contiver `"HISTORICO"`, **chuta pelo nome**:

```js
tipo = nomeNormalizado.includes("PAGAMENTO") ? 'PAGAMENTO' : 'CONTEUDO';
```

Uma aba chamada `HISTÓRICO 2024` sem coluna de status é classificada como `CONTEUDO` e todas as suas linhas viram ativações `PUBLICADO`. O critério (b) foi um pedido explícito do usuário (comentário L66-68) — mas o custo é este.

Tratado também em `05_operacao_financeira.md`, FIN-02, pela ótica do dinheiro.

#### INT-03 · 🟠 **`limparHistoricoOficial()` não limpa o histórico que a parceira vê**

`Código.js:548`:

```js
[SETUP.ABAS.HISTORICO_CONT, SETUP.ABAS.HISTORICO_PAG].forEach(function (nomeAba) { ... });
```

Duas abas. Mas `getHistorico()` (`WebApp.js:451-462`) lê **três fontes**: `HISTORICO_CONT`, `HISTORICO_PAG` e todas as abas legado.

`CLAUDE.md` §3 documenta a limitação: *"Não toca abas legado de nome variável (essas continuam existindo, só não fazem parte do escopo desta limpeza)."* A documentação está correta.

O problema é a **intenção declarada**, no comentário do próprio código (`Código.js:527-528`):

> *"Decisão do usuário: abandonar o histórico legado — o histórico oficial passa a ser construído só a partir dos envios feitos daqui pra frente."*

E o `ui.toast` de conclusão (L564):

> *"Histórico oficial zerado — os próximos envios já geram os novos registros."*

O operador executa a ação irreversível, lê "histórico zerado", abre o Portal — e o histórico legado continua lá, porque `getHistorico()` nunca deixou de varrer as abas de nome variável. Abandonar o histórico legado é exatamente o que **não** aconteceu.

Não sei se as abas legado ainda existem na planilha viva (não tenho acesso). Se existirem, a ação de 2026-07-06 apagou o histórico oficial e preservou o legado — o inverso da intenção.

Isto é candidato a `CLAUDE.md` §12.4.6: *"Nunca descartar dado sem informar o usuário antes."* O dado foi descartado com informação incorreta sobre o efeito.

#### INT-04 · 🟠 **Token QA trafega em query string de um endpoint público anônimo**

`WebApp.js:132-137`:

```js
if (e && e.parameter && e.parameter.mode === 'qa') {
  const tokenEsperado = PropertiesService.getScriptProperties().getProperty(QA_TOKEN_PROP);
  if (tokenEsperado && e.parameter.token === tokenEsperado) {
    return ContentService.createTextOutput(JSON.stringify(runQA_E2E(), null, 2))...
```

O Web App é `access: ANYONE_ANONYMOUS` (`CLAUDE.md` §2). O token vai na URL:

```
.../exec?mode=qa&token=<uuid>
```

Query strings aparecem em logs de servidor, no header `Referer`, no histórico do navegador e em qualquer proxy do caminho. `configurarTokenQA()` (`QaShadow.js:65-75`) exibe a URL completa num `ui.alert` e instrui: *"Guarde num lugar seguro"*.

A comparação `e.parameter.token === tokenEsperado` é uma **comparação de string não constante-time**. Timing attack sobre HTTP público é ruído puro na prática; menciono por completude, não como risco real.

O que o token protege: `runQA_E2E()` devolve `sistema.schemaExporter.totalAbas`, `hashEstado`, e — se houver problema de integridade — `problemas[].detalhe`, que contém **nomes de aba e nomes de coluna de `BASE DE DADOS`** (`SchemaExporter.js:248, 264`). É reconhecimento de estrutura, não dado de parceira. Impacto moderado.

Mitigação sem mudar contrato: rotacionar o token depois de cada uso, ou aceitar apenas `POST` (mas `doPost` foi removido em 2026-07-07 — `SYSTEM_TRUTH.md` §1).

#### INT-05 · 🟡 **`salvarArquivoNaPastaDaPlanilha()` troca o ID do arquivo a cada exportação**

`SchemaExporter.js:362-365`:

```js
const existentes = pasta.getFilesByName(nomeArquivo);
while (existentes.hasNext()) { existentes.next().setTrashed(true); }
return pasta.createFile(nomeArquivo, conteudo, mimeType);
```

Manda o antigo para a lixeira e **cria um novo**. O `fileId` muda a cada execução.

Consequências: qualquer link direto para `SYSTEM_SCHEMA.md` quebra a cada 15 min (trigger de tempo); a lixeira do Drive acumula versões (auto-esvaziada em 30 dias); e o histórico de revisões do Drive — que existiria de graça com `setContent()` sobre o mesmo arquivo — é perdido.

`setContent()` no arquivo existente preservaria o ID e o versionamento nativo do Drive. Mudança pequena, ganho real. **Mas altera comportamento observável** de um artefato (§12.4.1) — ainda que ninguém dependa do ID hoje.

#### INT-06 · 🟡 **`normalizarCabecalhoIntegridade()` diverge de `getHeaderMap()` na regex de acentos**

Compare:

```js
// Código.js:962  (getHeaderMap — a fonte de verdade)
.normalize("NFD").replace(/[̀-ͯ]/g, "")

// SchemaExporter.js:237  (normalizarCabecalhoIntegridade)
.normalize('NFD').replace(/[̀-ͯ]/g, '')
```

A segunda usa os caracteres combinantes **literais** no source, em vez dos escapes `\u`. Semanticamente o intervalo é o mesmo (U+0300–U+036F). Mas é um range escrito com bytes invisíveis: sobrevive a `git`, e provavelmente sobrevive a qualquer editor moderno — até alguém rodar um linter que normalize o arquivo, ou copiar o trecho por um canal que perca os combinantes.

Se a regex quebrar, `verificarIntegridadeSistema()` deixa de normalizar acentos e passa a reportar **falsos positivos** em toda coluna acentuada. O checklist que existe para detectar drift torna-se a fonte do alarme.

Duas funções que precisam concordar, escritas de formas diferentes, é a definição de divergência latente. `getHeaderMap()` deveria ser a única implementação — mas `SchemaExporter` foi deliberadamente construído para não depender do resto do código (L4-5: *"não depende de FLOW.md, CLAUDE.md nem de nenhuma suposição sobre o restante do código"*). Tensão de design real, sem resposta óbvia.

#### INT-07 · 🟡 **`gerarSchemaAba()` faz uma chamada de API por coluna de status**

`SchemaExporter.js:307-316`:

```js
cabecalho.forEach(function (col, i) {
  if (!col || col.toUpperCase().indexOf("STATUS") === -1) return;
  const valores = sh.getRange(2, i + 1, totalLinhasDados, 1).getValues();   // ← 1 chamada por coluna
```

E `gerarSchemaPlanilha()` (L191) roda isso para **todas** as abas da planilha. `FLUXO LOGÍSTICO` tem `STATUS_REVISAO` + `STATUS_LOGISTICA` (2 chamadas); `ATIVAÇÕES`, `PAGAMENTOS` e os três históricos têm uma cada.

O cabeçalho e a amostra já são lidos separadamente (L290, L298). Um único `getDataRange().getValues()` por aba serviria os três propósitos.

Custo: pago a cada 15 min pelo trigger de tempo, a cada edição (com debounce de 20 s) pelo `onEdit` instalável, **e a cada chamada de `runQA_E2E()`** — que roda `gerarSchemaPlanilha()` inteiro em `validarSchemaExporterRealQA()` (L216). O endpoint `?mode=qa` é público (protegido por token, mas público).

Isto colide diretamente com `CLAUDE.md` §11.1: *"nenhuma função nova pode reprocessar a planilha inteira sem necessidade, rodar validação/auditoria no hot path"*. O código é anterior à regra e não está no hot path do Portal. Registro sem urgência.

#### INT-08 · 🟡 **`arquivarGenerico()` não tem lock e é chamada de quatro lugares**

`Código.js:769`. Chamadores: `onEdit` bloco ATIVAÇÕES (L232), `onEdit` bloco PAGAMENTOS (L299), `menuArquivarTudo()` (L753-755), `arquivarFluxo()` ← `atualizarRastreiosBRComerce()` (L514).

O loop (L793-821) faz `appendRow(destino)` **antes** de `deleteRow(i+1)`. Duas execuções concorrentes sobre as mesmas linhas:

- Ambas leem `getDataRange()` e veem a linha `postado`;
- Ambas fazem `appendRow` → **duplicata no histórico**;
- Ambas fazem `deleteRow(i+1)` → a segunda apaga a linha errada, pois os índices deslocaram.

Cenário concreto: operador marca `postado` (dispara `onEdit`) e, enquanto o trigger roda, clica no menu "Executar Limpeza e Arquivamento Geral". `onEdit` tem teto de 30 s; `arquivarGenerico` faz 2 chamadas de API por linha.

`arquivarGenerico()` é `[Core]`, é usada por **três contextos**, tem histórico de bug de coluna (`CLAUDE.md` §3), e **não tem um único teste**. É a função mais perigosa do repositório por essa combinação.

---

## 4. Lixo Técnico e Riscos

| # | Item | Local | Natureza |
|---|---|---|---|
| L-36 | `executarPendenciasQAHeadless()`, `rodarQaShadowAgoraHeadless()`, `configurarTokenQAHeadless()`, `instalarTriggersSchemaExporterHeadless()` | `QaShadow.js:99-137`, `SchemaExporter.js:126` | **Código morto.** Existem para `clasp run`, que `CLAUDE.md` §6 declara não-funcional neste projeto, com causa raiz investigada e instrução de "não tentar de novo". Quatro funções, ~40 linhas, sem chamador possível. |
| L-37 | `simularCadastroQA`, `simularLoginQA`, ... — 12 funções que retornam constantes | `QaShadow.js:228-318` | Ver INT-01. ~90 linhas. |
| L-38 | `QA_MANAGER.papel = 'GESTOR_SIMULADO'` — nunca lido | `QaShadow.js:42` | Campo de fixture não usado nem por `simularLoginGestorQA()` |
| L-39 | `observacaoTriggers` — parágrafo de 6 linhas embutido no JSON de saída | `SchemaExporter.js:200-205` | Documentação dentro do dado. Repetida no Markdown (L384). |
| L-40 | `detectarAbasHistoricoLegado()` monta `nomesConhecidos` de `MAP.*` **e** de `SETUP.ABAS` | `WebApp.js:72-79` | Os dois mapas declaram os mesmos nomes de aba independentemente. `CLAUDE.md` §8 avisa que "podem divergir". |
| L-41 | `getHistorico()` gera `idAtivacao: "H"+id` e `idPagamento: "H"+(i+1)` | `WebApp.js:478, 498` | Colidem entre abas legado. Nunca usados como chave. |
| L-42 | `salvarSchemaMarkdown` usa `MimeType.PLAIN_TEXT`; `salvarSchemaJson` usa a string `'application/json'` | `SchemaExporter.js:349, 353` | Inconsistência cosmética |

### Acoplamentos

- **`QaShadow` → `SchemaExporter`** (`QaShadow.js:208, 216`): `verificarIntegridadeSistema()` e `gerarSchemaPlanilha()`. Cruzado, direcional, **dentro do mesmo contexto**. Legítimo.
- **`SchemaExporter` → `Código.js` e `WebApp.js`** (`SchemaExporter.js:244, 253`): lê `SETUP.ABAS` e `MAP.BASE` via `typeof X !== 'undefined'`. Guardas defensivas que reconhecem o namespace global único do Apps Script. Funciona porque tudo compartilha escopo. **É a dependência que impede `SchemaExporter` de ser um módulo independente de verdade**, apesar do que o cabeçalho afirma (L4-5).
- **`getHistorico()` é `[Contaminado]`** — mas pré-fatiado em `extrairAtivacoes` (Execução) e `extrairPagamentos` (Financeiro).
- **`arquivarGenerico()` é `[Core]`, chamada por 3 contextos, sem teste.** Ver INT-08.

---

## 5. Recomendações de Migração (V2)

### 5.1 Serviços puros a extrair

```
HistoricoRepository                     ← isola HISTÓRICO * + abas legado
  listarAtivacoes(influKey, mes, ano)
  listarPagamentos(influKey, mes, ano)
  periodosDisponiveis(influKey)         ← alimenta PeriodoService
  detectarAbasLegado()                  ← já existe, WebApp.js:71

ArquivamentoService                     ← única porta para arquivarGenerico
  arquivar(origem, destino, coluna, valores)
  ⚠️ com LockService — resolve INT-08

IntegridadeService                      ← PURO, exceto a leitura de cabeçalho
  verificar(ss) → { ok, problemas[] }
  COLUNAS_ESPERADAS_BASE = [...]

SchemaService
  gerarSchema(ss) → objeto
  calcularHash(abas)                    ← PURO (SchemaExporter.js:276)
  gerarMarkdown(schema)                 ← PURO (SchemaExporter.js:368)
  formatarValorParaJson(v)              ← PURO (SchemaExporter.js:329)

SchemaStorageGateway                    ← única porta para DriveApp
  salvar(nomeArquivo, conteudo, mimeType)
```

`calcularHashEstado()`, `gerarMarkdownDoSchema()`, `formatarValorParaJson()` e `normalizarCabecalhoIntegridade()` **são puras hoje** e **não têm nenhum teste** — nenhum arquivo de `test/` carrega `SchemaExporter.js`. São ~120 linhas de lógica pura, testáveis sem um único mock. É a fruta mais baixa do repositório inteiro.

### 5.2 A pergunta que precede a refatoração deste contexto

**Para que serve o QA Shadow?**

Desde 2026-07-07 existe uma suíte Jest com 156 testes (`CLAUDE.md` §2), rodando em CI (`.github/workflows/tests.yml`), executando o código GAS real via `vm`. Ela cobre `Código.js`, `WebApp.js` e `Index.html`.

O QA Shadow, por INT-01, valida três coisas: abas existem, colunas existem, `gerarSchemaPlanilha()` não lança. As duas primeiras são `IntegridadeService`; a terceira é um smoke test.

Nada disso precisa de 318 linhas nem de 12 fixtures. E o Jest **não** cobre o que o QA Shadow cobre — porque o Jest roda contra mocks, e o valor do QA Shadow é rodar **contra a planilha viva**.

Três caminhos:

1. **Reduzir a essência.** Deletar as 12 simulações (L228-318) e as 4 headless (L99-137). Renomear para `HealthCheck`. Sobram ~60 linhas que fazem exatamente o que o atual faz. Muda o shape do JSON de `?mode=qa` — que ninguém consome programaticamente.
2. **Fazer o que o nome promete.** Injetar um `SpreadsheetApp` fake e chamar `login()`, `getPendencias()`, `getPagamentos()` de verdade. É o que o Jest já faz — e a decisão registrada em `QaShadow.js:7-9` foi explicitamente **contra** isso (*"a alternativa foi descartada por risco de regressão em código crítico de autenticação"*). Aquela decisão foi tomada **antes** da suíte Jest existir. Talvez mereça revisão.
3. **Manter.** Custo: 318 linhas e uma afirmação de governança incorreta em `SYSTEM_TRUTH.md` §6.

**Recomendo (1)**, e recomendo que venha acompanhado da correção do texto em `SYSTEM_TRUTH.md` §6 — não do código que ele descreve.

### 5.3 Tratamento das funções contaminadas

**`getHistorico()` (`WebApp.js:445-522`) — a mais fácil do sistema.**
A contaminação já está fisicamente separada em duas funções aninhadas. Extrair:

```js
function getHistorico(token, mes, ano) {
  const cupom = validarToken(token);  if (!cupom) return SESSAO_EXPIRADA;
  const influKey = ParceiroRepository.influKeyPorCupom(cupom);
  if (!influKey) return USUARIO_NAO_ENCONTRADO;              // ← corrige FIN-03 de quebra
  return { ok: true,
    ativacoes:  HistoricoRepository.listarAtivacoes(influKey, mes, ano),
    pagamentos: HistoricoRepository.listarPagamentos(influKey, mes, ano) };
}
```

Junto com `renderHistoricoAtivacoes`/`renderHistoricoPagamentos` (`Index.html:1477, 1495`), que já são duas funções independentes, isto é **um fluxo completo, das duas pontas, num PR pequeno e reversível** — exatamente o regime de `CLAUDE.md` §12.5.

**Foi a recomendação do Passo 3, e a leitura do código a confirma.** É o melhor primeiro PR da V2.

Ao extrair, decidir sobre INT-02: manter os literais `"PUBLICADO"`/`"PAGO"` (preserva comportamento) ou ler o status real (corrige, muda comportamento). Levar ao usuário. **Não decidir sozinho** — `CLAUDE.md` §12.4.1.

**`arquivarGenerico()` (`Código.js:769-824`).**
Antes de tocar: **escrever teste**. É `[Core]`, três contextos dependem, tem histórico de bug de coluna, zero cobertura. Depois: adicionar `LockService` (INT-08) e substituir o loop `appendRow`+`deleteRow` por acumulação + `setValues()` em bloco + `deleteRows()` em faixas.

Adicionar lock **muda comportamento sob concorrência** — hoje duas execuções duplicam; depois, uma espera. Isso é correção de bug, não refatoração. PR próprio.

### 5.4 Correções que **não são** refatoração

| Achado | Mudança | Impacto |
|---|---|---|
| INT-03 | `limparHistoricoOficial()` também limpar (ou listar) abas legado | **Destrutivo.** Exige confirmação enfática. Ver §12.4.6. |
| INT-02 | Ler `STATUS_*` real no histórico | Itens legado podem sumir ou mudar de rótulo |
| INT-08 | `LockService` em `arquivarGenerico` | Serializa arquivamentos concorrentes |
| INT-05 | `setContent()` em vez de `setTrashed`+`createFile` | `fileId` do schema passa a ser estável |
| INT-06 | Unificar a regex com `getHeaderMap()` | Nenhum, se as regexes forem equivalentes hoje (são) |

### 5.5 Cobertura de teste existente

| Arquivo | Testes que o carregam |
|---|---|
| `mae/SchemaExporter.js` | **nenhum** |
| `mae/QaShadow.js` | **nenhum** |
| `arquivarGenerico()` (`Código.js`) | **nenhum** |
| `getHistorico()` (`WebApp.js`) | `test/webapp-historico.test.js` |
| `limparHistoricoOficial()` | **nenhum** |

Confirmado no Passo 3: os testes carregam apenas `CODIGO_PATH`, `WEBAPP_PATH`, `INDEX_PATH`. `test/codigo-gerar-novo-mes.test.js:53-58` stuba `exportarSchemaAoIniciarNovoMes` explicitamente para não carregar `SchemaExporter.js`.

Para `QaShadow.js`, não testar é defensável — é ferramental, e testar fixtures constantes é tautologia. Para as **quatro funções puras de `SchemaExporter.js`** (`calcularHashEstado`, `formatarValorParaJson`, `gerarMarkdownDoSchema`, `normalizarCabecalhoIntegridade`), não é. E `arquivarGenerico()` sem teste é o maior risco isolado do repositório.

---

## Resumo executivo

| Achado | Severidade | Ação |
|---|---|---|
| INT-01 · QA Shadow: 12 das 14 verificações são `ok:true` literal. `aprovado` só reflete integridade de estrutura. `SYSTEM_TRUTH.md` §6 tira conclusão que o código não sustenta. | 🔴 Crítico (governança) | Corrigir a **documentação**. Depois, reduzir o módulo à essência. |
| INT-03 · `limparHistoricoOficial()` diz "histórico zerado" mas não toca abas legado, que `getHistorico()` continua exibindo | 🟠 Alto | Verificar se as abas legado existem; decidir com o usuário |
| INT-02 · `"PUBLICADO"`/`"PAGO"` literais aplicados a abas legado de conteúdo desconhecido | 🟠 Alto | Decisão do usuário |
| INT-04 · Token QA em query string de endpoint público anônimo | 🟠 Médio | Rotação após uso |
| INT-08 · `arquivarGenerico()` sem lock, 4 chamadores, 3 contextos, **zero testes** | 🟠 Alto | **Teste primeiro.** Depois lock. |
| INT-05 · Schema recriado (novo `fileId`) a cada exportação | 🟡 Baixo | `setContent()` |
| INT-06 · Regex de acentos duplicada com caracteres literais invisíveis | 🟡 Baixo | Unificar com `getHeaderMap()` |
| INT-07 · Uma chamada de API por coluna de status, por aba, a cada 15 min | 🟡 Baixo | `getDataRange()` único |
| L-36 · 4 funções `*Headless` para um `clasp run` que não funciona | ℹ️ Código morto | Remover |
