# MK 05 — Plano Estratégico de Reconstrução do Projeto TEAR

> Fonte única de verdade: MK 01 (Operacional), MK 02 (Funcional), MK 03 (Técnico) e MK 04 (Reconstrução).
> Este documento define **o que será feito**, **em que ordem**, **por quem** e **com qual critério de conclusão**.
> Nenhuma funcionalidade foi inventada — todo item rastreia diretamente a um MK.

Legenda de classificação:
- 🟢 **Fazer agora no Lovable** (UI/UX, navegação, telas mockadas com dados fake, design system)
- 🟡 **Fazer manualmente** (decisões de negócio, coleta de assets, definição de conteúdo)
- 🔵 **Preparar para Claude Code** (backend, banco, API, integrações, autenticação real)
- 🔴 **Não fazer agora** (fora de escopo desta sessão / etapa posterior)

---

## 1. Visão Geral

O TEAR é um **ERP operacional + Portal da Influenciadora** para a agência Estúdio Elã. O sistema opera em **ciclos mensais** onde Parceiras "ON" geram automaticamente linhas de Ativações, Logística e Pagamentos (MK 01 §2, MK 02 §3.1).

A reconstrução tem dois consumidores humanos:
1. **Administrador (Equipe Elã)** — decisões, curadoria, gatilhos de ciclo, resolução de exceções.
2. **Parceira (Influenciadora)** — consulta de briefing, upload de conteúdo, acompanhamento de logística e pagamento.

Nesta sessão de **~2 horas no Lovable**, o objetivo é entregar **toda a superfície de UI navegável** (Dashboard Admin + Portal) com dados mockados, design system fiel à semântica de cores do MK 02, máquinas de estado visuais e todos os fluxos clicáveis — deixando pronto o handoff para Claude Code plugar backend/banco/API.

---

## 2. Estratégia de Construção

**Princípio 1 — UI antes de dados reais.** Toda tela é construída com fixtures TypeScript (`src/mocks/*.ts`) que espelham o modelo de domínio do MK 03 (Parceiro, Ativacao, Logistica, Pagamento, Ciclo). Quando o Claude Code chegar, ele troca o fixture por uma chamada de API sem mexer na UI.

**Princípio 2 — Design system primeiro.** O "Mapa de Cores Operacional" do MK 02 §1.1 vira tokens semânticos em `styles.css` (`--state-on`, `--state-off`, `--header-alert`, `--archived`). Nenhum componente usa cor hardcoded.

**Princípio 3 — Máquina de estado como componente.** Ativação e Logística têm estados rigorosos (MK 02 §2). Cada estado é um `<StatusBadge state="aprovada" />` reutilizável — a lógica de transição fica para Claude Code, mas o **vocabulário visual** nasce agora.

**Princípio 4 — Dois shells, uma base.** Admin e Portal compartilham design system, componentes primitivos (`shadcn`), e layout base. Divergem apenas em navegação e permissões visuais.

**Princípio 5 — Rotas type-safe TanStack.** Arquitetura de rotas espelha os módulos de negócio; cada rota tem `head()` próprio (SEO/handoff).

---

## 3. Roadmap das Próximas ~2 Horas

```text
 0:00 ─┬─ BLOCO A · Fundação (25 min)          🟢 Lovable
       │   Design system, tokens, shell layouts, autenticação mockada
 0:25 ─┼─ BLOCO B · Portal da Influenciadora   🟢 Lovable
       │   (35 min) — 5 telas + upload mockado
 1:00 ─┼─ BLOCO C · Dashboard Administrativo   🟢 Lovable
       │   (50 min) — 7 telas + máquinas de estado
 1:50 ─┼─ BLOCO D · Handoff (10 min)           🔵 Prep p/ Claude Code
       │   README de contratos, TODO markers, tipos do domínio
 2:00 ─┴─ Fim da sessão
```

---

## 4. Ordem Ideal das Implementações

1. Tokens de cor + tipografia + `StatusBadge` genérico (bloqueia todo o resto).
2. Layout `_admin` (sidebar) e layout `_portal` (bottom-nav mobile-first).
3. Telas de login mockadas (Admin com senha, Parceira com CUPOM) — sem auth real.
4. Portal: Home → Ativações → Detalhe/Upload → Logística → Pagamentos → Perfil.
5. Admin: Dashboard → Parceiras → Detalhe Parceira → Ciclos → Ativações (Kanban) → Logística → Pagamentos.
6. Modal "Gerar Mês" (o fluxo mais crítico — MK 02 §3.1) como wizard visual.
7. Estados vazios, loaders (skeletons), toasts de feedback.
8. Handoff docs + tipos TS canônicos.

---

## 5. Módulos do Sistema

Rastreabilidade direta com MK 01/02/03.

| # | Módulo | Papel | Origem |
|---|---|---|---|
| M1 | **Parceiras** | CRUD + ON/OFF + capacidade (Reels/Carrossel/Stories) | MK 01 §2.1 |
| M2 | **Ciclos Mensais** | Iniciar mês, arquivar mês, listar ciclos | MK 01 §2.2, MK 02 §3.1 |
| M3 | **Ativações** | Máquina de 10 estados, briefing, upload, aprovação | MK 01 §2.3, MK 02 §2.1 |
| M4 | **Logística** | Máquina de 5 estados, endereço, rastreio | MK 01 §2.4, MK 02 §2.2 |
| M5 | **Pagamentos** | Provisão, liquidação, comprovantes | MK 01 §2.5 |
| M6 | **Autenticação** | Admin (senha) + Parceira (CUPOM+senha) | MK 04 §2.1 |
| M7 | **Portal** | Interface mobile-first da parceira | MK 01 §3.2 |
| M8 | **Dashboard Admin** | Interface web da equipe Elã | MK 04 §3.2 |
| M9 | **Integrações externas** | ViaCEP, Drive, rastreio, e-mail | MK 03, MK 04 §5.1 |

---

## 6. Fluxos-Chave (mapeáveis para telas)

### 6.1. Onboarding de Parceira (MK 01 §2.1)
`Formulário público → Fila de validação Admin → Definição de Fee + Capacidade → Toggle ON → elegível para ciclos`

### 6.2. Geração de Mês — o Compilador (MK 02 §3.1)
`Admin clica "Novo Ciclo" → seleciona competência (ex.: SETEMBRO 2026) → preview de N ativações que serão criadas por parceira ON → confirma → sistema explode Ativações + Logística + Pagamentos`

### 6.3. Ciclo de Ativação (MK 02 §2.1)
`Planejamento → Pronta p/ Envio → Aguardando Recebimento → Em Produção → Aguardando Aprovação ⇄ Em Ajustes → Aprovada → Agendada → Publicada → Concluída → Elegível p/ Pagamento`

### 6.4. Ciclo de Logística (MK 02 §2.2)
`Pendente → Aguardando Envio → Enviado → Entregue` (com `Cancelado` como terminal)

### 6.5. Upload e Aprovação (MK 02 §3.2)
`Parceira faz upload → status vai para "Aguardando Aprovação" → Admin aprova ou devolve para Ajustes com comentário`

### 6.6. Liquidação de Pagamento (MK 01 §2.5, Regra de Ouro 4)
`Ativação atinge "Publicada" → Pagamento fica "Elegível" → Admin confere → marca "Pago" com comprovante`

---

## 7. Telas (Sitemap Completo)

### 7.1. Portal (Parceira) — mobile-first
| Rota | Tela | Depende de | Classe |
|---|---|---|---|
| `/portal/login` | Login por CUPOM + senha | 🔵 auth real | 🟢 UI |
| `/portal` | Home: resumo do ciclo atual, próximas entregas | 🔵 API | 🟢 UI |
| `/portal/ativacoes` | Lista de ativações do mês com badges de estado | 🔵 API | 🟢 UI |
| `/portal/ativacoes/$id` | Detalhe: briefing, look, roteiro, botão de upload | 🔵 API + 🔵 upload | 🟢 UI |
| `/portal/logistica` | Status de envio, endereço, rastreio | 🔵 API + 🔵 rastreio | 🟢 UI |
| `/portal/pagamentos` | Extrato: provisionado, liberado, pago | 🔵 API | 🟢 UI |
| `/portal/perfil` | Dados cadastrais, editar endereço/PIX | 🔵 API + 🔵 ViaCEP | 🟢 UI |

### 7.2. Dashboard Administrativo — desktop-first
| Rota | Tela | Depende de | Classe |
|---|---|---|---|
| `/admin/login` | Login admin | 🔵 auth | 🟢 UI |
| `/admin` | Dashboard: KPIs do ciclo corrente | 🔵 API | 🟢 UI |
| `/admin/parceiras` | Tabela de parceiras com toggle ON/OFF | 🔵 API | 🟢 UI |
| `/admin/parceiras/$id` | Detalhe da parceira: contrato, capacidade, histórico | 🔵 API | 🟢 UI |
| `/admin/parceiras/nova` | Cadastro / validação de inscrição | 🔵 API + 🔵 ViaCEP | 🟢 UI |
| `/admin/ciclos` | Lista de ciclos (mês, status, contadores) | 🔵 API | 🟢 UI |
| `/admin/ciclos/novo` | Wizard "Gerar Mês" (preview + confirmação) | 🔵 job backend | 🟢 UI |
| `/admin/ativacoes` | Kanban por estado (10 colunas) + filtros | 🔵 API | 🟢 UI |
| `/admin/ativacoes/$id` | Detalhe: aprovar / devolver com comentário | 🔵 API + 🔵 upload | 🟢 UI |
| `/admin/logistica` | Tabela com estados + edição de rastreio | 🔵 API | 🟢 UI |
| `/admin/pagamentos` | Fila de liquidação + marcar como pago | 🔵 API | 🟢 UI |
| `/admin/arquivo` | Ciclos arquivados (somente leitura, cinza) | 🔵 API | 🟢 UI |

### 7.3. Estados especiais de tela (todos 🟢)
Loading skeletons · Empty states com CTA · Erro (retry) · 404 · Confirm dialogs para transições destrutivas.

---

## 8. Componentes (Design System)

Todos derivados dos primitivos shadcn já instalados, com **variantes semânticas**:

- `StatusBadge` — 10 variantes de Ativação + 5 de Logística + estados de Pagamento.
- `StateToggle` — ON/OFF grande (verde `#D9EAD3` / vermelho `#F4CCCC`) usando **tokens** (não hex direto).
- `SectionHeader` — usa `--header-alert` (traduz `#cd0005` para oklch).
- `ArchivedRow` — variante cinza para dados imutáveis.
- `KanbanBoard` + `KanbanColumn` + `KanbanCard` (para Ativações).
- `EntityTable` — tabela com colunas de identificação (esquerda), processo (centro), metadados (direita) — reflete MK 02 §1.2.
- `CycleTimeline` — visualização das transições de máquina de estado.
- `UploadDropzone` (visual apenas — Claude Code liga no storage).
- `EmptyState`, `Skeleton*`, `ConfirmDialog`, `Toast` (via sonner já instalado).

---

## 9. Estrutura do Portal (Parceira)

Layout mobile-first com:
- **Header fixo** com nome artístico + `INFLU_KEY` + avatar.
- **Bottom nav** de 4 ícones: Home / Ativações / Logística / Pagamentos.
- **Perfil** acessível pelo header.
- Home mostra: ciclo atual, "próxima entrega", alerta de logística pendente (Regra de Ouro 3: sem produto, sem cobrança).
- Estados visuais idênticos ao Admin (mesmo `StatusBadge`) para alinhar linguagem entre equipe e parceira.

---

## 10. Estrutura Administrativa

Layout desktop com:
- **Sidebar esquerda**: Dashboard, Parceiras, Ciclos, Ativações, Logística, Pagamentos, Arquivo.
- **Topbar**: seletor de ciclo ativo (contexto global), busca, usuário.
- **Área central**: sempre uma das 3 densidades — Kanban (Ativações), Tabela (Parceiras/Logística/Pagamentos), Detalhe (formulário/timeline).
- Ação global "**+ Novo Ciclo**" persistente na topbar (é o gatilho crítico do MK 01 §3.1).

---

## 11. Dependências (matriz)

| Necessidade | Backend | Banco | Auth | Upload | API externa |
|---|:-:|:-:|:-:|:-:|:-:|
| Renderizar telas com mock | — | — | — | — | — |
| Login funcional | ✅ | ✅ | ✅ | — | — |
| CRUD parceiras persistente | ✅ | ✅ | ✅ | — | — |
| Geração de mês real | ✅ | ✅ | ✅ | — | — |
| Upload de conteúdo | ✅ | ✅ | ✅ | ✅ | Drive |
| Rastreio de envio | ✅ | ✅ | ✅ | — | Transportadora |
| Enriquecimento CEP | ✅ | — | — | — | ViaCEP |
| Envio de e-mail | ✅ | — | — | — | Provedor SMTP |

Regra: **tudo que não tem ✅ pode nascer no Lovable agora.**

---

## 12. O que Será Feito Manualmente 🟡

- Coleta/definição da paleta final em oklch (traduzir hex do MK 02 sem perder semântica).
- Escolha de tipografia (evitar Inter/Poppins genéricos — MK 04 valoriza diferenciação).
- Redação dos microcopys em pt-BR (mensagens de erro, empty states, confirm dialogs).
- Definição de quais KPIs entram no Dashboard Admin (sugestão: ativações por estado, % publicadas no mês, pagamentos pendentes, parceiras ON).
- Validação humana do vocabulário de estado (o MK 02 usa "ajustes" para "Aguardando Revisão" — decidir label final).

---

## 13. O que Fica para Claude Code 🔵

1. **Modelagem de banco** (PostgreSQL): tabelas `parceiras`, `ciclos`, `ativacoes`, `logistica`, `pagamentos`, `usuarios`, `sessoes`, `auditoria`, com UUIDs (MK 02 §4).
2. **API REST/GraphQL** seguindo o padrão Controllers/Services/Repositories do MK 03.
3. **Máquinas de estado no backend** (validação de transições permitidas — MK 02 §2).
4. **Job de Geração de Mês** (o "Compilador" — MK 02 §3.1).
5. **Autenticação**: Admin com senha + JWT; Parceira com CUPOM + senha; hash bcrypt/argon2.
6. **RBAC** e proteção de rotas.
7. **Uploads** (Drive ou S3-compatível) com fail-safe (MK 04 §2.1).
8. **Integrações**: ViaCEP, rastreio, e-mail transacional.
9. **Cron jobs**: geração de ciclo, atualização de rastreio, lembretes.
10. **Migração** dos dados legados das planilhas (MK 04 §5.2).
11. **Testes automatizados** (MK 04 §4.1 — dívida técnica prioritária).
12. **Monitoramento e logging centralizado**.

---

## 14. Cronograma Detalhado (Tarefas Classificadas)

> Todas as tarefas 🟢 têm como executor **o agente Lovable (esta sessão)**.
> Tarefas 🔵 têm como executor **Claude Code (sessão futura)**.
> Tarefas 🟡 têm como executor **você (humano)**.

### BLOCO A — Fundação (25 min) 🟢

| # | Tarefa | Objetivo | Resultado esperado | Tempo | Dependências |
|---|---|---|---|---|---|
| A1 | Design tokens em `styles.css` | Traduzir mapa de cores do MK 02 para oklch semântico | `--state-on`, `--state-off`, `--header-alert`, `--archived` disponíveis como classes Tailwind | 5 min | — |
| A2 | Tipografia + escala | Definir fonte display + body distintivas | `<h1>` a `<p>` consistentes | 3 min | A1 |
| A3 | Tipos de domínio TS | Codificar entidades do MK 03 (`Parceira`, `Ativacao`, `Logistica`, `Pagamento`, `Ciclo`, estados) | `src/domain/types.ts` | 5 min | — |
| A4 | Fixtures mockados | 6–8 parceiras, 1 ciclo ativo, ~20 ativações em estados variados | `src/mocks/*.ts` | 5 min | A3 |
| A5 | `StatusBadge` + `StateToggle` | Componentes de estado reutilizáveis | Variantes para todos os 10+5 estados | 4 min | A1, A3 |
| A6 | Layouts `_admin` e `_portal` | Shells de sidebar e bottom-nav | Rotas aninhadas prontas | 3 min | A1 |

### BLOCO B — Portal da Parceira (35 min) 🟢

| # | Tarefa | Tempo | Depende |
|---|---|---|---|
| B1 | `/portal/login` (mock) | 4 min | A6 |
| B2 | `/portal` home com resumo do ciclo | 6 min | A4, A5 |
| B3 | `/portal/ativacoes` lista com badges | 6 min | A5 |
| B4 | `/portal/ativacoes/$id` detalhe + `UploadDropzone` visual | 8 min | A5 |
| B5 | `/portal/logistica` timeline de envio | 5 min | A5 |
| B6 | `/portal/pagamentos` extrato | 3 min | A4 |
| B7 | `/portal/perfil` | 3 min | A4 |

### BLOCO C — Dashboard Administrativo (50 min) 🟢

| # | Tarefa | Tempo | Depende |
|---|---|---|---|
| C1 | `/admin/login` (mock) | 3 min | A6 |
| C2 | `/admin` dashboard com KPIs mockados | 7 min | A4 |
| C3 | `/admin/parceiras` tabela + toggle ON/OFF | 7 min | A5 |
| C4 | `/admin/parceiras/$id` + `/nova` | 8 min | A5 |
| C5 | `/admin/ciclos` lista | 4 min | A4 |
| C6 | `/admin/ciclos/novo` **Wizard Gerar Mês** (preview de N linhas) | 8 min | A4 |
| C7 | `/admin/ativacoes` **Kanban 10 colunas** | 8 min | A5 |
| C8 | `/admin/ativacoes/$id` (aprovar/devolver) | 3 min | A5 |
| C9 | `/admin/logistica` e `/admin/pagamentos` | 2 min | A5 |

### BLOCO D — Handoff (10 min) 🔵-prep

| # | Tarefa | Objetivo |
|---|---|---|
| D1 | `docs/HANDOFF_CLAUDE_CODE.md` | Listar todos os pontos de integração (marcados com `// TODO(claude-code):`) |
| D2 | Contratos de API rascunhados | Assinaturas TS que os endpoints deverão respeitar |
| D3 | Checklist de auth + upload + integrações | Referência rápida do que ligar |

### Fora desta sessão 🔴

- Autenticação real, banco, migrações, cron, webhooks, e-mail, rastreio, ViaCEP, testes E2E, monitoramento.

---

## 15. Checklist de Execução

**Fundação**
- [ ] Tokens de cor semânticos em `styles.css` (nada de hex em componentes)
- [ ] Tipografia distintiva definida
- [ ] `src/domain/types.ts` cobrindo todas as entidades do MK 03
- [ ] Fixtures cobrindo pelo menos 1 parceira em cada estado
- [ ] `StatusBadge` com 100% dos 15 estados do MK 02

**Portal**
- [ ] 7 rotas do portal criadas com `createFileRoute` correto
- [ ] Bottom-nav funciona em mobile
- [ ] Todas as telas têm loading skeleton + empty state
- [ ] Upload é visualmente completo (dropzone + preview) — sem lógica real

**Admin**
- [ ] Sidebar com todas as entradas do sitemap
- [ ] Kanban de Ativações renderiza cards em cada uma das 10 colunas
- [ ] Wizard "Gerar Mês" mostra preview antes de confirmar
- [ ] Toggle ON/OFF usa as cores corretas do MK 02

**Handoff**
- [ ] Todo ponto que precisa de backend está marcado com `// TODO(claude-code):`
- [ ] `HANDOFF_CLAUDE_CODE.md` lista contratos de API sugeridos
- [ ] Nenhuma tela quebra sem backend (todas rodam com mock)

---

## 16. Critério de Conclusão por Etapa

| Etapa | "Pronto" significa |
|---|---|
| Fundação | Build passa, `StatusBadge` renderiza todos os estados, tokens não têm hex hardcoded em componentes |
| Portal | Uma parceira fictícia consegue navegar do login até visualizar uma ativação e "fazer upload" (mock) sem erro |
| Admin | Um admin fictício consegue: ver dashboard, alternar parceira ON/OFF, abrir wizard de novo ciclo, mover card no Kanban visual, aprovar ativação |
| Handoff | Leitura do `HANDOFF_CLAUDE_CODE.md` permite a outro agente saber exatamente **onde** ligar o backend em cada tela |

---

## 17. Próximos Passos

1. **Você aprovar este plano** (ou pedir ajustes de escopo/prioridade).
2. Executar **BLOCO A** (fundação) — a partir daí, o restante flui.
3. Ao final da sessão, publicar preview e revisar as duas jornadas (Admin + Parceira) juntos.
4. Sessão seguinte com **Claude Code**: começar por schema do banco + auth + endpoint de "Gerar Mês" (o fluxo mais crítico).
5. Sessões subsequentes: integrações (ViaCEP, Drive, rastreio) e migração dos dados legados.

---

### Decisões arquiteturais justificadas

- **Mobile-first no Portal, desktop-first no Admin**: reflete a realidade de uso do MK 01 §3 — parceiras usam celular, equipe Elã usa desktop.
- **Kanban para Ativações**: 10 estados lineares com ramificações (MK 02 §2.1) são cognitivamente mais claros em colunas do que em tabela.
- **Wizard para Gerar Mês**: é a operação mais destrutiva/impactante do sistema (cria N × M linhas — MK 02 §3.1). Precisa de preview + confirmação explícita.
- **StatusBadge unificado entre Portal e Admin**: garante que parceira e equipe usem o mesmo vocabulário visual, reduzindo erro de comunicação.
- **Tokens semânticos, não cores diretas**: MK 02 §1.1 define significado sistêmico das cores — se um dia mudarem o hex, o significado permanece.
- **UUIDs no domínio desde já** (MK 02 §4): mesmo com dados mockados, IDs são UUID para não gerar retrabalho quando Claude Code plugar o banco.

---

*Fim do MK 05. Próxima ação sugerida: aprovar e iniciar o BLOCO A.*
