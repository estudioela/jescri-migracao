# TEAR V2.5 — Plano de Execução do MVP

Data: 2026-07-20
Papel do autor: Tech Lead de execução (agente), a pedido do responsável
do projeto.
Status: **plano de execução. Nenhum código foi escrito, nenhuma migration
criada, nenhuma arquitetura alterada para produzir este documento.**

**Escopo:** exclusivamente `tear-v2-app/`. Insumo: `docs/BACKLOG_EXECUTIVO_MVP.md`
(38 itens de backlog, 32 histórias implementáveis + 6 itens de decisão
pura, ver §1 — inclui HU-3.6, história nova de onboarding público
adicionada em 2026-07-20 a pedido do responsável do projeto). Este
documento não reabre nenhuma priorização ou regra — só ordena o que o
backlog já define, por dependência real.

---

## 1. Estimativa de histórias

| EPIC | Histórias implementáveis | Itens de decisão pura (sem código) |
|---|---|---|
| 1 — Portal da Influenciadora | 6 (HU-1.1…1.6) | 0 |
| 2 — Regras críticas P0 pendentes | 4 (HU-2.1…2.4) | 1 (HU-2.5) |
| 3 — Cadastro: gaps e conformidade | 5 (HU-3.1…3.4, HU-3.6) | 1 (HU-3.5, recomendação: não reabrir) |
| 4 — Taxonomia Material×Briefing | 1 (HU-4.1, após decisão do PO) | — |
| 5 — Pagamentos: extensões | 3 (HU-5.1…5.3) | 0 |
| 6 — Produto/Variante/Estoque | 2 (HU-6.1…6.2) | 0 |
| 7 — Logística: ficha de retirada | 1 (HU-7.1) | 0 |
| 8 — Permutas | 2 (HU-8.1…8.2) | 1 (HU-8.3) |
| 9 — Contratos | 3 (HU-9.1, 9.2, 9.4) | 1 (HU-9.3, aguarda provedor) |
| 10 — Assessoria | 0 | 1 (HU-10.1) |
| 11 — Histórico legado | 2 (HU-11.1…11.2) | 0 |
| 12 — Métricas de perfil | 1 (HU-12.1) | 0 |
| 13 — Portal da Marca | 0 | 1 (HU-13.1) |
| 14 — Inteligência operacional | 1 (HU-14.1) | 0 |
| Cross-cutting | 1 (CC-1) | 0 |
| **Total** | **32 histórias** | **6 itens de decisão** |

32 histórias de entrega + 1 gate de infraestrutura (CC-1) cobrem o
backlog inteiro derivado da especificação funcional + a história de
onboarding público adicionada nesta revisão. Não inclui a granularidade
de sub-tarefas de execução (ex.: "criar migration" dentro de uma história
não conta como história própria) — cada linha do backlog já é o tamanho
de entrega pequena pedido pelo enunciado.

**Nota de correção (2026-07-20):** a versão anterior deste documento
somava "31 histórias / 5 decisões" — erro aritmético (a coluna de decisão
já somava 6 itens de fato: HU-2.5, HU-3.5, HU-8.3, HU-9.3, HU-10.1,
HU-13.1). Corrigido nesta revisão, junto com a adição de HU-3.6.

---

## 2. Linha de base (já entregue, não recontar)

Sprint 1 (Fundação de dados e acesso) e Sprint 2.1 (Primeiro acesso e
perfil da influenciadora) já concluídas antes deste plano — fonte:
`PLANO_PROXIMA_SPRINT_TEAR_V2.md`, `RELATORIO_CONSOLIDACAO_FINAL_TEAR_V2.md`,
confirmado por leitura de código nesta sessão (`tests/Feature/` já cobre
RBAC, isolamento, reset de senha, consentimento, medidas, cadastro
avançado). P0-1 (gate de pagamento) também já implementado
(`IMPLEMENTACAO_P0_GATE_PAGAMENTO.md`). Este plano começa do que resta.

---

## 3. Princípio de ordenação

Mesmo critério já validado nos quatro documentos-fonte de roadmap
(`ROADMAP_MESTRE_TEAR_V2.md`, `PLANO_IMPLEMENTACAO_TEAR_V2.5.md`,
`HANDOFF_PRODUCTIZACAO_TEAR_V2.md`, `TEAR_V2.5_PRODUCTIZACAO_ROADMAP.md`,
todos concordantes): **não construir tela sobre modelo que ainda vai
mudar**, e **valor de negócio desbloqueado primeiro**, não o que é
tecnicamente mais interessante. Duas regras adicionais, específicas deste
plano:

1. **Itens sem decisão pendente do PO furam a fila** de itens que
   dependem de decisão, mesmo que estejam em EPICs "posteriores" — não
   faz sentido esperar uma resposta do PO com desenvolvedores ociosos
   quando há trabalho P0/P1 desbloqueado.
2. **Histórias 🟠 parcialmente bloqueadas** (ex.: HU-2.4, HU-8.1, HU-9.1)
   começam pela parte não bloqueada — a decisão do PO só precisa chegar
   antes do **fechamento** da história, não antes do início.

---

## 4. Ordem ideal de desenvolvimento (ondas)

Ondas = agrupamento por dependência real, não por capacidade de time —
cada organização decide quantas ondas cabem por sprint. Dentro de uma
onda, os itens podem correr em paralelo por desenvolvedores diferentes,
salvo nota em contrário.

### Onda 0 — Decisões a solicitar imediatamente (paralelo a todo o resto)

Não bloqueiam o início de nenhuma onda de código abaixo, mas quanto mais
cedo chegam, menos retrabalho nas ondas 3-5. Ação: enviar ao responsável
do projeto **agora**, em paralelo à Onda 1:

- Decisão 3 (`ESPECIFICACAO_FUNCIONAL_MVP_COMPLETA.md` §9) — taxonomia
  Material×Briefing. **A mais urgente das cinco** — bloqueia HU-4.1 e,
  por decorrência, HU-1.4 (envio de material pelo Portal), que é o item
  #1 do resumo executivo da especificação.
- Decisão 1 — pagamento recorrente/parcelado (bloqueia só o fechamento
  fino de HU-2.4/HU-2.5, não seu início).
- Decisão 6, 7, 8 — Portal da Marca, Assessoria, provedor de assinatura
  (bloqueiam EPICs inteiros que não entram antes da Onda 5 de qualquer
  forma — sem pressa relativa, mas sem custo em perguntar já).

### Onda 1 — P0 sem bloqueio de decisão (pode começar imediatamente)

Objetivo: fechar todo o P0 que não depende de resposta do PO, incluindo a
maior parte do Portal.

- HU-3.1 (fechar `authorize()` em `POST /parceiras`) — gap de segurança,
  menor esforço, sem dependência. **Primeiro item literal a entrar.**
- HU-3.6 (onboarding público: Landing Page + reprovação de solicitação) —
  sem dependência técnica; maior parte do fluxo já implementada (cadastro
  público, aprovação, listagem de pendentes), escopo real é a Landing
  Page e a ação de reprovar. Entra logo após HU-3.1 por reaproveitar o
  mesmo módulo (`Parceira`/`ParceiraController`/`ParceiraPolicy`) — evita
  reabrir os mesmos arquivos duas vezes em ondas diferentes.
- HU-2.1 (P0-5, cálculo de data de aprovação) — lógica isolada.
- HU-2.2 (P0-2, campos contratuais em Parceira) — schema aditivo puro.
- HU-2.3 (P0-4, Logística mínima) — maior escopo desta onda, sem decisão
  pendente.
- HU-2.4 (P0-3 parte 1, congelamento) — aditivo, independente da
  pergunta de recorrência (decisão 1 pode chegar depois).
- HU-1.1, HU-1.2, HU-1.3, HU-1.5 (Portal: Dashboard, painel de
  Participação, leitura de Briefing, consulta de Pagamento) — nenhuma
  delas toca Materiais, então nenhuma espera a Onda 0/decisão 3.
- HU-1.6 (revisão de UX do Perfil) — sem dependência, baixo esforço,
  pode entrar em qualquer momento desta onda como preenchimento de
  capacidade.

**Critério de saída da Onda 1:** influenciadora loga, vê Dashboard,
abre o painel de uma participação, lê briefing por tipo e consulta
pagamento — só o envio de material (HU-1.4) ainda depende da Onda 2.

### Onda 2 — Destravar Materiais (depende da decisão 3 chegar)

- HU-4.1 (unificação de taxonomia) — só inicia após a decisão do PO
  (Onda 0). É o item de maior alavancagem do plano: sem ele, HU-1.4 não
  pode ser implementada fielmente.
- HU-1.4 (envio de material pelo Portal) — depende de HU-4.1.
- **CC-1 (migração SQLite → Postgres)** — deve completar **antes** de
  HU-1.4 ir a produção com usuárias reais (não bloqueia o
  desenvolvimento de HU-1.4 em si, só o go-live). Pode rodar em paralelo
  às ondas 1-2 se houver capacidade de infraestrutura disponível mais
  cedo.

**Critério de saída da Onda 2:** Portal da Influenciadora completo e em
produção — mesmo critério de conclusão já registrado em
`PLANO_IMPLEMENTACAO_TEAR_V2.5.md` Sprint 2 ("influenciadora real loga,
vê só as próprias campanhas/briefings/materiais/pagamentos, envia
material pelo próprio portal"). **Este é o marco mais importante do
plano** — fecha a lacuna #1 do resumo executivo da especificação.

### Onda 3 — Cadastro: conformidade restante + Produto/Variante

Sem dependência entre si nem da Onda 2 — pode começar em paralelo à Onda
2 se houver capacidade de time (times diferentes, sem contenção de
arquivo/módulo):

- HU-3.2 (validação de Instagram), HU-3.3 (deduplicação de nome), HU-3.4
  (campo observações em medidas) — baixo esforço, sem dependência.
- HU-6.1 (schema Produto/Variante/Estoque) — território novo, sem
  decisão pendente.
- HU-6.2 (validação de variante obrigatória) — depende só de HU-6.1.

### Onda 4 — Logística, Permutas, Pagamentos (extensões)

- HU-7.1 (ficha de retirada automática) — depende de HU-2.3 (Onda 1) +
  HU-6.1 (Onda 3).
- HU-8.1 (escolha de permuta) — depende do Portal maduro (Onda 2) +
  Produto/Variante (Onda 3). Pode implementar com janela configurável
  enquanto a decisão 10 (duração exata) não chega.
- HU-8.2 (confirmação de permuta pela equipe) — depende de HU-8.1.
- HU-5.1 (comprovante de pagamento) — sem dependência técnica, pode
  entrar em qualquer onda a partir daqui conforme capacidade.
- HU-5.2 (histórico de transição de status de pagamento) — idem.

### Onda 5 — Contratos e Histórico Legado

- HU-9.1 (template de contrato editável) — depende de HU-2.2 (Onda 1).
- HU-9.2 (geração de PDF) — depende de HU-9.1.
- HU-9.4 (versionamento imutável) — depende de HU-9.2.
- HU-9.3 (envio para assinatura digital) — só entra se/quando a decisão
  8 (provedor) chegar; até lá, contrato circula fora da plataforma para
  assinatura manual, sem bloquear HU-9.1/9.2/9.4.
- HU-11.1 (importador de histórico legado) — modelo de destino já
  estável a esta altura (Ondas 1-4 fecharam Logística/Produto/Contratos);
  pode iniciar com a estratégia geral já definida (somente leitura,
  registros terminais) mesmo que o escopo fino (decisão 11) ainda não
  tenha chegado.
- HU-11.2 (tela de histórico) — depende de HU-11.1.

### Onda 6 — P2 / evolução futura

- HU-12.1 (métricas de perfil) — sem dependência técnica, baixa
  prioridade de negócio.
- HU-5.3 ("previsto × pago" no Portal) — depende do Portal maduro
  (Onda 2), sem data definida pelas fontes.
- HU-14.1 (extração de URL) — depende de HU-6.1/6.2 maduros e estáveis
  (Onda 3), por design (não amplificar erro sobre modelo ainda mudando).

### Fora de sequência — aguardando decisão isolada, sem onda própria

- HU-2.5 (decisão de compilação em lote) — decisão pura, sem código.
- HU-3.5 (CPF alternativo) — recomendação deste plano: já resolvido
  (decisão anterior do responsável do projeto), não reabrir sem novo
  fato de negócio.
- HU-8.3 (fallback de permuta ao expirar) — decisão pura.
- HU-10.1 (modelo de Assessoria) — decisão pura; se aprovada, entra como
  onda própria pequena (schema + CRUD), estimada em 1-2 histórias
  adicionais não detalhadas neste backlog até a decisão chegar.
- HU-13.1 (Portal da Marca) — decisão pura; se aprovada, é escopo grande
  o suficiente para virar um plano de execução próprio (fora deste
  documento), não uma história isolada.

---

## 5. Caminho crítico do MVP

O caminho crítico é definido pelo objetivo #1 do resumo executivo da
especificação — "a influenciadora ainda não opera o próprio Portal" — e
pelas duas cadeias de dependência que o bloqueiam:

```
Decisão do PO (taxonomia Material×Briefing, Onda 0)
        ↓
HU-4.1 — unificar Material.tipo/Briefing.tipo
        ↓
HU-1.4 — envio de material pelo Portal ───┐
        ↑                                  │
HU-1.1 → HU-1.2 → HU-1.3 (Briefing)        │
        └────────────────────────────────→ ├── Portal completo (marco)
HU-1.2 → HU-1.5 (Pagamento) ────────────────┘
        ↑
CC-1 — migração para Postgres (gate de produção, não de código)
```

**O elo mais longo e mais arriscado do caminho crítico não é técnico —
é a decisão do PO sobre a taxonomia Material×Briefing (Onda 0).** Toda a
Onda 1 pode e deve começar em paralelo enquanto essa resposta não chega
(nenhuma história da Onda 1 depende dela), mas o Portal só se declara
"completo" depois que HU-4.1 e HU-1.4 fecham. Se essa decisão demorar,
o time deve absorver capacidade nas Ondas 1/3 (Cadastro, Produto/Variante)
em vez de ficar ocioso — nenhuma dessas depende da resposta.

Segundo caminho crítico, independente do primeiro: **P0-3 completo**
(HU-2.4 + HU-2.5) trava, por consequência, o desenho de tela de
Campanhas/Participações do lado administrativo, caso a decisão 3 do §5
do backlog (compilação em lote) mude o modelo atual — risco já registrado
em `CONSOLIDACAO_REGRAS_CRITICAS_P0_TEAR_V2.md` P0-3 e
`PLANO_PROXIMA_SPRINT_TEAR_V2.md`. Mitigação: HU-2.4 (congelamento) não
espera essa resposta; só o **fechamento formal** de P0-3 como "concluído"
espera.

---

## 6. O que isso não decide

Este plano ordena entregas — não resolve nenhuma das cinco decisões
pendentes do responsável do projeto (§4, Onda 0 e "Fora de sequência").
Nenhuma delas deve ser assumida por omissão durante a execução; se uma
onda chegar ao ponto de precisar da resposta e ela ainda não tiver
chegado, a história correspondente fica pendente, não é resolvida por
suposição — mesmo princípio já aplicado em todos os documentos-fonte
consolidados.

---

Nenhum código foi escrito, nenhuma migration criada, nenhuma arquitetura
alterada para produzir este documento. Próximo passo, quando autorizado:
iniciar a Onda 1 pelo fluxo obrigatório do projeto (Auditoria → Plano →
Execução → Validação → Commit), começando por HU-3.1 (menor esforço,
fecha gap de segurança real).
