# SPEC-027 · Conteúdo no Portal da Parceira

**Status:** Refinada — pronta para Gate Arquitetural
**Módulo:** M8 · Portal (Conteúdo)
**Fase:** 4 · Especificação de Módulos
**Depende de:** SPEC-009 · Briefing, SPEC-012 · Conteúdo/Entregas, SPEC-025 · Acesso
**Fonte de verdade:** `CONTRATO_SOBERANO.md`

---

## 1. Objetivo

Especificar a experiência da Parceira autenticada sobre suas **Entregas** de
conteúdo no Portal: ver pendências do mês, ler o briefing do item e enviar o
material.

Não define tecnologia, persistência física, API HTTP ou UI.

---

## 2. Escopo

**Contempla**
- Lista de pendências de conteúdo da competência corrente da Parceira.
- Leitura do Briefing por Entrega.
- Envio de material (upload) → estado `EmRevisao`.

**Não contempla**
- Aprovação/publicação (SPEC-012, equipe).
- Financeiro/histórico (SPEC-030), perfil (SPEC-032).

---

## 3. Referências

| Documento | Seções | Uso |
|---|---|---|
| `PRD.md` | §5.4, §6.8, §9 (RF-011, RF-012, RF-013) | Requisitos |
| `ADR — Linguagem Ubíqua` | §4 | `Entrega`, `Material Enviado` |

---

## 4. Linguagem Ubíqua (obrigatória)

| Termo oficial | Definição sintética |
|---|---|
| **Entrega** | Unidade de conteúdo da Parceira (SPEC-012). |
| **Material Enviado** | Arquivo enviado para uma Entrega. |

Termos banidos: `Ciclo` (Contrato §2).

---

## 5. Visão Geral

```
   Sessão (SPEC-025) ──▶ Parceira vê Entregas pendentes (SPEC-012)
        │ abre briefing do item (SPEC-009)
        ▼
   Envia material ──▶ Entrega → EmRevisao (SPEC-012 RN-03)
```

---

## 6. Modelo do Domínio

### 6.1 Value Objects
- **ItemDePendencia** (projeção de leitura da Entrega para o Portal).

### 6.2 Entidades e Agregado
- Sem agregado próprio; é **camada de leitura/escrita** sobre SPEC-012/009.

### 6.3 Serviço de Domínio
- **Fachada do Portal de Conteúdo**: consulta Entregas e delega o upload à SPEC-012.

### 6.4 O que NÃO pertence
- Máquina de estados da Entrega (é de SPEC-012).

---

## 7. Capacidades cobertas

| Capacidade | Coberta por |
|---|---|
| Ver pendências | UC-027.01 |
| Ler briefing do item | UC-027.02 |
| Enviar material | UC-027.03 |

---

## 8. Casos de Uso

### UC-027.01 · Ver pendências
- **Ator:** Parceira autenticada.
- Lista as Entregas da competência corrente, em ordem cronológica.

### UC-027.02 · Ler briefing
- **Ator:** Parceira autenticada.
- Abre o bloco de briefing correspondente à Entrega.

### UC-027.03 · Enviar material
- **Ator:** Parceira autenticada.
- Envia arquivo; delega à SPEC-012 (estado → `EmRevisao`).

---

## 9. Máquina de Estados

Sem máquina própria — reflete a da Entrega (SPEC-012 §9).

---

## 10. Regras de Negócio

| ID | Regra | Origem |
|---|---|---|
| RN-01 | A Parceira só vê as próprias Entregas | SPEC-025 (sessão); Q-09 |
| RN-02 | Ao concluir o upload, a Entrega passa a `EmRevisao` | PRD §5.4; SPEC-012 RN-03 |
| RN-03 | Cada Entrega exibe o briefing correspondente | PRD §6.3/§6.4 |

---

## 11. Invariantes
- INV-01 Acesso restrito à Parceira autenticada e às suas Entregas.
- INV-02 Upload não altera estados de outras Parceiras.

---

## 12. Eventos de Domínio

Reusa `ConteudoEnviado` (SPEC-012). Sem eventos próprios.

---

## 13. Papéis e Permissões

| Operação | Parceira | Equipe |
|---|---|---|
| Ver pendências próprias | ✅ | ✅ (todas) |
| Ler briefing próprio | ✅ | ✅ |
| Enviar material | ✅ | ❌ |

---

## 14. Contratos entre Módulos

### 14.1 Consome
| Fonte | Dado | Uso |
|---|---|---|
| SPEC-025 | Sessão (parceira corrente) | Escopo de acesso |
| SPEC-012 | Entregas e estados | Lista de pendências / upload |
| SPEC-009 | Briefing por bloco | Leitura do item |

### 14.2 Fornece
| Consumidor | Dado | Meio |
|---|---|---|
| SPEC-012 | Material enviado | Delegação de upload |

---

## 15. Requisitos Não Funcionais
| ID | Requisito |
|---|---|
| RNF-01 | Isolamento estrito de dados entre Parceiras (Q-09). |
| RNF-02 | Independente da tecnologia de armazenamento de arquivo. |

---

## 16. Casos de Borda
| ID | Cenário | Resultado |
|---|---|---|
| CB-01 | Sessão expirada durante upload | Reautenticar (SPEC-025) |
| CB-02 | Sem pendências no mês | Lista vazia |

---

## 17. Tratamento de Erros
| Código | Situação |
|---|---|
| PC-01 | Sessão inválida/expirada |
| PC-02 | Entrega não pertence à Parceira |
| PC-03 | Falha no upload |

---

## 18. Rastreabilidade
| Item | Origem |
|---|---|
| RN-02 | PRD §5.4; SPEC-012 |
| Isolamento | Q-09; SPEC-025 |

---

## 19. Definition of Done
- Parceira vê apenas as próprias Entregas.
- Upload delega à SPEC-012 (estado `EmRevisao`).
- Briefing exibido por item.
- Gate Arquitetural aprovado.

---

## 20. Plano de Testes (essenciais)
| Cenário | Esperado |
|---|---|
| Listar pendências | Só as da Parceira autenticada |
| Upload | Entrega → `EmRevisao` |
| Acesso a Entrega alheia | Recusado |

---

## 21. Pendências de Design
| ID | Item | Origem |
|---|---|---|
| D-01 | Isolamento de dados depende do modelo de auth | 🟠 P5 / Q-07 (SPEC-025) |

---

## 22. Histórico
| Versão | Data | Alteração |
|---|---|---|
| 1.0 | 2026-07-14 | Especificação inicial do Conteúdo no Portal (padrão SPEC-005). |
