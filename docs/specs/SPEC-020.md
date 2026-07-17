# SPEC-020 · Gestão de Pagamentos

**Status:** Refinada — pronta para Gate Arquitetural
**Módulo:** M6 · Financeiro
**Fase:** 4 · Especificação de Módulos
**Depende de:** SPEC-002 · Gestão de Parceiras
**Fonte de verdade:** `CONTRATO_SOBERANO.md`

---

## 1. Objetivo

Especificar o controle da **Obrigação Financeira da Colaboração** (pagamento
mensal contratado) e dos pagamentos avulsos (extras/UGC): lançamento, mensagem de
cobrança, acompanhamento de estado e arquivamento ao pagar.

Não define tecnologia, persistência física, API HTTP ou UI.

---

## 2. Escopo

**Contempla**
- Lançamento automático mensal (reação a `MesCompilado`).
- Lançamento avulso fora do mês padrão.
- Geração de mensagem de cobrança/PIX.
- Máquina de estados do pagamento (§9).
- Arquivamento ao pagar.

**Não contempla**
- Integração com gateway de pagamento (PRD §12 — fora do escopo).
- Exibição financeira no Portal (SPEC-030).

---

## 3. Referências

| Documento | Seções | Uso |
|---|---|---|
| `PRD.md` | §5.6, §6.6, §7 (RN-09, RN-10, RN-11, RN-12), §9 (RF-020..RF-023) | Requisitos |
| `ADR-001` | §2.3 (`PAGAMENTOS.STATUS_PAGAMENTO`) | Estados canônicos |
| `CONTRATO_SOBERANO.md` | §4, §5, §6.3, §8 | Linguagem, PII, agregado, eventos |
| `DECISOES_BLOQUEANTES.md` | P3 / Q-04 | Elegibilidade de liberação (🟠 PO) |

---

## 4. Linguagem Ubíqua (obrigatória)

| Termo oficial | Definição sintética |
|---|---|
| **Obrigação Financeira da Colaboração** | Valor devido a uma Parceira numa competência (era "Pagamento" mensal). |
| **Pagamento Avulso** | Valor extra/UGC fora do mês padrão. |
| **Estado do Pagamento** | Enum canônico (§9). |

Termos banidos: `Ciclo` (Contrato §2). PII (`PIX`) nunca em log (Contrato §5).

---

## 5. Visão Geral

```
   MesCompilado (SPEC-005) ──▶ 1 Obrigação Financeira por Parceira (EmAberto)
   Lançamento avulso ────────▶ Obrigação avulsa (EmAberto)
          │ gera mensagem de cobrança (PIX)
          ▼
   EmAberto ──▶ Aprovado ──▶ Pago(terminal→arquiva)
```

---

## 6. Modelo do Domínio

### 6.1 Value Objects
- **Valor**, **PIX** (PII — nunca em log, Contrato §5).

### 6.2 Entidades e Agregado
- **Obrigação Financeira (agregado raiz)** — pertence a uma Parceira; normalmente
  associada a uma Colaboração Mensal (pode ser avulsa); valor; estado.

### 6.3 Serviço de Domínio
- **Coerção de estado (ACL)** (ADR-001 §2.3).

### 6.4 O que NÃO pertence
- Conteúdo (SPEC-012), Envio (SPEC-016).

---

## 7. Capacidades cobertas

| Capacidade | Coberta por |
|---|---|
| Lançar pagamento mensal | UC-020.01 |
| Lançar avulso | UC-020.02 |
| Gerar cobrança | UC-020.03 |
| Arquivar ao pagar | RN-11, §9 |

---

## 8. Casos de Uso

### UC-020.01 · Lançar pagamento mensal
- **Ator:** Sistema (reação a `MesCompilado`).
- Cria uma Obrigação Financeira `EmAberto` por Parceira Ativa, com valor e PIX do cadastro.

### UC-020.02 · Lançar pagamento avulso
- **Ator:** Operador Estúdio Elã.
- Lança valor extra/UGC para qualquer Parceira e período.

### UC-020.03 · Gerar cobrança e liberar
- **Ator:** Operador Estúdio Elã.
- Gera mensagem de cobrança/PIX; libera (`Aprovado`); ao pagar → `Pago` (arquiva).
- **Pós-condição:** `PagamentoLiberado`, depois `PagamentoConfirmado`.

---

## 9. Máquina de Estados

Enum canônico (ADR-001 §2.3 + Q-04 decisão):
```
EmAberto ──▶ Aprovado ──▶ Pago(terminal→arquiva)
```
- `Pago` é terminal e dispara arquivamento (RN-11).
- ✅ **Resolvido (PO, 2026-07-17, opção B):** elegibilidade para `liberar()`
  (EmAberto → Aprovado, `PagamentoLiberado`) — **somente após o conteúdo
  estar `Aprovado`** (publicação NÃO é requisito). Regra aplicada apenas à
  Obrigação `Mensal` (tem `mesReferencia` ligada às Entregas da competência,
  SPEC-012): todas as Entregas da Parceira nessa competência devem estar em
  `Aprovado` ou `Publicado` (ambos satisfazem "aprovado" — `Publicado`
  passou por `Aprovado`, §9 SPEC-012); nenhuma pode estar em
  `AguardandoMaterial`/`EmRevisao`. Sem Entregas na competência (Parceira
  sem formato contratado) é vacuamente elegível — nada pendente de
  aprovação. Obrigação `Avulso` (RN-04/CB-01, sem ligação 1:1 com
  Entregas do mês-padrão) **não** passa por este gate — liberação manual
  do Admin, como o MVP original já recomendava. Novo código de erro
  **PG-05** (§17) quando a Obrigação `Mensal` é recusada por conteúdo
  ainda não aprovado.

---

## 10. Regras de Negócio

| ID | Regra | Origem |
|---|---|---|
| RN-01 | Todo pagamento (mensal ou avulso) nasce `EmAberto` | PRD §7 RN-09 |
| RN-02 | Visão de estado: pendente → aprovado → pago | PRD §7 RN-10 |
| RN-03 | Ao ser pago, é arquivado automaticamente, com data de arquivamento | PRD §7 RN-11 |
| RN-04 | Pagamentos avulsos são permitidos fora do mês padrão | PRD §7 RN-12 |
| RN-05 | Estado desconhecido → erro de validação (fail-fast) | ADR-001 §2 |

---

## 11. Invariantes
- INV-01 Toda Obrigação Financeira pertence a exatamente uma Parceira.
- INV-02 Valor e estado sempre presentes; estado no Enum canônico.
- INV-03 Obrigação arquivada é somente leitura.
- INV-04 PIX nunca em log/evento (Contrato §5).

---

## 12. Eventos de Domínio

| Evento | Payload lógico | Consumidores |
|---|---|---|
| `PagamentoLiberado` | `obrigacaoId`, `parceiraId`, `mesReferencia` | Portal, Operação |
| `PagamentoConfirmado` | `obrigacaoId`, `dataArquivamento` | Arquivamento (SPEC-034), Portal |

Nomes conforme catálogo (Contrato §8). Sem PII no payload.

---

## 13. Papéis e Permissões

| Operação | Administrador | Operador | Parceira |
|---|---|---|---|
| Lançar/gerar cobrança | ✅ | ✅ | ❌ |
| Liberar/marcar pago | ✅ | ✅ | ❌ |
| Consultar pagamento | ✅ | ✅ | ✅ (os próprios) |

---

## 14. Contratos entre Módulos

### 14.1 Consome
| Fonte | Dado | Uso |
|---|---|---|
| SPEC-005 | `MesCompilado` + Snapshot Comercial | Valor da obrigação mensal |
| SPEC-002 | Valor e PIX da Parceira | Lançamento |

### 14.2 Fornece
| Consumidor | Dado | Meio |
|---|---|---|
| SPEC-030 | Total previsto x pago por período | Query |
| SPEC-034 | Pagamento pago | Evento/arquivamento |

---

## 15. Requisitos Não Funcionais
| ID | Requisito |
|---|---|
| RNF-01 | PIX/valor nunca em log (Contrato §5). |
| RNF-02 | Independente da tecnologia de persistência. |
| RNF-03 | Data de arquivamento preservada. |

---

## 16. Casos de Borda
| ID | Cenário | Resultado |
|---|---|---|
| CB-01 | Pagamento avulso sem competência | Permitido (período livre) |
| CB-02 | Marcar pago um já pago | Recusa (terminal) |
| CB-03 | Estado cru desconhecido | Erro de validação |

---

## 17. Tratamento de Erros
| Código | Situação |
|---|---|
| PG-01 | Obrigação inexistente |
| PG-02 | Estado desconhecido/inválido |
| PG-03 | Transição inválida |
| PG-04 | Operação não autorizada |
| PG-05 | Liberação recusada — conteúdo da competência ainda não `Aprovado` (Q-04) |

---

## 18. Rastreabilidade
| Item | Origem |
|---|---|
| RN-01 | PRD §7 RN-09 |
| RN-02/§9 | PRD §7 RN-10; ADR-001 §2.3 |
| RN-03 | PRD §7 RN-11 |
| RN-04 | PRD §7 RN-12 |
| Elegibilidade | ✅ P3 / Q-04 (opção B, PO 2026-07-17) |

---

## 19. Definition of Done
- Estados canônicos, coerção fail-fast.
- Lançamento mensal e avulso.
- Arquivamento ao pagar; PIX fora de logs.
- Elegibilidade implementada conforme decisão do PO (Q-04, opção B, §9).
- Gate Arquitetural aprovado.

---

## 20. Plano de Testes (essenciais)
| Cenário | Esperado |
|---|---|
| Compilar competência | Uma Obrigação `EmAberto` por Parceira Ativa |
| Lançar avulso | Obrigação avulsa `EmAberto` |
| Marcar pago | Arquivada; `PagamentoConfirmado` sem PII |
| Estado cru desconhecido | Erro de validação |

---

## 21. Pendências de Design
| ID | Item | Origem |
|---|---|---|
| D-01 | Regra de elegibilidade de liberação | ✅ P3 / Q-04 (opção B, PO 2026-07-17, §9) |
| D-02 | Modelo físico de persistência | Resolvido na implementação: aba `PAGAMENTOS`, upsert por `ID_OBRIGACAO` (padrão DocumentoACL/EntregaACL) |

---

## 22. Histórico
| Versão | Data | Alteração |
|---|---|---|
| 1.0 | 2026-07-14 | Especificação inicial do Financeiro (padrão SPEC-005). |
