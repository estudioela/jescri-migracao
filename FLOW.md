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
  arquivo: `mae/Index.html` · função: `sairDoApp()` (chama `google.script.run.logout(token)`)
- **PROCESSAMENTO**: valida token vigente ou encerra sessão.
  arquivo: `mae/WebApp.js` · funções: `validarToken()` (~L210), `logout()` (~L223)
  origem dos dados: token em memória/sessão (duração 21600s/6h, hardcoded em `login()` e `validarToken()`)
- **SAÍDA**: sessão válida/inválida; encerramento de sessão.
  destino: front-end (`mae/Index.html`).

---

## FLOW: Dashboard / Pendências

- **ENTRADA**: abertura do dashboard ou seleção de período pela influenciadora.
  arquivo: `mae/Index.html` · funções: `carregarPendencias()` (~L1153), `carregarPeriodos()` (~L1113)
- **PROCESSAMENTO**: busca ativações pendentes e lista de períodos disponíveis.
  arquivo: `mae/WebApp.js` · funções: `getPendencias()` (~L234), `listarPeriodos()` (~L653)
  origem dos dados: aba `ATIVAÇÕES`
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
- **SAÍDA**: novo registro de influenciadora.
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
