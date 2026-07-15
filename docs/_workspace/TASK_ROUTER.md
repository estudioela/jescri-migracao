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

---

### EPIC 02 — Colaboração Mensal

#### `[>]` SPEC-005 · Colaboração Mensal
- **Deps SPEC:** SPEC-002
- **Requisitos (PRD):** §5.2, §6.2, §7 (RN-04, RN-05, RN-06), §8 ("Ciclo Mensal" ≡ Colaboração Mensal)
- **Restrições:** `CONTRATO_SOBERANO` §5, §6, §8 · `ADR-001` §2, §3 (MesReferencia `AAAA-MM`) · `ADR — Linguagem Ubíqua` §4
- **Material já redigido:** `~/Downloads/SPEC-005-REVISAO.md` (Parte 3 = v2.0), já extraído para `docs/specs/SPEC-005.md`
- 🟠 **Aberto:** P8 / Q-06 (ano ausente em MesReferencia) · P4 / Q-05 (inativação)
- ✅ **Resolvido:** MesReferencia alinhado a `AAAA-MM` (ADR-001 §3) na SPEC-005 v2.0.

---

### EPIC 03 — Briefing

#### `[ ]` SPEC-009 · Briefing de Campanha
- **Deps SPEC:** SPEC-005
- **Requisitos (PRD):** §5.3, §6.3, §7 (RN-04, RN-06), §9 (RF-008, RF-009, RF-010)
- **Restrições:** `ADR-001` §2 (cálculo da data de aprovação = RN-04)

---

### EPIC 04 — Conteúdo e Ativações

#### `[ ]` SPEC-012 · Gestão de Conteúdo e Ativações
- **Deps SPEC:** SPEC-005
- **Requisitos (PRD):** §5.4, §6.4, §7 (RN-06, RN-07, RN-08), §9 (RF-011…RF-015)
- **Restrições:** `ADR-001` §2.2 (estados de conteúdo)
- 🟠 **Aberto:** Q-03 (rótulos crus persistidos de `EmRevisao`/`Publicado`)

---

### EPIC 05 — Logística

#### `[ ]` SPEC-016 · Gestão Logística
- **Deps SPEC:** SPEC-005
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

#### `[ ]` SPEC-023 · Geração de Documentos
- **Deps SPEC:** SPEC-002, SPEC-009
- **Requisitos (PRD):** §5.7, §6.7, §7 (RN-15), §9 (RF-024, RF-025)
- **Restrições:** `CONTRATO_SOBERANO` §6.1 · `ADR — Linguagem Ubíqua` §4 (Snapshot Comercial da Colaboração)

---

### EPIC 08 — Portal da Influenciadora

#### `[ ]` SPEC-025 · Acesso ao Portal
- **Deps SPEC:** SPEC-001
- **Requisitos (PRD):** §6.8, §7 (RN-16, RN-17, RN-18), §9 (RF-026, RF-027), §10 (segurança)
- 🟠 **Aberto:** P5 / Q-07 (modelo de autenticação) · P6 / Q-08 (papéis) · Q-09 (LGPD deve estar resolvida **antes** do Portal)

#### `[ ]` SPEC-027 · Conteúdo no Portal
- **Deps SPEC:** SPEC-009, SPEC-012, SPEC-025
- **Requisitos (PRD):** §5.4, §6.8, §9 (RF-011, RF-012, RF-013)

#### `[ ]` SPEC-030 · Financeiro e Histórico no Portal
- **Deps SPEC:** SPEC-012, SPEC-020, SPEC-025
- **Requisitos (PRD):** §6.6, §6.8, §6.9, §7 (RN-10), §9 (RF-023, RF-028, RF-030)

#### `[ ]` SPEC-032 · Perfil no Portal
- **Deps SPEC:** SPEC-001, SPEC-002, SPEC-025
- **Requisitos (PRD):** §6.8, §7 (RN-02), §9 (RF-029)

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
