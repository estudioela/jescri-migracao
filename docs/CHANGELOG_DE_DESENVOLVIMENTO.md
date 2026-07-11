# Changelog de Desenvolvimento — Projeto Tear (V2)

Registro objetivo por data. Mais recente no topo.

## 2026-07-10 — Verificação do Painel Admin + reconciliação documental

**Objetivo:** confirmar que a UI de Logística e a autenticação por `ADMIN_TOKEN`
estão concluídas e alinhar a documentação oficial ao estado real do código. **Sem
alteração de código** — apenas verificação e documentação.

**Verificação (código já existente, não reimplementado)**
- Auth: `_exigirAdmin` (Roteador.js) — `ADMIN_TOKEN` em `PropertiesService`, rate-limit
  (`SessaoRepository`) e comparação em tempo constante. Coberto por testes.
- UI: `view-logistica`/`view-ativacoes` (Templates.html), token-gated, lê backend real,
  entrada pelo login. Entrypoints `apiListarCiclosAdmin`/`apiListarLogisticaDoCiclo`/`apiAlterarStatusLogistica` gated.
- Item "Briefings" já resolvido em entrada anterior (removido de `cabecalhosV2_()`); nada a corrigir.
- `jest` — **486/486 verdes** (33 suítes), sem mudança.

**Documentação**
- `docs/spec/system_spec_v1.md`: marcado como **HISTÓRICO** (banner no topo) — descreve a
  arquitetura legada `mae/`, superada pela V2 (`tear/`). Não é mais fonte da verdade.
- `docs/PROJECT_STATUS.md`: módulo Logística → Painel Admin concluído (dev); bloqueio
  reclassificado como provisionamento de plataforma (`setupV2Database()` + `ADMIN_TOKEN`).

**Pendência sinalizada (fora deste escopo):** `FLOW.md` (raiz) também descreve o mundo
legado `mae/` — candidato a arquivamento numa limpeza futura.

## 2026-07-10 — CRUD de Ativações no Painel Admin + Planos_Colaboracao (V2)

**Objetivo:** estender o Painel Admin (já existente para Logística) à gestão de
Ativações — leitura e transição de estado cross-parceira — e completar o "chassi"
de schema com a aba `Planos_Colaboracao`. Mesma infra de `ADMIN_TOKEN`
(`_exigirAdmin`), sem reprojetar autenticação.

**Schema (`DevTools.cabecalhosV2_()`) — divergências não-bloqueantes resolvidas**
- `Ativacoes`: `INFLU_KEY` → `ID_Influenciadora`; adicionadas `Look_Referencia`
  e `Link_Briefing`. Cabeçalho agora casa com `CAMPOS_ATIVACAO` + `Estado_Derivado`
  (fórmula, última coluna). Alinhado a `docs/spec/SCHEMA_V2.md`.
- `Planos_Colaboracao`: adicionada ao setup (`ID_Plano`, `ID_Influenciadora`,
  `ID_Ciclo`, `Qtd_Entregaveis`, `Valor_Cache` = `CAMPOS_PLANO`).

**Back-end (dentro dos 10 arquivos — sem novos arquivos)**
- `Services.js`: `alterarEstadoComoAdmin` (sem posse) + `_transicionarEstado`
  (extraído de `alterarEstado`). `listarPorCiclo` já existia (cross-parceira).
- `Controllers.js`: ações `LIST_ALL_BY_CYCLE` / `CHANGE_STATE_ADMIN`;
  `handleAtivacaoUpdate` passou a despachar por ação (removido `_validarPayload`).
- `Roteador.js`: `apiListarAtivacoesAdmin`, `apiAlterarEstadoAtivacaoAdmin`
  (gate `_exigirAdmin`, reusam `_montarControllerDeAtivacao`).

**Front-end (Painel Admin — dados 100% reais, sem mock)**
- `Templates.html`: rota `ativacoes` + `view-ativacoes` (token-gated), lista de
  ativações do ciclo, seletor de ciclo, transição dos 13 `ESTADOS_ATIVACAO`,
  toasts; navegação cruzada logística ↔ ativações. Portal da influenciadora
  mantém o fallback de mock (degradação graciosa, decisão do usuário).

**Pendência manual (plataforma):** rodar `setupV2Database()` no editor Tear para
materializar `Planos_Colaboracao` e o schema corrigido de `Ativacoes`. `setupV2Database()`
**só grava cabeçalho em linha 1 vazia** — se a aba `Ativacoes` já existir com
`INFLU_KEY`, a linha 1 precisa de ajuste manual antes do cut-over (nenhum dado é
descartado pelo setup).

**Testes:** `jest` — 486/486 verdes (33 suítes; +11 na Ativação/entrypoints).

## 2026-07-10 — Auth Admin + UI do Painel Admin de Logística (V2)

**Objetivo:** expor a Logística ao Painel Admin, reutilizando a infra de
`ADMIN_TOKEN` já aprovada (`_exigirAdmin`) — sem reprojetar autenticação.

**Diagnóstico/limpeza de schema**
- Removida a aba legada `Briefings` de `DevTools.cabecalhosV2_()` (não existe em `SCHEMA_V2.md`).
- **Não bloqueantes registrados (não corrigidos — fora do escopo):** `Ativacoes` em
  `cabecalhosV2_()` usa `INFLU_KEY` (repo lê `ID_Influenciadora`; faltam
  `Look_Referencia`/`Link_Briefing`); `Planos_Colaboracao` ausente do setup.
  Latentes — quebram só no cut-over. Também: `Templates.html` tem `view-cadastro`
  e script de wizard **duplicados** (legado da consolidação).

**Back-end (dentro dos 10 arquivos — sem novos arquivos)**
- `Roteador.js`: `apiListarCiclosAdmin`, `apiListarLogisticaDoCiclo`, `apiAlterarStatusLogistica` (gate `_exigirAdmin`) + `_montarControllerDeLogistica`.
- `Controllers.js`: ações `LIST_ALL_BY_CYCLE` / `CHANGE_STATUS_ADMIN` (cross-parceira, sem posse).
- `Services.js`: `alterarStatusComoAdmin` + `_transicionarStatus` (extraído de `alterarStatus`).

**Front-end**
- `Templates.html`: rota `logistica` + `view-logistica` (token-gated), lista de envios,
  seletor de ciclo, atualização de status, **toasts** (`.tear-toast`); entrada
  "painel administrativo" no login.
- `Index.html`: contêiner `#tear-toast`.

**Pendência manual (bloqueio de plataforma):** `setupV2Database()` cria a aba
`Logistica` — roda dentro do Apps Script (`clasp run` não funciona, §6) e é ação
de produção (§12.4.4). Executar pelo editor do projeto Tear.

**Testes:** `jest` — 475/475 verdes (33 suítes; +9 na logística/entrypoints).

## 2026-07-10 — Módulo de Logística (V2, back-end)

**Objetivo:** implementar a Logística de envios como entidade persistida real
(aba `Logistica`), seguindo o padrão V2 (Repository/Entity/Service/Controller).
Sprint decidida pelo usuário: só Logística. Pagamento permanece derivado
(`PagamentoService`); Briefing permanece coluna (`Ativacoes.Link_Briefing`) — **não** viraram abas.

**Criados (dentro dos 10 arquivos consolidados — sem novos arquivos de back-end)**
- `Logistica` (entidade + máquina de estados) → `tear/Modelos.js`
- `LogisticaRepository` + `CAMPOS_LOGISTICA` → `tear/Repositories.js`
- `LogisticaService` (+ eventos `LogisticaEnviada`/`LogisticaStatusAlterado`) → `tear/Services.js`
- `LogisticaController` + `ACOES_LOGISTICA` → `tear/Controllers.js`
- `ESTADOS_LOGISTICA` + `PLANILHAS.LOGISTICA` → `tear/Infra.js`
- `test/tear-logistica.test.js` (28 testes: entidade, repositório, service, controller)
- Aba `Logistica` documentada em `docs/spec/SCHEMA_V2.md`; fluxo em `FLOW.md`

**Reconciliado**
- `DevTools.cabecalhosV2_()`: cabeçalhos de `Logistica` migrados do rascunho V1
  (`INFLU KEY`/`STATUS LOGISTICA`) para o schema V2 (`ID_Logistica`, `ID_Ciclo`, …).

**Automação:** `registrarEnvio()` = transição `Aguardando Envio → Enviado` + rastreio +
evento. **Disparo real de e-mail NÃO acoplado** — efeito externo, aguarda autorização (§12.4).

**Fora de escopo (registrado, não implementado):**
- UI de Logística (Painel Admin) + entrypoint `google.script.run` em `Roteador.js` — próximo incremento; levanta a questão de auth de admin (inexistente na V2).
- `DevTools.cabecalhosV2_()` ainda define a aba `Briefings`, que a decisão desta sprint diz **não** criar. `setupV2Database()` a criaria se executado — revisar antes do cut-over.

**Testes:** `jest` — 466/466 verdes (33 suítes).

## 2026-07-10 — Consolidação de arquivos + Wizard de cadastro de parceiras

**Objetivo:** reduzir 34 → 10 arquivos principais (fusão por camada) e implementar
cadastro/edição de parceiras em wizard de 3 passos com endpoints administrativos.

**Criados**
- `tear/{Infra,Modelos,Repositories,Services,Controllers,Roteador,DevTools}.js` (back-end fundido por camada)
- `tear/{Styles,Templates}.html` (front-end fundido)
- `test/tear-parceira.test.js` (8 testes: lookup/upsert, validação, gate admin)
- `docs/{SYSTEM_MAP,KNOWN_DECISIONS,CHANGELOG_DE_DESENVOLVIMENTO}.md`

**Removidos**
- Pastas `tear/{controllers,dominio,entrypoints,infra,operacoes,repositories,services}/` (24 arquivos)
- `tear/{styles_core,styles_theme,components_ui,components_nav,views,app}.html`

**Renomeados/fundidos:** nenhum nome de função ou classe alterado — só concatenação por camada.

**Principais funções alteradas/criadas**
- `ParceiroRepository`: +`buscarPorCampo`, +`upsert` (por cabeçalho físico), +`_todasAsLinhas`
- `ParceiroService` (novo), `ParceiroController` (novo)
- `Roteador`: +`_exigirAdmin` (extraído de `adminDefinirSenha`), +`apiBuscarParceira`, +`apiSalvarParceira`, +`_montarControllerDeParceiro`
- `DevTools.cabecalhosV2_()`: schema físico completo de `Parceiros_Influenciadoras` (+ abas Briefings/Logistica); `parceirosDaBaseV1`: migra todo histórico, ignora status
- Front (`Templates.html`): rota+`view-cadastro`, estado `WIZARD`, schema `CAMPOS_PARCEIRA`, navegação avançar/voltar, prefill por e-mail/CNPJ

**Testes:** `jest` — 438/438 verdes (32 suítes).

**Commits (branch `feat/segregacao-tear`)**
- `refactor(tear): funde back-end em 7 arquivos por camada`
- `refactor(tear): funde front-end em 3 arquivos (Index, Styles, Templates)`
- `feat(tear): wizard admin de cadastro de parceiras (Etapa 2)`
- `chore(tear): schema fisico completo de Parceiros + migracao de todo historico`
