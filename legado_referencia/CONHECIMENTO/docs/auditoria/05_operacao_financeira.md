# Auditoria Vertical — Contexto 5: Operação Financeira

> Fase 2 · Passo 4 · Auditoria puramente analítica. **Nenhum código foi alterado.**
> Fontes de invariante: `SYSTEM_TRUTH.md` §3 (aba `PAGAMENTOS`), §5; `CLAUDE.md` §3 ("Pagamentos"), §7.
> Linhas conferidas em 2026-07-09 contra `main` @ `897e2dc`.

## Escopo

| Arquivo | Linhas | Papel |
|---|---|---|
| `mae/WebApp.js` | 386-444 | `getPagamentos()` |
| `mae/WebApp.js` | 490-522 | `extrairPagamentos()` (aninhada em `getHistorico`) |
| `mae/WebApp.js` | 765-773 | `normalizarStatusPagamento()` |
| `mae/Código.js` | 85-166 | `gerarNovoMesCompleto()` — **recorte de Pagamentos** |
| `mae/Código.js` | 187-315 | `onEdit()` — **recorte de Pagamentos** |
| `mae/Código.js` | 358-395 | `lancarPagamentosDoMes()` |
| `mae/SidebarBackend.js` | 25-29, 102-118 | `abrirSidebarPagamento()`, `salvarPagamentoExtra()` |
| `mae/Index.html` | 1394-1450 | `carregarPagamentos()`, `renderPagamentos()` |

Aba de domínio: **`PAGAMENTOS`**. Escreve em `HISTÓRICO DE PAGAMENTOS`.

---

## 1. Fluxo Funcional

### 1.1 Três portas de entrada, três formatos diferentes

```
┌─ A) gerarNovoMesCompleto()          Código.js:135-138
│     montarLinha(hPag, {
│       INFLU_KEY, MES_REFERENCIA, ANO_REFERENCIA,
│       VALOR_TOTAL, CHAVE_PIX, STATUS_PAGAMENTO: 'em aberto'
│     })                                                       ← 6 campos, com ANO
│
├─ B) lancarPagamentosDoMes()         Código.js:381-384
│     montarLinha(hPag, {
│       INFLU_KEY, MES_REFERENCIA, ANO_REFERENCIA,
│       VALOR_TOTAL, CHAVE_PIX, STATUS_PAGAMENTO: 'em aberto'
│     })                                                       ← idêntico a (A)
│
└─ C) salvarPagamentoExtra(obj)       SidebarBackend.js:110-114
      set('INFLU_KEY',       obj.influ)
      set('MES_REFERENCIA',  obj.mes)
      set('VALOR_TOTAL',     obj.valor)
      set('CHAVE_PIX',       obj.pix)
      set('STATUS_PAGAMENTO','em aberto')
                                                    ⚠️ SEM ANO_REFERENCIA
```

(A) e (B) são **quase a mesma função**. (A) roda no ciclo mensal; (B) é acionada manualmente para "pagamentos avulsos". Ambas filtram `influON` por `r[0]`, ambas montam a mesma linha. A diferença é o momento.

### 1.2 Ciclo de vida do Pagamento

```
'em aberto'  ──(equipe, manual)──▶  'aprovado'  ──(equipe, manual)──▶  'pago'
                                                                          │
                                              onEdit()  Código.js:298 ────┘
                                                arquivarGenerico(PAGAMENTOS →
                                                  HISTÓRICO DE PAGAMENTOS)
```

**Não existe derivação automática de `STATUS_PAGAMENTO` a partir de `STATUS_CONTEUDO`.** Isso é registrado explicitamente em `SYSTEM_TRUTH.md` §3 como achado corrigido: *"`STATUS_PAGAMENTO=PAGO` é **manual**; **não existe** derivação automática a partir de `STATUS_CONTEUDO`"*. Confirmo: nenhuma função de código escreve `aprovado` ou `pago` em `PAGAMENTOS`. Só `arquivarGenerico()` (`Código.js:799`) toca a linha, e só para carimbar `DATA_PAGAMENTO` se estiver vazia, no momento do arquivamento.

### 1.3 Leitura pela parceira

```
Index.html:carregarPagamentos()                    L1397
  → carregarPeriodos()                             ← compartilhado (ver §4)
  → chamar('getPagamentos', token, p.mes, p.ano)
  → WebApp.js:getPagamentos()                      L386
      filtra por influKey + mes + ano
      etapa = normalizarStatusPagamento(bruto)
      valor = extrairValorNumerico(VALOR_TOTAL)
      if (etapa === "PAGO") totalPago += valor
      else                  totalPrevisto += valor
      devolve { totalPrevisto, totalPago, itens[] }
  → renderPagamentos(itens)                        L1419
      tracker de 3 etapas: ETAPA_ORDEM = ['PENDENTE','APROVADO','PAGO']
```

`normalizarStatusPagamento()` (`WebApp.js:765`) — 3 linhas, ordem importa:

| Célula (bruto, lowercase) | Portal |
|---|---|
| contém `pago` | `PAGO` (terminal, testado 1º) |
| contém `aprovado` | `APROVADO` |
| qualquer outro | `PENDENTE` |

---

## 2. Entidades e Regras de Negócio

### Entidade: **Pagamento**

**Não tem identidade estável.** Ao contrário de `Ativação` (que ganhou coluna `ID` em 2026-07-08), `PAGAMENTOS` é resolvido por número de linha.

`getPagamentos()` (`WebApp.js:423`) emite `idPagamento: i + 1` — literalmente o índice do array. `setupERP()` (`Código.js:1019-1020`) documenta a escolha: *"PAGAMENTOS/HISTORICO_PAG ganharam só ANO_REFERENCIA (mesmo motivo, sem ID — pagamentos não são resolvidos por ID estável neste momento)."*

Isso é seguro **hoje**, porque `idPagamento` só trafega para exibição — nenhuma função escreve em `PAGAMENTOS` a partir dele. É uma bomba armada, não detonada. Ver FIN-05.

| Coluna | Escrita por | Lida por |
|---|---|---|
| `INFLU_KEY` | (A), (B), (C) | `getPagamentos`, `extrairPagamentos` |
| `MES_REFERENCIA` | (A), (B), (C) | `getPagamentos`, `listarPeriodos` |
| `ANO_REFERENCIA` | (A), (B) — **não (C)** | `getPagamentos`, `listarPeriodos` |
| `VALOR_TOTAL` | (A), (B), (C) | `getPagamentos`, `gerarSolicitacaoPagamento` |
| `CHAVE_PIX` | (A), (B), (C) | `gerarSolicitacaoPagamento` |
| `STATUS_PAGAMENTO` | (A), (B), (C) — sempre `'em aberto'` | `getPagamentos`, `onEdit`, `arquivarGenerico` |
| `DATA_PAGAMENTO` | `arquivarGenerico` (carimbo) | `getPagamentos` |
| `MENSAGEM_PIX` | `gerarSolicitacaoPagamento` | ninguém |

### Regras que o código de fato executa

1. **RN-25** — Todo pagamento nasce `'em aberto'`. As três portas concordam.
2. **RN-26** — `VALOR_TOTAL` vem de `BASE DE DADOS` — é o **cachê fixo mensal da parceira**, não uma função do trabalho entregue. `gerarNovoMesCompleto()` copia `inf.valor` (`Código.js:110, 137`).
3. **RN-27** — Transição de status é **100% humana**. Nenhum código promove um pagamento.
4. **RN-28** — Ao arquivar, se `DATA_PAGAMENTO` estiver vazia, é carimbada com o instante do arquivamento (`Código.js:799-801`). Data de arquivamento ≠ data do PIX.
5. **RN-29** — `totalPrevisto` acumula tudo que **não** é `PAGO` — incluindo `APROVADO`. (`WebApp.js:416-420`)
6. **RN-30** — Todo pagamento no histórico é exibido como `PAGO`, incondicionalmente. (`WebApp.js:501`)

---

## 3. Aderência às Invariantes

### ✅ Respeitadas

- **Vocabulário sincronizado front↔back.** `CLAUDE.md` §3 exige que `normalizarStatusPagamento()` e `ETAPA_ORDEM`/`ETAPA_LABELS` usem o mesmo vocabulário. Confirmado: `WebApp.js:769-771` produz `PAGO|APROVADO|PENDENTE`; `Index.html:875-880` declara exatamente esses três. Nada mais e nada menos.
- **Ordem de teste em `normalizarStatusPagamento()`.** `pago` antes de `aprovado` — evita que `"pago"` caia em `PENDENTE`. Sem a armadilha de substring que assombrava `normalizarStatusAtivacao()`.
- **Resolução por nome.** `getHeaderMap()` em todas as portas. `montarLinha()` em (A) e (B).
- **`extrairValorNumerico()`** (`WebApp.js:782`) trata `number`, `""`, `null` e string BRL (`"R$ 1.500,00"` → `1500.00`), com `isNaN` guard. É pura e correta.
- **Sem lock em leitura.** `getPagamentos()` (L394) documenta a escolha, alinhada a `getPendencias`/`getPerfil`.
- **`.tracker{align-items:flex-start}`** — `CLAUDE.md` §3 marca como zona proibida (causa raiz de bug de alinhamento já corrigido). Não toquei.

### ❌ Violações e divergências

#### FIN-01 · 🔴 **`salvarPagamentoExtra()` não grava `ANO_REFERENCIA` — o pagamento extra some do Portal**

`SidebarBackend.js:110-114`:

```js
set('INFLU_KEY',        obj.influ);
set('MES_REFERENCIA',   obj.mes);
set('VALOR_TOTAL',      obj.valor);
set('CHAVE_PIX',        obj.pix);
set('STATUS_PAGAMENTO', 'em aberto');
```

Não há `set('ANO_REFERENCIA', ...)`. A célula fica **vazia**.

Agora siga o dado até o Portal. `listarPeriodos()` (`WebApp.js:678-680`):

```js
const ano = h['ANO_REFERENCIA'] ? (parseInt(dados[i][h['ANO_REFERENCIA'] - 1], 10) || null) : null;
const chave = mes + "|" + (ano || "");
if (!periodos[chave]) periodos[chave] = { mes: mes, ano: ano };
```

O pagamento extra de `AGOSTO` gera a chave `"AGOSTO|"` → `{mes:"AGOSTO", ano:null}`.
Os pagamentos normais de agosto geram `"AGOSTO|2026"` → `{mes:"AGOSTO", ano:2026}`.

**São dois períodos distintos na lista.** O seletor de mês do Portal (`Index.html:1146` `atualizarLabelMes`) exibe:

```
agosto        ← período com ano null
agosto/2026   ← período com ano 2026
```

E quando a parceira seleciona o período `{mes:"AGOSTO", ano:null}`, `carregarPagamentos()` chama `getPagamentos(token, "AGOSTO", null)`. Em `getPagamentos()` (`WebApp.js:401, 411`):

```js
const anoFiltro = ano ? parseInt(ano, 10) : null;
if (rowInfluKey === influKey && (!mesFiltro || rowMes === mesFiltro) && (!anoFiltro || rowAno === anoFiltro)) {
```

`anoFiltro` é `null` → `!anoFiltro` é `true` → o filtro de ano é **desligado**. A parceira vê **todos os agostos de todos os anos somados**, com `totalPrevisto` inflado.

E ao selecionar `agosto/2026`, `anoFiltro = 2026`, e o pagamento extra (com `rowAno = null`) **não aparece**.

Resumo do defeito: um pagamento extra lançado pela sidebar cria um período fantasma no Portal, some do período correto, e o período fantasma soma valores de anos diferentes.

`salvarPagamentoExtra()` **não tem teste** (nenhum teste carrega `SidebarBackend.js` — confirmado no Passo 3). Não confirmei em produção; o caminho no código é inequívoco.

**Correção trivial:** `set('ANO_REFERENCIA', obj.ano)` — exige que a sidebar envie o ano. Alternativa sem mexer na UI: derivar do ano corrente, no mesmo padrão de `parseMesAno()` (`Código.js:989`). Muda comportamento observável (§12.4.1) — mas o comportamento atual é o defeito.

#### FIN-02 · 🟠 **`getHistorico()` afirma `etapa: "PAGO"` para tudo, sem ler o status**

`WebApp.js:497-504` (`extrairPagamentos`):

```js
pagamentos.push({
  idPagamento: "H" + (i + 1),
  ...
  etapa: "PAGO",              // ← literal
  dataPagamento: h['DATA_PAGAMENTO'] ? formatarData(...) : ""
});
```

Para `HISTÓRICO DE PAGAMENTOS` a premissa se sustenta: `arquivarGenerico()` (`Código.js:754`) só move linhas cujo `STATUS_PAGAMENTO` contenha `pago`. Invariante mantida pelo produtor.

**Mas a mesma função é aplicada às abas legado.** `getHistorico()` (`WebApp.js:511-514`):

```js
abasLegado.forEach(function (a) {
  if (a.tipo === 'CONTEUDO') extrairAtivacoes(a.dados, a.h);
  else extrairPagamentos(a.dados, a.h);
});
```

As abas legado são descobertas por assinatura de cabeçalho (`detectarAbasHistoricoLegado`, `WebApp.js:71`), **não** por garantia de conteúdo. Uma aba antiga com `STATUS_PAGAMENTO = 'em aberto'` — plausível, são abas pré-consolidação — é exibida à parceira como **PAGO**.

Simétrico exato em `extrairAtivacoes()` (`WebApp.js:483`): `status: "PUBLICADO"`, literal.

Isto é uma afirmação financeira falsa exibida à parceira. Não há escrita, não há perda de dado, mas há informação incorreta sobre dinheiro. Marco 🟠 e não 🔴 porque depende do conteúdo real das abas legado, que não inspecionei (não tenho acesso à planilha).

#### FIN-03 · 🟠 **`getPagamentos()` não verifica `influKey` nulo — falha aberta em vez de fechada**

Compare os dois irmãos:

```js
// getPendencias — WebApp.js:248-250
const influKey = getInfluKeyByCupomCached(ss, cupom);
if (!influKey) return { ok: false, erro: "USUARIO_NAO_ENCONTRADO" };

// getPagamentos — WebApp.js:395-396
const influKey = getInfluKeyByCupomCached(ss, cupom);
if (!abaPagamentos) return { ok: true, totalPrevisto: 0, totalPago: 0, itens: [] };
//  ↑ nenhuma checagem de influKey
```

`listarPeriodos()` (L655) checa. `getPendencias()` (L249) checa. `getPagamentos()`, `getBriefing()` (L299) e `getHistorico()` (L455) **não checam**.

Consequência: se `INFLU_KEY` estiver vazia na `BASE DE DADOS`, `influKey` é `null`. A comparação `rowInfluKey === influKey` compara `""` (string, vinda de `(x || "").toString()`) com `null` — nunca casa. A parceira recebe `{ok:true, totalPrevisto:0, totalPago:0, itens:[]}`.

**Ela vê R$ 0,00 e uma lista vazia, sem nenhum erro.** É a diferença entre "não há pagamentos" e "não consegui identificar você". O sistema escolhe a mensagem errada.

Não é vazamento (`null !== ""` impede o match universal), mas é falha silenciosa em tela de dinheiro.

#### FIN-04 · 🟡 **`onEdit()` bloco `PAGAMENTOS` arquiva em massa, sem lock, dentro de trigger simples**

`Código.js:298-300`:

```js
if (name === SETUP.ABAS.PAGAMENTOS && col === h['STATUS_PAGAMENTO'] && String(e.value).toLowerCase().includes("pago")) {
  arquivarGenerico(SETUP.ABAS.PAGAMENTOS, SETUP.ABAS.HISTORICO_PAG, 'STATUS_PAGAMENTO', ['pago'], true);
}
```

Idêntico em natureza a INV-09 (`03_execucao_operacional.md`): marcar **um** pagamento como pago dispara o arquivamento de **todos** os pagos pendentes de arquivamento, com `appendRow()` + `deleteRow()` linha a linha, sem lock, dentro de um trigger com teto de 30 s.

Agravante próprio deste contexto: `arquivarGenerico()` **carimba `DATA_PAGAMENTO`** (`Código.js:799-801`) quando vazia. Numa execução parcial (timeout no meio), linhas já movidas carregam um carimbo; as remanescentes, não. E `arquivarGenerico()` chamado concorrentemente por `onEdit` e `menuArquivarTudo()` (`Código.js:754`) pode duplicar linhas no histórico — o `appendRow` precede o `deleteRow`.

Uma linha duplicada em `HISTÓRICO DE PAGAMENTOS` é **contabilizada duas vezes** por `extrairPagamentos()`. Não há deduplicação por `idPagamento` (que, aliás, é `"H" + (i+1)` — o índice da linha, colidente entre abas).

#### FIN-05 · 🟡 **`idPagamento` é o número da linha — o mesmo bug que `ATIVAÇÕES` já corrigiu**

`WebApp.js:423`: `idPagamento: i + 1`.
`WebApp.js:498`: `idPagamento: "H" + (i + 1)`.

`CLAUDE.md` §3 documenta que a resolução por número de linha em `ATIVAÇÕES` *"existia uma corrida real"*, resolvida com a coluna `ID` (UUID) e `encontrarLinhaAtivacaoPorId()`. `PAGAMENTOS` ficou de fora, deliberadamente (`Código.js:1019-1020`).

Hoje é inofensivo: `idPagamento` só é exibido; nada escreve por ele. Mas o dia em que o Portal ganhar "confirmar recebimento" ou "contestar valor", a corrida volta — e desta vez sobre dinheiro. Registro como dívida arquitetural conhecida, não como bug.

Colisão adicional já presente: `"H" + (i+1)` é gerado independentemente por aba. `HISTÓRICO DE PAGAMENTOS` linha 2 e uma aba legado linha 2 produzem ambos `"H2"`. Como o front (`Index.html:1495`) não usa `idPagamento` como chave de DOM, não quebra. Por sorte.

#### FIN-06 · 🟡 **`lancarPagamentosDoMes()` não previne duplicata**

`Código.js:358-391`. Roda pelo menu, injeta uma linha por influenciadora `ON` para o mês informado. **Não verifica se já existem pagamentos daquele mês/ano.**

Executar duas vezes com `"AGOSTO 2026"` cria duas linhas de R$ 1.500 por parceira. O `ui.alert` final (L389) reporta `"N pagamentos avulsos lançados"` nas duas vezes.

Idem `gerarNovoMesCompleto()`, que além disso não valida se o mês já foi gerado — mas ali o `ui.prompt` avisa que *"O Briefing atual será limpo"*, e `BRIEFING` é sobrescrito. `PAGAMENTOS` e `ATIVAÇÕES` são **append**. Rodar "Iniciar Novo Mês" duas vezes para o mesmo mês **duplica ativações e pagamentos**, e zera o briefing.

Não há guarda em lugar nenhum. O único freio é a atenção do operador.

---

## 4. Lixo Técnico e Riscos

| # | Item | Local | Natureza |
|---|---|---|---|
| L-30 | `dataPrevista: ""` — hardcoded nas duas fontes | `WebApp.js:427, 502` | Campo fantasma. `renderPagamentos()` (`Index.html`) nem o lê. |
| L-31 | `lancarPagamentosDoMes()` é ~80% cópia do recorte de pagamentos de `gerarNovoMesCompleto()` | `Código.js:358-391` vs `135-138` | Duplicação real. Mesmo filtro `r[0]`, mesmo `montarLinha`, mesmos 6 campos. |
| L-32 | `MENSAGEM_PIX` escrita, nunca lida, replicada no histórico com a chave PIX | `Código.js:407` | Ver `04_comunicacao_operacional.md`, COM-04 |
| L-33 | `salvarPagamentoExtra()` não valida `obj.valor` nem `obj.influ` | `SidebarBackend.js:102-118` | `appendRow` aceita qualquer coisa, inclusive vazio |
| L-34 | `SpreadsheetApp.flush()` ao fim de `salvarPagamentoExtra` | `SidebarBackend.js:117` | Desnecessário após `appendRow` (síncrono). Custo de latência na sidebar. |
| L-35 | `getPagamentos()` recalcula `totalPrevisto`/`totalPago` no servidor **e** o front recalcula nada | `WebApp.js:403-404` | Correto — mas os totais **ignoram** os pagamentos já arquivados. O "total pago" do mês é sempre R$ 0,00 depois do arquivamento. |

**L-35 merece destaque.** Quando um pagamento é marcado `pago`, `onEdit` o move imediatamente para `HISTÓRICO DE PAGAMENTOS`. `getPagamentos()` lê **apenas** a aba `PAGAMENTOS`. Logo, `totalPago` (`WebApp.js:417`) é quase sempre `0` — a única janela em que não é zero é entre a marcação e o flush do arquivamento.

A tela de pagamentos do Portal exibe "Total pago: R$ 0,00" permanentemente, e o histórico exibe os pagos numa aba separada. Não é bug de código; é a consequência de arquivar agressivamente. Vale a pergunta ao usuário: **isso é o comportamento desejado?**

### Acoplamentos nocivos

- **`listarPeriodos()` (`WebApp.js:648`) varre `PAGAMENTOS` + `HISTORICO_PAG` + `ATIVAÇÕES` + `HISTORICO_CONT` + N abas legado.** Três contextos, uma função. É chamada por `carregarPagamentos()` (`Index.html:1398`) só para saber quais meses existem. Depois `getPagamentos()` relê `PAGAMENTOS` inteira. **Duas leituras completas por navegação.**
- **As funções temporais do front vivem na seção `PENDÊNCIAS`.** `carregarPeriodos`, `mudarMes`, `periodoAtual`, `atualizarLabelMes` (`Index.html:1122-1160`) são `[Core]` compartilhado por Pendências, Pagamentos e Histórico. `mudarMes()` (L1137-1139) tem um `if` para cada uma das três telas — o `[Core]` conhece os três consumidores. Inversão de dependência.
- **`getHistorico()` é `[Contaminado]`**: `extrairAtivacoes` (Execução) e `extrairPagamentos` (Financeiro) na mesma função. Já pré-fatiado em duas funções aninhadas — extração quase mecânica.
- **`salvarPagamentoExtra()` mora em `SidebarBackend.js`**, junto com quatro funções de Gestão de Parceiros. `[Legado Compartilhado]` clássico: dois contextos, zero funções misturadas.

---

## 5. Recomendações de Migração (V2)

### 5.1 Serviços puros a extrair

```
PagamentoRepository                     ← isola PAGAMENTOS (diretriz CLAUDE.md §12.3)
  listarPorParceiraEPeriodo(influKey, mes, ano)
  criarLote(parceiras, mes, ano)        ← unifica (A) e (B), mata L-31
  criarExtra(influKey, mes, ano, valor, pix)   ← mata FIN-01 por construção
  existeParaPeriodo(mes, ano)           ← habilita a guarda de FIN-06

StatusPagamentoService                  ← PURO. Já é (WebApp.js:765)
  normalizar(bruto) → PAGO|APROVADO|PENDENTE
  ETAPAS = ['PENDENTE','APROVADO','PAGO']    ← fonte única; Index.html importa daqui

ValorService                            ← PURO. Já é (WebApp.js:782)
  extrairNumerico(valorStr)
  formatarBRL(numero)

PeriodoService                          ← extrai listarPeriodos do limbo (ver §5.3)
```

`normalizarStatusPagamento()` e `extrairValorNumerico()` **já são puras e já têm teste** (`test/codigo-webapp-puras.test.js`, `test/webapp-pagamentos.test.js`). Mover é recortar e colar. **Comece por elas.**

`StatusPagamentoService.ETAPAS` resolve o acoplamento que `CLAUDE.md` §3 marca como perigoso: hoje `ETAPA_ORDEM` (`Index.html:875`) e `normalizarStatusPagamento()` (`WebApp.js:765`) precisam ser mantidos em sincronia manualmente, em arquivos diferentes. Com o Apps Script servindo `Index.html` via `HtmlService.createTemplateFromFile` (`WebApp.js:140`), há como injetar a lista do servidor — mas isso muda o contrato de renderização. Avaliar com cuidado.

### 5.2 Tratamento das funções contaminadas

**`gerarNovoMesCompleto()` — recorte de Pagamentos (`Código.js:135-138`, `158`).**
Vira `PagamentoRepository.criarLote(parceirasAtivas, mes, ano)`. Na mesma extração, `lancarPagamentosDoMes()` (`Código.js:358`) passa a chamar **exatamente a mesma função** — L-31 desaparece, e as duas portas de entrada convergem.

Aproveitar para adicionar a guarda de FIN-06 (`existeParaPeriodo`) — **mas isso muda comportamento** (§12.4.1): hoje rodar duas vezes duplica; depois, bloqueia. Precisa de PR próprio e confirmação do usuário. Provavelmente com `ui.alert` de confirmação, no padrão de `limparHistoricoOficial()`.

**`onEdit()` — bloco `PAGAMENTOS` (`Código.js:298-300`).**
Três linhas. É a fatia mais fácil de todo o `onEdit`. Vira:

```js
if (name === ABAS.PAGAMENTOS) return PagamentoEventHandler.aoEditar(ctx);
```

⚠️ O handler chama `ArquivamentoService`. Trigger simples não tem `UrlFetchApp`/`DriveApp` — `arquivarGenerico()` só usa `SpreadsheetApp`, então é seguro. Confirmar que continua sendo, após a extração.

**`getHistorico()` (`WebApp.js:445-522`) — `extrairPagamentos` (L490-507).**
Vira `PagamentoRepository.mapearLinhaHistorico(linha, h)`. E aqui **decidir FIN-02**: manter `etapa: "PAGO"` literal (preserva comportamento) ou passar a ler `STATUS_PAGAMENTO` real (corrige, muda comportamento). Levar ao usuário.

**`salvarPagamentoExtra()` (`SidebarBackend.js:102-118`).**
Corta para `PagamentoSidebarBackend.js` sem alterar uma linha. Cobrir com teste **antes** — hoje não tem nenhum, e FIN-01 vive aqui.

### 5.3 `listarPeriodos()` — o órfão

`listarPeriodos()` (`WebApp.js:648-696`) não pertence a nenhum dos seis contextos. É uma **projeção de leitura** sobre quatro abas de três contextos, existente só para popular um seletor de UI.

Na V2, é um `PeriodoService` que **pergunta a cada repositório** quais períodos ele conhece:

```js
PeriodoService.listarDisponiveis(influKey) {
  return uniao(
    AtivacaoRepository.periodosDisponiveis(influKey),
    PagamentoRepository.periodosDisponiveis(influKey),
    HistoricoRepository.periodosDisponiveis(influKey)
  ).ordenarDecrescente();
}
```

Cada repositório sabe ler a própria aba. Nenhum contexto conhece o outro. E o `PeriodoService` fica com a única regra que hoje vive solta em `ORDEM_MESES` (`WebApp.js:42-46`).

### 5.4 Correções que **não são** refatoração

| Achado | Mudança | Impacto observável |
|---|---|---|
| FIN-01 | `set('ANO_REFERENCIA', ...)` em `salvarPagamentoExtra` | Período fantasma some do seletor. Pagamentos extras passam a aparecer no mês correto. **É uma correção de dado, não só de código** — linhas já gravadas continuam com ano vazio e precisam de backfill, no padrão de `backfillIdAnoAba_()` (`Código.js:710`). |
| FIN-03 | `if (!influKey) return { ok:false, erro:"USUARIO_NAO_ENCONTRADO" }` | Front passa a receber um erro onde antes via lista vazia |
| FIN-02 | Ler `STATUS_PAGAMENTO` real no histórico | Itens legado podem deixar de aparecer como PAGO |
| FIN-06 | Guarda de duplicata | Menu passa a recusar segunda execução |

**Recomendação de ordem:** FIN-01 primeiro, com o backfill junto, num PR só. É o único achado deste documento que já está produzindo dado errado na tela da parceira **agora**, toda vez que a equipe usa a sidebar de pagamento extra.

### 5.5 Cobertura de teste existente

| Área | Teste |
|---|---|
| `getPagamentos`, totais, tracker | `test/webapp-pagamentos.test.js` |
| `normalizarStatusPagamento`, `extrairValorNumerico` | `test/codigo-webapp-puras.test.js` |
| `onEdit` bloco pagamentos | parcialmente em `test/codigo-onedit-aprovacao.test.js` |
| `renderPagamentos` (front) | `test/index-front-puras.test.js` |

**Sem cobertura:** `salvarPagamentoExtra()` (onde vive FIN-01), `lancarPagamentosDoMes()` (FIN-06), `arquivarGenerico()` (FIN-04). As três áreas com os achados mais graves são exatamente as três sem rede de segurança. Isso não é coincidência.

---

## Resumo executivo

| Achado | Severidade | Ação |
|---|---|---|
| FIN-01 · `salvarPagamentoExtra()` omite `ANO_REFERENCIA` → período fantasma no Portal, soma entre anos, pagamento some do mês certo | 🔴 Crítico | PR + backfill. **Está produzindo dado errado hoje.** |
| FIN-02 · Histórico afirma `PAGO` sem ler o status — inclusive para abas legado | 🟠 Alto | Decisão do usuário |
| FIN-03 · `getPagamentos()` não checa `influKey` nulo — mostra R$ 0,00 em vez de erro | 🟠 Alto | Alinhar a `getPendencias` |
| FIN-04 · Arquivamento em massa sem lock dentro de `onEdit`; carimba `DATA_PAGAMENTO` | 🟡 Médio | `ArquivamentoService` + teste |
| FIN-05 · `idPagamento` = número da linha (bug já corrigido em `ATIVAÇÕES`) | 🟡 Médio | Dívida conhecida. Bloqueia qualquer escrita futura pelo Portal. |
| FIN-06 · `lancarPagamentosDoMes()` e `gerarNovoMesCompleto()` duplicam se rodados duas vezes | 🟡 Médio | Guarda + confirmação |
| L-35 · `totalPago` é quase sempre R$ 0,00 (arquivamento imediato esvazia a aba) | ℹ️ Pergunta | Confirmar com o usuário se é o desejado |
