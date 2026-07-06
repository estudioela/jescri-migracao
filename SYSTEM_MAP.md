# SYSTEM_MAP.md — Mapa arquitetural completo (por aba da planilha)

> Gerado por leitura completa e literal de `mae/Código.js`, `mae/WebApp.js`, `mae/SidebarBackend.js`, `mae/PortalUi.gs` e `mae/Index.html` (3.347 linhas, 2026-07-05). Nenhum conteúdo aqui foi inferido — cada afirmação aponta pra arquivo+linha real. Onde o código diverge do que estava documentado em `FLOW.md`/relatado pelo usuário, a divergência é sinalizada explicitamente, não silenciada.

---

## ⚠️ ACHADO CRÍTICO — corrige `FLOW.md`

O `FLOW.md` documenta um sub-fluxo "`STATUS_CONTEUDO` → `STATUS_PAGAMENTO` (FECHADO)", baseado em descrição do usuário: quando `STATUS_CONTEUDO` muda para `APROVADO`/`POSTADO`, o sistema atualizaria `STATUS_PAGAMENTO` como consequência.

**Essa função não existe no código.** Não há, em nenhum lugar de `mae/Código.js` ou `mae/WebApp.js`, uma leitura de `STATUS_CONTEUDO` que escreva em `STATUS_PAGAMENTO`. O que existe de fato:

- `finalizarEnvioResumable()` (`mae/WebApp.js` ~L889) grava `STATUS_CONTEUDO` como **sempre** `"EM_APROVACAO"` (valor fixo, hardcoded) — não escreve `APROVADO` nem `POSTADO`, e não toca `PAGAMENTOS`.
- A transição de `STATUS_CONTEUDO` para `APROVADO`/`POSTADO` não aparece gravada por nenhuma função — só é **lida** (pelo `onEdit()` de `ATIVAÇÕES`, `mae/Código.js` ~L207, que reage quando o valor contém `"postado"`). Ou seja, essa transição é edição manual da equipe na aba `ATIVAÇÕES`.
- A única automação real que toca `PAGAMENTOS` é o `onEdit()` em `mae/Código.js` (~L269-270), que reage à edição direta de `STATUS_PAGAMENTO` (não de `STATUS_CONTEUDO`).

**Recomendação**: o sub-fluxo "FECHADO" em `FLOW.md` deveria ser reaberto/corrigido para refletir isso. Não fiz a correção automaticamente — sinalizando para sua decisão, já que o `FLOW.md` registra explicitamente que aquele fechamento foi "confirmado pelo usuário".

---

## Inventário de abas

| Aba | Constante | Arquivo de definição |
|---|---|---|
| `BASE DE DADOS` | `SETUP.ABAS.BASE` / `MAP.BASE.NOME_ABA` | `Código.js` ~L10, `WebApp.js` ~L30 |
| `CADASTROS` | `SETUP.ABAS.CADASTROS` | `Código.js` ~L9 |
| `BRIEFING` | `SETUP.ABAS.BRIEFING` / `MAP.BRIEFING.NOME_ABA` | `Código.js` ~L11, `WebApp.js` ~L48 |
| `FLUXO LOGÍSTICO` | `SETUP.ABAS.FLUXO` | `Código.js` ~L12 |
| `ATIVAÇÕES` | `SETUP.ABAS.ATIVACOES` / `MAP.ATIVACOES.NOME_ABA` | `Código.js` ~L13, `WebApp.js` ~L45 |
| `PAGAMENTOS` | `SETUP.ABAS.PAGAMENTOS` / `MAP.PAGAMENTOS.NOME_ABA` | `Código.js` ~L14, `WebApp.js` ~L46 |
| `HISTÓRICO DE CONTEÚDOS` | `SETUP.ABAS.HISTORICO_CONT` / `MAP.HISTORICO_CONT.NOME_ABA` | `Código.js` ~L15, `WebApp.js` ~L55 |
| `HISTÓRICO DE PAGAMENTOS` | `SETUP.ABAS.HISTORICO_PAG` / `MAP.HISTORICO_PAG.NOME_ABA` | `Código.js` ~L16, `WebApp.js` ~L56 |
| `HISTÓRICO LOGÍSTICO` | `SETUP.ABAS.HISTORICO_FLUXO` | `Código.js` ~L17 |
| (legado, nome variável) | detecção dinâmica por cabeçalho | `WebApp.js:listarAbasHistoricoLegado()` ~L72 |

---

## 1. `BASE DE DADOS`

**Propósito**: cadastro mestre de influenciadoras — status ativo/inativo, dados de contato, PIX, endereço, quantidades de ativação contratadas, valor.

**Colunas confirmadas** (índice fixo em `MAP.BASE`, `WebApp.js` ~L29-44, exceção documentada no `CLAUDE.md`): col.1=status, `INFLU_KEY`=2, `CUPOM`=3, `NOME`=4, `EMAIL`=5, `CHAVE_PIX`=6, `CNPJ`=7, `CEP`=8, `RUA`=9, `NUMERO`=10, `COMPLEMENTO`=11, `CIDADE`=13, `UF`=14, `VALOR`=16. Colunas adicionais usadas via `getHeaderMap()` em `Código.js`/`SidebarBackend.js`: `PASTA_DRIVE_LINK`, `INFLUENCIADORA_ENDERECO`, `VALOR_TOTAL`, `REELS_TEXTO`, `CARROSSEL_TEXTO`, `STORIES_TEXTO`, `INFLU_SHEET_URL`, `INFLUENCIADORA_RAZAO_SOCIAL`, `INFLUENCIADORA_CNPJ`, `BAIRRO`, `LOOKS_QTD`, `CANAIS`, `PRAZO`.

**Funções que escrevem:**
- `Código.js:onFormSubmit()` (~L544-592) — cria linha nova (`appendRow`), status inicial `"OFF"`, dados vindos de `CADASTROS` + enriquecimento via BrasilAPI (CEP).
- `Código.js:preencherEnderecoPorCEP()` (~L613-640) — grava `RUA`, `BAIRRO`, `CIDADE`, `UF`, `INFLUENCIADORA_ENDERECO`.
- `Código.js:organizarEPintarBase()` (~L642-668) — reordena linhas e repinta cor de fundo por status.
- `SidebarBackend.js:salvarDadosSidebarV2()` (~L75-100) — grava `CUPOM`, `VALOR_TOTAL`, `REELS_TEXTO`, `CARROSSEL_TEXTO`, `STORIES_TEXTO`, `LOOKS_QTD`, `CANAIS`, `PRAZO`, `INFLU_SHEET_URL`.
- `WebApp.js:updatePerfil()` (~L575-613) — grava `CHAVE_PIX`, `EMAIL`, `CEP`, `NUMERO`, `COMPLEMENTO` (únicos campos editáveis pelo Portal).

**Funções que leem:**
- `Código.js:gerarNovoMesCompleto()` (~L70-147), `lancarPagamentosDoMes()` (~L326-359), `gerarMensagemRevisao()` (~L379-406), `sincronizarLooks()` (~L411-448).
- `SidebarBackend.js:getListaInfluenciadoras()`/`getDadosInfluenciadora()` (~L30-73).
- `WebApp.js:login()` (~L153-208), `getPerfil()` (~L524-573), `getInfluKeyByCupom()` (~L702-712), `obterOuCriarPastaDestino()` (~L769-820).

**Eventos automáticos:**
- `onEdit()` (`Código.js` ~L262-267): coluna 1 (status) editada → `organizarEPintarBase()`; `CEP`/`NUMERO`/`COMPLEMENTO` editados → `preencherEnderecoPorCEP()`.
- `onFormSubmit()` (trigger instalável, ~L544) — não verificável por código se está de fato instalado (mesma ressalva do `CLAUDE.md` seção 6).

**Origem dos dados**: formulário externo (via `CADASTROS`), edição manual no ERP, sidebar do ERP, Portal (`updatePerfil`).

---

## 2. `CADASTROS`

**Propósito**: zona de pouso bruta das submissões do Google Form externo, antes de normalização para `BASE DE DADOS`.

**Funções que escrevem**: nenhuma no repositório — o próprio Google Form grava aqui, mecanismo fora deste código-fonte.

**Funções que leem**: `Código.js:onFormSubmit()` (~L544-556) — lê a última linha (ou `e.range`), extrai campos por substring do cabeçalho (`getV`: `CHAMADA`, `MAIL`, `PIX`, `RAZAO`, `CNPJ`, `CEP`, `NUMERO`, `COMPLEMENTO`).

**Eventos automáticos**: trigger `onFormSubmit` (instalável, não verificável).

**Origem dos dados**: Google Form externo (repositório `estudioela/estudioela`, fora deste repo).

---

## 3. `BRIEFING`

**Propósito**: conteúdo criativo do briefing por influenciadora/mês/formato — texto do briefing, datas de aprovação calculadas, resumo do mês, looks.

**Colunas confirmadas** (`MAP.BRIEFING`, `WebApp.js` ~L47-54): `INFLU_KEY`=1, `CUPOM`=2, `MES`=3, `RESUMO`=4. Dinâmicas/hardcoded no corpo: `PASTA_DRIVE_LINK`, `APROVACAO_REEL`/`APROVACAO_CARROSSEL`/`APROVACAO_STORIES_1`/`APROVACAO_STORIES_2` (fallback fixo colunas 17-20), `LOOK_REEL`/`LOOK_CARROSSEL`/`LOOK_STORIES_1`/`LOOK_STORIES_2`, e colunas fixas 12-15 lidas diretamente por índice em `getBriefing()` (`SOBRE_REEL`/`SOBRE_CARROSSEL`/`SOBRE_STORIES_1`/`SOBRE_STORIES_2`, conforme comentário no código).

**Funções que escrevem:**
- `Código.js:gerarNovoMesCompleto()` (~L104-116) — limpa linhas antigas, grava `INFLU_KEY`, `CUPOM`, `MES`, `PASTA_DRIVE_LINK` por influenciadora ativa.
- `Código.js:onEdit()` bloco `BRIEFING` (~L180-204) — edição em coluna REEL/CARROSSEL/STORIES calcula e grava data em `APROVACAO_*`.
- `Código.js:onEdit()` bloco `ATIVAÇÕES` (~L213-252) — ao editar `DATA_ATIVACAO` em `ATIVAÇÕES`, localiza linha correspondente (por `INFLU_KEY`+`MES`) e grava a data de aprovação calculada na coluna `APROVACAO_*` do formato certo.
- `Código.js:sincronizarLooks()` (~L411-448) — grava `LOOK_REEL`/`LOOK_CARROSSEL`/`LOOK_STORIES_1`/`LOOK_STORIES_2` a partir de planilha externa por influenciadora (URL em `BASE DE DADOS.INFLU_SHEET_URL`).

**Funções que leem:**
- `WebApp.js:getBriefing()` (~L289-374) — lê `INFLU_KEY`, `MES`, `RESUMO` (com fallback de nome), e colunas fixas 12-15 pro texto do briefing por formato.

**Eventos automáticos**: `onEdit()` (dois blocos independentes: direto em `BRIEFING`, e indireto via `ATIVAÇÕES.DATA_ATIVACAO`).

**Origem dos dados**: gerado por `gerarNovoMesCompleto()`; texto preenchido manualmente pela equipe; looks vindos de planilha externa por influenciadora.

---

## 4. `FLUXO LOGÍSTICO`

**Propósito**: rastreamento logístico de envio de produtos/looks — endereço, status de revisão, código de rastreio, status de entrega.

**Colunas** (`Código.js:setupERP()` ~L735): `INFLU_KEY`, `ENDERECO`, `STATUS_REVISAO`, `MES_REFERENCIA`, `RASTREIO`, `DATA_DE_ENVIO`, `STATUS_LOGISTICA`.

**Funções que escrevem:**
- `Código.js:gerarNovoMesCompleto()` (~L118) — cria linha inicial (`"Aguardando Confirmação"`, status `"pendente"`).
- `Código.js:onEdit()` bloco `FLUXO` (~L273-277) — `RASTREIO` editado com link contendo `"http"` → preenche `DATA_DE_ENVIO` (se vazia).
- `Código.js:atualizarRastreiosBRComerce()` (~L450-487) — consulta API externa BRComerce por código de rastreio, grava `STATUS_LOGISTICA`.
- `Código.js:arquivarGenerico()` (via `arquivarFluxo()`/`menuArquivarTudo()`) — move linhas com `STATUS_LOGISTICA` contendo `"entregue"`/`"entrega realizada"`/`"objeto entregue"` para `HISTÓRICO LOGÍSTICO`.

**Funções que leem:**
- `Código.js:gerarMensagemRevisao()` (~L379-406) — lê `INFLU_KEY` da linha ativa selecionada no ERP.
- `Código.js:atualizarRastreiosBRComerce()` — lê `RASTREIO`.

**Eventos automáticos**: `onEdit()` (`RASTREIO`→`DATA_DE_ENVIO`). `atualizarRastreiosBRComerce()` é ação de **menu** (`onOpen()` item "Atualizar Rastreios Automáticos"), não automática por edição.

**Origem dos dados**: gerada por `gerarNovoMesCompleto()`; atualizada por API externa BRComerce e edição manual.

---

## 5. `ATIVAÇÕES`

**Propósito**: unidade de trabalho central — cada peça de conteúdo (REEL/CARROSSEL/STORIES) por influenciadora/mês, com status e arquivo enviado.

**Colunas** (`Código.js:setupERP()` ~L737): `ID`, `INFLU_KEY`, `MES_REFERENCIA`, `ANO_REFERENCIA`, `FORMATO`, `DATA_APROVACAO`, `DATA_ATIVACAO`, `STATUS_CONTEUDO`, `LINK_ARQUIVO`.

**Funções que escrevem:**
- `Código.js:gerarNovoMesCompleto()` (~L124-138) — cria uma linha por unidade contratada (`ID`=UUID, `STATUS_CONTEUDO`='em aberto').
- `Código.js:onEdit()` bloco `ATIVAÇÕES` (~L206-259) — `STATUS_CONTEUDO`→contém `"postado"` dispara arquivamento + reordenação; `DATA_ATIVACAO` editada dispara cálculo/gravação de `DATA_APROVACAO` + propagação pro `BRIEFING` + reordenação.
- `WebApp.js:finalizarEnvioResumable()` (~L862-899) — grava `LINK_ARQUIVO` (concatenado) e **sempre** grava `STATUS_CONTEUDO = "EM_APROVACAO"` (valor fixo).
- `Código.js:arquivarGenerico()` (via `onEdit` ou `menuArquivarTudo()`) — remove linhas arquivadas (`deleteRow`).

**Funções que leem:**
- `WebApp.js:getPendencias()` (~L234-287), `getBriefing()` (~L289-374, via `encontrarLinhaAtivacaoPorId()`), `iniciarEnvioResumable()`/`finalizarEnvioResumable()` (~L822-899), `listarPeriodos()` (~L653-700).
- `Código.js:ordenarAbaAtivacoesCronologico()` (~L314-321).

**Eventos automáticos**: `onEdit()` — dois comportamentos independentes (arquivamento ao marcar "postado"; cálculo/propagação de data ao editar `DATA_ATIVACAO`).

**Origem dos dados**: gerada por `gerarNovoMesCompleto()`; atualizada pelo Portal (upload) e edição manual do ERP.

**⚠️ Nota (ver achado crítico acima)**: nenhuma função grava `STATUS_CONTEUDO` como `"APROVADO"` ou `"POSTADO"` automaticamente — só `"EM_APROVACAO"` é automático. Essas duas transições são edição manual.

---

## 6. `PAGAMENTOS`

**Propósito**: controle financeiro por influenciadora/mês — valor, PIX, status de pagamento, data de pagamento, mensagem de cobrança.

**Colunas** (`Código.js:setupERP()` ~L739): `INFLU_KEY`, `MES_REFERENCIA`, `ANO_REFERENCIA`, `VALOR_TOTAL`, `CHAVE_PIX`, `STATUS_PAGAMENTO`, `DATA_PAGAMENTO`, `MENSAGEM_PIX`.

**⚠️ Divergência de schema**: o schema informado anteriormente pelo usuário (7 colunas, sem `ANO_REFERENCIA`) não bate com o código real, que tem 8 colunas incluindo `ANO_REFERENCIA` (usada em `getPagamentos()`, `listarPeriodos()`, `gerarNovoMesCompleto()`).

**Funções que escrevem:**
- `Código.js:gerarNovoMesCompleto()` (~L119-122), `lancarPagamentosDoMes()` (~L326-359), `SidebarBackend.js:salvarPagamentoExtra()` (~L102-118) — todas criam linha nova com `STATUS_PAGAMENTO='em aberto'`.
- `Código.js:gerarSolicitacaoPagamento()` (~L364-377) — grava `MENSAGEM_PIX` na linha ativa selecionada no ERP.
- `Código.js:arquivarGenerico()` (~L509-539), disparada por `onEdit()` (~L269-270, quando `STATUS_PAGAMENTO` editado para conter `"pago"`) ou por `menuArquivarTudo()` (~L492-494, manual via menu) — preenche `DATA_PAGAMENTO` (se vazia, ~L527-528) e **move a linha inteira** (`appendRow`+`deleteRow`) para `HISTÓRICO DE PAGAMENTOS`.

**Funções que leem:**
- `WebApp.js:getPagamentos()` (~L376-439), `listarPeriodos()` (~L653-700).
- `Código.js:gerarSolicitacaoPagamento()` — lê `VALOR_TOTAL`, `MES_REFERENCIA`, `INFLU_KEY`, `CHAVE_PIX` da linha ativa.

**Eventos automáticos**: `onEdit()` (~L269-270) — dispara arquivamento imediato + preenchimento de `DATA_PAGAMENTO` quando `STATUS_PAGAMENTO` é editado manualmente para conter `"pago"`.

**Origem dos dados**: gerada por `gerarNovoMesCompleto()`/`lancarPagamentosDoMes()`/`salvarPagamentoExtra()`. `STATUS_PAGAMENTO = PAGO` é edição manual da equipe (confirmado por código: nenhuma função grava esse valor, só reage a ele).

---

## 7. `HISTÓRICO DE CONTEÚDOS`

**Propósito**: arquivo de ativações finalizadas ("postado"), fora da operação corrente.

**Colunas**: mesmas de `ATIVAÇÕES` + `DATA_ARQUIVAMENTO` (`Código.js:setupERP()` ~L738).

**Funções que escrevem**: `Código.js:arquivarGenerico()` (~L509-539) — chamada por `onEdit()` (`ATIVAÇÕES.STATUS_CONTEUDO`→"postado") ou `menuArquivarTudo()` (manual).

**Funções que leem**: `WebApp.js:getHistorico()` (~L441-522, função interna `extrairAtivacoes`), `listarPeriodos()` (~L653-700), `listarAbasHistoricoLegado()` indiretamente (mesma assinatura de cabeçalho).

**Eventos automáticos**: recebe linhas via `arquivarGenerico()`, automático (onEdit) ou manual (menu).

**Origem dos dados**: migração da aba `ATIVAÇÕES`.

---

## 8. `HISTÓRICO DE PAGAMENTOS`

**Propósito**: arquivo de pagamentos já efetivados ("pago").

**Colunas**: mesmas de `PAGAMENTOS` + `DATA_ARQUIVAMENTO` (`Código.js:setupERP()` ~L740).

**Funções que escrevem**: `Código.js:arquivarGenerico()` — chamada por `onEdit()` (`PAGAMENTOS.STATUS_PAGAMENTO`→"pago") ou `menuArquivarTudo()` (manual).

**Funções que leem**: `WebApp.js:getHistorico()` (função interna `extrairPagamentos`), `listarPeriodos()`.

**Eventos automáticos**: idem `PAGAMENTOS` — migração automática (onEdit) ou manual (menu).

**Origem dos dados**: migração da aba `PAGAMENTOS`.

---

## 9. `HISTÓRICO LOGÍSTICO`

**Propósito**: arquivo de entregas logísticas concluídas.

**Colunas**: mesmas de `FLUXO LOGÍSTICO` + `DATA_ARQUIVAMENTO` (`Código.js:setupERP()` ~L736).

**Funções que escrevem**: `Código.js:arquivarGenerico()` — chamada por `arquivarFluxo()` (dentro de `atualizarRastreiosBRComerce()`, ~L482) ou `menuArquivarTudo()` (~L495).

**Funções que leem**: **nenhuma encontrada no código** — nem `Código.js` nem `WebApp.js` leem esta aba de volta. É destino puro de arquivamento, sem consumo automatizado conhecido.

**Eventos automáticos**: nenhum `onEdit()` direto; disparada só por ações de menu (`atualizarRastreiosBRComerce()`, `menuArquivarTudo()`).

**Origem dos dados**: migração da aba `FLUXO LOGÍSTICO`.

---

## 10. Abas legado (nome variável, detecção dinâmica)

**Propósito**: abas de ativação/pagamento anteriores à consolidação em `HISTÓRICO DE CONTEÚDOS`/`HISTÓRICO DE PAGAMENTOS`, incluindo ocultas/desativadas.

**Detecção**: `WebApp.js:listarAbasHistoricoLegado()` (~L72-93) — qualquer aba não listada em `nomesConhecidos` (abas oficiais), com cabeçalho contendo `INFLU_KEY`+`MES_REFERENCIA`, tipada como `CONTEUDO` (se tem `STATUS_CONTEUDO`) ou `PAGAMENTO` (se tem `STATUS_PAGAMENTO`).

**Funções que escrevem**: nenhuma — são só lidas.

**Funções que leem**: `WebApp.js:getHistorico()` e `listarPeriodos()`, ambas via `listarAbasHistoricoLegado()`.

**Eventos automáticos**: nenhum.

**Origem dos dados**: histórico anterior à consolidação, mantido só para leitura.

---

## Referência cruzada — funções por arquivo

| Arquivo | Papel | Funções principais |
|---|---|---|
| `mae/Código.js` | ERP (roda na planilha) | `onOpen`, `onEdit`, `onFormSubmit`, `gerarNovoMesCompleto`, `lancarPagamentosDoMes`, `gerarSolicitacaoPagamento`, `gerarMensagemRevisao`, `sincronizarLooks`, `atualizarRastreiosBRComerce`, `menuArquivarTudo`, `arquivarFluxo`, `arquivarGenerico`, `preencherEnderecoPorCEP`, `organizarEPintarBase`, `getHeaderMap`, `montarLinha`, `setupERP` |
| `mae/WebApp.js` | Backend do Portal | `doGet`, `doPost`, `login`, `validarToken`, `logout`, `getPendencias`, `getBriefing`, `getPagamentos`, `getHistorico`, `getPerfil`, `updatePerfil`, `listarPeriodos`, `iniciarEnvioResumable`, `finalizarEnvioResumable`, `getInfluKeyByCupom`, `listarAbasHistoricoLegado`, `encontrarLinhaAtivacaoPorId`, `normalizarStatusAtivacao`, `normalizarStatusPagamento` |
| `mae/SidebarBackend.js` | Backend das sidebars do ERP | `abrirSidebarInflu`, `abrirSidebarPagamento`, `getListaInfluenciadoras`, `getDadosInfluenciadora`, `salvarDadosSidebarV2`, `salvarPagamentoExtra` |
| `mae/PortalUi.gs` | Preview do Portal dentro da planilha | `abrirPortalModal` |
| `mae/Index.html` | Front-end do Portal (SPA) | `fazerLogin`, `carregarPendencias`, `abrirBriefing`, `abrirEnviarMaterial`/`arquivoSelecionado`/`iniciarEnvio`/`enviarArquivoResumable`, `carregarPagamentos`, `carregarHistorico`, `carregarPerfil`/`salvarPerfil`, `router`/`chamar` (camada de comunicação com `google.script.run`) |

---

## Confirmações de fato (não inferência) que corrigem/complementam registros anteriores

1. **`STATUS_CONTEUDO` → `STATUS_PAGAMENTO` não existe no código** (ver achado crítico no topo).
2. `finalizarEnvioResumable()` grava `STATUS_CONTEUDO` sempre como `"EM_APROVACAO"` — não `APROVADO`/`POSTADO`.
3. `arquivarGenerico()` é compartilhada pelas 3 abas operacionais (`ATIVAÇÕES`, `PAGAMENTOS`, `FLUXO LOGÍSTICO`) — mesma função, comportamento idêntico (preenche `DATA_PAGAMENTO` só quando a coluna existe na aba de origem, então esse preenchimento só tem efeito real em `PAGAMENTOS`).
4. Schema real de `PAGAMENTOS` tem 8 colunas (inclui `ANO_REFERENCIA`), não 7 como informado anteriormente.
5. `HISTÓRICO LOGÍSTICO` não tem nenhuma função de leitura no código — é o único destino de arquivamento sem consumo conhecido.
6. `onFormSubmit()` e o trigger de `onEdit()` continuam não-verificáveis por código quanto a estarem de fato instalados (mesma ressalva já registrada no `CLAUDE.md` seção 6).
