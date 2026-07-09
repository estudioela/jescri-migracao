# SYSTEM_TRUTH.md — Estado real do sistema Jescri

> Documento único de verdade, consolidado em 2026-07-05 a partir de auditoria real (leitura completa do código, pull isolado do Apps Script ao vivo comparado byte-a-byte, execução real do QA Shadow). Não substitui `FLOW.md` (fluxos passo a passo) nem `SYSTEM_MAP.md` (mapa completo por aba) — é o resumo executivo que aponta pra eles. Baseline: tag `v1.0-stable`.

---

## 1. Visão geral

ERP + Portal de Influenciadoras Jescri: um único projeto Google Apps Script (`scriptId: 1fE8w10O3MwHvfa4gLgJvcUXD4HIWKNL0ar5YMmjzMamujRfwqiPfcLyK`), versionado em `mae/`, planilha `[JESCRI] INFLUÊNCIA 360º` como único banco de dados. `mae/Código.js` = ERP (menu, automações de planilha). `mae/WebApp.js` = backend do Portal (`doGet`; `doPost`/`API_ACOES` foram removidos em 2026-07-07, shim de API JSON nunca usado pelo `Index.html` real). `mae/Index.html` = front-end (SPA único). `mae/SchemaExporter.js` = schema vivo + checklist de integridade. `mae/QaShadow.js` = teste E2E de contrato sem tocar produção.

## 2. Fluxo de login (o mais crítico do sistema)

```
mae/Index.html:fazerLogin() (~L1068)
  → chamar('login', cupom, senha) (~L921, google.script.run)
  → mae/WebApp.js:login() (~L153)
      lê aba BASE DE DADOS (resolvida por getHeaderMap() desde 2026-07-07, ver seção 4)
      senha = prefixo do CNPJ (baixa entropia por design, não é bug)
      bloqueio: LOGIN_MAX_TENTATIVAS=5 / LOGIN_BLOQUEIO_SEGUNDOS=900 (CacheService)
  → token (UUID) em CacheService, 21600s (6h), renovação deslizante em validarToken()
```
Logout: `sairDoApp()` (Index.html) → `google.script.run.logout(token)` → `mae/WebApp.js:logout()` (~L223), fire-and-forget.

## 3. Dependências entre abas (quem lê/escreve o quê)

| Aba | Escreve | Lê | Observação |
|---|---|---|---|
| `BASE DE DADOS` | `onFormSubmit()`, `preencherEnderecoPorCEP()`, `updatePerfil()`, sidebar | `login()`, `getPerfil()`, `gerarNovoMesCompleto()` | `MAP.BASE` migrou de índice fixo para `getHeaderMap()` em 2026-07-07 — ver seção 4 |
| `CADASTROS` | Google Form externo (fora do repo) | `onFormSubmit()` | Zona de pouso bruta |
| `BRIEFING` | `gerarNovoMesCompleto()`, `onEdit()` (2 blocos), `sincronizarLooks()` | `getBriefing()` | Fallback de coluna pro campo RESUMO |
| `ATIVAÇÕES` | `gerarNovoMesCompleto()`, `onEdit()`, `finalizarEnvioResumable()` (só grava `"ajustes"`, fixo — corrigido 2026-07-06, era `"EM_APROVACAO"` e violava a validação de dados da célula) | `getPendencias()`, `getBriefing()`, upload | `STATUS_CONTEUDO`→`APROVADO`/`POSTADO` é **manual**, sem função de código |
| `PAGAMENTOS` | `gerarNovoMesCompleto()`, `lancarPagamentosDoMes()`, `onEdit()` (arquiva ao marcar "pago") | `getPagamentos()` | `STATUS_PAGAMENTO=PAGO` é **manual**; **não existe** derivação automática a partir de `STATUS_CONTEUDO` (achado corrigido nesta sessão, ver `FLOW.md`) |
| `FLUXO LOGÍSTICO` | `gerarNovoMesCompleto()`, `onEdit()`, `atualizarRastreiosBRComerce()` | `gerarMensagemRevisao()` | — |
| `HISTÓRICO_*` (3 abas) | `arquivarGenerico()` (automático via onEdit, ou manual via menu) | `getHistorico()`, `listarPeriodos()` | `HISTÓRICO LOGÍSTICO` não tem nenhuma leitura conhecida |
| Abas legado (nome variável) | nenhuma | `getHistorico()`, `listarPeriodos()` via `listarAbasHistoricoLegado()` | Detecção por assinatura de cabeçalho |

Detalhe completo por aba: `SYSTEM_MAP.md`. Fluxos passo a passo: `FLOW.md`.

## 4. Regra crítica — `MAP.BASE` (RESOLVIDA em 2026-07-07)

`mae/WebApp.js:MAP.BASE` migrou de índice fixo de coluna para `getHeaderMap()` (resolução por nome) — mesmo padrão já usado por `ATIVACOES`, `PAGAMENTOS`, `HISTORICO_*`, e por `onFormSubmit()` na própria `BASE DE DADOS`. `MAP.BASE` hoje só guarda `NOME_ABA`; `login()`, `getPerfil()`, `updatePerfil()`, `getInfluKeyByCupom()`, `getNomeInfluByCupomCached()` resolvem colunas por nome de cabeçalho:

```
INFLU_KEY, CUPOM, INFLUENCIADORA_RAZAO_SOCIAL, EMAIL, CHAVE_PIX,
INFLUENCIADORA_CNPJ, CEP, RUA, NUMERO, COMPLEMENTO, CIDADE, UF, VALOR_TOTAL
```

**Risco eliminado**: inserir ou remover uma coluna em `BASE DE DADOS` não quebra mais `login()`/`getPerfil()`/`updatePerfil()` silenciosamente — esse era o risco #1 documentado no sistema até esta correção (2026-07-07). A recomendação de migração que constava anteriormente nesta seção (índice fixo vs. `getHeaderMap()`) foi implementada; a comparação de trade-offs que existia aqui foi removida por não ser mais aplicável. O checklist de integridade do `SchemaExporter.js` continua existindo (não foi removido nesta correção), mas o problema que ele mitigava para `BASE DE DADOS` deixou de existir.

## 5. Riscos conhecidos (consolidado)

1. **(Resolvido em 2026-07-07)** `MAP.BASE` por índice fixo — migrado para `getHeaderMap()`, ver seção 4 acima.
2. `onFormSubmit()`/triggers instaláveis: dependem de configuração fora do código-fonte, não verificável por aqui.
3. `doGet(?mode=qa)`: ramo condicional no Web App público/anônimo, protegido por token em `PropertiesService` — sem token certo, comportamento padrão inalterado.
4. `clasp run` não funciona neste projeto — causa raiz documentada (devMode exige dono do script, `--nondev` bate em 404 sem causa oficial). Não repetir a investigação sem motivo novo — ver `CLAUDE.md` seção 6.
5. Deployment do Web App é **pinada por versão** (`@34` atualmente, atualizada em 2026-07-07 via `clasp deploy -i` — ver seção 6) — `clasp push` só atualiza HEAD; mudanças em `WebApp.js`/`Index.html` só chegam às influenciadoras com um `clasp deploy` explícito.
6. Não existe ambiente de staging técnico real (a planilha e o script são únicos) — as branches `staging`/`dev` (seção 6) organizam o **código**, mas o deploy continua sendo sempre contra a mesma planilha/produção.
7. **(Resolvido — histórico, não é mais um risco ativo) Drive API estava desabilitada no projeto GCP vinculado (`jescri-migracao`, nº `607782229022`)**: `appsscript.json` declara o escopo OAuth `https://www.googleapis.com/auth/drive`, mas a API (`drive.googleapis.com`) nunca tinha sido habilitada. Habilitada via `gcloud services enable drive.googleapis.com --project=jescri-migracao` em 2026-07-06 — confirmada habilitada e assim permanece.
   - **Hipótese levantada e depois REFUTADA por teste real (2026-07-06)**: inicialmente suspeitou-se que a autorização OAuth do deploy tivesse ficado presa num estado anterior à API habilitada (baseado em ausência de logs após o achado acima). **Essa hipótese foi testada e descartada**: um teste end-to-end real (login com credencial de teste dedicada + `iniciarEnvioResumable()` + upload de arquivo de fato no Drive, todos via chamada HTTP direta ao deployment ativo) mostrou `doGet`, `doPost`, `login()`, CORS, roteamento, e o próprio upload pro Drive funcionando perfeitamente. **Não havia problema de autorização.** A causa real do "Failed to fetch" era outra — ver item 8 abaixo. Lição pra próximos agentes: ausência de log recente não é prova de causa — só descarta hipóteses depois de reproduzir com teste real.
8. **(Corrigido em 2026-07-06) Causa raiz real do "Failed to fetch" no upload: valor gravado em `STATUS_CONTEUDO` violava a validação de dados da célula.** `finalizarEnvioResumable()` gravava `"EM_APROVACAO"` — fora da lista aceita pela validação da célula (`em aberto`, `falta drive`, `aprovado`, `ajustes`, `postado`, confirmado pelo texto literal do erro do Google Sheets). O `setValue()` era rejeitado no flush diferido da planilha, fora do alcance de qualquer try/catch do código, e o cliente recebia uma página de erro genérica do Apps Script em vez do JSON esperado — manifestando como "Failed to fetch". Comprovado com teste real: `iniciarEnvioResumable()` funcionou, o arquivo foi de fato gravado no Drive, só a gravação de status na planilha falhava. Corrigido gravando `"ajustes"` (decisão do usuário — dentro dos 5 valores já validados, nenhum valor novo adicionado à validação); `normalizarStatusAtivacao()` ajustada para reconhecer `"ajuste"` e continuar exibindo "Em aprovação" na UI (`EM_APROVACAO` continua sendo o nome do status normalizado/exibido, só o valor bruto gravado na célula mudou).
   - **Confirmação adicional (2026-07-06)**: reverificado nos logs — ainda não há evidência de reautorização feita (nenhuma chamada nova de `iniciarEnvioResumable` desde `01:12:55Z`, e a mensagem bruta do Google (`"Permission denied to enable service [drive]"`, com Help Token) confirma que é o **runtime do Apps Script** que não tem permissão pra auto-habilitar a API a partir de uma execução de Web App implantado — não é papel IAM da conta em `gcloud`. Reforça que só a reautorização manual resolve.
9. **(Corrigido em 2026-07-06) Trigger de tempo órfão chamando função removida**: achado via `clasp logs` — um trigger instalável (fora do código-fonte) ainda chamava `sincronizarBaseDeApoio()`, remanescente do mecanismo de "BASE DE APOIO" removido em 2026-07-05 (`CLAUDE.md` seção 6). Gerava `"Script function not found"` a cada ~10min desde então. Fix: `limparTriggersOrfaos()` (`mae/Código.js`, menu), remove qualquer trigger apontando pra função inexistente — ação manual, ainda não executada (precisa o usuário rodar pelo menu).

## 6. Estado de produção e versionamento

- **Tag baseline**: `v1.0-stable` (2026-07-05), consolidando: SchemaExporter, QA Shadow, limpeza do clasp duplicado, purga de legado do script ao vivo, correção do sub-fluxo `STATUS_CONTEUDO`/`STATUS_PAGAMENTO`.
- **Branches**: `main` (produção — ver ressalva abaixo sobre "imutável"), `staging`, `dev` — todas apontando pro mesmo commit na criação (2026-07-05); divergem a partir de agora conforme o uso de cada uma.
- **Deploy Apps Script**: HEAD e deployment pública sincronizados com `main` em 2026-07-07 (`@34`, "ERP 1.5"), após `clasp push` (verificado byte-a-byte via `clasp pull` em diretório temporário) + `clasp deploy -i` dos commits `111dea8`+`683f984` (suíte de testes Jest, fix de dupla formatação de data em `formatarData()`, migração de `MAP.BASE` para `getHeaderMap()`, remoção de `doPost`/`API_ACOES`, casamento de `BRIEFING` por `MES`+`ANO_REFERENCIA`, catches de `onEdit()`/`onFormSubmit()` agora logando, checklist do SchemaExporter por presença de nome). Mesma URL pública de sempre (deployment ID `AKfycbyBqxe6...` mantida, versão atualizada in-place). Nota: existia uma versão intermediária `@33` ("ERP 1.4") criada manualmente pelo usuário via UI em 2026-07-07, antes destas correções — superada pela `@34`. A coluna `ANO_REFERENCIA` em `BRIEFING` foi criada na planilha viva pelo usuário (menu, 2026-07-07) logo após o deploy.
- **Validação pós-deploy `@29`**: QA Shadow rodado manualmente na planilha real logo após o deploy `@29` (2026-07-05) — **aprovado, 0 falhas, 2896ms**. Confirma que os fixes de performance (cache de influKey/nome por cupom, remoção de lock em funções só-leitura, cache de abas legado, `onEdit()` saindo mais cedo) não quebraram o contrato validado pelo QA Shadow.
- **Validação E2E real pós-deploy `@32` (2026-07-06)**: fluxo completo testado via chamada HTTP direta ao deployment ativo, com credencial de teste dedicada (`JUCHIKA10`, autorizada pelo usuário exclusivamente para isso) — **aprovado em todas as etapas**:
  `login()` → `getPendencias()` → `iniciarEnvioResumable()` → upload real gravado no Drive (2 arquivos de teste criados) → `finalizarEnvioResumable()` (**sucesso, com o fix de `STATUS_CONTEUDO`**) → `getPendencias()` confirma status atualizado (`AGUARDANDO_MATERIAL` → `EM_APROVACAO`) → `getHistorico()` confirma que o item recém-enviado não aparece no histórico (correto — só migra pra lá com "postado" manual da equipe) → `logout()` → novo `login()` → status `EM_APROVACAO` persiste corretamente na nova sessão.
  QA Shadow **não foi rodado** nesta rodada (execução manual pela UI, fora do meu alcance) — recomendado antes de considerar o incidente 100% encerrado.
- **Convenção sugerida daqui pra frente**: experimentos em `dev` → validação em `staging` (sem deploy real, já que não há ambiente técnico separado — "validação" aqui é revisão de código/QA Shadow antes de ir pra `main`) → merge em `main` → só então `clasp push`/`clasp deploy`.

---

**Fontes**: `CLAUDE.md` (mapa técnico + zona proibida), `FLOW.md` (fluxos passo a passo), `SYSTEM_MAP.md` (mapa completo por aba), `docs/spec/system_spec_v1.md` (snapshot da sessão de auditoria).
