# SPEC-030 · Financeiro e Histórico no Portal

**Status:** Refinada — pronta para Gate Arquitetural
**Módulo:** M8 · Portal (Financeiro/Histórico)
**Fase:** 4 · Especificação de Módulos
**Depende de:** SPEC-012 · Conteúdo, SPEC-020 · Pagamentos, SPEC-025 · Acesso
**Fonte de verdade:** `CONTRATO_SOBERANO.md`

---

## 1. Objetivo

Especificar a visão da Parceira autenticada sobre seu **financeiro** (previsto x
pago) e seu **histórico** (conteúdo e pagamentos) por período, no Portal.

Não define tecnologia, persistência física, API HTTP ou UI.

---

## 2. Escopo

**Contempla**
- Total previsto e total pago no período selecionado.
- Histórico de conteúdo e pagamentos por período.
- Seleção do período (competências em que a Parceira teve atividade).

**Não contempla**
- Lançamento/liberação de pagamento (SPEC-020, equipe).
- Perfil (SPEC-032).

---

## 3. Referências

| Documento | Seções | Uso |
|---|---|---|
| `PRD.md` | §6.6, §6.8, §6.9, §7 (RN-10), §9 (RF-023, RF-028, RF-030) | Requisitos |
| `CONTRATO_SOBERANO.md` | §5, §6.4 | PII, histórico imutável |

---

## 4. Linguagem Ubíqua (obrigatória)

| Termo oficial | Definição sintética |
|---|---|
| **Obrigação Financeira** | Valor devido (SPEC-020). |
| **Histórico** | Registro arquivado de Entregas/Pagamentos (Contrato §6.4). |
| **MesReferencia** | Período de consulta (`AAAA-MM`, ADR-001). |

Termos banidos: `Ciclo` (Contrato §2). PII (`PIX`) nunca em log (Contrato §5).

---

## 5. Visão Geral

```
   Sessão (SPEC-025) ──▶ Parceira seleciona período (MesReferencia)
        ▼
   Financeiro: total previsto x total pago (SPEC-020)
   Histórico: conteúdo (SPEC-012) + pagamentos (SPEC-020) arquivados
```

---

## 6. Modelo do Domínio

### 6.1 Value Objects
- **ResumoFinanceiro** (previsto, pago) por período.
- **ItemDeHistorico** (projeção de leitura).

### 6.2 Entidades e Agregado
- Sem agregado próprio; camada de **leitura** sobre SPEC-012/020.

### 6.3 Serviço de Domínio
- **Fachada Financeiro/Histórico do Portal**: agrega por período.

### 6.4 O que NÃO pertence
- Máquinas de estado de pagamento/entrega.

---

## 7. Capacidades cobertas

| Capacidade | Coberta por |
|---|---|
| Ver previsto x pago | UC-030.01 |
| Consultar histórico por período | UC-030.02 |
| Selecionar período | UC-030.03 |

---

## 8. Casos de Uso

### UC-030.01 · Ver financeiro do período
- **Ator:** Parceira autenticada.
- Exibe total previsto e total pago no período selecionado.

### UC-030.02 · Consultar histórico
- **Ator:** Parceira autenticada.
- Lista conteúdo e pagamentos arquivados do período.

### UC-030.03 · Selecionar período
- **Ator:** Parceira autenticada.
- Escolhe entre as competências em que teve atividade.

---

## 9. Máquina de Estados

Sem máquina própria — leitura de estados de SPEC-012/020.

---

## 10. Regras de Negócio

| ID | Regra | Origem |
|---|---|---|
| RN-01 | Estado financeiro exibido: pendente → aprovado → pago | PRD §7 RN-10 |
| RN-02 | Total previsto x pago é apresentado por período | PRD §9 RF-023 |
| RN-03 | Histórico é consultável por período | PRD §9 RF-028 |
| RN-04 | Período selecionável = competências com atividade da Parceira | PRD §9 RF-030 |
| RN-05 | A Parceira só vê os próprios dados | SPEC-025; Q-09 |

---

## 11. Invariantes
- INV-01 Acesso restrito à Parceira autenticada e aos seus dados.
- INV-02 Histórico é somente leitura (Contrato §6.4).
- INV-03 PII financeira nunca em log.

---

## 12. Eventos de Domínio

Somente leitura — sem eventos próprios.

---

## 13. Papéis e Permissões

| Operação | Parceira | Equipe |
|---|---|---|
| Ver financeiro próprio | ✅ | ✅ (todas) |
| Consultar histórico próprio | ✅ | ✅ |

---

## 14. Contratos entre Módulos

### 14.1 Consome
| Fonte | Dado | Uso |
|---|---|---|
| SPEC-025 | Sessão | Escopo de acesso |
| SPEC-020 | Obrigações (previsto/pago) | Resumo financeiro |
| SPEC-012 | Entregas arquivadas | Histórico de conteúdo |

### 14.2 Fornece
| Consumidor | Dado | Meio |
|---|---|---|
| Parceira | Resumo e histórico | Query (leitura) |

---

## 15. Requisitos Não Funcionais
| ID | Requisito |
|---|---|
| RNF-01 | Isolamento estrito entre Parceiras (Q-09). |
| RNF-02 | PII fora de logs. |
| RNF-03 | Consistência por período (`MesReferencia`). |

---

## 16. Casos de Borda
| ID | Cenário | Resultado |
|---|---|---|
| CB-01 | Período sem atividade | Não aparece na seleção |
| CB-02 | Pagamento ainda `EmAberto` | Contabilizado em previsto, não em pago |

---

## 17. Tratamento de Erros
| Código | Situação |
|---|---|
| PF-01 | Sessão inválida |
| PF-02 | Período inexistente para a Parceira |

---

## 18. Rastreabilidade
| Item | Origem |
|---|---|
| RN-01 | PRD §7 RN-10 |
| RN-02/03/04 | PRD §9 RF-023/028/030 |
| Isolamento | Q-09; SPEC-025 |

---

## 19. Definition of Done
- Previsto x pago por período.
- Histórico por período, somente leitura.
- Seleção limitada a períodos com atividade.
- Isolamento por Parceira.
- Gate Arquitetural aprovado.

---

## 20. Plano de Testes (essenciais)
| Cenário | Esperado |
|---|---|
| Selecionar período com atividade | Financeiro e histórico exibidos |
| Pagamento `EmAberto` | Em previsto, não em pago |
| Acesso a dados alheios | Recusado |

---

## 21. Pendências de Design
| ID | Item | Origem |
|---|---|---|
| D-01 | Isolamento depende do modelo de auth | 🟠 P5 / Q-07 (SPEC-025) |

---

## 22. Histórico
| Versão | Data | Alteração |
|---|---|---|
| 1.0 | 2026-07-14 | Especificação inicial do Financeiro/Histórico no Portal (padrão SPEC-005). |
