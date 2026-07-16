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
| `WORKFLOW.md` | `~/Downloads/WORKFLOW.md` | fora do repo (consolidar) |
| `PRD.md` | `docs/PRD.md` | no repo |
| `CONTRATO_SOBERANO.md` | `CONTRATO_SOBERANO.md` (raiz) | no repo |
| `ADR-001` (enums/MesReferencia/promoção) | `docs/adrs/ADR-001-FECHAMENTO-DE-CONTRATO-E-ENUMS.md` | no repo |
| `ADR — Linguagem Ubíqua` | `docs/adrs/ADR-003-linguagem-ubiqua-do-dominio.md` | no repo (numeração a confirmar) |
| `ADR-002 — Frontend Foundation` | `docs/adrs/ADR-002-frontend-foundation.md` | no repo |
| `ADR-010 — Banco oficial do Portal (planilha V2 "Portal Ela")` | `docs/adrs/ADR-010-banco-oficial-do-portal.md` | no repo |
| `DECISOES_BLOQUEANTES.md` | `~/Downloads/DECISOES_BLOQUEANTES.md — Projeto TEAR (Novo Sistema).md` | fora do repo (consolidar) |
| `SPEC.md` (formato/Entrega 01) | `docs/specs/SPEC-001.md` | no repo |
| `PLANILHA_TEAR_2.0_MAPA.md` | `PLANILHA_TEAR_2.0_MAPA.md` (raiz) | no repo |
| `03 — Fronteiras do Domínio` | `~/Downloads/03 — FRONTEIRAS DO DOMÍNIO.md` | fora do repo |
| `04 — Capacidades do Sistema` | `~/Downloads/04 — CAPACIDADES DO SISTEMA.md` | fora do repo |
| `06 — Modelo Conceitual dos Dados` | `~/Downloads/06 — MODELO CONCEITUAL DOS DADOS.md` | fora do repo |

> **Dívida registrada:** documentos "fora do repo" ainda vivem só em `~/Downloads`.
> Consolidá-los no repositório é ação separada (não realizada aqui).

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
- 🟠 **Aberto:** Q-03 (rótulos crus persistidos de `EmRevisao`/`Publicado`)

---

### EPIC 05 — Logística

#### `[x]` SPEC-016 · Gestão Logística
- **Deps SPEC:** SPEC-005, SPEC-001/002 (achado da FASE 1: `EnvioService` recebe `ParceiraACL` como porta do Cadastro, D-03 — `src/entrypoint/Portal.js` `montarEnvioService` —, dependência real não declarada antes)
- **Requisitos (PRD):** §5.5, §6.5, §7 (RN-13, RN-14), §9 (RF-016…RF-019)
- **Restrições:** `ADR-001` §2.4 (`STATUS REVISÃO` e `STATUS LOGISTICA` — máquinas independentes)

---

### EPIC 06 — Financeiro

#### `[ ]` SPEC-020 · Gestão de Pagamentos
- **Deps SPEC:** SPEC-002
- **Requisitos (PRD):** §5.6, §6.6, §7 (RN-09, RN-10, RN-11, RN-12), §9 (RF-020…RF-023)
- **Restrições:** `ADR-001` §2.3 (estados de pagamento)
- 🟠 **Aberto:** P3 / Q-04 (regra de elegibilidade de `PagamentoLiberado`) — **AGUARDA PO**

---

### EPIC 07 — Documentos

#### `[x]` SPEC-023 · Geração de Documentos
- **Deps SPEC:** SPEC-002, SPEC-009
- **Requisitos (PRD):** §5.7, §6.7, §7 (RN-15), §9 (RF-024, RF-025)
- **Restrições:** `CONTRATO_SOBERANO` §6.1 · `ADR — Linguagem Ubíqua` §4 (Snapshot Comercial da Colaboração)
- ✅ **Implementada (2026-07-16):** slice completo (`Documento`/`CamposDeMesclagem` → `ParceiraACL.obterParaDocumentos`/`DocumentoACL` → `DocumentoRepository` → `DocumentoService` → `DocumentoController` → Portal). Aba física nova `DOCUMENTOS` persiste só referência opaca (sem PII). Sinalização = coluna `SIM/NÃO` da `BASE DE DADOS` (PRD §5.7).
- **Dívidas registradas na implementação:** motor documental real por ADR futuro (D-01 — adaptador interino de texto); rótulos crus da aba `DOCUMENTOS` sem ADR (mesma pendência SPEC-016); autorização por papel aguarda SPEC-025; geração em lote (RF-024 "[job]") não implementada — comando individual por Parceira; sem UI de Portal (SPEC não define; §12 "leitura futura").

---

### EPIC 08 — Portal da Influenciadora

#### `[x]` SPEC-025 · Acesso ao Portal
- **Deps SPEC:** SPEC-001
- **Requisitos (PRD):** §6.8, §7 (RN-16, RN-17, RN-18), §9 (RF-026, RF-027), §10 (segurança)
- ✅ **Implementada (2026-07-16):** slice completo (`Credencial`/`TokenDeSessao`/`JanelaDeBloqueio`/`Sessao`/`Autenticador` → `ParceiraACL.obterAcessoLegado`/`SessaoACL`/`BloqueioACL` → `SessaoRepository`/`BloqueioRepository` → `AcessoPortalService` → `AcessoController` → Portal `entrarNoPortal`/`renovarSessaoDoPortal`/`sairDoPortal`). Abas físicas novas `SESSOES` e `BLOQUEIOS`. Bloqueio 5 falhas → 15 min (RN-02); sessão 6h deslizante (RN-03); erros AC-01/02/03 (§17); credencial/PII fora de log (RN-04); operações de acesso serializadas por trava global (LockService, só no Entrypoint) — primeira superfície multiusuária do sistema.
- **Dívidas registradas na implementação:** verificação de credencial atrás da porta do Autenticador via **adaptador legado provisório** (`VerificadorDeCredencialLegado`, RN-16: cupom + 5 primeiros dígitos do CNPJ, por decisão do PO em 2026-07-16) — trocar o modelo (Q-07) = trocar só o adaptador; acesso não filtra estado do vínculo (Ativa/Inativa) — regra não consta da SPEC.
- **UI (FASE 3 pós-SPECs, 2026-07-16):** `src/ui/login.html` — scaffolding temporário e funcional, sem identidade visual (decisão explícita do responsável do projeto: priorizar funcionamento para homologação; substituição futura pelo Design System oficial do Estúdio Elã não deve alterar a lógica de sessão/navegação). Navegação entre páginas via `window.top.location.href` (iframe sandboxed do HtmlService); token em `sessionStorage`.
- 🟠 **Aberto:** P5 / Q-07 (modelo de autenticação definitivo) · P6 / Q-08 (papéis) · Q-09 (LGPD deve estar resolvida **antes** de o Portal expor dados — SPEC-027/030/032)

#### `[x]` SPEC-027 · Conteúdo no Portal
- **Deps SPEC:** SPEC-009, SPEC-012, SPEC-025
- **Requisitos (PRD):** §5.4, §6.8, §9 (RF-011, RF-012, RF-013)
- ✅ **Implementada (2026-07-16):** fachada sem agregado próprio (§6.2/§6.4) — `ItemDePendencia` (VO de projeção) → `PortalDeConteudoService` (delega a `AcessoPortalService`/`EntregaService`/`BriefingService`, sem ACL/Repository novos — não há aba física nova) → `PortalDeConteudoController` → Portal (`verPendencias`/`lerBriefingDoItem`/`enviarMaterialDoPortal`). `parceiraId` deriva sempre da Sessão (token), nunca do comando externo (RN-01/INV-01). `listarPendencias` exclui Entregas `Publicado` (histórico é escopo de SPEC-030, §2). Bloco de Briefing só é exposto quando preenchido (`estaPreenchido()`, RN-03) — achado da revisão arquitetural, corrigido antes do commit. Erros PC-01 (sessão)/PC-02 (Entrega alheia ou briefing não preenchido) com `codigo`, mesmo padrão do AcessoController. 27 testes novos; suíte completa 378/378 verde; lint limpo.
- **Dívidas registradas na implementação:** nenhuma nova — herda as dívidas já registradas de SPEC-025 (Q-07/Q-08/Q-09) e SPEC-012 (D-02 material como URL).
- **UI (FASE 3 pós-SPECs, 2026-07-16):** `src/ui/pendencias.html` — scaffolding temporário (ver nota de SPEC-025).

#### `[ ]` SPEC-030 · Financeiro e Histórico no Portal
- **Deps SPEC:** SPEC-012, SPEC-020, SPEC-025
- **Requisitos (PRD):** §6.6, §6.8, §6.9, §7 (RN-10), §9 (RF-023, RF-028, RF-030)

#### `[x]` SPEC-032 · Perfil no Portal
- **Deps SPEC:** SPEC-001, SPEC-002, SPEC-025
- **Requisitos (PRD):** §6.8, §7 (RN-02), §9 (RF-029)
- ✅ **Implementada (2026-07-16):** fachada sem agregado próprio, mesma natureza da SPEC-027 — VOs `PIX`/`Endereco` (§6.1) → `ParceiraACL.obterPerfil`/`atualizarPerfil` (portas novas: leitura/escrita célula-a-célula de uma linha EXISTENTE em `BASE DE DADOS`, deliberadamente sem reescrever a aba inteira — 961 linhas com colunas não modeladas por este domínio) → `PerfilPortalService` (reaproveita `AcessoPortalService`) → `PerfilPortalController` → Portal (`verPerfilDoPortal`/`editarPerfilDoPortal`). `AdaptadorDeCepBrasilApi` cumpre a porta de CEP (RN-01); falha é degradável (RN-02/CB-01), nunca lançada (PP-03 vira sinal implícito via `endereco.completo`). `enderecoCompleto` é recomputado e também grava `INFLUENCIADORA_ENDERECO` para manter SPEC-016/023 consistentes. 40 testes novos; suíte completa 418/418 verde; lint limpo.
- **Achados da revisão arquitetural (corrigidos antes do commit):** (1) `String(x).trim()` sem guarda de `null` transformava `null` explícito na string literal `"null"`, corrompendo e-mail/PIX/CEP — corrigido com o mesmo padrão `== null ? '' : x` já usado nas VOs. (2) `editarPerfil` renovava a Sessão duas vezes por chamada (uma direta, outra via `verPerfil` no retorno) — corrigido para reaproveitar a Sessão já resolvida. (3) o adaptador de CEP era chamado a cada edição de endereço mesmo quando o CEP não mudava — corrigido para só chamar quando `cepMudou`.
- **Dívida registrada:** `comTravaDeAcesso` (trava global do Portal) agora pode segurar uma chamada HTTP síncrona ao BrasilAPI quando o CEP muda (única operação sob a trava hoje que sai da planilha para a rede; GAS não permite configurar timeout em `UrlFetchApp`) — se o serviço externo degradar, chamadas de login/logout/conteúdo de OUTRAS Parceiras na fila do lock podem falhar por timeout. Mitigado (chamada só quando o CEP muda), não eliminado. Resolver de vez exige mover a resolução de CEP para fora da trava ou trocar o lock global por lock por-Parceira — candidato a ADR futuro, tratado na FASE 4 (dívidas técnicas) do plano pós-SPECs.
- **UI (FASE 3 pós-SPECs, 2026-07-16):** `src/ui/perfil.html` — scaffolding temporário (ver nota de SPEC-025).

---

### EPIC 09 — Arquivamento

#### `[ ]` SPEC-034 · Arquivamento Geral Manual
- **Deps SPEC:** SPEC-012, SPEC-016, SPEC-020
- **Requisitos (PRD):** §5.8, §6.9, §7 (RN-08, RN-11, RN-14), §9 (RF-031, RF-032)
- **Restrições:** `CONTRATO_SOBERANO` §6.4 (imutabilidade), §8 (`CompetenciaArquivada`)

---

### Entregável adjacente (decisão do PO — Q-10)

#### `[ ]` SPEC · Importação Inicial da Base
- **Ordem:** **antes da Fase 2** (a compilação do mês precisa das Parceiras reais)
- **Origem:** `DECISOES_BLOQUEANTES.md` Q-10 (opção B) e Q-09 (PII mínima)
- **Requisitos (PRD):** §8 (entidade Influenciadora) · `PLANILHA_TEAR_2.0_MAPA.md` (mapa de colunas)
- **Deps SPEC:** SPEC-001, SPEC-002
- ⚠️ Não está no `WORKFLOW.md`; adicionar quando confirmado.

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
  **Não apaguei** (arquivo pré-existente, fora do escopo desta sessão) —
  registrar para o responsável do projeto decidir: arquivar/deletar
  `NEXT_AGENT.md`, ou confirmar se `mae/`/V1 ainda está mesmo viva em
  produção em outro lugar (branch/repo separado) e se há necessidade real
  de migração de dados de lá (relevante para ADR-010: "migração da
  planilha antiga").

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

Registradas para decisão (não corrigidas — mudam comportamento ou exigem escolha de arquitetura):
- **`BriefingRepository.listarPor`** (`src/repository/BriefingRepository.js`):
  nenhum Service/Controller o chama — possível preparação para uma feature
  de listagem de Briefing ainda não encomendada, ou código morto. Decidir:
  manter documentando a intenção, ou remover com o teste correspondente.
- **Duas convenções de validação de string obrigatória** coexistem nas VOs
  de Domain sem justificativa documentada (`if (!x || !String(x).trim())`
  vs. `String(x == null ? '' : x).trim()` + `=== ''`) — divergem em casos
  de borda (`0`/`false`). Unificar exigiria decisão explícita (~10 arquivos
  afetados), não é limpeza mecânica.
- **`ColaboracaoMensal.arquivar()` chama `Object.freeze(this)`** ao entrar
  no estado terminal; `Entrega`/`Envio` protegem seus estados terminais só
  com guardas manuais nos mutators, sem `Object.freeze`. Inconsistência de
  robustez (um mutator novo em `Entrega`/`Envio` que esqueça o guard
  quebraria o invariante silenciosamente) — adicionar `Object.freeze` é
  mudança de comportamento observável, não corrigido sem decisão.
- **`CONTRATO_SOBERANO.md` §4 desatualizado**: usa os termos "Ativação"/
  "Fluxo Logístico", já renomeados para `Entrega`/`Envio` (documentado nos
  próprios arquivos de domínio e em SPEC-012/016) — falta um ADR análogo ao
  ADR-003 formalizando essa troca especificamente no Contrato.

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
- `.claspignore` reinclui `ACL.js`/`Repositories.js` (legado da raiz) sem
  nenhuma referência ativa em `src/` — sobem a cada push sem necessidade;
  não removido, decisão do responsável.
- `appsscript.json` com `access: MYSELF` — decisão pendente antes de expor
  Parceiras reais (já registrado na FASE 1/2, reconfirmado aqui).
