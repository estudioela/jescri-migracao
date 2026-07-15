# SPEC-009 · Briefing da Colaboração

**Status:** Refinada — pronta para Gate Arquitetural
**Módulo:** M3 · Briefing
**Fase:** 4 · Especificação de Módulos
**Depende de:** SPEC-005 · Colaboração Mensal
**Fonte de verdade:** `CONTRATO_SOBERANO.md`

---

## 1. Objetivo

Especificar o módulo que comunica, por Parceira e por formato, **o que produzir**
em uma Colaboração Mensal: peça/look, data de entrega, data de postagem e
orientação criativa — calculando automaticamente a data de aprovação interna.

Não define tecnologia, persistência física, API HTTP ou UI.

---

## 2. Escopo

**Contempla**
- Registro do Briefing da Colaboração por formato (Reel, Carrossel, Stories 1, Stories 2).
- Cálculo automático da data de aprovação interna (RN-04).
- Importação opcional de "looks" de planilha externa por Parceira.
- Publicação do evento `BriefingPublicado`.

**Não contempla**
- Estado de produção do conteúdo (SPEC-012).
- Envio físico do produto (SPEC-016).
- Leitura do briefing no Portal (SPEC-027).

---

## 3. Referências

| Documento | Seções | Uso |
|---|---|---|
| `PRD.md` | §5.3, §6.3, §7 (RN-04, RN-06), §9 (RF-008, RF-009, RF-010) | Requisitos |
| `ADR-001` | §2 (regra de cálculo da data de aprovação) | RN-04 |
| `CONTRATO_SOBERANO.md` | §4, §6.3, §8 | Linguagem, agregado, evento `BriefingPublicado` |
| `ADR — Linguagem Ubíqua` | §4 | `Briefing da Colaboração`, `Entrega` |

---

## 4. Linguagem Ubíqua (obrigatória)

| Termo oficial | Definição sintética |
|---|---|
| **Briefing da Colaboração** | Conjunto de orientações e prazos, por formato, de uma Colaboração Mensal. |
| **Bloco de formato** | Unidade do briefing para um formato (Reel/Carrossel/Stories). |
| **Data de aprovação interna** | Data-limite de revisão, derivada da data de postagem (RN-04). |

Termos banidos: `Ciclo`, `Combinado do Ciclo` (Contrato §2).

---

## 5. Visão Geral

```
   MesCompilado (SPEC-005) ──▶ Briefing recriado por Parceira/competência
          │ equipe preenche por formato
          ▼
   Bloco[Reel|Carrossel|Stories1|Stories2] = { look, dataEntrega, dataPostagem, orientacao }
          │ deriva
          ▼
   dataAprovacaoInterna = f(dataPostagem)   (RN-04)
          │
          ▼
   Publica BriefingPublicado
```

O Briefing é **recriado a cada compilação** (reage a `MesCompilado`).

---

## 6. Modelo do Domínio

### 6.1 Value Objects
- **DataAprovacaoInterna**: derivada; nunca informada manualmente.
- **OrientacaoCriativa**: texto livre por bloco.

### 6.2 Entidades e Agregado
- **Briefing da Colaboração (agregado raiz)** — identidade `(parceiraId, mesReferencia)`;
  contém até 4 blocos de formato (um por formato contratado).

### 6.3 Serviço de Domínio
- **Calculadora de Aprovação**: aplica RN-04 sobre `dataPostagem`.

### 6.4 O que NÃO pertence
- Estado da Entrega (SPEC-012), Envio (SPEC-016), Pagamento (SPEC-020).

---

## 7. Capacidades cobertas

| Capacidade | Coberta por |
|---|---|
| Descrever entrega por formato | UC-009.01 |
| Calcular prazo de aprovação | RN-04, UC-009.01 |
| Importar looks externos | UC-009.02 |

---

## 8. Casos de Uso

### UC-009.01 · Preencher Briefing
- **Ator:** Operador Estúdio Elã.
- **Pré-condições:** existe Colaboração Mensal compilada para a competência.
- **Fluxo:** para cada bloco de formato, informa look, data de entrega, data de
  postagem e orientação → sistema calcula a data de aprovação interna (RN-04).
- **Pós-condição:** `BriefingPublicado` publicado.

### UC-009.02 · Importar Looks
- **Ator:** Operador Estúdio Elã.
- Importa os looks definidos em planilha externa por Parceira para dentro do briefing.

---

## 9. Máquina de Estados

```
Rascunho ──(preenchido e publicado)──▶ Publicado
```
- A cada nova compilação, o rascunho anterior é limpo (PRD §5.2).

---

## 10. Regras de Negócio

| ID | Regra | Origem |
|---|---|---|
| RN-01 | A data de aprovação interna é 7 dias antes da postagem; se cair em sexta → +3 (segunda), sábado → +2, domingo → +1 | PRD §7 RN-04; ADR-001 §2 |
| RN-02 | Há um bloco de briefing por formato contratado (Reel, Carrossel, Stories 1, Stories 2) | PRD §7 RN-06 |
| RN-03 | O briefing é recriado a cada compilação da competência | PRD §5.2 |
| RN-04 | A data de aprovação é espelhada com a Entrega correspondente (SPEC-012) | PRD §6.3 |

---

## 11. Invariantes
- INV-01 Todo Briefing pertence a exatamente uma Colaboração Mensal.
- INV-02 Todo bloco corresponde a um formato contratado da Parceira.
- INV-03 A data de aprovação interna é sempre derivada, nunca arbitrária.

---

## 12. Eventos de Domínio

| Evento | Payload lógico | Consumidores |
|---|---|---|
| `BriefingPublicado` | `parceiraId`, `mesReferencia`, `blocos[]` | Ativação (SPEC-012), Portal (SPEC-027), Contratos (SPEC-023) |

Nome conforme catálogo (Contrato §8).

---

## 13. Papéis e Permissões

| Operação | Administrador | Operador | Parceira |
|---|---|---|---|
| Preencher briefing | ✅ | ✅ | ❌ |
| Importar looks | ✅ | ✅ | ❌ |
| Ler briefing | ✅ | ✅ | ✅ (o próprio, no Portal) |

---

## 14. Contratos entre Módulos

### 14.1 Consome
| Fonte | Dado | Uso |
|---|---|---|
| SPEC-005 | `MesCompilado` | Gatilho de recriação do briefing |

### 14.2 Fornece
| Consumidor | Dado | Meio |
|---|---|---|
| SPEC-012 | Data de aprovação por Entrega | Espelhamento |
| SPEC-027 | Briefing por bloco | Query |
| SPEC-023 | Dados de briefing | Query (briefing formal) |

---

## 15. Requisitos Não Funcionais
| ID | Requisito |
|---|---|
| RNF-01 | Cálculo de data determinístico e testável. |
| RNF-02 | Independente da tecnologia de persistência. |

---

## 16. Casos de Borda
| ID | Cenário | Resultado |
|---|---|---|
| CB-01 | Data de postagem em fim de semana | Aprovação ajustada por RN-01 |
| CB-02 | Nova compilação com briefing anterior preenchido | Rascunho anterior limpo antes de novo preenchimento |
| CB-03 | Parceira sem formato contratado | Nenhum bloco criado |

---

## 17. Tratamento de Erros
| Código | Situação |
|---|---|
| BR-01 | Colaboração Mensal inexistente para a competência |
| BR-02 | Data de postagem inválida |
| BR-03 | Operação não autorizada |

---

## 18. Rastreabilidade
| Item | Origem |
|---|---|
| RN-01 (aprovação) | PRD §7 RN-04; ADR-001 §2 |
| RN-02 (blocos) | PRD §7 RN-06 |
| Evento | Contrato §8 |

---

## 19. Definition of Done
- Cálculo de aprovação conforme RN-04 (testado nos 4 casos de borda de dia).
- Um bloco por formato contratado.
- Recriação por compilação.
- `BriefingPublicado` publicado.
- Gate Arquitetural aprovado.

---

## 20. Plano de Testes (essenciais)
| Cenário | Esperado |
|---|---|
| Postagem em dia útil | Aprovação = postagem − 7 |
| Postagem que cai em sexta/sábado/domingo | Ajuste +3/+2/+1 |
| Recompilar competência | Briefing anterior limpo |

---

## 21. Pendências de Design
| ID | Item | Origem |
|---|---|---|
| D-01 | Persistência física do briefing (sem carimbo de mês em `BRIEFING`) | Contrato §7.2; ADR futuro |

---

## 22. Histórico
| Versão | Data | Alteração |
|---|---|---|
| 1.0 | 2026-07-14 | Especificação inicial do Briefing (padrão SPEC-005). |
