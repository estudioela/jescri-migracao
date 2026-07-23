# TASK_ROUTER — TEAR V2

> **Função.** Fonte única e autorizada para localizar as **dependências mínimas**
> de cada SPEC. Nenhuma dependência pode ser buscada fora deste documento.
> Se uma dependência necessária não estiver aqui, **pare** e solicite a atualização
> deste arquivo — nunca o complete automaticamente.
>
> **Base de construção.** Documentação encontrada em `~/Downloads` (2026-07-14):
> `WORKFLOW.md` (ordem e dependências entre SPECs), `PRD.md` (fonte exclusiva de
> requisitos), `CONTRATO_SOBERANO.md` (domínio soberano), `ADR-001` (enums,
> MesReferencia, promoção), `ADR — Linguagem Ubíqua`, `DECISOES_BLOQUEANTES.md`
> (decisões abertas do PO) e `SPEC.md` (formato de SPEC).
>
> **Leitura.** Abrir **apenas as seções** indicadas na coluna "Seções". Nunca ler
> um documento inteiro quando houver âncora de seção.

---

## 0. Convenções

- `[x]` concluída · `[>]` em andamento · `[ ]` pendente.
- **Deps SPEC** = pré-requisitos entre SPECs (origem: `WORKFLOW.md`).
- **Fonte de requisitos** = sempre `PRD.md` (seções específicas).
- **Restrições** = ADRs e Contrato Soberano que a SPEC deve respeitar.
- 🟠 **Decisão do PO pendente** = a SPEC pode ser redigida, mas o item marcado
  fica como *pendência explícita*; **não inventar a regra**.

---

## 1. Localização física dos documentos

| Documento lógico | Caminho | Estado |
|---|---|---|
| `WORKFLOW.md` | — | **não existe mais** (2026-07-18: sumiu de `~/Downloads`; dependências entre SPECs já absorvidas por este roteador, ver SPEC-003 D-01) |
| `PRD.md` | `docs/PRD.md` | no repo |
| `CONTRATO_SOBERANO.md` | `docs/history/CONTRATO_SOBERANO.md` | no repo |
| `ADR-001` (enums/MesReferencia/promoção) | `docs/adrs/ADR-001-fechamento-de-contrato-e-enums.md` | no repo |
| `ADR — Linguagem Ubíqua` | `docs/adrs/ADR-003-linguagem-ubiqua-do-dominio.md` | no repo (numeração a confirmar) |
| `ADR-002 — Frontend Foundation` | `docs/adrs/ADR-002-frontend-foundation.md` | no repo |
| `ADR-010 — Banco oficial do Portal (planilha V2 "Portal Ela")` | `docs/adrs/ADR-010-banco-oficial-do-portal.md` | no repo |
| `ADR-013 — Autenticação do Portal via OAuth 2.0 Authorization Code Flow` | `docs/adrs/ADR-013-autenticacao-oauth-authorization-code.md` | no repo |
| `ADR-014 — Consolidação de arquivos por módulo de negócio` | `docs/adrs/ADR-014-consolidacao-de-arquivos-por-modulo.md` | no repo (2026-07-19: `src/` reorganizado em 14 `.js` — fatias verticais em `src/modulos/`; caminhos `src/{acl,adapters,controller,domain,repository,service}/...` citados em achados anteriores são históricos; mapa classe→arquivo na ADR) |
| Contratos de camada (ex-`_contract.js`) | `docs/architecture/ARQUITETURA_CAMADAS.md` | no repo (migrados pela ADR-014) |
| `DECISOES_BLOQUEANTES.md` | — | **não existe mais** (2026-07-18: sumiu de `~/Downloads`; o estado de cada pergunta P3–P8/Q-NN está rastreado por SPEC neste roteador — resolvidas: Q-03/04/07/08/10; abertas: Q-05/06/09) |
| `SPEC.md` (formato/Entrega 01) | `docs/specs/SPEC-001-cadastro-e-base-de-influenciadoras.md` | no repo |
| `PLANILHA_TEAR_2.0_MAPA.md` | `PLANILHA_TEAR_2.0_MAPA.md` (raiz) | no repo |
| `03 — Fronteiras do Domínio` | — | **não existe mais** (2026-07-18: sumiu de `~/Downloads`) |
| `04 — Capacidades do Sistema` | — | **não existe mais** (2026-07-18: sumiu de `~/Downloads`) |
| `06 — Modelo Conceitual dos Dados` | — | **não existe mais** (2026-07-18: sumiu de `~/Downloads`) |

> **Dívida ENCERRADA como perda (2026-07-18, sessão Tech Lead):** os cinco
> documentos "fora do repo" **desapareceram de `~/Downloads`** antes de serem
> consolidados (verificado por listagem completa do diretório e busca em todo
> o repo, `CONHECIMENTO/` e `knowledge/`). Nenhuma SPEC ativa depende deles:
> as dependências (WORKFLOW) e as decisões do PO (DECISOES_BLOQUEANTES)
> foram absorvidas por este roteador enquanto os arquivos existiam; §5 já
> previa parar caso alguma SPEC precisasse de seção específica de 03/04/06 —
> o que nunca ocorreu. Não procurar esses arquivos de novo; se algum
> reaparecer (backup do PO), aí sim consolidar em `docs/`.

---

## 2. Dependências globais (valem para toda SPEC)

Toda SPEC deve respeitar, sem reabrir:

| Documento | Seções | Para quê |
|---|---|---|
| `CONTRATO_SOBERANO.md` | §2 (termos banidos), §4 (linguagem ubíqua), §5 (VOs/PII), §6 (agregados), §8 (eventos) | Domínio soberano |
| `ADR — Linguagem Ubíqua` | §4 (tabela canônica), §5 | Vocabulário obrigatório (`Colaboração Mensal`, `Compilador do Mês`, `MesReferencia`, `Snapshot`) |
| `ADR-001` | §2 (enums/coerção), §3 (MesReferencia `AAAA-MM`) | Estados fechados; formato canônico |
| `SPEC.md` (SPEC-001) | inteiro serve de **modelo de formato** | Estrutura de uma SPEC |
| `DECISOES_BLOQUEANTES.md` | "Perguntas ao PO" (P3–P8) | Saber quais regras ficam 🟠 abertas |

---

## 3. Roteador por SPEC (dependências mínimas)

### EPIC 01 — Cadastro e Gestão

#### `[x]` SPEC-001 · Cadastro de Influenciadoras
- **Deps SPEC:** —
- **Requisitos (PRD):** §5.1, §6.1, §7 (RN-01, RN-02, RN-03), §9 (RF-001…RF-004)
- **Restrições:** `ADR-001` §4 (promoção Cadastro→Parceira)

#### `[x]` SPEC-003 · Importação Inicial da Base
- **Deps SPEC:** SPEC-001, SPEC-002
- **Requisitos (PRD):** §8 (entidade Influenciadora) · `PLANILHA_TEAR_2.0_MAPA.md` (mapa de colunas)
- **Ordem:** entregável adjacente (decisão do PO Q-10, opção B) — antes da Fase 2 (compilação do mês)
- ✅ **Implementada (2026-07-17):** slice completo (`ChaveInfluenciadora`
  (D-02c) → `LegadoACL` (leitura SOMENTE, sem nenhum método de escrita —
  RN-01/INV-01 estrutural) + `ParceiraACL.listarChaves`/`importarLote`
  (novas portas de idempotência/escrita em lote na base nova, §6.3) →
  `ImportadorService` → `ImportacaoController` → Portal
  `importarBaseLegada`). Nova Script Property `SPREADSHEET_ID_LEGADO`
  (`src/shared/Nucleo.js`, ex-`Config.js` — ADR-014) — planilha de origem, distinta de
  `SPREADSHEET_ID` (nunca a mesma, `DEPLOY_CHECKLIST.md` §2).
- ✅ **Resolvido (PO, 2026-07-17, D-01/D-02):** numeração confirmada por
  este roteador (`WORKFLOW.md` externo não existe mais); critério de
  registro válido (Q-10 opção A) = possui `INFLU_KEY` e nome da
  influenciadora — no esquema físico real (`PLANILHA_TEAR_2.0_MAPA.md` §3)
  não há coluna de nome separada de `INFLU_KEY` (mesma equivalência de
  SPEC-001, `Parceira.nome`↔`INFLU_KEY`), então as duas condições colapsam
  numa checagem física única: `INFLU_KEY` não vazio. **Hipótese registrada**
  em `ImportadorService` — revisar se surgir uma coluna de nome distinta.
  Demais campos vazios não descartam o registro; `STATUS` ausente/
  desconhecido nasce `Inativa` (mesmo default de RN-01 SPEC-001) em vez de
  descartar. 15 testes novos; suíte completa 464/464 verde; lint limpo.
- ✅ **Resolvida (2026-07-18, auditoria de apoio):** autorização por papel
  (§13, IM-03) — `importarBaseLegada` ganhou o parâmetro `dados` (não
  tinha, mesmo precedente de `arquivarLote`/SPEC-034 §11) e a guarda
  `exigirPapelAdministrador(dados)`, mesmo mecanismo das demais 15 rotas
  administrativas fechadas em §11. Teste novo em
  `test/portal-importacao.test.js` (RBAC negado sem sessão ADMINISTRADOR);
  suíte completa verde; lint limpo.

#### `[x]` SPEC-002 · Gestão de Influenciadoras
- **Deps SPEC:** SPEC-001
- **Requisitos (PRD):** §6.1, §7 (RN-01…RN-03), §9 (RF-002, RF-004, RF-005)
- 🟠 **Aberto:** P4 / Q-05 (inativação com pendências abertas) — afeta a partir da Fase 2
- **Achado da FASE 2 (QA pós-SPECs, 2026-07-16):** `Parceira.ativar()`/`.inativar()` (`src/domain/Parceira.js`) e os códigos de erro `GP-01/02/03` (§17) estão documentados na SPEC mas **sem nenhuma implementação de aplicação** — não há Service, Controller, Entrypoint nem `ParceiraRepository`/`ParceiraACL.atualizar*` que os exponha ou persista uma transição de estado/edição de Condição Comercial. `ParceiraACL` só tem `inserir` (append) — nenhuma escrita em linha existente para SPEC-002 (a única escrita em linha existente é `atualizarPerfil`, SPEC-032, um recorte de campos diferente). Consistente com o padrão legado (V1): a equipe edita `STATUS`/`VALOR_TOTAL`/quantidades diretamente na planilha `BASE DE DADOS`; o V2 só LÊ esses campos (`listarAtivasComCondicoes`, SPEC-005). Se esse fluxo administrativo deve virar código (Service/Controller/UI) é decisão do responsável do projeto — não implementado aqui.

---

### EPIC 02 — Colaboração Mensal

#### `[x]` SPEC-005 · Colaboração Mensal
- **Deps SPEC:** SPEC-002
- **Requisitos (PRD):** §5.2, §6.2, §7 (RN-04, RN-05, RN-06), §8 ("Ciclo Mensal" ≡ Colaboração Mensal)
- **Restrições:** `CONTRATO_SOBERANO` §5, §6, §8 · `ADR-001` §2, §3 (MesReferencia `AAAA-MM`) · `ADR — Linguagem Ubíqua` §4
- **Material já redigido:** `~/Downloads/SPEC-005-REVISAO.md` (Parte 3 = v2.0), já extraído para `docs/specs/SPEC-005-colaboracao-mensal.md`
- 🟠 **Aberto:** P8 / Q-06 (ano ausente em MesReferencia) · P4 / Q-05 (inativação)
- ✅ **Resolvido:** MesReferencia alinhado a `AAAA-MM` (ADR-001 §3) na SPEC-005 v2.0.

---

### EPIC 03 — Briefing

#### `[x]` SPEC-009 · Briefing de Campanha
- **Deps SPEC:** SPEC-005
- **Requisitos (PRD):** §5.3, §6.3, §7 (RN-04, RN-06), §9 (RF-008, RF-009, RF-010)
- **Restrições:** `ADR-001` §2 (cálculo da data de aprovação = RN-04)

---

### EPIC 04 — Conteúdo e Ativações

#### `[x]` SPEC-012 · Gestão de Conteúdo e Ativações
- **Deps SPEC:** SPEC-005, SPEC-009 (achado da FASE 1: `EntregaService` recebe `BriefingRepository` no construtor — `src/entrypoint/Portal.js` `montarEntregaService` —, dependência real não declarada antes)
- **Requisitos (PRD):** §5.4, §6.4, §7 (RN-06, RN-07, RN-08), §9 (RF-011…RF-015)
- **Restrições:** `ADR-001` §2.2 (estados de conteúdo)
- ✅ **Resolvido (PO 2026-07-15, propagado aqui em 2026-07-16):** Q-03 —
  rótulos crus persistidos são `AGUARDANDO_MATERIAL|EM_REVISAO|APROVADO|
  PUBLICADO` (`EntregaACL.js`, cabeçalho). A decisão já existia só em
  comentário de código (achado F7 de `docs/_workspace/auditorias/
  AUDITORIA_SPEC012.md`) — este roteador e a SPEC-012 §21 ainda listavam
  como aberto; corrigido.

---

### EPIC 05 — Logística

#### `[x]` SPEC-016 · Gestão Logística
- **Deps SPEC:** SPEC-005, SPEC-001/002 (achado da FASE 1: `EnvioService` recebe `ParceiraACL` como porta do Cadastro, D-03 — `src/entrypoint/Portal.js` `montarEnvioService` —, dependência real não declarada antes)
- **Requisitos (PRD):** §5.5, §6.5, §7 (RN-13, RN-14), §9 (RF-016…RF-019)
- **Restrições:** `ADR-001` §2.4 (`STATUS REVISÃO` e `STATUS LOGISTICA` — máquinas independentes)

---

### EPIC 06 — Financeiro

#### `[x]` SPEC-020 · Gestão de Pagamentos
- **Deps SPEC:** SPEC-002
- **Requisitos (PRD):** §5.6, §6.6, §7 (RN-09, RN-10, RN-11, RN-12), §9 (RF-020…RF-023)
- **Restrições:** `ADR-001` §2.3 (estados de pagamento)
- ✅ **Implementada (2026-07-17):** slice completo (`ObrigacaoFinanceira`
  EmAberto→Aprovado→Pago → `PagamentoACL`/`PagamentoRepository` (aba física
  nova `PAGAMENTOS`) → `PagamentoService` → `PagamentoController` → Portal
  `lancarPagamentoAvulso`/`liberarPagamento`/`confirmarPagamento`/
  `listarPagamentos`). Lançamento mensal reage a `MesCompilado`
  (materialização idempotente por competência, mesmo padrão F1/F2 de
  Entrega/Envio) — cablado em `montarCompilarMes`/`compilarMes`
  (reconciliação). PIX nunca persistido no Pagamento — lido ao vivo na
  porta do Cadastro só para compor a mensagem de cobrança (RNF-01). 20
  testes novos; suíte completa 447/447 verde; lint limpo.
- ✅ **Resolvido (PO, 2026-07-17, Q-04 opção B):** elegibilidade de
  `PagamentoLiberado` — Obrigação `Mensal` exige todas as Entregas da
  competência em `Aprovado`/`Publicado` (SPEC-012 §9); publicação não é
  requisito. Obrigação `Avulso` não passa pelo gate (liberação manual).
  Detalhe em `SPEC-020-gestao-de-pagamentos.md` §9/§21.
- ✅ **Resolvida (2026-07-17):** autorização por papel (§13, PG-04) — ver §11
  (RBAC aplicado às rotas administrativas).

---

### EPIC 07 — Documentos

#### `[x]` SPEC-023 · Geração de Documentos
- **Deps SPEC:** SPEC-002, SPEC-009
- **Requisitos (PRD):** §5.7, §6.7, §7 (RN-15), §9 (RF-024, RF-025)
- **Restrições:** `CONTRATO_SOBERANO` §6.1 · `ADR — Linguagem Ubíqua` §4 (Snapshot Comercial da Colaboração)
- ✅ **Implementada (2026-07-16):** slice completo (`Documento`/`CamposDeMesclagem` → `ParceiraACL.obterParaDocumentos`/`DocumentoACL` → `DocumentoRepository` → `DocumentoService` → `DocumentoController` → Portal). Aba física nova `DOCUMENTOS` persiste só referência opaca (sem PII). Sinalização = coluna `SIM/NÃO` da `BASE DE DADOS` (PRD §5.7).
- **Dívidas registradas na implementação:** motor documental real por ADR futuro (D-01 — adaptador interino de texto); rótulos crus da aba `DOCUMENTOS` sem ADR (mesma pendência SPEC-016); geração em lote (RF-024 "[job]") não implementada — comando individual por Parceira; sem UI de Portal (SPEC não define; §12 "leitura futura").
- ✅ **Resolvida (2026-07-17):** autorização por papel (§13) — ver §11 (RBAC aplicado às rotas administrativas).

---

### EPIC 08 — Portal da Influenciadora

#### `[x]` SPEC-025 · Acesso ao Portal
- **Deps SPEC:** SPEC-001
- **Requisitos (PRD):** §6.8, §7 (RN-16, RN-17, RN-18), §9 (RF-026, RF-027), §10 (segurança)
- ✅ **Implementada (2026-07-16):** slice completo (`Credencial`/`TokenDeSessao`/`JanelaDeBloqueio`/`Sessao`/`Autenticador` → `ParceiraACL.obterAcessoLegado`/`SessaoACL`/`BloqueioACL` → `SessaoRepository`/`BloqueioRepository` → `AcessoPortalService` → `AcessoController` → Portal `entrarNoPortal`/`renovarSessaoDoPortal`/`sairDoPortal`). Abas físicas novas `SESSOES` e `BLOQUEIOS`. Bloqueio 5 falhas → 15 min (RN-02); sessão 6h deslizante (RN-03); erros AC-01/02/03 (§17); credencial/PII fora de log (RN-04); operações de acesso serializadas por trava global (LockService, só no Entrypoint) — primeira superfície multiusuária do sistema.
- **Dívidas registradas na implementação:** verificação de credencial atrás da porta do Autenticador via **adaptador legado provisório** (`VerificadorDeCredencialLegado`, RN-16: cupom + 5 primeiros dígitos do CNPJ, por decisão do PO em 2026-07-16) — trocar o modelo (Q-07) = trocar só o adaptador; acesso não filtra estado do vínculo (Ativa/Inativa) — regra não consta da SPEC.
- **UI (FASE 3 pós-SPECs, 2026-07-16; reescrita 2026-07-17 Sprint Portal MVP Online):** `src/ui/login.html` — scaffolding temporário e funcional, sem identidade visual (decisão explícita do responsável do projeto: priorizar funcionamento para homologação; substituição futura pelo Design System oficial do Estúdio Elã não deve alterar a lógica de sessão/navegação). Navegação entre páginas via `window.top.location.href` (iframe sandboxed do HtmlService); token em `sessionStorage`. **Reescrita em 2026-07-17:** o formulário cupom/senha (modelo legado desta SPEC) foi substituído por Google Identity Services, cobrindo o fluxo federado de SPEC-035 (login/vinculação/onboarding) — ver nota em SPEC-035 abaixo. `entrarNoPortal` (backend legado, cupom+CNPJ) permanece implementado e testado, só deixou de ter UI própria.
- 🟠 **Aberto:** ~~P5 / Q-07 (modelo de autenticação definitivo)~~ resolvido por SPEC-035 (2026-07-17): federação Google Identity via novo adaptador, reaproveitando `Sessao`/`TokenDeSessao`/`SessaoRepository`/`AcessoController` desta SPEC sem alteração — ver SPEC-035 §9.2-A · ~~P6 / Q-08 (papéis)~~ resolvido por SPEC-035 para `Administrador`/`Influenciadora` (papel `Marca` permanece aberto, é decisão de escopo de produto, não de arquitetura) · Q-09 (LGPD) segue aberta — tratada como débito herdado por SPEC-027/030/032/035, não bloqueante por precedente já estabelecido, ainda sem solução formal antes de o Portal expor dados

#### `[x]` SPEC-027 · Conteúdo no Portal
- **Deps SPEC:** SPEC-009, SPEC-012, SPEC-025
- **Requisitos (PRD):** §5.4, §6.8, §9 (RF-011, RF-012, RF-013)
- ✅ **Implementada (2026-07-16):** fachada sem agregado próprio (§6.2/§6.4) — `ItemDePendencia` (VO de projeção) → `PortalDeConteudoService` (delega a `AcessoPortalService`/`EntregaService`/`BriefingService`, sem ACL/Repository novos — não há aba física nova) → `PortalDeConteudoController` → Portal (`verPendencias`/`lerBriefingDoItem`/`enviarMaterialDoPortal`). `parceiraId` deriva sempre da Sessão (token), nunca do comando externo (RN-01/INV-01). `listarPendencias` exclui Entregas `Publicado` (histórico é escopo de SPEC-030, §2). Bloco de Briefing só é exposto quando preenchido (`estaPreenchido()`, RN-03) — achado da revisão arquitetural, corrigido antes do commit. Erros PC-01 (sessão)/PC-02 (Entrega alheia ou briefing não preenchido) com `codigo`, mesmo padrão do AcessoController. 27 testes novos; suíte completa 378/378 verde; lint limpo.
- **Dívidas registradas na implementação:** nenhuma nova — herda as dívidas já registradas de SPEC-025 (Q-07/Q-08/Q-09) e SPEC-012 (D-02 material como URL).
- **UI (FASE 3 pós-SPECs, 2026-07-16):** `src/ui/pendencias.html` — scaffolding temporário (ver nota de SPEC-025).

#### `[x]` SPEC-030 · Financeiro e Histórico no Portal
- **Deps SPEC:** SPEC-012, SPEC-020, SPEC-025
- **Requisitos (PRD):** §6.6, §6.8, §6.9, §7 (RN-10), §9 (RF-023, RF-028, RF-030)
- ✅ **Implementada (2026-07-17):** fachada sem agregado próprio, mesma
  natureza de SPEC-027/032 (`ResumoFinanceiro`/`ItemDeHistorico`, VOs de
  projeção, §6.1) → `PortalFinanceiroService` (reaproveita
  `AcessoPortalService`, `EntregaService` e `PagamentoService` — nenhuma
  ACL/Repository/aba física nova) → `PortalFinanceiroController` → Portal
  (`listarPeriodosDoPortal`/`verFinanceiroDoPortal`/`verHistoricoDoPortal`).
  RN-02/CB-02: previsto = Obrigações `EmAberto`/`Aprovado`; pago = só
  `Pago`. RN-04/CB-01: período selecionável = competências com QUALQUER
  atividade da Parceira (Entrega ou Obrigação com competência; Avulso sem
  competência nunca aparece), via novo `listarPorParceira(parceiraId)` em
  `EntregaRepository`/`PagamentoRepository` (extensão aditiva, reaproveita
  `acl.listarTodos()`) e wrappers finos equivalentes em
  `EntregaService`/`PagamentoService` (mantém `PortalFinanceiroService`
  dependente só de Services, nunca de Repository de outro módulo). Erros
  PF-01 (sessão)/PF-02 (período sem atividade) com `codigo`, mesmo padrão
  dos pares. 35 testes novos (domínio/repository/service/controller/
  entrypoint, incluindo isolamento RN-05/Q-09 entre duas Parceiras reais);
  suíte completa 496/496 verde; lint limpo.
- **Dívidas registradas na implementação:** nenhuma nova — herda D-01 (§21
  da própria SPEC: isolamento depende do modelo de auth definitivo, 🟠
  Q-07) e as dívidas já registradas de SPEC-025 (Q-07/Q-08/Q-09).
- **UI (2026-07-17, Sprint Portal MVP Online):** `src/ui/financeiro.html`
  — scaffolding no mesmo padrão das demais telas do Portal (sem identidade
  visual). Seletor de competência, resumo previsto×pago e tabela de
  histórico, consumindo `listarPeriodosDoPortal`/`verFinanceiroDoPortal`/
  `verHistoricoDoPortal` sem alteração de contrato.

#### `[x]` SPEC-032 · Perfil no Portal
- **Deps SPEC:** SPEC-001, SPEC-002, SPEC-025
- **Requisitos (PRD):** §6.8, §7 (RN-02), §9 (RF-029)
- ✅ **Implementada (2026-07-16):** fachada sem agregado próprio, mesma natureza da SPEC-027 — VOs `PIX`/`Endereco` (§6.1) → `ParceiraACL.obterPerfil`/`atualizarPerfil` (portas novas: leitura/escrita célula-a-célula de uma linha EXISTENTE em `BASE DE DADOS`, deliberadamente sem reescrever a aba inteira — 961 linhas com colunas não modeladas por este domínio) → `PerfilPortalService` (reaproveita `AcessoPortalService`) → `PerfilPortalController` → Portal (`verPerfilDoPortal`/`editarPerfilDoPortal`). `AdaptadorDeCepBrasilApi` cumpre a porta de CEP (RN-01); falha é degradável (RN-02/CB-01), nunca lançada (PP-03 vira sinal implícito via `endereco.completo`). `enderecoCompleto` é recomputado e também grava `INFLUENCIADORA_ENDERECO` para manter SPEC-016/023 consistentes. 40 testes novos; suíte completa 418/418 verde; lint limpo.
- **Achados da revisão arquitetural (corrigidos antes do commit):** (1) `String(x).trim()` sem guarda de `null` transformava `null` explícito na string literal `"null"`, corrompendo e-mail/PIX/CEP — corrigido com o mesmo padrão `== null ? '' : x` já usado nas VOs. (2) `editarPerfil` renovava a Sessão duas vezes por chamada (uma direta, outra via `verPerfil` no retorno) — corrigido para reaproveitar a Sessão já resolvida. (3) o adaptador de CEP era chamado a cada edição de endereço mesmo quando o CEP não mudava — corrigido para só chamar quando `cepMudou`.
- **Dívida registrada:** `comTravaDeAcesso` (trava global do Portal) agora pode segurar uma chamada HTTP síncrona ao BrasilAPI quando o CEP muda (única operação sob a trava hoje que sai da planilha para a rede; GAS não permite configurar timeout em `UrlFetchApp`) — se o serviço externo degradar, chamadas de login/logout/conteúdo de OUTRAS Parceiras na fila do lock podem falhar por timeout. Mitigado (chamada só quando o CEP muda), não eliminado. Resolver de vez exige mover a resolução de CEP para fora da trava ou trocar o lock global por lock por-Parceira — candidato a ADR futuro, tratado na FASE 4 (dívidas técnicas) do plano pós-SPECs.
- **UI (FASE 3 pós-SPECs, 2026-07-16):** `src/ui/perfil.html` — scaffolding temporário (ver nota de SPEC-025).

#### `[x]` SPEC-035 · Identidade e Acesso (M-ID)
- **Deps SPEC:** SPEC-001, SPEC-002, SPEC-025
- **Requisitos:** `docs/specs/SPEC-035-identidade-e-acesso.md` (documento próprio — origem: revisão arquitetural + resolução de pendências em 2026-07-17; movido de `.gemini/spec-035-identidade/` em 2026-07-18, auditoria de apoio, para eliminar duplicata que já havia divergido do TASK_ROUTER)
- ✅ **Implementada (2026-07-17):** substitui o modelo de credencial legado (RN-16, cupom+CNPJ) por federação Google Identity para os papéis `Administrador` e `Influenciadora`. Resolve Q-07 e Q-08 (parcial) de SPEC-025 — ver nota na entrada de SPEC-025 acima e SPEC-035 §9.2-A. Reaproveita integralmente `Sessao`/`TokenDeSessao`/`SessaoRepository`/`SessaoACL`/`AcessoPortalService`/`AcessoController.renovar()`/`.sair()` (SPEC-025) — nenhuma stack de sessão paralela; verificado ponta a ponta (sessão emitida via Google renovada/encerrada pelo `AcessoController` já existente, mesma aba `SESSOES`). Novo: `Usuario` (domínio — máquina de estados PENDING/ACTIVE/INACTIVE/REJECTED, RN-04/RN-07 bootstrap do primeiro Administrador), `ValidadorDeTokenGoogle` (adaptador — valida `aud`/`iss`/`exp`/`iat` via endpoint `tokeninfo`, sem reaproveitar `Autenticador`/`JanelaDeBloqueio`: bloqueio por tentativas não se aplica a token assinado criptograficamente, §9.2-A), `UsuarioACL`/`AdministradorACL`/`UsuarioRepository` (`SIS_IDENTIDADES`, `BASE_ADMINISTRADORES`), extensão de `ParceiraACL` (`buscarCandidataPorEmail`/`vincularSubProvider`/`obterPorSubProvider`, §5.1-A/§10.2.4 — `INFLU_KEY` preservada como chave soberana, `SUB_PROVIDER` é atributo dependente), `UsuarioService` (login/onboarding/vinculação/moderação/RBAC/suspensão-reativação) → `UsuarioController` → Portal (`entrarComGoogle`/`confirmarVinculacaoDeIdentidade`/`completarCadastroDeUsuario`/`listarUsuariosPendentes`/`aprovarUsuario`/`rejeitarUsuario`/`inativarUsuario`/`reativarUsuario`). 79 testes novos (domínio/adaptador/ACL/repository/service/controller/entrypoint, incluindo jornada completa candidata→vinculação→bloqueio PENDING→aprovação→login ACTIVE); suíte completa 599/599 verde; lint limpo.
- **Escopo desta unidade de trabalho:** papéis `Administrador` e `Influenciadora` apenas. O ator `Marca` (tenant externo, `BASE_MARCAS`) está definido na SPEC mas **não implementado** — não é inferível do PRD vigente (que descreve operação para uma única marca), é decisão de escopo de produto que só o responsável do projeto pode tomar (SPEC-035, nota de revisão 2). `completarCadastroDeUsuario` recusa explicitamente `papel: 'MARCA'` (`ERR_AUTH_PAPEL_NAO_DISPONIVEL`).
- **Dívidas registradas:** Q-09 (LGPD) segue aberta, herdada de SPEC-025/027/030/032 — não bloqueia esta implementação, mesmo precedente já aplicado às SPECs anteriores.
- ✅ **Resolvida (2026-07-17, ver §11):** `exigirPapel`/RBAC agora protege as
  rotas administrativas de SPEC-012/016/020/023/034 (nenhum Controller do
  sistema checava papel antes desta SPEC). Gap remanescente
  `importarBaseLegada` (SPEC-003 §13) fechado em 2026-07-18 (auditoria de
  apoio) pelo mesmo mecanismo — ver entrada de SPEC-003.
- **UI (2026-07-17, Sprint Portal MVP Online):** `src/ui/login.html`
  (SPEC-025) reescrito para o modelo federado — botão Google Identity
  Services, tratamento de `AUTENTICADO`/`CANDIDATA_VINCULACAO`/
  `ONBOARDING_REQUERIDO` e dos erros `ERR_AUTH_*` (§13.1-13.3 desta SPEC).
  Roteamento pós-login por papel (`portal-dashboard` para Influenciadora,
  `admin` para Administrador) exigiu expor `papel` na resposta
  `AUTENTICADO` de `UsuarioService.entrar`/`UsuarioController.
  projetarResultadoDeEntrada` — gap de contrato encontrado nesta unidade de
  trabalho (a resposta só carregava token/parceiraId/expiraEm; o frontend
  não tinha como decidir a rota), corrigido de forma aditiva (campo novo,
  sem quebrar consumidores existentes), testes atualizados. Novo
  `src/ui/admin.html` — painel de moderação (§13.4: lista PENDING, aprova/
  rejeita) mais atalhos para as telas operacionais já existentes
  (compilar-mes/briefing/entrega/envio). Novo `src/ui/dashboard.html` —
  home da Influenciadora, hub para Pendências/Perfil/Financeiro.
- ✅ **Correção de arquitetura (2026-07-18, ADR-013):** o fluxo GIS adotado
  na UI (nota "UI (2026-07-17…)" acima) falhou em homologação — origem
  `*.script.googleusercontent.com` do HtmlService não é registrável como
  Authorized JavaScript origin (causa raiz validada na documentação do
  Google). Login substituído por OAuth 2.0 Authorization Code Flow
  server-side (redirect para /exec): novos adapters `AdaptadorOAuthGoogle`
  (troca de código, Client Secret — 4ª Script Property
  `GOOGLE_CLIENT_SECRET`) e `GuardiaoDeEstadoOAuth` (state anti-CSRF em
  CacheService, consumo único), novos `UsuarioService.iniciarLogin`/
  `entrarComCodigo` + rotas `iniciarLoginComGoogle`/`entrarComCodigoOAuth`;
  `entrarComGoogle`/`obterConfiguracaoDeLogin` removidas;
  `UsuarioService.entrar({idToken})` e toda a stack de sessão/RBAC
  inalteradas. Arquitetura experimental "frontend separado + doPost"
  descartada (condição 6 da revisão). Detalhe: ADR-013 e
  `docs/_workspace/spec035_identidade/PLANO_ADR-013_OAUTH_CODE_FLOW.md`.
- **Deploy e provisionamento de produção (2026-07-18, sessão de
  homologação):** versão 13 ("ADR-013 OAuth code flow") criada via `clasp
  push`/`create-version` e publicada no deployment de produção (rotulado
  "V 5.0"); conferido por `clasp pull --versionNumber 13` + diff que o
  conteúdo remoto é idêntico ao repositório. As 4 Script Properties foram
  provisionadas pelo operador nesta sessão, com DOIS erros de
  provisionamento encontrados e corrigidos por diagnóstico guiado:
  (1) o Client Secret havia sido colado na property `GOOGLE_CLIENT_ID`
  (formato `GOCSPX-…`), causando `401 invalid_client`; (2) em seguida o
  `GOOGLE_CLIENT_ID` foi preenchido com um valor de EXEMPLO
  (`123456789012-abc123…`), não com o ID real — evidência extraída por rota
  de diagnóstico temporária (`?pagina=diag-adr013`, já removida do código e
  do HEAD remoto) que gravou o `client_id` efetivamente enviado na aba
  `DIAG_ADR013` da planilha PROD (aba temporária — **remover
  manualmente**). Valor correto = campo "ID do cliente" da credencial OAuth
  "Portal TEAR" (projeto GCP "projeto tear" do operador; o projeto Apps
  Script permanece em "GCP: Padrão" — a associação GCP do script é
  irrelevante para o fluxo, que só usa as properties). Redirect URIs
  `/exec` (produção) e `/dev` registradas na credencial. Os IDs das
  planilhas PROD/legado não são versionados (governança §3.5/§3.6) —
  localizados via Drive ("[PROD] TEAR - Base Operacional", estrutura
  validada contra o checklist §1; legado "[ELÃ] TEAR" = ID do ADR-010).
  **Estado ao fim da sessão:** último erro observado foi `400
  redirect_uri_mismatch`, ANTES do registro das URIs na credencial;
  reteste do login pós-registro ainda pendente. Próximos passos: (1)
  validar login ponta a ponta no `/exec`; (2) onboarding/bootstrap do
  primeiro Administrador (SPEC-035); (3) carga da base legada
  (`importarBaseLegada`); (4) remover a aba `DIAG_ADR013` da planilha PROD.
- **Continuidade (2026-07-18, sessão sem acesso a navegador):** revisão de
  código ponta a ponta do fluxo ADR-013 (`AdaptadorOAuthGoogle`,
  `GuardiaoDeEstadoOAuth`, `UsuarioService.iniciarLogin`/`entrarComCodigo`,
  `UsuarioController`, `montarUsuarioService`/`iniciarLoginComGoogle`/
  `entrarComCodigoOAuth` em `Portal.js`, `login.html`) — **nenhum bug
  encontrado**; `npm run check` 624/624 verde. `curl` direto ao `/exec` de
  produção confirma o deployment ativo e respondendo (Google intercepta
  antes do Portal com sua própria tela de login, esperado para
  `access: ANYONE`) — não é possível ir além disso sem uma sessão de
  navegador autenticada com uma conta Google real (indisponível nesta
  sessão). Planilha "[PROD] TEAR - Base Operacional" lida via Drive
  (2026-07-18): `SESSOES`/`SIS_IDENTIDADES`/`BASE_ADMINISTRADORES` ainda
  **sem nenhuma linha de dado** — confirma que o login ainda não foi
  concluído com sucesso nenhuma vez em produção; `DIAG_ADR013` ainda
  presente (não contém o secret, só metadados do diagnóstico — ver
  conteúdo na sessão anterior desta mesma entrada), item (4) acima segue
  pendente, sem ferramenta disponível nesta sessão para apagar uma aba
  específica de uma planilha existente (só arquivos inteiros via Drive).
  `docs/_workspace/DEPLOY_CHECKLIST.md` ganhou uma tabela "Erros
  conhecidos do login OAuth" (redirect_uri_mismatch/invalid_client, já
  observados; hipótese de reautorização de escopo `script.external_request`
  se `UrlFetchApp` algum dia falhar por permissão — não confirmada, só
  registrada preventivamente). `ROTEIRO_HOMOLOGACAO.md` corrigido (§0/§4/
  Resumo estavam desatualizados: `access: MYSELF` → `ANYONE`; SPEC-020/030/
  034 listadas como inexistentes → `[x]` implementadas; contagem de telas
  8 → 13). **Ação real de próxima sessão continua sendo a mesma:** um
  humano (ou uma sessão com navegador conectado) precisa abrir o `/exec`
  logado com uma conta Google e clicar "Entrar com Google" para validar
  o login ponta a ponta — nenhum agente sem navegador consegue completar
  esse passo específico.
- **Continuidade (2026-07-18, sessão sem acesso a navegador — 2ª tentativa,
  foco exclusivo em destravar o login):** achado novo e corrigido:
  `src/ui/login.html` nunca lia `error=` da URL de retorno do Google (só
  `code`) — se o usuário cancelasse o consentimento (`access_denied`) ou o
  Google devolvesse qualquer outro erro no redirect, a tela ficava muda,
  sem mensagem nenhuma. Corrigido (mostra aviso e volta ao botão de login);
  suíte 625/625 verde; lint limpo. **Publicado em produção:** versão 18
  ("V 5.4 — trata error= no callback OAuth"), mesmo deploymentId de sempre
  (`clasp deploy -i <id> -V 18`, não cria URL nova — redirect URIs já
  registradas continuam válidas).
  Tentativa de diagnóstico headless da hipótese `script.external_request`
  via Apps Script Execution API (`clasp run`, manifest `executionApi`
  temporário, removido depois): **bloqueada por um pré-requisito de conta
  diferente** — `clasp run` falha com "Script function not found. Please
  make sure script is deployed as API executable" mesmo com deployment
  válido, o que é o sintoma padrão de a "Google Apps Script API" estar
  desligada em `script.google.com/home/usersettings` para a conta usada
  pelo `clasp login`. Ou seja: mesmo a via alternativa (sem navegador, via
  API) para checar Script Properties/`UrlFetchApp` exige antes um toggle
  manual nessa página, também só acionável logado no navegador. A hipótese
  de reautorização de escopo segue **não confirmada nem descartada**
  (pesquisa de documentação oficial do Google confirma que, SE for o caso,
  não existe caminho por CLI/API — só clique manual). Auditoria de código
  independente (2ª leitura completa do fluxo) não achou nenhum outro bug;
  achado de maior probabilidade prática continua sendo erro humano de
  digitação em `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` (já ocorreu 2x
  nesta mesma implantação, tabela de erros conhecidos em
  `DEPLOY_CHECKLIST.md`), não a hipótese de permissão.
  **Ação humana necessária (bloqueio real, ver relatório da sessão):**
  (1) na conta que fez o deploy, abrir
  `https://script.google.com/home/usersettings` e confirmar que "Google
  Apps Script API" está ligada — desbloqueia diagnóstico futuro via
  `clasp run` sem depender de navegador a cada vez; (2) abrir a URL do
  deployment de produção (`clasp deployments`, ID `AKfycbwUhR1P7…`, `/exec`)
  logado como essa mesma conta e clicar "Entrar com Google" — se aparecer
  tela de consentimento pedindo escopos novos, aceitar (resolve a hipótese
  de permissão, se for o caso); se aparecer qualquer outro erro, ele
  finalmente será o primeiro erro real observado nesta versão do código e
  pode ser corrigido dirigido pela mensagem exibida (agora sempre visível,
  com a correção desta sessão).
- **Go-live operacional (2026-07-19, sessão de entrega):** produção estava
  na **versão 23** ("V 5.9 — OAuth encerrado, produção limpa") — sessões de
  2026-07-18 posteriores ao registro anterior validaram o login OAuth em
  produção (rótulo da v21) e removeram a sonda de autorização (v22/v23);
  diff pull-v23 × repo confirmou **produção = HEAD, sem drift**. Nesta
  sessão, executadas as 3 pendências operacionais SEM navegador logado, via
  **deployment temporário separado** (rota de bootstrap protegida por
  segredo, executada como USER_DEPLOYING; produção permaneceu pinada na
  v23): (1) **RN-07 concluído** — primeiro Administrador (sub `1073…2915`)
  `PENDING→ACTIVE` em `SIS_IDENTIDADES`; (2) **aba `DIAG_ADR013` removida**
  da planilha PROD; (3) **Importação Inicial da Base executada**
  (`importarBaseLegada`, SPEC-003): `totalImportado: 7` — as 7 Parceiras da
  base legada agora populam `BASE DE DADOS` (verificado por leitura da
  planilha). Limpeza verificada ao fim: deployment temporário excluído
  (`clasp undeploy`), código temporário revertido, `clasp push` do HEAD
  limpo, restam só os 2 deployments de sempre (@HEAD e produção @23);
  suíte 626/626 verde. A versão 24 ("TEMP — bootstrap RN-07") existe no
  histórico de versões mas não tem deployment que a sirva. **Pendência
  restante:** smoke test visual das jornadas em produção (login admin →
  dashboard → telas operacionais), dependente de sessão de navegador
  logada pelo operador.
- **Incidente de drift de produção (2026-07-18, sessão Tech Lead):** a
  auditoria de sincronia remoto×local (pull da versão publicada + diff
  contra o repo) revelou que produção estava servindo a **versão 15** —
  criada SEM descrição (provavelmente via editor web, fora desta esteira)
  a partir de um snapshot anterior às correções de 2026-07-18: ainda
  continha a rota de diagnóstico `diag-adr013` (que deveria ter sido
  removida), NÃO continha a guarda RBAC de `importarBaseLegada` (IM-03)
  nem a ordenação F6. Corrigido na mesma sessão: `clasp push` do HEAD →
  versão 16 ("V 5.3") → `clasp update-deployment` no MESMO deployment
  (URL `/exec` e redirect URIs preservadas) → `clasp pull
  --versionNumber 16` + diff confirmou conteúdo idêntico ao repo.
  **Regra operacional derivada:** nunca criar versão/implantação pelo
  editor web; toda publicação sai do repositório via `clasp push` +
  `create-version` + `update-deployment`, e toda sessão de deploy termina
  com o diff de verificação (pull da versão publicada × repo).
  **Reconciliação com a sessão paralela:** enquanto esta sessão publicava
  a v16, a sessão de destravamento do login publicou a **versão 18**
  ("V 5.4", `error=` no callback — nota acima) no mesmo deployment; a
  guarda de `enviarMaterial` (ver §11) foi então publicada **sobre a
  v18** como **versão 19** ("V 5.5"), pelo mesmo procedimento
  (`clasp push` + `create-version` + `update-deployment` no mesmo
  deploymentId) e verificada com o mesmo diff (pull da v19 × repo:
  idênticos). **Produção ao fim de 2026-07-18: versão 19 = HEAD do
  repositório.**
- **Login OAuth validado até o callback; causa raiz do último bloqueio
  corrigida (2026-07-18, sessão Tech Lead, continuação):** o operador
  confirmou o fluxo funcionando até o retorno do Google — o erro passou a
  ser "Você não tem permissão para chamar UrlFetchApp.fetch" na troca do
  código (`AdaptadorOAuthGoogle.js:62`), o que PROVA que client_id/
  redirect URIs/state estão corretos. Causa raiz (auditada, sem hipótese):
  o manifesto **nunca declarou `oauthScopes`** e a autorização da conta
  USER_DEPLOYING era anterior ao ADR-013 (era M1, só planilha);
  documentação oficial confirma que Web App como USER_DEPLOYING *"may not
  request authorization"* — falha em vez de re-pedir consentimento.
  Correção: `oauthScopes` explícitos no `appsscript.json`
  (`spreadsheets` + `script.external_request` — conjunto completo
  verificado por grep de todos os serviços GAS usados e pela referência
  oficial de cada um; `ScriptApp.getService().getUrl()` não exige escopo).
  Publicado como **versão 20** no mesmo deployment, diff verificado.
  **Passo humano final:** a conta que publica precisa consentir os
  escopos UMA vez — abrir o projeto em script.google.com, rodar qualquer
  função no editor e aceitar a tela de autorização (caminho garantido; a
  doc diz que o /exec pode não pedir) — e então repetir o login no
  `/exec`.

---

### EPIC 09 — Arquivamento

#### `[x]` SPEC-034 · Arquivamento Geral Manual
- **Deps SPEC:** SPEC-012, SPEC-016, SPEC-020 — todas `[x]`, sem pendência
  bloqueante
- **Requisitos (PRD):** §5.8, §6.9, §7 (RN-08, RN-11, RN-14), §9 (RF-031, RF-032)
- **Restrições:** `CONTRATO_SOBERANO` §6.4 (imutabilidade), §8 (`CompetenciaArquivada`)
- ✅ **Resolvido (2026-07-17, lacuna de documentação, não decisão de PO):**
  D-01 (elegibilidade para selagem) — a SPEC citava "Contrato §9" mas esse
  parágrafo só trata de `PagamentoLiberado` (já resolvido, SPEC-020 Q-04);
  nada sobre selagem. Regra formalizada em `SPEC-034-arquivamento-geral-manual.md` RN-07/§21, no mesmo
  formato do precedente Q-04: competência selável quando todo item
  existente de Entrega/Envio/Obrigação `Mensal` está terminal; ausência de
  itens de um módulo não bloqueia; `Avulso` fora da checagem.
- ✅ **Implementada (2026-07-17):** achado prévio à implementação — RN-01/02/03
  (gatilho automático de arquivamento por estado terminal, com carimbo
  `DATA_ARQUIVAMENTO`) e RN-06/INV-02/INV-03 (`ColaboracaoMensal.arquivar()`,
  `Object.freeze`) já existiam como efeito colateral de SPEC-012/016/020 —
  só faltava o comando de selagem em si. Implementado: `ArquivamentoService`
  (RN-07 sobre `EntregaService.listarEntregas`/`EnvioService.listarEnvios`/
  `PagamentoService.listarPagamentos` reaproveitados, nunca ACL/Repository
  alheios, mesmo princípio de SPEC-027/030/032) → `ColaboracaoMensalRepository.
  arquivarCompetencia`/`listarTodas` (novos) → `ColaboracaoMensalACL.
  arquivarCompetencia` (escrita física pura, reescreve só as linhas da
  competência) → `ArquivamentoController` → Portal `selarCompetencia`
  (UC-034.02, AR-02 se não compilada ou com pendência) / `arquivarLote`
  (UC-034.01, varre competências não seladas e sela as elegíveis, reporta
  as demais sem interromper — CB-03 no-op se nada elegível). Nenhuma
  entidade de domínio nova (resolve também D-02: a própria linha
  arquivada/congelada é a cópia imutável, sem aba de histórico física
  separada). 12 testes novos (ACL/Repository/Service/Controller/Entrypoint);
  suíte completa 520/520 verde; lint limpo.
- ✅ **Resolvida (2026-07-17):** autorização por papel (§13 — Administrador
  vs. Operador) — ver §11 (RBAC aplicado às rotas administrativas). A
  distinção Operador não existe como papel implementado (precedente "MVP
  operador único", SPEC-025 §13); ambas as colunas mapeiam para o papel
  `ADMINISTRADOR` único, o que preserva o resultado da tabela (nenhum papel
  de equipe além do Administrador pode selar competência).

---

> Nota (2026-07-17): a "Importação Inicial da Base" listada aqui como
> entregável adjacente foi formalizada e implementada como **SPEC-003**
> (ver EPIC 01 acima) — esta seção foi consolidada lá, não duplicar.

---

## 4. Gates (fora da numeração de SPEC)

| Gate | Depende de | Fontes |
|---|---|---|
| **Architecture Freeze** (após SPEC-005) | SPEC-001, 002, 005 | `ADR-001`, `ADR — Linguagem Ubíqua`, `DECISOES_BLOQUEANTES.md` (decisões ✅) |
| **Architecture Freeze Final** | todas as SPECs previstas | Todos os itens acima + status 🟠 pendentes por fase |

---

## 5. Lacunas deste roteador (a preencher pelo PO, se necessário)

- Âncoras de subseção de `03 — Fronteiras`, `04 — Capacidades` e `06 — Modelo
  Conceitual` não foram detalhadas (documentos ainda em `~/Downloads`, não lidos
  por inteiro). Se alguma SPEC precisar de seção específica desses, **parar e
  solicitar a atualização deste roteador**.
- Numeração oficial da ADR de Linguagem Ubíqua (colisão `ADR-002`) a confirmar.

## 6. Dívida de documentação (achado da FASE 1 pós-SPECs, 2026-07-16)

- **`NEXT_AGENT.md`** (raiz do repo, inclusive em `origin/main`) descreve uma
  arquitetura V1 (`mae/`, produção via GitHub Pages/`pages-portal`) e uma V2
  anterior (`tear/`, domínio "Ativação") — nenhuma das duas existe na árvore
  atual (`CONHECIMENTO/docs/src/test`, confirmado em `origin/main`). É
  resíduo de uma reorganização estrutural anterior (commits de 2026-07-04:
  "vendorização"/"limpeza estrutural"; branch `chore/encerramento-fase-1`
  já tentou remover legado mas não cobriu este arquivo). **Não bloqueia** a
  V2 atual: o `.clasp.json` desta branch aponta para um Apps Script próprio
  e separado (2 deployments já rotulados "M1 — Portal Cadastro de
  Parceira" — claramente desta V2), sem relação com a suposta produção V1.
  **Ação tomada (2026-07-16, mandato de resolução autônoma):** marcado
  como obsoleto com nota no topo do próprio arquivo (não apagado — preserva
  histórico, reversível). **Ainda em aberto, decisão do responsável:**
  confirmar se `mae/`/V1 ainda está mesmo viva em produção em outro lugar
  (branch/repo separado) e se há necessidade real de migração de dados de
  lá (relevante para ADR-010: "migração da planilha antiga") — isso não é
  verificável a partir deste repositório.

> **Atualização (2026-07-19, sessão de limpeza de ambiente):** `NEXT_AGENT.md`
> e `CONHECIMENTO/` foram **removidos** do repositório (antes só o primeiro
> estava marcado como obsoleto, sem ser apagado) — preservados no histórico
> Git (commits `aa5546d` e anteriores). A pergunta em aberto acima **segue
> sem resposta**: uma auditoria completa do ambiente de desenvolvimento
> local encontrou evidências de pelo menos dois scriptIds de Apps Script
> distintos ligados a um possível "V1 em produção" — um reverse-engineered
> em `docs/04.5-engenharia-reversa/snapshot-v1/` do repositório
> `estudioela/ela-tear-v1` (scriptId `1jSMRq5wu...`), e outro da própria
> fase `mae/` deste repositório antes do refactor DDD (scriptId
> `1fE8w10O3...`, presente no histórico Git daqui, commits de 2026-07-03 a
> 2026-07-11). Nenhum dos dois foi verificado contra o Google Apps Script
> real (exigiria `clasp deployments -i <scriptId>` autenticado) — a
> verificação foi iniciada e interrompida a pedido do responsável do
> projeto nesta sessão, sem conclusão. **Ainda não verificável a partir
> daqui; pendência para sessão futura, se relevante.**

## 7. Dívidas técnicas (achado da FASE 4 pós-SPECs, 2026-07-16)

Auditoria por camada (Domain/ACL+Repository/Service+Controller+Entrypoint).
Corrigidas (baixo risco, comportamento preservado, suíte 100% verde antes/depois):
- `MesReferencia.igualA`/`comparadoCom` sem guarda `instanceof` (bug real:
  `igualA(null)` lançava `TypeError` cru; comparava incorretamente com
  objetos parecidos) — alinhado ao padrão das VOs irmãs.
- `SessaoACL.regravar`/`BloqueioACL.regravar` unificados com
  `reescreverAba` (`src/shared/ColunaFisica.js`) — corpo idêntico, só
  extração.
- `montarPerfilPortal()` abria `BASE DE DADOS` duas vezes por requisição
  (uma em `montarAcessoService()`, outra explícita) — `montarAcessoService`
  agora aceita a aba já aberta como parâmetro opcional.
- `AdaptadorDeCepBrasilApi` ganhou teste de unidade próprio
  (`test/cep-adapter.test.js`) — antes só era exercitado indiretamente.

Corrigidas (FASE 4.1, decisão explícita do responsável, 2026-07-16, suíte 100% verde antes/depois):
- **Convenção de validação de string obrigatória unificada**: as VOs que
  ainda usavam `if (!x || !String(x).trim())` migraram para
  `String(x == null ? '' : x).trim() === ''` (trata `0`/`false` corretamente
  como "não vazio"). Afetados: `BlocoDeFormato`, `CamposDeMesclagem`,
  `Briefing`, `Documento`, `Parceira`, `ColaboracaoMensal`,
  `IdentificadorDeEntrega`. Mensagens/códigos de erro preservados.
- **`Object.freeze` nos estados terminais de `Entrega`/`Envio`**:
  `Entrega.publicar()` e `Envio.marcarEntregue()` agora chamam
  `Object.freeze(this)` ao entrar no estado terminal (`Publicado`/
  `Entregue`), no mesmo padrão de `ColaboracaoMensal.arquivar()`.
- **`BriefingRepository.listarPor` removido** (`src/repository/BriefingRepository.js`):
  confirmado por grep que nenhum Service/Controller o chama — código morto.
  Teste correspondente ajustado em `test/briefing-repository.test.js`
  (duas asserções incidentais substituídas por `obterPor`; nenhum cenário
  de teste foi removido).
- **`CONTRATO_SOBERANO.md` §4 atualizado**: `Ativacao`/`EnvioLogistico`
  substituídos por `Entrega`/`Envio`, formalizado em
  `docs/adrs/ADR-012-renome-ativacao-fluxo-logistico.md` (o sentido de
  "ativação" referente ao vínculo Ativa/Inativa da Parceira foi preservado
  — é um conceito diferente, não tocado).

**Dívida registrada (saneamento de infraestrutura, 2026-07-19):**
`docs/design/DESIGN_SYSTEM.md` traz tokens desatualizados (paleta `#BC0004`,
cards com radius 16px, sombras discretas) que conflitam com a paleta e as
regras visuais já adotadas em `ADR-002-frontend-foundation.md` (`#CD0005`,
radius 0, "Absolute Flatness", zero box-shadow) e com o export elã/Stitch
em `docs/design/stitch-export/`. Atualizar `DESIGN_SYSTEM.md` para alinhar os
tokens ao ADR-002 antes da implementação frontend.

## 8. Preparação para deploy (FASE 6 pós-SPECs, 2026-07-16)

Ver `docs/_workspace/DEPLOY_CHECKLIST.md` (checklist completo de pré-deploy
e rollback). Achados principais:
- Única Script Property necessária: `SPREADSHEET_ID` (confirmado, sem
  outras chaves em uso).
- 8 abas físicas exigidas pelo código (`BASE DE DADOS`, `COLABORACOES`,
  `BRIEFING`, `ENTREGAS`, `ENVIOS`, `DOCUMENTOS`, `SESSOES`, `BLOQUEIOS`) —
  bate com `ADR-010`; resolução de coluna é exata (case/acento/espaço
  sensíveis, sem trim) — cabeçalho físico precisa bater exatamente.
- ⚠️ **`clasp push` substitui o manifesto remoto por completo** (não é
  incremental) — qualquer arquivo só no projeto remoto (ex. editado manual
  no editor web) fora da allowlist local seria apagado no próximo push.
  Confirmar isso com o operador antes do primeiro push real.
- **Resolvido (2026-07-16):** `ACL.js`/`Repositories.js` (legado da raiz,
  sem nenhuma referência ativa em `src/`, confirmado por grep) removidos do
  repositório e das linhas correspondentes do `.claspignore`.
- ✅ **Resolvido (2026-07-17, Sprint Portal MVP Online):** `access` trocado
  de `MYSELF` para `ANYONE` em `appsscript.json` — o pré-requisito (gate de
  autorização por papel) foi fechado em §11 abaixo. `ANYONE` (não
  `ANYONE_ANONYMOUS`) porque o login é federado via Google (SPEC-035):
  exige conta Google só para abrir a URL. Detalhe em
  `DEPLOY_CHECKLIST.md` §3.

## 9. Homologação (FASE 7 pós-SPECs, 2026-07-16)

Ver `docs/_workspace/ROTEIRO_HOMOLOGACAO.md` (roteiro manual completo: 3
jornadas, 15 passos, casos de borda e códigos de erro esperados). Nenhum
achado novo além dos já registrados nas §6/§7/§8 — a auditoria confirmou por
leitura direta do código que:
- O cadastro (`cadastro-parceira.html`) só tem o campo Nome — CEP/PIX/e-mail
  só existem hoje via Perfil do Portal (SPEC-032) ou edição direta na
  planilha.
- `appsscript.json access` trocado para `ANYONE` (§8, 2026-07-17) —
  homologação por outra pessoa deixa de estar bloqueada pelo acesso; segue
  exigindo login Google (SPEC-035) para passar do ecrã inicial. Achado
  original (bloqueio por `MYSELF`) mantido aqui do ponto de vista do
  homologador, agora resolvido.
- Rastreio automático (SPEC-016 D-02) nunca confirma entrega nesta versão —
  comportamento documentado, não bug.

## 10. Auditoria SPEC-012 (achados F1–F7, 2026-07-16)

Ver `docs/_workspace/auditorias/AUDITORIA_SPEC012.md` (relatório completo:
conformidade de `Entrega`/`EntregaACL`/`EntregaService` × SPEC-012, mais
cobertura de regras de negócio de 6 SPECs entregues). Achados e status:

- **F4 (resolvido, 2026-07-16):** escrita por reescrita total da aba sem
  `LockService` causava lost update silencioso em escrita concorrente
  (ex.: Parceira enviando material pelo Portal enquanto a equipe
  aprova/publica). Corrigido envolvendo as funções administrativas de
  escrita do Entrypoint (`compilarMes`, `preencherBriefing`,
  `enviarMaterial`, `aprovarEntrega`, `publicarEntrega`,
  `confirmarEndereco`, `registrarRastreio`, `atualizarStatus`) com a trava
  global já existente (`comTravaDeAcesso`) — sem refatorar as ACLs, como a
  própria auditoria recomendou.
- **F5 (mitigado, 2026-07-16):** ver §8/§9 acima — `appsscript.json`
  mantido em `MYSELF` porque nenhuma função administrativa verifica papel;
  abrir o acesso hoje exporia essas operações a qualquer chamador anônimo.
- **F7 (resolvido, 2026-07-16):** Q-03, D-02 (nome do evento
  `ConteudoPublicado`) e a dívida de material como URL já tinham decisão do
  PO (2026-07-15) só registrada em comentário de código — propagados para
  `SPEC-012-gestao-de-conteudo-e-ativacoes.md` §9/§21 e `CONTRATO_SOBERANO.md` §8.
- **F1/F2 (resolvidos, 2026-07-17):** `compilarMes` (`src/entrypoint/Portal.js`)
  agora reconcilia no ramo `jaCompilada`: chama `recriarParaCompetencia`/
  `materializarParaCompetencia` dos 3 Services (Briefing/Entrega/Envio)
  fora do evento `MesCompilado`. Cada Service ganhou guarda
  `existeParaCompetencia` (novo método nos 3 Repositories) que faz no-op
  quando a competência já tem alguma linha materializada — a mesma guarda
  resolve F2, porque o ramo destrutivo (`recriarCompetencia`/
  `substituirCompetencia`) nunca roda quando já existem dados.
- **F3 (resolvido, 2026-07-17):** `EntregaService.espelharAprovacoes`
  (`src/service/EntregaService.js`) agora filtra Entregas com
  `estado === 'Publicado'` antes de espelhar, em vez de lançar no meio do
  `.map` — Entregas arquivadas são puladas, o resto do lote é espelhado
  normalmente.
- ✅ **F6 (resolvido, 2026-07-18, auditoria de apoio):** UC-012.01 pedia
  ordem cronológica; `EntregaRepository.listarPor` devolvia ordem física
  da aba. Resolvido exatamente pela recomendação já registrada aqui:
  `PortalDeConteudoService.listarPendencias` (SPEC-027) agora ordena pelo
  join com `bloco.dataEntrega` (novo `ordenarPorDataDeEntrega`, sort
  estável, itens sem bloco preenchido por último) — sem espelhar a data na
  Entrega. Detalhe em `AUDITORIA_SPEC012.md` §F6. Teste novo em
  `test/portal-conteudo-service.test.js`; suíte completa 624/624 verde;
  lint limpo.
- **P1/P2 (resolvidos, 2026-07-17):** testes de caracterização escritos
  antes do commit da correção — `test/portal-compilar-mes.test.js`
  ("reconcilia materializações ausentes quando a competência já estava
  compilada (F1/F2)") e `test/entrega-service.test.js` ("pula Entregas já
  Publicado em vez de lançar, e espelha as demais do lote").

## 11. RBAC aplicado às rotas administrativas (fechamento Q-08, 2026-07-17)

Dívida registrada em SPEC-003/012/016/020/023/034 ("nenhum Controller do
sistema checava papel") e parcialmente resolvida por SPEC-035 (papéis
`ADMINISTRADOR`/`MARCA`/`INFLUENCIADORA` implementados, mas só as rotas do
próprio `UsuarioController` protegidas). Fechada para as 5 SPECs de equipe
(Entrega/Envio/Pagamento/Documento/Arquivamento):

- **Mecanismo:** nova guarda `exigirPapelAdministrador(dados)` em
  `src/entrypoint/Portal.js`, reaproveitando `UsuarioService.exigirPapel`
  (SPEC-035 §8.3) — nenhuma lógica de autorização duplicada. Aplicada na
  camada de Entrypoint (mesmo padrão do achado F4/SPEC-012: envolver a
  função exposta a `google.script.run`, sem alterar Controller/Service),
  exigindo `dados.token` de uma Sessão `ACTIVE` com papel `ADMINISTRADOR`.
- **Papel `Operador`:** as tabelas de §13 dessas SPECs distinguem
  Administrador/Operador, mas esse segundo papel nunca foi implementado —
  precedente já registrado em SPEC-025 §13 ("MVP operador único"),
  formalizado por SPEC-035 como papel único de equipe. As duas colunas
  mapeiam para `ADMINISTRADOR`; o resultado da tabela é preservado (nenhum
  papel além do Administrador acessa as operações restritas).
- **Rotas protegidas (15):** `aprovarEntrega`/`publicarEntrega`/
  `listarEntregas` (SPEC-012); `confirmarEndereco`/`registrarRastreio`/
  `atualizarStatus`/`listarEnvios` (SPEC-016); `lancarPagamentoAvulso`/
  `liberarPagamento`/`confirmarPagamento`/`listarPagamentos` (SPEC-020);
  `gerarContrato`/`gerarBriefingFormal` (SPEC-023); `selarCompetencia`/
  `arquivarLote` (SPEC-034 — `arquivarLote` ganhou o parâmetro `dados` que
  não tinha). Rotas já corretamente restritas por outro mecanismo não
  foram tocadas: `enviarMaterial` (Parceira-only, sem equivalente
  administrativo) e todas as fachadas de Portal (`*DoPortal`, já isoladas
  por `parceiraId` da própria Sessão, RN-01/INV-01 SPEC-027).
- ✅ **Corrigido (2026-07-18, auditoria de apoio):** `importarBaseLegada`
  (SPEC-003 §13, IM-03) também exigia papel Administrador e seguia sem
  guarda — fechado com o mesmo mecanismo (`exigirPapelAdministrador`,
  parâmetro `dados` novo), ver entrada de SPEC-003.
- ✅ **Resolvido (2026-07-18, sessão Tech Lead):** `enviarMaterial` (raw,
  `src/entrypoint/Portal.js`, distinto de `enviarMaterialDoPortal`). A
  premissa do achado original ("sem chamador em UI") estava **errada/
  desatualizada**: `src/ui/entrega.html` (tela interna de operação, Sprint
  Portal MVP Online) chama `enviarMaterial` para a equipe registrar
  material recebido fora do Portal em nome da Parceira — e a tela já
  injeta `dados.token` em toda chamada (`chamar()`). Correção aplicada:
  guarda `exigirPapelAdministrador(dados)`, mesmo mecanismo das demais 16
  rotas administrativas (total agora: 17). Teste RBAC novo em
  `test/portal-entrega.test.js`; CT-01 e o seed de
  `portal-financeiro.test.js` atualizados para autenticar. Suíte
  626/626 verde; lint limpo. **Dívida documental registrada:** a tabela
  §13 de SPEC-012 marca Administrador/Operador ❌ para envio de material,
  mas a operação real (equipe registra material recebido por WhatsApp)
  exige essa rota — a tabela da SPEC precisa ser emendada pelo PO para
  refletir a decisão operacional já embarcada na UI; até lá, a rota fica
  admin-only (estritamente mais restrita que o estado anterior, que era
  aberta a qualquer conta Google sem sessão).
- **Testes:** nenhum teste novo dedicado à guarda (mudança de escopo desta
  unidade, por decisão do responsável do projeto); os 5 smoke tests de
  Entrypoint que exercitam as rotas agora guardadas
  (`test/portal-arquivamento.test.js`, `portal-envio.test.js`,
  `portal-financeiro.test.js`, `portal-documentos.test.js`,
  `portal-entrega.test.js`) foram atualizados para autenticar como
  Administrador via nova fixture `test/helpers/rbacFixture.js` (Sessão +
  `Usuario` ACTIVE seedados direto, sem repetir o fluxo de login Google já
  coberto por `test/portal-usuario.test.js`). Suíte completa 599/599
  verde; lint limpo.

## 12. Consolidação ADR-014 integrada + auditoria de ecossistema externo (2026-07-19)

- **ADR-014 integrado:** uma worktree órfã (`worktree-consolidacao-arquivos-adr014`,
  sessão anterior não finalizada) continha a consolidação completa de `src/`
  descrita em `docs/adrs/ADR-014-consolidacao-de-arquivos-por-modulo.md` — 96
  arquivos `.js` (camadas acl/adapters/controller/domain/repository/service/shared)
  reduzidos a `src/modulos/*.js` (um por domínio) + `src/entrypoint/Portal.js` +
  `src/shared/Nucleo.js`. Mesclada em `feat/adr-013-oauth-code-flow` sem
  conflitos (`git merge-tree` confirmou sobreposição só em `README.md` e
  neste `TASK_ROUTER.md`, ambos resolvidos automaticamente). Suíte completa
  719/719 verde; lint limpo. Worktree e branch órfãs removidas após a
  mesclagem confirmada.
- **Auditoria de complexidade interna** (`src/`, `test/`, `docs/`,
  `knowledge/`, dependências): sem outras ações executadas — achados
  registrados na sessão, não neste documento (não se qualificam como estado
  de SPEC). Achado residual não fechado: `PLANILHA_TEAR_2.0_MAPA.md` (raiz)
  descreve o schema da planilha **legada** `[ELÃ] TEAR`, não o schema real
  de produção pós-ADR-010 (`SESSOES`/`SIS_IDENTIDADES`/`BASE_ADMINISTRADORES`/
  `COLABORACOES`...) — precisa ser corrigido ou arquivado para não induzir
  um agente futuro a erro.
- **Auditoria de ecossistema externo** (GitHub/Apps Script/Drive da conta
  `estudioela`/`elafashionmkt@gmail.com`), autorizada e executada por etapas:
  - `estudioela/ela-tear-v1` e `estudioela/plataforma` **arquivados no
    GitHub** (`isArchived: true`, reversível, histórico/branches
    preservados). Pré-ação cumprida antes do arquivamento de `plataforma`:
    branch `docs/roadmap-next-agent` (continha a decisão de suspensão do
    experimento Postgres/Supabase) mesclada em `main` via fast-forward antes
    de arquivar, para não perder o registro num repo depois read-only.
  - **Pendências que exigem ação manual** (sem ferramenta de escrita/exclusão
    para Google Drive ou Apps Script disponível nesta sessão):
    - Planilha `[ELÃ] PROJETO TEAR 1.0` cópia B
      (`1Z_Y39SBCb1zwkX02iV7r-rjBTzEwLlhNb-OnpHLmftw`) tem dados exclusivos
      (`Parceiros_Influenciadoras`: 12 registros; `Ciclos`: 1 linha) ausentes
      da cópia A (`1MVV9KF0eechiOOgUqdxbUuk00bClylSLa7xGPUDlLOs`) — dados já
      extraídos e preparados para colagem manual (arquivo local, não
      versionado por conter PII). Só depois da colagem a cópia B pode ser
      excluída.
    - Planilhas a arquivar manualmente: `[ELÃ] TEAR` (legada,
      `1BTTQNbpT3qvndE7qnfOU_rBggWZgnIIFTr8qaT97sZY`), `TEAR - FLUXO DE
      PROJETO V2.xlsx` (`1HyeB6SWVw8sNd14rPlm94_ht7huKOMQ6`), `[ELÃ] TEAR -
      CORE` (`1stzgS9TFgedP0nR9Ncla4bX72JCQ8apE2k0RcsbrXl4`) e a cópia A
      acima (legado V1).
    - Apps Script `teste calendario`
      (`1SQnHi_jiaJ8lo3huPPgA0ZHAIPKOPa_h-bbqb2AYdDMc86HPCDtmYyNv`) confirmado
      seguro para exclusão (boilerplate de tutorial do Google, sem
      deployment real, sem vínculo com TEAR) — falta só executar.
  - **Não tocados** (confirmados como corretos): `estudioela/estudioela`,
    `estudioela/jescri-migracao`, Apps Script `TEAR V2 — Portal` (produção) e
    `Portal TEAR - HOMOLOG`, planilhas `[PROD] TEAR - Base Operacional` e
    `[HML] TEAR - Base`.

## 13. ADR-014 publicada de fato no Apps Script oficial (2026-07-19)

- **Divergência encontrada:** o Apps Script oficial
  (`scriptId 12AxJsKHEr9GV3y6t0vIgHsghoUKM1hhTEe9j_0QW3fFRzxHcLAhwrhBZ`) tinha
  o HEAD (conteúdo editável) **byte-a-byte idêntico** ao commit `a5cca07`
  (pai da série de commits da ADR-014) — ou seja, nunca tinha recebido o
  `clasp push` da consolidação, apesar de a versão 27 já existir com o rótulo
  enganoso "ADR-014 - Consolidação para 27 arquivos". **Confirmado por diff:
  a v27 continha na verdade o conteúdo antigo por camada** (idêntico a
  `a5cca07`) — rótulo não correspondia ao conteúdo real, provavelmente porque
  a versão foi cortada antes do push da consolidação realmente aterrissar no
  HEAD (consistente com a "worktree órfã" mencionada no §12).
- **Correção executada nesta sessão:**
  1. `clasp push` do HEAD do branch consolidado (`e6dc068`) — 28 arquivos
     (14 `.js` + 13 `.html` + `appsscript.json`).
  2. `clasp pull` de verificação: HEAD remoto ↔ `src/` do repo, diff vazio.
  3. `clasp create-version` → **versão 32**, descrição explícita citando a
     correção do rótulo da v27.
  4. `clasp update-deployment` no deployment de produção real (o que as
     Parceiras usam — `AKfycbwUhR1P7ZQlf9l_gf5PdlXrxwVU4oyefWwIEg4oPUwpeHTqOo-iA6sB7bjnBvq58s0Q4g`,
     citado em `DEPLOY_CHECKLIST.md` e nas notas do §11) para apontar à v32.
  5. `clasp pull --versionNumber 32` de verificação final: diff vazio contra
     `src/` e `appsscript.json` do repo.
  6. `curl` ao `/exec` do deployment de produção: HTTP 200, redireciona
     corretamente para o login do Google (sem erro de script).
- **Produção agora = HEAD do repositório = versão 32.** As pastas antigas
  (`acl/adapters/controller/domain/repository/service/`) não existem mais em
  nenhum lugar do Apps Script (nem HEAD, nem a versão publicada).
- **Pendência restante (não executável por esta sessão):** fumaça visual
  completa da jornada logada (login → dashboard → telas operacionais) em
  produção, dependente de sessão de navegador logada pelo operador — mesma
  pendência já registrada em sessões anteriores (§ "Go-live operacional").
- **Nota para sessões futuras:** as versões 26/27 ficam no histórico com
  rótulo "ADR-014" mas conteúdo antigo — não usar como referência de rollback
  para a arquitetura consolidada; a v32 é a primeira versão cujo conteúdo foi
  de fato verificado byte-a-byte contra o git.

## 14. Redesign visual — Design System Estúdio Elã (iniciado 2026-07-19)

- **Origem:** sessão de auditoria de UI (`src/ui/`) comparando com o Design
  System Estúdio Elã e o export Stitch (`docs/design/stitch-export/`). Documentos de
  referência (raiz do repo, não em `docs/` por serem artefatos de sessão):
  `UI_AUDIT_REPORT.md`, `UI_DESIGN_SYSTEM_GAP_ANALYSIS.md`,
  `UI_IMPLEMENTATION_ROADMAP.md`, `UI_VISUAL_HANDOFF.md`,
  `NOTEBOOKLM_HANDOFF_UI.md`.
- **Princípio:** evolução visual incremental, não redesign estrutural —
  preserva páginas, `google.script.run`, arquitetura frontend/backend e
  regras de negócio. Decisão de marca vigente: adoção integral do DS Elã
  (vinho `#9f0003` no lugar do verde `#176b4b`), sem tema paralelo.
- ✅ **Fase 1 (fundação) + Fase 2 (`admin.html`)** — commit `9bf189a`
  (branch `feat/ui-design-system-ela`), aprovado pelo responsável do
  projeto em 2026-07-19 (screenshots em `auditoria/`). Suíte 719/719 verde,
  lint limpo.
- ✅ **Fase 3 (migração página a página) concluída em 2026-07-19** — todas
  as 11 páginas migradas em commits individuais na branch
  `feat/ui-design-system-ela`: `login.html` → `dashboard.html` →
  `perfil.html` → `briefing.html` → `entrega.html` → `envio.html` →
  `financeiro.html` → `pagamentos.html` → `pendencias.html` →
  `compilar-mes.html` → `documentos.html`. Regra transversal respeitada
  (zero mudança em nomes de função `google.script.run` ou payloads); cada
  página fechou com lint + suíte 719/719 verde antes do commit seguinte,
  mais auditorias de consistência/segurança em subagentes (sem achados).
  Achados corrigidos durante a migração (não previstos no roadmap original):
  - Bug de escape em atributos por concatenação de string HTML
    (`briefing.html`, `entrega.html`, `envio.html`, `pendencias.html`,
    `financeiro.html`) — um valor vindo do backend com aspas podia quebrar
    o atributo/markup; reescrito com `createElement`/`textContent`.
  - Estados de enum crus (`AguardandoMaterial` etc.) trocados por rótulos
    legíveis em badges (`entrega.html`, `envio.html`, `pagamentos.html`,
    `pendencias.html`).
  - `window.prompt()` em `pagamentos.html` substituído por painel próprio
    (não bloqueia a thread, mesma linguagem visual do DS Elã).
  - `id="resultado"` de `documentos.html` renomeado para
    `resultadoDocumento` — colidia conceitualmente com o padrão de alerta
    legado (`.ok/.erro/.info/.oculto`) que só `compilar-mes.html` usa de
    fato.
  - Item "consolidação de portal-head.html (limpeza de IDs legados)" do
    roadmap original **não se aplicava**: `id="mensagem"` é o padrão vivo
    em 11/12 páginas (não é removível sem quebrar todas), e `id="resultado"`
    só tem um usuário legítimo restante (`compilar-mes.html`) — nada para
    remover além da colisão já corrigida acima.
  - `dashboard.html`/`financeiro.html` também tiveram `innerHTML` de
    concatenação trocado por `createElement` (regra transversal do
    roadmap), e `financeiro.html` ganhou coordenação das duas chamadas
    `google.script.run` paralelas (mensagem "Carregando…" só limpa quando
    ambas terminam).
  - `pagamentos.html`/`documentos.html` desminificados (estavam em linha
    única).
- **Pendência para o responsável do projeto:** revisar e abrir PR de
  `feat/ui-design-system-ela` para `main` (push protegido — `main` exige
  PR no GitHub). Branch com 11 commits, todos com suíte 719/719 verde e
  lint limpo.
- **Pendências não bloqueantes:** P2 (fonte display IvyPresto — Adobe Fonts
  — usando fallback Fraunces por ora) e P3 (re-export Stitch para tokens
  secundários exatos de `on-surface`/`tertiary`/`surface-container-*`).
- **Fase 4 (responsividade/acessibilidade/microinterações):** não iniciada;
  mudanças estruturais de shell (sidebar/bottom nav) exigem ADR próprio
  antes da execução.
- **Nota (limpeza 2026-07-19):** os artefatos de sessão da Fase 1–3
  (`UI_AUDIT_REPORT.md`, `UI_DESIGN_SYSTEM_GAP_ANALYSIS.md`,
  `UI_IMPLEMENTATION_ROADMAP.md`, `UI_VISUAL_HANDOFF.md`,
  `NOTEBOOKLM_HANDOFF_UI.md`, `UI_FINAL_REVIEW.md`, `auditoria/`) foram
  removidos por já estarem concluídos e aprovados; as pendências não
  bloqueantes acima foram preservadas nesta seção.
- **Correção de caminho (2026-07-19, auditoria fase Implementação):** esta
  nota listava `docs/design/stitch-export/` entre os artefatos removidos — o
  diretório **continua presente no repositório**
  (`docs/design/stitch-export/DESIGN.md` + `docs/design/stitch-export/screens/`, 9 telas)
  e segue sendo a referência visual Stitch oficial. `UI_FINAL_REVIEW.md`
  também já não existe (a nota anterior dizia "mantido"); a PR #40 já foi
  revisada e mergeada em `origin/main` (merge commit `c96e618`).

---

## 15. Implementação paralela `tear-v2-app` (Laravel + React) — achado de governança (2026-07-20)

- **O que é:** um segundo sistema, independente do descrito neste roteador
  (GAS + Google Sheets, `src/`, `clasp`), vive em `tear-v2-app/` —
  `backend` (Laravel 12 + Sanctum + Spatie Permission) e
  `frontend` (React 19 + Vite + TypeScript). Nasceu nesta mesma
  branch (`feat/ui-design-system-ela`) em 7 commits (`ee3557f`…`f85264b`,
  2026-07-19), sem nenhuma SPEC, ADR ou entrada neste roteador cobrindo-o —
  achado de auditoria ao iniciar o fechamento do fluxo de cadastro de
  influenciadora nesse stack.
- **Não substitui nem estende as SPECs acima:** este roteador segue sendo a
  fonte de verdade do sistema GAS (em produção). `tear-v2-app` é um esforço
  paralelo; as regras de negócio RN-01/RN-02/RN-03 e RF-001–RF-004 do
  `docs/PRD.md` (§6.1/§7/§9) foram reaproveitadas como referência por serem
  agnósticas de stack, mas nenhuma SPEC formal foi aberta.
- **Estado em 2026-07-20 (fechamento do cadastro de influenciadora):**
  model `Parceira` (nasce `Inativa`, RN-01), CRUD administrativo
  (`ParceiraController`, atrás de `auth:sanctum`) e agora rota pública de
  cadastro (`POST /api/parceiras/cadastro`, sem auth, `throttle:6,1`) via
  `CadastroPublicoController`, com página pública `/cadastro` no frontend
  (`PublicCadastroPage.tsx`). RN-02 (endereço automático por CEP) **não
  implementado** — débito registrado, decisão do responsável do projeto em
  2026-07-20 de deixar para uma entrega futura.
- ✅ **Resolvida (2026-07-20):** decidido continuar cobrindo `tear-v2-app`
  por este mesmo roteador, nova entrada por módulo — ver "Módulo Campanhas /
  Colaborações" abaixo, primeiro módulo registrado nesse padrão.
- **Fluxo administrativo de aprovação de parceiras (2026-07-20):** primeiro
  fluxo operacional do admin implementado (cadastro público → admin lista
  pendentes → abre perfil → aprova → status muda para `Ativa`). Reaproveita
  o enum binário já existente (`Ativa`/`Inativa`, sem novo estado
  "pendente" — `Inativa` já cumpre esse papel) para não reabrir o mapeamento
  fechado do ADR-001 nem exigir ADR novo. Adicionado apenas: colunas
  `aprovado_por`/`aprovado_em` (auditoria, migration aditiva), método
  `Parceira::aprovar(User $admin)` (único ponto de escrita de status, RN-01),
  endpoint `PATCH /api/parceiras/{id}/aprovar` protegido por
  `role:ADMIN` (primeiro uso do `spatie/laravel-permission` já instalado
  mas até então sem nenhuma policy/gate aplicada), filtro
  `GET /api/parceiras?status=`, e nas telas: toggle "novas inscrições" em
  `ParceirasListPage`, botão "aprovar" em `ParceiraProfilePage` (visível só
  para `role === 'ADMIN'`) e card "Aprovações" do `Dashboard` com contagem
  real. Débito conhecido, não endereçado aqui (fora de escopo desta
  entrega): as demais rotas de `parceiras` (`index`/`show`/`update`)
  continuam sem gate de role — qualquer usuário autenticado ainda lê/edita
  qualquer parceira.
- **Módulo Campanhas / Colaborações (2026-07-20):** primeira vertical slice
  do fluxo de campanha, resolvendo a pendência acima ("decidir se este
  roteador passa a cobrir `tear-v2-app`") a favor de continuar cobrindo por
  aqui, mesma seção. Sem ADR/SPEC formal — decisão explícita do responsável
  do projeto nesta entrega (documentação completa fica para consolidação
  futura via NotebookLM); domínio aprovado em conversa antes da execução:
  - **Modelo:** três entidades novas, nenhuma reabre `Parceira` (que
    permanece só cadastral/perfil, sem campo de condição comercial):
    `Marca` (cadastro interno gerido por ADMIN — nome, contato, CNPJ,
    status `Ativa`/`Inativa`; **sem** login/tenant próprio, decisão
    explícita de escopo — nota também no PRD §11/§12/§13, que hoje trata
    suporte a múltiplas marcas como fora de escopo/futuro não confirmado:
    esta entrega abre essa porta arquiteturalmente, sem implementar acesso
    externo), `Campanha` (pertence a uma `Marca`; `data_inicio`/`data_fim`
    livres, sem amarração a `MesReferencia`/ciclo mensal do domínio legado
    GAS; enum `status` uppercase `PLANEJADA`/`ATIVA`/`ENCERRADA`/
    `CANCELADA`, transição só manual pelo ADMIN) e `ParticipacaoNaCampanha`
    (vínculo Campanha×Parceira; carrega a condição comercial específica
    daquele vínculo — `valor_contratado`, `reels_qtd`/`carrossel_qtd`/
    `stories_qtd` — e enum `status` uppercase `ATIVA`/`CANCELADA`).
  - **RN-C01…C04 (rascunho do agente, aprovadas em conversa antes da
    execução):** só Parceira `Ativa` pode ser vinculada (`Rule::exists`
    com `where('status','Ativa')` na FormRequest); uma Parceira não pode
    ter duas participações na mesma Campanha (`unique(campanha_id,
    parceira_id)` + `Rule::unique` na validação); nenhum `destroy` em
    nenhum recurso novo — remover vínculo é soft (`status → CANCELADA`),
    preservando histórico (mesma restrição "não apagar dados" das demais
    SPECs); FKs `restrictOnDelete()` (não cascade) nas 3 tabelas.
  - **Backend:** migrations `marcas`/`campanhas`/`participacoes_na_campanha`
    → models com relacionamentos (`Marca::campanhas`, `Campanha::marca`/
    `::participacoes`, `ParticipacaoNaCampanha::campanha`/`::parceira`) →
    FormRequests/Resources/Controllers no mesmo padrão de
    `ParceiraController` → rotas em `routes/api.php`
    (`GET/POST /api/marcas`, `GET/POST /api/campanhas`,
    `GET/POST /api/campanhas/{campanha}/participacoes`,
    `PATCH /api/participacoes/{participacao}`; leitura aberta a qualquer
    autenticado, escrita atrás de `role:ADMIN`, mesmo padrão parcial já
    usado em `parceiras.aprovar`). 30 testes novos (`MarcaTest`,
    `CampanhaTest`, `ParticipacaoNaCampanhaTest`), suíte completa 49/49
    verde, `vendor/bin/pint --test` limpo.
  - **Frontend:** `lib/marcas.ts`/`campanhas.ts`/`participacoes.ts` +
    componentes novos `SelectField` (reaproveita `TextField.module.css`) e
    `Badge` (genérico, tons success/neutral/error, substitui o
    `StatusBadge` específico de Parceira só para os novos status
    uppercase) → `MarcasListPage`/`MarcaFormPage`,
    `CampanhasListPage`/`CampanhaFormPage`/`CampanhaDetailPage` (esta
    última concentra o fluxo de vínculo: busca Parceiras `Ativa`, exclui as
    já vinculadas do select, formulário de valor+entregáveis, tabela de
    participações com ação "cancelar"). `AppShell` ganhou nav real para
    "Marcas" e "Campanhas" (antes placeholders sem link); `Dashboard`
    ganhou card "Campanhas" com contagem de `ATIVA`. `tsc -b && vite build`
    e `oxlint` limpos (nenhum warning novo).
  - **Validação manual (2026-07-20):** critério de aceite percorrido
    ponta a ponta no navegador, logado como `admin@tear.test` (seed
    `DevUserSeeder`) — criar Marca "Jescri" → criar Campanha "Verão 2026"
    vinculada → selecionar Parceira `Ativa` ("Ana Teste", a Parceira
    `Inativa` existente ficou corretamente fora do select) → definir valor
    (R$ 2500) e entregáveis (2 reels/1 carrossel/4 stories) → participação
    criada e visível na tabela da Campanha → cancelamento soft testado
    (badge muda para `CANCELADA`, registro permanece, RN-C03) → edição de
    status da Campanha (`PLANEJADA`→`ATIVA`) refletida no card do Dashboard
    e no filtro `?status=ATIVA` da listagem.
  - **Fora desta entrega (próxima fatia):** briefing, produção/aprovação de
    conteúdo, logística e pagamento por participação — hoje só existe o
    vínculo comercial Campanha×Parceira.
  - **Módulo Briefings (2026-07-20):** CRUD ADMIN de `Briefing` 1:1 com
    `ParticipacaoNaCampanha` (`orientacoes`, `prazo`, `entregaveis_esperados`;
    `restrictOnDelete`, sem `destroy`). Backend: migration/model/FormRequests/
    Resource/`BriefingController` (`show`/`store`/`update`), rotas
    `GET/POST /api/participacoes/{participacao}/briefing`,
    `PATCH /api/briefings/{briefing}` (leitura autenticado, escrita
    `role:ADMIN`). Frontend: `lib/briefings.ts`, `BriefingFormPage`
    (create/edit na mesma rota), `TextareaField` novo (reaproveita
    `TextField.module.css`), ação "briefing" na tabela de participações de
    `CampanhaDetailPage`. 9 testes novos, suíte 58/58 verde, pint/tsc/vite
    build/oxlint limpos.
    - **FUTURO/BACKLOG:** Portal da Influenciadora (login próprio,
      ramificação de rota por `role`, leitura de briefing/campanha) — hoje
      todo autenticado cai no `AppShell` admin; `Parceira.user_id` já
      existe mas falta `User::parceira()` inverso. Upload de material,
      aprovação (com cálculo de data tipo RN-04) e pagamento por
      participação também ficam para depois.
  - **Módulo Portal da Influenciadora — Sprint 2.1, primeiro acesso e perfil
    (2026-07-20):** primeira fatia do backlog acima — só dashboard inicial e
    perfil, por escopo explícito do responsável do projeto (campanhas,
    briefing, materiais e pagamentos ficam para a próxima entrega, o backlog
    acima permanece válido para o restante). Relatório completo:
    `docs/reports/RELATORIO_SPRINT_2_1_PORTAL_INFLUENCIADORA.md`.
    - **Débito fechado antes de expor a tela de perfil:** `ParceiraPolicy`
      não tinha método `update` — `PATCH /parceiras/{id}` aceitava qualquer
      autenticado (débito já registrado no relatório da Sprint 1, §4 item 1).
      Corrigido: `update()` = dono (`user_id === user.id`), `ADMIN` continua
      liberado por `Gate::before`. Dois testes existentes que exercitavam
      essa rota sem posse nem papel precisaram passar a autenticar como
      ADMIN (não testavam o cenário pretendido — nenhum comportamento de
      produto mudou).
    - **Backend:** `GET /me/parceira` (resolve sempre `request->user()->
      parceira`, nunca aceita ID). Nenhuma tabela/entidade nova — perfil e
      medidas reaproveitam `PATCH /parceiras/{id}` e `GET/POST /parceiras/
      {id}/medidas` já existentes (este último já autorizava por posse desde
      a Sprint 1, sem gate de papel — influenciadora já podia gravar as
      próprias medidas antes desta entrega, só não havia UI).
    - **Frontend:** `PortalShell` (nav Painel/Perfil, sem itens
      administrativos) montado em `App.tsx` quando `role === 'INFLUENCIADORA'`
      (ramificação de 3 vias: sem sessão → Login; influenciadora → Portal;
      demais papéis → `AppShell` inalterado). `ResetPasswordPage`
      (`/definir-senha`, fora da árvore autenticada) fecha o ciclo de convite
      que a Sprint 1 deixou pela metade (endpoint backend já existia, sem
      página). `PortalDashboardPage` (saudação, status, próximos passos
      dinâmico conforme perfil completo/incompleto). `PortalPerfilPage`
      (dados pessoais com consentimento LGPD obrigatório + medidas
      versionadas, dois formulários independentes).
    - **Validação:** 3 testes novos de isolamento entre duas influenciadoras
      reais (`PortalIsolamentoTest`) + 3 de `/me/parceira`
      (`MeParceiraTest`), suíte completa 117/117 verde, pint/tsc/oxlint/vite
      build limpos. Jornada ponta a ponta percorrida no navegador (convite →
      definir senha → login → dashboard → perfil, dados pessoais e medidas
      salvos e persistidos, CEP auto-preenchido) com uma Parceira real criada
      e aprovada na sessão.
  - **Módulo Portal da Influenciadora — Sprint 2.2, campanhas/briefing/
    materiais/pagamento (2026-07-21):** fecha o restante do backlog descrito
    acima (nenhuma entidade/migration nova, só telas e rotas de leitura +
    ação para o dono da participação). Implementado em 5 commits
    (`794c3f0`…`dd35440`), sem relatório dedicado nesta sessão — registrado
    aqui por ser a fonte de verdade única do estado do projeto.
    - **`PortalCampanhasListPage`/`PortalCampanhaDetailPage`:**
      `GET /campanhas` já filtrava por posse desde o módulo de Campanhas
      (`CampanhaController::index`, `whereHas('participacoes', parceira_id
      = user.parceira.id AND status ATIVA)` quando o papel não é `ADMIN`) —
      reaproveitado sem mudança de backend. Tela nova só consome a API já
      existente.
    - **Briefing por tipo:** `PortalCampanhaDetailPage` lista os briefings
      da própria participação (`GET /participacoes/{id}/briefings`, já
      autorizado por `ParticipacaoNaCampanhaPolicy::view` = dono da
      participação `ATIVA`), agrupados por `tipo` com badge.
    - **Envio de material:** mesma tela ganhou formulário de upload
      (`POST /participacoes/{id}/materiais`, rota já aberta ao dono desde o
      módulo de Materiais — sem gate de role, só `authorize('view',
      $participacao)`); reaproveita `uploadMaterial` já usado pelo admin.
    - **Status de pagamento:** `GET /participacoes/{id}/pagamento`
      (`PagamentoController::show`, mesma policy de posse) exibido como
      tabela somente leitura — nenhuma ação de aprovação/edição exposta ao
      papel `INFLUENCIADORA` (continua `role:ADMIN`).
    - **Máscaras de digitação e CEP:** débito P1 do relatório da Sprint 1
      fechado nesta mesma leva — `lib/mascaras.ts` (telefone/CNPJ/CEP) e
      `lib/cep.ts` (busca ViaCEP on-blur, só preenche campos ainda vazios)
      aplicados em `PublicCadastroPage` e `PortalPerfilPage`.
    - **Achado de cobertura fechado nesta sessão (2026-07-21):** as 4 rotas
      de leitura reaproveitadas acima (`campanhas.show`/`index`,
      `briefings.index`, `pagamento.show`) tinham a checagem de posse
      correta no código desde que foram escritas, mas só `Material` tinha
      teste automatizado provando isolamento entre influenciadoras
      (`MaterialTest`). Adicionados 3 testes em `PortalIsolamentoTest`
      (campanha/briefing/pagamento de participação alheia → 403),
      fechando a mesma cobertura para as 3 abas que faltavam. Suíte
      completa 127/127 verde, pint limpo, `tsc -b && vite build`/`oxlint`
      limpos (único warning pré-existente em `auth.tsx:72`, não tocado).
    - **Débito fechado nesta sessão (2026-07-21):** `ParceiraFormPage`
      (tela administrativa de editar parceira) nunca enviava
      `consentimento_aceito` — débito registrado em
      `docs/reports/RELATORIO_SPRINT_2_1_PORTAL_INFLUENCIADORA.md` §5 desde 2026-07-20 e
      não corrigido até agora. `UpdateParceiraRequest` exige esse campo
      (`required|accepted`) desde a Sprint 1, então **todo `PUT
      /parceiras/{id}` feito pelo admin retornava 422** — a tela de editar
      parceira estava quebrada em produção para o próprio admin. Corrigido
      com o mesmo checkbox já usado em `PortalPerfilPage`, visível só no
      modo de edição. Validado manualmente no navegador (PUT retornou 200,
      redirecionou para o detalhe com os dados salvos); `tsc -b`/`vite
      build`/`oxlint` limpos.
    - **Verificação de débitos antigos (2026-07-21):** `docs/reports/HANDOFF_PRODUCTIZACAO_TEAR_V2.md`
      §2/§3 (2026-07-20) listava "RBAC de leitura não existe" e locale
      `en` como pendências. Ambos já **resolvidos** neste ponto do código,
      não identificados nesta sessão: todo controller de `tear-v2-app`
      chama `authorize()` com policy por posse ou por papel
      (`ParceiraController`, `CampanhaController`, `MarcaController`,
      `MaterialController`, `PagamentoController`, `BriefingController`,
      `ParticipacaoController`); `APP_LOCALE=pt_BR` já configurado em
      `.env`/`.env.example` com `lang/pt_BR/` completo. Único item real
      ainda pendente e fora do controle de código: credenciais reais do
      Google Drive (`GOOGLE_DRIVE_CLIENT_EMAIL`/`GOOGLE_DRIVE_PRIVATE_KEY`
      vazias) — bloqueio externo, não corrigível sem acesso que o agente
      não possui.
  - **Varredura técnica final do Portal — P0/P1/P2 (2026-07-21):** antes de
    autorizar a preparação de deploy, auditoria completa das telas do
    Portal em busca de funcionalidade incompleta, inconsistência de UX,
    edge case e dívida técnica de baixo risco. Achados e decisões:
    - **P0-1 (fechado, `392de04`):** não existia nenhuma forma de uma
      influenciadora recuperar acesso ao Portal se esquecesse a senha ou
      perdesse a janela de 60 min do convite — lockout permanente, exigindo
      intervenção manual via `tinker`. Implementado com o broker nativo de
      senha do Laravel (`Password::broker()->sendResetLink()`, customizado
      via `ResetPassword::createUrlUsing()`/`toMailUsing()` — pontos de
      extensão oficiais para SPA, sem autenticação própria) + endpoint de
      reenvio de convite pelo admin (`POST /parceiras/{id}/reenviar-convite`,
      reaproveita o mesmo código de `aprovar()`). Detalhe completo na
      mensagem do commit `392de04`.
    - **P0-2 → reclassificado para P2 (decisão do responsável do projeto,
      2026-07-21):** TikTok/UGC como tipos de deliverable estão parcialmente
      implementados — a migration já criou `tiktok_qtd`/`ugc_qtd` e
      `Briefing` já valida os 5 tipos, mas `StoreParticipacaoRequest`/
      `UpdateParticipacaoRequest`/`ParticipacaoResource` nunca aceitam nem
      expõem esses 2 campos, e nenhuma tela (admin ou Portal) tem input
      para eles — hoje é impossível contratar um deliverable de TikTok ou
      UGC para qualquer participação real. **Não implementar agora** — a
      operação da Jescri ainda não comercializa esses formatos; retomar
      só quando isso mudar.
    - **P1 (fechados, `d37526f`):** `/api/login` sem nenhum rate limit
      (`bootstrap/app.php` nunca chamava `throttleApi()`) — aplicado
      `throttle:6,1`, mesmo padrão já usado em `/password/reset` e
      `/parceiras/cadastro`; `PortalDashboardPage` com texto desatualizado
      ("em breve suas campanhas") contradizendo a Sprint 2.2 já entregue;
      seção de Materiais em `PortalCampanhaDetailPage` sem estado de
      carregamento (Briefing/Pagamento já tinham).
    - **P1 registrado, não fechado:** erro genérico no upload de material
      não repassa o motivo real do backend (ex. arquivo acima de 50MB) —
      polimento de baixo risco, não bloqueia produção.
    - **Infra-dependente, fora do controle de código (checklist para quem
      for fazer o deploy):** credenciais reais do Google Drive; variáveis
      de produção (`APP_ENV=production`, `APP_DEBUG=false`, `FRONTEND_URL`,
      `SESSION_DOMAIN`, `SANCTUM_STATEFUL_DOMAINS`, `APP_URL`,
      `VITE_API_URL`); engine de banco de produção (hoje SQLite dev;
      `docs/reports/HANDOFF_PRODUCTIZACAO_TEAR_V2.md` recomenda Postgres); `MAIL_MAILER`
      hoje é `log` — sem SMTP/SES real, nenhum e-mail (convite, redefinição
      de senha) chega de fato a uma caixa de entrada real.
    - **Conclusão:** com P0-1 fechado e P0-2 reclassificado para P2 fora do
      escopo atual, não há nenhum P0 de código restante bloqueando a
      entrada em produção do Portal da Influenciadora. Único bloqueio real
      é a preparação de infraestrutura (lista acima).
  - **QA operacional pré-Go-Live, sessão interrompida por limite de contexto
    (2026-07-21):** validação manual dos dois perfis via navegador
    (`admin@tear.test`/`marina.duarte@example.com`, dados de teste criados
    via tinker: 1 Campanha/Participação ATIVA/Briefing). Sessão foi
    interrompida no meio do fluxo — cobriu login (admin, credenciais
    inválidas) e Campanhas → Briefing (admin) antes de parar; **não chegou**
    a Parceiras, Aprovações, Materiais, Pagamentos, Documentos/Histórico
    (admin) nem a nenhum fluxo do Portal da Influenciadora (cadastro,
    convite, dashboard, perfil, campanhas, upload, pagamento, logout).
    - **Corrigido (`605de91`):** `lang/pt_BR/validation.php` só tinha
      `attributes` de Parceira/Marca — nunca atualizado para os campos de
      Briefing/Campanha/Participação/Pagamento. Erro de validação exibia
      a chave crua (`"O campo orientacoes é obrigatório."` em vez de
      "orientações"). Adicionadas as 28 chaves que faltavam. Suíte
      147/147 verde, pint limpo, verificado no navegador antes do commit.
    - **Observado, não confirmado como bug (não investigado a fundo por
      limite de tempo):** no primeiro clique num link do menu lateral
      (`Campanhas`) logo após um `navigate()` de página inteira (login ou
      F5), a navegação client-side não ocorreu (URL ficou em `/`); um
      segundo clique no mesmo link, ou clicar em outro item do menu
      primeiro, funcionou normalmente. Não reproduzido de forma
      determinística o suficiente para abrir causa raiz — registrar aqui
      para quem retomar tentar reproduzir com o DevTools aberto (suspeita:
      timing de hidratação/attach de listener do React Router logo após
      navegação completa de página).
    - **Dado de dev encontrado, não é bug de produto:** usuário seed
      `influenciadora@tear.test` (`DevUserSeeder`) tem papel
      `INFLUENCIADORA` mas nenhuma `Parceira` vinculada (`user_id`) — login
      funcionaria mas o Portal quebraria ao tentar resolver `/me/parceira`.
      Não testado neste ponto da sessão. Não é um bug real (nenhum fluxo de
      produto cria User sem Parceira), só uma armadilha do seed para quem
      for logar como essa conta específica em QA futura — usar
      `marina.duarte@example.com` (tem Parceira `Ativa`, id=1) ou criar a
      vinculação antes de testar com a conta seed.
    - **Próxima sessão deve retomar QA a partir daqui:** Parceiras
      (CRUD, aprovação, convite, reenvio), Aprovações, Materiais (upload,
      MIME allowlist já fechada em `28c6ba4`), Pagamentos, Documentos/
      Histórico (placeholders — confirmar se é esperado ou débito),
      Perfil admin (placeholder — mesma dúvida), e todo o Portal da
      Influenciadora ponta a ponta (cadastro → aprovação → convite →
      primeiro acesso → login → esqueci senha → perfil → campanhas →
      briefings → upload → pagamentos → histórico → logout). Dados de
      teste (Campanha id=1 "Campanha QA Verao 2026", Participação id=1,
      2 Briefings) já existem no banco local — reaproveitar em vez de
      recriar. Senha de `marina.duarte@example.com` foi redefinida para
      `password` nesta sessão (dev/QA apenas).
  - **QA operacional pré-Go-Live, sessão concluída (2026-07-21):** retomada
    exata do ponto acima. Cobriu todos os fluxos restantes: Parceiras
    (CRUD/aprovação/convite/reenvio), Aprovações e Materiais (upload,
    aprovar, reprovar), Pagamentos (criar, aprovar, regra de bloqueio por
    material não aprovado), Documentos/Histórico/Perfil (admin), e a
    jornada completa do Portal da Influenciadora (cadastro público →
    aprovação → primeiro acesso/definir senha → login → esqueci senha →
    campanhas → briefing → upload → pagamentos → perfil → logout), incluindo
    um smoke test ponta a ponta com identidade única (parceira "Beatriz
    Souza QA Portal", id=3, participação id=2 na Campanha id=1).
    - **P0 de segurança encontrado e corrigido (`0a2bc5b`):** `POST
      /api/parceiras` (autenticado) não tinha `role:ADMIN` nem policy de
      `create` — qualquer usuário autenticado, inclusive uma
      INFLUENCIADORA, podia criar registros de `Parceira` arbitrários via
      API, contornando o fluxo de cadastro. Corrigido restringindo a rota a
      ADMIN (mesmo padrão de `/marcas` e `/campanhas`); testes que
      assumiam acesso irrestrito foram migrados para o endpoint público
      `POST /parceiras/cadastro` (mesma lógica de validação, é o local
      correto para essa cobertura). Suíte 148/148 verde, pint limpo.
    - **P1 confirmado e ampliado (não corrigido, não bloqueia produção):**
      o erro genérico "Não foi possível enviar o material"/"...atualizar o
      pagamento" que não repassa o motivo real do backend (já registrado
      na sessão anterior só para upload de materiais) também ocorre em
      **Pagamentos** — confirmado com um 409 real ("Pagamento não pode ser
      aprovado: há material da participação ainda não aprovado") mascarado
      pela mesma mensagem genérica no frontend. Mesmo padrão, dois pontos
      de origem; vale um fix único (propagar `error.response.data.message`
      quando existir) em vez de dois patches pontuais.
    - **P2 novos (cosméticos/não bloqueantes):**
      - Valores monetários exibidos sem formatação pt-BR (`R$ 2273.98` em
        vez de `R$ 2.273,98`) em Campanha (coluna Valor) e Pagamento.
      - Template de e-mail transacional (convite/definir senha) mistura
        "Regards," em inglês no corpo majoritariamente em português
        (visto no e-mail de convite enviado via `MAIL_MAILER=log`).
      - `GET /marcas` e `GET /marcas/{marca}` dependem só da
        `MarcaPolicy` para bloquear não-ADMIN (funciona hoje, mas sem
        `role:ADMIN` explícito na rota como as demais escritas de
        `/marcas`/`/campanhas` — frágil a regressão futura caso a Policy
        mude sem repor a restrição na rota). Recomendação de hardening,
        não é um gap ativo hoje (achado do subagente de auditoria de
        rotas, verificado).
    - **Não reproduzido nesta sessão:** o bug de navegação client-side
      registrado na sessão anterior (primeiro clique no menu lateral após
      `navigate()` de página inteira) — testado explicitamente logo após
      login (full page navigate) e não ocorreu. Mantido como observação
      não determinística, sem repro nesta rodada.
    - **Infra-dependente, reconfirmado (fora do controle de código):**
      Google Drive real não configurado neste ambiente dev → upload de
      material retorna 503 tanto no admin quanto no Portal (mensagem
      backend correta: "Envio de materiais está temporariamente
      indisponível"); `MAIL_MAILER=log` → e-mails (convite, redefinição de
      senha) não chegam a caixas de entrada reais. Ambos já listados no
      checklist de infra da sessão anterior; nenhum é bug de código.
    - **Cobertura de testes (achado do subagente, verificado):** backend
      bem coberto para os fluxos de negócio (Parceiras, Materiais,
      Pagamentos, Briefings, isolamento entre influenciadoras). Documentos
      e Perfil (admin) sem teste porque são `PlaceholderPage` ainda não
      implementadas — comportamento esperado, confirmar com PO se entram
      no MVP do Go-Live ou ficam para depois. Frontend não tem nenhum
      teste automatizado (0 arquivos `*.test.*`) — toda a camada React
      depende de QA manual como esta.
    - **Veredito: APTO PARA GO-LIVE** (código), condicionado à preparação
      de infraestrutura já listada (credenciais Google Drive, SMTP/SES
      real, `APP_ENV=production` e variáveis relacionadas, banco de
      produção). Nenhum P0 de código restante. P1/P2 acima são polimento,
      não bloqueiam a entrada em produção.
  - **Auditoria estática final de prontidão para Go-Live — Agente B
    (2026-07-21):** agente independente, sem sobreposição com a QA manual
    acima (não abriu navegador, não alterou código). Varredura estática
    completa de `tear-v2-app` (rotas, controllers, policies, models,
    FormRequests, upload/Drive, auth/CORS/Sanctum, headers de segurança,
    seeders, templates `.env*`, frontend auth/roteamento) para responder
    apenas: existe problema técnico de código que ainda impeça o Go-Live?
    Suíte (148/148), `pint --test` e `tsc -b`/`oxlint` do frontend
    conferidos verdes antes da conclusão.
    - **P0:** nenhum novo. Os P0 fechados em sessões anteriores (gate ADMIN
      em `POST /parceiras`, allowlist de MIME em Material, hash de senha no
      reset via cast `'password' => 'hashed'`, recuperação de acesso do
      Portal) foram reverificados no código atual e estão corretos —
      incluindo o bypass `Gate::before` de ADMIN e ownership por policy em
      Campanha/Participação/Material/Pagamento/Marca.
    - **P1 (novo, não fechado):** comentário de `.env.example` e
      `.env.production.example` afirma que a ausência das credenciais
      `GOOGLE_DRIVE_*` faz o upload de Material "cair automaticamente em
      armazenamento local (disco 'public')" — falso: `MaterialController
      ::store` retorna 503 e bloqueia o upload sem nenhum fallback. Quem
      seguir o template de produção ao pé da letra pode subir sem as
      credenciais achando que uploads locais funcionariam. Corrigir o
      comentário nos dois arquivos antes do deploy.
    - **P1 (já registrado, reconfirmado ainda aberto):** erro genérico no
      upload de material não repassa a causa real (Drive fora do ar, token
      expirado, arquivo grande) — `MaterialController::store` só trata a
      ausência de configuração (503); qualquer outra falha vira exceção não
      tratada → 500 genérico. Baixo risco, não bloqueia.
    - **P2 (novo, registrado sem ação):** papel `GESTOR_MARCA` (só existe
      em `DevUserSeeder`, guardado a `local`/`testing`) não tem nenhum
      modelo de autorização real no backend (`MarcaPolicy::viewAny` sempre
      `false` fora de ADMIN, ownership filters devolvem vazio), mas o
      frontend manda qualquer papel `!== 'INFLUENCIADORA'` para o
      `AppShell` administrativo completo — se esse papel for atribuído a um
      usuário real no futuro, a UI ficaria quebrada (403 em quase tudo).
      Sem risco ativo hoje (nenhum fluxo de produção cria esse papel).
    - **P2 (novo, registrado sem ação):** `laravel/pulse` instalado e
      documentado em `.env.production.example` como observabilidade
      "restrita a ADMIN" em `/pulse`, mas não existe `Gate::define
      ('viewPulse', ...)` customizado em `AppServiceProvider` — o gate
      padrão do pacote (`app()->environment('local')`) bloqueia `/pulse`
      para todos em produção. Falha de forma segura, mas a funcionalidade
      documentada não funciona até alguém adicionar o gate.
    - **P2 (novo, registrado sem ação):** `Pagamento::$fillable` inclui
      `status` sem necessidade — nenhum controller faz mass-assignment
      desse campo hoje (`StorePagamentoRequest` não valida `status`,
      `update()` atribui campo a campo checando `existeMaterialNaoAprovado`
      manualmente), então não é explorável agora, mas é superfície mais
      permissiva do que o necessário para um endpoint futuro menos
      cuidadoso. Sugestão: remover do fillable e centralizar a transição
      num método dedicado, mesmo padrão de `Parceira::aprovar()`.
    - **Veredito: APTO PARA GO-LIVE COM RESSALVAS.** Nenhum P0 de código
      bloqueando produção; os P1/P2 acima são polimento de baixo risco.
      Confirma a conclusão de "Varredura técnica final do Portal" acima.
      Passos restantes são só infraestrutura (nenhum é código): credenciais
      reais do Google Drive; banco Postgres de produção; `MAIL_MAILER` real
      (hoje `log`, sem SMTP/SES nenhum e-mail chega); variáveis de produção
      (`APP_ENV`, `APP_DEBUG=false`, `APP_KEY`, `APP_URL`, `FRONTEND_URL`,
      `SESSION_DOMAIN`, `SESSION_SECURE_COOKIE=true`,
      `SANCTUM_STATEFUL_DOMAINS`, `VITE_API_URL`); deploy (build frontend,
      migrations, `admin:create` para o primeiro ADMIN). Detalhe completo:
      `docs/reports/HANDOFF_FINAL.md`.
  - **Preparação de Release Engineering — sessão Agente B (2026-07-21,
    continuação):** mandato era auditar config de produção, produzir
    checklist (Banco/Storage/Email/Laravel/Frontend) e escrever
    `RUNBOOK_DE_DEPLOY.md`. Achado ao iniciar: praticamente todo o
    material já existia de sessões anteriores do mesmo dia —
    `docs/release/TEAR_V2.5_GO_LIVE_CHECKLIST.md` (checklist completo) e
    `docs/deployment/DEPLOY.md` (runbook: pré-requisitos, deploy,
    rollback, backup). Criar um `RUNBOOK_DE_DEPLOY.md` novo duplicaria
    `DEPLOY.md` quase por completo (`CLAUDE.md`, "Não criar documentação
    duplicada") — decisão: não criar arquivo novo, estender o runbook
    existente com as duas peças que faltavam (`DEPLOY.md` §4 "Smoke test
    pós-deploy" formalizado em 8 passos, §5 "Critérios para declarar
    produção saudável", ambos ausentes antes; seções seguintes
    renumeradas §6-9).
    - **Concorrência detectada durante a sessão:** enquanto este agente
      auditava, uma sessão paralela ("Engenheiro de Release e Deploy",
      mesma branch/working dir, sem worktree) editava e commitou
      `docs/release/TEAR_V2.5_GO_LIVE_CHECKLIST.md` +
      `backend/.env{,.production}.example` em tempo real
      (commit `794c849` — fechou P0-1/P0-8 como resolvidos e corrigiu o
      mesmo comentário falso sobre fallback do Drive já registrado em
      `docs/reports/HANDOFF_FINAL.md`). Este agente evitou tocar nesses 3
      arquivos para não colidir com a escrita concorrente; só editou
      `docs/deployment/DEPLOY.md`, não tocado pela outra sessão — sem
      conflito. **Nota operacional para sessões futuras:** este ambiente
      não isola sessões paralelas em worktrees; duas sessões "Agente B"
      simultâneas na mesma working dir é um risco real de write race,
      não hipotético — id do commit concorrente serve de evidência.
  - **Smoke test final da jornada crítica ponta a ponta (2026-07-21,
    sessão QA operacional):** os 13 passos do fluxo crítico (cadastro
    público → aprovação → primeiro acesso → definir senha → login →
    campanhas → briefing → upload de material → aprovação de material →
    pagamentos → histórico → perfil → logout) executados via browser real
    (Playwright) contra o ambiente de dev local já em pé (`php artisan
    serve`/Vite), com uma identidade nova de ponta a ponta ("QA Smoke Test
    20260721", `Parceira` id=4, participação id=3 na `Campanha QA Verao
    2026`). Nenhum bug bloqueante encontrado; nenhuma correção de código
    necessária nesta sessão.
    - **Confirmado, não é bug:** upload de Material retornou 503
      ("Envio de materiais está temporariamente indisponível") — sem
      Google Drive real configurado, como já documentado (`docs/reports/HANDOFF_FINAL.md`,
      P1 de erro genérico reconfirmado). Sem Material persistido, a etapa
      "aprovação de material" não foi executável neste ambiente — não
      contornado via `tinker` para não mascarar o comportamento real de
      produção sem credenciais.
    - **Achado esclarecido (não é bug):** aprovar um Pagamento de uma
      participação sem nenhum Material (nem pendente) teve sucesso
      imediato (`PENDENTE → APROVADO → PAGO`), aparentemente contradizendo
      o P0 de bloqueio por material não aprovado fechado em sessão
      anterior. Não é regressão: `PagamentoController::existeMaterialNaoAprovado`
      só bloqueia quando existe Material com status `!= APROVADO`; o caso
      vácuo (zero materiais) aprova normalmente — comportamento
      explicitamente documentado no próprio código (comentário do método,
      "mesma regra do legado"). O 409 relatado na sessão de QA anterior
      ocorreu com um Material real pendente, cenário diferente deste.
    - **Confirmado, sem mudança:** `Histórico` e `Perfil` (admin) seguem
      `PlaceholderPage`; checkbox de consentimento LGPD não vem
      pré-marcado após reload (exige reconfirmação a cada salvamento —
      comportamento esperado do `accepted` do Laravel, não testado a
      fundo antes mas consistente com o padrão do restante do formulário).
    - **P2 cosmético novo, não corrigido (fora de escopo — captura apenas
      melhoria, não bug bloqueante):** `ParceiraProfilePage` exibe
      Telefone e CNPJ sem a máscara aplicada no cadastro (`11987654321`
      em vez de `(11) 98765-4321`) — a máscara só existe no formulário de
      entrada, não na exibição. Mesma categoria dos P2 de formatação
      monetária já registrados (não pt-BR em Campanha/Pagamento,
      reconfirmados ainda presentes nesta sessão).
    - **Nenhum sinal de escrita concorrente** detectado durante esta
      sessão (`git fetch`/`status` antes e depois, sem commits novos
      aparecendo; banco de dev usado de forma aditiva, sem `migrate:fresh`
      nem reset).
    - **Veredito desta rodada:** nenhum P0/P1 novo. Jornada crítica
      íntegra ponta a ponta. Confirma o veredito de
      `docs/reports/HANDOFF_FINAL.md`/sessões anteriores: **APTO PARA GO-LIVE**
      (código), condicionado à infraestrutura já listada (Google Drive,
      SMTP, Postgres, variáveis de produção).

## 16. Due diligence do plano estratégico + consolidação de auditorias externas (2026-07-22)

- **Due diligence do Plano Mestre** (painel de 9 especialistas de IA
  independentes) e duas auditorias externas adicionais (Manus AI, CPO)
  revisaram `docs/planning/PLANO_MESTRE_ELA_INFLUENCIA.md` e documentos
  irmãos. Relatório consolidado: `RELATORIO_CONSOLIDACAO_AUDITORIAS.md`
  (raiz do repo).
- **Achado de maior valor prático: branch órfã `worktree-spec-mvp-completa`
  não reconciliada.** Confirmado por investigação direta (`git log`,
  `git merge-tree`) nesta sessão: 16 commits únicos desde o ponto de
  divergência `dd5e297`, **zero conflitos** contra `feat/ui-design-system-ela`
  (merge-tree limpo). Implementa, já testado, exatamente lacunas apontadas
  por três auditorias independentes: módulo de logística mínimo viável
  (`Envio`, model+controller+migration+factory), cálculo automático da data
  de aprovação do briefing (RN-04), campos contratuais em `Parceira`,
  congelamento de condições comerciais da Participação, landing page
  pública de onboarding com fluxo de reprovação de cadastro. 54 arquivos,
  1675 inserções/74 remoções (`git diff --stat` confirmado). Nenhum dos
  três documentos de planejamento estratégico nem este roteador
  mencionavam essa branch antes desta sessão.
  - **Merge NÃO executado nesta sessão** (nota histórica — ver correção
    abaixo) — tentativa de `git merge` foi bloqueada pelo classificador de
    permissão do harness (ação significativa e de reversão custosa: 16
    commits, nova regra de negócio, não é documentação). Decisão correta:
    mesclar 1675 linhas de lógica de negócio dentro de uma tarefa de
    consolidação de auditoria excederia o escopo autorizado e merece sua
    própria sessão dedicada (Auditoria → Plano → Execução → Validação →
    Commit).
  - ✅ **Correção (2026-07-22):** o merge foi executado em sessão dedicada
    subsequente — commit `24f7dfc`, 16 conflitos resolvidos, suíte subiu de
    151 para 183 testes (todos verdes). Branch `worktree-spec-mvp-completa`
    já integrada; decisão de arquivar/apagar a branch remota segue em
    aberto, sem urgência técnica.
- **Correções aplicadas nesta sessão** (detalhe completo em
  `RELATORIO_CONSOLIDACAO_AUDITORIAS.md`): (1) consentimento LGPD passou a
  ser exigido e registrado no **nascimento do dado** (cadastro público de
  Parceira), não só na edição — `Parceira::registrarConsentimentoCadastro()`,
  nova migration aditiva (`consentimento_cadastro_aceito_em`/`_ip`), gate em
  `StoreParceiraRequest` (rota pública e rota administrativa), checkbox em
  `PublicCadastroPage.tsx`; suíte 151/151 verde, Pint limpo, `tsc`/build/lint
  do frontend limpos. (2) Contradição de arquitetura Docker vs. Locaweb
  resolvida na documentação: `docs/deployment/DEPLOY.md` reescrito para o
  fluxo GitHub Actions + SSH + symlink já decidido em
  `docs/deployment/ARQUITETURA_PRODUCAO.md` (não a alternativa de SFTP "bare
  metal" sugerida por uma das auditorias externas, que seria uma regressão
  frente ao runbook atômico já especificado em
  `docs/deployment/PLANO_IMPLEMENTACAO.md`); `docs/release/TEAR_V2.5_GO_LIVE_CHECKLIST.md`
  atualizado nos itens normativos (P0-2, ordem de execução, estimativa de
  esforço, checklist de Deploy), narrativa histórica de sessões anteriores
  preservada sem alteração.

## 17. Consolidação documental pós-merge — 4 documentos do `worktree-spec-mvp-completa` (2026-07-22)

- **Contexto:** o merge (§16) trouxe 4 documentos novos direto para `docs/`
  raiz (`BACKLOG_EXECUTIVO_MVP.md`, `ESPECIFICACAO_FUNCIONAL_MVP_COMPLETA.md`,
  `PLANO_EXECUCAO_MVP.md`, `DECISAO_TAXONOMIA_MATERIAL_BRIEFING.md`) que se
  sobrepunham em escopo a documentos canônicos de `docs/planning/`. Achado
  registrado em `ESTADO_SESSAO.md` §5 (risco #1). Diagnóstico completo
  (leitura integral dos 4 documentos e dos 3 canônicos candidatos) feito
  antes de qualquer alteração.
- **Decisão de produto necessária para destravar a consolidação:** CPF como
  alternativa a CNPJ tinha duas respostas incompatíveis entre os documentos
  do merge (`HU-3.5`: "não fazer") e o canônico `BACKLOG_FUNCIONAL_V2_6.md`
  (`CD-01`, MUST: "fazer"). **Decisão do responsável do projeto
  (2026-07-22): CPF passa a ser suportado, conforme CD-01. HU-3.5 tratada
  como superada.**
- **Reorganização executada:**
  - `docs/ESPECIFICACAO_FUNCIONAL_MVP_COMPLETA.md` → movido para
    `docs/planning/ESPECIFICACAO_FUNCIONAL_MVP_COMPLETA.md`, passa a ser a
    **fonte oficial de especificação funcional**. Justificativa objetiva
    para substituir o canônico anterior (não só "é maior"): o próprio
    documento se declara consolidação explícita de 13 fontes incluindo a
    V2.5 (fonte #2 citada em seu §0); auditoria de conteúdo confirmou 100%
    do conteúdo de V2.5 presente, zero contradições, mais material que V2.5
    não tinha (medidas em cm, comprovante de pagamento, viabilidade de
    importação de histórico, lista única de decisões pendentes).
  - `docs/planning/ESPECIFICACAO_FUNCIONAL_TEAR_V2.5.md` → arquivado em
    `docs/archive/consolidacao-mvp-completa/` (superado pelo item acima).
  - `docs/BACKLOG_EXECUTIVO_MVP.md` → arquivado em
    `docs/archive/consolidacao-mvp-completa/` como registro histórico de
    execução (não é superset/subset de `BACKLOG_FUNCIONAL_V2_6.md` — são
    documentos de momentos diferentes, execução vs. planejamento futuro).
    `BACKLOG_FUNCIONAL_V2_6.md` **permanece a única fonte vigente** de
    backlog. Nota de supersão de HU-3.5 adicionada ao topo do arquivo.
  - `docs/PLANO_EXECUCAO_MVP.md` → arquivado em
    `docs/archive/consolidacao-mvp-completa/`: sua função (sequenciamento/
    dependências entre tarefas) é a mesma que este roteador já cumpre como
    fonte única de estado (`CLAUDE.md` §Documentos oficiais); mantê-lo
    vigente em paralelo criaria duas fontes de verdade para sequenciamento.
    Ondas 0-2 concluídas; Ondas 3-6 restantes já mapeadas em itens MUST/
    SHOULD de `BACKLOG_FUNCIONAL_V2_6.md` (LG-01, C-01/C-02, PM-01,
    H-01/H-02).
  - `docs/DECISAO_TAXONOMIA_MATERIAL_BRIEFING.md` → arquivado em
    `docs/archive/consolidacao-mvp-completa/`: decisão já implementada
    (HU-4.1), sem canônico correspondente ativo.
  - `docs/planning/PLANO_MESTRE_ELA_INFLUENCIA.md` → **não tocado**: par
    óbvio (`PLANO_EXECUCAO_MVP.md`) tratava de altitude diferente (negócio/
    calendário de macrofases vs. sequenciamento técnico de histórias), sem
    duplicidade real.
- **Correções colaterais aplicadas em `BACKLOG_FUNCIONAL_V2_6.md`** (achado
  durante a comparação, fora do par comparado): `CD-02` (consentimento LGPD)
  e `B-01` (Briefing/RN-04) estavam listados como pendentes mas já foram
  implementados (commits `e0756c0` e `6709ee7`) — status atualizado inline,
  texto de análise original preservado.
- **Referências cruzadas corrigidas:** citação interna de
  `ESPECIFICACAO_FUNCIONAL_MVP_COMPLETA.md` (RFC-09/RFC-10) que apontava
  para o documento que estava sendo superado por ele mesmo; 3 referências em
  `docs/planning/PLANO_FINAL_CONGELAMENTO_OPERACIONAL.md` que apontavam para
  `ESPECIFICACAO_FUNCIONAL_TEAR_V2.5.md` §11, atualizadas para
  `ESPECIFICACAO_FUNCIONAL_MVP_COMPLETA.md` §3.6/§3.7. Referências em
  documentos já arquivados (`docs/archive/**`) e em auditorias históricas
  congeladas (`docs/governance/REPOSITORY_GOVERNANCE_AUDIT.md`) não foram
  alteradas — são fotografias de um momento específico, não documentação
  viva.
- **Resultado:** cada tema tratado pelos 4 documentos do merge agora tem
  exatamente uma fonte oficial vigente (ver tabela em
  `docs/archive/README.md` §`consolidacao-mvp-completa/`).

## 18. Macrofase A (Go Live interno) — início da execução, ajustes de código sem credenciais reais (2026-07-22)

- **Contexto:** início da execução técnica da Macrofase A, seguindo a ordem
  de `docs/deployment/IMPLEMENTACAO_TECNICA.md` §1. Itens 1/2/5/7 dessa
  ordem (confirmação de acesso Locaweb, provisionamento de banco/DNS/Drive,
  configuração do host, primeiro deploy) exigem credenciais/acesso reais
  que o agente não possui — não executados. Itens 3 e 6 (parte de código,
  sem credenciais) executados nesta sessão.
- **Alterações de código (§2/§3 de `IMPLEMENTACAO_TECNICA.md`):**
  - `GoogleDriveService.php` — suporte a Shared Drive
    (`supportsAllDrives`/`includeItemsFromAllDrives`/`corpora=drive`/
    `driveId`), ausente até então; sem isso `ensureFolder`/`uploadFile`
    falhariam silenciosamente contra o Shared Drive institucional.
  - `bootstrap/app.php` — `trustProxies` condicionado a `TRUSTED_PROXIES`
    (vazio por padrão, sem mudança de comportamento fora de produção).
  - `.env.production.example` / `.env.example` / `config/services.php` —
    `DB_HOST` deixou de assumir `db` (docker-compose); adicionadas
    `TRUSTED_PROXIES` e `GOOGLE_DRIVE_BACKUP_FOLDER_ID`.
  - `scripts/backup-db.sh` — reescrito para `pg_dump` direto contra o banco
    gerenciado (lendo `backend/.env`), sem `docker compose exec`.
  - `app/Console/Commands/BackupDatabaseToDrive.php` (novo, comando
    `backup:upload-to-drive`) + `app/Notifications/BackupFalhouNotification.php`
    (novo) — upload do dump ao Shared Drive via `GoogleDriveService`, com
    alerta por e-mail aos ADMINs em caso de falha (via `Notification`, não
    `Mail::raw()` — este último é no-op sob `Mail::fake()`, logo
    intestável; o padrão de notificação já usado no projeto,
    `InfluenciadoraConviteNotification`, foi seguido).
  - `scripts/crontab.example` (novo) — linhas exatas das Etapas 9/10 de
    `PLANO_IMPLEMENTACAO.md`, para copiar ao crontab real do host.
- **Bloqueio arquitetural encontrado (parou a execução antes das Etapas 5/6
  de CI/CD — job de build do frontend + deploy SSH):**
  `ARQUITETURA_PRODUCAO.md` decide subdomínio único (`tear.estudioela.com`)
  com o Laravel servindo `public/build`, mas o repositório atual não tem
  essa fiação: `frontend/vite.config.ts` não aponta `outDir` para
  `backend/public/build`, não há `laravel-vite-plugin`, `backend/routes/web.php`
  só retorna a view placeholder `welcome` (sem rota catch-all servindo a
  SPA), e `SESSION_DOMAIN`/`SANCTUM_STATEFUL_DOMAINS` no template ainda
  assumem múltiplos subdomínios (ponto inicial), o que é redundante/
  potencialmente incorreto para origem única. **Decisão de arquitetura
  necessária antes de continuar:** como o build do frontend chega ao
  usuário — servido pelo Laravel a partir de `public/build` (origem única,
  como a decisão registrada assume) ou como site estático separado (ainda
  que no mesmo subdomínio via proxy do servidor web)? Isso define o job de
  CI (Etapa 5), o script/workflow de deploy (Etapa 6) e potencialmente
  `config/cors.php`/`config/sanctum.php`. Não decidido nesta sessão —
  registrado aqui para não ficar só no resumo do chat.
- **Validação:** backend 188/188 testes verdes (469 assertions, +5 novos
  testes de `backup:upload-to-drive`), Pint limpo, `composer audit` sem
  achados, `tsc -b` do frontend limpo (frontend não alterado nesta sessão).
- **Próximo passo:** decisão de arquitetura acima, depois retomar Etapas
  5/6 de `PLANO_IMPLEMENTACAO.md`. Etapas 1/2/3/4/7+ permanecem bloqueadas
  por credenciais reais (fora do escopo de execução do agente).

## 19. Resolução do bloqueio arquitetural (§18) — ADR-015, Etapas 5/6 executadas (2026-07-22)

- **Decisão do responsável do projeto:** o Laravel serve o frontend a
  partir de `public/build`, origem única — sem domínio separado para a
  SPA. Registrada em
  `docs/adrs/ADR-015-frontend-servido-pelo-laravel.md` (contexto,
  mecânica, alternativas consideradas e rejeitadas, consequências).
- **Implementação (Etapas 5/6 de `PLANO_IMPLEMENTACAO.md`):**
  - `frontend/vite.config.ts` + novo script `npm run build:locaweb`
    (`frontend/package.json`) — `outDir`/`base` só mudam para
    `backend/public/build`/`/build/` sob `VITE_BUILD_TARGET=locaweb`;
    `npm run build` padrão continua gerando `dist/` sem mudança, para não
    quebrar o `Dockerfile` do frontend (dev local via `docker-compose.yml`)
    nem a validação do CI de testes.
  - `backend/routes/web.php` — rota catch-all substitui a antiga view
    placeholder `welcome` (removida, junto com
    `resources/views/welcome.blade.php` e `tests/Feature/ExampleTest.php`,
    ambos scaffold do Laravel sem uso real). Serve
    `public/build/index.html`; 404 com mensagem clara se o build não
    existir. Não captura `/api/*`/`/up` — validado por
    `tests/Feature/SpaCatchAllRouteTest.php` (novo) e manualmente via
    `php artisan serve`.
  - `backend/.env.production.example` — `SESSION_DOMAIN` sem ponto
    inicial (host único); `FRONTEND_URL`/`SANCTUM_STATEFUL_DOMAINS`
    documentados como a mesma origem de `APP_URL`.
  - `backend/config/cors.php` — comentário explicando que em produção
    (origem única) o CORS não é exercido pelo navegador; permanece só
    para o dev local cross-origin (`:5173` → `:8000`).
  - `.github/workflows/tear-v2-deploy.yml` (novo) — builda o frontend
    (`npm run build:locaweb`, gerando `backend/public/build`) e publica
    `backend/` inteiro via rsync/SSH para
    `releases/<id>/`, chamando `scripts/deploy-locaweb.sh`
    (novo) no host: `composer install --no-dev`, symlink de
    `.env`/`storage` compartilhados, `migrate --force`, cache de
    config/rotas/views, swap do symlink `current`. Falha rápido e visível
    se os secrets de SSH (`SSH_HOST`/`SSH_USER`/`SSH_PRIVATE_KEY`/
    `DEPLOY_BASE_PATH`) ainda não estiverem cadastrados — não configurados
    nesta sessão (credenciais reais, fora do alcance do agente).
  - `.github/workflows/tear-v2-docker.yml` — removido (`IMPLEMENTACAO_TECNICA.md`
    §9 já previa a aposentadoria; produção não consome mais imagem
    Docker). `docker-compose.yml` permanece intocado, só para dev local.
- **Validação:** backend 191/191 testes verdes (475 assertions, +3 novos
  testes de `SpaCatchAllRouteTest`), Pint limpo; frontend `tsc -b` e
  `oxlint` limpos (só o warning pré-existente de `auth.tsx:80`, não
  relacionado); `npm run build` (padrão) confirmado gerando `dist/` sem
  regressão; `npm run build:locaweb` confirmado gerando
  `backend/public/build/index.html` com assets sob `/build/`; roteamento
  ponta a ponta verificado com `php artisan serve` (`/`, `/build/assets/*`,
  `/api/health`, rota desconhecida da SPA — todas resolvendo como
  esperado).
- **Próximo passo:** nenhum bloqueio técnico remanescente nas Etapas 5/6.
  Etapas 1/2/3/4/7+ de `PLANO_IMPLEMENTACAO.md` continuam bloqueadas por
  credenciais/acesso reais (Locaweb, banco gerenciado, DNS, Google
  Workspace) — fora do alcance do agente, aguardando o responsável do
  projeto. Dívida já registrada e não tocada por esta ADR: `docs/deployment/DEPLOY.md`
  e `docs/release/TEAR_V2.5_GO_LIVE_CHECKLIST.md` ainda descrevem o fluxo
  Docker/Coolify anterior (pendência de `IMPLEMENTACAO_TECNICA.md` §2,
  tratada em sessão própria antes da Etapa 11).

  > **Correção (§20, 2026-07-22):** a nota acima estava incorreta. Ambos os
  > documentos já haviam sido reescritos para o fluxo Locaweb/SSH no commit
  > `ef18225`, anterior a esta sessão — o texto de `IMPLEMENTACAO_TECNICA.md`
  > §2 que originou esta nota estava desatualizado, não os documentos em si.

## 20. Correção de referências desatualizadas + reavaliação do `PLANO_IMPLEMENTACAO.md` (2026-07-22)

- **Gatilho:** typo encontrado ao final da sessão anterior —
  `IMPLEMENTACAO_TECNICA.md` referenciava
  `ADR-015-frontend-servido-pelo-laravel-origem-unica.md` (arquivo
  inexistente); o real é `ADR-015-frontend-servido-pelo-laravel.md`.
  Corrigido, e confirmado que não havia outra ocorrência do nome errado no
  repositório.
- **Achado maior durante a reavaliação:** `IMPLEMENTACAO_TECNICA.md` §2/§3/§6/
  §9/§10/§12 estava inteiro desatualizado — escrito como mapeamento
  prospectivo (2026-07-21) e nunca atualizado depois que os commits
  `29a8306` e `ac5180f` implementaram praticamente tudo que a tabela listava
  como "precisa ajustar"/"precisa criar". Corrigido item a item com
  referência ao commit que resolveu cada um.
- **Achado específico:** a alegação repetida em três lugares
  (`IMPLEMENTACAO_TECNICA.md` §2/§12 e `PLANO_IMPLEMENTACAO.md` Etapa 11) de
  que `docs/deployment/DEPLOY.md` e
  `docs/release/TEAR_V2.5_GO_LIVE_CHECKLIST.md` "ainda descrevem o fluxo
  Docker/Coolify antigo" estava **errada** — ambos já haviam sido reescritos
  no commit `ef18225` (anterior até à criação de `IMPLEMENTACAO_TECNICA.md`
  em `59ca61a`). Ninguém voltou para atualizar a nota depois. Corrigido nos
  três lugares; único ajuste real necessário em `DEPLOY.md` foi alinhar a
  chamada de build (`npm run build` → `npm run build:locaweb`, ADR-015).
- **`PLANO_IMPLEMENTACAO.md`:** adicionada nota de status no topo (Etapas
  5/6 executadas) e STATUS ao final de cada uma das duas etapas, sem alterar
  o runbook das Etapas 1-4/7-12 (continuam não executadas, corretamente).
- **Reavaliação completa das Etapas 1-12** (pedido explícito desta sessão):
  confirmado que **todo** o trabalho tecnicamente possível sem acesso
  externo está feito. As únicas pendências reais são infraestrutura/
  credenciais que o agente não possui — detalhe etapa a etapa em
  `IMPLEMENTACAO_TECNICA.md` §12 (resumo consolidado, reescrito nesta
  sessão) e na resposta desta sessão ao usuário.
- **Nenhum código alterado nesta sessão** — só documentação (correção de
  referências e reavaliação de status). Nenhuma tarefa técnica nova estava
  disponível para executar sem credenciais; nenhum trabalho foi inventado.
- **Validação:** `grep` confirmou zero ocorrências residuais do nome de
  arquivo incorreto; suíte de testes não foi re-executada por não haver
  mudança de código nesta sessão.
- **Próximo passo:** aguardando exclusivamente o responsável do projeto
  (credenciais Locaweb/banco/DNS/Google Workspace, secrets do GitHub
  Actions). Sem esses insumos, não há próxima tarefa de engenharia
  disponível no TEAR V2 além de manutenção/observação.

## 21. Auditoria funcional do MVP + correção de 1 bug real + revisão de menu (2026-07-22)

- **Gatilho:** usuário reportou 404 ao acessar o portal via Laravel em
  dev (`npm run dev` + `php artisan serve`) — investigado como possível
  regressão de ADR-015. Diagnóstico: não é regressão (`/` nunca serviu o
  portal real nesse modo, antes era a view `welcome`) — dev sempre foi
  acessado via `:5173` (Vite). Corrigido só a mensagem de 404 (mandava
  rodar `npm run build`, que gera `dist/`, não `public/build/index.html`
  — só `build:locaweb` faz isso) e adicionado aviso específico em
  ambiente local.
- **Auditoria funcional completa do MVP** (código real, não documentação)
  pedida pelo usuário: mapeou todos os itens de menu do Admin e do Portal
  da Influenciadora contra a implementação real. Achados principais:
  - **Bug real e crítico, corrigido:** `PortalCampanhasListPage.tsx`
    acessava `campanha.participacoes[0]` sem guarda; `CampanhaController::index()`
    não fazia eager-load de `participacoes`; `CampanhaResource::whenLoaded`
    omitia a chave inteira do JSON; sem `ErrorBoundary` em `main.tsx`, a
    SPA inteira quebrava ao abrir "Campanhas" no Portal — sempre que a
    influenciadora tinha ao menos uma campanha real (caminho feliz, não
    caso de borda). Corrigido: `CampanhaController::index()` agora
    eager-carrega `participacoes` (escopada por parceira quando
    não-ADMIN, mesmo padrão do `show()`); frontend ganhou `?.` defensivo.
    Teste de regressão: `CampanhaTest::test_lista_de_campanhas_inclui_participacoes_da_propria_influenciadora`.
    Validado ao vivo no navegador (login como influenciadora, campanha
    real, "ver" abre a participação sem crash).
  - **Falso positivo da própria auditoria, corrigido antes de agir:**
    `MedidaController::store` sempre cria um novo registro em vez de
    fazer update — isto **não é bug**. Existe teste dedicado
    (`MedidaInfluenciadoraTest::test_nova_medida_nao_sobrescreve_a_anterior_e_medida_atual_e_a_mais_recente`)
    e um accessor `Parceira::medidaAtual()` — histórico de medidas é
    design deliberado e testado. Nenhuma mudança feita neste controller;
    decisão de transformar em update-in-place fica para o responsável do
    projeto, se quiser abrir mão do histórico.
  - **9 itens de menu do Admin** (Colaborações, Briefings, Materiais,
    Aprovações, Logística, Pagamentos, Documentos, Histórico, Perfil)
    prometiam telas que não existem como visão própria (a maioria
    redirecionava para `/campanhas`; 4 eram `PlaceholderPage` "Em
    construção"). **Decisão do usuário:** não remover nada da
    arquitetura/rotas/componentes — só desabilitar a navegação no menu,
    rotulando `"Item (em breve)"`, sem link. Implementado em
    `AppShell.tsx` (`NAV_ITEMS` sem `to` para esses 9 itens); `App.tsx`,
    `PlaceholderPage.tsx`/`.module.css` e as rotas de drill-down
    (`/participacoes/:id/briefing|materiais|pagamento|envio`, já
    funcionais) permanecem intactos. Dois cards estáticos do Dashboard
    admin ("Colaborações", "Financeiro") tiveram só o texto trocado para
    "Em breve — indicador ainda não implementado" (antes soava como dado
    real).
  - **`GESTOR_MARCA`:** papel seedado mas sem nenhuma tela alcançável
    (não há UI de criação de usuário com esse papel) — `CampanhaController`/
    `ParceiraController` retornam vazio ou 403 para ele. Sem risco ativo
    hoje (já registrado como P1 em `GO_LIVE_CHECKLIST.md`); não é
    bloqueio de MVP.
- **Validação:** backend 192/192 verde (478 assertions), Pint limpo,
  `tsc -b`/`vite build`/`oxlint` do frontend limpos. Verificação visual
  no navegador (login admin e influenciadora) confirmando o menu reduzido
  e o fluxo antes quebrado agora funcional.
- **Próximo passo:** MVP funcionalmente pronto para a fase de
  infraestrutura (ver §22).

## 22. Consolidação do plano de implantação (Go-Live) (2026-07-22)

- **Pedido:** inventário completo de dependências de infraestrutura
  externa, em ordem de execução, com objetivo/dependências/onde
  configurar/como validar/critérios de aceite por item, consolidado num
  `PLANO_DE_IMPLANTACAO.md`.
- **Criado:** `docs/deployment/PLANO_DE_IMPLANTACAO.md` — documento único
  de execução do Go-Live, 17 etapas (domínio → acesso Locaweb → Postgres
  → DNS → Google Drive → SMTP → `APP_KEY` → `.env` real → secrets do
  GitHub → estrutura de diretórios no host → primeiro deploy →
  provisionar admin → backup → fila/scheduler → uptime check → smoke
  test → corte para produção), mais rollback e rotina pós-go-live.
  Nenhuma decisão de arquitetura reaberta — consolida e corrige (não
  substitui) `PLANO_IMPLEMENTACAO.md`, `CONFIGURACAO_PRODUCAO.md`,
  `DEPLOY.md` e `GO_LIVE_CHECKLIST.md`.
- **Achado durante a consolidação:** `CONFIGURACAO_PRODUCAO.md` e
  `MONITORING.md` ainda tinham comandos de exemplo da arquitetura Docker
  anterior (ex.: `docker compose run --rm app php artisan key:generate`),
  nunca atualizados quando `ARQUITETURA_PRODUCAO.md` (2026-07-21) mudou
  para Locaweb sem Docker. Corrigido o comando de `APP_KEY` em
  `CONFIGURACAO_PRODUCAO.md`; adicionada nota de ponteiro no topo dos 4
  documentos consolidados (nenhum arquivo foi apagado ou arquivado — só
  o `PLANO_DE_IMPLANTACAO.md` passa a ser a ordem de execução oficial).
- **Nenhum código alterado** — só documentação (consolidação +
  correção de referências desatualizadas), conforme instrução explícita
  do usuário ("não implemente novas funcionalidades... apenas atividades
  de implantação, configuração, segurança, validação e operação").
- **Próximo passo:** aguardando o responsável do projeto executar as
  Etapas 1-10 de `PLANO_DE_IMPLANTACAO.md` (decisões e credenciais
  externas) — nenhuma delas pode ser feita pelo agente.

## 23. Etapa 1 do Go-Live concluída — domínio definitivo (2026-07-22)

- **Decisão do responsável do projeto:** subdomínio definitivo de
  produção é **`influencia.estudioela.com`** (substitui o exemplo
  ilustrativo `tear.estudioela.com` usado em todos os documentos até
  esta data).
- **Propagado em código/documentação:**
  `backend/.env.production.example` (`APP_URL`,
  `FRONTEND_URL`, `SANCTUM_STATEFUL_DOMAINS`, `SESSION_DOMAIN`
  preenchidos com o valor real, restam só os `CHANGE_ME` que dependem de
  credencial externa), `docs/deployment/PLANO_DE_IMPLANTACAO.md` (Etapa
  1 marcada concluída, placeholders `<subdomínio>` substituídos pelo
  valor real nas Etapas 4/11/12/15), `docs/deployment/ARQUITETURA_PRODUCAO.md`
  §8/§12, `docs/deployment/DEPLOY.md`,
  `docs/adrs/ADR-015-frontend-servido-pelo-laravel.md` (só o exemplo
  ilustrativo — decisão de arquitetura não reaberta),
  `docs/deployment/PLANO_IMPLEMENTACAO.md` (histórico, todas as
  ocorrências do exemplo antigo substituídas para não confundir consulta
  futura).
- **Não alterado:** `docs/deployment/CONFIGURACAO_PRODUCAO.md` (usa um
  exemplo de domínio ainda mais antigo, `tear.com.br`/arquitetura
  multi-subdomínio — já documentado como rewrite integral pendente, não
  é bloqueio, fora do escopo desta etapa) e §21 deste documento
  (histórico da sessão anterior, preservado sem alteração).
- **Nenhum código de funcionalidade alterado** — só configuração/
  documentação, conforme mandato desta fase.
- **Próximo passo:** Etapa 2 de `PLANO_DE_IMPLANTACAO.md` — confirmar
  acesso SSH + painel da Locaweb (depende do responsável do projeto).

## 24. Auditoria do painel Locaweb — Etapa 2 parcialmente validada (2026-07-22)

- **Pedido:** auditoria read-only completa do painel Locaweb (sem alterar
  nada), gerando `docs/deployment/AUDITORIA_LOCAWEB.md`.
- **Achado estrutural:** a conta Locaweb tem **duas hospedagens Linux
  ativas** — `elafashionmkt.com.br` (agência) e `estudioela.com` (alvo do
  TEAR) — mesmo plano (Hospedagem I Linux), mesma data de contratação.
  Confirma que a hospedagem-alvo já existe e é compatível com o TEAR
  **sem upgrade de plano nem custo adicional** (mantém a restrição
  soberana de `ARQUITETURA_PRODUCAO.md` §0).
- **Confirmado no painel:** PHP 8.3 ativo, PostgreSQL disponível (0/10
  bancos usados), Crontab nativo disponível, SSL Let's Encrypt gratuito,
  WAF ativa por padrão, backup nativo não ativado. DNS de `estudioela.com`
  ainda **não está apontado** para a Locaweb (SSL bloqueado com "DNS
  Pendente" em consequência).
- **Dois achados críticos que corrigem premissas de `ARQUITETURA_PRODUCAO.md`
  §3 e `PLANO_DE_IMPLANTACAO.md` Etapa 2:**
  1. SSH vem **desabilitado por padrão**, sessão de 3h, renovação manual,
     autenticação por **senha** (não por chave, ao contrário do que a
     Etapa 2 do plano assumia). Afeta diretamente o workflow já commitado
     em `.github/workflows/tear-v2-deploy.yml`/`scripts/deploy-locaweb.sh`
     (Etapas 5/6, `ac5180f`), que presume SSH automatizado por chave.
  2. "Publicar via Git" do painel **não é deploy real** — é só um template
     de GitHub Action que faz upload FTP do `dist/`, sem executar
     `composer install`/`artisan migrate` remotos.
- **Nenhuma configuração foi alterada** — SSH não foi habilitado, nenhum
  banco/domínio/SSL foi criado, conforme instrução explícita do
  responsável do projeto durante a auditoria.
- **`PLANO_DE_IMPLANTACAO.md` Etapa 2 atualizada** com nota de status
  apontando para `AUDITORIA_LOCAWEB.md` — etapa marcada como
  **parcialmente validada**: compatibilidade de plano confirmada, mas a
  validação via SSH (`php -v`, `composer`, `crontab -l`, conexão Postgres)
  continua pendente porque exige habilitação manual do SSH pelo
  responsável do projeto.
- **Decisão de arquitetura ainda em aberto** (não resolvida nesta sessão,
  por instrução — "não iniciar nenhuma nova etapa da implantação"):
  estratégia de deploy dado que SSH é temporário/por senha e "Git" é só
  FTP. Detalhe e opções em `AUDITORIA_LOCAWEB.md` §5.
- **Próximo passo:** responsável do projeto habilita o SSH no painel
  Locaweb (hospedagem `estudioela.com`) para fechar a validação técnica da
  Etapa 2 (Composer, quota de disco, conexão Postgres) — em paralelo,
  decidir a estratégia de deploy antes de a execução chegar às Etapas 9–11
  (secrets, estrutura de diretórios e primeiro deploy).

## 25. Consolidação documental pós-auditoria — 4 frentes em paralelo (2026-07-22)

- **Pedido:** esclarecimento do responsável do projeto sobre a origem de
  `estudioela.com` (domínio migrado do WordPress.com, hospedagem cancelada
  lá — explica a divergência de faturamento do §24, sem risco), seguido de
  instrução para acelerar via subagentes: revisão de consistência
  documental, checklist técnico Laravel/React × infra real, análise de
  estratégia de deploy, e QA documental (links/referências cruzadas).
  Todos os 4 rodaram em modo leitura/análise; os ajustes foram aplicados
  por este agente depois de revisar os achados.
- **Item de faturamento do §24 fechado:** `AUDITORIA_LOCAWEB.md` §1.3/§4.6
  e checklist §5 atualizados — não é mais pendência.
- **Achados corrigidos na documentação:**
  - `PLANO_DE_IMPLANTACAO.md` Etapa 2 e Etapa 9 tinham contradição interna
    — o texto novo da Etapa 2 (adicionado nesta sessão) já corrigia a
    premissa de SSH por chave, mas o texto original da própria Etapa 2
    (dependências/critérios de aceite) e a Etapa 9 inteira (secrets
    `SSH_PRIVATE_KEY`/`authorized_keys`) ainda assumiam chave. Corrigido
    com notas de status, sem reescrever o runbook original (preservado
    como registro do desenho anterior).
  - Referência de etapa errada ("Etapa 6" tratada como a etapa de
    deploy) corrigida para "Etapas 9–11" em `AUDITORIA_LOCAWEB.md` (3
    ocorrências) e `PLANO_DE_IMPLANTACAO.md`/`ESTADO_SESSAO.md` — Etapa 6
    é na verdade "Confirmar/contratar SMTP".
  - `PLANO_IMPLEMENTACAO.md` e `IMPLEMENTACAO_TECNICA.md` (documentos
    arquivados/de referência): notas de correção adicionadas sobre SSH por
    chave; `IMPLEMENTACAO_TECNICA.md` também tinha placeholder de domínio
    desatualizado (`<subdomínio-escolhido>.estudioela.com`,
    `SESSION_DOMAIN=.estudioela.com` com ponto) — corrigido para o valor
    definitivo (`influencia.estudioela.com`, host exato).
  - `docs/deployment/MONITORING.md`: referência cruzada quebrada
    (`DEPLOY.md` §7 → correto é §8) corrigida.
  - `PLANO_DE_IMPLANTACAO.md`: lista de referências ao `TASK_ROUTER.md`
    estava desatualizada (`§18–§21`, faltavam §22/23/24) — corrigida.
  - `ARQUITETURA_PRODUCAO.md` §14 (riscos): nova linha registrando o
    achado de execução (SSH temporário/senha, Git=FTP) sem reabrir nenhuma
    decisão de hospedagem/banco/storage.
- **Checklist técnico Laravel/React × infra real** (extensões PHP, fila,
  scheduler, sessão/Sanctum, `TRUSTED_PROXIES`, SMTP, Node/npm em build
  time) incorporado em `AUDITORIA_LOCAWEB.md` §2.1 — novo pendente
  encontrado: IP/CIDR do proxy reverso da Locaweb para `TRUSTED_PROXIES`
  ainda não levantado.
- **Recomendação de estratégia de deploy** incorporada em
  `AUDITORIA_LOCAWEB.md` §5.1: modelo híbrido (FTP automatizado via CI
  para código/build/`vendor/`; SSH manual só para `migrate`/cache quando
  há mudança de schema/dependência) — recomendação para decisão do
  responsável do projeto, não implementada.
- **Nenhum código alterado, nenhuma nova etapa de implantação iniciada,
  nenhum deploy feito** — só consolidação documental, conforme instrução
  explícita desta sessão.
- **Próximo passo:** igual ao registrado no §24 — habilitar SSH para
  fechar a Etapa 2, e decidir a estratégia de deploy (recomendação em
  `AUDITORIA_LOCAWEB.md` §5.1) antes das Etapas 9–11.

## 26. Encerramento da sessão — HANDOFF_GO_LIVE.md (2026-07-22)

- Auditoria final ampla do repositório (fora do escopo de deployment já
  coberto em §24/§25): sem inconsistência entre backend/frontend/docs
  (rotas de API, RBAC), sem TODOs esquecidos, sem workflow de CI órfão.
  Achados de baixa prioridade, não bloqueiam o Go-Live: 2 documentos de
  planejamento órfãos/desatualizados (`docs/architecture/DATABASE_MODEL.md`,
  `docs/domain/TEAR.md`, sobrepostos a conteúdo já arquivado) e 4 git
  worktrees obsoletos em `.claude/worktrees/` (branches já mescladas) —
  nenhum dos dois foi alterado/removido, aguardam decisão do responsável
  do projeto.
- Gerado `docs/reports/HANDOFF_GO_LIVE.md` — documento único de handoff
  desta fase (objetivo da próxima sessão, estado atual, decisões
  tomadas/pendentes, riscos, ordem de execução recomendada), referenciando
  o commit `93578f5`.
- **Por instrução explícita do responsável do projeto, `ESTADO_SESSAO.md`
  e `HANDOFF_GO_LIVE.md` ficaram pendentes de commit** ao final desta
  sessão — próxima sessão decide se commita.
- **Próximo passo:** igual ao §25 — habilitar SSH, decidir estratégia de
  deploy. Adicionalmente, decidir sobre o commit pendente destes 2
  arquivos de encerramento.

## 27. PostgreSQL confirmado indisponível no plano Hospedagem I da Locaweb (2026-07-22)

- **Fato novo, via suporte oficial da Locaweb:** o plano **Hospedagem I**
  (o plano ativo para `estudioela.com`) **não oferece PostgreSQL**. Isso
  invalida a premissa registrada em `AUDITORIA_LOCAWEB.md` (auditoria de
  painel, §25/commit `93578f5`) de que PostgreSQL estava confirmado
  disponível (0/10 bancos usados) — o painel mostrava a opção, mas o
  plano contratado não a habilita de fato.
- **Pendência anterior** ("reconciliar se PostgreSQL está de fato
  disponível ou não", registrada na sessão de validação local de
  2026-07-22, ver commit `076d7f4`) **encerrada** por esta confirmação.
- **Nova pendência, bloqueante para a Etapa 3** (criar banco de produção)
  do `PLANO_DE_IMPLANTACAO.md`: definir a estratégia de infraestrutura —
  upgrade para Hospedagem II/III da Locaweb ou contratar PostgreSQL
  externo (ex.: serviço gerenciado). Decisão do responsável do projeto;
  impacto de custo/cronograma ainda não orçado.
- **Nenhum código alterado.** Só documentação: `ESTADO_SESSAO.md`
  atualizado em dois commits separados — `076d7f4` (reescrita pendente de
  sessão anterior, sobre a validação do ambiente local, commitada isolada)
  e `feab0b7` (correção exclusiva desta pendência de PostgreSQL). Ambos
  pushados para `origin/feat/ui-design-system-ela`.
- **Próximo passo:** decidir a estratégia de infraestrutura do PostgreSQL
  (bloqueia Etapa 3); em paralelo, habilitar SSH para fechar a Etapa 2
  (IP/CIDR do proxy reverso, host/porta SMTP — checklist em
  `AUDITORIA_LOCAWEB.md` §2.1).

## 28. Missão de simplificação documental — auditoria completa + Fase 1 executada (2026-07-22)

- **Nova frente** (instrução explícita do responsável do projeto, "TEAR
  V2.5 — MISSÃO DE SIMPLIFICAÇÃO DOCUMENTAL"): auditoria completa dos 102
  arquivos `.md` do projeto (98 em `docs/` + 4 na raiz), visando reduzir
  manutenção sem perder conhecimento. Dois relatórios gerados (**ainda não
  commitados** — ver pendência abaixo): `docs/reports/AUDITORIA_SIMPLIFICACAO_DOCUMENTAL.md`
  e `docs/reports/PLANO_EXECUTIVO_SIMPLIFICACAO_DOCUMENTAL.md`.
- **Classificação inicial** (auditoria estrutural: nomes, pastas,
  cabeçalhos, cross-reference): MANTER 47 / CONSOLIDAR 5 / ARQUIVAR 48 /
  REMOVER 2.
- **Achado estrutural relevante:** um cluster de 8 arquivos (`DATA_MODEL.md`,
  `DATABASE_MODEL.md`, `DOMAIN.md`, `TEAR.md`, `MIGRATION.md`,
  `SCREEN_MAP.md`, `STITCH_PROTOTYPE.md`, `UX_FLOW.md` — juntos ~32.318
  linhas) descreve um domínio teórico (Aggregate Roots "Competência"/
  "Colaboração_Mensal") gerado antes de qualquer código existir, sem
  correspondência em nenhum dos dois sistemas reais (confirmado por grep:
  zero ocorrência dessas entidades em `tear-v2-app/` ou no GAS legado).
- **Validação de conteúdo contra o código real** (não só estrutural)
  corrigiu 3 das 5 classificações originais de CONSOLIDAR no plano
  executivo:
  - `docs/deployment/IMPLEMENTACAO_TECNICA.md`: CONSOLIDAR→**ARQUIVAR**
    (`PLANO_DE_IMPLANTACAO.md` já declara mantê-lo como referência técnica
    detalhada, não substituível).
  - `docs/design/DESIGN_SYSTEM.md`: CONSOLIDAR→**REMOVER** (paleta
    `#BC0004`/`#FAF8F6` nunca implementada).
  - `docs/design/stitch-export/DESIGN.md`: CONSOLIDAR→**MANTER** —
    confirmado por grep em `frontend/src/index.css` como a
    fonte real de tokens de design já implementada (`#9f0003`/`#cd0005`/
    `#fef8f8`). **Decisão pendente do responsável do projeto:** promover
    formalmente este arquivo a fonte oficial via atualização do status do
    `ADR-002` (hoje "Proposed") — não decidido nesta sessão.
  - `docs/planning/ESPECIFICACAO_FUNCIONAL_MVP_COMPLETA.md`: mantido
    CONSOLIDAR→`BACKLOG_FUNCIONAL_V2_6.md`, mas risco elevado a
    médio-alto — a seção de recorrência/parcelamento de pagamento
    (autodescrita como "decisão de maior alavancagem pendente") não está
    carregada no backlog vigente; consolidar sem extrair essa seção
    primeiro perderia uma decisão de negócio real ainda em aberto.
- **Fase 1 do plano executivo (arquivamento de baixo risco) parcialmente
  executada**, por decisão explícita do responsável do projeto de
  restringir o escopo ao cluster já validado:
  - Validação em duas rodadas adicionais (amostragem de conteúdo cruzada
    contra `CONTRATO_SOBERANO.md`/ADRs/SPECs/migrations/models/páginas
    reais + amostragem distribuída específica de `UX_FLOW.md` em 0/25/50/
    75/100%) confirmou confiança alta e ausência de informação exclusiva
    nos 8 arquivos, inclusive nas seções que cobrem módulos ainda não
    implementados no sistema real (Logística, Contratos, Histórico).
  - Executado: `git mv` dos 8 arquivos para
    `docs/archive/planejamento-pre-codigo/` (histórico preservado via
    rename, commit `08366b4`); `docs/archive/README.md` atualizado com a
    nova seção.
  - `README.md` (raiz) tinha referência obsoleta a 2 desses arquivos
    (`DOMAIN.md`, `DATA_MODEL.md`) como leitura recomendada de
    arquitetura — removida (não redirecionada ao archive, para não
    indicar material arquivado como leitura obrigatória) em commit
    isolado `e9574ed`.
  - Verificação final (grep no repositório inteiro) confirmou nenhuma
    referência remanescente a `DOMAIN.md`/`DATA_MODEL.md` fora de
    `docs/archive/` e dos próprios relatórios de auditoria/plano.
- **Itens do plano ainda não executados** (aguardando decisão/priorização
  do responsável do projeto):
  - Fase 1 (restante): 2 roadmaps superados (`ROADMAP_MESTRE_TEAR_V2.md`,
    `TEAR_V2.5_PRODUCTIZACAO_ROADMAP.md`),
    `docs/governance/REPOSITORY_GOVERNANCE_AUDIT.md`,
    `RELATORIO_CONSOLIDACAO_AUDITORIAS.md` (raiz).
    `PLANO_FINAL_CONGELAMENTO_OPERACIONAL.md` — **concluído (2026-07-23,
    ver §39):** ADR-018 escrita extraindo a decisão P0-2 real (subconjunto
    bem mais estreito do que o plano propunha), documento arquivado em
    `docs/archive/pagamento-snapshot/`.
  - Fase 2: 3 remoções diretas já validadas
    (`docs/reports/STATUS_MVP_OPERACIONAL_TEAR_V2.md`,
    `docs/reports/RELATORIO_SPRINT_ESTABILIZACAO_TEAR_V2.md`,
    `docs/design/DESIGN_SYSTEM.md`).
  - Fase 3: 2 consolidações (`UI_RULES.md`→ADR-002;
    `ESPECIFICACAO_FUNCIONAL_MVP_COMPLETA.md`→`BACKLOG_FUNCIONAL_V2_6.md`,
    com extração de conteúdo primeiro) — depende de decisão humana sobre
    a fonte oficial de tokens de design.
  - Fase 4: arquivamento de docs de deployment/release (recomendado só
    após o corte de produção do Go-Live) + correções de conteúdo em
    `README.md`/`PROJECT_GOVERNANCE.md` + remoção de `docs/governance/`
    da árvore ativa.
- **Pendência de commit:** `docs/reports/AUDITORIA_SIMPLIFICACAO_DOCUMENTAL.md`
  e `docs/reports/PLANO_EXECUTIVO_SIMPLIFICACAO_DOCUMENTAL.md` seguem
  como arquivos não rastreados (`??`) — não commitados nesta sessão por
  não ter sido pedido explicitamente; decisão de committar ou não fica
  para a próxima sessão.
- **Nenhuma decisão de arquitetura de código foi tomada ou reaberta** —
  trabalho exclusivamente documental, sem tocar `tear-v2-app/` nem `src/`.
- **Próximo passo:** decidir se a próxima sessão continua a Fase 2/3/4 da
  simplificação documental ou retoma a frente de Go-Live (estratégia de
  infraestrutura do PostgreSQL, §27, ainda em aberto e bloqueante para a
  Etapa 3).

## 29. Mudança de prioridade: auditoria funcional do MVP antes do Go-Live (2026-07-22)

- **Decisão do responsável do projeto:** antes de retomar a preparação do
  ambiente de produção (Frente B / Go-Live, §24/§27), o projeto exige uma
  certificação funcional do MVP — comparação direta entre a especificação
  funcional (`docs/planning/ESPECIFICACAO_FUNCIONAL_MVP_COMPLETA.md`,
  2026-07-20) e o estado real do código de `tear-v2-app/`. **A frente de
  Go-Live fica pausada** até essa certificação e a execução do backlog
  dela resultante.
- **Sessão iniciada na Frente B (Go-Live)** — levantamento consolidado
  (não persistido em arquivo, só no histórico da conversa desta sessão):
  cruzamento entre o branch atual e a auditoria não mesclada
  `docs/reports/AUDITORIA_FINAL_MVP.md` (branch
  `worktree-agente-b-deploy-infra`, PR #62 aberto e `CONFLICTING` —
  veredito daquela auditoria: NO GO de implantação, GO COM RESSALVAS de
  produto, 4 bloqueadores técnicos de deploy). **Achado verificado por
  leitura direta de código nesta sessão:** `.github/workflows/tear-v2-deploy.yml`
  ainda autentica via `SSH_PRIVATE_KEY`, mas `AUDITORIA_LOCAWEB.md §4.1`
  confirma que o painel Locaweb só aceita senha/temporário — `ADR-016`
  resolveu Composer-ausente e disparo-automático, mas **não** essa
  incompatibilidade de autenticação, apesar de o §27 acima sugerir que a
  estratégia de deploy já estava fechada. Também confirmado:
  `scripts/restore-db.sh` ainda roda `docker compose exec`
  (Docker não existe na arquitetura Locaweb) — assimetria com
  `backup-db.sh`, já migrado. Nenhum desses achados foi corrigido nesta
  sessão, só documentado.
- **Pivô para auditoria funcional** — nova auditoria produzida e salva em
  `docs/reports/AUDITORIA_FUNCIONAL_MVP_VS_ESPECIFICACAO.md` (ainda não
  commitada). Método: comparação direta contra código (migrations/models/
  controllers/rotas/frontend), verificado via 4 subagentes paralelos
  (autorizado pelo responsável do projeto para acelerar a auditoria) +
  verificações diretas complementares — não uma leitura passiva de
  documentação.
- **Achado central:** o spec de 07-20 estava defasado **a favor** do
  sistema em pontos centrais — congelamento de Participação
  (`congelado_em`), Briefing reorganizado em 1:N por tipo, vínculo
  estrutural Material↔Briefing (`briefing_id`), cálculo automático da
  data de aprovação do Briefing, e **o Portal completo da Influenciadora**
  (Campanhas/Briefing/Materiais/Pagamento, isolamento testado) — todos já
  implementados e funcionais, contradizendo tanto o spec de 07-20 quanto
  uma leitura apressada da auditoria paralela de 07-22 (que também tinha
  imprecisões pontuais, ex.: atribuía o teste de isolamento de Materiais
  ao arquivo errado).
- **Classificação resultante** (conformidade aproximada do núcleo do MVP:
  ~75-80%): Conforme — Cadastro, Campanhas, Briefings, Materiais, Portal
  da Influenciadora, locale `pt_BR`. Parcialmente conforme — Participações
  (recorrência de pagamento indecidida), Pagamentos (comprovante
  ausente), Logística (backend pronto, item de menu quebrado). Não
  implementado por decisão de escopo já aceita — Contratos, Produtos/
  Variantes, Assessorias, Métricas, Histórico admin. Não reverificado
  nesta sessão — RBAC de leitura granular administrativo.
- **5 bloqueadores funcionais priorizados** (detalhe de impacto/esforço em
  `AUDITORIA_FUNCIONAL_MVP_VS_ESPECIFICACAO.md`): (1) decisão de
  recorrência de pagamento — P0, bloqueia por ser decisão, não
  implementação; (2) item de menu de Logística quebrado — P0, esforço
  baixo, maior retorno por esforço do backlog inteiro; (3) confirmação do
  RBAC de leitura granular — P0, bloqueador de segurança até confirmado;
  (4) comprovante de pagamento — P1, esforço baixo; (5) exposição do
  histórico de alteração (`historico_alteracoes`) numa tela admin — P1,
  esforço baixo.
- **Nenhum código alterado, nenhuma correção implementada, nenhum commit
  adicional nesta sessão** — missão explicitamente restrita a
  diagnóstico, por instrução do responsável do projeto.
- **Próximo passo:** executar o backlog funcional (começando pelos 3 P0,
  em ordem de menor risco/maior retorno primeiro), depois os P1 de
  esforço baixo. Só então retomar a Frente B (Go-Live), a partir do
  levantamento desta sessão, incluindo a reconciliação pendente do PR #62
  e a correção da incompatibilidade de autenticação SSH no pipeline de
  deploy.

## 30. Execução do backlog funcional — RBAC verificado, comprovante de pagamento implementado, residuais de Cadastro fechados (2026-07-22)

- **Achado de drift, corrigido por leitura de código antes de agir:** entre
  o fim da sessão anterior (`ESTADO_SESSAO.md`, HEAD `c7f753e`) e o início
  desta, 3 commits já haviam resolvido parte do backlog do §29 sem
  atualização dos documentos de estado: `aea82d6` (P0 #2 — menu de
  Logística destravado com `LogisticaPage` própria), `9824b7b` (parte do
  P1 #6 — deduplicação de nome de Parceira case-insensitive), `a241186`
  (P1 #4 — histórico de alteração exposto para admin). Verificado por
  `git log --stat` antes de reportar como concluído.
- **RBAC de leitura granular (P0 #3) — verificado, nenhuma correção
  necessária:** leitura de todos os controllers (`ParceiraController`,
  `MedidaController`, `HistoricoAlteracaoController`, `MarcaController`,
  `CampanhaController`, `ParticipacaoController`, `BriefingController`,
  `MaterialController`, `PagamentoController`, `EnvioController`,
  `MeParticipacaoController`) confirma que toda rota GET chama
  `$this->authorize('view'|'viewAny', ...)` contra uma Policy real
  (`ParceiraPolicy`/`CampanhaPolicy`/`ParticipacaoNaCampanhaPolicy`/
  `MarcaPolicy`), com `Gate::before` (`AppServiceProvider.php`) liberando
  ADMIN e as Policies restringindo os demais papéis por posse
  (`user_id`/participação `ATIVA`). O texto do spec de 07-20 ("toda rota
  GET exige só `auth:sanctum`") está desatualizado — o RBAC granular já
  existe e está coberto por teste (`RbacIsolamentoTest`, `PortalIsolamentoTest`).
  Suíte completa 196/196 verde antes de prosseguir. **Este item passa de
  P0 pendente para resolvido, sem nenhuma alteração de código.**
- **Comprovante de pagamento (P1 #5) — implementado:** novo endpoint
  `POST /pagamentos/{pagamento}/comprovante` (`role:ADMIN`), reaproveitando
  a mesma abstração (`GoogleDriveService`) já usada para upload de
  Materiais — pasta `Comprovantes` dentro da estrutura parceira/campanha
  já existente no Drive. Migration nova (`comprovante_drive_file_id`,
  `comprovante_drive_file_url` em `pagamentos`), `PagamentoResource` expõe
  `comprovante_url`. Frontend: `PagamentoPage` (admin) ganha formulário de
  upload/link; `PortalParticipacaoPage` (influenciadora) exibe o link
  somente leitura. 2 testes novos; suíte completa 198/198 verde, Pint
  limpo, `tsc -b`/`oxlint`/`vite build` do frontend limpos. Commit
  `fabd5c1`.
- **Residuais de Cadastro (parte do P1 #6):**
  - Deduplicação de nome: já resolvida no commit `9824b7b` (ver acima) —
    nenhuma ação adicional.
  - `authorize()` ausente em `POST /parceiras/cadastro` administrativo —
    **falso positivo, confirmado por leitura de código + teste já
    existente e verde** (`ParceiraController::store` chama
    `$this->authorize('create', Parceira::class)`, rota tem
    `middleware('role:ADMIN')`, e `ParceiraTest::test_usuario_sem_role_admin_nao_pode_criar_parceira`
    cobre o caso). A rota pública (`CadastroPublicoController::store`,
    sem `authorize()`) é intencionalmente aberta — cadastro de candidata
    sem sessão, conforme comentário já existente em `ParceiraPolicy`.
    Nenhuma alteração necessária.
  - **Validação de formato do Instagram — não implementada, decisão de
    produto pendente:** o próprio `ESPECIFICACAO_FUNCIONAL_MVP_COMPLETA.md`
    (linhas ~142-146) já registra que nenhuma fonte define o formato
    aceito (com/sem `@`, handle vs. URL). Não é um objetivo técnico
    fechável sem essa decisão — documentado aqui, não implementado, por
    instrução explícita do responsável do projeto de não investir em
    itens que dependem de decisão de negócio nesta sessão.
- **Backlog restante do §29, em ordem:**
  1. 🟠 Decisão de recorrência/parcelamento de pagamento (P0) — segue
     bloqueada, decisão do responsável do projeto.
  2. 🟠 Formato de validação do Instagram — decisão do responsável do
     projeto (novo item, achado nesta sessão).
  3. Reconciliar `ESPECIFICACAO_FUNCIONAL_MVP_COMPLETA.md` com o estado
     real (P1, baixa prioridade) — por instrução do responsável do
     projeto, só ao final desta sessão, se sobrar tempo.

## 31. Reconciliação da especificação funcional — backlog do §29 encerrado (2026-07-22)

- **Reconciliação produzida:** `docs/reports/RECONCILIACAO_ESPECIFICACAO_FUNCIONAL_MVP.md`
  (commit `209bf32`) — por instrução explícita do responsável do projeto,
  **não** reescreve `ESPECIFICACAO_FUNCIONAL_MVP_COMPLETA.md`; produz só
  uma tabela de divergências (módulo / especificação atual / implementação
  atual / status / evidência / ação recomendada), verificada por leitura
  direta de código (migrations/models/controllers/rotas/testes), sem
  reprocessar os 13 documentos-fonte originais.
- **11 divergências encontradas**, 9 classificadas **"Especificação
  desatualizada"** (spec defasada a favor do sistema, não bug) e 2
  **"Parcial"**:
  - Especificação desatualizada: Portal completo da Influenciadora
    (Campanhas/Briefing/Materiais/Pagamento); RFC-07 (envio de material
    pelo próprio Portal); congelamento de Participação (`congelado_em`);
    vínculo estrutural Material↔Briefing + vocabulário unificado; RBAC de
    leitura granular (verificado nesta sessão, ver §30); comprovante de
    pagamento (implementado nesta sessão, ver §30); `APP_LOCALE=pt_BR`
    (spec ainda citava `en`); deduplicação de nome de Parceira (resolvida
    antes desta sessão); `POST /parceiras/cadastro` administrativo sem
    `authorize()` (falso positivo — confundia a rota pública,
    intencionalmente sem `authorize()`, com a administrativa, que já tem
    `role:ADMIN` + `$this->authorize('create', ...)` + teste verde).
  - Parcial (decisão já tomada *de fato* pelo código, nunca formalizada
    como decisão consciente de produto): bloqueio total de edição de
    Participação após congelamento (`ParticipacaoController::update`,
    HTTP 409, sem trilha de auditoria — a spec ainda tratava como
    "nenhuma opção escolhida"); `FEED` sempre lê `carrossel_qtd`
    (`ParticipacaoNaCampanha::quantidadeContratadaPara`, comentário
    explícito no código — "não há coluna própria de feed" — a spec ainda
    tratava como pergunta em aberto).
- **Fora da tabela, por não serem divergência** (spec e código já
  concordam, nenhuma mudança de status): recorrência/parcelamento de
  pagamento, validação de formato do Instagram, Contratos,
  Produto/Variante/Estoque, Assessorias, Métricas de perfil, Permutas,
  Portal da Marca (`GESTOR_MARCA`), importação do histórico legado,
  trilha de auditoria polimórfica — todos seguem exatamente como
  documentados em `ESPECIFICACAO_FUNCIONAL_MVP_COMPLETA.md` §9.
- **Leitura de certificação funcional do MVP:** o núcleo operacional
  ponta a ponta (Cadastro → Aprovação → Campanha → Participação →
  Briefing → Material → Aprovação → Pagamento, incluindo o Portal
  completo da Influenciadora) está **funcionalmente conforme e testado**
  — nenhuma das 11 divergências é bloqueador de código. O que falta para
  "certificar" o MVP são só **2 decisões de produto sem resposta**
  (recorrência de pagamento; formato do Instagram) e a **ratificação
  formal** das 2 decisões "Parcial" já implementadas na prática.
- **Nenhum código alterado nesta entrada** — só o relatório de
  reconciliação (docs) e a atualização de `ESTADO_SESSAO.md`.
- **Backlog de `AUDITORIA_FUNCIONAL_MVP_VS_ESPECIFICACAO.md` (§29) —
  encerrado.** Próximo passo depende do responsável do projeto (decisões
  acima) ou da retomada do Go-Live (§27/§29, inalterados: PostgreSQL,
  autenticação SSH do deploy, `restore-db.sh` com Docker, PR #62).

## 32. Mudança oficial de prioridade — fase de Certificação do MVP (2026-07-22)

**Mandato registrado pelo responsável do projeto nesta sessão:** o
projeto sai da fase "construir funcionalidades" e entra na fase
"certificar o MVP e colocá-lo em produção". Toda tarefa futura deve
responder "isso aproxima o sistema de uma influenciadora real em
produção?" — se não, não é prioridade. Nenhuma funcionalidade nova deve
ser criada enquanto existir item que impeça uma influenciadora real de
concluir o ciclo completo (Cadastro → Aprovação → Convite → Senha →
Login → Participação → Briefing → Upload → Aprovação → Pagamento →
Histórico). Decisão arquitetural reconfirmada como encerrada nesta
sessão: banco relacional, PostgreSQL em produção — não reabrir estudo de
alternativas (ex.: MongoDB).

**Nova ordem de prioridade:** 1) certificar regras de negócio; 2)
resolver Google Drive; 3) resolver SMTP; 4) validar fluxo completo; 5)
preparar produção; 6) executar piloto (uma única influenciadora real);
7) corrigir problemas encontrados; 8) publicar. Toda nova tarefa deve ser
classificada como Certificação, Correção, Infraestrutura, Integração,
Go-Live ou Evolução — itens de Evolução têm prioridade inferior a todos
os demais até o Go-Live.

**Auditoria funcional completa executada nesta sessão** (navegação real
via browser como ADMIN, GESTOR_MARCA e INFLUENCIADORA — não só leitura de
código), cobrindo os módulos que as sessões anteriores (§29-§31) não
haviam percorrido ao vivo (Logística/Envio) e reconfirmando ao vivo os
que já eram só documentados:

- **F1 — Upload de Material retorna 503** (Questão de Infraestrutura,
  **bloqueia**): `MaterialController::store` exige
  `GoogleDriveService::isConfigured()`; `.env` sem
  `GOOGLE_DRIVE_CLIENT_EMAIL`/`_PRIVATE_KEY`. Sem fallback local (já
  documentado em `PLANO_DE_IMPLANTACAO.md` Etapa 5 e
  `TEAR_V2.5_GO_LIVE_CHECKLIST.md` P0-9 — reconfirmado ao vivo, não é
  achado novo).
- **F2 — Upload de comprovante de pagamento com a mesma falha**
  (Questão de Infraestrutura, **bloqueia**): `PagamentoController::comprovante`,
  mesma checagem.
- **F3 — `MAIL_MAILER=log`** (Questão de Infraestrutura, **bloqueia**):
  convite/definir-senha tecnicamente correto, mas não chega a nenhuma
  influenciadora real (já documentado em `PLANO_DE_IMPLANTACAO.md` Etapa
  6 — reconfirmado ao vivo).
- **F4 — GESTOR_MARCA é papel não funcional** (Regra de Negócio
  Incompleta/Bug, não bloqueia): `CampanhaController`/`ParceiraController`
  só distinguem ADMIN de "resto", filtrando por posse do próprio usuário
  — lógica pensada só para INFLUENCIADORA. Sem vínculo Usuário-Gestor↔Marca
  no schema. Confirmado ao vivo (login `gestor@tear.test` não vê nada).
  Não bloqueia porque o ciclo certificado (ver definição acima) não
  depende de GESTOR_MARCA. Fica registrado como Evolução, não Correção
  prioritária.
- **F5 — Congelamento não bloqueia Briefing** (Regra de Negócio
  Incompleta, não bloqueia): só campos comerciais são bloqueados após
  `congelado_em`; Briefing pode ser criado/editado numa participação
  congelada sem aviso. Estreita ainda mais o escopo da ratificação
  pendente já registrada em §29-§31 — falta decidir se Briefing/Material/
  Pagamento entram no bloqueio.
- **F6 — Instagram sem validação de formato** (Decisão de Produto
  Pendente, não bloqueia): reconfirmado ao vivo, já era pendência
  conhecida (§29).
- **F7 — Sidebar rotula módulos funcionais como "(em breve)"** (Problema
  de UX, não bloqueia): Briefings/Materiais/Aprovações/Pagamentos já são
  100% funcionais via drill-down Campanha→Participação, mas o texto
  esconde isso de um operador novo.
- **Logística/Envio testado ao vivo nesta sessão, sem divergência
  encontrada:** criação de Envio, endereço lido corretamente da Parceira
  (proteção de PII do schema, P0-4, funciona como projetado), avanço de
  status PENDENTE→EXPEDIDO→ENTREGUE, RBAC (`role:ADMIN` nas rotas de
  escrita) — tudo correto. Fecha a última lacuna de módulo não percorrido
  ao vivo do backlog de certificação funcional.

**Conclusão desta auditoria:** o fluxo de negócio core está certificado
funcionalmente (nenhum bloqueador de lógica de aplicação). Os únicos
bloqueadores reais para uma influenciadora real em produção são
**credenciais/infraestrutura externa**, já mapeados e não são achado
novo: Service Account do Google Drive (`PLANO_DE_IMPLANTACAO.md` Etapa
5), SMTP de produção (Etapa 6), e a infraestrutura de hospedagem já
registrada em §27/§29 (PostgreSQL na Locaweb, autenticação SSH do
deploy, `restore-db.sh` com Docker, PR #62, DNS de
`influencia.estudioela.com`).

**Bloqueio atual (aguardando o responsável do projeto, prioridades 2-3
da nova ordem):** credenciais que a IA não possui e não pode gerar —
acesso ao Google Workspace/Cloud Console para criar a Service Account do
Drive, e confirmação do relay SMTP da Locaweb (ou decisão por outro
provedor). Nenhum código foi alterado nesta entrada.

## 33. Google Drive sem Service Account Key — OAuth de conta dedicada (`ADR-017`, 2026-07-22)

Ao executar a Etapa 5 de `PLANO_DE_IMPLANTACAO.md` (§32), o responsável
do projeto encontrou a Org Policy
`constraints/iam.disableServiceAccountKeyCreation` habilitada em
`elafashionmkt-org`, bloqueando a geração da chave JSON que
`GoogleDriveService` exigia até esta sessão. Análise da implementação
(`GoogleDriveService::accessToken()` — JWT Bearer assinado com
`private_key`) confirmou que a chave era exigida pelo método de
autenticação escolhido no código, não pela API do Drive em si.

**Decisão (`ADR-017`):** trocar o mecanismo por OAuth 2.0 com uma conta
de usuário dedicada do Workspace (`refresh_token`), que não é Service
Account e não esbarra na Org Policy. Alternativas descartadas: Workload
Identity Federation e Service Account Impersonation (inviáveis fora do
Google Cloud, sem IdP externo disponível na Locaweb); exceção de Org
Policy no escopo do projeto (tecnicamente viável e reversível, mas
rejeitada por decisão explícita do responsável do projeto — prioridade
de manter a política da organização intacta).

**Implementado nesta sessão:**
- `GoogleDriveService::accessToken()` reescrito para `grant_type=refresh_token`
  (era JWT Bearer com `private_key`); `isConfigured()` ajustado.
- `config/services.php`, `.env.example`, `.env.production.example`,
  `.env` — `GOOGLE_DRIVE_CLIENT_ID`/`_CLIENT_SECRET`/`_REFRESH_TOKEN` no
  lugar de `_CLIENT_EMAIL`/`_PRIVATE_KEY`.
- Novo comando `php artisan google-drive:obter-refresh-token` — Device
  Authorization Grant (RFC 8628), sem servidor local de callback; único
  jeito de obter o `refresh_token` inicial.
- `tests/Feature/GoogleDriveServiceTest.php`,
  `BackupDatabaseToDriveCommandTest.php`, `MaterialTest.php`,
  `PagamentoTest.php` — fixtures de credenciais fake ajustadas ao novo
  formato. Suíte completa: 199/199 verde, Pint limpo.
- `PLANO_DE_IMPLANTACAO.md` Etapa 5, `IMPLEMENTACAO_TECNICA.md` §4,
  `TEAR_V2.5_GO_LIVE_CHECKLIST.md` P0-9 — atualizados para o novo
  procedimento.

**Não alterado:** `ensureFolder()`, `uploadFile()`, o Shared Drive
institucional, nenhuma rota/controller/policy/regra de negócio fora do
escopo desta ADR.

**Bloqueio atual (aguardando o responsável do projeto):** criar a conta
dedicada do Workspace, o OAuth Client "TVs and Limited Input devices" no
Cloud Console, compartilhar o Shared Drive com essa conta, e rodar o
comando `google-drive:obter-refresh-token` para gerar os 3 valores OAuth
— passos manuais que exigem acesso ao Google Workspace/Cloud Console,
documentados em `PLANO_DE_IMPLANTACAO.md` Etapa 5. Teste real de upload
em homologação (Etapa 16) segue pendente até esses valores chegarem.

> **Correção (2026-07-22, ver §34):** a premissa de Google Workspace/
> Shared Drive acima estava errada — o projeto usa conta pessoal
> (`elafashionmkt@gmail.com`), sem Workspace. §34 corrige o mecanismo.

## 34. Google Drive sem Workspace nem Shared Drive — pasta comum + IDs reais confirmados (2026-07-22)

O responsável do projeto esclareceu que o TEAR **não tem Google
Workspace** — o projeto usa a conta pessoal `elafashionmkt@gmail.com`,
que administra o Google Cloud e terá acesso às pastas do Drive. Isso
corrige a premissa de §33 (que ainda assumia Workspace/Shared Drive).

**Achado técnico:** `GoogleDriveService::ensureFolder()` usava
`corpora=drive`+`driveId=$rootFolderId`, parâmetros que só funcionam
contra um **Shared Drive** — recurso exclusivo de Google Workspace, não
disponível numa conta pessoal. O mecanismo OAuth do ADR-017 (`refresh_token`)
em si não tinha nenhuma dependência de Workspace; a dependência estava
só nesses dois parâmetros da busca de pastas.

**Corrigido nesta sessão:**
- `GoogleDriveService::ensureFolder()` — removidos `corpora`/`driveId`;
  mantidos `supportsAllDrives`/`includeItemsFromAllDrives` (flags
  inofensivas para uma pasta comum). Passa a operar contra uma pasta
  comum no Meu Drive da conta dedicada, não um Shared Drive.
- Adicionados `GoogleDriveService::getFile()`, `downloadFile()`,
  `deleteFile()`, e `accessToken()` passou a público — suporte ao novo
  comando de diagnóstico.
- Novo comando `php artisan google-drive:test` — valida, em 8 etapas com
  relatório de sucesso/falha (variáveis de ambiente, access token, acesso
  à pasta ROOT, existência/criação da pasta BACKUP, permissão de
  escrita, upload, leitura, exclusão de um arquivo de diagnóstico), toda
  a configuração antes do primeiro upload real.
- IDs reais das pastas confirmados pelo responsável do projeto e
  preenchidos em `.env`/`.env.example`/`.env.production.example`:
  `GOOGLE_DRIVE_ROOT_FOLDER_ID=1uSmA2qt8apAkNP54z9yBChhitYXSw2y4`,
  `GOOGLE_DRIVE_BACKUP_FOLDER_ID=1c_ImyhRDHGox509kRjTJKHkyiIc5zzBE`.
- Correções textuais em `ARQUITETURA_PRODUCAO.md`, `AUDITORIA_LOCAWEB.md`,
  `IMPLEMENTACAO_TECNICA.md`, `PLANO_DE_IMPLANTACAO.md` Etapa 5,
  `PLANO_IMPLEMENTACAO.md` (nota de correção), `CONFIGURACAO_PRODUCAO.md`,
  `DEPLOY.md` — substituindo "Shared Drive institucional"/"Service
  Account"/"Workspace" pela realidade (pasta comum + conta pessoal via
  OAuth). Varredura por `GOOGLE_DRIVE_CLIENT_EMAIL`/`_PRIVATE_KEY`/
  `ServiceAccount`/JWT no código confirmou zero referências ativas
  restantes (só menções explicativas do que foi descartado).
- Suíte completa 202/202 verde, Pint limpo (validado após as mudanças de
  código desta seção).

**Interrompido a pedido do responsável do projeto (modo "critical path",
2026-07-22):** varredura de documentação ainda tinha 1-2 arquivos
secundários não revisados quando a sessão pivotou para focar só em obter
o `refresh_token` real e validar upload — registrado como TODO em
`ESTADO_SESSAO.md`, não bloqueia nada funcional.

**Ainda não decidido (pausado, não é bloqueador do ciclo certificado):**
o responsável do projeto pediu uma função que garanta a estrutura fixa
`ROOT → Materiais/Backup/Temporarios/Contratos/Exportacoes`. A estrutura
real usada em produção por `MaterialController`/`PagamentoController` é
dinâmica (`ROOT/<Parceira>/<Campanha>/<Tipo|Comprovantes>`), não essa
taxonomia fixa — conflito de requisito identificado, ainda não
resolvido com o responsável do projeto. Ver TODO em `ESTADO_SESSAO.md`.

**Bloqueio atual (aguardando o responsável do projeto):** `refresh_token`
real ainda não gerado — `GOOGLE_DRIVE_CLIENT_ID`/`_CLIENT_SECRET` reais
também ainda não entregues (mensagem anterior trazia só placeholders).
Assim que chegarem, rodar `google-drive:obter-refresh-token` →
`google-drive:test` → upload real em homologação, depois um único commit
consolidando toda a mudança (instrução explícita do responsável do
projeto: acumular e commitar só quando o fluxo OAuth estiver
completamente validado).

## 35. Google Drive — refresh_token real obtido, fluxo validado ponta a ponta, Prioridade 1 do Go-Live encerrada (2026-07-22)

Fechamento de §33/§34. `GOOGLE_DRIVE_CLIENT_ID`/`_CLIENT_SECRET` reais
chegaram com um problema adicional: o Device Authorization Grant (RFC
8628) do `ADR-017` rejeitou o escopo completo `https://www.googleapis.com/auth/drive`
com `400 invalid_scope` — confirmado, via documentação oficial do
Google, ser uma restrição fixa do fluxo (só aceita
`email`/`openid`/`profile`/`drive.appdata`/`drive.file`/`youtube`/`youtube.readonly`;
`drive.file` foi descartado por só dar acesso a arquivos criados pelo
próprio app, insuficiente para as pastas/arquivos já existentes,
criados manualmente).

**Decisão (adendo ao `ADR-017`, aprovada explicitamente pelo responsável
do projeto):** manter o escopo completo `drive` e trocar só o mecanismo
de obtenção do `refresh_token` — de Device Authorization Grant para
Authorization Code + redirect loopback local (RFC 8252). Exigiu um novo
OAuth Client tipo **"Desktop app"** ("App para computador" na UI em
PT-BR; `TVs and Limited Input devices` não suporta `redirect_uri`) —
duas tentativas do responsável do projeto criaram por engano um client
tipo "Web application" (chave `"web"` no JSON, `redirect_uri` fixo,
incompatível); o terceiro, correto, gerou chave `"installed"`.

**Implementado:**
- `ObterGoogleDriveRefreshToken` reescrito: abre um `stream_socket_server`
  em `127.0.0.1` numa porta livre, monta a URL de autorização com esse
  `redirect_uri` dinâmico, aguarda o `GET` do navegador, valida `state`,
  troca o `code` por tokens em `TOKEN_URL`. Mesmo nome de comando
  (`google-drive:obter-refresh-token`), só o mecanismo interno mudou —
  `GoogleDriveService::accessToken()` não foi alterado (consome
  `refresh_token` do jeito que sempre consumiu).
- Também precisou de um usuário de teste na tela de consentimento OAuth
  (Google Auth Platform → Público-alvo → Usuários de teste →
  `elafashionmkt@gmail.com`) — a ausência causava `403 access_denied`
  ("Acesso bloqueado... fase de testes").
- **Bug adicional encontrado durante a validação real:** `GoogleDriveService::getFile()`/
  `downloadFile()`/`deleteFile()` chamavam `API_URL."/{$id}"` (faltando
  o segmento `/files/`) — retornava um 404 HTML genérico do Google (não
  um erro JSON da API), nunca detectado porque nenhum teste cobria esses
  3 métodos. Corrigido para `API_URL."/files/{$id}"` em todos.
- `ADR-017` recebeu um adendo (§6) documentando a troca de mecanismo com
  a evidência oficial do Google por trás da decisão.
- Testes ajustados: `MaterialTest.php` (override explícito de config
  para não depender de `.env` real, que agora tem credenciais reais) e
  `TestGoogleDriveConfiguracaoCommandTest.php` (`Http::fake` corrigido
  para os paths `/files/{id}` corretos, reordenados antes do wildcard
  genérico). Suíte completa verde, Pint limpo.

**Validado (via `php artisan google-drive:test`, 8/8 etapas, e via curl
direto contra a API real):** o fluxo OAuth com escopo `drive` completo
acessa arquivos/pastas pré-existentes criados manualmente (confirmado
lendo `Temporarios/teste-upload.txt`) — validando que a escolha de
manter o escopo `drive` completo (em vez de `drive.file`) era necessária.

**Commit único consolidado** (instrução explícita do responsável do
projeto, modo "critical path"): `f074384` — inclui código, testes,
ADR-017 adendo e as correções textuais de documentação já feitas em
§34, mais os arquivos de `.env.example`/`.env.production.example`/
`PLANO_DE_IMPLANTACAO.md` atualizados para "Desktop app"/Authorization
Code. Pushado para `origin/feat/ui-design-system-ela`.

**Prioridade 1 do checklist de Go-Live (autenticação do Google Drive):
encerrada.** Próxima prioridade do checklist: SMTP de produção
(Prioridade 2, inalterado).

**TODO residual, não bloqueador (modo "critical path" suspendeu a
varredura de documentação; resumida parcialmente neste fechamento, mas
não 100% auditada):** `docs/deployment/CONFIGURACAO_PRODUCAO.md` ainda
tinha, no momento da interrupção, uma seção de checklist mais abaixo no
arquivo (fora da tabela de variáveis, já corrigida) mencionando "OAuth
Client ID, tipo TVs and Limited Input devices" — não confirmado se foi
corrigida nesta sessão; conferir na próxima sessão de documentação.
Decisão de produto sobre estrutura fixa de pastas (`Materiais/Backup/
Temporarios/Contratos/Exportacoes` vs. estrutura dinâmica real) segue em
aberto, mesma pendência de §34.

## 36. SMTP de produção — relay Locaweb configurado e validado localmente (2026-07-22)

Prioridade 2 do checklist de Go-Live (Prioridade 1, Google Drive,
encerrada em §35). Auditoria prévia confirmou `config/mail.php` já
compatível com Laravel 12 sem nenhuma alteração de código — só faltavam
credenciais reais do provedor já decidido em `ARQUITETURA_PRODUCAO.md`
§6 (relay SMTP incluso no plano Locaweb).

**Achado técnico:** a variável `MAIL_ENCRYPTION`, comumente usada em
tutoriais e versões antigas do Laravel, **não existe mais desde o
Laravel 9** — `config/mail.php` nunca a lê. A variável correta é
`MAIL_SCHEME` (`smtps` = TLS implícito, necessário na porta 465;
`MailManager::parseTransportConfig()` do Laravel 12 já infere `smtps`
automaticamente quando a porta é `465` e `MAIL_SCHEME` fica em branco,
mas foi setado explicitamente por clareza).

**Configurado e validado (só em `.env` local, gitignorado — nada
versionado):** `MAIL_HOST=email-ssl.com.br`, `MAIL_PORT=465`,
`MAIL_SCHEME=smtps`, `MAIL_USERNAME=contato@elafashionmkt.com.br`,
`MAIL_FROM_ADDRESS` idem, `MAIL_FROM_NAME=TEAR`. Teste real via
`Mail::raw()` (síncrono) confirmou autenticação SMTP e entrega — e-mail
chegou à caixa de entrada, não caiu em spam.

**Correção a uma suposição de auditorias anteriores:** os 3 fluxos de
e-mail da aplicação (`InfluenciadoraConviteNotification`,
`BackupFalhouNotification`, `ResetPassword::toMailUsing`) são
**síncronos** — nenhuma classe `Notification` implementa `ShouldQueue`
(só usam o trait `Queueable`, que sozinho não enfileira). O crontab de
`queue:work` continua necessário para o futuro, mas não é pré-requisito
para o e-mail funcionar hoje.

**Ainda não feito (não bloqueador, registrado em `ESTADO_SESSAO.md`
§3-§4):** validar os 2 fluxos reais da aplicação (convite, reset de
senha) com o SMTP real — só o envio genérico foi testado; verificar
SPF/DKIM/DMARC de `elafashionmkt.com.br`; confirmar limite diário de
envio do plano; replicar as variáveis `MAIL_*` no `.env` real de
produção quando o host for provisionado (hoje só existem no `.env`
local). Nenhum commit foi criado nesta sessão (nenhuma mudança
versionável — só `.env` local).

## 37. Homologação funcional iniciada — 8 fluxos prioritários auditados, 2 bugs de integridade de dados corrigidos (2026-07-23)

Primeira sessão da fase de Homologação Funcional (anunciada em §32,
nunca iniciada nas duas sessões seguintes por terem sido consumidas por
consolidação de documentação e SMTP). Conduzida em paralelismo intenso
(2 subagentes de auditoria simultâneos por rodada, agente principal só
implementando) a pedido explícito do responsável do projeto ("Modo
ULTRA POWER").

**Método:** para cada fluxo, um subagente lê controller/model/request/
rotas/frontend/testes existentes, roda os testes, cruza com `PRD.md`/
`docs/specs/` e reporta achados; o agente principal reproduz a causa
raiz, corrige o mínimo necessário, roda só os testes impactados, e
commita por bug (não por fluxo) — 5 commits nesta sessão, todos
pushados para `origin/feat/ui-design-system-ela`.

**Ajuste de critério no meio da sessão (decisão do responsável do
projeto):** o objetivo desta fase não é produzir hardening de produção
nem endurecer a implementação — é validar que os fluxos de negócio
funcionam ponta a ponta para permitir demonstrar o TEAR a um cliente
antes da futura reescrita para a arquitetura definitiva. A partir desse
ajuste, itens de dívida de teste, rate-limit mais rigoroso, race
conditions exigindo requisições concorrentes e polimento de UX deixaram
de ser corrigidos nesta sessão — ficam registrados como pendências não
bloqueadoras (ver `ESTADO_SESSAO.md` §4), não descartados.

**Bugs corrigidos (commits `d7b7fc2`, `a569bca`, `c91b52b`, `c97b8b1`,
`f3c20b4`):**

1. **Corrupção de estado ao aprovar Parceira com e-mail já em uso**
   (severidade Alto): `ParceiraController::aprovar()` gravava o status
   `Ativa` antes de criar o `User` vinculado, sem transação. Se já
   existisse um `User` com o mesmo e-mail, `User::create()` lançava
   exceção não tratada e a Parceira ficava `Ativa` com `user_id` nulo e
   nenhum convite enviado, sem sinal de erro para o admin. Corrigido com
   `DB::transaction` + captura de `QueryException` (23000) retornando
   422 claro.
2. **Falha de transação no cadastro público** (severidade Alto, mesma
   classe de bug do item 1): `Parceira::create()` e
   `registrarConsentimentoCadastro()` eram duas escritas separadas sem
   transação — falha na segunda deixava uma Parceira persistida com
   dados pessoais mas sem registro de consentimento LGPD. Envolvido em
   `DB::transaction`.
3. `Parceira::aprovar()` não limpava `reprovado_por`/`reprovado_em`/
   `motivo_reprovacao` ao reaprovar uma parceira previamente reprovada
   — registro antigo ficava visível na API mesmo com a parceira ativa.
4. Rodapé dos e-mails transacionais (convite, redefinição de senha)
   terminava em inglês ("Regards,...") por falta de tradução das
   strings padrão do template de e-mail do Laravel para pt_BR — corrigido
   via `lang/pt_BR.json`.
5. `reenviar-convite` era a única rota de geração de token de senha sem
   `throttle:6,1` (assimetria confirmada por duas auditorias
   independentes, uma do fluxo de convite e outra do fluxo de reset).
6. Tela de definir senha com link expirado/inválido não oferecia saída
   — adicionado link para `/esqueci-senha`.

**Achado relevante sem correção de código:** a auditoria do fluxo de
recuperação de senha confirmou que convite de influenciadora e "esqueci
minha senha" usam exatamente o mesmo broker/token/tela do Laravel desde
o P0-1 já registrado — não há dois mecanismos divergentes, hipótese de
risco inicial descartada.

**Status por fluxo ao final da sessão:** Convite, Cadastro, Recuperação
de senha, Briefing, Upload de materiais, Aprovação de material e
Pagamento (caso 1:1 atual) — demonstráveis ponta a ponta sem bug
bloqueador conhecido. Login — nenhum bug funcional encontrado no
código, mas não reproduzido manualmente no navegador nesta sessão.
Recorrência/parcelamento de pagamento e GESTOR_MARCA seguem como
limitações de escopo conhecidas (não bugs), já registradas em sessões
anteriores.

**Não investigado nesta sessão (fora da lista dos 8 fluxos pedidos):**
subagente notou de passagem que o item de menu "Logística" no
`AppShell.tsx` do frontend é um `<PlaceholderPage>` desabilitado — a
tela real de Envio só é alcançável por drill-down a partir do detalhe
de Campanha. Não verificado a fundo; achado do relatório
`docs/reports/AUDITORIA_FUNCIONAL_MVP_VS_ESPECIFICACAO.md` de sessão
anterior.

## 38. Auditoria de regras de negócio (papel QA, em paralelo ao §37) — 1 bug Categoria A corrigido, fluxos reclassificados para a fase de migração (2026-07-23)

Sessão conduzida em paralelo à sessão de Homologação Funcional do §37
(mesmo dia, commits `75cf5c4` e `4138c04` a poucos segundos de
distância), num papel dedicado de QA/Auditor Técnico: alimentar uma
fila priorizada de bugs sem implementar, até o passo final em que o
responsável do projeto pediu a correção de um achado específico.

**Rodada 1 (tela por tela, P0/P1):** reauditoria independente de Login,
Recuperação de senha, Convite de influenciadora, Cadastro e Aprovação —
sem saber do trabalho do §37 em andamento na outra sessão. Achados
coincidem em boa parte com os do §37 (throttle assimétrico do
reenvio de convite, falta de unicidade de e-mail em Parceira,
mensagens de erro genéricas no Login) — nenhuma divergência relevante,
confirma por auditoria cruzada independente que os achados do §37 eram
reais.

**Rodada 2 (mudança de estratégia — regras de negócio, não telas):** a
pedido explícito do responsável do projeto, a auditoria passou a
perguntar "existe alguma forma de o sistema chegar a um estado
impossível?", rastreando Pagamento, ParticipacaoNaCampanha, Campanha,
Briefing, Material e Envio (controllers, models, FormRequests,
migrations) em vez de telas. Achados (arquiteturais, não de tela):

1. **Gate de material aprovado (regra P0-1) contornável pulando direto
   para `status=PAGO`** — `PagamentoController::update()` só chamava
   `existeMaterialNaoAprovado()` na transição explícita a `APROVADO`.
   **Corrige uma lacuna que o §37 não pegou**: aquela sessão classificou
   Pagamento como "demonstrável ponta a ponta sem bug bloqueador
   conhecido" — não estava, a regra central do fluxo (não pagar sem
   material aprovado) tinha um desvio trivial.
2. `Pagamento.valor` editável mesmo com `status=PAGO`, sem trava nem
   auditoria.
3. Pagamento e cancelamento de Participação não se checam mutuamente
   (dá pra pagar cancelada, ou cancelar já paga).
4. Campanha `ENCERRADA`/`CANCELADA` continua 100% editável (inclusive
   reabrindo status ou trocando marca).
5. Participação pode ser criada numa Campanha já `ENCERRADA`/`CANCELADA`.
6. Congelamento (`congelado_em`) é decorativo fora dos campos comerciais
   da própria Participação — confirmado em código que também não cobre
   Material nem Envio, além do Briefing já registrado no §4 do
   `ESTADO_SESSAO.md`.
7. `PagamentoController` sem `DB::transaction`/lock — mesma classe de
   race condition já corrigida em `ParceiraController::aprovar` (§37
   item 1), ainda não replicada aqui.

**Rodada 3 (reclassificação A/B/C):** a pedido do responsável do
projeto, todos os achados (rodadas 1 e 2) foram reclassificados sob o
critério já fixado no §37.3 ("validar fluxos de negócio, não hardening
de produção"):

- **Categoria A** (bloqueia validar o produto) — só o item 1 acima
  (gate de material aprovado contornável): é a única regra com
  referência explícita de spec no próprio código (`P0-1`), e a pergunta
  central do roteiro ("é possível pagar sem material aprovado?") tinha
  resposta positiva.
- **Categoria B** (funciona, mas compromete robustez/segurança/
  concorrência/manutenção) — itens 2, 3, 4, 5, 7 acima, mais a falta de
  unicidade de e-mail em Parceira (já em `ESTADO_SESSAO.md` §4) e a
  máscara de erro genérica do Login (idem).
- **Categoria C** (pode esperar) — item 6 (congelamento decorativo,
  decisão de produto já em aberto), `reenviarConvite` não distinguir
  parceira já ativa.

**Correção aplicada (único item Categoria A, commit `4138c04`):**
`PagamentoController::update()` agora chama `existeMaterialNaoAprovado()`
para qualquer avanço a `APROVADO` **ou** `PAGO`, não só à transição
específica a `APROVADO`. 3 testes novos em `PagamentoTest.php` cobrindo
o bypass (bloqueia PAGO direto com material pendente/reprovado, permite
PAGO direto com material aprovado). Suíte completa do backend: 206/206
verde. `vendor/bin/pint --test`: limpo.

**Importante — branch e PR ainda não mergeados:** o commit `4138c04`
está na branch `fix/pagamento-gate-pago` (criada a partir de
`feat/ui-design-system-ela` em `f3c20b4`, **antes** do commit de
fechamento `75cf5c4` do §37 — as duas sessões divergiram do mesmo ponto
em paralelo). PR draft aberto:
`https://github.com/estudioela/jescri-migracao/pull/66`, alvo
`feat/ui-design-system-ela`. **Ainda não mergeado** — `feat/ui-design-
system-ela` continua em `75cf5c4` sem a correção até o merge acontecer.

**Conclusão da sessão (comunicada pelo responsável do projeto):** com o
único bloqueador Categoria A corrigido, os fluxos de negócio auditados
(Login, Recuperação de senha, Convite, Cadastro, Aprovação, Upload,
Pagamentos, Campanhas, Administração) ficam aptos para a fase de
migração para a arquitetura definitiva — os itens B/C remanescentes não
bloqueiam a validação do produto, salvo novo achado crítico.

**Correção factual (2026-07-23, sessão de curadoria documental §39):** o
texto acima ("Ainda não mergeado") ficou desatualizado — verificado por
`git log` nesta sessão que o PR #66 **já foi mergeado**
(`99b5f6a`, merge de `fix/pagamento-gate-pago` em
`feat/ui-design-system-ela`), e há mais um commit à frente
(`955bb83`, `feat(portal): adiciona historico da influenciadora (RF-028)`)
não registrado em nenhuma seção deste arquivo. Registro puramente factual
(divergência encontrada por checagem de `git log`/`git status`, não nova
auditoria) — o conteúdo funcional de §37/§38 permanece o mesmo, só o
status do merge e o novo commit precisam de uma sessão dedicada ao fluxo
de QA/Homologação para serem documentados corretamente.

## 39. Curadoria documental — decisão P0-2 extraída para ADR-018, plano de congelamento arquivado (2026-07-23)

Continuação da sessão de curadoria documental (Agente C) interrompida por
limite de contexto. Escopo estritamente documental — nenhum código
alterado.

- **Item pendente localizado e concluído:** `docs/planning/
  PLANO_FINAL_CONGELAMENTO_OPERACIONAL.md` (P0-2) era o único item
  faltante da Fase 1 do plano executivo de simplificação documental (§28)
  com pré-requisito não cumprido (extrair a decisão de arquitetura para
  ADR antes de arquivar).
- **Leitura direta do código** (`ParticipacaoNaCampanha.php`,
  `ParticipacaoController.php`, `routes/api.php`, migration
  `2026_07_20_180000_...`) confirmou que a implementação real é **muito
  mais estreita** do que o plano original propunha: só a coluna
  `congelado_em` + trava de edição de 4 campos comerciais. Não existem
  `congelado_por`, `dados_congelados` (cópia do cadastro da Parceira) nem
  `historico_alteracoes_participacao` — o núcleo do problema que o plano
  original resolvia (histórico não deve vazar alteração posterior do
  cadastro vivo da Parceira) **não está coberto** pela implementação
  atual. Achado consistente com
  `docs/reports/RECONCILIACAO_ESPECIFICACAO_FUNCIONAL_MVP.md` (2026-07-22)
  e com a pendência Categoria C já registrada em `ESTADO_SESSAO.md` §4
  ("Congelamento é decorativo fora dos campos comerciais").
- **`docs/adrs/ADR-018-congelamento-de-participacao-trava-simples.md`**
  criada — documenta o que foi de fato implementado, o gap consciente em
  relação ao plano original, e mantém o plano completo como referência
  arquivada para se o Sprint 3 (Contratos) precisar da garantia de
  integridade histórica completa.
- **`git mv`** de `docs/planning/PLANO_FINAL_CONGELAMENTO_OPERACIONAL.md`
  para `docs/archive/pagamento-snapshot/` (mesmo cluster temático dos 3
  documentos-fonte que ele já cita em seu próprio §0) — histórico
  preservado via rename. `docs/archive/README.md` e
  `docs/planning/PLANO_MESTRE_ELA_INFLUENCIA.md` (linha de governança
  §"Governança deste documento") atualizados para não referenciar mais o
  arquivo pelo caminho antigo.
- **Divergência encontrada e registrada (não corrigida além do registro
  factual):** ver correção anexada ao final de §38 — `ESTADO_SESSAO.md` e
  este arquivo estavam desatualizados quanto ao merge do PR #66 e a um
  commit adicional (RF-028) não documentado; fora do escopo desta sessão
  (documental) investigar ou fechar essa lacuna, que pertence à trilha de
  QA/Homologação.
- **Não executado nesta sessão (fora do escopo da tarefa de continuação,
  aguardando decisão do responsável do projeto — ver relatório de
  encerramento da missão do Agente C):** os demais itens de Fase 1
  (2 roadmaps superados, `REPOSITORY_GOVERNANCE_AUDIT.md`,
  `RELATORIO_CONSOLIDACAO_AUDITORIAS.md`), Fase 2 (3 remoções diretas já
  validadas), Fase 3 (2 consolidações) e Fase 4 (arquivamento pós-Go-Live)
  — todos já listados em §28, nenhum teve autorização explícita de
  execução nesta sessão. Destino dos 3 relatórios `docs/reports/*.md`
  (`??`) também segue não decidido.

## 40. PR #66 mergeado, missão de QA/Certificação do Agente B encerrada (2026-07-23)

Continuação da sessão do §38, retomada após interrupção por limite de
uso. Verificação de estado (não reauditoria): o PR #66
(`fix/pagamento-gate-pago` → `feat/ui-design-system-ela`) descrito como
"ainda não mergeado" no §38 **já estava mergeado** ao retomar esta
sessão — merge commit `99b5f6a`, CI verde (backend + frontend). A branch
`feat/ui-design-system-ela` avançou mais dois commits depois do merge,
de uma sessão paralela não documentada aqui até agora:

- `bb44d20` — corrige consentimento LGPD ausente no modo criação de
  Parceira (`ParceiraFormPage.tsx`); achado por reprodução manual no
  navegador durante a homologação funcional.
- `955bb83` — implementa `GET /me/historico` (RF-028) e a tela
  correspondente no Portal da Influenciadora, fechando a última etapa do
  ciclo de negócio definido em §32 (`...→ Pagamento → Histórico`).
  Validado no navegador com campanha real `ENCERRADA`.

**Verificado nesta sessão em `955bb83` (HEAD atual de
`feat/ui-design-system-ela`):** backend 208/208 testes verdes,
`pint --test` limpo, `tsc -b` (frontend) limpo — sem regressão
introduzida pelos dois commits acima nem pelo merge do PR #66.

**Entrega desta sessão:** `docs/reports/CERTIFICACAO_MVP.md` — parecer
técnico formal de certificação funcional do MVP (`tear-v2-app/`),
consolidando os achados de §37/§38 e o estado atual pós-merge. Parecer:
**certificado funcionalmente** para o critério de demonstração a cliente
(não de Go-Live de produção, gate independente e ainda não autorizado em
`docs/release/GATE_FINAL_GO_LIVE.md`). Nenhum bloqueador funcional
(Categoria A) em aberto; pendências B/C mantidas como já registradas em
`ESTADO_SESSAO.md` §4.

**Missão do Agente B nesta frente (QA/Homologação/Certificação)
encerrada.** Próximo passo é decisão do responsável do projeto: seguir
para a frente de infraestrutura/Go-Live (`GATE_FINAL_GO_LIVE.md`) ou
ampliar a auditoria a fluxos secundários (Marcas, Medidas) antes disso.

## 41. Documentos de Go-Live efetivamente commitados (2026-07-23)

Sessão de continuação do Agente A, rodando em paralelo às sessões que
produziram §39/§40 (Agentes B e C) — mesmo objetivo de fechamento,
achado complementar: `docs/deployment/CHECKLIST_GO_LIVE.md`,
`docs/deployment/RUNBOOK_DEPLOY_E_ROLLBACK.md` e
`docs/release/GATE_FINAL_GO_LIVE.md`, já referenciados por §40 e por
`ESTADO_SESSAO.md` como se fizessem parte do repositório, estavam **só
no working tree local** (`??`, sem nenhum commit no histórico Git desta
branch) — mesma lacuna que a versão fundida de `ESTADO_SESSAO.md`
(sessões B+C) já registrava em §4 como pendência de decisão. Conteúdo
revisado, sem alteração de mérito: checklist executável de 6 blocos
(infraestrutura/segredos/publicação/serviços/operação/homologação
final), runbook de deploy e dos dois tipos de rollback (aplicação e
banco) específico para o host Locaweb sem Docker, e o gate formal de
decisão — hoje **GO LIVE: NÃO AUTORIZADO**, pendente só de
infraestrutura real externa ao código. Commitados nesta sessão, fechando
o item 4 da lista de "Próxima tarefa recomendada" da versão anterior de
`ESTADO_SESSAO.md`.

Suíte revalidada nesta sessão contra a branch (backend a partir de
`backend`): `php artisan test` → 208/208 verde;
`vendor/bin/pint --test` → limpo; `tsc -b` (frontend) → sem erros;
`oxlint` → só o aviso pré-existente e não relacionado de
`src/lib/auth.tsx`. Nenhum bug novo, nenhuma implementação parcial
encontrada. **Missão do Agente A nesta frente encerrada.**

## 42. Missão extra de limpeza da raiz — execução da Fase 1 (restante) e Fase 2 do plano de simplificação documental (§28) (2026-07-23)

- **Nova frente** (instrução explícita do responsável do projeto,
  "MISSÃO EXTRA — LIMPEZA E CONSOLIDAÇÃO DO REPOSITÓRIO", com autorização
  explícita para excluir/mover/fundir arquivos). Escopo: raiz do
  repositório e itens do plano de simplificação documental do §28 ainda
  não executados.
- **Fase 1 (restante) executada** — arquivamento (`git mv`, histórico
  preservado) para `docs/archive/`:
  - `docs/planning/ROADMAP_MESTRE_TEAR_V2.md` e
    `docs/planning/TEAR_V2.5_PRODUCTIZACAO_ROADMAP.md` →
    `docs/archive/roadmaps-superados/` (ambos declarados substituídos por
    `docs/planning/PLANO_MESTRE_ELA_INFLUENCIA.md`). Referências de
    caminho corrigidas nos 2 documentos ativos que ainda apontavam para o
    caminho antigo (`docs/release/TEAR_V2.5_GO_LIVE_CHECKLIST.md`,
    `docs/planning/ESPECIFICACAO_FUNCIONAL_MVP_COMPLETA.md`); referências
    em relatórios/handoffs já históricos (`HANDOFF_PRODUCTIZACAO_TEAR_V2.md`,
    `ARCHITECTURE_REVIEW_V2_5.md`, `HANDOFF_FINAL.md`,
    `RELATORIO_QA_FUNCIONAL_MVP_TEAR_V2.md`) deixadas como estão, mesmo
    critério já tolerado pelo `docs/archive/README.md` para os 19
    arquivos arquivados anteriormente.
  - `docs/governance/REPOSITORY_GOVERNANCE_AUDIT.md` e
    `RELATORIO_CONSOLIDACAO_AUDITORIAS.md` (raiz) →
    `docs/archive/auditorias-historicas/` (conteúdo já resumido em §16
    deste arquivo). `docs/governance/` ficou vazia e foi removida —
    adianta parte do item de Fase 4 já planejado ("remoção de
    `docs/governance/` da árvore ativa").
  - `docs/archive/README.md` e `README.md` (raiz) atualizados com as
    novas seções/remoção da referência a `docs/governance/`.
- **Fase 2 executada** — remoção definitiva (`git rm`, sem arquivamento,
  já validada anteriormente como segura):
  `docs/reports/STATUS_MVP_OPERACIONAL_TEAR_V2.md`,
  `docs/reports/RELATORIO_SPRINT_ESTABILIZACAO_TEAR_V2.md`,
  `docs/design/DESIGN_SYSTEM.md` (paleta nunca implementada). Confirmado
  antes da remoção que o débito técnico documentado no relatório de
  sprint (credenciais do Google Drive ausentes) já está rastreado como
  `P0-9` em `docs/release/TEAR_V2.5_GO_LIVE_CHECKLIST.md` — nenhuma
  informação perdida.
- **Assets de marca na raiz:** `elã-branco.svg` e `elã-vermelho.svg`
  removidos (duplicatas byte-idênticas já existentes em
  `frontend/public/`, único lugar onde são referenciados,
  por caminho absoluto `/arquivo.svg`, convenção do Vite). `elã-vinho.svg`
  (sem uso em código, sem duplicata) movido para
  `frontend/public/` por consistência com os outros 2, em vez
  de removido — não é lixo documental, é asset de marca de baixo custo de
  manutenção.
- **`PROJECT_GOVERNANCE.md` (raiz) mantido sem alteração**, por decisão
  desta sessão: contém decisões arquiteturais permanentes (§3 — camadas,
  envelope de resposta, convenções de dados) citadas ativamente por
  dezenas de arquivos em `src/` e por `ADR-002`/`ADR-004`/`ADR-010`, não
  duplicadas em nenhum outro lugar; mover quebraria a convenção de
  citação `PROJECT_GOVERNANCE §X.Y` usada no código. A poda do overlap
  real com `CLAUDE.md` (§2 fluxo, §7 fontes de autoridade) já está
  prevista na Fase 4 do §28 — **não executada nesta sessão**, mantida
  como estava planejada (gated a pós-Go-Live).
- **Fase 3 — desfecho real, revisado após confirmação explícita do
  responsável do projeto para prosseguir agressivamente:**
  - `UI_RULES.md`→`ADR-002`: **não executado.** Investigação revelou que
    `ADR-002` documenta uma decisão de arquitetura (biblioteca de
    componentes vanilla JS entregue via Apps Script HTML Service,
    `webapp/`) que **nunca foi implementada** (`webapp/` não existe no
    repositório) — foi de fato substituída por React+Vite servido pelo
    Laravel, decisão formal e distinta em `ADR-015` (Aceito). Promover o
    status de `ADR-002` para "Aceito" registraria uma decisão
    arquitetural factualmente incorreta na trilha de ADRs. `UI_RULES.md`
    permanece em `docs/design/` intocado (regras normativas de UX
    genéricas, não amarradas a nenhuma stack específica); `ADR-002`
    permanece "Proposed" — reflete a realidade (proposto, nunca aceito
    nem implementado).
  - `ESPECIFICACAO_FUNCIONAL_MVP_COMPLETA.md`→`BACKLOG_FUNCIONAL_V2_6.md`:
    **não fundido.** Investigação revelou que a extração necessária não é
    1 seção (recorrência/parcelamento), mas **12 decisões de negócio
    pendentes do responsável do projeto (§9)** mais ~13 lacunas sem item
    equivalente no backlog vigente — fundir sem decisão item a item
    arriscava perder decisões reais em aberto, risco que o próprio §28
    original já classificava como "médio-alto". **Arquivado íntegro**
    (`git mv`, sem perda de conteúdo) em
    `docs/archive/planejamento-pre-codigo/`. Consolidação seletiva
    (quais dos 12+13 itens viram item formal de backlog) fica para
    sessão dedicada, decisão item a item do responsável do projeto — ver
    `docs/archive/README.md` para o detalhe completo do achado.
- **Fase 4 (parcial) e missão extra de limpeza radical — remoção completa
  do Portal legado (`src/` + `test/`), autorizada explicitamente pelo
  responsável do projeto após confirmação de que o legado está
  descontinuado/substituído e que `tear-v2-app/` é a única aplicação
  oficial:**
  - Removidos: `src/` (14 `.js` + 13 `.html`, 556K), `test/` (86 arquivos
    `.test.js` + helpers, 596K, suíte Jest do legado), `eslint.config.js`
    (lint exclusivo de `src/`/`test/`), `.clasp.json.example`,
    `.claspignore`, `appsscript.json`, `scripts/preview-server.mjs`
    (dependia de `src/ui/*.html`, órfão sem `src/`), `package.json`/
    `package-lock.json` da raiz (só serviam a `test`/`lint`/`check`/
    `preview` do legado — confirmado que `mcp/tear-mcp-server`,
    `scripts/clean-notebook.sh`/`sync-notebook.sh` e o CI de
    `tear-v2-app/` são 100% independentes).
  - **Preservação de conhecimento antes da remoção:** algoritmo exato de
    normalização de `ChaveInfluenciadora` (trim + colapso de espaço +
    comparação case-insensitive, valor persistido preserva grafia
    original) extraído do código para `docs/specs/SPEC-003-importacao-inicial-da-base.md` §6.1 —
    único detalhe de regra de negócio que só existia no código-fonte, sem
    essa precisão documentada em nenhuma SPEC. Confirmado por auditoria
    dedicada (comparando `docs/archive/auditorias/AUDITORIA_REGRAS_NEGOCIO_LEGADO_TEAR.md`,
    `docs/planning/CONSOLIDACAO_REGRAS_CRITICAS_P0_TEAR_V2.md`, SPECs e
    `CONTRATO_SOBERANO.md`) que nenhuma outra regra de negócio exclusiva
    do legado ficaria sem fonte em prosa após a remoção.
  - **Arquivados** (não apagados, conteúdo 100% preservado):
    `PROJECT_GOVERNANCE.md` (raiz), `docs/_workspace/DEPLOY_CHECKLIST.md`,
    `docs/_workspace/ROTEIRO_HOMOLOGACAO.md` →
    `docs/archive/legado-apps-script/` — os três eram 100% específicos da
    arquitetura/operação do Portal GAS removido; `PROJECT_GOVERNANCE.md`
    também descrevia como roadmap vigente "V2 é evolução do Apps Script,
    não reescrita tecnológica" (§5.1), afirmação hoje factualmente
    incorreta frente a `ADR-015`.
  - **`README.md` (raiz) reescrito por completo** — a versão anterior
    (407 linhas) descrevia inteiramente o Portal GAS e não mencionava
    `tear-v2-app/` em nenhum lugar. Nova versão descreve o produto real
    (Laravel 13 + React 19/Vite), stack, estrutura, documentação e passos
    de setup (`composer install`/`npm install`).
  - **`knowledge/README.md` reescrito** — descrevia a arquitetura do
    Portal GAS; nova versão descreve a própria pasta `knowledge/`
    (`sistema-b/`, `references/`, `archive/`) como apoio ao
    desenvolvimento de `tear-v2-app/`.
  - **`CLAUDE.md`** — removida menção a `clasp push` (linha do mandato de
    operação autônoma) por não haver mais alvo de deploy via clasp.
  - **Varredura de referências quebradas:** nenhuma referência funcional
    remanescente em documentação viva — as únicas citações restantes a
    `src/`, `PROJECT_GOVERNANCE.md`, `DEPLOY_CHECKLIST.md`,
    `ROTEIRO_HOMOLOGACAO.md` ou `clasp` estão em ADRs históricos
    (`ADR-002/004/010/013`, nunca reabertos por convenção do projeto),
    SPECs e no próprio `TASK_ROUTER.md` como diário — todas toleradas
    como citação histórica, mesmo critério já usado no restante deste
    arquivamento.
- **Fase 4 (restante, não executada):** arquivamento de
  `docs/deployment/`/`docs/release/` continua gated a "só após o corte de
  produção do Go-Live" — Go-Live segue **NÃO AUTORIZADO**.
- **Validação:** suíte completa de `tear-v2-app/` rodada nesta sessão após
  a remoção do legado — `php artisan test` 208/208 verde, `vendor/bin/pint
  --test` limpo, `tsc -b && vite build` sem erros, `oxlint` só o aviso
  pré-existente de `src/lib/auth.tsx`. Nenhum código de `tear-v2-app/`
  alterado nesta rodada (só documentação).
- **Commit `fe5ccf8`, push direto para `feat/ui-design-system-ela`**
  (fast-forward de `ca211f2`).

## 43. Segunda rodada da missão de limpeza — ADR-002 marcado Superseded, ADRs legado com nota histórica, mais 4 pastas de docs consolidadas (2026-07-23)

Continuação da mesma missão (§42), por instrução explícita do responsável
do projeto de: (a) corrigir o status do `ADR-002` em vez de deixá-lo como
"Proposed" dando impressão de decisão ainda em aberto; (b) aplicar o
mesmo critério ao restante do repositório, inclusive corrigindo
referências para eliminar documentos redundantes em vez de preservá-los
só por terem links apontando para eles.

- **`ADR-002`:** Status alterado de "Proposed" para "Superseded by
  ADR-015" — nunca saiu do estágio de proposta (`webapp/` nunca existiu);
  nota de supersessão adicionada.
- **5 ADRs do legado GAS com nota histórica** (não tiveram status
  alterado — foram de fato aceitos e implementados, diferente do
  ADR-002; a nota só deixa claro que descrevem arquitetura removida, não
  orientação vigente): `ADR-004` (fundação técnica Sprint 0), `ADR-005`
  (persistência da Colaboração Mensal em planilha), `ADR-010` (banco
  oficial do Portal), `ADR-013` (OAuth do Portal via HtmlService
  sandboxed), `ADR-014` (consolidação de arquivos por módulo GAS).
- **`docs/architecture/ARQUITETURA_CAMADAS.md`** (100% sobre camadas do
  Portal GAS, zero menção a `tear-v2-app/`) → arquivado em
  `docs/archive/legado-apps-script/`; pasta `docs/architecture/` esvaziada
  e removida.
- **`docs/design/stitch-export/screens/`** (9 mockups estáticos,
  `code.html`+`screen.png`) → arquivado em
  `docs/archive/planejamento-pre-codigo/stitch-screens-mockups/` — todas
  as 9 telas já têm página real implementada em
  `frontend/src/pages/`. `stitch-export/DESIGN.md` (tokens)
  permanece ativo.
- **`docs/deployment/PLANO_IMPLEMENTACAO.md`** (runbook original, 12
  etapas) → arquivado em `docs/archive/deployment-superado/`, mas só
  **depois** de corrigir todas as citações "Etapa N" em documentos vivos
  (`docs/deployment/DEPLOY.md`, `ARQUITETURA_PRODUCAO.md`,
  `IMPLEMENTACAO_TECNICA.md`, `TEAR_V2.5_GO_LIVE_CHECKLIST.md`) para o
  número de etapa correspondente em `docs/deployment/PLANO_DE_IMPLANTACAO.md`
  (17 etapas — numeração e conteúdo por etapa **não são 1:1** com o
  documento antigo; mapeamento feito manualmente por comparação de
  conteúdo, não substituição textual ingênua). Citações de narrativa
  histórica em `ADR-015`/`ADR-016` (descrevem eventos que de fato
  aconteceram contra a numeração antiga) mantidas como estão.
- **3 relatórios de `docs/reports/`** (`HANDOFF_GO_LIVE.md`,
  `HANDOFF_PRODUCTIZACAO_TEAR_V2.md`,
  `RELATORIO_SPRINT_2_1_PORTAL_INFLUENCIADORA.md`) → arquivados em
  `docs/archive/reports-historicos/` — sem referência ativa em
  documentação vigente.
- **2 relatórios NÃO arquivados** apesar de terem sido cogitados
  inicialmente: `HANDOFF_FINAL.md` (citado 9+ vezes como fonte factual
  específica em `docs/reports/ARCHITECTURE_REVIEW_V2_5.md` — "148/148
  testes verdes conforme HANDOFF_FINAL.md", achados P1/P2 específicos)
  e `RELATORIO_QA_FUNCIONAL_MVP_TEAR_V2.md` (citado como base factual em
  `docs/planning/ELA_INFLUENCIA_ENTREGA_1_ANALISE_ESTRATEGICA.md`) —
  ambos são evidência ainda ativamente referenciada, não histórico morto;
  arquivá-los sem primeiro reescrever as citações que dependem deles
  quebraria fatos específicos em documentos vivos de Go-Live.
- **`docs/deployment/PLANO_DE_IMPLANTACAO.md` NÃO fundido com
  `IMPLEMENTACAO_TECNICA.md`** apesar de sobreposição parcial identificada
  na auditoria — fusão de dois documentos operacionais extensos e ainda
  em uso ativo durante a preparação do Go-Live é risco desnecessário
  nesta rodada; ambos mantidos.
- **Validação:** mudança exclusivamente documental, nenhum código de
  `tear-v2-app/` alterado. Grep completo confirmou zero referência viva
  quebrada aos arquivos movidos nesta rodada (as únicas citações
  restantes são narrativa histórica em ADRs/handoffs já históricos).

## 44. Reversão da estratégia de arquivamento — remoção definitiva de `docs/archive/`, `docs/reports/` e 8 ADRs de legado (2026-07-23)

- **Mudança de critério, instrução explícita do responsável do projeto:**
  as três rodadas anteriores desta missão (§42/§43) usaram `git mv` para
  `docs/archive/` como estratégia padrão de baixo risco. O responsável do
  projeto considerou isso "conservador demais" e determinou o critério
  final: **se o conhecimento acionável já está consolidado em
  `ESTADO_SESSAO.md`/`TASK_ROUTER.md`/documentação vigente, o documento
  antigo é removido da árvore, não arquivado** — histórico completo
  permanece disponível via `git log`, só não ocupa mais espaço na árvore
  ativa.
- **Removido nesta sessão** (`git rm`, não `git mv`):
  - `docs/archive/` inteiro (64 arquivos, todas as 10 subpastas
    acumuladas ao longo desta e de sessões anteriores).
  - `docs/reports/` inteiro (7 arquivos) — confirmado antes da remoção
    que achados específicos citados por esses relatórios (ex.:
    `Pagamento::$fillable` inclui campo que deveria ser imutável;
    `AppShell` administrativo para usuário sem role) já estavam
    registrados em `ESTADO_SESSAO.md` §4 e `TASK_ROUTER.md` — nenhuma
    informação de manutenção futura perdida.
  - `docs/knowledge/archive/` (4) e `docs/knowledge/references/` (4) —
    pesquisa de fundação pré-implementação, já consumida pelas decisões
    formais (ADRs, SPECs).
  - **8 ADRs**: `001` (enum `MesReferencia`, confirmado sem uso em
    `tear-v2-app/`), `002` (Superseded by `ADR-015`, nunca implementado),
    `004`/`005`/`010`/`014` (mecânica do Portal GAS removido), `011`
    (rascunho nunca aceito), `013` (fluxo OAuth específico do sandbox do
    Apps Script, `tear-v2-app` usa Sanctum). Restam 6 ADRs vigentes:
    `003`, `012`, `015`, `016`, `017`, `018`.
- **Referências corrigidas** nos documentos vivos que citavam os arquivos
  removidos: `ADR-018` (removida citação ao plano original arquivado,
  reescrita para declarar que o documento de origem foi removido e a
  decisão está formalizada só na própria ADR), `README.md` (raiz, árvore
  de `docs/` e tabela de documentos principais), `docs/knowledge/README.md`
  (reescrito, só resta `sistema-b/`), `docs/planning/*`, `docs/release/*`
  (citações a `HANDOFF_FINAL.md`/roadmaps removidos trocadas por
  referência ao documento vigente correspondente ou removidas quando não
  havia substituto direto).
- **Não tocado, por ser estado sincronizado com serviço externo:**
  `docs/knowledge/.notebook-index.json` mantém entradas para arquivos já
  removidos (inclusive de antes desta sessão, ex.: `knowledge/specs/
  AUDITORIA_SPEC012.md`, `knowledge/sessions/HANDOFF_SESSAO_OAUTH_
  2026-07-18.md` — nomes que não correspondem a nenhuma estrutura já
  vista neste repositório, sinal de que o índice já estava desatualizado
  antes desta sessão). Reconciliação real requer rodar
  `scripts/clean-notebook.sh` (chama a API do NotebookLM via `nlm`) —
  não editado à mão para não gerar inconsistência com o notebook remoto.
- **`docs/_workspace/ESTADO_SESSAO.md` e este arquivo (`TASK_ROUTER.md`)
  não tiveram suas entradas históricas reescritas** — ambos continuam
  citando caminhos hoje removidos em texto narrativo de sessões passadas;
  tratado como jornal (convenção já estabelecida nas rodadas anteriores).
  `ESTADO_SESSAO.md` será reescrito do zero por `/fim` ao encerrar esta
  sessão, o que resolve suas referências desatualizadas.
- **`docs/` passa de ~102 arquivos `.md`** (linha de base da missão de
  simplificação documental original, §28) **para 50 arquivos em 9
  pastas temáticas** (`_workspace`, `adrs`, `deployment`, `design`,
  `history`, `knowledge`, `planning`, `release`, `specs`) — todas
  vigentes, sem pasta de arquivo morto.
- **Validação:** nenhum código de `tear-v2-app/` alterado nesta sessão.
  Suíte completa (`php artisan test` 208/208, `pint --test`, `tsc -b`,
  `vite build`, `oxlint`) validada antes do commit anterior (§43) e não
  afetada por esta rodada (só documentação).
