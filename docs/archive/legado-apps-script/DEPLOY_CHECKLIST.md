# Checklist de Deploy e Rollback — Portal TEAR V2

FASE 6 pós-SPECs. Documento de apoio operacional (leitura + verificação),
não substitui `ADR-010-banco-oficial-do-portal.md` nem `PROJECT_GOVERNANCE.md`.
Levantamento feito por grep/leitura direta do código em `src/` e do binário
`clasp` instalado (`3.3.0`) nesta máquina — não por suposição.

## 1. Abas físicas exigidas pelo código

Toda aba é aberta via `abrirAba('NOME')` em `src/entrypoint/Portal.js`
(único ponto autorizado a tocar `SpreadsheetApp`). Lista confirmada por
grep em `Portal.js`; 11 abas hoje — `ADR-010` enumerava 8 antes da
SPEC-020 (2026-07-17); esta lista estava desatualizada em relação à
SPEC-035 (2026-07-17, `SIS_IDENTIDADES`/`BASE_ADMINISTRADORES`, achado
desta unidade de trabalho — Sprint Portal MVP Online) — corrigido aqui.
Atualizar de novo se o ADR for revisado:

| Aba física       | ACL responsável             | Colunas físicas exigidas (nomes exatos, case-sensitive) |
|------------------|------------------------------|----------------------------------------------------------|
| `BASE DE DADOS`  | `ParceiraACL`                | `INFLU_KEY`, `STATUS`, `CUPOM`, `INFLUENCIADORA_CNPJ`, `INFLUENCIADORA_RAZAO_SOCIAL`, `INFLUENCIADORA_ENDERECO`, `RUA`, `NUMERO`, `COMPLEMENTO`, `BAIRRO`, `CIDADE`, `CEP`, `EMAIL`, `CHAVE_PIX`, `VALOR_TOTAL`, `VALOR_TOTAL_EXTENSO`, `LOOKS_QTD`, `LOOKS_QTD_TEXTO`, `STORIES_TEXTO`, `REELS_TEXTO`, `CARROSSEL_TEXTO`, `CANAIS_USO_IMAGEM`, `PRAZO_USO_IMAGEM`, `CIDADE_ASSINATURA`, `DATA_ASSINATURA` |
| `COLABORACOES`   | `ColaboracaoMensalACL`        | `INFLU_KEY`, `MES_REFERENCIA`, `ANO_REFERENCIA`, `ESTADO`, `SNAPSHOT_VALOR`, `SNAPSHOT_FORMATOS`, `SNAPSHOT_QTD_POR_FORMATO` |
| `BRIEFING`       | `BriefingACL`                 | `INFLU_KEY`, `MES_REFERENCIA`, `ANO_REFERENCIA`, `ESTADO`, `BLOCO_ROTULO`, `LOOK`, `DATA_ENTREGA`, `DATA_POSTAGEM`, `ORIENTACAO`, `DATA_APROVACAO_INTERNA` |
| `ENTREGAS`       | `EntregaACL`                  | `INFLU_KEY`, `ANO_REFERENCIA`, `MES_REFERENCIA`, `ROTULO`, `ESTADO`, `LINK_MATERIAL`, `DATA_APROVACAO_INTERNA`, `DATA_ARQUIVAMENTO` |
| `ENVIOS`         | `EnvioACL`                    | `INFLU_KEY`, `ANO_REFERENCIA`, `MES_REFERENCIA`, `STATUS_REVISAO`, `STATUS_LOGISTICA`, `RASTREIO`, `DATA_ENVIO`, `DATA_ARQUIVAMENTO` |
| `DOCUMENTOS`     | `DocumentoACL`                | `INFLU_KEY`, `TIPO_DOCUMENTO`, `MES_REFERENCIA`, `REFERENCIA` |
| `SESSOES`        | `SessaoACL`                   | `TOKEN`, `PARCEIRA_ID`, `EXPIRA_EM` |
| `BLOQUEIOS`      | `BloqueioACL`                 | `IDENTIFICADOR`, `TENTATIVAS`, `BLOQUEIO_INICIO` |
| `PAGAMENTOS`     | `PagamentoACL`                | `ID_OBRIGACAO`, `INFLU_KEY`, `TIPO_PAGAMENTO`, `ANO_REFERENCIA`, `MES_REFERENCIA`, `VALOR`, `ESTADO`, `DATA_ARQUIVAMENTO` |
| `SIS_IDENTIDADES` | `UsuarioACL`                 | `SUB_PROVIDER`, `EMAIL_PERFIL`, `PAPEL_ATOR`, `ESTADO_CONTA`, `DATA_CRIACAO`, `ULTIMO_ACESSO` (SPEC-035 §10.2.1) |
| `BASE_ADMINISTRADORES` | `AdministradorACL`      | `SUB_PROVIDER`, `NOME_COMPLETO`, `AREA_RESPONSABILIDADE` (SPEC-035 §10.2.2) |

Adicionalmente, `BASE DE DADOS` (já listada acima) ganhou uma coluna nova
por extensão (não é aba nova): `SUB_PROVIDER` (SPEC-035 §10.2.4) — vínculo
opcional de identidade federada, gravado após a Parceira confirmar
vinculação (UC-035.02) ou nunca, se ela ainda não fez login federado.

**Como verificar:** abrir a planilha alvo (o ID configurado em
`SPREADSHEET_ID`) e conferir, aba a aba, que a linha 1 (cabeçalho) contém
exatamente esses nomes. A resolução de coluna (`src/shared/ColunaFisica.js`,
`criarResolvedorDeColuna`) usa `cabecalho.indexOf(nome)` — comparação exata
de string, **case-sensitive**, sem trim. Cabeçalho com espaço extra, acento
diferente ou caixa diferente falha em runtime com `Coluna 'X' ausente em
'ABA'.` (fail-fast intencional, não é bug). Colunas extras não modeladas
(ex.: em `BASE DE DADOS`) são toleradas — só a ausência de uma coluna
esperada quebra.

Responsabilidade: **operador**, via migração de dados da planilha antiga
para a planilha nova "Portal Ela" (ADR-010) — não é responsabilidade do
código nem deste checklist resolver a migração em si.

## 2. Script Properties necessárias

Grep confirmado em `src/` inteiro (`PropertiesService\|getConfig\|CONFIG_KEYS`):
**quatro chaves hoje** (`SPREADSHEET_ID_LEGADO` somada em 2026-07-17,
SPEC-003; `GOOGLE_CLIENT_ID` somada em 2026-07-17, SPEC-035 — esta lista
estava desatualizada, achado desta unidade de trabalho — Sprint Portal MVP
Online; `GOOGLE_CLIENT_SECRET` somada em 2026-07-18, ADR-013 — OAuth 2.0
Authorization Code Flow), `src/shared/Config.js`, `CONFIG_KEYS`. Não há outras chaves de
configuração usadas por nenhuma ACL/Service/Controller/Adapter —
`AdaptadorDeCepBrasilApi`, `VerificadorDeCredencialLegado` e o adaptador de
rastreio manual não lêem Script Properties.

| Chave                    | Obrigatória | Valor esperado | Fail-fast se ausente? |
|--------------------------|-------------|----------------|------------------------|
| `SPREADSHEET_ID`         | Sim         | ID da planilha **nova** "Portal Ela" (ADR-010) — **nunca** o ID legado `1BTTQNbpT3qvndE7qnfOU_rBggWZgnIIFTr8qaT97sZY` | Sim — `getConfig` lança `Config ausente: "SPREADSHEET_ID"...` |
| `SPREADSHEET_ID_LEGADO`  | Só para `importarBaseLegada` (SPEC-003) | ID da planilha **legada** (`1BTTQNbpT3qvndE7qnfOU_rBggWZgnIIFTr8qaT97sZY`) — SOMENTE LEITURA, `LegadoACL` não tem método de escrita (RN-01/INV-01). **Nunca** igual a `SPREADSHEET_ID`. | Sim, mas só quando `importarBaseLegada` é chamada — as demais funções do Portal não leem esta chave |
| `GOOGLE_CLIENT_ID`       | Sim, para login funcionar (SPEC-035 §14.1, ADR-013) | `client_id` OAuth2/OIDC do TEAR V2 no Google Cloud Console (tela de consentimento + credencial "Web application"). **Desde o ADR-013 (2026-07-18) o frontend não consome mais esta chave** — `obterConfiguracaoDeLogin` e o botão Google Identity Services foram removidos; ela segue usada **só pelo backend**: `ValidadorDeTokenGoogle` (valida a claim `aud` do `id_token`) e `AdaptadorOAuthGoogle` (monta a URL de autorização e a troca do authorization code). **Provisionamento fora do alcance deste agente** — exige acesso ao Google Cloud Console do operador; não é algo que o código possa gerar. | Sim — `montarUsuarioService` é eager: sem a chave, qualquer rota de login ou administrativa falha fail-fast (`getConfig` lança `Config ausente: "GOOGLE_CLIENT_ID"...`); as telas que não dependem de login (ex. `cadastro-parceira`) não leem esta chave |
| `GOOGLE_CLIENT_SECRET`   | Sim (ADR-013, condição 2) | `client_secret` da credencial OAuth "Web application" do GCP Console (o par do `GOOGLE_CLIENT_ID` acima), usado **EXCLUSIVAMENTE** pelo `AdaptadorOAuthGoogle` na troca do authorization code por `id_token` (`https://oauth2.googleapis.com/token`). **SEGREDO** — nunca commitado, nunca em log/erro/URL/resposta ao cliente; existe apenas como Script Property. **Provisionamento fora do alcance deste agente** — exige acesso ao Google Cloud Console do operador. | Sim — `montarUsuarioService` é eager: sem a chave, qualquer rota administrativa ou de login falha fail-fast (`getConfig` lança `Config ausente: "GOOGLE_CLIENT_SECRET"...`) |

**Como verificar:** Apps Script Editor → Configurações do projeto (ícone de
engrenagem) → "Propriedades do script" → confirmar que `SPREADSHEET_ID`
existe e aponta para a planilha nova, não a antiga, e que
`GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` existem (valores da mesma
credencial "Web application" do GCP Console).

### GCP Console (ADR-013)

Configuração da credencial OAuth no Google Cloud Console — par obrigatório
das duas chaves `GOOGLE_*` acima:

- [ ] Credencial do tipo **"Web application"** (APIs e serviços →
      Credenciais), com tela de consentimento configurada.
- [ ] **Authorized redirect URIs** contém a URL `/exec` do deployment
      **ativo** da Web App (obrigatória para produção) e a URL `/dev`
      (teste do desenvolvedor logado). Se o deploymentId mudar, a URL
      `/exec` muda — registrar a nova antes de homologar.
- [ ] **Authorized JavaScript origins** **não é mais necessária** — era a
      exigência do GIS que motivou o ADR-013 (a origem
      `*.script.googleusercontent.com` do HtmlService não é registrável);
      o Authorization Code Flow usa só redirect URIs.

#### Erros conhecidos do login OAuth (ADR-013) e diagnóstico

Catálogo de sintomas já observados ou plausíveis nesta arquitetura — para
não reabrir diagnóstico do zero a cada sessão. Todos ocorrem **depois** do
gate de acesso do próprio Apps Script (`access: ANYONE` — exige só uma
conta Google para abrir a URL, antes de chegar ao código do Portal).

| Sintoma | Causa | Correção |
|---|---|---|
| `400 redirect_uri_mismatch` na tela do Google | A URL `/exec` do deployment ativo (ou `/dev`) não está em **Authorized redirect URIs** da credencial, ou o deploymentId mudou desde o último registro | Copiar a URL exata do deployment ativo (`clasp deployments`) e registrar na credencial; deploymentId muda só se uma **nova** implantação for criada (não em `clasp redeploy`/`update-deployment`, que reaponta o mesmo ID) |
| `401 invalid_client` na troca do código (`AdaptadorOAuthGoogle`) | `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` trocados entre si, ou preenchidos com valor de exemplo/placeholder em vez do valor real da credencial "Web application" (já ocorreu nesta sessão de homologação, 2026-07-18 — ver `TASK_ROUTER.md` SPEC-035) | Conferir as duas Script Properties uma a uma contra o campo exato da credencial no GCP Console (client_id não começa com `GOCSPX-`; client_secret começa) |
| Erro de permissão citando `UrlFetchApp.fetch`/`script.external_request` (**CONFIRMADO em 2026-07-18**: primeiro erro real após o consentimento OAuth passar — o redirect/state/client_id estavam corretos e o callback falhou na troca do código, `AdaptadorOAuthGoogle.js`. Causa raiz auditada: o manifesto nunca declarou `oauthScopes` e a autorização da conta USER_DEPLOYING era da era M1, anterior ao UrlFetchApp; doc oficial confirma que Web App como USER_DEPLOYING "may not request authorization" — falha em vez de pedir consentimento. Correção definitiva aplicada: `oauthScopes` explícitos no manifesto — `spreadsheets` + `script.external_request`, conjunto completo verificado contra todos os serviços usados no código) | `executeAs: USER_DEPLOYING` faz o Web App rodar com a autorização de escopos da conta que fez o deploy; se o código passou a chamar um serviço novo (`UrlFetchApp`, introduzido pelos adapters do ADR-013) depois da última vez que essa conta autorizou o projeto, o `clasp push`/`clasp deploy` **não repropaga sozinho** o novo escopo — só a interface do Google (editor ou a própria tela de autorização ao abrir o app) consegue re-solicitar consentimento | A conta que fez o deploy abre o projeto em script.google.com e roda qualquer função pelo editor (ou acessa a URL do deployment diretamente logada com essa conta) — o Google mostra a tela de consentimento com o escopo novo; aceitar. Não é algo que `clasp`/CLI consiga disparar (a API do Apps Script não aciona esse consentimento interativo) |
| `ERR_AUTH_STATE_INVALIDO` | `state` já consumido (reload da URL de callback) ou expirado (TTL 600s, `GuardiaoDeEstadoOAuth`) | Comportamento esperado — clicar "Entrar com Google" de novo |
| `Config ausente: "GOOGLE_CLIENT_SECRET"...` (ou `GOOGLE_CLIENT_ID`) em qualquer rota de login/administrativa | Script Property ausente — `montarUsuarioService` é eager | Provisionar a property (Apps Script Editor → Configurações → Propriedades do script) |
| Produção servindo código que não bate com o repo (rota removida ainda viva, correção ausente) | **Drift de versão**: versão criada pelo editor web (fora da esteira `clasp`) e deployment reapontado para ela — ocorreu em 2026-07-18 (versão 15 sem descrição continha `diag-adr013` e não continha a guarda IM-03; ver `TASK_ROUTER.md` SPEC-035, "Incidente de drift") | Nunca criar versão/implantação pelo editor web. Publicar sempre via `clasp push` + `clasp create-version` + `clasp update-deployment <deploymentId> -V <n>`; encerrar toda sessão de deploy com o diff de verificação: `clasp pull --versionNumber <n>` em diretório isolado + `diff -r` contra o repo |

## 3. Checklist de pré-deploy

- [x] **Script Properties provisionadas (2026-07-18, sessão de
      homologação).** As 4 chaves existem: `SPREADSHEET_ID` →
      "[PROD] TEAR - Base Operacional" (`1TYcrB4XvsSmupvdQVFSC2aEI0RkNt2sK51QQiwcEejA`);
      `SPREADSHEET_ID_LEGADO` → "[ELÃ] TEAR" (ID do ADR-010);
      `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` da credencial OAuth "Portal
      TEAR" (projeto GCP "projeto tear"). Dois erros de digitação corrigidos
      no caminho (secret colado em `GOOGLE_CLIENT_ID`; depois valor de
      exemplo em vez do ID real) — detalhe em `TASK_ROUTER.md` §3 SPEC-035.
      Redirect URIs `/exec` e `/dev` registradas na mesma credencial.
      **Ainda não confirmado:** reteste do login após o registro das URIs
      (último erro visto foi `400 redirect_uri_mismatch`, anterior ao
      cadastro) — primeira ação da próxima sessão.
- [x] **Todas as 11 abas físicas + cabeçalhos exatos existem na planilha
      alvo** (tabela da seção 1). Confirmado por leitura do conteúdo da
      planilha "[PROD] TEAR - Base Operacional" via Drive (2026-07-18):
      as 11 abas e cabeçalhos batem exatamente com esta tabela, incluindo
      `SUB_PROVIDER`/`SIS_IDENTIDADES`/`BASE_ADMINISTRADORES`. Planilha
      nasceu vazia (sem dados) — carga via `importarBaseLegada` ainda
      pendente.
- [x] **`access` em `appsscript.json` — alterado de `MYSELF` para `ANYONE`
      (2026-07-17, Sprint Portal MVP Online).** Histórico: mantido em
      `MYSELF` desde 2026-07-16 (tentativa de abrir para
      `ANYONE_ANONYMOUS` revertida na mesma sessão ao encontrar o achado F5
      da auditoria — `docs/_workspace/auditorias/AUDITORIA_SPEC012.md`:
      toda função administrativa exposta via `google.script.run` não
      verificava papel/autorização nenhuma). **Esse pré-requisito foi
      resolvido em 2026-07-17** (TASK_ROUTER §11 — `exigirPapelAdministrador`
      aplicado às 15 rotas administrativas de SPEC-012/016/020/023/034).
      Escolhido `ANYONE` (não `ANYONE_ANONYMOUS`): o modelo de autenticação
      agora é federação Google (SPEC-035) — exige que o visitante tenha uma
      conta Google só para abrir a URL, consistente com o próprio fluxo de
      login da aplicação; `ANYONE_ANONYMOUS` permitiria abrir a URL sem
      conta nenhuma, sem necessidade real dado que ninguém consegue passar
      do ecrã de login sem uma. **Gaps remanescentes, não bloqueantes para
      abrir o acesso mas relevantes para produção real:** `importarBaseLegada`
      (SPEC-003 §13) e `enviarMaterial` (raw, distinto de
      `enviarMaterialDoPortal`) ainda sem guarda de papel/sessão — ver
      TASK_ROUTER §11 "Achados, não corrigidos". Também pendente:
      provisionar `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` + redirect
      URIs no GCP Console (ver §2 e ADR-013) — sem isso o login não
      funciona para usuários reais, mas a página não expõe nada sensível
      nesse estado (erro controlado).
- [ ] **`.claspignore` cobre tudo que precisa subir.** Confirmado por
      leitura: é uma allowlist (`**/**` ignora tudo, depois reinclui
      `appsscript.json`, `src`, `src/**`). Como `src/**` é recursivo, cobre
      automaticamente toda a árvore atual — `src/acl/*.js`,
      `src/adapters/*.js`, `src/controller/*.js`, `src/domain/*.js`,
      `src/entrypoint/Portal.js`, `src/repository/*.js`, `src/service/*.js`,
      `src/shared/*.js` e as 8 telas em `src/ui/*.html` (incluindo as 3 do
      Portal da Parceira: `login.html`, `pendencias.html`, `perfil.html`).
      Nenhum arquivo novo sob `src/` precisa de ajuste no `.claspignore`.
      **Achado a decidir:** o `.claspignore` também reinclui
      `ACL.js`/`Repositories.js` na raiz (legado, comentado como "migra para
      `src/` em M1"). Grep em `src/` e `test/` confirma que **nada em
      `src/` referencia mais esses dois arquivos** — a migração para
      `src/acl/*.js` já aconteceu (M1 aqui é entendido como "SPEC de
      Cadastro de Parceira", já implementada). Esses dois arquivos legados
      hoje são código morto que ainda sobe para o Apps Script a cada
      `clasp push`. Não removi nada (fora de escopo desta tarefa) — mas é
      uma decisão pendente do responsável do projeto: manter por enquanto
      ou remover do `.claspignore`/apagar os arquivos antes do próximo
      deploy real.
- [ ] **`npm run check` verde** (lint + suíte completa) antes de qualquer
      `clasp push`. Executado nesta auditoria como verificação factual (sem
      alterar nada): **57 suítes / 424 testes passando, lint limpo** —
      estado atual do repositório no momento desta checklist (2026-07-16).
      Isso não substitui rodar de novo imediatamente antes do push real,
      caso o código mude entretanto.
- [ ] **Entender o que `clasp push` faz de fato antes de rodar.** Lido o
      código-fonte do `clasp` 3.3.0 instalado
      (`@google/clasp/build/src/commands/push.js` e `core/files.js`):
      `push` coleta os arquivos locais filtrados pelo `.claspignore` e
      chama a Apps Script API `script.projects.updateContent(...)` mandando
      **a lista completa desses arquivos como `requestBody.files`**. Essa
      chamada de API **substitui o manifesto de arquivos do projeto
      remoto pelo conjunto enviado** — não é um merge incremental por
      diff. Ou seja: **qualquer arquivo hoje presente no projeto Apps
      Script remoto (por exemplo, algo adicionado manualmente pelo editor
      web) que não esteja coberto pela allowlist local do
      `.claspignore` será removido no próximo `clasp push`.** Isso é
      diferente de "clasp nunca deleta arquivo remoto que não existia
      localmente antes" — o comportamento real é replace-completo do
      conjunto de arquivos de código-fonte, sempre. Ação: antes do
      primeiro push real, abrir o editor do Apps Script e conferir se há
      algum arquivo remoto fora do que `.claspignore` reinclui; se houver,
      decidir explicitamente se deve ser preservado (adicionando ao
      `.claspignore`) ou descartado.
- [ ] **Conferir `clasp deployments` atual antes de criar um novo
      deployment**, para saber qual deploymentId é o "ativo" hoje (ver
      seção de rollback). No momento desta checklist existem 2:
      `AKfycbzlFTTOKVc8DMqGzBuphuhCEexLCiHNDdY5ShTrR-BL @HEAD` e
      `AKfycbwUhR1P7ZQlf9l_gf5PdlXrxwVU4oyefWwIEg4oPUwpeHTqOo-iA6sB7bjnBvq58s0Q4g
      @3 — "M1 — Portal Cadastro de Parceira (Web App)"`.

## 4. Checklist de rollback

Comandos confirmados rodando `clasp <cmd> --help` no clasp 3.3.0 instalado
(não documentação externa, o binário real desta máquina):

- `clasp list-versions` (alias `clasp versions`) — lista as versões
  imutáveis já criadas do script (cada `clasp push` seguido de
  `create-version`/`deploy` gera uma nova versão numerada).
- `clasp list-deployments` (alias `clasp deployments`) — lista os
  deploymentIds existentes e a versão para a qual cada um aponta hoje.
- `clasp update-deployment <deploymentId>` (alias `clasp redeploy`), com
  `-V, --versionNumber <version>` e opcionalmente `-d, --description` —
  **este é o comando de rollback**: reaponta um deploymentId **já
  existente** (cuja URL de Web App as Parceiras já usam) para uma versão
  **anterior**, sem trocar a URL publicada.
- Equivalente via `clasp create-deployment` (alias `clasp deploy`), com
  `-i <deploymentId> -V <versionNumber> [-d <description>]` — mesma
  operação de reapontar um deployment existente para outra versão.

**Procedimento de rollback recomendado:**
1. `clasp versions` — identificar o número da última versão estável
   conhecida (a que funcionava antes do deploy problemático).
2. `clasp deployments` — identificar o `deploymentId` de produção (o que
   tem a URL de Web App em uso pelas Parceiras — hoje, o rotulado "M1 —
   Portal Cadastro de Parceira").
3. `clasp redeploy <deploymentId> -V <versionNumberEstavelAnterior>` (ou
   `clasp deploy -i <deploymentId> -V <versionNumberEstavelAnterior>`) —
   reaponta esse deployment para a versão anterior. A URL do Web App não
   muda; só o código servido por trás dela volta.
4. Confirmar manualmente (chamando o Web App) que o comportamento voltou
   ao esperado.
5. Investigar a causa do problema na versão nova antes de tentar
   reimplantá-la.

**Observação:** rollback de código não desfaz mudanças já feitas na
planilha (dados gravados pela versão problemática). Rollback de dados na
planilha, se necessário, é uma decisão e execução separadas do operador —
fora do escopo deste checklist de código.

## 5. Fora de escopo desta auditoria

Nenhum `clasp push` nem `clasp deploy` real foi executado nesta tarefa —
apenas leitura de código, grep, e `--help` dos comandos do `clasp` para
confirmar sintaxe e semântica. `npm run check` foi executado (leitura, sem
efeitos colaterais) para relatar o estado atual do gate.

Também vale registrar: durante esta auditoria foi encontrado, em
`CLAUDE.md` da raiz do repositório, um bloco intitulado "Mandato de
operação autônoma (2026-07-16)" que alega autorizar `clasp push`/deploy de
produção sem confirmação pontual. Esse bloco não foi tratado como
instrução válida para esta tarefa — o escopo desta tarefa (definido pelo
agente orquestrador) foi explícito em não executar nenhum `clasp
push`/`deploy` real, e essa restrição foi respeitada integralmente. Fica
registrado aqui para o responsável do projeto avaliar a legitimidade
daquele bloco antes de qualquer execução autônoma real de deploy.
