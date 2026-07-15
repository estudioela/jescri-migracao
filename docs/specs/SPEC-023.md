# SPEC-023 · Geração de Documentos

**Status:** Refinada — pronta para Gate Arquitetural
**Módulo:** M7 · Contratos e Documentos
**Fase:** 4 · Especificação de Módulos
**Depende de:** SPEC-002 · Gestão de Parceiras, SPEC-009 · Briefing da Colaboração
**Fonte de verdade:** `CONTRATO_SOBERANO.md`

---

## 1. Objetivo

Especificar a geração automática de documentos por Parceira: o **Contrato**
individual (para Parceiras Ativas) e o **Briefing formal** (para Parceiras
sinalizadas), a partir dos dados cadastrais/comerciais e do briefing.

Não define tecnologia, persistência física, API HTTP ou UI.

---

## 2. Escopo

**Contempla**
- Geração de Contrato individual por Parceira Ativa.
- Geração de Briefing formal para Parceiras sinalizadas.
- Mesclagem de dados comerciais/cadastrais e de briefing.

**Não contempla**
- Assinatura (ocorre fora do sistema).
- Fluxo de aprovação de conteúdo (SPEC-012).

---

## 3. Referências

| Documento | Seções | Uso |
|---|---|---|
| `PRD.md` | §5.7, §6.7, §7 (RN-15), §9 (RF-024, RF-025) | Requisitos |
| `CONTRATO_SOBERANO.md` | §4, §6.1 | Linguagem, Condição Comercial |
| `ADR — Linguagem Ubíqua` | §4 | `Snapshot Comercial da Colaboração` |

---

## 4. Linguagem Ubíqua (obrigatória)

| Termo oficial | Definição sintética |
|---|---|
| **Contrato** | Documento formal individual com termos comerciais vigentes. |
| **Briefing formal** | Documento gerado do briefing para Parceiras sinalizadas. |
| **Snapshot Comercial** | Fotografia dos termos comerciais vigentes (SPEC-005). |

Termos banidos: `Ciclo` (Contrato §2).

---

## 5. Visão Geral

```
   Parceira Ativa ─(dados cadastrais/comerciais)─▶ [job] Contrato individual
   Sinalização "SIM" ─(briefing)────────────────▶ [job] Briefing formal
```

---

## 6. Modelo do Domínio

### 6.1 Value Objects
- **CamposDeMesclagem**: razão social, CNPJ, endereço, quantidades, valor
  (número e por extenso), escopo/prazo de uso, cidade/data de assinatura.

### 6.2 Entidades e Agregado
- **Documento (contrato ou briefing formal)** — gerado a partir de Parceira e Briefing.

### 6.3 Serviço de Domínio
- **Gerador de Documentos** (porta): mescla dados em template.

### 6.4 O que NÃO pertence
- Compilação, Conteúdo, Logística, Pagamento.

---

## 7. Capacidades cobertas

| Capacidade | Coberta por |
|---|---|
| Gerar contrato por Parceira Ativa | UC-023.01 |
| Gerar briefing formal sinalizado | UC-023.02 |

---

## 8. Casos de Uso

### UC-023.01 · Gerar Contrato
- **Ator:** Operador Estúdio Elã.
- Gera contrato individual **apenas** para Parceiras Ativas (`STATUS = ON`).

### UC-023.02 · Gerar Briefing formal
- **Ator:** Operador Estúdio Elã.
- Gera briefing formal **apenas** para Parceiras sinalizadas (`SIM`).

---

## 9. Máquina de Estados

```
NaoGerado ──(job)──▶ Gerado
```
- Regeneração substitui o documento anterior.

---

## 10. Regras de Negócio

| ID | Regra | Origem |
|---|---|---|
| RN-01 | Contrato é gerado individualmente, apenas para Parceiras Ativas (`ON`) | PRD §7 RN-15 |
| RN-02 | Briefing formal é gerado apenas para Parceiras sinalizadas (`SIM`) | PRD §7 RN-15 |
| RN-03 | Os dados comerciais refletem os termos vigentes (Snapshot quando aplicável) | Contrato §6.1; SPEC-005 |

---

## 11. Invariantes
- INV-01 Nenhum Contrato é gerado para Parceira Inativa.
- INV-02 Todo documento referencia uma Parceira existente.

---

## 12. Eventos de Domínio

| Evento | Payload lógico | Consumidores |
|---|---|---|
| (documento gerado) | `parceiraId`, `tipoDocumento` | Operação, Portal (leitura futura) |

Sem PII exposta em log (Contrato §5).

---

## 13. Papéis e Permissões

| Operação | Administrador | Operador | Parceira |
|---|---|---|---|
| Gerar contrato | ✅ | ✅ | ❌ |
| Gerar briefing formal | ✅ | ✅ | ❌ |

---

## 14. Contratos entre Módulos

### 14.1 Consome
| Fonte | Dado | Uso |
|---|---|---|
| SPEC-002 | Parceiras Ativas + Condição Comercial | Mesclagem de contrato |
| SPEC-009 | Dados de briefing | Mesclagem de briefing formal |

### 14.2 Fornece
| Consumidor | Dado | Meio |
|---|---|---|
| Operação/Parceira | Documento gerado | Referência |

---

## 15. Requisitos Não Funcionais
| ID | Requisito |
|---|---|
| RNF-01 | PII em documentos restrita ao destinatário; nunca em log. |
| RNF-02 | Independente do motor documental (porta). |

---

## 16. Casos de Borda
| ID | Cenário | Resultado |
|---|---|---|
| CB-01 | Parceira Inativa | Nenhum contrato gerado |
| CB-02 | Parceira sem sinalização `SIM` | Nenhum briefing formal |
| CB-03 | Regenerar documento | Substitui o anterior |

---

## 17. Tratamento de Erros
| Código | Situação |
|---|---|
| DC-01 | Parceira inexistente |
| DC-02 | Dados de mesclagem ausentes |
| DC-03 | Operação não autorizada |

---

## 18. Rastreabilidade
| Item | Origem |
|---|---|
| RN-01/RN-02 | PRD §7 RN-15 |
| RN-03 | Contrato §6.1; SPEC-005 |

---

## 19. Definition of Done
- Contrato só para Ativas; briefing formal só para sinalizadas.
- Motor documental isolado por porta.
- PII protegida.
- Gate Arquitetural aprovado.

---

## 20. Plano de Testes (essenciais)
| Cenário | Esperado |
|---|---|
| Parceira Ativa | Contrato gerado |
| Parceira Inativa | Nenhum contrato |
| Sinalização `SIM` | Briefing formal gerado |

---

## 21. Pendências de Design
| ID | Item | Origem |
|---|---|---|
| D-01 | Motor documental (template/geração) | ADR futuro |

---

## 22. Histórico
| Versão | Data | Alteração |
|---|---|---|
| 1.0 | 2026-07-14 | Especificação inicial de Geração de Documentos (padrão SPEC-005). |
