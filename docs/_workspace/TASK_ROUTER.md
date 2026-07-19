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
| `CONTRATO_SOBERANO.md` | `CONTRATO_SOBERANO.md` (raiz) | no repo |
| `ADR-001` (enums/MesReferencia/promoção) | `docs/adrs/ADR-001-FECHAMENTO-DE-CONTRATO-E-ENUMS.md` | no repo |
| `ADR — Linguagem Ubíqua` | `docs/adrs/ADR-003-linguagem-ubiqua-do-dominio.md` | no repo (numeração a confirmar) |
| `ADR-002 — Frontend Foundation` | `docs/adrs/ADR-002-frontend-foundation.md` | no repo |
| `ADR-010 — Banco oficial do Portal (planilha V2 "Portal Ela")` | `docs/adrs/ADR-010-banco-oficial-do-portal.md` | no repo |
| `ADR-013 — Autenticação do Portal via OAuth 2.0 Authorization Code Flow` | `docs/adrs/ADR-013-autenticacao-oauth-authorization-code.md` | no repo |
| `ADR-014 — Consolidação de arquivos por módulo de negócio` | `docs/adrs/ADR-014-consolidacao-de-arquivos-por-modulo.md` | no repo (2026-07-19: `src/` reorganizado em 14 `.js` — fatias verticais em `src/modulos/`; caminhos `src/{acl,adapters,controller,domain,repository,service}/...` citados em achados anteriores são históricos; mapa classe→arquivo na ADR) |
| Contratos de camada (ex-`_contract.js`) | `docs/ARQUITETURA_CAMADAS.md` | no repo (migrados pela ADR-014) |
| `DECISOES_BLOQUEANTES.md` | — | **não existe mais** (2026-07-18: sumiu de `~/Downloads`; o estado de cada pergunta P3–P8/Q-NN está rastreado por SPEC neste roteador — resolvidas: Q-03/04/07/08/10; abertas: Q-05/06/09) |
| `SPEC.md` (formato/Entrega 01) | `docs/specs/SPEC-001.md` | no repo |
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
- **Material já redigido:** `~/Downloads/SPEC-005-REVISAO.md` (Parte 3 = v2.0), já extraído para `docs/specs/SPEC-005.md`
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
  Detalhe em `SPEC-020.md` §9/§21.
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
- **Requisitos:** `docs/specs/SPEC-035.md` (documento próprio — origem: revisão arquitetural + resolução de pendências em 2026-07-17; movido de `.gemini/spec-035-identidade/` em 2026-07-18, auditoria de apoio, para eliminar duplicata que já havia divergido do TASK_ROUTER)
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
  nada sobre selagem. Regra formalizada em `SPEC-034.md` RN-07/§21, no mesmo
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
  `SPEC-012.md` §9/§21 e `CONTRATO_SOBERANO.md` §8.
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
  System Estúdio Elã e o export Stitch (`docs/stitch-export/`). Documentos de
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
  `NOTEBOOKLM_HANDOFF_UI.md`, `docs/stitch-export/`, `auditoria/`) foram
  removidos por já estarem concluídos e aprovados; as pendências não
  bloqueantes acima foram preservadas nesta seção. `UI_FINAL_REVIEW.md`
  foi mantido (revisão pré-merge da PR #40 ainda em andamento).
