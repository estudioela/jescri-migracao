# UI Audit Report — TEAR V2

> Auditoria da camada visual (`src/ui/`) realizada em 2026-07-19.
> Escopo: somente apresentação. Nenhum código foi alterado.
> Fontes: código real de `src/ui/`, `src/entrypoint/Portal.js` (roteador),
> `UI_ARCHITECTURE.md`, `NAVIGATION.md` e `docs/stitch-export/` (referência
> Stitch / Design System Estúdio Elã).

---

## 1. Estado atual

### 1.1 Inventário de arquivos

`src/ui/` contém **13 arquivos HTML** (~1.940 linhas no total):

| Arquivo | Rota (`?pagina=`) | Público | Linhas | Função |
|---|---|---|---|---|
| `portal-head.html` | — (partial via `include()`) | todos | 150 | Único CSS compartilhado do sistema |
| `login.html` | `portal-login` | todos | 267 | OAuth Google (ADR-013), vinculação, onboarding |
| `dashboard.html` | `portal-dashboard` | Parceira | 115 | Início do Portal da Parceira |
| `pendencias.html` | `portal-pendencias` | Parceira | 178 | Pendências da competência + envio de material |
| `perfil.html` | `portal-perfil` | Parceira | 184 | Edição de e-mail, PIX e endereço |
| `financeiro.html` | `portal-financeiro` | Parceira | 195 | Resumo financeiro + histórico (tabela) |
| `admin.html` | `admin` | Equipe | 160 | Moderação de cadastros + hub de ferramentas |
| `compilar-mes.html` | `compilar-mes` | Equipe | 109 | Compilação da Colaboração Mensal |
| `briefing.html` | `briefing` | Equipe | 140 | Preenchimento/publicação de briefing |
| `entrega.html` | `entrega` | Equipe | 152 | Fluxo de entregas (estado-máquina) |
| `envio.html` | `envio` | Equipe | 185 | Envios: endereço, rastreio, status |
| `pagamentos.html` | `pagamentos` | Equipe | 52 | Liberação/confirmação de pagamentos |
| `documentos.html` | `documentos` | Equipe | 46 | Geração de contrato/briefing formal |

Arquitetura confirmada: cada página é um documento HTML completo e independente
servido pelo `doGet` (roteador puro em `Portal.js:28-88`), com navegação por
recarga total (`window.top.location.href + ?pagina=`). O único artefato
compartilhado é `portal-head.html`, injetado por `<?!= include('src/ui/portal-head') ?>`.

### 1.2 Padrão visual vigente (portal-head.html)

- **Tokens CSS** (`:root`): paleta verde institucional — `--tear-primary #176b4b`,
  `--tear-ink #183329`, `--tear-canvas #f5f7f3`, `--tear-line #dce5dd`, mais
  semânticas de estado (danger/success/info com par cor+fundo), `--tear-radius 14px`
  e uma sombra suave.
- **Layout**: card único centralizado (`main` com `width: min(100% - 32px, 760px)`),
  fundo canvas, borda + sombra. Não há shell (sem sidebar, sem top bar persistente,
  sem bottom nav).
- **Tipografia**: pilha Inter → system-ui, 16px base, headings com
  `letter-spacing -.025em` e `clamp()` no h1. **Nenhum webfont é carregado** —
  Inter só renderiza se instalada na máquina do usuário.
- **Formulários**: grid de gap 10px, inputs de 44px de altura mínima,
  `focus-visible` com anel verde translúcido (bom para acessibilidade).
- **Botões**: primário sólido verde, variante destrutiva via seletor de atributo
  `button[data-acao="rejeitar"]`, estados hover/active/disabled definidos.
- **Feedback**: estilização amarrada a IDs (`#mensagem`, `#resultado`) e não a
  classes — só `compilar-mes.html` usa as variantes `info/ok/erro`; as demais
  páginas exibem feedback como texto puro cinza.
- **Responsividade**: um único breakpoint (`max-width: 560px`).

## 2. Componentes encontrados

### 2.1 Componentes CSS reais (definidos em portal-head)

| Componente | Definição | Usado em |
|---|---|---|
| Card de página (`main`) | portal-head | todas |
| Barra de navegação (`nav` + links + botão Sair) | portal-head | todas exceto login |
| Botão primário / destrutivo | portal-head | todas |
| Campo de formulário (label + input/select/textarea) | portal-head | 10 páginas |
| Card de item (`fieldset` + `legend`) | portal-head | admin, briefing, entrega, envio, pagamentos, pendencias |
| Mensagem de status (`#mensagem`) | portal-head | 12 páginas |
| Alerta com variantes (`#resultado.info/.ok/.erro`) | portal-head | **somente compilar-mes** |
| Tabela | portal-head | **somente financeiro** |
| Bloco `pre` (saída de texto) | portal-head | envio, documentos |
| `tool-grid` (grade de atalhos 2 col) | portal-head | somente admin |

### 2.2 Componentes JS duplicados por copy-paste (não compartilhados)

| Helper | Cópias | Observação |
|---|---|---|
| `navegarPara(pagina)` | 12 | Idêntico em todas |
| `avisar(texto)` / `mostrar(texto, tipo)` | 12 | Duas convenções distintas |
| Guarda de token (`sessionStorage` → redirect) | 11 | Idêntico |
| Handler de logout idempotente | 11 | Idêntico |
| `tratarErroDeSessao(erro)` | 5 | **Divergente**: dashboard/pendencias tratam `PC-01`/`AC-03`, financeiro `PF-01`, perfil `PP-01`, admin `AC-03`+`ERR_AUTH_*`; as 6 páginas de ferramenta da equipe **não tratam sessão expirada** |
| Formatador de moeda (`formatarValor`/`dinheiro`) | 2 | Nomes e arquivos diferentes, mesma lógica |
| Renderização de lista via `innerHTML` concatenado | 6 | admin, pendencias, briefing, entrega, envio, financeiro |
| Renderização via `createElement` (segura) | 2 | compilar-mes, pagamentos — **padrão inconsistente com o grupo acima** |

## 3. Problemas visuais e técnicos

Ordenados por severidade.

### Alta

1. **Interpolação de dados do servidor em `innerHTML`/atributos sem escape**
   (`admin.html:81-91`, `pendencias.html:89-99`, `briefing.html:51-56` — este
   injeta valores dentro de atributos `value="..."`, `entrega.html:88-100`,
   `envio.html:120-134`, `financeiro.html:81-98`). Dado com `"`, `<` ou `&`
   corrompe o DOM; além do risco de segurança, quebra o round-trip de edição do
   briefing. `pagamentos.html` e `compilar-mes.html` já fazem certo
   (`createElement`/`textContent`) — o padrão seguro existe no repo, mas não é o dominante.
2. **Sessão expirada não tratada nas 6 ferramentas da equipe** (briefing,
   compilar-mes, documentos, entrega, envio, pagamentos): o erro de token
   aparece como texto bruto, sem redirect para login — inconsistente com o
   Portal da Parceira.
3. **Feedback visual desigual**: só `compilar-mes` tem alertas coloridos
   (info/ok/erro); nas demais páginas sucesso e erro são texto cinza idêntico.
   O CSS de alerta está preso aos IDs `#mensagem`/`#resultado` em vez de classes
   reutilizáveis.
4. **Sem webfont**: a identidade tipográfica (Inter) não é garantida; nenhuma
   fonte display existe (o DS Elã usa IvyPresto para display + Inter para corpo).

### Média

5. **Navegação duplicada e divergente à mão** em cada página: dashboard lista
   3 links, pendencias 3 + span, perfil/financeiro variações próprias; as
   ferramentas da equipe têm só "← Painel da equipe". Não há indicador de
   página ativa em nenhuma tela.
6. **`compilar-mes.html` não tem `<title>`** (única página sem).
7. **Elemento morto**: `pendencias.html:13` tem `<span id="quemEsta">` que
   nenhum script preenche.
8. **`window.prompt` como UI de cópia** da mensagem de cobrança
   (`pagamentos.html:46`) — bloqueante e visualmente alheio ao sistema.
9. **Estados de carregamento apenas textuais** ("Carregando…"); sem skeleton,
   spinner ou desabilitação consistente de formulários (só perfil e
   compilar-mes desabilitam o botão durante a chamada).
10. **Estados vazios pobres**: mensagens variadas ("Nenhuma pendência…",
    "Nenhum Envio…" com maiúscula de domínio vazando para a UI), sem componente
    de empty state.
11. **Raios de borda inconsistentes**: 20px (main), 14px (`--tear-radius`,
    fieldset), 10px (botões, inputs, alertas, pre) — três escalas sem regra.
12. **Cores fora de token**: `#bac9bd`, `#86958b`, `#fbfdfb`, `#f1f5f1`,
    `#beddf6`, `#abebc6`, `#f7c6c1`, `rgba(35,134,91,.28)` hardcoded no
    portal-head.

### Baixa

13. **Responsividade**: um único breakpoint (560px); tabela do financeiro usa
    hack `min-width:110px` por célula; nada pensado para tablet; desktop
    limitado ao card de 760px (o DS Elã trabalha com container de 1026px e
    shell com sidebar).
14. **Acessibilidade** — base boa (lang, `role="status"`, `focus-visible`,
    alvos de 44px, contraste dos tokens principais ≥ 4.5:1), mas: `aria-live`
    explícito só em 6 páginas; tabelas sem `caption`/`scope`; sem gestão de
    foco após renderizações dinâmicas; th `.75rem` uppercase em cinza médio é
    o texto mais frágil do sistema.
15. **`documentos.html` e `pagamentos.html` minificados à mão** (JS em linhas
    únicas) — destoam do estilo do restante e dificultam manutenção.

## 4. Oportunidades de melhoria

1. **Fundação de tokens** (Fase 1): alinhar `:root` do portal-head ao vocabulário
   do DS Elã, eliminar cores hardcoded e unificar a escala de raios/espacos.
   Um único arquivo já concentra 100% do CSS — a migração é barata.
2. **Partials compartilhados via `include()`**: o mecanismo já existe
   (portal-head prova isso). Um `portal-nav.html` (+ um bloco JS comum com
   `navegarPara`/guarda de token/logout/`tratarErroDeSessao` unificado)
   elimina ~400 linhas duplicadas sem tocar em backend.
3. **Sistema de feedback por classes** (`.alert.info/.ok/.erro`, toast/empty
   state do inventário Elã) substituindo o CSS preso a IDs.
4. **Escapador único de HTML** (ou padronização em `createElement`) para as 6
   páginas que concatenam `innerHTML`.
5. **Shells do DS Elã como norte de layout**: o export Stitch define dois
   scaffolds prontos — admin shell (sidebar `w-64` + top bar) e portal mobile
   (top app bar + bottom nav home/tasks/wallet/profile) — que mapeiam 1:1 para
   os dois públicos do TEAR (Equipe / Parceira).
6. **Dashboard da Parceira e da Equipe** hoje são as páginas mais vazias e as
   com maior referência pronta no Stitch (templates B1 dashboard grid e
   influencer dashboard).

## 5. Plano de evolução

O plano detalhado em fases está em `UI_IMPLEMENTATION_ROADMAP.md`; a comparação
token a token e componente a componente com o DS Elã está em
`UI_DESIGN_SYSTEM_GAP_ANALYSIS.md`. Resumo da direção:

1. **Fase 1 — Fundação visual**: tokens Elã no portal-head, webfonts, escala de
   espaçamento/raio, sistema de feedback por classes.
2. **Fase 2 — Componentes compartilhados**: nav partial, JS comum, botões/cards/
   inputs/alertas/empty states alinhados ao inventário Elã.
3. **Fase 3 — Migração página a página** (ordem definida no roadmap), sem
   alterar fluxos nem chamadas `google.script.run`.
4. **Fase 4 — Refinamento**: responsividade (shells), acessibilidade,
   microinterações.

### Anexo — auditoria por página

| Página | Estrutura | UX | Responsivo | Acessibilidade |
|---|---|---|---|---|
| login | 4 painéis de estado bem separados; hierarquia mínima (h1 “TEAR” seco) | Fluxo OAuth claro; mensagens de espera boas; sem indicação de progresso real | OK (card único) | OK; falta foco programático ao trocar painel |
| dashboard | Quase vazia: nav + contagem de pendências | Não orienta a Parceira (sem KPIs, sem atalhos visuais) | OK | OK |
| pendencias | Cards fieldset por item; briefing inline | Bom fluxo; feedback textual apenas; span morto no nav | OK | Inputs gerados sem `for`/`id` |
| perfil | Form linear claro; endereço somente leitura | Aviso de CEP incompleto é bom; salvar desabilita botão (melhor página) | OK | Labels corretos |
| financeiro | Select de competência + resumo + tabela | Duas chamadas paralelas sem coordenação de loading | Tabela com scroll só em `#historico` | Tabela sem caption/scope |
| admin | Moderação + tool-grid | Hub funcional; cadastros pendentes sem dados além de e-mail/papel | OK | innerHTML sem escape |
| compilar-mes | Form simples + lista de resultado | Única página com alertas coloridos; idempotência comunicada | OK | **Sem `<title>`** |
| briefing | Busca → blocos editáveis | Mensagem de status no fim da página (longe da ação) | OK | Valores em atributos sem escape |
| entrega | Busca → cards com ações por estado | Estado da máquina exposto cru (“AguardandoMaterial”) | OK | Inputs gerados sem label associado |
| envio | Busca → cards + painel de confirmação `pre` | Fluxo completo; `pre` como UI de endereço é frágil | OK | OK |
| pagamentos | Cards via createElement (padrão seguro) | `window.prompt` para copiar mensagem | OK | OK |
| documentos | Form 2 botões + saída `pre` | Validação manual com focus() é boa | OK | Labels com input aninhado + `for` redundante |
| portal-head | Fonte única de estilo — ativo mais valioso da UI atual | — | 1 breakpoint | Focus ring e alvos 44px bons |
