# SPEC-005 · Colaboração Mensal

**Status:** Refinada — pronta para Gate Arquitetural
**Módulo:** M2 · Colaboração Mensal (Compilador do Mês)
**Fase:** 4 · Especificação de Módulos
**Depende de:** SPEC-002 · Cadastro de Parceiras
**Sobrepõe:** SPEC-005 v1.0 (14/07/2026)
**Fonte de verdade:** `CONTRATO_SOBERANO.md`

---

## 1. Objetivo

Especificar o módulo responsável por **compilar** o Mês de operação do
TEAR, materializando, para cada Parceira ativa, sua **Colaboração Mensal**
naquela **MesReferencia** e congelando as **Condições Comerciais**
vigentes.

Após a compilação, os agregados operacionais de cada módulo vizinho
(Briefing, Ativação, EnvioLogístico, Pagamento) são criados **pelos
próprios módulos**, em reação ao evento `MesCompilado`.

Esta SPEC define comportamento; não define tecnologia, persistência
física, API HTTP ou UI.

---

## 2. Escopo

**Contempla**

- Compilação de uma MesReferencia.
- Criação de Parceria em Colaboração para cada Parceira ativa.
- Congelamento de Snapshot Comercial.
- Publicação do evento `MesCompilado`.
- Arquivamento da competência (`CompetenciaArquivada`).
- Contratos consumidos e publicados pelo módulo.

**Não contempla**

- Regras internas de Briefing, Ativação, Logística, Pagamento.
- Detalhamento do Portal da Parceira.
- Reabertura de competência arquivada (Contrato §6.4: imutável).

---

## 3. Referências

| Documento | Uso |
|---|---|
| `CONTRATO_SOBERANO.md` §2, §4, §5, §6, §8 | Linguagem, VOs, eventos, agregados |
| `06_MODELO_CONCEITUAL_DOS_DADOS.md` | Planos Atores, Acordos, Operação em Ciclo, Memória |
| `04_CAPACIDADES_DO_SISTEMA.md` §B | Capacidades de "Condução do ciclo mensal" |
| `PRD.md` §1, §7 | Propósito, regras de negócio consolidadas |
| `IMPLEMENTATION_PLAN.md` | Sequência de entrega, dependências |
| `PROJECT_GOVERNANCE.md` §3 | Decisões arquiteturais permanentes |
| `ENGENHARIA.md` §2 | Fronteiras de execução |

---

## 4. Linguagem Ubíqua (obrigatória)

| Termo oficial | Definição sintética | Termos banidos |
|---|---|---|
| **Colaboração Mensal** | Participação de uma Parceira em uma MesReferencia | ~~Ciclo~~, ~~Ciclo Mensal~~ |
| **MesReferencia** | Value Object `AAAA-MM` que identifica a competência (ADR-001 §3) | ~~Mês/Ano solto~~ |
| **Compilador do Mês** | Serviço de domínio que executa a compilação | — |
| **Snapshot Comercial** | Fotografia imutável das Condições Comerciais no instante da compilação | — |
| **Arquivamento** | Selagem imutável da competência ao seu término | ~~Fechamento~~ |

Contrato Soberano §2 é vinculante: qualquer PR que reintroduza "Ciclo"
deve ser rejeitado no Gate Arquitetural.

---

## 5. Visão Geral

```
   Operador Estúdio Elã
            │
            │ compilarMes(MesReferencia)
            ▼
   ┌────────────────────┐
   │  Compilador do Mês │  (Serviço de Domínio, dentro do módulo)
   └─────────┬──────────┘
             │ lê
             ▼
   ┌────────────────────┐
   │ Cadastro Parceiras │  (Parceiras ativas + Condição Comercial vigente)
   └─────────┬──────────┘
             │
             ▼
   Para cada Parceira ativa:
     • cria Parceria em Colaboração
     • cria Snapshot Comercial (imutável)
             │
             ▼
   Publica evento **MesCompilado**
             │
             ▼
   Briefing, Ativação, Logística, Financeiro reagem
   e criam seus próprios agregados (fora deste módulo).
```

---

## 6. Modelo do Domínio

### 6.1 Value Objects

#### MesReferencia
- Formato canônico: `AAAA-MM` (ex.: `2026-07`) — ordenável e comparável, conforme ADR-001 §3.
- Invariantes: `1 ≤ MM ≤ 12`, `AAAA ≥ 2020`.
- Igualdade estrutural: dois VOs são iguais sse `MM` e `AAAA` iguais.
- Ordenação total definida.
- Origem física (Contrato §7.2): projeção sobre `MES_REFERENCIA` +
  `ANO_REFERENCIA` na ACL — nunca vazada para o domínio.

#### CondicaoComercialSnapshot
- Cópia imutável, no instante da compilação, de:
  `valorMensal`, `formatosContratados`, `quantidadePorFormato`.
- Campos PII (`PIX`, `CNPJ`, `Endereco`) NÃO fazem parte do Snapshot
  Comercial; permanecem no agregado Parceira e são acessados por
  referência quando necessário (Contrato §5).

### 6.2 Entidades e Agregado

- **Colaboração Mensal (agregado raiz)**
  - Identidade: `(parceiraId, mesReferencia)` — chave natural.
  - Contém: `SnapshotComercial` (obrigatório, imutável).
  - Estado (§9).

### 6.3 Serviço de Domínio

- **Compilador do Mês**: única entrada para o comando
  `CompilarMes(MesReferencia)`. Idempotente pela chave `MesReferencia`.

### 6.4 O que NÃO pertence a este agregado

Briefing, Ativação, EnvioLogístico e Pagamento são agregados de seus
próprios módulos. O módulo Colaboração Mensal **não os cria**; ele apenas
publica `MesCompilado` para que reajam.

---

## 7. Capacidades cobertas (rastreabilidade)

| Capacidade (04_CAPACIDADES §B) | Coberta por |
|---|---|
| Reconhecer cada período como objeto explícito | §6.1 `MesReferencia` |
| Abrir nova competência materializando o necessário | UC-01 |
| Impedir dupla abertura inconsistente | RN-01, RN-03 |
| Distinguir passado / corrente / futuro | §9 estados + `MesReferencia` |
| Congelar condições comerciais | RN-04, RN-05, INV-04 |

---

## 8. Casos de Uso

### UC-005.01 · Compilar Mês
- **Ator:** Operador Estúdio Elã.
- **Pré-condições:** existe ≥ 1 Parceira ativa; não existe
  `Colaboração Mensal` para essa `MesReferencia`.
- **Fluxo:**
  1. Operador invoca `CompilarMes(mesReferencia)`.
  2. Compilador valida unicidade da `MesReferencia`.
  3. Compilador obtém Parceiras ativas e suas Condições Comerciais.
  4. Para cada Parceira ativa cria uma `Colaboração Mensal` + `Snapshot`.
  5. Persiste atomicamente (tudo ou nada).
  6. Publica `MesCompilado(mesReferencia, colaboracoes[])`.
- **Pós-condição:** competência disponível para módulos vizinhos.
- **Rastreabilidade:** PRD §7 RN-04..RN-06; Capacidades §B.

### UC-005.02 · Arquivar Competência
- **Ator:** Administrador.
- **Pré-condições:** todas as Colaborações da competência em estado
  terminal (Concluída) — validação por consulta a módulos vizinhos via
  contrato publicado.
- **Fluxo:**
  1. Administrador solicita arquivamento.
  2. Módulo verifica ausência de pendências operacionais.
  3. Marca competência como `Arquivada` (imutável).
  4. Publica `CompetenciaArquivada(mesReferencia)`.
- **Pós-condição:** competência somente leitura, para sempre
  (Contrato §6.4).

### UC-005.03 · Consultar Colaboração Mensal
- **Ator:** qualquer papel autorizado (§13).
- Leitura por `mesReferencia` e/ou `parceiraId`.

> **UC-005.02 "Reabrir" da v1.0 foi removido**: viola Contrato §6.4
> (competência arquivada é imutável). Se necessidade futura surgir,
> tratar como ADR próprio.

---

## 9. Máquina de Estados

### Colaboração Mensal

```
Ativa ── (todas obrigações concluídas em módulos vizinhos) ──▶ Concluída
Concluída ── (Arquivamento explícito) ──▶ Arquivada
```

- Não existe `Rascunho`: a compilação é atômica.
- `Arquivada` é terminal e imutável.

### Snapshot Comercial

- Nasce **Congelado**. Sem transições.

---

## 10. Regras de Negócio

| ID | Regra | Origem |
|---|---|---|
| RN-01 | Cada `MesReferencia` possui no máximo uma Colaboração Mensal por Parceira | Capacidades §B; PRD §7 |
| RN-02 | Uma Parceira pode participar de várias competências ao longo do tempo | Modelo Conceitual §Operação |
| RN-03 | Compilação é atômica: cria todas as Colaborações da competência ou nenhuma | RNF-01; ENGENHARIA §2 |
| RN-04 | Snapshot Comercial reflete exatamente as condições vigentes no instante da compilação | Contrato §6.1; PRD §7 |
| RN-05 | Snapshot Comercial é imutável após criação | Contrato §6.4 |
| RN-06 | Alterações posteriores no cadastro NÃO retroagem a competências já compiladas | RN-05 + PRD §7 |
| RN-07 | Toda Colaboração Mensal pertence a exatamente uma `MesReferencia` e uma Parceira | Contrato §6.3 |
| RN-08 | Competência arquivada é imutável | Contrato §6.4 |
| RN-09 | Comando `CompilarMes` é idempotente pela chave `MesReferencia` | RNF-07 |
| RN-10 | Snapshot NÃO carrega PII (`PIX`, `CNPJ`, `Endereco`) | Contrato §5 |

---

## 11. Invariantes

- INV-01 Colaboração Mensal ⟺ (Parceira × MesReferencia) — chave única.
- INV-02 Toda Colaboração Mensal possui exatamente um Snapshot Comercial.
- INV-03 Snapshot Comercial pertence a exatamente uma Colaboração.
- INV-04 Snapshot é imutável.
- INV-05 Competência Arquivada é somente leitura.
- INV-06 Nenhum agregado externo (Briefing, Ativação, EnvioLogístico,
  Pagamento) pode existir sem referência a uma Colaboração Mensal
  compilada.

---

## 12. Eventos de Domínio

Todos os nomes seguem o catálogo oficial (Contrato §8).

| Evento | Payload lógico | Consumidores esperados |
|---|---|---|
| `MesCompilado` | `mesReferencia`, `colaboracoes[]` | Briefing, Ativação, Logística, Financeiro, Portal |
| `SnapshotComercialCongelado` | `colaboracaoId`, `condicaoSnapshot` | Financeiro (interno) |
| `CompetenciaArquivada` | `mesReferencia` | Memória do Domínio |

Regras:

- Eventos representam fato passado.
- Cada evento carrega `mesReferencia` para roteamento por competência.
- Versão de schema: `v1` (Pendência D-01: política de evolução).

---

## 13. Papéis e Permissões

| Operação | Administrador | Operador Estúdio Elã | Parceira |
|---|---|---|---|
| Compilar Mês | ✅ | ✅ | ❌ |
| Arquivar Competência | ✅ | ❌ | ❌ |
| Consultar Colaboração | ✅ | ✅ | ✅ (somente as próprias) |
| Alterar Snapshot | ❌ | ❌ | ❌ |

Origem dos papéis: PRD §2.

---

## 14. Contratos entre Módulos

O módulo Colaboração Mensal **coordena**, não executa responsabilidades
alheias.

### 14.1 Consome (portas de entrada)

| Fonte | Dado consumido | Uso |
|---|---|---|
| Cadastro de Parceiras | Parceiras ativas + Condição Comercial vigente | Compilação |
| Cadastro de Parceiras | Referência à Parceira (id estável, ex.: `INFLU_KEY`) | Vínculo |

### 14.2 Fornece (portas de saída)

| Consumidor | Dado fornecido | Meio |
|---|---|---|
| Briefing | `MesCompilado` | Evento |
| Ativação | `MesCompilado` | Evento |
| Logística | `MesCompilado` | Evento |
| Financeiro | `MesCompilado` + `SnapshotComercialCongelado` | Evento |
| Portal | Consulta de Colaborações da parceira autenticada | Query |
| Memória do Domínio | `CompetenciaArquivada` | Evento |

Nenhum módulo externo escreve diretamente no agregado
`Colaboração Mensal`.

---

## 15. Requisitos Não Funcionais

| ID | Requisito |
|---|---|
| RNF-01 | Compilação é uma operação atômica (tudo ou nada) |
| RNF-02 | Todo objeto criado possui identificador único e permanente |
| RNF-03 | Todas as operações relevantes são auditáveis, sem PII |
| RNF-04 | Snapshot nunca é modificado após criação |
| RNF-05 | Histórico permanece disponível após arquivamento |
| RNF-06 | Módulo é independente da tecnologia de persistência |
| RNF-07 | Comando `CompilarMes` é idempotente e seguro para reprocessamento antes da conclusão |
| RNF-08 | Logs e trilhas de auditoria omitem PII (`PIX`, `CNPJ`, `Endereco`) — Contrato §5 |

---

## 16. Casos de Borda

| ID | Cenário | Resultado esperado |
|---|---|---|
| CB-01 | Competência já compilada | Operação recusada; nenhum efeito colateral |
| CB-02 | Nenhuma Parceira ativa | Compilação recusada; nada é criado |
| CB-03 | Falha durante persistência | Rollback total; nenhum objeto parcial |
| CB-04 | Alteração cadastral após compilação | Afeta apenas competências futuras |
| CB-05 | Tentativa de alterar Snapshot | Operação negada |
| CB-06 | Tentativa de arquivar competência com pendências | Recusada até liberação por módulos vizinhos |
| CB-07 | Retentativa após falha (mesma `MesReferencia`) | Idempotente por RN-09 |

---

## 17. Tratamento de Erros

| Código | Situação |
|---|---|
| CM-01 | Competência já compilada |
| CM-02 | `MesReferencia` inválida |
| CM-03 | Nenhuma Parceira ativa |
| CM-04 | Snapshot inconsistente |
| CM-05 | Falha durante materialização (rollback) |
| CM-06 | Transição de estado inválida |
| CM-07 | Operação não autorizada |
| CM-08 | Tentativa de escrita em competência arquivada |

---

## 18. Rastreabilidade (por regra)

| Item da SPEC | Origem |
|---|---|
| Linguagem §4 | Contrato §2, §4 |
| Modelo §6 | Contrato §5, §6.1–6.3 |
| UC-01 Compilar Mês | Capacidades §B; PRD §7 |
| UC-02 Arquivar | Contrato §6.4; Modelo Conceitual §Memória |
| RN-01..RN-03 | Capacidades §B; PRD §7 |
| RN-04..RN-06 | Contrato §6.1, §6.4 |
| RN-07 | Contrato §6.3 |
| RN-08 | Contrato §6.4 |
| RN-09 | RNF-07; ENGENHARIA §2 |
| RN-10 | Contrato §5 |
| Eventos §12 | Contrato §8 |
| Papéis §13 | PRD §2 |

---

## 19. Definition of Done (única — substitui §17/§20/§30 da v1.0)

A SPEC-005 v2.0 será considerada concluída quando:

- Toda linguagem alinhada ao Contrato §2/§4 (zero ocorrências de "Ciclo").
- Todo evento com nome do catálogo oficial (Contrato §8).
- Toda RN rastreada linha-a-linha (§18).
- Todas as fronteiras de agregado respeitadas (nenhuma criação de
  agregados alheios dentro deste módulo).
- Todos os invariantes verificáveis por teste.
- Todos os casos de borda cobertos por cenário automatizado.
- Nenhuma PII no Snapshot, logs ou eventos.
- Gate Arquitetural aprovado.

---

## 20. Plano de Testes (essenciais)

| Cenário | Resultado esperado |
|---|---|
| C-01 Compilar `MesReferencia` inédita | Colaborações + Snapshots criados, `MesCompilado` publicado |
| C-02 Compilar duas vezes a mesma `MesReferencia` | Segunda chamada é no-op idempotente |
| C-03 Alterar Condição Comercial após compilação | Snapshot da competência não muda |
| C-04 Arquivar competência com todos os módulos concluídos | Estado `Arquivada`, `CompetenciaArquivada` publicado |
| C-05 Arquivar competência com pendências | Recusa com `CM-06` |
| C-06 Tentativa de escrita em Snapshot | Recusa com `CM-05`/`CM-07` |
| C-07 Falha no meio da persistência | Rollback total, nenhum efeito residual |

---

## 21. Pendências de Design (herdadas do Contrato §9)

| ID | Item | Contrato |
|---|---|---|
| D-01 | Política de versionamento dos eventos publicados | — |
| D-02 | Enumeração fechada dos estados de Parceria | Contrato §9 |
| D-03 | Modelo físico de persistência | ADR futuro |
| D-04 | Regra formal de elegibilidade de módulos vizinhos para arquivamento | Contrato §9 |

Estas pendências não bloqueiam a implementação do comportamento aqui
especificado.

---

## 22. Histórico

| Versão | Data | Alteração |
|---|---|---|
| 0.1 | 14/07/2026 | Placeholder inicial. |
| 1.0 | 14/07/2026 | Primeira especificação. |
| **2.0** | **14/07/2026** | **Refinamento arquitetural: alinhamento ao Contrato Soberano (linguagem, eventos, fronteiras de agregado), remoção de reabertura, tratamento de PII, deduplicação estrutural.** |
