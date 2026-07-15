# ARCHITECTURE FREEZE FINAL — TEAR V2 · Fase 4

**Status:** Congelado para implementação
**Data:** 2026-07-14
**Escopo:** conclusão da Fase 4 (Especificação de Módulos). Este gate declara a
documentação de especificação **completa e implementável**. Não autoriza, por si,
o início da implementação — isso depende de autorização explícita do Product Owner.

---

## 1. Objetivo do Freeze

Selar o conjunto de SPECs e as decisões arquiteturais estabilizadas, fixando a
base sobre a qual a implementação ocorrerá. Após este freeze, alterações
estruturais exigem nova ADR.

---

## 2. Fontes normativas congeladas (hierarquia)

1. `CONTRATO_SOBERANO.md` — domínio soberano (VOs, agregados, eventos, ACL).
2. `docs/adrs/ADR-001-FECHAMENTO-DE-CONTRATO-E-ENUMS.md` — enums, `MesReferencia` (`AAAA-MM`), promoção.
3. `docs/adrs/ADR-003-linguagem-ubiqua-do-dominio.md` — Linguagem Ubíqua oficial (⚠️ numeração a confirmar — ver §6).
4. `docs/adrs/ADR-002-frontend-foundation.md` — fundação de frontend (HTML Service).
5. `docs/PRD.md` — fonte exclusiva de requisitos.
6. `docs/_workspace/TASK_ROUTER.md` — roteador de dependências por SPEC.

---

## 3. SPECs congeladas

Todas seguem o padrão estrutural da SPEC-005 (22 seções), com pendências de
negócio marcadas 🟠 (decisão do PO) e **nenhuma regra inventada**.

| SPEC | Título | Deps | Estado |
|---|---|---|---|
| SPEC-001 | Cadastro de Influenciadoras | — | Congelada (⚠️ terminologia legada — §6) |
| SPEC-002 | Gestão de Parceiras | 001 | Congelada |
| SPEC-003 | Importação Inicial da Base | 001, 002 | Congelada (fora do WORKFLOW — §6) |
| SPEC-005 | Colaboração Mensal | 002 | Congelada |
| SPEC-009 | Briefing da Colaboração | 005 | Congelada |
| SPEC-012 | Gestão de Conteúdo e Ativações | 005 | Congelada |
| SPEC-016 | Gestão Logística (Envio) | 005 | Congelada |
| SPEC-020 | Gestão de Pagamentos | 002 | Congelada |
| SPEC-023 | Geração de Documentos | 002, 009 | Congelada |
| SPEC-025 | Acesso ao Portal | 001 | Congelada |
| SPEC-027 | Conteúdo no Portal | 009, 012, 025 | Congelada |
| SPEC-030 | Financeiro e Histórico no Portal | 012, 020, 025 | Congelada |
| SPEC-032 | Perfil no Portal | 001, 002, 025 | Congelada |
| SPEC-034 | Arquivamento Geral Manual | 012, 016, 020 | Congelada |

---

## 4. Invariantes de arquitetura (valem para toda implementação)

- **Camadas:** Entrypoint → Controller → Service → Repository → ACL. Só o
  Repository toca a persistência; só a ACL conhece nome físico de coluna.
- **Fail-fast:** valor de estado desconhecido → erro de validação (ADR-001 §2).
- **`MesReferencia` canônico = `AAAA-MM`** (ADR-001 §3).
- **Fronteiras de agregado:** o módulo Colaboração Mensal publica `MesCompilado`;
  Briefing/Conteúdo/Logística/Financeiro criam seus próprios agregados em reação.
- **Linguagem Ubíqua obrigatória:** `Colaboração Mensal`, `Compilador do Mês`,
  `MesReferencia`, `Snapshot Comercial`, `Entrega`, `Envio`, `Obrigação
  Financeira da Colaboração`. Termos banidos: `Ciclo`, `Plano de Colaboração`.
- **PII** (`PIX`, `CNPJ`, `Endereco`) nunca em log, evento ou Snapshot.
- **Stack fixa:** Google Apps Script + Sheets + Drive; deploy por `clasp`
  controlado por operador (agentes não publicam) — Q-01/Q-10 decididas.

---

## 5. Decisões do PO em aberto (não bloqueiam a Fase 1; gate por fase)

| Ref | Decisão | Fase/SPEC afetada |
|---|---|---|
| 🟠 P3 / Q-04 | Regra de elegibilidade de liberação de pagamento | SPEC-020 (Fase 4c) |
| 🟠 P4 / Q-05 | Inativação de Parceira com pendências abertas | SPEC-002/005 (Fase 2) |
| 🟠 P5 / Q-07 | Modelo de autenticação do Portal | SPEC-025 (Fase 6) |
| 🟠 P6 / Q-08 | Papéis/permissões na equipe | SPEC-025 (Fase 6) |
| 🟠 Q-03 | Rótulos crus persistidos de estados de conteúdo | SPEC-012 (Fase 4a) |
| 🟠 Q-09 | Política de retenção/expurgo (LGPD) | SPEC dedicada antes do Portal |
| 🟠 P8 / Q-06 | Confirmação de RN-05 (ano ausente em `MesReferencia`) | SPEC-005 (Fase 2) |

Todas registradas nas §21 das SPECs correspondentes. **Nenhuma foi inventada.**

---

## 6. Dívidas documentais registradas (não bloqueantes)

1. **Numeração de ADR:** a ADR de Linguagem Ubíqua colide com o `ADR-002-frontend-foundation`
   já existente; consolidada provisoriamente como `ADR-003`. Confirmar numeração oficial.
2. **SPEC-001** foi importada da "Entrega 01" e ainda usa vocabulário legado
   ("ciclo mensal"); requer migração terminológica conforme ADR de Linguagem
   Ubíqua §6 (não alterada neste freeze — documento previamente aprovado).
3. **SPEC-003 (Importação Inicial da Base)** não consta no `WORKFLOW.md`;
   incorporar à numeração oficial quando o PO confirmar.
4. **Documentos ainda fora do repo** (`WORKFLOW.md`, `DECISOES_BLOQUEANTES.md`,
   `03/04/06`): vivem apenas em `~/Downloads`; consolidar no repositório é ação
   separada.

---

## 7. Verificações executadas

- `grep`: **zero** ocorrências de `MM/AAAA` nas SPECs (MesReferencia = `AAAA-MM`).
- `grep`: **zero** uso de `Ciclo` como vocabulário de domínio nas SPECs autoradas
  (remanescentes apenas em SPEC-001 legada e em citações/termos banidos declarados).
- 14 SPECs presentes em `docs/specs/`, todas no padrão estrutural da SPEC-005.

---

## 8. Conclusão

A documentação de especificação da Fase 4 está **consistente, implementável e
alinhada** aos ADRs e à Linguagem Ubíqua. O projeto está **pronto para
implementação**, condicionado às decisões 🟠 do PO por fase (§5) e à autorização
explícita do Product Owner para iniciar a implementação.

**Nenhuma atividade de implementação foi iniciada.**
