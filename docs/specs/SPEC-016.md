# SPEC-016 · Gestão Logística (Envio)

**Status:** Refinada — pronta para Gate Arquitetural
**Módulo:** M5 · Logística
**Fase:** 4 · Especificação de Módulos
**Depende de:** SPEC-005 · Colaboração Mensal
**Fonte de verdade:** `CONTRATO_SOBERANO.md`

---

## 1. Objetivo

Especificar o controle do **Envio** físico dos produtos (looks) para cada Parceira
de uma Colaboração Mensal: confirmação de endereço, registro de rastreio,
atualização de status e arquivamento ao entregar.

Não define tecnologia, persistência física, API HTTP ou UI.

---

## 2. Escopo

**Contempla**
- Materialização do Envio por Parceira (reação a `MesCompilado`).
- Confirmação de endereço (mensagem gerada para envio manual).
- Registro de rastreio e atualização automática de status via transportadora.
- Data de envio automática ao registrar rastreio.
- Arquivamento ao entregar.

**Não contempla**
- Conteúdo/Entregas (SPEC-012).
- Pagamento (SPEC-020).

---

## 3. Referências

| Documento | Seções | Uso |
|---|---|---|
| `PRD.md` | §5.5, §6.5, §7 (RN-13, RN-14), §9 (RF-016..RF-019) | Requisitos |
| `ADR-001` | §2.4 (`STATUS REVISÃO` e `STATUS LOGISTICA`, máquinas independentes) | Estados canônicos |
| `CONTRATO_SOBERANO.md` | §4, §6.3, §7.1/§7.2, §8 | Linguagem, agregado, projeções, eventos |
| `ADR — Linguagem Ubíqua` | §4 | `Envio` |

---

## 4. Linguagem Ubíqua (obrigatória)

| Termo oficial | Definição sintética |
|---|---|
| **Envio** | Registro do envio físico do produto de uma Colaboração Mensal (era "Fluxo Logístico"). |
| **Revisão de dados** | Máquina de estados de confirmação (`STATUS REVISÃO`). |
| **Jornada física** | Máquina de estados de entrega (`STATUS LOGISTICA`). |

Termos banidos: `Ciclo` (Contrato §2).

---

## 5. Visão Geral

```
   MesCompilado (SPEC-005) ──▶ cria 1 Envio por Parceira Ativa (Revisão = AguardandoConfirmacao)
          │ confirma endereço · registra rastreio
          ▼
   Jornada física: Pendente ──▶ Expedido ──▶ Entregue(terminal→arquiva) | Cancelado(terminal)
```

Duas máquinas **independentes** (ADR-001 §2.4).

---

## 6. Modelo do Domínio

### 6.1 Value Objects
- **CodigoRastreio**, **EnderecoDeEntrega** (PII — nunca em log, Contrato §5).

### 6.2 Entidades e Agregado
- **Envio (agregado raiz)** — pertence a uma Colaboração Mensal e a uma Parceira;
  estado de Revisão de dados; estado de Jornada física; rastreio; data de envio.

### 6.3 Serviço de Domínio
- **Adaptador de rastreio** (porta): consulta transportadora e atualiza a Jornada.

### 6.4 O que NÃO pertence
- Entrega de conteúdo (SPEC-012), Pagamento (SPEC-020).

---

## 7. Capacidades cobertas

| Capacidade | Coberta por |
|---|---|
| Confirmar endereço | UC-016.01 |
| Registrar rastreio | UC-016.02 |
| Atualizar status automaticamente | UC-016.03 |
| Arquivar ao entregar | RN-14, §9 |

---

## 8. Casos de Uso

### UC-016.01 · Confirmar endereço
- **Ator:** Operador Estúdio Elã.
- Gera mensagem de confirmação de endereço e PIX para envio manual.

### UC-016.02 · Registrar rastreio
- **Ator:** Operador Estúdio Elã.
- **Fluxo:** registra código de rastreio → data de envio preenchida automaticamente se vazia.
- **Pós-condição:** `ProdutoDespachado` publicado.

### UC-016.03 · Atualizar status
- **Ator:** Sistema (adaptador de rastreio).
- Consulta transportadora; ao indicar entrega, arquiva (`ProdutoEntregue`).

---

## 9. Máquina de Estados

**Revisão de dados (`STATUS REVISÃO`):**
```
AguardandoConfirmacao ──▶ Confirmado(terminal)
```
**Jornada física (`STATUS LOGISTICA`):**
```
Pendente ──▶ Expedido ──▶ Entregue(terminal→arquiva)
                       └──▶ Cancelado(terminal)
```
- Máquinas independentes (ADR-001 §2.4).
- 🟠 rótulos crus de estados não observados na seed: a confirmar por ADR (ADR-001 §2.4).

---

## 10. Regras de Negócio

| ID | Regra | Origem |
|---|---|---|
| RN-01 | Toda Parceira Ativa recebe, por competência, um Envio com Revisão `AguardandoConfirmacao` | PRD §7 RN-13 |
| RN-02 | Ao registrar o rastreio, a data de envio é preenchida se ainda vazia | PRD §5.5 |
| RN-03 | Ao ser entregue, o Envio é arquivado automaticamente, com data de arquivamento | PRD §7 RN-14 |
| RN-04 | Revisão de dados e Jornada física são máquinas independentes | ADR-001 §2.4 |
| RN-05 | Estado desconhecido → erro de validação (fail-fast) | ADR-001 §2 |

---

## 11. Invariantes
- INV-01 Todo Envio referencia uma Colaboração Mensal compilada.
- INV-02 Estados sempre pertencem aos Enums canônicos (§9).
- INV-03 Envio arquivado é somente leitura.
- INV-04 PII de endereço nunca em log (Contrato §5).

---

## 12. Eventos de Domínio

| Evento | Payload lógico | Consumidores |
|---|---|---|
| `ProdutoDespachado` | `envioId`, `parceiraId`, `mesReferencia`, `rastreio` | Portal, Operação |
| `ProdutoEntregue` | `envioId`, `dataArquivamento` | Arquivamento (SPEC-034) |

Nomes conforme catálogo (Contrato §8).

---

## 13. Papéis e Permissões

| Operação | Administrador | Operador | Parceira |
|---|---|---|---|
| Confirmar endereço | ✅ | ✅ | ❌ |
| Registrar rastreio | ✅ | ✅ | ❌ |
| Consultar Envio | ✅ | ✅ | ✅ (o próprio) |

---

## 14. Contratos entre Módulos

### 14.1 Consome
| Fonte | Dado | Uso |
|---|---|---|
| SPEC-005 | `MesCompilado` | Materialização do Envio |
| SPEC-002 | Endereço da Parceira | Confirmação/rótulo |

### 14.2 Fornece
| Consumidor | Dado | Meio |
|---|---|---|
| SPEC-034 | Envio entregue | Evento/arquivamento |
| Portal | Status do Envio | Query |

---

## 15. Requisitos Não Funcionais
| ID | Requisito |
|---|---|
| RNF-01 | Falha do adaptador de rastreio não impede salvar dados principais (PRD §10). |
| RNF-02 | Independente da tecnologia de persistência. |
| RNF-03 | PII (endereço) fora de logs. |

---

## 16. Casos de Borda
| ID | Cenário | Resultado |
|---|---|---|
| CB-01 | Transportadora indisponível | Operação principal segue; status não atualiza |
| CB-02 | Rastreio registrado com data de envio já preenchida | Data preservada |
| CB-03 | Estado cru desconhecido | Erro de validação |

---

## 17. Tratamento de Erros
| Código | Situação |
|---|---|
| LG-01 | Envio inexistente |
| LG-02 | Estado desconhecido/inválido |
| LG-03 | Falha externa de rastreio (degradável) |
| LG-04 | Operação não autorizada |

---

## 18. Rastreabilidade
| Item | Origem |
|---|---|
| RN-01 | PRD §7 RN-13 |
| RN-03 | PRD §7 RN-14 |
| RN-04/§9 | ADR-001 §2.4 |
| Eventos | Contrato §8 |

---

## 19. Definition of Done
- Duas máquinas de estado independentes, coerção fail-fast.
- Envio por Parceira Ativa ao compilar.
- Data de envio automática; arquivamento ao entregar.
- Falha de rastreio degradável.
- Gate Arquitetural aprovado.

---

## 20. Plano de Testes (essenciais)
| Cenário | Esperado |
|---|---|
| Compilar competência | Um Envio por Parceira Ativa |
| Registrar rastreio | Data de envio preenchida; `ProdutoDespachado` |
| Entrega detectada | Arquivamento; `ProdutoEntregue` |
| Transportadora offline | Sem bloqueio da operação principal |

---

## 21. Pendências de Design
| ID | Item | Origem |
|---|---|---|
| D-01 | Rótulos crus de estados não observados | ADR-001 §2.4 (ADR futuro) |
| D-02 | Provedor/contrato da API de rastreio | ADR futuro |

---

## 22. Histórico
| Versão | Data | Alteração |
|---|---|---|
| 1.0 | 2026-07-14 | Especificação inicial da Logística/Envio (padrão SPEC-005). |
