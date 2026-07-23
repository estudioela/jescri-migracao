# SPEC-003 · Importação Inicial da Base

**Status:** Implementada
**Módulo:** Entregável adjacente (decisão do PO Q-10) — **antes da Fase 2**
**Fase:** 4 · Especificação de Módulos
**Depende de:** SPEC-001 · Cadastro, SPEC-002 · Gestão de Parceiras
**Fonte de verdade:** `CONTRATO_SOBERANO.md`

> **Nota de roadmap:** entregável decidido pelo PO (Q-10, opção B). A
> numeração `SPEC-003` já está em uso no repositório (`docs/planejamento/
> IMPLEMENTATION_ROADMAP_V2.md` linha 127, `S1b`) — o `WORKFLOW.md` externo
> citado na origem deste documento não existe mais (dívida documental,
> `TASK_ROUTER.md` §1); a numeração fica confirmada por este roteador
> (D-01 resolvido administrativamente, PO 2026-07-17).

---

## 1. Objetivo

Especificar a **importação curada** das Parceiras reais da base legada para a
planilha nova do TEAR V2, executada antes da compilação do mês (Fase 2), sem
escrever na base legada.

Não define tecnologia, persistência física, API HTTP ou UI.

---

## 2. Escopo

**Contempla**
- Leitura (somente leitura) da base legada.
- Curadoria e importação dos dados cadastrais/comerciais válidos das Parceiras.
- Normalização de inconsistências conhecidas (casing, ano, grafia de chave) via ACL.

**Não contempla**
- Importação de competências/históricos operacionais.
- Escrita na planilha legada (proibida — risco de perda de dados).

---

## 3. Referências

| Documento | Seções | Uso |
|---|---|---|
| `DECISOES_BLOQUEANTES.md` | Q-10 (opção B), Q-09 (PII mínima) | Decisão e postura |
| `PRD.md` | §8 (entidade Influenciadora) | Campos confirmados |
| `PLANILHA_TEAR_2.0_MAPA.md` | mapa de colunas | Origem física dos dados |
| `ADR-001` | §2, §3, §4 | Normalização (enums, MesReferencia, promoção) |

---

## 4. Linguagem Ubíqua (obrigatória)

| Termo oficial | Definição sintética |
|---|---|
| **Parceira** | Registro importado e curado (agregado raiz). |
| **Importação Curada** | Trazer apenas dados válidos, normalizados pela ACL. |

Termos banidos: `Ciclo` (Contrato §2). PII manipulada em volume — nunca em log (Q-09).

---

## 5. Visão Geral

```
   Base legada (somente leitura) ──▶ [Importador] curadoria + normalização (ACL)
        ▼
   Parceiras na planilha nova (status conforme origem; sem histórico operacional)
```

---

## 6. Modelo do Domínio

### 6.1 Value Objects
- **ChaveInfluenciadora** (grafia canônica única `INFLU_KEY`, D-02c).
  Algoritmo de normalização (extraído da implementação de referência do
  Portal legado antes de sua remoção, 2026-07-23): a partir do valor bruto
  lido de `INFLU_KEY`, aplica `trim()` + colapso de espaços internos
  múltiplos em um único espaço (`replace(/\s+/g, ' ')`); valor vazio após
  normalização é erro (`IM-02`, chave ausente/ambígua). A comparação de
  identidade para deduplicação (`normalizada()`) é **case-insensitive**
  (`toLowerCase()` sobre o valor já trimado/colapsado) — resolve
  divergência de grafia (ex.: `'maria'`, `'MARIA'`, `'Maria '` → mesma
  Parceira). O valor **persistido** preserva a grafia original
  trimada/colapsada (não lowercased) da primeira ocorrência encontrada —
  a normalização case-insensitive vale só para comparação, nunca para
  persistência.

### 6.2 Entidades e Agregado
- **Parceira** — importada com dados cadastrais/comerciais/endereço.

### 6.3 Serviço de Domínio
- **Importador** (porta): lê legado, normaliza via ACL, grava na base nova.

### 6.4 O que NÃO pertence
- Colaboração Mensal e módulos operacionais.

---

## 7. Capacidades cobertas

| Capacidade | Coberta por |
|---|---|
| Importar Parceiras reais | UC-003.01 |
| Normalizar inconsistências | RN-02 |

---

## 8. Casos de Uso

### UC-003.01 · Importar base
- **Ator:** Administrador.
- **Fluxo:** lê base legada (só leitura) → cura dados válidos → normaliza (ACL) → grava na base nova.
- **Pós-condição:** Parceiras reais disponíveis para a Fase 2.

---

## 9. Máquina de Estados

```
NaoImportado ──(importação)──▶ Importado
```
- Reexecução é idempotente por `ChaveInfluenciadora`.

---

## 10. Regras de Negócio

| ID | Regra | Origem |
|---|---|---|
| RN-01 | A base legada é somente leitura; nunca se escreve nela | Q-10; Contrato §2 |
| RN-02 | Inconsistências conhecidas são normalizadas na ACL (casing, ano inteiro, chave única) | ADR-001 §2/§3; D-02c |
| RN-03 | Importa-se apenas dados cadastrais/comerciais válidos, não histórico operacional | Q-10 (opção B) |
| RN-04 | PII manipulada em volume — nunca em log; acesso restrito ao Admin | Q-09 |
| RN-05 | Registro válido = possui `INFLU_KEY` **e** nome da influenciadora; demais campos vazios não descartam o registro (importados como vazios, completáveis depois) | Q-10 opção A (D-02, PO 2026-07-17) |

---

## 11. Invariantes
- INV-01 Nenhuma escrita na base legada.
- INV-02 Toda Parceira importada tem chave canônica única.
- INV-03 PII nunca em log durante a importação.

---

## 12. Eventos de Domínio

| Evento | Payload lógico | Consumidores |
|---|---|---|
| (importação concluída) | totalImportado (sem PII) | Operação |

---

## 13. Papéis e Permissões

| Operação | Administrador | Operador | Parceira |
|---|---|---|---|
| Executar importação | ✅ | ❌ | ❌ |

---

## 14. Contratos entre Módulos

### 14.1 Consome
| Fonte | Dado | Uso |
|---|---|---|
| Base legada (leitura) | Dados cadastrais/comerciais | Curadoria |

### 14.2 Fornece
| Consumidor | Dado | Meio |
|---|---|---|
| SPEC-005 | Parceiras reais ativas | Query (Fase 2) |

---

## 15. Requisitos Não Funcionais
| ID | Requisito |
|---|---|
| RNF-01 | Base legada intocada (somente leitura). |
| RNF-02 | PII fora de logs (Q-09). |
| RNF-03 | Importação idempotente e auditável (sem PII). |

---

## 16. Casos de Borda
| ID | Cenário | Resultado |
|---|---|---|
| CB-01 | Registro legado inconsistente/inválido | Descartado da curadoria (não importado) — ver critério em §10/§21 D-02 |
| CB-02 | Reexecução | Idempotente por chave |
| CB-03 | Chave grafada de formas divergentes | Normalizada para `INFLU_KEY` |

---

## 17. Tratamento de Erros
| Código | Situação |
|---|---|
| IM-01 | Registro inválido |
| IM-02 | Chave ausente/ambígua |
| IM-03 | Operação não autorizada |

---

## 18. Rastreabilidade
| Item | Origem |
|---|---|
| RN-01/RN-03 | Q-10 (opção B) |
| RN-02 | ADR-001 §2/§3; D-02c |
| RN-04 | Q-09 |

---

## 19. Definition of Done
- Importação curada, base legada somente leitura.
- Normalização via ACL (chave única, casing, ano inteiro).
- PII protegida; idempotência por chave.
- Gate Arquitetural aprovado.

---

## 20. Plano de Testes (essenciais)
| Cenário | Esperado |
|---|---|
| Importar base | Parceiras válidas na base nova |
| Reexecutar | Sem duplicação (idempotente) |
| Registro inconsistente | Não importado |

---

## 21. Pendências de Design
| ID | Item | Origem |
|---|---|---|
| D-01 | Numeração oficial no `WORKFLOW.md` | ✅ resolvido (PO 2026-07-17) — `WORKFLOW.md` externo não existe mais; numeração confirmada pelo `TASK_ROUTER.md` |
| D-02 | Critérios de curadoria (quais registros são "válidos") | ✅ resolvido (PO 2026-07-17, baseado na opção A): válido = possui `INFLU_KEY` **e** nome da influenciadora; demais campos podem estar vazios e são importados assim mesmo (completáveis depois no Portal, SPEC-032). Objetivo explícito do PO: preservar o máximo da base histórica, não descartar registros incompletos. |

---

## 22. Histórico
| Versão | Data | Alteração |
|---|---|---|
| 1.0 | 2026-07-14 | Especificação inicial da Importação Inicial da Base (padrão SPEC-005). |
| 1.1 | 2026-07-17 | D-01/D-02 resolvidos pelo PO; implementada (`ChaveInfluenciadora`, `LegadoACL`, `ImportadorService`, `ImportacaoController`, `Portal.importarBaseLegada`). |
