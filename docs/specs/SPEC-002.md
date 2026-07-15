# SPEC-002 · Gestão de Parceiras

**Status:** Refinada — pronta para Gate Arquitetural
**Módulo:** M1 · Cadastro e Gestão (consolida a operação administrativa sobre a Parceira)
**Fase:** 4 · Especificação de Módulos
**Depende de:** SPEC-001 · Cadastro de Influenciadoras
**Fonte de verdade:** `CONTRATO_SOBERANO.md`

---

## 1. Objetivo

Especificar a **gestão administrativa** da Parceira após o cadastro: ativação/
inativação, edição das Condições Comerciais e consulta da base. Estabelece o
estado `Ativa`/`Inativa` que habilita (ou não) a Parceira ao Compilador do Mês.

Esta SPEC define comportamento; não define tecnologia, persistência física, API
HTTP ou UI.

---

## 2. Escopo

**Contempla**
- Alteração manual de vínculo `Ativa`/`Inativa` pela equipe.
- Edição das Condições Comerciais (valor, entregáveis, prazo/canais de uso).
- Consulta da base (ativas e inativas) para localizar e manter uma Parceira.

**Não contempla**
- Cadastro inicial por formulário externo (SPEC-001).
- Compilação do mês / Colaboração Mensal (SPEC-005).
- Regra de integridade ao inativar com pendências abertas (🟠 Q-05 — Fase 2).

---

## 3. Referências

| Documento | Seções | Uso |
|---|---|---|
| `PRD.md` | §6.1, §7 (RN-01..RN-03), §9 (RF-002, RF-004, RF-005) | Requisitos |
| `ADR-001` | §4 (promoção Cadastro→Parceira) | Campos curados pelo admin |
| `CONTRATO_SOBERANO.md` | §4, §5, §6.1 | Linguagem, VO CondicaoComercial, agregado Parceira |

---

## 4. Linguagem Ubíqua (obrigatória)

| Termo oficial | Definição sintética |
|---|---|
| **Parceira** | Agregado raiz; fonte da Condição Comercial e da identidade da colaboração. |
| **CondicaoComercial** | Value Object: `valor`, `entregaveis`, prazo/canais de uso de imagem. |
| **Ativação** (do vínculo) | Transição administrativa `Inativa → Ativa`. |

Termos banidos: `Ciclo`, `Plano de Colaboração` (Contrato §2).

---

## 5. Visão Geral

```
   Operador Estúdio Elã
          │ consultar / editar / alterar status
          ▼
   ┌────────────────────┐
   │  Parceira (raiz)    │  status Ativa/Inativa · CondicaoComercial
   └────────────────────┘
          │ status = Ativa habilita
          ▼
   Compilador do Mês (SPEC-005) só considera Parceiras Ativas
```

---

## 6. Modelo do Domínio

### 6.1 Value Objects
- **CondicaoComercial**: `valorMensal`, `entregaveis` (Reels/Carrossel/Stories/
  looks), prazo e canais de uso de imagem. PII (`PIX`, `CNPJ`, `Endereco`)
  pertence à Parceira, nunca a este VO em logs (Contrato §5).

### 6.2 Entidades e Agregado
- **Parceira (agregado raiz)** — identidade `ChaveInfluenciadora` (`INFLU_KEY`);
  estado do vínculo (§9); CondicaoComercial vigente.

### 6.3 Serviço de Domínio
- Nenhum serviço próprio; operações são comandos sobre o agregado Parceira.

### 6.4 O que NÃO pertence
- Colaboração Mensal, Briefing, Ativação de conteúdo, Envio, Pagamento.

---

## 7. Capacidades cobertas (rastreabilidade)

| Capacidade | Coberta por |
|---|---|
| Ativar/inativar Parceira | UC-002.01 |
| Editar Condição Comercial | UC-002.02 |
| Consultar base | UC-002.03 |

---

## 8. Casos de Uso

### UC-002.01 · Alterar vínculo
- **Ator:** Operador Estúdio Elã.
- **Fluxo:** operador seleciona Parceira → define `Ativa` ou `Inativa`.
- **Pós-condição:** status persistido; inativar **não** exclui o registro.

### UC-002.02 · Editar Condição Comercial
- **Ator:** Operador Estúdio Elã.
- **Fluxo:** edita valor, entregáveis, prazo e canais de uso.

### UC-002.03 · Consultar base
- **Ator:** Operador Estúdio Elã.
- Consulta Parceiras `Ativa`/`Inativa` para localizar e manter.

---

## 9. Máquina de Estados

```
Inativa ──(ativação manual)──▶ Ativa
Ativa   ──(inativação manual)──▶ Inativa
```
- Nasce `Inativa` (SPEC-001, RN-01). Sem estado terminal (reversível).

---

## 10. Regras de Negócio

| ID | Regra | Origem |
|---|---|---|
| RN-01 | Toda Parceira nasce `Inativa` (`OFF`); ativação é decisão manual | PRD §7 RN-01 |
| RN-02 | Endereço resolvido por CEP no cadastro e em edições posteriores | PRD §7 RN-02 |
| RN-03 | Apenas Parceira `Ativa` (`ON`) entra em compilação e contrato | PRD §7 RN-03 |
| RN-11 | Inativar preserva o registro cadastral/contratual (sem exclusão) | PRD §7; SPEC-001 §10 |

---

## 11. Invariantes
- INV-01 Parceira tem sempre um e apenas um estado de vínculo.
- INV-02 Inativação nunca apaga dados cadastrais ou comerciais.
- INV-03 Só Parceira `Ativa` é elegível ao Compilador do Mês.

---

## 12. Eventos de Domínio

| Evento | Payload lógico | Consumidores |
|---|---|---|
| `ParceiraPromovida` | `parceiraId` | Colaboração Mensal, Contratos |
| (inativação) | `parceiraId`, `estado` | Colaboração Mensal (elegibilidade) |

Nomes conforme catálogo (Contrato §8).

---

## 13. Papéis e Permissões

| Operação | Administrador | Operador | Parceira |
|---|---|---|---|
| Alterar vínculo | ✅ | ✅ | ❌ |
| Editar Condição Comercial | ✅ | ✅ | ❌ |
| Consultar base | ✅ | ✅ | ❌ |

Origem: PRD §2.

---

## 14. Contratos entre Módulos

### 14.1 Consome
| Fonte | Dado | Uso |
|---|---|---|
| SPEC-001 | Parceira recém-cadastrada (`Inativa`) | Ponto de partida da gestão |

### 14.2 Fornece
| Consumidor | Dado | Meio |
|---|---|---|
| SPEC-005 | Parceiras Ativas + CondicaoComercial vigente | Query |
| SPEC-023 | Parceiras Ativas | Query |

---

## 15. Requisitos Não Funcionais
| ID | Requisito |
|---|---|
| RNF-01 | Independente da tecnologia de persistência (via ACL). |
| RNF-02 | PII nunca em log (Contrato §5). |
| RNF-03 | Edição de status é auditável. |

---

## 16. Casos de Borda
| ID | Cenário | Resultado |
|---|---|---|
| CB-01 | Inativar Parceira com pendências abertas | 🟠 Q-05 — comportamento definido na Fase 2; aqui apenas preserva o registro |
| CB-02 | Editar Condição Comercial de Parceira já compilada | Não retroage a competências passadas (SPEC-005 RN-06) |

---

## 17. Tratamento de Erros
| Código | Situação |
|---|---|
| GP-01 | Parceira inexistente |
| GP-02 | Transição de estado inválida |
| GP-03 | Operação não autorizada |

---

## 18. Rastreabilidade
| Item | Origem |
|---|---|
| RN-01..RN-03, RN-11 | PRD §7 |
| Promoção/campos curados | ADR-001 §4 |
| Linguagem | Contrato §2, §4 |

---

## 19. Definition of Done
- Linguagem alinhada ao Contrato §2/§4.
- RN-01..RN-03 e RN-11 preservadas e rastreadas.
- Só Parceira `Ativa` elegível ao Compilador do Mês.
- PII fora de logs.
- Gate Arquitetural aprovado.

---

## 20. Plano de Testes (essenciais)
| Cenário | Esperado |
|---|---|
| Alterar `Inativa`↔`Ativa` | Estado persiste; registro intacto |
| Editar Condição Comercial | Persistida; não retroage a competências compiladas |
| Consultar base ativa/inativa | Ambas listadas |

---

## 21. Pendências de Design
| ID | Item | Origem |
|---|---|---|
| D-01 | Inativação com pendências abertas | 🟠 Q-05 / PRD §7 (Fase 2) |
| D-02 | Enumeração fechada dos estados de Parceira | Contrato §9 |

---

## 22. Histórico
| Versão | Data | Alteração |
|---|---|---|
| 1.0 | 2026-07-14 | Especificação inicial da gestão de Parceiras (padrão SPEC-005). |
