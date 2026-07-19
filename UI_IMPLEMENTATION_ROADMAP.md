# UI Implementation Roadmap — TEAR V2

> Plano de evolução visual incremental. Baseado em `UI_AUDIT_REPORT.md` e
> `UI_DESIGN_SYSTEM_GAP_ANALYSIS.md` (2026-07-19).
> Princípio: **evolução, não redesign** — preservam-se fluxos, páginas,
> chamadas `google.script.run`, arquitetura frontend/backend e comportamento
> funcional. Nenhuma fase toca backend, APIs ou regras de negócio.

## Pré-requisitos (antes da Fase 1)

| # | Item | Tipo |
|---|---|---|
| P1 | Confirmar decisão de marca: adotar `primary #9f0003` (vinho Elã) no lugar do verde `#176b4b` | decisão humana (marca) |
| P2 | Definir fonte display: licença IvyPresto (Adobe Fonts) ou fallback serif aprovado | decisão humana (licença) |
| P3 | Regenerar export Stitch (`screens/*/code.html`) ou a análise `05-design-tokens-per-screen.md` para obter os hex de `on-surface`, `tertiary`, `surface-container-*` | tarefa técnica |
| P4 | Confirmar se o sufixo `:)` dos CTAs Elã entra no tom de voz do TEAR | decisão humana (opcional — default: não usar) |

---

## Fase 1 — Fundação visual

**Escopo: apenas `portal-head.html`** (propaga para as 12 páginas automaticamente).

- **Tokens**: substituir os valores `--tear-*` pelo vocabulário Elã
  (primary, on-surface, tertiary, surface, surface-container-*, hairline),
  mantendo o prefixo e a técnica atuais. Eliminar os 8 hex hardcoded.
  Manter os tokens funcionais de estado (danger/success/info) que o Elã não cobre.
- **Tipografia**: carregar Inter como webfont; adicionar a fonte display (P2)
  para h1/wordmark; escala de micro-labels lowercase tracked.
- **CSS base**: hairline `rgba(58,56,56,0.18)` no lugar das bordas sólidas;
  reduzir/remover sombra; unificar a escala de raios (pill para botões,
  cantos discretos para superfícies).
- **Variáveis de espaçamento**: escala tokenizada (base 8px, gutter 40px)
  substituindo os gaps ad hoc 6/8/10/12/18px.
- **Feedback**: converter `#mensagem`/`#resultado` em classes `.alert.info/.ok/.erro`
  reutilizáveis (mantendo os IDs funcionando durante a transição).

**Critério de conclusão**: as 12 páginas renderizam com a nova fundação sem
nenhuma alteração nos arquivos de página.

## Fase 2 — Componentes compartilhados

Novos partials via `<?!= include() ?>` (mecanismo já existente):

- **Buttons**: primário pill, secundário outline (novo), destrutivo, icon button.
- **Cards**: `paper-panel` (evolução do fieldset-card), KPI/stat card.
- **Inputs**: underline input/select/textarea, `field-label` micro.
- **Navegação**: `portal-nav.html` — partial único com links por público
  (Parceira / Equipe), **indicador de página ativa** e botão Sair.
- **Feedbacks**: `inline-alert` em todas as páginas, `toast`, `empty-state`,
  `dialog-confirm` (substitui o `window.prompt` de pagamentos).
- **JS comum** (`portal-common.html`): `navegarPara`, guarda de token, logout,
  `tratarErroDeSessao` unificado (cobrindo os códigos `PC/PF/PP-01`, `AC-03` e
  `ERR_AUTH_*`), formatador de moeda e helper de escape de HTML.

**Critério de conclusão**: componentes documentados no próprio partial;
nenhuma página migrada ainda (Fase 3), mas partials prontos para consumo.

## Fase 3 — Migração das páginas

Ordem sugerida (uma página por unidade de trabalho, validação visual antes da
próxima):

1. `portal-head.html` — consolidação final da fundação (limpeza dos estilos legados por ID)
2. `login.html` — porta de entrada; wordmark display; hierarquia dos 4 painéis
3. `dashboard.html` — KPI cards (template influencer dashboard do Stitch); atalhos visuais
4. `perfil.html` — inputs underline; já é a página com melhor UX, migração de baixo risco
5. `briefing.html` — blocos como paper-panel; **corrigir escape em atributos**; mensagem próxima da ação
6. `entrega.html` — cards por estado; rótulos de estado legíveis (não expor `AguardandoMaterial` cru)
7. `envio.html` — idem; painel de confirmação sai do `pre` para paper-panel
8. `financeiro.html` — data-table hairline responsiva; loading coordenado das duas chamadas
9. `pagamentos.html` — dialog-confirm no lugar do `window.prompt`; desminificar
10. `admin.html` — tool-grid com ícones Material Symbols; moderação com paper-panels
11. `pendencias.html` — cards + empty-state; remover span morto `#quemEsta` *(complemento à lista original)*
12. `compilar-mes.html` — adicionar `<title>`; alerta já migrado na Fase 1 *(complemento)*
13. `documentos.html` — desminificar; saída em paper-panel *(complemento)*

> As posições 11–13 completam a lista de 10 páginas fornecida, que não incluía
> `pendencias`, `compilar-mes` e `documentos` — nenhuma página fica para trás.

Regras transversais da Fase 3 (aplicadas em cada página migrada):

- trocar concatenação `innerHTML` por `createElement`/escape (padrão de `pagamentos.html`);
- adotar o `tratarErroDeSessao` unificado (fecha o gap das 6 ferramentas da equipe);
- estados vazio/carregando/erro explícitos com os componentes da Fase 2;
- zero mudança em nomes de funções `google.script.run` e payloads.

## Fase 4 — Refinamento

- **Responsividade**: breakpoints tablet; container `1026px`; avaliar os shells
  Elã — sidebar `w-64` para as páginas da Equipe e top app bar + bottom nav
  (Início / Pendências / Financeiro / Perfil) para o Portal da Parceira, dentro
  da navegação por `?pagina=` existente.
- **Acessibilidade**: `aria-live` consistente, `caption`/`scope` em tabelas,
  gestão de foco após renderização dinâmica e troca de painéis no login,
  revisão de contraste dos micro-labels.
- **Microinterações**: transições discretas, skeleton-loader nas listas,
  feedback de progresso em operações longas (compilar mês).

---

## Governança

- Cada fase fecha com validação (lint + testes existentes verdes + conferência
  visual das páginas afetadas) antes de commit, seguindo o fluxo
  Auditoria → Plano → Execução → Validação → Commit do CLAUDE.md.
- Mudanças de arquitetura visual estrutural (ex.: adoção dos shells na Fase 4)
  merecem ADR próprio antes da execução.
- Este roadmap não cria componentes sem caso de uso registrado — itens
  marcados como "não antecipar" no gap analysis ficam fora até haver demanda.

**Status: aguardando aprovação para iniciar a implementação.**
