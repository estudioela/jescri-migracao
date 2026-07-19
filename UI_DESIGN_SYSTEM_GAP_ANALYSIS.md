# UI Design System Gap Analysis — TEAR V2 × Estúdio Elã

> Comparação entre a UI atual (`src/ui/portal-head.html` + 12 páginas) e o
> Design System Estúdio Elã, conforme materializado no export Stitch do projeto
> **"TEAR V2 Design System Foundations"** (`docs/stitch-export/`).
> Data: 2026-07-19. Nenhum código alterado.

## Nota sobre as fontes de referência

- **Não há servidor MCP Stitch conectado a este ambiente** (limitação já
  documentada em `docs/stitch-export/README.md`). A referência Stitch usada é o
  export read-only versionado no repo.
- O export está **parcial**: as pastas `screens/` e `assets/` citadas no README
  não existem mais no repositório; sobraram 3 das 7 análises
  (`02-component-inventory`, `03-shared-layouts`, `04-navigation-relationships`).
  A análise `05-design-tokens-per-screen.md` (tokens exatos por tela) nunca foi
  gerada. **Consequência**: os tokens Elã abaixo vêm dos valores registrados nas
  análises existentes; os hex de tokens secundários (`tertiary`, `on-surface`,
  `surface-container-*`) precisam de re-export ou regeneração — pré-requisito
  registrado na Fase 1 do roadmap.

---

## 1. Estado atual

Resumo (detalhe completo em `UI_AUDIT_REPORT.md`):

- 100% do estilo vive em `portal-head.html` (150 linhas), com tokens CSS
  próprios (`--tear-*`), paleta **verde institucional**, layout de **card único
  centralizado (760px)**, sem shell de navegação persistente.
- Componentes reais: botão (2 variantes), campo de formulário, fieldset-card,
  tabela, mensagem de status, alerta (3 variantes, usado em 1 página), tool-grid.
- Sem webfont, sem fonte display, sem ícones, sem grid editorial.

## 2. Padrões encontrados (decisões existentes que valem preservar)

| Padrão atual | Avaliação |
|---|---|
| Tokens CSS em `:root` com prefixo `--tear-` | **Manter a técnica** — só trocar os valores/vocabulário |
| Partial único injetado via `<?!= include() ?>` | **Manter e ampliar** — é o mecanismo de compartilhamento do GAS |
| Semântica de estado com par cor+fundo (danger/success/info) | Compatível com o approach Elã; manter estrutura |
| `focus-visible` com anel, alvos de 44px, `role="status"` | Acima da referência Stitch (que não trata a11y); **não regredir** |
| Envelope `{success, data, error}` renderizado sem regra de negócio no cliente | Contrato soberano — intocável |
| Navegação por `?pagina=` com recarga total | Preservar (restrição de arquitetura); o shell visual deve funcionar dentro dela |

## 3. Divergências

### 3.1 Cores

Tokens Elã confirmados no export: `primary #9f0003`, `surface #f9f9f9`,
hairline `rgba(58,56,56,0.18)`, nomenclatura Material-3-like
(`on-surface`, `tertiary`, `surface-container-low`, `surface-dim`).

| Token atual | Valor | Equivalente Elã | Ação |
|---|---|---|---|
| `--tear-primary` | `#176b4b` (verde) | `primary #9f0003` (vinho) | **adaptar** — ⚠ única decisão de marca: trocar o verde pelo vinho Elã muda a identidade percebida; confirmar com o responsável antes da Fase 1 |
| `--tear-primary-hover` | `#10543a` | variante de `primary` (não exportada) | adaptar após re-export |
| `--tear-ink` | `#183329` (verde-escuro) | `on-surface` (hex não exportado) | adaptar |
| `--tear-muted` | `#627269` | `tertiary` | adaptar |
| `--tear-canvas` | `#f5f7f3` (esverdeado) | `surface #f9f9f9` (neutro) | adaptar |
| `--tear-surface` | `#ffffff` | `background`/`surface` | manter |
| `--tear-line` | `#dce5dd` (1px sólida esverdeada) | hairline `rgba(58,56,56,0.18)` | **adaptar** — a hairline é assinatura visual Elã |
| `--tear-danger/-bg` | `#b42318` / `#fff2f0` | sem equivalente no export | **manter** (necessidade funcional; Elã não cobre estados de erro) |
| `--tear-success/-bg` | `#157347` / `#ecfdf3` | sem equivalente | manter |
| `--tear-info/-bg` | `#195d91` / `#edf6ff` | sem equivalente | manter |
| — (hardcoded) | `#bac9bd`, `#86958b`, `#fbfdfb`, `#f1f5f1`, borders de alerta | tokens `surface-container-*` | **tokenizar** — eliminar hex soltos |
| `--tear-shadow` | sombra 45px suave | Elã usa hairline + papel, quase sem sombra | adaptar (reduzir ou remover) |

### 3.2 Tipografia

| Aspecto | Atual | Elã (Stitch) | Ação |
|---|---|---|---|
| Corpo | Inter (não carregada) → system | Inter (`font-body-*`) | **convergente** — carregar a webfont |
| Display | inexistente (h1 = Inter bold) | **IvyPresto** (`font-display-*`), tratamento "vowel-italic" no wordmark | **gap maior de identidade** — exige licença Adobe Fonts; definir fallback serif antes da Fase 1 |
| Micro-labels | th `.75rem` uppercase tracked | `font-micro` **lowercase** `tracking-[0.18em]` | adaptar — o lowercase tracked é assinatura Elã |
| Pesos | 400/700/750 ad hoc | escala `font-body-s`… não exportada em detalhe | adaptar após re-export |
| Detalhe de marca | — | CTAs primários com sufixo `:)` | decisão de tom de voz — confirmar se entra no TEAR |

### 3.3 Espaçamento e layout

| Aspecto | Atual | Elã | Ação |
|---|---|---|---|
| Container | card 760px centralizado | `container-max 1026px` dentro de shell | adaptar na Fase 4 |
| Grid | nenhum | `editorial-grid` 12 col, `gap 40px` | adotar nos dashboards |
| Gutter | `clamp(24-48px)` no main; gaps 6/8/10/12/18px sem escala | `gutter 40px`, `px-margin-mobile` | criar escala de espaçamento tokenizada |
| Raio | 20/14/10px misturados | Elã: pill (botões) + cantos retos com hairline | unificar escala |
| Shell admin | inexistente | sidebar fixa `w-64` + top bar (tela 08) | Fase 4 |
| Shell parceira | inexistente | top app bar + bottom nav 4 abas (tela 09) | Fase 4 |
| Ícones | nenhum | Material Symbols Outlined | adotar na Fase 2 |

### 3.4 Componentes — matriz completa

Legenda de ação: **manter** (já adequado) · **adaptar** (existe, restilizar) ·
**criar** (existe no Elã, falta no TEAR) · **não antecipar** (só criar com
demanda real).

| Componente | Arquivo(s) atual(is) | Estado atual | DS Elã | Ação |
|---|---|---|---|---|
| Botão primário | portal-head `button` | sólido verde, radius 10 | `btn-primary-pill` (pill) | adaptar |
| Botão destrutivo | portal-head `[data-acao="rejeitar"]` | sólido vermelho | `btn-destructive` | adaptar |
| Botão secundário | inexistente (tudo é primário) | — | `btn-secondary-outline` | **criar** — ações como "Não, usar outra conta" (login) e filtros pedem hierarquia |
| Botão de ícone | inexistente | — | `btn-icon` | criar na Fase 2 (nav) |
| Input de texto | portal-head | box com borda cheia | `input-underline` (só hairline inferior) | adaptar |
| Label de campo | portal-head `label` | bold .9rem | `field-label` micro lowercase | adaptar |
| Select | financeiro, login | estilo de input | idem input-underline | adaptar |
| Card de item | `fieldset`+`legend` (6 páginas) | fundo `#fbfdfb`, borda 14px | `paper-panel` (hairline, papel) | adaptar |
| Card de KPI | inexistente | — | `kpi-metric-card` / `stat-block` | criar (dashboards) |
| Tabela | financeiro | tabela simples, ok | `data-table` hairline + `list-row-grid` responsivo | adaptar |
| Alerta inline | `#resultado.info/.ok/.erro` (1 página) | preso a ID | `inline-alert` | adaptar → classes, usar em todas |
| Toast | inexistente | — | `toast` | criar na Fase 2 (substitui parte dos `avisar`) |
| Empty state | textos ad hoc | — | `empty-state` | criar |
| Skeleton/loading | texto "Carregando…" | — | `skeleton-loader` | Fase 4; não bloquear fases anteriores |
| Nav superior | `nav` inline por página | links duplicados, sem estado ativo | `top-app-bar` + `sidebar-nav`(admin) | adaptar → partial único com item ativo |
| Bottom nav (mobile) | inexistente | — | `bottom-nav` 4 abas | Fase 4 (portal da Parceira) |
| Paginação | inexistente | listas curtas | `pagination` | não antecipar |
| Modal de confirmação | `window.prompt` (pagamentos) | — | `dialog-confirm` | criar (caso concreto já existe) |
| Breadcrumb | inexistente | — | `breadcrumb` | não antecipar |
| Command palette / bulk bar / media player / dropzone | inexistentes | — | existem no inventário | **não antecipar** |
| Wordmark | `<h1>TEAR</h1>` texto puro | — | `wordmark` "tear v2" vowel-italic | adaptar na Fase 1 (com a fonte display) |
| Avatar / status-dot / timeline | inexistentes | — | existem | timeline: candidata para estados de entrega/envio (Fase 3); demais não antecipar |

## 4. Oportunidades

1. **Custo de fundação baixíssimo**: um único arquivo CSS de 150 linhas
   concentra todo o estilo — trocar tokens ali propaga para as 12 páginas de uma vez.
2. **A hairline + papel Elã simplifica o CSS atual** (remove sombras, fundos
   intermediários e 3 escalas de raio).
3. **O inventário Stitch já resolve os dois maiores buracos de UX** encontrados
   na auditoria: dashboards vazios (templates de dashboard grid/influencer
   dashboard) e feedback pobre (`toast`, `inline-alert`, `empty-state`).
4. **Unificação dos helpers JS** (nav, sessão, feedback) pode entrar na mesma
   leva da Fase 2 sem tocar backend — são partials de UI.
5. **A correção de escape de HTML** (problema nº 1 da auditoria) pode pegar
   carona na migração página a página da Fase 3, padronizando no modelo
   `createElement` que `pagamentos.html` já usa.

## 5. Prioridade

| Prioridade | Item | Justificativa |
|---|---|---|
| **Alta** | Confirmar decisão de marca (verde → vinho `#9f0003`) e licença IvyPresto | Bloqueia a Fase 1 inteira |
| **Alta** | Re-export/regeneração dos tokens Stitch (`screens/` + análise 05) | Sem os hex secundários, a fundação fica em aproximação |
| **Alta** | Tokens + webfonts + hairline no portal-head | Maior alcance por menor esforço |
| **Alta** | Sistema de feedback por classes (`inline-alert` em todas as páginas) | Corrige a desigualdade sucesso/erro |
| **Alta** | Escape de HTML / padrão `createElement` | Segurança + integridade de dados |
| **Média** | Nav partial compartilhado com item ativo + JS comum (sessão unificada) | Elimina duplicação e o gap de sessão das ferramentas |
| **Média** | Botão secundário, empty-state, toast, dialog-confirm | Componentes com caso de uso já existente |
| **Média** | Inputs underline, labels micro, cards paper-panel, data-table | Identidade Elã nas páginas |
| **Média** | Dashboards (Parceira e Equipe) com KPI cards | Páginas mais vazias, referência pronta |
| **Baixa** | Shells (sidebar admin / bottom nav parceira), grid editorial | Fase 4; exige repensar o container |
| **Baixa** | Skeleton, microinterações, timeline visual, dark mode | Refinamento; sem demanda registrada |
