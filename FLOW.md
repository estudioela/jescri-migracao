# FLOW.md — Fluxos completos do sistema, passo a passo

> Versão expandida da seção 4 de `CLAUDE.md` (que é a versão compacta, para lookup rápido). Cada fluxo aqui tem origem → processamento → destino, com nomes de campo, códigos de erro e efeitos colaterais reais. Linhas conferidas em 2026-07-05 contra o código em `mae/`.

---

## 1. Login da influenciadora

**Origem:** `mae/Index.html:fazerLogin()` (~L1068) — lê `cupom` e `senha` dos campos do form, chama `chamar('login', {cupom, senha})` (~L921, que faz POST via `google.script.run` — wrapper em `chamarServidorBruto()` ~L912).

**Processamento:** `mae/WebApp.js:login()` (~L153):
1. Valida que `cupom` e `senha` não são vazios — senão retorna `{ok:false, erro:"CREDENCIAIS_INVALIDAS"}`.
2. Verifica bloqueio por tentativas: `CacheService` guarda contador `tentativas_<CUPOM>`; se ≥ `LOGIN_MAX_TENTATIVAS` (5), retorna `{ok:false, erro:"MUITAS_TENTATIVAS"}` sem nem olhar a planilha.
3. Adquire `LockService` lock (timeout 10s), lê toda a aba `BASE DE DADOS`, libera o lock.
4. Percorre as linhas procurando `cupom` igual (coluna `CUPOM`, índice fixo `MAP.BASE.CUPOM`); se achar, compara a senha digitada com os 5 primeiros dígitos do CNPJ daquela linha (coluna `CNPJ`, só dígitos).
5. Se bater: zera o contador de tentativas, gera um token UUID, grava `token → cupom` no `CacheService` por 21600s (6h), retorna `{ok:true, token, nome}`.
6. Se não bater (cupom existe mas senha errada, ou cupom não existe): incrementa o contador de tentativas (janela de 900s / `LOGIN_BLOQUEIO_SEGUNDOS`) e retorna `{ok:false, erro:"CREDENCIAIS_INVALIDAS"}`.

**Destino:** `mae/Index.html:fazerLogin()` recebe a resposta e faz `switch` pelo campo `erro` para decidir a mensagem exibida (`CREDENCIAIS_INVALIDAS`, `MUITAS_TENTATIVAS`); em sucesso, guarda o token (sessão do front-end) e navega para o dashboard.

**Efeito colateral:** nenhuma escrita na planilha — login é só leitura de `BASE DE DADOS` + estado em `CacheService`.

---

## 2. Visualização de briefing

**Origem:** influenciadora abre uma pendência no dashboard e clica para ver o briefing → `mae/Index.html:abrirBriefing(idAtivacao)` (~L1222).

**Processamento:** `mae/WebApp.js:getBriefing(token, idAtivacao)` (~L289):
1. Valida token (`validarToken()`, ~L210) — se expirado, `{ok:false, erro:"SESSAO_EXPIRADA"}`.
2. Resolve a linha real da ativação por **ID estável** (não por número de linha) via `encontrarLinhaAtivacaoPorId()` (~L636) — busca na coluna `ID` da aba `ATIVAÇÕES`. Se não achar: `{ok:false, erro:"ATIVACAO_NAO_ENCONTRADA"}`.
3. Confere que a `INFLU_KEY` da linha bate com a influenciadora logada — senão `{ok:false, erro:"ACESSO_NEGADO"}` (impede ver briefing de outra pessoa sabendo o ID).
4. Lê `MES_REFERENCIA` e `FORMATO` da ativação; procura a linha correspondente na aba `BRIEFING` (por `INFLU_KEY` + `MES`, sem ano — ver ressalva em `CLAUDE.md` seção 6 se `BRIEFING` ganhar `ANO_REFERENCIA` no futuro).
5. Escolhe a coluna do texto do briefing conforme o formato: `REEL` → coluna M (`SOBRE_REEL`), `CARROSSEL` → N, `STORIES_1`/`STORIES` → O, `STORIES_2` → P (índices fixos, hardcoded dentro de `getBriefing()`).

**Destino:** retorna `{ok:true, campanha, formato, dataEntrega, dataAprovacao, textoBriefing, resumoMes}` para `mae/Index.html`, renderizado no componente `.briefing-resumo` (mesma seção do arquivo).

---

## 3. Envio de material

**Origem:** influenciadora seleciona um arquivo no formulário de uma ativação → `mae/Index.html:arquivoSelecionado(files)` (~L1271) → confirma envio → `iniciarEnvio()` (~L1287) → `enviarArquivoResumable(uploadUrl, file, onProgress)` (~L1334, `CHUNK_SIZE = 8MB`).

**Processamento (duas chamadas ao backend):**

1. **`mae/WebApp.js:iniciarEnvioResumable(token, idAtivacao, nomeArquivo, mimeType, tamanhoBytes)`** (~L822):
   - Valida token e resolve a ativação por ID estável, igual ao fluxo de briefing.
   - Chama `obterOuCriarPastaDestino()` (~L769): resolve (ou cria) a pasta da influenciadora no Drive — o ID da pasta é lido de `PropertiesService` (chave `PASTA_DRIVE_<CUPOM>`, **não é mais uma coluna da planilha**), e dentro dela cria/reusa subpasta por mês e por formato (`nomeFormatoPasta()`, ~L759).
   - Inicia um upload resumable direto na API do Drive (`UrlFetchApp.fetch` com `uploadType=resumable`), retorna a `uploadUrl` do Google para o front-end.
2. **Front-end** (`enviarArquivoResumable()`) sobe o arquivo em chunks de 8MB direto para a `uploadUrl` do Google (não passa pelo Apps Script de novo nessa parte — evita o limite de tamanho de payload do `google.script.run`).
3. **`mae/WebApp.js:finalizarEnvioResumable(token, idAtivacao, fileId)`** (~L862), chamado depois que o upload termina:
   - Re-resolve a linha da ativação **de novo, dentro do lock** — proteção deliberada contra a aba ter sido editada (linha inserida/removida) entre o início e o fim do upload.
   - Concatena o link do novo arquivo em `LINK_ARQUIVO` (se já havia um link, acrescenta com `\n`) e muda `STATUS_CONTEUDO` para `EM_APROVACAO`.

**Destino:** aba `ATIVAÇÕES`, colunas `LINK_ARQUIVO` e `STATUS_CONTEUDO`; arquivo fica salvo em `Drive: <pasta raiz>/<influenciadora>/<mês>/<formato>/`.

---

## 4. Aprovação de conteúdo

**Origem:** não é um fluxo do Portal — é manual, dentro do ERP. Alguém da equipe abre a aba `ATIVAÇÕES`, confere o `LINK_ARQUIVO` enviado pela influenciadora e edita a célula `STATUS_CONTEUDO` da linha (ex.: de "em_aprovacao" para "aprovado", ou para "postado" quando publicado).

**Processamento:** `mae/Código.js:onEdit(e)` (~L170), branch `if (name === SETUP.ABAS.ATIVACOES)` (~L206):
- Se a edição foi na coluna `STATUS_CONTEUDO` e o novo valor contém `"postado"`: chama `arquivarGenerico(ATIVACOES, HISTORICO_CONT, 'STATUS_CONTEUDO', ['postado'], true)` (~L509) — move a linha inteira para `HISTÓRICO DE CONTEÚDOS` e reordena `ATIVAÇÕES` cronologicamente.
- Se a edição foi na coluna `DATA_ATIVACAO`: calcula `DATA_APROVACAO` automaticamente (`calcularDataAprovacao()`, ~L284 — data de ativação menos 7 dias, com ajuste se cair em fim de semana) e espelha essa data de volta na coluna correspondente da aba `BRIEFING` (mesma influenciadora + mês), na coluna `APROVACAO_<FORMATO>`.

**Destino:** para o Portal, o efeito visível é `mae/WebApp.js:normalizarStatusAtivacao()` (dentro de `getPendencias()`, ~L714) traduzir o texto bruto da planilha em um dos 4 estados que o front-end entende: `AGUARDANDO_MATERIAL` → `EM_APROVACAO` → `APROVADO` → `PUBLICADO`. **Importante:** a ordem das checagens em `normalizarStatusAtivacao()` importa — "aprovado" precisa ser checado antes de "aprova"/"revis", senão toda ativação aprovada cairia sempre em `EM_APROVACAO` (bug já corrigido, ver comentário no próprio código).

---

## 5. Pagamento

**Origem:** pagamento previsto é criado automaticamente no início do mês (fluxo 7, "Novo mês") ou avulso via menu `Financeiro & PIX → Lançar Pagamentos Avulsos do Mês` (`mae/Código.js:lancarPagamentosDoMes()`, ~L326). Depois, a equipe acompanha e edita `STATUS_PAGAMENTO` na aba `PAGAMENTOS` manualmente conforme o PIX é processado.

**Processamento (visualização, lado Portal):** `mae/Index.html:carregarPagamentos()` (~L1383) → `mae/WebApp.js:getPagamentos(token, mes, ano)` (~L376):
- Filtra a aba `PAGAMENTOS` pela `INFLU_KEY` da influenciadora logada (e por mês/ano se informado).
- Cada linha passa por `normalizarStatusPagamento()` (~L726): contém `"pago"` → `PAGO` (checado primeiro, é terminal); contém `"aprovado"` → `APROVADO`; qualquer outra coisa → `PENDENTE`.
- Soma `totalPrevisto` (tudo que não é `PAGO`) e `totalPago`.

**Processamento (arquivamento, lado ERP):** `mae/Código.js:onEdit()` (~L269) — quando `STATUS_PAGAMENTO` é editado e o novo valor contém `"pago"`, chama `arquivarGenerico(PAGAMENTOS, HISTORICO_PAG, 'STATUS_PAGAMENTO', ['pago'], true)`: move a linha para `HISTÓRICO DE PAGAMENTOS` (com timestamp de `DATA_PAGAMENTO` preenchido se estava vazio).

**Destino:** front-end renderiza a barra de progresso (`.tracker`) usando `ETAPA_ORDEM = ['PENDENTE','APROVADO','PAGO']` e `ETAPA_LABELS` (`Index.html` ~L875-876) — **esse vocabulário tem que casar exatamente com o que `normalizarStatusPagamento()` retorna**, senão a barra quebra silenciosamente.

---

## 6. Arquivamento de histórico

**Origem:** três gatilhos possíveis:
1. Automático via `onEdit()` quando uma linha de `ATIVAÇÕES` vira "postado" ou de `PAGAMENTOS` vira "pago" (ver fluxos 4 e 5 acima).
2. Automático via `atualizarRastreiosBRComerce()` (`mae/Código.js` ~L450), que ao final chama `arquivarFluxo(true)` (~L505) para mover entregas logísticas concluídas.
3. Manual via menu `Cadastros & Configurações → Executar Limpeza e Arquivamento Geral` → `mae/Código.js:menuArquivarTudo()` (~L492) — roda os três arquivamentos de uma vez (conteúdo, pagamento, logística) e mostra quantas linhas moveram.

**Processamento:** todos os três caminhos chamam a mesma função genérica, `mae/Código.js:arquivarGenerico(origem, destino, colStatus, palavrasChave[], silencioso)` (~L509):
- Lê a aba de origem de baixo para cima (evita bug de índice ao deletar linhas em loop).
- Para cada linha cujo `colStatus` contém alguma das `palavrasChave`, copia a linha inteira (por posição, não por nome de coluna) para a aba de destino, acrescenta timestamp de `DATA_ARQUIVAMENTO` ao final, e deleta a linha original.
- **Pré-condição não verificável por código:** a ordem de colunas da aba origem e da aba destino precisa casar 1:1 (a cópia é posicional) — só a última coluna de destino (`DATA_ARQUIVAMENTO`) é diferente. Ver `setupERP()` (~L721) para a definição de referência dessas estruturas.

**Destino:** `HISTÓRICO DE CONTEÚDOS`, `HISTÓRICO DE PAGAMENTOS` ou `HISTÓRICO LOGÍSTICO`, conforme a origem. Do lado do Portal, essas linhas passam a aparecer em `mae/WebApp.js:getHistorico()` (~L441), que também varre abas de histórico legado ainda não consolidadas (`listarAbasHistoricoLegado()`, ~L72 — detectadas dinamicamente pela presença de `INFLU_KEY` + `MES_REFERENCIA` no cabeçalho, não por nome fixo).

---

## 7. Início de novo mês (ERP)

**Origem:** menu ` ERP ELÃ 6.2 → Planejamento & Campanhas → Iniciar Novo Mês` → `mae/Código.js:gerarNovoMesCompleto()` (~L70). Pede o mês/ano por um prompt de texto livre (ex.: "AGOSTO 2026"), parseado por `parseMesAno()` (~L693 — se o ano não vier no texto, assume o ano corrente).

**Processamento:**
1. Lê `BASE DE DADOS` inteira, filtra só influenciadoras com status "ON" (coluna A).
2. **Limpa** o conteúdo da aba `BRIEFING` (menos o cabeçalho) — apaga o rascunho do mês anterior.
3. Para cada influenciadora ON, em sequência:
   - Grava uma linha nova em `BRIEFING` (nome, cupom, mês, link da pasta do Drive).
   - Monta uma linha de `FLUXO LOGÍSTICO` (status inicial "Aguardando Confirmação").
   - Monta uma linha de `PAGAMENTOS` via `montarLinha()` (~L681 — monta por nome de cabeçalho, não por posição fixa) com `STATUS_PAGAMENTO: 'em aberto'`.
   - Gera N linhas de `ATIVAÇÕES` (uma por entrega), uma para cada Reel/Carrossel/Stories que a influenciadora tem direito naquele mês (`qReels`/`qCarrosel`/`qStories`, lidos de colunas de texto livre na `BASE DE DADOS` e convertidos por `textToNumber()`, ~L703). Cada linha recebe um `ID` novo (`Utilities.getUuid()`) — é esse ID que depois sustenta o `idAtivacao` estável usado no Portal.
4. Grava tudo de uma vez (`setValues()` em lote, não célula por célula) nas abas `FLUXO LOGÍSTICO`, `PAGAMENTOS` e `ATIVAÇÕES`.
5. Reordena `ATIVAÇÕES` cronologicamente (`ordenarAbaAtivacoesCronologico()`, ~L314).

**Destino:** abas `BRIEFING` (limpa e repovoada), `ATIVAÇÕES`, `FLUXO LOGÍSTICO`, `PAGAMENTOS` (todas recebem linhas novas do mês). Esse é o dado que o Portal vai expor como "pendências do mês" assim que a influenciadora logar.

**Cuidado ao alterar:** a ordem das colunas passadas para `montarLinha()` não importa (é resolvido por nome via `getHeaderMap()`) — mas os **nomes das chaves do objeto** passadas (`INFLU_KEY`, `MES_REFERENCIA`, etc.) têm que bater exatamente com o cabeçalho real da aba, senão o campo fica em branco silenciosamente.
