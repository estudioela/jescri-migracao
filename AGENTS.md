# AGENTS.md — Orquestração de agentes de IA neste repositório

> Regras práticas para usar Claude Code, Gemini CLI e ChatGPT neste projeto sem conflito. Para o mapa técnico (o que existe e onde), ver `CLAUDE.md`. Para os fluxos do sistema, ver `FLOW.md`.

## Contexto do repositório que importa para orquestração

- Repositório único, projeto Apps Script único (`mae/`, `scriptId` em `mae/.clasp.json`). Não há microsserviços nem múltiplos deploys independentes — **qualquer agente pode acidentalmente afetar produção com `clasp push`**.
- Deploy real acontece só com `cd mae && clasp push` (não é automático em cada commit). Isso significa que um agente pode editar código à vontade sem afetar produção — o risco só existe se ele também rodar `clasp push`.
- A branch `pages-portal` é a origem ao vivo de `portal.estudioela.com` (GitHub Pages, sem staging). Nenhum agente deve commitar/mergear nessa branch sem confirmação explícita do usuário (ver `CLAUDE.md` seção 7).

## Como usar Claude Code neste projeto

- Ler `CLAUDE.md` primeiro sempre — ele já mapeia arquivo+função+linha para cada fluxo, evitando `grep`/exploração de repo inteiro.
- Para qualquer tarefa em `mae/WebApp.js` ou `mae/Index.html`, ler o arquivo inteiro (ambos cabem no contexto: ~900 e ~1570 linhas) em vez de ler trechos — os contratos entre front-end e back-end (nomes de campos no JSON de retorno, códigos de erro) só ficam claros vendo os dois completos.
- Bom para: implementação (editar `mae/*.js`, `mae/*.html`), correções pontuais, expandir automações do `onEdit`/`onFormSubmit`, ajustes de UI no Portal.
- Antes de commitar/dar `clasp push`, confirmar com o usuário — está listado como zona de risco em `CLAUDE.md` seção 7.

## Como usar Gemini CLI neste projeto

- Bom para: varredura ampla (ex.: achar todo lugar que referencia um nome de aba ou campo específico antes de renomear), análise de diffs grandes, resumir mudanças entre duas versões da planilha/documentação.
- Não é o agente que deveria decidir arquitetura ou tocar em `MAP.BASE`/`SETUP.ABAS` sem que o resultado da análise seja revisado por quem vai implementar (Claude) — Gemini levanta informação, não deveria ser o único a decidir uma mudança em zona de risco (`CLAUDE.md` seção 6/7).
- Ao rodar Gemini CLI neste repo, apontar explicitamente para `CLAUDE.md` como contexto inicial em vez de deixar ele explorar `docs/`, `sites/` ou `mae/legacy/` — nenhum dos três é necessário para entender o sistema (ver `CLAUDE.md` seção 8).

## Quando usar cada agente

| Situação | Agente recomendado | Por quê |
|---|---|---|
| Implementar uma função nova, corrigir um bug, editar `Código.js`/`WebApp.js`/`Index.html` | Claude Code | Já tem o mapa de arquivo/função em `CLAUDE.md`; consegue ler os arquivos inteiros e manter os contratos front-end/back-end consistentes. |
| Buscar todas as ocorrências de um campo/nome de aba antes de renomear | Gemini CLI | Tarefa de busca/análise ampla, não exige entender o fluxo de negócio a fundo. |
| Planejar uma mudança estrutural (nova aba, novo fluxo, nova integração) antes de qualquer código ser escrito | ChatGPT (ou Claude em modo plano) | Decisão de arquitetura deve ser discutida antes de qualquer agente editar arquivo — evita retrabalho e conflito entre agentes que já começaram a implementar em paralelo. |
| Revisar segurança/permissões (`appsscript.json`, `oauthScopes`, `executeAs`) | Claude Code, com confirmação explícita do usuário antes de aplicar | É zona proibida (`CLAUDE.md` seção 7) — qualquer agente pode analisar e sugerir, nenhum deve aplicar sem essa confirmação. |

**Divisão recomendada, em uma frase:** Gemini investiga e resume, ChatGPT decide o plano, Claude implementa. Nenhum dos três aplica mudança em zona proibida (`CLAUDE.md` seção 7) sem confirmação explícita do usuário — isso vale para qualquer agente, não é exclusividade do Claude.

## Regras para evitar conflito entre agentes

1. **Um agente por arquivo por vez.** `mae/WebApp.js` e `mae/Index.html` têm contratos cruzados (nome de campo no JSON, código de erro) — duas edições simultâneas e independentes nesses arquivos tendem a divergir sem que nenhum dos dois perceba até o teste manual.
2. **Isolar trabalho em paralelo com worktrees/branches**, nunca dois agentes editando a mesma working copy ao mesmo tempo. Se este repo já estiver com uma tarefa em andamento (branch `worktree-*` ou branch de feature aberta), um segundo agente deve criar sua própria branch/worktree antes de editar, não reusar a mesma.
3. **Não commitar automaticamente.** Cada agente deve parar depois de editar e deixar claro o que mudou; commit/push/PR só acontece com confirmação do usuário (ou segue a política de autonomia configurada para aquele agente especificamente).
4. **Nunca editar a branch `pages-portal` a partir de uma tarefa que começou como "editar o Portal"** — são coisas diferentes (uma é o app, a outra é o redirecionador de domínio). Confundir as duas é a forma mais provável de um agente afetar produção sem perceber.
5. **Antes de tocar em zona de risco** (`CLAUDE.md` seção 6/7: `MAP.BASE`, `SETUP.ABAS`, `scriptId`, `oauthScopes`, `executeAs`/`access`), qualquer agente deve parar e perguntar ao usuário — independente de qual agente for.
6. **Não recriar código legado removido** (`Portal.js`, `Sincronizador.js`, `SincronizarPortal.js`, pastas `_archive_*`/`_backup_*` — ver `CLAUDE.md` seção 6). Se um agente encontrar esses nomes em algum backup/branch antiga, isso não é sinal para restaurar.
7. **Registrar decisões de arquitetura em `ARCHITECTURE.md` ou como comentário no PR**, não deixar só na conversa com um agente — outro agente (ou o mesmo, numa sessão nova) não tem acesso a esse histórico de conversa.
