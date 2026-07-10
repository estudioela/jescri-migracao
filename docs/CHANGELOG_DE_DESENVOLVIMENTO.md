# Changelog de Desenvolvimento — Projeto Tear (V2)

Registro objetivo por data. Mais recente no topo.

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
