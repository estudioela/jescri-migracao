# SPEC-025 · Acesso ao Portal da Parceira

**Status:** Refinada — pronta para Gate Arquitetural
**Módulo:** M8 · Portal (Acesso)
**Fase:** 4 · Especificação de Módulos
**Depende de:** SPEC-001 · Cadastro de Influenciadoras
**Fonte de verdade:** `CONTRATO_SOBERANO.md`

---

## 1. Objetivo

Especificar a **autenticação e a sessão** da Parceira no Portal: entrada,
bloqueio por tentativas e duração de sessão. Estabelece a fronteira de acesso
sobre a qual os demais módulos do Portal (SPEC-027/030/032) operam.

Não define tecnologia, persistência física, API HTTP ou UI.

---

## 2. Escopo

**Contempla**
- Autenticação da Parceira.
- Bloqueio temporário por tentativas malsucedidas.
- Sessão com expiração deslizante.

**Não contempla**
- Conteúdo (SPEC-027), financeiro/histórico (SPEC-030), perfil (SPEC-032).
- Papéis internos da equipe (🟠 Q-08).

---

## 3. Referências

| Documento | Seções | Uso |
|---|---|---|
| `PRD.md` | §6.8, §7 (RN-16, RN-17, RN-18), §9 (RF-026, RF-027), §10 (segurança) | Requisitos |
| `DECISOES_BLOQUEANTES.md` | P5 / Q-07 (auth), P6 / Q-08 (papéis), Q-09 (LGPD) | Decisões do PO (🟠) |
| `CONTRATO_SOBERANO.md` | §5 | PII |

---

## 4. Linguagem Ubíqua (obrigatória)

| Termo oficial | Definição sintética |
|---|---|
| **Parceira** | Usuária autenticada do Portal. |
| **Sessão** | Janela de acesso autenticado, com expiração deslizante. |
| **Bloqueio de Acesso** | Suspensão temporária após tentativas malsucedidas. |

Termos banidos: `Ciclo` (Contrato §2). PII nunca em log (Contrato §5).

---

## 5. Visão Geral

```
   Parceira ─(credenciais)─▶ [Autenticação] ─ok─▶ Sessão (deslizante)
                                   └─falha×N─▶ Bloqueio temporário
```

---

## 6. Modelo do Domínio

### 6.1 Value Objects
- **Credencial**, **TokenDeSessao**, **JanelaDeBloqueio**.

### 6.2 Entidades e Agregado
- **Sessão (agregado raiz)** — vincula Parceira autenticada; validade.

### 6.3 Serviço de Domínio
- **Autenticador** (porta): valida credencial, cria sessão, aplica bloqueio.

### 6.4 O que NÃO pertence
- Dados de negócio da Parceira (demais SPECs do Portal).

---

## 7. Capacidades cobertas

| Capacidade | Coberta por |
|---|---|
| Autenticar Parceira | UC-025.01 |
| Bloquear por tentativas | RN-02, UC-025.01 |
| Manter sessão deslizante | RN-03 |

---

## 8. Casos de Uso

### UC-025.01 · Autenticar
- **Ator:** Parceira.
- **Fluxo:** informa credenciais → sucesso cria Sessão; após N falhas, bloqueia.
- **Pós-condição:** Sessão ativa ou Bloqueio temporário.

### UC-025.02 · Renovar sessão
- **Ator:** Parceira.
- Cada interação renova a validade (deslizante).

---

## 9. Máquina de Estados

```
NaoAutenticada ──(sucesso)──▶ Autenticada(sessão) ──(expiração/logout)──▶ NaoAutenticada
NaoAutenticada ──(N falhas)──▶ Bloqueada ──(janela)──▶ NaoAutenticada
```

---

## 10. Regras de Negócio

| ID | Regra | Origem |
|---|---|---|
| RN-01 | Acesso da Parceira é autenticado por credencial | PRD §7 RN-16 |
| RN-02 | Após 5 tentativas malsucedidas, bloqueio por 15 minutos | PRD §7 RN-17 |
| RN-03 | Sessão dura 6 horas, renovada a cada interação (deslizante) | PRD §7 RN-18 |
| RN-04 | PII e credenciais nunca em log | Contrato §5; Q-09 |

> **Herança legada (RN-16):** cupom + 5 primeiros dígitos do CNPJ é **baixa
> entropia**. 🟠 **P5 / Q-07 — AGUARDA PO:** modelo de autenticação
> (preservar × senha redefinível × link mágico × OAuth). Recomendação:
> abandonar o segredo derivado de CNPJ. Não decidido aqui.

---

## 11. Invariantes
- INV-01 Sessão só existe para Parceira autenticada.
- INV-02 Bloqueio impede autenticação durante a janela.
- INV-03 Credencial nunca registrada em claro (Contrato §5).

---

## 12. Eventos de Domínio

| Evento | Payload lógico | Consumidores |
|---|---|---|
| (sessão iniciada) | `parceiraId` | Portal (SPEC-027/030/032) |
| (acesso bloqueado) | `identificador`, `janela` | Operação (auditoria, sem PII) |

---

## 13. Papéis e Permissões

| Operação | Administrador | Operador | Parceira |
|---|---|---|---|
| Autenticar no Portal | ❌ | ❌ | ✅ |
| Consultar bloqueios | ✅ | ✅ | ❌ |

🟠 **P6 / Q-08:** papéis distintos na equipe — default MVP operador único.

---

## 14. Contratos entre Módulos

### 14.1 Consome
| Fonte | Dado | Uso |
|---|---|---|
| SPEC-001 | Identidade/credencial da Parceira | Autenticação |

### 14.2 Fornece
| Consumidor | Dado | Meio |
|---|---|---|
| SPEC-027/030/032 | Sessão autenticada (parceira corrente) | Contexto de acesso |

---

## 15. Requisitos Não Funcionais
| ID | Requisito |
|---|---|
| RNF-01 | Credenciais e PII fora de logs (Contrato §5; Q-09). |
| RNF-02 | LGPD (retenção/expurgo) resolvida **antes** de o Portal expor dados (Q-09). |
| RNF-03 | Independente da tecnologia de sessão. |

---

## 16. Casos de Borda
| ID | Cenário | Resultado |
|---|---|---|
| CB-01 | 5ª tentativa falha | Bloqueio de 15 min |
| CB-02 | Interação após 6h de inatividade | Sessão expirada; reautenticar |
| CB-03 | Acesso durante bloqueio | Recusado até fim da janela |

---

## 17. Tratamento de Erros
| Código | Situação |
|---|---|
| AC-01 | Credencial inválida |
| AC-02 | Acesso bloqueado |
| AC-03 | Sessão expirada |

---

## 18. Rastreabilidade
| Item | Origem |
|---|---|
| RN-01 | PRD §7 RN-16 |
| RN-02 | PRD §7 RN-17 |
| RN-03 | PRD §7 RN-18 |
| Auth/LGPD | 🟠 P5/Q-07, Q-09 |

---

## 19. Definition of Done
- Autenticação, bloqueio (5/15min) e sessão (6h deslizante) especificados.
- Modelo de auth marcado como pendência do PO (não decidido).
- LGPD condicionada antes da exposição de dados.
- Gate Arquitetural aprovado.

---

## 20. Plano de Testes (essenciais)
| Cenário | Esperado |
|---|---|
| Login válido | Sessão criada |
| 5 falhas | Bloqueio de 15 min |
| Inatividade > 6h | Sessão expira |

---

## 21. Pendências de Design
| ID | Item | Origem |
|---|---|---|
| D-01 | Modelo de autenticação | 🟠 P5 / Q-07 (AGUARDA PO) |
| D-02 | Papéis na equipe | 🟠 P6 / Q-08 |
| D-03 | Política de retenção/expurgo (LGPD) | Q-09 (SPEC dedicada antes do Portal) |

---

## 22. Histórico
| Versão | Data | Alteração |
|---|---|---|
| 1.0 | 2026-07-14 | Especificação inicial do Acesso ao Portal (padrão SPEC-005). |
