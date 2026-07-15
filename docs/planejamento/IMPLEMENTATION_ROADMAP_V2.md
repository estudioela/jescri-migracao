# IMPLEMENTATION ROADMAP V2 — TEAR V2 · Fase 5

**Status:** Plano técnico de implementação (planejamento — não implementação)
**Data:** 2026-07-14
**Entrada:** `docs/_workspace/ARCHITECTURE_FREEZE_FINAL.md`, `IMPLEMENTATION_PLAN.md`, ADR-001 (enums/MesReferencia), ADR-002 (frontend), ADR-003 (linguagem ubíqua), SPECs em `docs/specs/`.
**Nota de leitura:** `docs/planejamento/READY_FOR_IMPLEMENTATION.md` não existe no repositório; seus gates (Q-01/Q-09/Q-10 decididos; import antes da Fase 2) já constam do Freeze §5 e do `DECISOES_BLOQUEANTES.md` — não bloqueia este plano.

---

## 1. Estratégia de implementação

**Incremental, por fatia vertical (não por camada).** Cada incremento entrega um caso de uso real do contrato externo até a persistência, com teste automatizado — nunca "todas as ACLs primeiro" ou "todo o domínio primeiro".

**Do congelado ao funcionando, em 3 movimentos:**
1. **Fundação técnica (Sprint 0):** esqueleto de camadas + harness de teste + envelope + `include()`. Nenhuma feature.
2. **Vertical slice raiz (M1):** o primeiro fluxo real ponta a ponta — cadastro→persistência→consulta/edição→ativação.
3. **Expansão por competência:** M2 (Compilador do Mês) e, sobre ele, os módulos operacionais e o Portal, cada um como slice vertical com testes verdes.

Princípios:
- **Raiz antes das folhas:** construir M1 (Parceira) antes de qualquer módulo que dependa dela.
- **Materialização antes de operação:** M2 (Compilador do Mês) cria as competências; só depois os módulos operacionais preenchem seus estados.
- **Portão por fase:** um módulo só entra quando sua SPEC está congelada (todas estão) **e** as decisões de PO que o portam foram registradas em ADR.
- **Fail-fast e falha degradável:** estado desconhecido → erro barulhento; dependência externa fora do ar → operação principal segue.
- **Publicação só com confirmação humana;** agentes não publicam.
- **Reaproveitar** `ACL.js` e `Repositories.js` (`ParceiroRepository`) existentes como ponto de partida de M1.

**Invariantes que a implementação não pode violar (Freeze §4):** ACL única; enum fechado fail-fast; `MesReferencia = AAAA-MM`; adaptador único por dependência externa com falha degradável; PII nunca em log/evento/Snapshot; fronteiras de agregado (Colaboração Mensal publica `MesCompilado`, vizinhos reagem).

---

## 2. Stack técnica definida

**Decidida (Q-01 ✅) e congelada (Freeze §4):**

| Camada | Tecnologia |
|---|---|
| Execução / backend | Google Apps Script (JavaScript) |
| Persistência | Google Sheets (planilha nova `portal-ela`, Q-10 ✅) |
| Arquivos | Google Drive |
| Frontend | HTML/CSS/JS vanilla via HTML Service `include()` (ADR-002) |
| Deploy | `clasp`, publicação **controlada por operador** (agentes nunca publicam) |
| Fonte do código | Git |
| Testes | `jest` executando código GAS via `vm` (a montar no Sprint 0) |

**Camadas (arquitetura congelada):**
```
Entrypoint (doGet/doPost, onFormSubmit, menu)
  → Controller (envelope {success,data} | {success,error})
    → Service (orquestra casos de uso)
      → Domínio (regra pura; linguagem ubíqua; sem HTTP/Sheets)
      → Repository (único que toca SpreadsheetApp)
        → ACL (único que conhece coluna física; coerção cru→canônico, fail-fast)
  Adaptadores isolados (falha degradável): CEP, Rastreio, Storage(Drive), Documentos
```

---

## 3. Ordem dos módulos

**M1 Cadastro & Base é o primeiro.** Motivo: é a **entidade-raiz** (Parceira) da qual todos os demais dependem; é o único módulo com **duas SPECs já detalhadas** (SPEC-001, SPEC-002); e **não tem portão de PO em aberto** (Q-01/Q-09/Q-10 decididos). Iniciar por M2 exigiria decisões abertas (Q-06) — proibido.

Ordem topológica (Freeze §3 + Implementation Plan §6):
```
Fase 0 (fundação técnica)
  → M1 Cadastro ─┬─ Importação Inicial (SPEC-003, antes de M2)
                 ├─ M2 Colaboração Mensal (Compilador do Mês)
                 │     ├─ M3 Briefing
                 │     ├─ M4 Conteúdo   (paralelo)
                 │     ├─ M5 Logística  (paralelo)
                 │     └─ M6 Financeiro (paralelo; também depende de M1)
                 ├─ M7 Documentos (M1 + M3)
                 └─ M8 Portal (M1,M3,M4,M6 + ADR-002)
  → M9 Arquivamento (M4,M5,M6)
```

Portões de PO por módulo: M2 → P8/Q-06, P4/Q-05; M4 → Q-03; M6 → P3/Q-04; M8 → P5/Q-07, P6/Q-08, Q-09-Portal.

---

## 4. Sprint 0 — Fundação técnica

**Objetivo:** preparar o terreno; nenhuma feature de negócio.

**Preparação técnica**
- Estrutura de camadas vazia (Entrypoint/Controller/Service/Domínio/Repository/ACL) com contratos de interface.
- Envelope de resposta padrão `{success,data}` / `{success,error}` (PROJECT_GOVERNANCE §3.3).
- Harness de teste: `jest` sobre código GAS via `vm` (não existe hoje); scaffolding de fixtures de planilha.
- `clasp` configurado; Git como fonte; pipeline local de lint/test.

**Estrutura inicial**
- Convenção de diretórios `.js` por camada (decisão D-04, registrada em ADR).
- `webapp/design-system/` com `include.js`, `tokens/`, `gallery.html` (ADR-002) — só o esqueleto de componentes.

**Ambiente**
- Planilha nova `portal-ela` como banco V2 (Q-10 ✅), esquema físico limpo (D-02c), acessada só via ACL.
- Segredos/IDs fora do código; deploy controlado por operador.

**Validações necessárias (saída do Sprint 0)**
- Suíte de testes executa (vazia-verde).
- `gallery.html` renderiza tokens/primitivos (valida o look elã).
- Envelope e `include()` funcionando em um endpoint de fumaça.
- ADRs de fundação registrados (D-04, D-05, D-06 conforme aplicável).

---

## 5. Primeiro Vertical Slice

**Fluxo:** **Cadastro de Parceira ponta a ponta** (M1, SPEC-001/002).

**Ponta a ponta (borda → persistência):**
1. **Entrypoint** recebe o cadastro externo (`onFormSubmit`/endpoint) → cria Parceira **sempre `Inativa`** (RN-01).
2. **Adaptador de CEP** resolve endereço com **falha degradável** (RN-02) — não bloqueia salvar.
3. **Domínio Parceira** (VOs `ChaveInfluenciadora`, `PIX`, `CNPJ`, `Endereco`, `CondicaoComercial`; enum `Ativa/Inativa`).
4. **Repository + ACL** (`BASE DE DADOS`) persistem por cabeçalho, nunca por índice.
5. **Consulta/edição admin** (SPEC-002): editar dados comerciais/endereço; **ativar/inativar** manual (RN-03) preservando o registro.

**Aceite do slice (SPEC-001 §10 + SPEC-002 §20):** cadastro válido nasce `Inativa`; nenhum dado do formulário ativa; endereço recomposto após CEP/número/complemento; falha de CEP não bloqueia; base consultável/editável (Ativas e Inativas); inativação não exclui; nenhum efeito colateral de competência/pagamento/logística; PII fora de log.

Este slice prova a **espinha vertical completa** (borda→ACL) que todos os módulos seguintes reutilizam.

---

## 6. Sequência dos próximos sprints

| Sprint | Capacidade | SPEC | Portão PO | Saída verificável |
|---|---|---|---|---|
| **S1b** | Importação Inicial da Base | SPEC-003 | curadoria Q-10 | Parceiras reais na base nova; idempotência por chave |
| **S2** | Compilador do Mês (materialização) | SPEC-005 | 🟠 P8/Q-06, P4/Q-05 | `MesCompilado` cria Colaborações + Snapshots; atômico e idempotente |
| **S3** | Briefing | SPEC-009 | P8/Q-06 | Data de aprovação (4 bordas de dia); `BriefingPublicado` |
| **S4a** | Conteúdo/Ativações | SPEC-012 | 🟠 Q-03 | Upload→`EmRevisao`; publicar→arquiva; estados fail-fast |
| **S4b** | Logística | SPEC-016 | rótulos crus (ADR §2.4) | Rastreio→data de envio; entregue→arquiva; degradável |
| **S4c** | Financeiro | SPEC-020 | 🟠 P3/Q-04 | Mensal+avulso; pago→arquiva; PIX fora de log |
| **S5** | Documentos | SPEC-023 | — | Contrato só Ativa; briefing formal só sinalizado |
| **S6** | Portal (6a acesso→6b conteúdo→6c financeiro/histórico→6d perfil) | SPEC-025/027/030/032 + ADR-002 | 🟠 P5/Q-07, P6/Q-08, Q-09-Portal | Isolamento por parceira; auth conforme Q-07 |
| **S7** | Arquivamento | SPEC-034 | — | Carimbo de data; imutabilidade; `CompetenciaArquivada` |

S4a/S4b/S4c são **paralelizáveis** após S2/S3. Cada sprint fecha com a "Definition of Done" (§19) e o "Plano de Testes" (§20) da SPEC correspondente verdes, zero regressão de RN, ACL intacta.

---

## 7. Critérios para iniciar implementação

A equipe pode começar a codar uma fase quando **todos** forem verdadeiros para ela:

1. **SPEC congelada** (todas estão — Freeze §3).
2. **Decisões de PO que a portam** (§3/§6) respondidas e registradas em ADR — quando aplicável.
3. **Fase anterior** na ordem topológica **verde** (critérios da §6).
4. **Decisões técnicas da fase** (D-04…D-09 do Implementation Plan §8) tomadas via ADR datado.
5. **Autorização explícita do Product Owner** para iniciar a implementação.

**Situação atual dos portões:**
- **Sprint 0 e Primeiro Vertical Slice (M1):** portões satisfeitos (Q-01/Q-09/Q-10 ✅; SPEC-001/002 prontas). **Elegíveis a iniciar mediante autorização do PO.**
- **S2+:** aguardam seus portões 🟠 (P3–P8, Q-03, Q-06) por fase.

---

**Fim do planejamento. Nenhuma atividade de implementação foi iniciada.**
