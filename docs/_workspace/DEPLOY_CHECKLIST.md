# Checklist de Deploy e Rollback — Portal TEAR V2

FASE 6 pós-SPECs. Documento de apoio operacional (leitura + verificação),
não substitui `ADR-010-banco-oficial-do-portal.md` nem `PROJECT_GOVERNANCE.md`.
Levantamento feito por grep/leitura direta do código em `src/` e do binário
`clasp` instalado (`3.3.0`) nesta máquina — não por suposição.

## 1. Abas físicas exigidas pelo código

Toda aba é aberta via `abrirAba('NOME')` em `src/entrypoint/Portal.js`
(único ponto autorizado a tocar `SpreadsheetApp`). Lista confirmada por
grep em `Portal.js` e cruzada com `ADR-010` (que já enumera exatamente as
mesmas 8 abas) — não falta nenhuma:

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
**existe uma única chave hoje**, `SPREADSHEET_ID` (`src/shared/Config.js`,
`CONFIG_KEYS`). Não há outras chaves de configuração usadas por nenhuma
ACL/Service/Controller/Adapter — `AdaptadorDeCepBrasilApi`,
`VerificadorDeCredencialLegado` e o adaptador de rastreio manual não lêem
Script Properties.

| Chave           | Obrigatória | Valor esperado | Fail-fast se ausente? |
|-----------------|-------------|----------------|------------------------|
| `SPREADSHEET_ID`| Sim         | ID da planilha **nova** "Portal Ela" (ADR-010) — **nunca** o ID legado `1BTTQNbpT3qvndE7qnfOU_rBggWZgnIIFTr8qaT97sZY` | Sim — `getConfig` lança `Config ausente: "SPREADSHEET_ID"...` |

**Como verificar:** Apps Script Editor → Configurações do projeto (ícone de
engrenagem) → "Propriedades do script" → confirmar que `SPREADSHEET_ID`
existe e aponta para a planilha nova, não a antiga.

## 3. Checklist de pré-deploy

- [ ] **Script Properties provisionadas.** `SPREADSHEET_ID` existe no
      projeto Apps Script de destino e aponta para "Portal Ela" (planilha
      nova), não para o ID legado. Verificar: Editor → Configurações do
      projeto → Propriedades do script.
- [ ] **Todas as 8 abas físicas + cabeçalhos exatos existem na planilha
      alvo** (tabela da seção 1). Responsabilidade do operador (migração de
      dados, ADR-010), não do código. Verificar: abrir cada aba e comparar
      linha 1 com a lista acima, célula a célula.
- [ ] **`access` em `appsscript.json` — mantido `MYSELF` (revertido em
      2026-07-16 após tentativa de abertura).** Tentei trocar para
      `ANYONE_ANONYMOUS` (Parceiras não têm conta Google, autenticam via
      cupom+CNPJ) e revertido na mesma sessão ao encontrar o achado F5 da
      auditoria (`docs/_workspace/auditorias/AUDITORIA_SPEC012.md`): **toda
      função administrativa exposta em `Portal.js` via `google.script.run`
      (aprovar, publicar, enviar material, compilar mês e as novas de
      SPEC-002 — ativar/inativar, editar Condição Comercial) hoje não
      verifica papel/autorização nenhuma.** Com `access: MYSELF` isso é
      inofensivo (só o desenvolvedor executa). Abrir para `ANYONE_ANONYMOUS`
      sem essa camada exporia essas operações a qualquer chamador anônimo
      que descobrisse a URL — risco real de dado sendo alterado por quem
      não deveria. **Pré-requisito para reabrir:** um gate de
      autorização por papel nas funções administrativas do Entrypoint
      (decisão de modelo pertence a Q-08 — papéis da equipe — mas o gate
      em si, uma vez o modelo escolhido, é mecânico). Verificar este item
      novamente antes de qualquer deploy que pretenda expor Parceiras
      reais.
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
