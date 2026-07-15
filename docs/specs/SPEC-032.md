# SPEC-032 · Perfil no Portal da Parceira

**Status:** Refinada — pronta para Gate Arquitetural
**Módulo:** M8 · Portal (Perfil)
**Fase:** 4 · Especificação de Módulos
**Depende de:** SPEC-001 · Cadastro, SPEC-002 · Gestão, SPEC-025 · Acesso
**Fonte de verdade:** `CONTRATO_SOBERANO.md`

---

## 1. Objetivo

Especificar a visualização e edição, pela própria Parceira autenticada, dos seus
dados de perfil: chave PIX, e-mail e endereço (resolvido por CEP).

Não define tecnologia, persistência física, API HTTP ou UI.

---

## 2. Escopo

**Contempla**
- Visualização do perfil da Parceira.
- Edição de PIX, e-mail e endereço (CEP → rua/bairro/cidade/UF, RN-02).

**Não contempla**
- Edição de Condição Comercial/valor (SPEC-002, equipe).
- Alteração de status `Ativa`/`Inativa` (SPEC-002).

---

## 3. Referências

| Documento | Seções | Uso |
|---|---|---|
| `PRD.md` | §6.8, §7 (RN-02), §9 (RF-029) | Requisitos |
| `CONTRATO_SOBERANO.md` | §5 | PII (`PIX`, `Endereco`) |

---

## 4. Linguagem Ubíqua (obrigatória)

| Termo oficial | Definição sintética |
|---|---|
| **Perfil** | Dados editáveis da Parceira (PIX, e-mail, endereço). |
| **Endereco** | Value Object resolvido por CEP (Contrato §5, PII). |

Termos banidos: `Ciclo` (Contrato §2). PII nunca em log (Contrato §5).

---

## 5. Visão Geral

```
   Sessão (SPEC-025) ──▶ Parceira vê perfil
        │ edita PIX / e-mail / endereço
        ▼
   Endereço recomposto por CEP (RN-02) — falha de CEP não bloqueia salvar
```

---

## 6. Modelo do Domínio

### 6.1 Value Objects
- **PIX**, **Endereco** (PII, Contrato §5).

### 6.2 Entidades e Agregado
- Opera sobre o agregado **Parceira** (SPEC-002), restrito aos campos de perfil.

### 6.3 Serviço de Domínio
- **Adaptador de CEP** (porta): recompõe endereço; falha degradável.

### 6.4 O que NÃO pertence
- Campos comerciais/vínculo (SPEC-002, equipe).

---

## 7. Capacidades cobertas

| Capacidade | Coberta por |
|---|---|
| Ver perfil | UC-032.01 |
| Editar PIX/e-mail | UC-032.02 |
| Editar endereço por CEP | UC-032.03, RN-01 |

---

## 8. Casos de Uso

### UC-032.01 · Ver perfil
- **Ator:** Parceira autenticada.
- Exibe PIX, e-mail e endereço atuais.

### UC-032.02 · Editar dados bancários/contato
- **Ator:** Parceira autenticada.
- Edita PIX e e-mail.

### UC-032.03 · Editar endereço
- **Ator:** Parceira autenticada.
- Altera CEP/número/complemento; endereço recomposto (RN-01); falha de CEP não impede salvar.

---

## 9. Máquina de Estados

Sem máquina própria — edição direta de campos do agregado Parceira.

---

## 10. Regras de Negócio

| ID | Regra | Origem |
|---|---|---|
| RN-01 | Endereço recomposto a partir do CEP em qualquer edição de CEP/número/complemento | PRD §7 RN-02 |
| RN-02 | Falha do serviço de CEP não impede salvar os dados principais | PRD §10 |
| RN-03 | A Parceira só edita o próprio perfil | SPEC-025; Q-09 |
| RN-04 | Edição de perfil não altera vínculo nem Condição Comercial | SPEC-002 |

---

## 11. Invariantes
- INV-01 Acesso restrito à Parceira autenticada e ao próprio perfil.
- INV-02 PII nunca em log (Contrato §5).
- INV-03 Perfil não expõe campos comerciais.

---

## 12. Eventos de Domínio

| Evento | Payload lógico | Consumidores |
|---|---|---|
| (perfil atualizado) | `parceiraId`, camposAlterados (sem valores PII) | Operação (auditoria) |

---

## 13. Papéis e Permissões

| Operação | Parceira | Equipe |
|---|---|---|
| Ver/editar próprio perfil | ✅ | ✅ (todas, via SPEC-002) |
| Editar valor/vínculo | ❌ | ✅ (SPEC-002) |

---

## 14. Contratos entre Módulos

### 14.1 Consome
| Fonte | Dado | Uso |
|---|---|---|
| SPEC-025 | Sessão | Escopo de acesso |
| SPEC-002 | Agregado Parceira (campos de perfil) | Leitura/escrita restrita |

### 14.2 Fornece
| Consumidor | Dado | Meio |
|---|---|---|
| SPEC-002 | Perfil atualizado | Escrita restrita |

---

## 15. Requisitos Não Funcionais
| ID | Requisito |
|---|---|
| RNF-01 | PII fora de logs (Contrato §5). |
| RNF-02 | CEP degradável (não bloqueia salvar). |
| RNF-03 | Isolamento estrito entre Parceiras (Q-09). |

---

## 16. Casos de Borda
| ID | Cenário | Resultado |
|---|---|---|
| CB-01 | CEP indisponível | Dados principais salvos; endereço pode ficar incompleto |
| CB-02 | Tentativa de editar valor comercial | Recusada |

---

## 17. Tratamento de Erros
| Código | Situação |
|---|---|
| PP-01 | Sessão inválida |
| PP-02 | Tentativa de editar campo não permitido |
| PP-03 | Falha de CEP (degradável) |

---

## 18. Rastreabilidade
| Item | Origem |
|---|---|
| RN-01 | PRD §7 RN-02 |
| RN-02 | PRD §10 |
| Isolamento | Q-09; SPEC-025 |

---

## 19. Definition of Done
- Ver/editar PIX, e-mail e endereço da própria Parceira.
- Endereço recomposto por CEP; falha degradável.
- Sem edição de campos comerciais.
- PII protegida.
- Gate Arquitetural aprovado.

---

## 20. Plano de Testes (essenciais)
| Cenário | Esperado |
|---|---|
| Editar CEP | Endereço recomposto |
| CEP offline | Salva sem endereço completo |
| Editar valor comercial | Recusado |

---

## 21. Pendências de Design
| ID | Item | Origem |
|---|---|---|
| D-01 | Isolamento depende do modelo de auth | 🟠 P5 / Q-07 (SPEC-025) |

---

## 22. Histórico
| Versão | Data | Alteração |
|---|---|---|
| 1.0 | 2026-07-14 | Especificação inicial do Perfil no Portal (padrão SPEC-005). |
