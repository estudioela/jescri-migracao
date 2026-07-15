# SPEC-012 · Gestão de Conteúdo e Ativações

**Status:** Refinada — pronta para Gate Arquitetural
**Módulo:** M4 · Conteúdo / Ativações
**Fase:** 4 · Especificação de Módulos
**Depende de:** SPEC-005 · Colaboração Mensal
**Fonte de verdade:** `CONTRATO_SOBERANO.md`

---

## 1. Objetivo

Especificar o rastreamento de cada **Entrega** de conteúdo contratada (uma por
Reel/Carrossel/Stories) do estado inicial até a publicação, incluindo o envio do
material pela Parceira e o arquivamento automático ao publicar.

Não define tecnologia, persistência física, API HTTP ou UI.

---

## 2. Escopo

**Contempla**
- Materialização das Entregas por unidade contratada (reação a `MesCompilado`).
- Máquina de estados da Entrega (§9).
- Envio de material (upload) pela Parceira.
- Aprovação e publicação pela equipe.
- Arquivamento automático ao publicar.

**Não contempla**
- Orientação criativa/prazos (SPEC-009).
- Envio físico do produto (SPEC-016).
- Exibição no Portal (SPEC-027).

---

## 3. Referências

| Documento | Seções | Uso |
|---|---|---|
| `PRD.md` | §5.4, §6.4, §7 (RN-06, RN-07, RN-08), §9 (RF-011..RF-015) | Requisitos |
| `ADR-001` | §2.2 (`ATIVAÇÕES.STATUS_CONTEUDO`) | Estados canônicos |
| `CONTRATO_SOBERANO.md` | §4, §6.3, §8 | Linguagem, agregado, eventos |
| `ADR — Linguagem Ubíqua` | §4 | `Entrega`, `Material Enviado` |

---

## 4. Linguagem Ubíqua (obrigatória)

| Termo oficial | Definição sintética |
|---|---|
| **Entrega** | Unidade de conteúdo contratada num formato, de uma Colaboração Mensal (era "Ativação"). |
| **Material Enviado** | Arquivo (imagem/vídeo) que a Parceira envia para uma Entrega. |
| **Estado da Entrega** | Enum canônico (§9). |

Termos banidos: `Ciclo` (Contrato §2).

---

## 5. Visão Geral

```
   MesCompilado (SPEC-005) ──▶ cria 1 Entrega por unidade contratada/formato
          │
          ▼
   AguardandoMaterial ──(upload)──▶ EmRevisao ──(equipe)──▶ Aprovado ──(publica)──▶ Publicado ──▶ arquiva
```

---

## 6. Modelo do Domínio

### 6.1 Value Objects
- **IdentificadorDeEntrega**: único e permanente (RNF — PRD §10).
- **LinkDoMaterial**: referência ao arquivo enviado.

### 6.2 Entidades e Agregado
- **Entrega (agregado raiz)** — pertence a uma Colaboração Mensal e a uma Parceira;
  formato; estado; material enviado; data de aprovação (espelhada de SPEC-009).

### 6.3 Serviço de Domínio
- **Coerção de estado (ACL)**: mapeia rótulo cru → Enum canônico (ADR-001 §2.2).

### 6.4 O que NÃO pertence
- Briefing (SPEC-009), Envio físico (SPEC-016), Pagamento (SPEC-020).

---

## 7. Capacidades cobertas

| Capacidade | Coberta por |
|---|---|
| Listar pendências por Parceira | UC-012.01 |
| Enviar material | UC-012.02 |
| Aprovar/publicar | UC-012.03 |
| Arquivar ao publicar | RN-08, §9 |

---

## 8. Casos de Uso

### UC-012.01 · Listar Entregas pendentes
- **Ator:** Parceira (Portal) / Operador.
- Lista as Entregas da competência corrente por Parceira, em ordem cronológica.

### UC-012.02 · Enviar material
- **Ator:** Parceira.
- **Fluxo:** seleciona Entrega → envia arquivo → estado passa a `EmRevisao`.
- **Pós-condição:** `ConteudoEnviado` publicado.

### UC-012.03 · Aprovar e publicar
- **Ator:** Operador Estúdio Elã.
- **Fluxo:** revisa → `Aprovado`; ao publicar → `Publicado` (arquiva automaticamente).
- **Pós-condição:** `ConteudoAprovado`; ao publicar, item movido ao histórico.

---

## 9. Máquina de Estados

Enum canônico (ADR-001 §2.2 + Q-03):

```
AguardandoMaterial ──(upload)──▶ EmRevisao ──▶ Aprovado ──▶ Publicado(terminal→arquiva)
```

- `Publicado` é terminal e dispara arquivamento (RN-08).
- 🟠 **Q-03:** rótulos crus persistidos de `EmRevisao` e `Publicado`
  ("ajustes"/"postado" no legado) — **a confirmar com a operação** antes da
  implementação; não inventados aqui.

---

## 10. Regras de Negócio

| ID | Regra | Origem |
|---|---|---|
| RN-01 | Cada unidade contratada de cada formato gera uma Entrega por competência | PRD §7 RN-06 |
| RN-02 | A máquina de estados da Entrega tem 4 estados (§9) | PRD §7 RN-07; ADR-001 §2.2 |
| RN-03 | Ao concluir o upload, a Entrega passa a `EmRevisao` | PRD §5.4 |
| RN-04 | Ao ser publicada, a Entrega é arquivada automaticamente, com data de arquivamento | PRD §7 RN-08 |
| RN-05 | Valor de estado desconhecido → erro de validação (fail-fast) | ADR-001 §2 |

---

## 11. Invariantes
- INV-01 Toda Entrega referencia uma Colaboração Mensal compilada.
- INV-02 Toda Entrega tem identificador único e permanente.
- INV-03 Estado sempre pertence ao Enum canônico (§9).
- INV-04 Entrega arquivada é somente leitura.

---

## 12. Eventos de Domínio

| Evento | Payload lógico | Consumidores |
|---|---|---|
| `ConteudoEnviado` | `entregaId`, `parceiraId`, `mesReferencia` | Operação, Portal |
| `ConteudoAprovado` | `entregaId` | Portal, Histórico |
| (publicação→arquivo) | `entregaId`, `dataArquivamento` | Arquivamento (SPEC-034) |

Nomes conforme catálogo (Contrato §8).

---

## 13. Papéis e Permissões

| Operação | Administrador | Operador | Parceira |
|---|---|---|---|
| Listar pendências | ✅ | ✅ | ✅ (as próprias) |
| Enviar material | ❌ | ❌ | ✅ |
| Aprovar/publicar | ✅ | ✅ | ❌ |

---

## 14. Contratos entre Módulos

### 14.1 Consome
| Fonte | Dado | Uso |
|---|---|---|
| SPEC-005 | `MesCompilado` | Materialização das Entregas |
| SPEC-009 | Data de aprovação por bloco | Espelhamento |

### 14.2 Fornece
| Consumidor | Dado | Meio |
|---|---|---|
| SPEC-027 | Entregas e estados da Parceira | Query |
| SPEC-034 | Entrega publicada | Evento/arquivamento |

---

## 15. Requisitos Não Funcionais
| ID | Requisito |
|---|---|
| RNF-01 | Identificador de Entrega único e estável (PRD §10). |
| RNF-02 | Independente da tecnologia de persistência e de armazenamento de arquivo. |
| RNF-03 | Data de arquivamento preservada (PRD §10). |

---

## 16. Casos de Borda
| ID | Cenário | Resultado |
|---|---|---|
| CB-01 | Upload repetido para a mesma Entrega | Substitui o material; mantém identidade |
| CB-02 | Rótulo de estado desconhecido na fonte | Erro de validação (fail-fast) |
| CB-03 | Publicar Entrega já publicada | Recusa (terminal) |

---

## 17. Tratamento de Erros
| Código | Situação |
|---|---|
| CT-01 | Entrega inexistente |
| CT-02 | Estado desconhecido/inválido |
| CT-03 | Transição de estado inválida |
| CT-04 | Operação não autorizada |

---

## 18. Rastreabilidade
| Item | Origem |
|---|---|
| RN-01 | PRD §7 RN-06 |
| RN-02/§9 | PRD §7 RN-07; ADR-001 §2.2 |
| RN-04 | PRD §7 RN-08 |
| Eventos | Contrato §8 |

---

## 19. Definition of Done
- 4 estados canônicos, coerção fail-fast na borda.
- Uma Entrega por unidade contratada.
- Arquivamento automático ao publicar.
- Identificador único e permanente.
- Gate Arquitetural aprovado.

---

## 20. Plano de Testes (essenciais)
| Cenário | Esperado |
|---|---|
| Compilar competência | N Entregas conforme unidades contratadas |
| Upload | Estado → `EmRevisao`, `ConteudoEnviado` publicado |
| Publicar | Arquivada com data de arquivamento |
| Estado cru desconhecido | Erro de validação |

---

## 21. Pendências de Design
| ID | Item | Origem |
|---|---|---|
| D-01 | Rótulos crus persistidos de `EmRevisao`/`Publicado` | 🟠 Q-03 (confirmar com operação) |
| D-02 | Estratégia física de armazenamento do material | ADR futuro |

---

## 22. Histórico
| Versão | Data | Alteração |
|---|---|---|
| 1.0 | 2026-07-14 | Especificação inicial de Conteúdo/Entregas (padrão SPEC-005). |
