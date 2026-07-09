# Auditoria Vertical — Contexto 3: Execução Operacional

> Fase 2 · Passo 4 · Auditoria puramente analítica. **Nenhum código foi alterado.**
> Fontes de invariante: `SYSTEM_TRUTH.md` §3, §5 (itens 8 e 9); `CLAUDE.md` §3 ("Upload de material", "Arquivamento"), §6.
> Linhas conferidas em 2026-07-09 contra `main` @ `897e2dc`.

## Escopo

É o maior contexto do sistema. Cobre o ciclo de vida da **Ativação** (unidade de conteúdo a ser produzida), o upload de material para o Drive, a logística de envio de looks e o arquivamento.

| Arquivo | Linhas | Papel |
|---|---|---|
| `mae/WebApp.js` | 238-287 | `getPendencias()` |
| `mae/WebApp.js` | 469-489 | `extrairAtivacoes()` (aninhada em `getHistorico`) |
| `mae/WebApp.js` | 631-647 | `encontrarLinhaAtivacaoPorId()` |
| `mae/WebApp.js` | 747-764 | `normalizarStatusAtivacao()` |
| `mae/WebApp.js` | 856-956 | `iniciarEnvioResumable()`, `finalizarEnvioResumable()` |
| `mae/Código.js` | 187-315 | `onEdit()` — **recortes de Ativações, Fluxo Logístico** |
| `mae/Código.js` | 346-357 | `ordenarAbaAtivacoesCronologico()` |
| `mae/Código.js` | 482-533 | `atualizarRastreiosBRComerce()` |
| `mae/Código.js` | 655-696 | `garantirColunasIdAnoAtivacoes()` |
| `mae/Código.js` | 752-768 | `menuArquivarTudo()`, `arquivarFluxo()` |
| `mae/PortalUi.gs` | 1-10 | `abrirPortalModal()` |
| `mae/Index.html` | 1162-1227 | `carregarPendencias()`, `renderPendencias()` |
| `mae/Index.html` | 1262-1393 | upload resumable completo |

Abas de domínio: **`ATIVAÇÕES`**, **`FLUXO LOGÍSTICO`**. Escreve em `HISTÓRICO DE CONTEÚDOS`, `HISTÓRICO LOGÍSTICO` e no Google Drive.

---

## 1. Fluxo Funcional

### 1.1 Ciclo de vida da Ativação

```
gerarNovoMesCompleto()  [Planejamento]
  → ATIVAÇÕES.append { ID: uuid, INFLU_KEY, MES_REFERENCIA, ANO_REFERENCIA,
                       FORMATO, STATUS_CONTEUDO: 'em aberto' }
       (1 linha por REEL, por CARROSSEL, por STORIES — Código.js:140-154)

       ┌──────────────── estados de STATUS_CONTEUDO ────────────────┐
       │  validação de célula aceita SÓ estes 5 valores:            │
       │  em aberto | falta drive | aprovado | ajustes | postado    │
       └────────────────────────────────────────────────────────────┘

'em aberto'  ──(upload da parceira)──▶  'ajustes'   [finalizarEnvioResumable, L946]
'ajustes'    ──(equipe, manual)─────▶  'aprovado'   [nenhuma função de código]
'aprovado'   ──(equipe, manual)─────▶  'postado'    [nenhuma função de código]
'postado'    ──(onEdit)─────────────▶  arquivarGenerico() → HISTÓRICO DE CONTEÚDOS
```

`normalizarStatusAtivacao()` (`WebApp.js:747`) traduz o valor bruto da célula para o vocabulário do Portal:

| Célula (bruto) | Portal (normalizado) | Ordem de teste |
|---|---|---|
| contém `aprovado` | `APROVADO` | 1º (terminal) |
| contém `postado` ou `publicado` | `PUBLICADO` | 2º (terminal) |
| contém `aprova`, `revis` ou `ajuste` | `EM_APROVACAO` | 3º |
| contém `falta` ou `aberto` | `AGUARDANDO_MATERIAL` | 4º |
| qualquer outro | `AGUARDANDO_MATERIAL` | fallback |

A ordem é **carregada de história**: o comentário em L748-757 explica que `"aprovado".includes("aprova")` é `true`, e que a ordem antiga fazia toda ativação aprovada cair em `EM_APROVACAO`. Não reordenar.

### 1.2 Upload de material (o fluxo mais complexo do sistema)

```
Index.html:abrirEnviarMaterial(idAtivacao)          L1265
  → arquivoSelecionado(files)  → STATE.arquivosSelecionados  L1280
  → iniciarEnvio()                                   L1296
      para cada arquivo, sequencialmente:
        │
        ├─ chamar('iniciarEnvioResumable', token, idAtivacao, name, type, size)
        │    → WebApp.js:856
        │        validarToken → cupom
        │        encontrarLinhaAtivacaoPorId(aba, h, idAtivacao)   ← ID estável
        │        ownership: rowInfluKey === influKey  senão ACESSO_NEGADO
        │        obterOuCriarPastaDestino()  → Drive: /raiz/{nome}/{mes}/{FORMATO}
        │        UrlFetchApp.fetch(googleapis.com/upload/drive/v3/files?uploadType=resumable)
        │            Authorization: Bearer ScriptApp.getOAuthToken()
        │        devolve { uploadUrl: headers["Location"] }
        │
        ├─ enviarArquivoResumable(uploadUrl, file, onProgress)     L1345
        │    CHUNK_SIZE = 8 MiB
        │    while offset < totalSize:
        │      fetch(uploadUrl, PUT, Content-Range: bytes o-f/total, body: chunk)
        │      308 → continua (lê header Range para o próximo offset)
        │      200/201 → devolve json.id
        │    ⚠️ o navegador fala DIRETO com o Google, sem passar pelo Apps Script
        │
        └─ chamar('finalizarEnvioResumable', token, idAtivacao, fileId)
             → WebApp.js:913
                 LockService.waitLock(10000)
                 re-resolve a linha DENTRO do lock  ← blindagem contra corrida
                 re-verifica ownership
                 LINK_ARQUIVO += "\n" + link        (append, não substitui)
                 STATUS_CONTEUDO = "ajustes"        ⚠️ valor fixo, ver INV-08
```

### 1.3 Logística de envio de looks

```
gerarNovoMesCompleto()  → FLUXO LOGÍSTICO.append
    [INFLU_KEY, ENDERECO, "Aguardando Confirmação", MES, '', '', 'pendente']
    ⚠️ array POSICIONAL de 7 posições — Código.js:134

onEdit() bloco FLUXO  (Código.js:302-306)
    RASTREIO recebe URL com "http" → carimba DATA_DE_ENVIO (se vazia)

atualizarRastreiosBRComerce()  (Código.js:482)
    para cada RASTREIO contendo "rastreio/":
      código = split("rastreio/")[1]
      UrlFetchApp → api.brcomerce.com.br/tracking/{codigo}
      STATUS_LOGISTICA = último evento dos Correios (UPPER)
    depois: flush() → arquivarFluxo(true) → sort por DATA_DE_ENVIO

'entregue' | 'entrega realizada' | 'objeto entregue'  →  HISTÓRICO LOGÍSTICO
```

---

## 2. Entidades e Regras de Negócio

### Entidade: **Ativação** (agregado raiz)

Identidade: `ID` (UUID, coluna criada em 2026-07-08). Chave natural: `INFLU_KEY` + `MES_REFERENCIA` + `ANO_REFERENCIA` + `FORMATO`.

| Coluna | Escrita por | Lida por |
|---|---|---|
| `ID` | `gerarNovoMesCompleto`, `backfillIdAnoAba_` | `encontrarLinhaAtivacaoPorId`, `getPendencias` |
| `STATUS_CONTEUDO` | `finalizarEnvioResumable` (só `"ajustes"`), humano | `getPendencias`, `onEdit`, `arquivarGenerico` |
| `LINK_ARQUIVO` | `finalizarEnvioResumable` (append multilinha) | ninguém no código |
| `DATA_ATIVACAO` | humano | `onEdit` (dispara propagação), `getPendencias` |
| `DATA_APROVACAO` | `onEdit` (calculada) | `getPendencias`, `getBriefing` |
| `FORMATO` | `gerarNovoMesCompleto` | `getBriefing`, `obterOuCriarPastaDestino` |

### Entidade: **Item Logístico** (`FLUXO LOGÍSTICO`)

Sem identidade estável. Casado por `INFLU_KEY` na coluna 1, posicional.

### Regras que o código de fato executa

1. **RN-14** — Uma ativação por unidade de conteúdo contratada. `qStories > 1` → formatos `STORIES_1`, `STORIES_2`; `qStories === 1` → formato `STORIES` (sem sufixo). (`Código.js:148-154`)
2. **RN-15** — Upload **nunca substitui**: `LINK_ARQUIVO` acumula links separados por `\n`. (`WebApp.js:938`)
3. **RN-16** — Upload sempre grava `"ajustes"`, independentemente do status anterior. (`WebApp.js:946`)
4. **RN-17** — Ownership verificada **duas vezes** no upload: em `iniciarEnvioResumable` (L871) e de novo dentro do lock em `finalizarEnvioResumable` (L935).
5. **RN-18** — Pasta do Drive: `{raiz}/{NOME_INFLUENCIADORA}/{MES_REFERENCIA}/{FORMATO_NORMALIZADO}`. `nomeFormatoPasta()` (`WebApp.js:798`) colapsa `STORIES` → `STORIES 1`.
6. **RN-19** — `ATIVAÇÕES` é reordenada por `DATA_ATIVACAO` ascendente após toda mudança relevante. (`Código.js:346`)
7. **RN-20** — Arquivamento é disparado por `STATUS_CONTEUDO` contendo `postado`, e move **todas** as linhas elegíveis, não só a editada. (`Código.js:231-235`)

---

## 3. Aderência às Invariantes

### ✅ Respeitadas

- **`STATUS_CONTEUDO` respeita a validação de célula.** `finalizarEnvioResumable()` grava `"ajustes"`, um dos 5 valores aceitos. `SYSTEM_TRUTH.md` §5 item 8 documenta a causa raiz (`"EM_APROVACAO"` violava a validação, o erro escapava do `try/catch` no flush diferido, e o cliente recebia HTML de erro em vez de JSON — o "Failed to fetch"). O código atual está correto e o comentário L940-946 preserva a explicação.
- **Resolução por ID estável, não por número de linha.** `encontrarLinhaAtivacaoPorId()` (L631) é usada em `getBriefing`, `iniciarEnvioResumable` e `finalizarEnvioResumable`. `CLAUDE.md` §3 registra que existia corrida real quando isso era feito por linha.
- **Re-resolução dentro do lock.** `finalizarEnvioResumable()` (L930-931) refaz `getHeaderMap` + `encontrarLinhaAtivacaoPorId` **depois** de adquirir o lock. É a blindagem correta contra inserção/remoção de linha entre o upload e a gravação.
- **`obterOuCriarPastaDestino()` usa double-checked locking.** L816-843: tenta sem lock, adquire lock, re-checa, cria. Correto.
- **Header `Location` ausente é tratado.** L902-905: sem ele, a função devolvia `ok:true` com `uploadUrl: undefined`, e o navegador fazia `fetch(undefined)` → 404. Corrigido e comentado.
- **`arquivarGenerico()` copia por nome de cabeçalho.** `Código.js:805-811`. `CLAUDE.md` §3 documenta o bug posicional que isso corrigiu (`LINK_ARQUIVO` caindo na coluna de `DATA_ARQUIVAMENTO`).
- **`PortalUi.gs` é código ativo**, chamado por `Código.js:61`, e está na allowlist `mae/.claspignore`. O comentário L4-6 explica por que não pode redeclarar `doGet`/`include`.

### ❌ Violações e divergências

#### INV-06 · 🔴 **XSS armazenado: `idAtivacao` é interpolado em `onclick` sem escapar**

`Index.html:1201-1203`:

```js
botoes += '<button ... onclick="abrirBriefing(\''+item.idAtivacao+'\')">Ver briefing</button>';
botoes += '<button ... onclick="abrirEnviarMaterial(\''+item.idAtivacao+'\')">Enviar material</button>';
```

`escaparHtml()` (L1220) existe e é aplicada a `item.formato` (L1207) — mas **não** a `item.idAtivacao`.

`idAtivacao` vem de `getPendencias()` (`WebApp.js:267-270`):

```js
let idLinha = h['ID'] ? dados[i][h['ID'] - 1] : "";
itens.push({ idAtivacao: idLinha || ("ROW" + (i + 1)), ... });
```

É **o valor bruto da célula `ID`**, sem sanitização em nenhum ponto do caminho.

Hoje a coluna é preenchida com `Utilities.getUuid()` (`Código.js:141, 718`), que só produz hex e hífens. Mas:
- é uma célula de planilha, editável por qualquer pessoa com acesso de escrita ao ERP;
- a migração `backfillIdAnoAba_()` (L717) só preenche células **vazias** — um valor pré-existente arbitrário sobrevive;
- o payload `'); alert(1); //` fecha o atributo `onclick` e executa.

E o que o script atacante encontra em `localStorage`? O token de sessão (ver `01_gestao_parceiros.md`, V-01). **Os dois achados se compõem: XSS armazenado + bearer token em `localStorage` = sequestro de sessão de qualquer parceira que abra o Portal.**

Vetor exige acesso de escrita à planilha, ou seja, é um ataque de insider / conta comprometida da equipe — não um atacante anônimo. Isso reduz a probabilidade, não o impacto. Registro como 🔴 porque a correção é trivial (`escaparHtml(item.idAtivacao)`) e a composição com V-01 é severa.

Mesmo padrão, menor exposição: `Index.html:1487` (`renderHistoricoAtivacoes`) **usa** `escaparHtml(item.formato)` mas não escapa `item.status` — que passa por `normalizarStatusAtivacao()` e só pode assumir 4 valores constantes. Seguro por construção.

#### INV-07 · 🟠 **`iniciarEnvioResumable()` ignora `mimeType` e `tamanhoBytes`**

Assinatura (`WebApp.js:856`):

```js
function iniciarEnvioResumable(token, idAtivacao, nomeArquivo, mimeType, tamanhoBytes) {
```

Payload enviado ao Google (L888):

```js
payload: JSON.stringify({ name: nomeArquivo, parents: [pastaFormato.getId()] })
```

`mimeType` e `tamanhoBytes` **nunca são lidos**. O front-end os calcula e transmite a cada arquivo (`Index.html:1310`). Consequências:

1. **Nenhuma validação de tamanho.** Não há limite de upload no servidor. Uma parceira pode enviar 50 GB.
2. **Nenhuma validação de tipo.** Não há allowlist de mime. `.exe`, `.html`, qualquer coisa vai para o Drive da agência.
3. O Drive infere o mime pelo conteúdo, então arquivos ainda abrem corretamente — o parâmetro é apenas ignorado, não quebra nada.

Isto é **superfície de política de negócio ausente**, não bug. Mas os parâmetros estão ali, sugerindo que a validação era intencional e ficou pelo caminho.

#### INV-08 · 🟠 **`finalizarEnvioResumable()` regride status terminal**

`WebApp.js:946`:

```js
abaAtivacoes.getRange(linhaAtivacao, hAtiv['STATUS_CONTEUDO']).setValue("ajustes");
```

Escrita **incondicional**. Não lê o status anterior.

Cenário real: uma ativação chega a `aprovado` (equipe aprovou o material). A parceira, por engano, reabre o Portal e envia outro arquivo para a mesma ativação — o botão "Enviar material" é renderizado para **todos** os itens (`Index.html:1203`), sem filtro por status. O status volta para `ajustes`. A aprovação é perdida silenciosamente, sem log.

O mesmo vale para `postado`: `getPendencias()` lista a ativação até ela ser arquivada, e o arquivamento só ocorre no `onEdit` seguinte.

`RN-15` (append de `LINK_ARQUIVO`) mostra que envio múltiplo é **esperado**. O que não é tratado é o efeito colateral no status.

#### INV-09 · 🟠 **`onEdit()` bloco `ATIVAÇÕES` arquiva em massa a cada edição**

`Código.js:231-235`:

```js
if (col === h['STATUS_CONTEUDO'] && String(e.value).toLowerCase().includes("postado")) {
  arquivarGenerico(SETUP.ABAS.ATIVACOES, SETUP.ABAS.HISTORICO_CONT, 'STATUS_CONTEUDO', ['postado'], true);
  ordenarAbaAtivacoesCronologico();
  return;
}
```

`arquivarGenerico()` (`Código.js:769`) lê a aba inteira, varre de baixo para cima e, para **cada** linha com `postado`, faz `appendRow()` + `deleteRow()`. São duas chamadas de API por linha, dentro de um trigger `onEdit`.

Marcar uma ativação como `postado` arquiva **todas** as que estiverem nesse estado, inclusive as que outra pessoa acabou de marcar. Funciona — mas o custo é O(n) por edição, e `onEdit` tem limite de 30 s de execução. Com um lote grande de `postado` pendentes, o trigger estoura o tempo e falha **no meio**, deixando linhas parcialmente movidas (já em `HISTÓRICO`, ainda em `ATIVAÇÕES`, ou vice-versa — a ordem é `appendRow` depois `deleteRow`, então o pior caso é duplicação, não perda).

Não há lock. `arquivarGenerico()` chamado simultaneamente por `onEdit` e por `menuArquivarTudo()` pode duplicar linhas no histórico.

#### INV-10 · 🟡 **`FLUXO LOGÍSTICO` é escrito por array posicional**

`Código.js:134`:

```js
listaFluxo.push([inf.nome, inf.endereco || "", "Aguardando Confirmação", mesTarget, '', '', 'pendente']);
...
fluxoSheet.getRange(fluxoSheet.getLastRow()+1, 1, listaFluxo.length, 7).setValues(listaFluxo);   // L157
```

Sete posições fixas, contra a estrutura declarada em `setupERP()` (`Código.js:1024`):
`INFLU_KEY, ENDERECO, STATUS_REVISAO, MES_REFERENCIA, RASTREIO, DATA_DE_ENVIO, STATUS_LOGISTICA`.

As outras três abas do mesmo loop usam `montarLinha(hPag, {...})` / `montarLinha(hAtiv, {...})` — resolução por nome. `FLUXO LOGÍSTICO` é a única exceção, na mesma função. Inserir uma coluna em `FLUXO` corrompe todas as linhas do próximo mês.

Nota derivada: `FLUXO LOGÍSTICO` **não tem `ANO_REFERENCIA`** (nem em `setupERP`, nem no array). É a única aba operacional sem o campo. Campanhas de `AGOSTO/2025` e `AGOSTO/2026` colidem ali. Como nada lê `FLUXO` programaticamente além de `gerarMensagemRevisao()` (que resolve por linha ativa), o efeito hoje é confusão visual, não erro de dados.

#### INV-11 · 🟡 **`atualizarRastreiosBRComerce()` confia cegamente no shape da API externa**

`Código.js:502-506`:

```js
if (json.correiosRastreio && json.correiosRastreio.length > 0) {
  let last = json.correiosRastreio[json.correiosRastreio.length - 1];
  let txtStatus = (last[0] === "OUTROS" || !last[0]) ? last[1].descricao.toUpperCase() : last[0].toUpperCase();
```

`last[1].descricao` — acesso encadeado sem guarda. Se a BRComerce mudar o formato, lança. O `catch(e){}` da L510 engole. Resultado: rastreios param de atualizar silenciosamente, e o toast final (L518) reporta `0 objetos rastreados` sem explicar.

Mesma família de INV-03 (`sincronizarLooks`): integração externa + catch vazio.

Também: `atualizarRastreiosBRComerce()` chama `arquivarFluxo(true)` (L514) — ou seja, uma função de *atualização de rastreio* arquiva linhas como efeito colateral. Não está no nome nem no menu (`" 1. Atualizar Rastreios Automáticos (BRComerce)"`).

#### INV-12 · 🟡 **`encontrarLinhaAtivacaoPorId()` mantém um fallback `ROWn` que anula a proteção contra corrida**

`WebApp.js:633-636`:

```js
if (idStr.indexOf("ROW") === 0) {
  const linha = parseInt(idStr.substring(3), 10);
  return (linha >= 2 && linha <= abaAtivacoes.getLastRow()) ? linha : -1;
}
```

O comentário (L629-630) declara: *"aceita o número de linha literal só na transição"*. A migração `garantirColunasIdAnoAtivacoes()` já foi executada em produção (`CLAUDE.md` §3, 2026-07-08), portanto a coluna `ID` existe e está preenchida. **A transição acabou.** O fallback continua ativo, e enquanto existir, o modo de corrida original (resolução por número de linha) permanece alcançável — basta uma linha com `ID` vazio para `getPendencias()` (L270) emitir `"ROW" + (i+1)`.

Além disso: `encontrarLinhaAtivacaoPorId()` lê a coluna `ID` inteira (L638) a cada chamada. No upload, é chamada duas vezes (início e fim), mais uma em `getBriefing`.

---

## 4. Lixo Técnico e Riscos

| # | Item | Local | Natureza |
|---|---|---|---|
| L-16 | `mimeType`, `tamanhoBytes` — parâmetros recebidos e nunca usados | `WebApp.js:856` | Ver INV-07 |
| L-17 | `LINK_ARQUIVO` — escrito, nunca lido por nenhuma função | `WebApp.js:939` | Só consumido por humanos na planilha |
| L-18 | `temBriefing: true` hardcoded | `WebApp.js:276` | Mente. Ver `02_planejamento_operacional.md`, INV-01(b). |
| L-19 | `STATE.arquivoSelecionado` (singular) declarado; código usa `STATE.arquivosSelecionados` (plural) | `Index.html:853` vs `1267, 1282, 1297` | Campo morto do tempo do upload de arquivo único |
| L-20 | Indentação de 6 espaços em `arquivoSelecionado()` e `iniciarEnvio()` | `Index.html:1280-1289, 1296-1337` | Resíduo de cópia. Todo o resto do arquivo usa 0/2. |
| L-21 | `PASTA_MAE_ID` hardcoded como constante | `WebApp.js:790` | Fallback do `PropertiesService`. ID de pasta de produção literal no código-fonte. |
| L-22 | `catch(e){}` vazio em `atualizarRastreiosBRComerce` | `Código.js:510` | Ver INV-11 |
| L-23 | `voltarDeUploadParaPendencias()` chama `router.navigate('pendencias')` | `Index.html:1390` | Wrapper de uma linha, sem outro chamador além do markup |
| L-24 | `ordenarAbaAtivacoesCronologico()` chamada 3× por edição de `DATA_ATIVACAO` | `Código.js:233, 287` + `161` | `sort()` da aba inteira dentro de `onEdit` |

### Acoplamentos nocivos

- **`onEdit()` é o ponto de contaminação máxima do sistema.** O bloco `ATIVAÇÕES` (L230-289) faz quatro coisas de três contextos: arquiva (Inteligência), calcula `DATA_APROVACAO` (Execução), **escreve em `BRIEFING`** (Planejamento, L249-281) e reordena a aba (Execução). São 60 linhas num único `if`.
- **`getBriefing()` (`WebApp.js:288-320`) pertence metade a este contexto.** A resolução de ativação por ID e a checagem de ownership são Execução; só L329+ é Planejamento.
- **`obterOuCriarPastaDestino()` (`WebApp.js:808`) depende de Gestão de Parceiros** (`getNomeInfluByCupomCached`) para nomear a pasta. Se a razão social mudar, novos uploads vão para uma pasta nova, e os antigos ficam órfãos na antiga. Nenhum código reconcilia.
- **`atualizarRastreiosBRComerce()` arquiva** (L514). Efeito colateral não anunciado.

---

## 5. Recomendações de Migração (V2)

### 5.1 Serviços puros a extrair

```
AtivacaoRepository                          ← isola ATIVAÇÕES (diretriz CLAUDE.md §12.3)
  buscarPorId(id)                           ← encontrarLinhaAtivacaoPorId + getRange
  listarPorParceiraEPeriodo(influKey, mes, ano)
  registrarUpload(id, link)                 ← RN-15 + RN-16, com a decisão de INV-08 explícita
  atualizarStatus(id, novoStatus)

StatusAtivacaoService                       ← PURO. Já é (WebApp.js:747)
  normalizar(bruto) → APROVADO|PUBLICADO|EM_APROVACAO|AGUARDANDO_MATERIAL
  podeReceberUpload(status)                 ← NOVO: resolve INV-08
  VALORES_VALIDOS_CELULA = [...]            ← torna a validação de célula explícita no código

DriveStorageGateway                         ← única porta para DriveApp/upload
  resolverPasta(nomeParceira, mes, formato)
  iniciarSessaoResumable(nomeArquivo, pastaId, mimeType, tamanho)   ← valida INV-07
  nomeFormatoPasta(formato)                 ← PURO (WebApp.js:798)

LogisticaRepository                         ← isola FLUXO LOGÍSTICO
RastreioGateway                             ← única porta para api.brcomerce.com.br

ArquivamentoService                         ← ver 06_inteligencia_operacional.md
```

`normalizarStatusAtivacao()` e `nomeFormatoPasta()` **já são puras**. `test/webapp-envio-material.test.js` e `test/codigo-webapp-puras.test.js` já as cobrem. Extração de risco zero — comece por elas.

### 5.2 Tratamento das funções contaminadas

**`onEdit()` (`Código.js:187-315`) — a mais difícil do sistema.**

O `guard clause` de L199-200 (`ABAS_TRATADAS.indexOf(name) === -1`) já é um despachante embrionário. A quebra natural:

```js
function onEdit(e) {
  if (!e || !e.range) return;
  try {
    const ctx = montarContextoEdicao(e);          // sh, name, row, col, h
    if (!ctx) return;
    const handler = HANDLERS_POR_ABA[ctx.name];   // mapa explícito
    if (handler) handler(ctx);
  } catch(err) { Logger.log(...); }
}
```

Com `HANDLERS_POR_ABA = { BRIEFING: BriefingEventHandler, ATIVACOES: AtivacaoEventHandler, ... }`.

⚠️ **Três armadilhas nesta extração:**

1. **`onEdit` é um trigger simples.** Não tem autorização para `UrlFetchApp` nem `DriveApp`. Qualquer serviço extraído que um handler chame **não pode** ter essas dependências no caminho síncrono. `SchemaExporter.js:19-23` documenta o fenômeno. Ver também `01_gestao_parceiros.md`, V-03.
2. **`return` do bloco `BRIEFING` (L227) e do bloco `postado` (L234)** encerram a função. Os blocos `BASE`, `PAGAMENTOS` e `FLUXO` (L291-306) são `if` sem `else` — **podem executar em sequência** se a mesma aba casasse. Não casam hoje (nomes distintos), mas a semântica "primeiro que casa vence" vs. "todos que casam executam" difere entre os blocos. Preservar exatamente.
3. **O bloco `ATIVAÇÕES`/`DATA_ATIVACAO` escreve em `BRIEFING`.** Não é Execução. Deve virar uma chamada explícita a `BriefingRepository.propagarDataAprovacao(...)`, não um acesso direto a `getSheetByName(BRIEFING)` de dentro do handler de ativação.

**`gerarNovoMesCompleto()` — recorte de Ativações (`Código.js:140-154`, `159`).**
Vira `AtivacaoRepository.criarLote(parceiras, mes, ano)`. O recorte de `FLUXO` (L134, L157) vira `LogisticaRepository.criarLote(...)` e, no caminho, ganha `montarLinha()` — matando INV-10 sem mudar comportamento (a ordem de colunas hoje coincide com a nomeada).

**`getBriefing()` (`WebApp.js:288-385`).**
Cortar em L320. Metade superior → `AtivacaoRepository.buscarPorId()` + guarda de ownership.

### 5.3 Correções que **não são** refatoração (exigem PR e decisão próprios)

Estas mudam comportamento observável e caem sob `CLAUDE.md` §12.4.1:

| Achado | Mudança | Impacto observável |
|---|---|---|
| INV-06 | `escaparHtml(item.idAtivacao)` | Nenhum, se todo `ID` for UUID. **Fazer primeiro** — é a única correção de segurança sem trade-off. |
| INV-08 | `if (statusAtual === 'aprovado' \|\| statusAtual === 'postado') return { ok:false, erro:'ATIVACAO_JA_APROVADA' }` | Front precisa tratar o novo código de erro. Botão deveria sumir. |
| INV-07 | Validar `tamanhoBytes` e `mimeType` no servidor | Uploads hoje aceitos passam a ser rejeitados |
| INV-12 | Remover fallback `ROWn` | Ativação sem `ID` deixa de funcionar. Rodar `garantirColunasIdAnoAtivacoes()` antes e confirmar 0 vazios. |

**Recomendação de ordem:** INV-06 isolado, primeiro, num PR de uma linha. É segurança, é trivial, e não espera a refatoração.

### 5.4 Cobertura de teste existente

| Área | Teste |
|---|---|
| `getPendencias`, `normalizarStatusAtivacao` | `test/codigo-webapp-puras.test.js` |
| Upload resumable | `test/webapp-envio-material.test.js` |
| `onEdit` / aprovação | `test/codigo-onedit-aprovacao.test.js` |
| Migração `ID`/`ANO` | `test/codigo-migracao-id-ano-ativacoes.test.js` |
| `renderPendencias` (front) | `test/index-front-puras.test.js` |

**Sem cobertura:** `atualizarRastreiosBRComerce()`, `arquivarGenerico()`, `ordenarAbaAtivacoesCronologico()`, `obterOuCriarPastaDestino()`. `arquivarGenerico()` é o mais grave — é `[Core]`, usado por três contextos, tem histórico de bug de coluna (`CLAUDE.md` §3) e nenhum teste.

---

## Resumo executivo

| Achado | Severidade | Ação |
|---|---|---|
| INV-06 · XSS armazenado via `idAtivacao` em `onclick`; compõe com token em `localStorage` | 🔴 Crítico | PR isolado de 1 linha, imediato |
| INV-08 · Upload regride status `aprovado`/`postado` para `ajustes` | 🟠 Alto | Decisão do usuário (novo código de erro) |
| INV-07 · `mimeType`/`tamanhoBytes` recebidos e ignorados — sem limite de upload | 🟠 Alto | Política de negócio a definir |
| INV-09 · `arquivarGenerico()` em massa dentro de `onEdit`, O(n) API calls, sem lock | 🟠 Alto | `ArquivamentoService` + teste antes |
| INV-10 · `FLUXO LOGÍSTICO` escrito por array posicional; sem `ANO_REFERENCIA` | 🟡 Médio | `montarLinha()` na extração |
| INV-11 · `last[1].descricao` sem guarda + `catch` vazio; arquiva como efeito colateral | 🟡 Médio | `RastreioGateway` |
| INV-12 · Fallback `ROWn` sobreviveu ao fim da transição | 🟡 Médio | Remover após confirmar 0 `ID` vazios |
