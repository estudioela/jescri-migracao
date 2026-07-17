# SPEC-034 · Arquivamento Geral Manual

**Status:** Implementada (2026-07-17)
**Módulo:** M9 · Arquivamento / Histórico
**Fase:** 4 · Especificação de Módulos
**Depende de:** SPEC-012 · Conteúdo, SPEC-016 · Logística, SPEC-020 · Pagamentos
**Fonte de verdade:** `CONTRATO_SOBERANO.md`

---

## 1. Objetivo

Especificar o **arquivamento** de itens concluídos (Entrega publicada, Pagamento
pago, Envio entregue) para fora das listas operacionais, com carimbo de data,
incluindo o disparo manual em lote — preservando o registro para consulta.

Não define tecnologia, persistência física, API HTTP ou UI.

---

## 2. Escopo

**Contempla**
- Arquivamento automático por gatilho de estado terminal (Publicado/Pago/Entregue).
- Arquivamento manual em lote pela equipe.
- Carimbo de data de arquivamento.
- Publicação de `CompetenciaArquivada` quando a competência é selada.

**Não contempla**
- Regras internas dos módulos de origem (SPEC-012/016/020).
- Reabertura de competência arquivada (Contrato §6.4: imutável).

---

## 3. Referências

| Documento | Seções | Uso |
|---|---|---|
| `PRD.md` | §5.8, §6.9, §7 (RN-08, RN-11, RN-14), §9 (RF-031, RF-032) | Requisitos |
| `CONTRATO_SOBERANO.md` | §4, §6.4, §8 | Linguagem, imutabilidade, `CompetenciaArquivada` |
| `ADR — Linguagem Ubíqua` | §4 | `Arquivamento`, `CompetenciaArquivada` |

---

## 4. Linguagem Ubíqua (obrigatória)

| Termo oficial | Definição sintética |
|---|---|
| **Histórico** | Registro arquivado de Entrega/Pagamento/Envio concluído. |
| **Arquivamento** | Selagem imutável do item concluído, com data. |
| **CompetenciaArquivada** | Evento de selagem da competência (Contrato §8). |

Termos banidos: `Ciclo`, `Fechamento` (Contrato §2 / ADR-Linguagem §4).

---

## 5. Visão Geral

```
   Entrega Publicada / Pagamento Pago / Envio Entregue
        │ gatilho automático  OU  disparo manual em lote
        ▼
   Move ao Histórico correspondente + carimbo DATA_ARQUIVAMENTO
        │ (competência sem pendências)
        ▼
   Publica CompetenciaArquivada
```

---

## 6. Modelo do Domínio

### 6.1 Value Objects
- **DataDeArquivamento** (carimbo obrigatório, Contrato §6.4).

### 6.2 Entidades e Agregado
- **ItemDeHistorico (conceitual)** — cópia arquivada e imutável de uma
  Entrega/Pagamento/Envio. **Implementação (2026-07-17):** não é uma
  entidade nova — a própria linha de origem, já `Object.freeze`ada e
  carimbada com `dataArquivamento` no estado terminal, É a cópia imutável;
  não existe aba física de histórico separada (resolve D-02, §21). O nome
  `ItemDeHistorico` já existe no código como VO de **projeção de leitura**
  do Portal (SPEC-030, `src/domain/ItemDeHistorico.js`) — não confundir com
  o conceito desta seção; não há colisão porque esta SPEC não cria entidade
  própria.

### 6.3 Serviço de Domínio
- **Arquivador (conceitual)**: aplica gatilho automático e o lote manual;
  sela a competência. **Implementação:** `ArquivamentoService`
  (`src/service/ArquivamentoService.js`).

### 6.4 O que NÃO pertence
- Estados operacionais vivos (módulos de origem).

---

## 7. Capacidades cobertas

| Capacidade | Coberta por |
|---|---|
| Arquivar automaticamente por estado terminal | RN-01..RN-03 |
| Arquivar manualmente em lote | UC-034.01 |
| Selar competência | UC-034.02 |

---

## 8. Casos de Uso

### UC-034.01 · Arquivamento manual em lote
- **Ator:** Operador Estúdio Elã.
- Dispara rotina de arquivamento geral de itens concluídos, com carimbo de data.

### UC-034.02 · Selar competência
- **Ator:** Administrador.
- Sem pendências operacionais, marca a competência `Arquivada` (imutável) e publica `CompetenciaArquivada`.

---

## 9. Máquina de Estados

```
Vivo ──(estado terminal do módulo de origem)──▶ Arquivado(imutável)
Competência: Concluída ──(selagem)──▶ Arquivada(imutável)
```
- `Arquivado`/`Arquivada` são terminais e somente leitura (Contrato §6.4).

---

## 10. Regras de Negócio

| ID | Regra | Origem |
|---|---|---|
| RN-01 | Entrega publicada é arquivada automaticamente, com data | PRD §7 RN-08 |
| RN-02 | Pagamento pago é arquivado automaticamente, com data | PRD §7 RN-11 |
| RN-03 | Envio entregue é arquivado automaticamente, com data | PRD §7 RN-14 |
| RN-04 | A equipe pode disparar arquivamento geral manual em lote | PRD §9 RF-031 |
| RN-05 | Todo item arquivado retém a data de arquivamento | PRD §9 RF-032 |
| RN-06 | Competência arquivada é imutável | Contrato §6.4 |
| RN-07 | Elegibilidade para selagem: TODO item existente da competência (Entrega/Envio/Obrigação `Mensal`) deve estar em estado terminal (`Publicado`/`Entregue`/`Pago`); ausência de itens de um módulo não bloqueia; Obrigação `Avulso` (sem competência) fica fora da checagem | Resolve D-01 (ver §21) |

---

## 11. Invariantes
- INV-01 Todo item arquivado tem data de arquivamento.
- INV-02 Item/competência arquivada é somente leitura (Contrato §6.4).
- INV-03 Nenhuma reabertura de competência arquivada.
- INV-04 Histórico não expõe PII em log (Contrato §5).

---

## 12. Eventos de Domínio

| Evento | Payload lógico | Consumidores |
|---|---|---|
| `CompetenciaArquivada` | `mesReferencia` | Memória do Domínio, Portal (histórico) |

Nome conforme catálogo (Contrato §8).

---

## 13. Papéis e Permissões

| Operação | Administrador | Operador | Parceira |
|---|---|---|---|
| Arquivamento manual em lote | ✅ | ✅ | ❌ |
| Selar competência | ✅ | ❌ | ❌ |
| Consultar histórico | ✅ | ✅ | ✅ (o próprio) |

---

## 14. Contratos entre Módulos

### 14.1 Consome
| Fonte | Dado | Uso |
|---|---|---|
| SPEC-012 | Entrega publicada | Gatilho de arquivamento |
| SPEC-016 | Envio entregue | Gatilho de arquivamento |
| SPEC-020 | Pagamento pago | Gatilho de arquivamento |
| SPEC-005 | Estado da competência | Selagem |

### 14.2 Fornece
| Consumidor | Dado | Meio |
|---|---|---|
| Portal (SPEC-030) | Itens de histórico | Query (leitura) |
| Memória do Domínio | `CompetenciaArquivada` | Evento |

---

## 15. Requisitos Não Funcionais
| ID | Requisito |
|---|---|
| RNF-01 | Data de arquivamento nunca perdida (PRD §10). |
| RNF-02 | Histórico permanece disponível após arquivamento. |
| RNF-03 | PII fora de logs (Contrato §5). |

---

## 16. Casos de Borda
| ID | Cenário | Resultado |
|---|---|---|
| CB-01 | Selar competência com pendências abertas | Recusada até conclusão |
| CB-02 | Tentativa de reabrir competência arquivada | Recusada (imutável) |
| CB-03 | Arquivamento em lote sem itens concluídos | No-op |

---

## 17. Tratamento de Erros
| Código | Situação |
|---|---|
| AR-01 | Item não está em estado terminal |
| AR-02 | Competência com pendências |
| AR-03 | Escrita em competência arquivada |
| AR-04 | Operação não autorizada |

---

## 18. Rastreabilidade
| Item | Origem |
|---|---|
| RN-01/02/03 | PRD §7 RN-08/11/14 |
| RN-04/05 | PRD §9 RF-031/032 |
| RN-06 | Contrato §6.4 |
| Evento | Contrato §8 |

---

## 19. Definition of Done
- ✅ Arquivamento automático por estado terminal e manual em lote.
- ✅ Carimbo de data sempre presente.
- ✅ Competência arquivada imutável; sem reabertura.
- ✅ `CompetenciaArquivada` publicado.
- ✅ Gate Arquitetural aprovado (D-01/D-02 resolvidos, §21).

---

## 20. Plano de Testes (essenciais)
| Cenário | Esperado |
|---|---|
| Publicar/pagar/entregar | Item arquivado com data |
| Lote manual | Concluídos movidos ao histórico |
| Selar com pendências | Recusa |
| Reabrir arquivada | Recusa |

---

## 21. Pendências de Design
| ID | Item | Origem |
|---|---|---|
| D-01 | Regra formal de elegibilidade para selagem | Contrato §9 |
| D-02 | Modelo físico das abas de histórico | ADR futuro |

- ✅ **Resolvido (2026-07-17, tratado como lacuna de documentação, não
  decisão de PO — a referência original a "Contrato §9" estava incorreta:
  aquele parágrafo só lista a elegibilidade de `PagamentoLiberado`, já
  resolvida em SPEC-020 Q-04, e nada sobre selagem de competência):** D-01 —
  ver RN-07 (§10). Regra proposta seguindo o mesmo formato já aprovado pelo
  PO na Q-04 de SPEC-020 (gate por competência, `Avulso` excluído):
  competência selável quando todo item existente das 3 origens (Entrega
  `Publicado`, Envio `Entregue`, Obrigação `Mensal` `Pago`) está terminal;
  ausência de itens de um módulo é vacuamente satisfeita (não bloqueia,
  coerente com CB-03); Obrigação `Avulso` fica fora por não ter competência.
- ✅ **Resolvido (2026-07-17, na implementação):** D-02 (modelo físico das
  abas de histórico) — não há aba nova. `Entrega`/`Envio`/`ObrigacaoFinanceira`
  já carimbam `dataArquivamento` e se congelam (`Object.freeze`) no próprio
  estado terminal (achado prévio à implementação: efeito colateral já
  existente de SPEC-012/016/020); a linha de origem é a cópia imutável.
  `ColaboracaoMensal.arquivar()` (Concluída→Arquivada) também já existia no
  domínio, mas só era usado na reidratação — faltava o comando real de
  selagem, agora em `ArquivamentoService.selarCompetencia`/`arquivarLote`
  (`src/service/ArquivamentoService.js`) → `ColaboracaoMensalRepository.
  arquivarCompetencia` (novo) → `ColaboracaoMensalACL.arquivarCompetencia`
  (novo, escrita física pura) → `ArquivamentoController` → Portal.

---

## 22. Histórico
| Versão | Data | Alteração |
|---|---|---|
| 1.0 | 2026-07-14 | Especificação inicial do Arquivamento (padrão SPEC-005). |
| 1.1 | 2026-07-17 | D-01/D-02 resolvidos (§21); RN-07 formalizada (§10); implementação completa (`ArquivamentoService`/`ArquivamentoController`/`ColaboracaoMensalRepository.arquivarCompetencia`/`ColaboracaoMensalACL.arquivarCompetencia`); Status → Implementada. |
