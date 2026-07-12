# INVENTÁRIO DO LEGADO

> Catálogo de consulta do acervo em `legado_referencia/`. **Nada aqui é código,
> migração ou refatoração** — apenas classificação bibliotecária do que existe.
> A pasta é biblioteca de consulta; nenhum item retorna ao TEAR V2 sem decisão
> explícita e reescrita conforme o Contrato Soberano.
> Data: 2026-07-12.

**Descoberta central:** existem **dois** sistemas legados sobre domínios próximos:
- **`mae/`** — *ERP INFLUÊNCIA 360º V6.2*, código de produção que opera sobre a
  planilha `[JESCRI] INFLUÊNCIA 360º` — **a mesma do Contrato Soberano V2**
  (mesmas abas: BASE DE DADOS, BRIEFING, FLUXO LOGÍSTICO, ATIVAÇÕES, PAGAMENTOS,
  HISTÓRICO…). É o legado **mais próximo** do novo TEAR.
- **`tear/`** — reescrita V2 em estilo DDD, porém amarrada a **outra** planilha e a
  um schema V1 (`ID_Ciclo`, `Parceiros_Influenciadoras`) que a ADR-001 já superou.

---

## 1. Reutilizar como regra de negócio

> Descrição apenas — **não copiar**. Reescrever conforme ACL/ADR-001 quando chegar a vez.

| Arquivo (legado) | Função / bloco | Finalidade (regra de negócio) | Quando reutilizar |
|---|---|---|---|
| `mae/Código.js` | `gerarNovoMesCompleto()` | **O "Compilador do Mês" real** sobre a planilha oficial: gera Briefing/Ativações/Logística/Pagamentos do mês | Ao implementar o caso de uso Compilador do Mês |
| `mae/Código.js` | `lancarPagamentosDoMes()`, `gerarSolicitacaoPagamento()` | Geração de pagamentos e da solicitação/mensagem de PIX | Caso de uso Pagamentos |
| `mae/Código.js` | `arquivarGenerico()`, `arquivarFluxo()`, `menuArquivarTudo()` | Arquivamento de competência → abas HISTÓRICO (com `DATA_ARQUIVAMENTO`) | Caso de uso Arquivamento |
| `mae/Código.js` | `parseMesAno()` | Parsing de mês/ano da grafia real da planilha | Ao materializar `MesReferencia` (VO) |
| `mae/Código.js` | Espelhamento Ativações→Briefing, "Inteligência de CEP" | Deriva briefing a partir de ativações; completa endereço por CEP | Briefing e enriquecimento de endereço na promoção |
| `mae/WebApp.js` | `login()`, `validarToken()`, `LOGIN_MAX_TENTATIVAS`/bloqueio | Autenticação do portal da influenciadora (cupom+senha, rate-limit) | Portal / autenticação |
| `mae/WebApp.js` | `normalizarStatusAtivacao()`, `normalizarStatusPagamento()` | Coerção dos status crus → canônicos (evidência direta para a ACL) | Reforço da tabela de Enums (ADR-001 §2) |
| `mae/WebApp.js` | `getPendencias/getBriefing/getPagamentos/getHistorico`, `idAtivacaoSeguro`, envio *resumable* | Leituras por mês e upload seguro de material | Casos de uso do portal |
| `mae/WebApp.js` | `getInfluKeyByCupom*`, `getNomeInfluByCupomCached` | Resolução `CUPOM → INFLU_KEY` (identidade) | ACL de identidade / login |
| `mae/SchemaExporter.js` | `gerarSchemaPlanilha()`, `calcularHashEstado()`, `normalizarCabecalhoIntegridade()` | Gera mapa vivo e hash de integridade do cabeçalho da planilha oficial | Guarda-corpo automático contra mudança de colunas |
| `mae/SidebarBackend.js` | `salvarDadosSidebarV2`, `salvarPagamentoExtra` | CRUD admin de influenciadora (curadoria de fee/entregáveis) | Promoção / edição de Parceira |
| `tear/Modelos.js` | `criarSenhaHash()`, `senhaConfere()` (`salt$hash`) | Mecanismo de senha V2 (abandona senha=prefixo CNPJ) | Autenticação segura |
| `tear/Services.js` | `PagamentoService` (elegibilidade) | Regra "elegível só quando nenhuma entrega pendente" | Caso de uso Pagamentos |
| `tear/Services.js` | `ParceiroService`, `CANDIDATOS_CADASTRO`, `_cnpjDeCadastroValido_` | Validação e promoção `CADASTROS → BASE` | Caso de uso Promoção (ADR-001 §4) |
| `tear/Services.js` | `DIAS_ANTECEDENCIA_APROVACAO` (7 dias) | Prazo de aprovação antes da entrega | Regras de Ativação/Briefing |
| `tools/ExportadorDeDados.js` | `filtrarInfluenciadorasAtivas`, `mapearParceiros`, `montarPacote` (puras) | Filtros/mapeamentos puros de dados de parceira/pagamento | Importações/backfills pontuais |

## 2. Reutilizar como referência

> Consulta — não são fonte de verdade (essa é a planilha). Úteis para entender intenção.

| Onde | Por que é útil |
|---|---|
| `docs/spec/SCHEMA_V2.md` | Racional do schema e máquinas de estado que originaram os Enums |
| `docs/EVENT_CATALOG.md`, `docs/USE_CASES.md` | Vocabulário de eventos e casos de uso — base do DOMAIN_MODEL_V2 |
| `docs/KNOWN_DECISIONS.md`, `docs/DOMAIN_DECISIONS.md`, `docs/INVARIANTS.md` | Decisões históricas e invariantes a preservar |
| `docs/CORE_DOMAIN.md`, `docs/DOMAIN_MODEL.md` | Modelagem anterior do domínio |
| `docs/GUIA_OPERACIONAL_TEAR.md`, `docs/auditoria/01…06_*.md` | Como o negócio opera de ponta a ponta (fonte de regras tácitas) |
| `docs/PLANO_DE_TESTES_QA.md` | Cenários de QA reaproveitáveis |
| `docs/PLANILHA_TEAR_1.0_MAPA.md`, `docs/MIGRATION_AUDIT.md` | Comparação V1↔V2, útil em backfills |
| `DOCUMENTOS TEAR/MK 01–05` | Modelos operacional/funcional/técnico e plano de reconstrução |
| `_workspace/{arquitetura,benchmark,inventario,migracao,planos}` | Arquitetura do conhecimento, matriz de migração e responsabilidades |
| `design-system/`, `docs/design-reference/`, `stitch_1_v2/` (14 mockups `code.html`) | Referência visual/UX do portal e do ERP |
| `test/` (52 suítes) | **Especificação executável** do comportamento antigo — melhor fonte de regras precisas |
| `mae/legacy/README.md`, `tools/migracao-tear/README.md` | Contexto de recuperação e da migração V1→V2 |

## 3. Obsoleto

> Uma frase por item: por que **não** deve voltar ao TEAR V2.

- `tear/Repositories.js` (contratos `CAMPOS_CICLO`/`CAMPOS_PLANO`, `CicloRepository`, `PlanoRepository`) e testes `tear-ciclo*.test.js`, `tear-ciclos.test.js`, `tear-plano-colaboracao.test.js` — pertencem à arquitetura de CICLOS/PLANO que a ADR-001 eliminou.
- `AuditoriaSync.js` — sincroniza a planilha V1 `[ELÃ]` com a JESCRI; o próprio ERP declara que "não há mais sync/espelho com planilha externa".
- `tools/migracao-tear/DataSeed.js` + `Importador.js` — seed e import V1→V2 de uso único, com chave corrompida (`ID` = ON/OFF); migração já conceitualmente encerrada.
- `tools/processador.js` — script CSV local ad-hoc para conversão pontual, sem valor recorrente.
- `node_modules/`, `package-lock.json` — artefatos regeneráveis, não são conhecimento.
- `MAE_APPS_SCRIPT.zip`, `TEAR_APPS_SCRIPT.zip` — snapshots empacotados redundantes com o código-fonte já presente.
- `SYSTEM_MAP.md`, `SYSTEM_TRUTH.md` (cópias na raiz do legado) — retratos de estado de um sistema que não é mais o vigente.

## 4. Dúvidas

> Sem decisão — apenas sinalização de valor incerto.

- **`tear/` inteiro vs `mae/`:** qual é o predecessor "verdadeiro"? `mae` opera na planilha oficial; `tear` é uma reescrita DDD amarrada a outra planilha. Há sobreposição de regras — indefinido qual prevalece como fonte de reúso.
- **`mae/QaShadow.js`** ("camada E2E invisível") — utilidade para o V2 incerta.
- **`mae/PortalUi.gs` vs `PortalUi.js`** (duplicados) — qual é a versão canônica?
- **`stitch_1_v2/` vs `design-system/` vs `docs/design-reference/`** — três fontes de UI; qual direção visual é a atual?
- **Geração "por extenso"** (`VALOR_TOTAL_EXTENSO`, `LOOKS_QTD_TEXTO`) — não encontrada no código; provavelmente feita por add-on (AutoCrat) na planilha. Confirmar onde vive essa regra.
- **`docs/V2_ROADMAP.md`, `docs/PROJECT_STATUS.md`** — refletem um plano que a virada de escopo pode ter tornado parcialmente inválido.

---

## Resumo do acervo

Base: 20 arquivos de código (`.js/.gs`, fora de testes), 52 suítes de teste, 14 mockups
`code.html`, 61 documentos `.md`.

- **Podem gerar regras de negócio:** ~**8 arquivos** de código-fonte (núcleo:
  `mae/Código.js`, `mae/WebApp.js`, `mae/SchemaExporter.js`, `mae/SidebarBackend.js`,
  `tear/Modelos.js`, `tear/Services.js`, `tear/Repositories.js`, `tools/ExportadorDeDados.js`)
  — mais as 52 suítes de teste como especificação executável de apoio.
- **Servem apenas como referência:** ~**75 itens** (61 docs + 14 mockups de UI).
- **Podem ser ignorados definitivamente:** ~**7 grupos** (código de CICLOS/PLANO e seus
  testes, `AuditoriaSync.js`, migração de uso único em `tools/migracao-tear/`,
  `tools/processador.js`, zips empacotados, `node_modules`/lockfile, snapshots
  `SYSTEM_MAP/SYSTEM_TRUTH` do legado).

### Os 10 ativos mais valiosos para reúso futuro

1. `mae/Código.js` → `gerarNovoMesCompleto()` — o Compilador do Mês real na planilha oficial.
2. `mae/WebApp.js` — backend do portal (login, leituras por mês, upload de material).
3. `mae/WebApp.js` → `normalizarStatus*` — coerção de status crus (evidência p/ a ACL).
4. `test/` (52 suítes) — especificação executável do comportamento validado.
5. `tear/Services.js` → `PagamentoService` — regra de elegibilidade de pagamento.
6. `tear/Services.js` → `ParceiroService`/promoção — validação `CADASTROS → BASE`.
7. `mae/SchemaExporter.js` — schema vivo + hash de integridade de cabeçalho.
8. `tear/Modelos.js` → senha `salt$hash` — autenticação segura.
9. `mae/Código.js` → `arquivarGenerico()` + `parseMesAno()` — arquivamento e parsing de mês.
10. `docs/spec/SCHEMA_V2.md` + `docs/EVENT_CATALOG.md` — racional de estados e eventos.
