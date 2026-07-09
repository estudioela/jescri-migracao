# FLOW.md — Fluxos executáveis (fonte primária para agentes)

> Consultar este arquivo ANTES de qualquer edição, conforme `CLAUDE.md` seção 9 (EXECUTION PROTOCOL). Formato fixo por fluxo: ENTRADA → PROCESSAMENTO → SAÍDA, com arquivo + função + origem dos dados + destino. Se um fluxo pedido não estiver aqui, ver protocolo de exceção na seção 9 do `CLAUDE.md` antes de explorar.

---

## FLOW: Login

- **ENTRADA**: usuário submete CNPJ/senha na tela do Portal.
  arquivo: `mae/Index.html` · função: `fazerLogin()` (~L1068)
- **PROCESSAMENTO**: front-end despacha via `chamar('login', ...)` (~L921) → backend valida credencial e tentativas.
  arquivo: `mae/WebApp.js` · função: `login()` (~L153)
  origem dos dados: aba `BASE DE DADOS`
- **SAÍDA**: token de sessão ou `{ok:false, erro:"CODIGO"}`.
  destino: front-end (`fazerLogin()` faz `switch` por código de erro).

---

## FLOW: Sessão (validação / logout)

- **ENTRADA**: chamada autenticada qualquer (token existente) ou ação de sair.
  arquivo: `mae/Index.html` · função: `sairDoApp()` — **desde 2026-07-09 é `async` e AGUARDA** `logout(token)` antes de limpar o storage. Antes era fire-and-forget: se a chamada falhasse, o token continuava válido no servidor por até 6h e o cliente já o esquecera, então ninguém mais podia revogá-lo. A sessão local é encerrada mesmo se o servidor falhar, mas a parceira é avisada por toast.
- **PROCESSAMENTO**: valida token vigente ou encerra sessão.
  arquivo: `mae/WebApp.js` · funções: `validarToken()` (~L210), `logout()` (~L223)
  origem dos dados: token em `CacheService` do servidor (duração 21600s/6h, hardcoded em `login()` e `validarToken()`, com renovação deslizante)
- **PERSISTÊNCIA NO CLIENTE** (2026-07-09): a sessão é gravada em **`sessionStorage`** (antes: `localStorage`) por `persistirSessao()`, e relida por `tentarRestaurarSessao()`. `sessionStorage` morre com a aba; `localStorage` sobrevivia ao reboot. `purgarSessaoLegadaEmLocalStorage()` apaga, na primeira carga após o deploy, os tokens antigos que ficaram em `localStorage`.
  Motivo: o token é um bearer puro (`validarToken()` só faz `cache.get(token)`; sem binding de IP/User-Agent/nonce). Combinado com o XSS armazenado que existia em `renderPendencias()` (ver FLOW: Dashboard / Pendências), permitia sequestro de sessão. Ver `docs/auditoria/01_gestao_parceiros.md` V-01.
- **SAÍDA**: sessão válida/inválida; encerramento de sessão.
  destino: front-end (`mae/Index.html`).

---

## FLOW: Dashboard / Pendências

- **ENTRADA**: abertura do dashboard ou seleção de período pela influenciadora.
  arquivo: `mae/Index.html` · funções: `carregarPendencias()` (~L1153), `carregarPeriodos()` (~L1113)
- **PROCESSAMENTO**: busca ativações pendentes e lista de períodos disponíveis.
  arquivo: `mae/WebApp.js` · funções: `getPendencias()` (~L234), `listarPeriodos()` (~L653)
  origem dos dados: aba `ATIVAÇÕES`
- **SANITIZAÇÃO DO `idAtivacao`** (2026-07-09, `mae/WebApp.js:idAtivacaoSeguro()`): a coluna `ID` de `ATIVAÇÕES` é uma célula de planilha, editável por qualquer pessoa com escrita no ERP (`backfillIdAnoAba_()` só preenche células **vazias**). `getPendencias()` só emite ids que casem com `/^[A-Za-z0-9_-]{1,64}$/`; qualquer outro cai no fallback `ROWn` e é registrado no `Logger`. `encontrarLinhaAtivacaoPorId()` passou a rejeitar id vazio (antes, `"" === ""` casava com a primeira linha de `ID` vazio da aba).
- **RENDERIZAÇÃO SEM `onclick` INLINE** (2026-07-09, `mae/Index.html:renderPendencias()`): os botões "Ver briefing"/"Enviar material" são criados via `document.createElement` e recebem o id num `data-id` (`setAttribute`), lido por **um único listener delegado** em `#pend-lista` (`garantirListenerPendencias()`).
  Motivo: o id era interpolado dentro de `onclick="abrirBriefing('<id>')"` — contexto **JavaScript aninhado em HTML**. O parser HTML decodifica entidades no valor do atributo **antes** de o JS parsear a string, então escapar com `escaparHtml()` ali não resolveria (e `escaparHtml()` sequer escapa aspas: só `& < >`). Ver `docs/auditoria/03_execucao_operacional.md` INV-06.
  Regra derivada: **nenhum dado de planilha entra em atributo de evento inline.** `formato`, `status` e as datas passam por `escaparHtml()` antes de entrar em `innerHTML` — `formatarData()` do servidor devolve `data.toString()` para qualquer valor que não seja um `Date`, ou seja, o conteúdo bruto da célula.
- **SAÍDA**: lista de pendências/períodos renderizada no dashboard.
  destino: front-end (`mae/Index.html`).

---

## FLOW: Briefing

- **ENTRADA**: influenciadora abre o briefing do mês.
  arquivo: `mae/Index.html` · função: `abrirBriefing()` (~L1222)
- **PROCESSAMENTO**: monta resumo cruzando ativação com dados de briefing, casando registros de `BRIEFING` por `INFLU_KEY`+`MES`+`ANO_REFERENCIA` (corrigido em 2026-07-07 — antes só `INFLU_KEY`+`MES`, causava colisão entre campanhas do mesmo mês em anos diferentes; linhas de `BRIEFING` com `ANO_REFERENCIA` vazia/ausente continuam casando com qualquer ano, compatibilidade legado), com fallback de nome de coluna para o campo `RESUMO`. Mesmo casamento se aplica à propagação de `DATA_APROVACAO` em `mae/Código.js:onEdit()` (bloco `ATIVAÇÕES`). Coluna `ANO_REFERENCIA` em `BRIEFING` foi criada na planilha viva via `mae/Código.js:garantirColunaAnoReferenciaBriefing()` (ação manual de menu, executada pelo usuário em 2026-07-07) — linhas antigas sem valor preenchido continuam no comportamento legado (qualquer ano).
  arquivo: `mae/WebApp.js` · função: `getBriefing()` (~L289)
  origem dos dados: abas `ATIVAÇÕES` + `BRIEFING`
- **SAÍDA**: dados de resumo do briefing.
  destino: componente visual `.briefing-resumo` em `mae/Index.html`.

---

## FLOW: Envio de material

- **ENTRADA**: influenciadora seleciona e envia arquivo.
  arquivo: `mae/Index.html` · funções: `arquivoSelecionado`, `iniciarEnvio`, `enviarArquivoResumable()` (~L1334, controla `CHUNK_SIZE`)
- **PROCESSAMENTO**: abre e finaliza upload resumable; resolve a linha da ativação por ID estável (não por número de linha).
  arquivo: `mae/WebApp.js` · funções: `iniciarEnvioResumable()` (~L822), `finalizarEnvioResumable()` (~L862), `encontrarLinhaAtivacaoPorId()` (~L636)
  origem dos dados: aba `ATIVAÇÕES` (localização da linha) + arquivo enviado pelo front-end
- **SAÍDA**: arquivo salvo na pasta da influenciadora no Drive; status atualizado na planilha.
  destino: Google Drive (pasta por influenciadora via `PropertiesService`) + aba `ATIVAÇÕES`.

---

## FLOW: Pagamentos

- **ENTRADA**: influenciadora abre a tela de pagamentos.
  arquivo: `mae/Index.html` · função: `carregarPagamentos()` (~L1383)
  origem dos dados: nenhuma (ação do usuário, dispara a chamada ao backend).

- **PROCESSAMENTO**: backend lê a aba de pagamentos e normaliza o status de cada registro para o vocabulário fixo do tracker.
  arquivo: `mae/WebApp.js` · funções: `getPagamentos()` (~L376), `normalizarStatusPagamento()` (~L726)
  origem dos dados: aba `PAGAMENTOS`
  regra de normalização: reconhece substrings `"pago"` e `"aprovado"` no valor bruto da planilha, mapeando para `PENDENTE`/`APROVADO`/`PAGO`.
  restrição: o vocabulário de status usado aqui tem que casar exatamente com `ETAPA_ORDEM`/`ETAPA_LABELS` em `mae/Index.html` (~L860) — os dois lados (backend e front) precisam concordar, senão o tracker exibe etapa errada silenciosamente.

- **SAÍDA**: lista de pagamentos com status normalizado, renderizada como tracker visual.
  destino: componente tracker em `mae/Index.html` (`ETAPA_ORDEM`/`ETAPA_LABELS`, ~L860).
  restrição de layout: CSS `.tracker{align-items:flex-start}` — não trocar para `center` (causa raiz de bug de alinhamento já corrigido).

### FLOW: Pagamento extra / UGC (ERP, sidebar — terceira porta de entrada de `PAGAMENTOS`)

- **ENTRADA**: equipe abre a sidebar e lança um pagamento avulso.
  arquivo: `mae/SidebarPagamento.html` (campo `mes` é **texto livre**: "Mês ou Campanha") → `google.script.run.salvarPagamentoExtra(obj)`
- **PROCESSAMENTO**: `mae/SidebarBackend.js` · `salvarPagamentoExtra()`
  desde 2026-07-09 grava **`ANO_REFERENCIA`**, derivado por `parseMesAno()` (`mae/Código.js`) sobre o mesmo texto livre: `"AGOSTO 2026"` → `{AGOSTO, 2026}`; `"AGOSTO"` → ano corrente (RN-09, o mesmo contrato de `gerarNovoMesCompleto()`/`lancarPagamentosDoMes()`). `MES_REFERENCIA` passa a receber o mês **normalizado** — senão `"AGOSTO 2026"` viraria um mês literal que não casa com o `"AGOSTO"` das outras duas portas. `obj.ano` explícito tem precedência (a sidebar ainda não o envia).
- **SAÍDA**: uma linha nova em `PAGAMENTOS`, sempre com `STATUS_PAGAMENTO = 'em aberto'` (RN-25).

  **Por que isso importa (FIN-01, corrigido):** com `ANO_REFERENCIA` vazio, `listarPeriodos()` gerava a chave `"AGOSTO|"` → `{mes:'AGOSTO', ano:null}`, um período **distinto** de `"AGOSTO|2026"`. O seletor do Portal exibia `agosto` **e** `agosto/2026`. Ao selecionar o de ano `null`, `getPagamentos()` avalia `!anoFiltro` e **desliga o filtro de ano**, somando todos os agostos de todos os anos; e o pagamento extra sumia do período correto. Ver `docs/auditoria/05_operacao_financeira.md` FIN-01.

### FLOW: Backfill de `ANO_REFERENCIA` em pagamentos (ação manual, menu, idempotente)

- **ENTRADA**: menu ` ERP ELÃ 6.2 → Cadastros & Configurações → 11. Preencher ANO_REFERENCIA em Pagamentos`, com confirmação `ui.alert` YES/NO.
- **PROCESSAMENTO**: `mae/Código.js` · `backfillAnoReferenciaPagamentos()` → `garantirColunasNaAba_()` + `backfillAnoPagamentosAba_()` + `derivarAnoPagamento_()`
  Preenche **apenas células vazias**; nunca sobrescreve um ano já gravado.
  `derivarAnoPagamento_()` **não reusa** `derivarAnoDaLinha_()` (o helper das ativações), que prioriza `DATA_ARQUIVAMENTO` — para pagamento, essa é a data em que a linha foi movida, não o ano da campanha: um pagamento de dezembro arquivado em janeiro derivaria o ano seguinte. Aqui o **único sinal aceito é `DATA_PAGAMENTO`**.
  Sem esse sinal: aba **viva** (`PAGAMENTOS`, sem `DATA_ARQUIVAMENTO` no cabeçalho) → ano corrente; aba **histórica** (`HISTÓRICO DE PAGAMENTOS`) → **deixa vazio** e reporta a contagem. Não se chuta ano em registro financeiro passado (`CLAUDE.md` §12.4.6); vazio preserva o comportamento legado "casa com qualquer ano".
- **SAÍDA**: `ui.alert` com colunas criadas, linhas preenchidas por aba, e quantas linhas do histórico ficaram sem ano (essas ainda podem gerar um período sem ano no Portal, e precisam de preenchimento manual).

### Schema oficial da aba `PAGAMENTOS` (planilha `[JESCRI] INFLUÊNCIA 360º`)

| Coluna | Descrição |
|---|---|
| `INFLU_KEY` | identificador da influenciadora |
| `MES_REFERENCIA` | mês da campanha |
| `VALOR_TOTAL` | valor do pagamento |
| `CHAVE_PIX` | chave PIX da influenciadora |
| `STATUS_PAGAMENTO` | status do pagamento (`PENDENTE` \| `APROVADO` \| `PAGO`) |
| `DATA_PAGAMENTO` | data em que o pagamento foi efetivado |
| `MENSAGEM_PIX` | mensagem formatada para envio via PIX |

**Regras de negócio (fonte: usuário, 2026-07-05):**
- atualização de status ocorre **exclusivamente** em `STATUS_PAGAMENTO` — nenhuma outra coluna é tocada por essa operação.
- `DATA_PAGAMENTO` só é preenchida quando `STATUS_PAGAMENTO = PAGO` (efeito colateral condicional, não uma escrita independente).
- proibido criar novas colunas ou inferir campos fora deste schema.

### CORREÇÃO DE ARQUITETURA #1 (fonte: usuário, 2026-07-05)

**Não existe função isolada de escrita em `PAGAMENTOS`.** A suposição anterior (uma função dedicada recebendo `google.script.run` do front-end e gravando `STATUS_PAGAMENTO` diretamente) estava **errada** e foi removida deste documento.

### CORREÇÃO DE ARQUITETURA #2 (fonte: leitura literal do código, `SYSTEM_MAP.md`, 2026-07-05 — substitui uma correção anterior baseada em descrição do usuário que também estava errada)

O bloco anterior deste documento ("derivação `STATUS_CONTEUDO` → `STATUS_PAGAMENTO`, FECHADO") foi escrito a partir de uma descrição do usuário, sem confirmação por código. Uma auditoria completa de `mae/Código.js`+`mae/WebApp.js` (ver `SYSTEM_MAP.md`, seção "Achado crítico") mostrou que **essa função não existe**:

- `finalizarEnvioResumable()` (`mae/WebApp.js` ~L889) grava `STATUS_CONTEUDO` **sempre** como valor fixo — nunca `APROVADO` nem `POSTADO`, e não toca `PAGAMENTOS`. Valor gravado: `"ajustes"` desde 2026-07-06 (ver correção abaixo); a UI continua rotulando esse estado como "Em aprovação" (`normalizarStatusAtivacao()` mapeia `"ajustes"` → `EM_APROVACAO`).
- A transição de `STATUS_CONTEUDO` para `APROVADO`/`POSTADO` não é gravada por nenhuma função — só é **lida** (pelo `onEdit()` de `ATIVAÇÕES`, `mae/Código.js` ~L207, que arquiva quando o valor contém `"postado"`). É edição manual da equipe na aba `ATIVAÇÕES`, não automação.
- A única automação real que toca `PAGAMENTOS` é o `onEdit()` de `mae/Código.js` (~L269-270), que reage à edição direta de `STATUS_PAGAMENTO` (não de `STATUS_CONTEUDO`) — ver `FLOW: Pagamentos — STATUS_PAGAMENTO = PAGO` abaixo.

Modelo correto (substitui o anterior):
- **Não existe derivação automática `STATUS_CONTEUDO` → `STATUS_PAGAMENTO`.**
- `STATUS_CONTEUDO` (aba `ATIVAÇÕES`) e `STATUS_PAGAMENTO` (aba `PAGAMENTOS`) são camadas **independentes**, sem ponte de código entre elas.
- Toda transição de `STATUS_PAGAMENTO` (`PENDENTE`→`APROVADO`→`PAGO`) é edição manual da equipe direto na aba `PAGAMENTOS`, não consequência de `STATUS_CONTEUDO`.

### `STATUS_CONTEUDO` (aba `ATIVAÇÕES`, planilha `[JESCRI] INFLUÊNCIA 360º`)

Camada de conteúdo, independente de `STATUS_PAGAMENTO`. A célula tem **validação de dados** que só aceita 5 valores literais: `em aberto`, `falta drive`, `aprovado`, `ajustes`, `postado` (confirmado via erro real do Google Sheets, 2026-07-06 — ver `CAUSA RAIZ` abaixo). Valores em uso: `em aberto` (inicial, `gerarNovoMesCompleto()`), `ajustes` (automático, único valor gravado por código — `finalizarEnvioResumable()`, normalizado como `EM_APROVACAO`/"Em aprovação" na UI), `aprovado`/`postado` (edição manual da equipe, sem função que os grave). `falta drive` existe na validação mas não é usado por nenhuma função conhecida no momento.

#### CAUSA RAIZ COMPROVADA (2026-07-06) — bug de vocabulário entre código e validação da planilha

Antes desta correção, `finalizarEnvioResumable()` gravava o valor `"EM_APROVACAO"` (maiúsculo, com underscore) em `STATUS_CONTEUDO` — que **não está** na lista de valores aceitos pela validação de dados da célula. Toda chamada real de upload quebrava nessa gravação: o Google Sheets rejeita o `setValue()`, e como a validação é aplicada no flush diferido da planilha (não no momento síncrono do `setValue()`), o erro **escapa de qualquer try/catch no código** e chega ao cliente como uma página de erro genérica do Apps Script em vez do JSON `{ok:true/false}` esperado — manifestando no navegador como "Failed to fetch"/erro genérico, mascarando a causa real. Comprovado via teste real (login + upload completo, incluindo arquivo de fato gravado no Drive) com credencial de teste dedicada; o upload pro Drive funcionava perfeitamente, só a gravação de status na planilha falhava. Corrigido gravando `"ajustes"` (decisão do usuário, dentro dos 5 valores já validados — não foi adicionado nenhum valor novo à validação).

### FLOW: Envio de material → `STATUS_CONTEUDO` (sem derivação para `PAGAMENTOS`)

- **ENTRADA**: influenciadora envia material (mesmo gatilho do `FLOW: Envio de material`).
  arquivo: `mae/Index.html` (`arquivoSelecionado`/`iniciarEnvio`/`enviarArquivoResumable()` ~L1334) → `google.script.run`

- **PROCESSAMENTO**:
  1. `mae/WebApp.js:iniciarEnvioResumable()` (~L822) — abre a sessão de upload resumable; **não** grava `STATUS_CONTEUDO`.
  2. `mae/WebApp.js:finalizarEnvioResumable()` (~L862) — grava `LINK_ARQUIVO` e sempre define `STATUS_CONTEUDO = "ajustes"` (valor fixo, corrigido em 2026-07-06 — ver seção `CAUSA RAIZ` acima).
  3. Avanço para `APROVADO`/`POSTADO`: manual, edição direta da equipe em `ATIVAÇÕES` — nenhuma função de código faz essa transição.
  origem dos dados: aba `ATIVAÇÕES` (`STATUS_CONTEUDO`)

- **SAÍDA**: `ATIVAÇÕES.STATUS_CONTEUDO = "ajustes"` (normalizado como `EM_APROVACAO` na UI). **Sem efeito em `PAGAMENTOS`.**
  destino: aba `ATIVAÇÕES` apenas.

**Arquivos envolvidos**: `mae/Index.html`, `mae/WebApp.js`
**Funções envolvidas**: `iniciarEnvioResumable()` (~L822), `finalizarEnvioResumable()` (~L862)

Sub-fluxo fechado por leitura de código — sem pendências. **Correção**: transições de `STATUS_PAGAMENTO` (inclusive `PENDENTE`→`APROVADO`) não têm origem aqui; são manuais, ver sub-fluxo abaixo.

### FLOW: Pagamentos — `STATUS_PAGAMENTO = PAGO` (manual, fora do fluxo de conteúdo)

> Confirmado pelo usuário (2026-07-05): esta transição **não faz parte** do fluxo de conteúdo/campanha acima e não passa por `iniciarEnvioResumable()`/`finalizarEnvioResumable()`.

- **ENTRADA**: equipe marca manualmente `STATUS_PAGAMENTO = PAGO` diretamente na aba `PAGAMENTOS` da planilha `[JESCRI] INFLUÊNCIA 360º`. Não existe função automática/portal para essa marcação — é edição direta na planilha, fora do código.
  arquivo: n/a (ação manual na planilha, fora do repositório)

- **PROCESSAMENTO** (confirmado por leitura direta do código, exceção pontual ao FRAMEWORK LOCK MODE autorizada pelo usuário em 2026-07-05):
  1. `mae/Código.js`, trigger instalável `onEdit(e)` (~L170), bloco específico **~L269-270**:
     ```js
     if (name === SETUP.ABAS.PAGAMENTOS && col === h['STATUS_PAGAMENTO'] && String(e.value).toLowerCase().includes("pago")) {
       arquivarGenerico(SETUP.ABAS.PAGAMENTOS, SETUP.ABAS.HISTORICO_PAG, 'STATUS_PAGAMENTO', ['pago'], true);
     }
     ```
     Dispara automaticamente quando a célula editada é `STATUS_PAGAMENTO` na aba `PAGAMENTOS` e o novo valor contém `"pago"` (case-insensitive).
  2. `mae/Código.js`, função `arquivarGenerico()` (~L509-539). Trecho que preenche a data, **~L527-528**:
     ```js
     if(h['DATA_PAGAMENTO'] && !linha[h['DATA_PAGAMENTO']-1]) {
       linha[h['DATA_PAGAMENTO']-1] = Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy HH:mm");
     }
     ```
     Preenche `DATA_PAGAMENTO` com timestamp atual **somente se ainda estiver vazia**.
  arquivo: `mae/Código.js` · função: `onEdit()` (~L170, condição em L269-270) → `arquivarGenerico()` (~L509-539, preenchimento em L527-528)

- **⚠️ Achado adicional (comportamento real, além do descrito pelo usuário)**: `arquivarGenerico()` não apenas preenche `DATA_PAGAMENTO` — ela **move a linha inteira** de `PAGAMENTOS` para `HISTORICO_PAG` (`shD.appendRow(linha)` + `shO.deleteRow(i+1)`, mesma função, mesma execução). Ou seja, marcar `STATUS_PAGAMENTO = PAGO` dispara **arquivamento imediato da linha para o histórico**, não é um preenchimento isolado de campo dentro de `PAGAMENTOS`.

- **Segunda implementação encontrada (mesma função `arquivarGenerico()`, gatilho diferente — NÃO é a ativa para este comportamento)**: `menuArquivarTudo()` (~L492-494) chama `arquivarGenerico(SETUP.ABAS.PAGAMENTOS, SETUP.ABAS.HISTORICO_PAG, 'STATUS_PAGAMENTO', ['pago'], false)` — acionado manualmente via menu do ERP (arquivamento em lote de 3 abas), não por edição de célula. A implementação **ativa** para "automático ao marcar PAGO" é exclusivamente a chamada dentro de `onEdit()` (L269-270).

- **SAÍDA**: linha movida de `PAGAMENTOS` para `HISTORICO_PAG`, com `DATA_PAGAMENTO` preenchida (se ainda vazia) antes da movimentação.
  destino: aba `HISTORICO_PAG` (não permanece em `PAGAMENTOS`).

**Regra final consolidada deste sub-fluxo (FECHADO — confirmado por código, sem pendências):**
- `STATUS_PAGAMENTO = PAGO` → **manual** (ação da equipe, direto na planilha).
- `DATA_PAGAMENTO` → **automático**, via `onEdit()` (~L269-270, `mae/Código.js`) → `arquivarGenerico()` (~L527-528).
- Efeito colateral real, não previsto na descrição original: a linha é **arquivada imediatamente** em `HISTORICO_PAG`, saindo de `PAGAMENTOS`.

---

## FLOW: Histórico

- **ENTRADA**: influenciadora abre o histórico.
  arquivo: `mae/Index.html` · função: `carregarHistorico()` (~L1440)
- **PROCESSAMENTO**: agrega histórico de conteúdos/pagamentos e varre abas legado.
  arquivo: `mae/WebApp.js` · funções: `getHistorico()` (~L461), `listarAbasHistoricoLegado()` (~L128), `detectarAbasHistoricoLegado()` (~L91)
  origem dos dados: abas `HISTÓRICO DE CONTEÚDOS` + `HISTÓRICO DE PAGAMENTOS` + abas legado detectadas dinamicamente
  **critério de admissão de aba legado (corrigido em 2026-07-05 — falha de ingestão relatada pelo usuário)**: uma aba (não oficial, com dados) entra se (a) tem `INFLU_KEY` no cabeçalho **e** (b) o nome contém "HISTÓRICO" (normalizado, sem acento/case) **ou** o cabeçalho tem a assinatura completa `MES_REFERENCIA`+`STATUS_CONTEUDO`/`STATUS_PAGAMENTO`. Antes exigia sempre a assinatura completa, mesmo para abas já nomeadas "HISTÓRICO ..." — se uma aba dessas tivesse cabeçalho levemente diferente (coluna renomeada, sem `STATUS_CONTEUDO`/`STATUS_PAGAMENTO` literal), ficava invisível na UI sem erro nenhum. `INFLU_KEY` continua obrigatório nos dois casos (sem ele não dá pra atribuir a linha a uma influenciadora). Quando o nome bate mas não há `STATUS_CONTEUDO`/`STATUS_PAGAMENTO` no cabeçalho, o tipo (`CONTEUDO`/`PAGAMENTO`) é inferido pelo próprio nome da aba.
- **SAÍDA**: lista consolidada de histórico.
  destino: front-end (`mae/Index.html`).

---

## FLOW: Perfil

- **ENTRADA**: influenciadora abre ou edita o próprio perfil.
  arquivo: `mae/Index.html` · funções: `carregarPerfil()` (~L1500), `salvarPerfil()` (~L1526)
- **PROCESSAMENTO**: lê/atualiza dados cadastrais.
  arquivo: `mae/WebApp.js` · funções: `getPerfil()` (~L524), `updatePerfil()` (~L575)
  origem dos dados: aba `BASE DE DADOS`
- **SINCRONIA DO ENDEREÇO DERIVADO** (2026-07-09, corrige V-03/COM-03): `updatePerfil()` grava `CHAVE_PIX`, `EMAIL`, `CEP`, `NUMERO`, `COMPLEMENTO` e, desde esta correção, **recalcula** `RUA`, `BAIRRO`, `CIDADE`, `UF` e `INFLUENCIADORA_ENDERECO`.
  Antes não recalculava, e o `onEdit()` que deveria cobrir isso **nunca funcionou**: é trigger **simples**, não dispara para `setValue()` de outra execução e não tem autorização para `UrlFetchApp`. A parceira mudava o CEP, e `gerarMensagemRevisao()` confirmava no WhatsApp o endereço antigo — a mensagem que existe para prevenir erro de endereço confirmava o erro.
  Ordem obrigatória, **não inverter**:
  1. `normalizarCep()` + `resolverEnderecoPorCep()` — **FORA** do `LockService`. Resolver o CEP dentro do lock serializaria todos os salvamentos de perfil atrás da `brasilapi`.
  2. `LockService.waitLock(10000)` → escrita das células → `releaseLock()` em `finally`.
  Regras de falha: se o CEP mudou e a API não respondeu (rede, HTTP ≠ 200, corpo sem `city`), o perfil **é salvo assim mesmo** e os campos derivados ficam **intactos** — misturar CEP novo com rua antiga é pior que manter o registro anterior. Se só `NUMERO`/`COMPLEMENTO` mudaram, o endereço é recomposto a partir do logradouro já gravado, **sem chamada de rede**.
  arquivo: `mae/Código.js` · `EnderecoService`: `normalizarCep()`, `resolverEnderecoPorCep()` (única porta para `brasilapi.com.br`; nunca lança, nunca escreve), `montarEnderecoCompleto()` (pura). Usado também por `onFormSubmit()` e `preencherEnderecoPorCEP()` — a formatação do endereço estava duplicada nos dois.
- **SAÍDA**: dados de perfil exibidos ou confirmação de atualização.
  destino: aba `BASE DE DADOS` (na escrita) / front-end (na leitura).

---

## FLOW: Sincronização de looks (ERP, não é o Portal)

- **ENTRADA**: execução via menu do ERP (dentro da Planilha Google).
  arquivo: `mae/Código.js` · função: `sincronizarLooks()` (~L411)
- **PROCESSAMENTO**: abre planilha externa por influenciadora, usando URL própria de cada uma.
  arquivo: `mae/Código.js`
  origem dos dados: aba `BASE DE DADOS`, coluna `INFLU_SHEET_URL` → planilha externa individual
- **SAÍDA**: looks sincronizados de volta para a estrutura do ERP.
  destino: planilha Google (ERP).

---

## FLOW: Cadastro de nova influenciadora

- **ENTRADA**: preenchimento de formulário externo (Google Form, repositório `estudioela/estudioela`, fora deste repo).
  arquivo: n/a (fora deste repo)
- **PROCESSAMENTO**: submissão cai na aba `CADASTROS`, dispara trigger instalável de `onFormSubmit()`.
  arquivo: `mae/Código.js` · função: `onFormSubmit()` (~L544)
  origem dos dados: aba `CADASTROS`
  nota: depende de trigger instalável configurado fora do código-fonte (painel de Triggers do Apps Script) — não verificável por código.
  resolução de endereço (2026-07-09): usa o `EnderecoService` (`normalizarCep()` + `resolverEnderecoPorCep()` + `montarEnderecoCompleto()`), o mesmo de `updatePerfil()` e `preencherEnderecoPorCEP()` — antes a formatação do endereço estava escrita duas vezes. `onFormSubmit()` roda por trigger **instalável**, que **tem** autorização para `UrlFetchApp` — ao contrário do `onEdit()` simples (ver `FLOW: Perfil`, V-03). Falha na `brasilapi` não interrompe o cadastro: a linha é gravada sem os campos derivados, e o erro vai para o `Logger`.
- **SAÍDA**: novo registro de influenciadora (nasce `OFF` na coluna A, RN-01).
  destino: aba `BASE DE DADOS`.

---

## Validação de existência de arquivos (2026-07-05)

Confirmado via `ls`: `mae/Index.html`, `mae/WebApp.js`, `mae/Código.js` existem no repositório. Todos os fluxos acima apontam exclusivamente para esses três arquivos (mais destinos externos ao repo: Google Drive, planilha externa por influenciadora, Google Form). Nenhum caminho órfão encontrado.

---

## FLOW: Auditoria de Governança/Performance (meta-fluxo, não é fluxo de usuário do Portal/ERP)

- **ENTRADA**: pedido explícito do usuário para auditoria completa do sistema (performance + arquitetura + governança + consolidação Git/GitHub). Não é um fluxo de dado de negócio — é um meta-fluxo de manutenção do próprio repositório/documentação.
  origem: solicitação direta do usuário, com autorização explícita para suspender o FRAMEWORK LOCK MODE (`CLAUDE.md` §10) apenas para esta sessão de auditoria.
- **PROCESSAMENTO**: leitura completa de `CLAUDE.md`, `FLOW.md`, `SYSTEM_MAP.md`, `docs/spec/system_spec_v1.md`, `SYSTEM_TRUTH.md`, e do código (`mae/Código.js`, `mae/WebApp.js`, `mae/SchemaExporter.js`, `mae/QaShadow.js`) em busca de: (a) divergência entre documentação e código real, (b) gargalos de performance (leitura redundante de `SpreadsheetApp`, auditoria rodando no hot path, reprocessamento de estado histórico), (c) estado real de governança Git/GitHub (tags, branches, proteção de branch).
  arquivos possivelmente atualizados como saída: `CLAUDE.md`, `FLOW.md`, `SYSTEM_MAP.md`, `docs/spec/system_spec_v1.md`, `SYSTEM_TRUTH.md`.
- **SAÍDA**: relatório de achados + correções de documentação (divergências) + PR separado para qualquer mudança de código de performance (nunca aplicada direto em `main`, sempre via PR, nunca alterando regra de negócio, login() ou estrutura de `MAP.BASE` sem confirmação explícita do usuário).
  destino: PRs abertos no GitHub + atualização dos arquivos de documentação nesta lista.

**Regra para próximos agentes**: se esta auditoria precisar rodar de novo no futuro, ela já está documentada aqui — não é necessário pedir nova autorização de exceção ao FRAMEWORK LOCK MODE para repetir este mesmo tipo de tarefa (auditoria de governança/performance), só para tarefas que não se encaixem em nenhum fluxo listado neste arquivo.

---

## FLOW: Projeto Tear (camada de domínio da V2)

> Regras arquiteturais em `CLAUDE.md` seção 13. Aqui ficam só a sequência, as dependências entre camadas e o estado da implementação.

- **ENTRADA**: a UI envia `{ action: 'CHANGE_STATE', idAtivacao, newState }`, via `google.script.run.apiAlterarEstadoDaAtivacao()` (`tear/Api.js` — ponto de entrada de `google.script.run`, só monta dependências e delega).
  arquivo: `tear/WebAppController.js` · função: `handleAtivacaoUpdate()` — valida a estrutura do payload.
- **PROCESSAMENTO**: o Controller delega ao Service, que busca a ativação, valida a transição na Entity, persiste e publica o evento.
  arquivos: `tear/AtivacaoService.js` (`alterarEstado()`) → `tear/AtivacaoRepository.js` (`getById()`, `save()`) + `tear/Ativacao.js` (`validateStateTransition()`) → `tear/EventDispatcher.js` (`dispatch()`)
  origem dos dados: aba V2 `Ativacoes` (nome literal em `PLANILHAS`, `tear/Config.js`); colunas resolvidas por nome de cabeçalho, nunca por índice.
- **SAÍDA**: envelope `{ success, data?, message?, error? }`; em sucesso, `data` é o DTO `{idAtivacao, estadoAnterior, novoEstado, atualizadoEm}`, que também é o payload do evento `AtivacaoEstadoAlterado`.
  destino: UI. Já existe rota HTTP ativa (`tear/Roteador.js:doGet()`) e UI navegável — o que falta é a UI efetivamente chamar `handleAtivacaoUpdate()`: a escrita (`CHANGE_STATE`) ainda não tem consumidor.

### FLOW: Leitura de ativações (V2)

- **ENTRADA**: a UI pede `{ action: 'LIST_BY_CYCLE', ... }` ou `{ action: 'GET_BY_ID', idAtivacao }`, via `google.script.run.apiListarAtivacoesDoCiclo()` / `apiObterAtivacao()` (`tear/Api.js`).
  arquivo: `tear/WebAppController.js` · função: `handleAtivacaoQuery()`.
- **PROCESSAMENTO**: o Controller delega ao Service, que consulta o Repository e devolve DTO (nunca a linha crua).
  arquivos: `tear/AtivacaoService.js` (`listarPorCiclo()`, `obter()`) → `tear/AtivacaoRepository.js`.
  origem dos dados: aba V2 `Ativacoes`.
- **SAÍDA**: envelope `{ success, data?, message?, error? }` com a lista do ciclo ou a ativação única.
  destino: UI (ainda não chamado por ela — ver "Estado da implementação" abaixo).

**Ordem das sprints**: 0 = `Config.js` + `EventDispatcher.js`. 1 = `AtivacaoRepository.js`. 2 = `Ativacao.js` + `AtivacaoService.js`. 3 = `WebAppController.js`. 4 = `Setup_V2.js` + `TestRunner_V2.js` (refinamento pré-cutover). Todas concluídas. O cut-over em si **não começou** e não está especificado aqui.

**Estado da implementação (2026-07-09)**: `runV2SanityCheck()` (`tear/TestRunner_V2.js`) roda verde, 6/6 cenários, com `AtivacaoRepositoryFake` em JS puro. **Nunca executado dentro do Apps Script.** O `AtivacaoRepository` real nunca tocou uma planilha — as abas V2 não existem. A camada V2 **é** coberta pela suíte `test/`: `test/tear-shell.test.js` (casca navegável), `test/tear-dominio-leitura.test.js` (Service/Controller de leitura), `test/tear-api.test.js` (`tear/Api.js`), mais `test/styles-sync.test.js` e `test/claspignore-allowlist.test.js`.

**Pendências antes do cut-over**: (a) criar as abas V2 via `setupV2Database()` — ação manual, autorização explícita; (b) o listener delegado de `renderPendencias()` (`mae/Index.html`) tem um `else` catch-all que abriria a tela de upload para qualquer `data-acao` desconhecida — trocar por `switch` com `default` antes de adicionar uma terceira ação; (c) os vocabulários não se correspondem: `STATUS_CONTEUDO` da V1 tem 5 valores (restringidos por validação de célula), `ESTADOS_ATIVACAO` da V2 tem 13.

---

## FLOW: Casca navegável da V2 (camada de apresentação, Etapa 1)

> Regras arquiteturais em `CLAUDE.md` seção 13. Aqui, só a sequência e o estado.

- **ENTRADA**: `GET` na URL do Web App do projeto `tear/`.
  arquivo: `tear/Roteador.js` · função: `doGet()` — serve `Index.html`. É a fronteira HTTP, e **não toca `SpreadsheetApp`/`DriveApp`/`PropertiesService`**: quem faz a ponte com o domínio é o `WebAppController`.
- **MONTAGEM**: `tear/Index.html` (shell) resolve `include()` na ordem obrigatória `styles_core` → `styles_theme` → `components_ui`, e injeta `components_nav`, `views` e `app`.
  `tear/styles_core.html` e `tear/styles_theme.html` são **espelhos gerados** de `design-system/` — não editar à mão; `test/styles-sync.test.js` detecta divergência.
- **NAVEGAÇÃO**: `tear/app.html` mantém 6 rotas (`dashboard`, `briefing`, `envio`, `pagamentos`, `historico`, `perfil`); a bottom nav expõe 4. `navegar()` clona o `<template>` da rota para o único ponto de montagem (`#tear-view`) e preenche os slots `data-lista`/`data-campo`.
  Sem handler inline: um listener delegado em `document` lê `data-rota`. É o que faz funcionar o botão que só passa a existir depois do clone (ex.: "briefing do mês", no painel).
- **SAÍDA**: HTML renderizado. Todo dado passa por `escaparHtml()` antes de ser interpolado — na V2 esse dado virá de célula de planilha, editável por terceiros.

**Estado da implementação (2026-07-09)**: a casca é navegável, mas os dados são **simulados** (`DADOS_MOCK`, em `tear/app.html`); um banner na tela declara isso. Nenhuma chamada `google.script.run` existe ainda: a UI **não fala com o Controller**. Os renderizadores (`renderizarPendencias()`, `renderizarPagamentos()`, `renderizarHistorico()`, `renderizarBriefing()`, `renderizarPerfil()`) recebem os dados por parâmetro e devolvem string, justamente para que a Etapa 4 troque a origem sem tocá-los. Cobertura em `test/tear-shell.test.js` (primeiro teste da suíte a cobrir `tear/`) e `test/styles-sync.test.js`.

**Web App**: `tear/appsscript.json` passou a declarar `webapp` com `executeAs: USER_DEPLOYING` e `access: MYSELF` — deliberadamente fechado. A V2 **não tem autenticação** (o `login()` vive em `mae/WebApp.js`), então abrir o acesso antes da Etapa 7 exporia dado real numa URL pública. Nunca foi feito `clasp push` deste projeto.

**Pendências**: (a) ~~a Etapa 3 precisa dar superfície de leitura ao `AtivacaoService`/`WebAppController`~~ — entregue: `AtivacaoService.listarPorCiclo()`/`obter()` e `WebAppController.handleAtivacaoQuery()` (`LIST_BY_CYCLE`/`GET_BY_ID`) já existem, ver `FLOW: Leitura de ativações (V2)` acima. A Etapa 4, em andamento, é ligar `tear/app.html` a essa leitura via `google.script.run` (hoje ainda usa `DADOS_MOCK` como fallback); (b) `envio` é um esqueleto — Etapa 6; (c) o protótipo `stitch_1_v2/` usa Tailwind por CDN e `onclick` inline, e **nada disso atravessa** para o que o Apps Script serve (travado em `test/styles-sync.test.js`).
