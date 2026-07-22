# Diagnóstico — Conflito de merge `origin/worktree-spec-mvp-completa`

**Status: investigação encerrada. Nenhuma ação corretiva foi executada (mandato do Agente C era somente leitura).**

## Causa raiz (confiança: 92%)

**O merge já havia sido resolvido antes de esta investigação começar.** O
relatório de erro descreve um estado do repositório anterior a
`2026-07-22 01:32:38 -0300`. Desde então, `origin/worktree-spec-mvp-completa`
é ancestral direto do HEAD atual da worktree principal.

```
$ git merge-base --is-ancestor origin/worktree-spec-mvp-completa HEAD
YES - já mesclado

$ git rev-list --left-right --count HEAD...origin/worktree-spec-mvp-completa
68  0   # origin/worktree-spec-mvp-completa não tem nenhum commit que HEAD não tenha
```

Ou seja: rodar `git merge origin/worktree-spec-mvp-completa` **agora**, na
worktree principal, resultaria em `Already up to date.` — não no erro
relatado. O erro não é reproduzível no estado atual do repositório.

### O que realmente aconteceu (linha do tempo, via reflog)

```
ef18225  01:14:28  commit: docs: consolida documentação estratégica e protocolo de sessão   <- HEAD antes do merge
24f7dfc  01:32:38  commit (merge): Merge branch 'worktree-spec-mvp-completa' into feat/ui-design-system-ela
c2afef4  01:36:50  commit: docs: atualiza ESTADO_SESSAO.md pós-merge worktree-spec-mvp-completa
7efbdc8  01:50:15  commit: docs: consolida os 4 documentos do merge worktree-spec-mvp-completa
```

O commit `24f7dfc` é um merge real de duas pontas (`ef18225` +
`7fc9567` = tip de `worktree-spec-mvp-completa`), e sua mensagem confirma
resolução manual/assistida, não fast-forward trivial:

> Integra 16 commits com trabalho já implementado e testado, reconciliando
> uma branch órfã encontrada durante a due diligence do plano estratégico...
> Validado após a resolução: suíte backend 183/183 verde (151 antes do
> merge, +32 novos), Pint limpo, tsc/vite build/oxlint do frontend limpos.
> Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>

Os 7 arquivos citados no chamado (`ParceiraController.php`,
`StoreParceiraRequest.php`, `ParceiraResource.php`, `Parceira.php`,
`CadastroAvancadoTest.php`, `ParceiraTest.php`,
`PublicCadastroPage.tsx`) **são exatamente os arquivos que genuinamente
divergiam** entre `ef18225` (HEAD antes do merge) e `7fc9567` (tip de
`worktree-spec-mvp-completa`):

```
$ git diff --name-status ef18225 7fc9567 -- <7 arquivos>
M   ParceiraController.php
M   StoreParceiraRequest.php
M   ParceiraResource.php
M   Parceira.php
M   CadastroAvancadoTest.php
M   ParceiraTest.php
M   PublicCadastroPage.tsx
```

Isso é consistente com um cenário legítimo de 3-way merge: ambos os lados
(branch principal em rebranding/LGPD e a branch órfã `worktree-spec-mvp-completa`
com o módulo de logística/Parceira) modificaram os mesmos arquivos
independentemente. Se, no momento da tentativa de merge, a worktree
principal também tinha alterações **não commitadas** nesses mesmos
caminhos, o Git aborta com exatamente a mensagem relatada
(`Your local changes to the following files would be overwritten by
merge`) — esse é o comportamento padrão e documentado do Git
(`unpack-trees`/`ORT` recusam sobrescrever um path que tem diferença entre
índice e árvore de trabalho antes mesmo de tentar o merge de conteúdo).
Essas alterações locais foram, então, incorporadas/commitadas como parte
da resolução em `24f7dfc`.

**Conclusão prática:** não há bug de Git, não há corrupção de repositório,
não há causa estrutural (worktree/sparse-checkout/submódulo/hook/processo
externo). O chamado descreve um estado transitório que outra sessão/agente
já resolveu ~2h antes desta auditoria começar (workflow multi-agente
concorrente, conforme mandato de operação autônoma do CLAUDE.md).

---

## Respostas ponto a ponto (checklist original)

| # | Pergunta | Resposta |
|---|---|---|
| 1 | Arquivos têm alterações locais reais? | **Não, agora não.** `HEAD blob == index blob == worktree hash` para os 7 arquivos (idêntico byte a byte). Historicamente, sim — é a causa provável do erro original (ver acima). |
| 2 | Estão em outra worktree? | O branch de origem (`worktree-spec-mvp-completa`) está checked out em `.claude/worktrees/spec-mvp-completa` (linked worktree), mas isso é irrelevante para o erro — ver item da Emenda abaixo. |
| 3 | Sparse-checkout? | Não. `git sparse-checkout list` → `fatal: this worktree is not sparse`. |
| 4 | Submódulo? | Não. `git submodule status` retorna vazio. |
| 5 | Linked worktree? | **Sim, existem 3**: `agente-b-productizacao`, `go-live-runbook`, `spec-mvp-completa`. Não são a causa do erro (ver Emenda). |
| 6 | Conflito de índice? | Não. `git ls-files -v` mostra flag `H` (normal) para todos os 7 arquivos; nenhum unmerged stage (`git ls-files --stage` sem entradas stage 1/2/3). |
| 7 | Conflito de line endings? | Não observado agora; `core.autocrlf=true` está setado mas não há diferença de blob entre índice/HEAD/worktree. Não é a causa. |
| 8 | Conflito de file mode? | Não verificado como divergente; `core.filemode=true`, sem sinais de divergência nos arquivos citados. |
| 9 | Hook alterando arquivos? | Não. `.git/hooks` só contém os arquivos `.sample` padrão — nenhum hook ativo. |
| 10 | Processo externo modificando arquivos? | Sem evidência. mtimes dos arquivos (22 jul, ~01:17-01:18) coincidem com a janela do merge commit (01:32), não com atividade recente/contínua. |
| 11 | Stash relacionado? | Não. `git stash list` vazio (stash é compartilhado entre todas as worktrees do repositório — não há stash algum no momento). |
| 12 | Merge interrompido? | Não. Sem `.git/MERGE_HEAD` na worktree principal nem na linked worktree `spec-mvp-completa`. |
| 13 | Rebase interrompido? | Não. Sem `.git/rebase-merge` / `.git/rebase-apply` em nenhuma das worktrees inspecionadas. |
| 14 | Lock de índice? | Não. `.git/index.lock` inexistente. |
| 15 | Diferença só de metadata? | Não aplicável — não há nem diferença de conteúdo nem de metadata no estado atual. |

---

## Emenda — aprofundamento da hipótese "linked worktree"

**Objetivo 1 — o erro é causado exclusivamente pela linked worktree?**
**Não.** A simples existência de uma linked worktree com o branch
`worktree-spec-mvp-completa` checked out **não bloqueia nem interfere** em
`git merge origin/<branch>` executado em outra worktree. O git só impede
fazer *checkout*/*switch* para um branch já checked out em outro lugar
(erro `fatal: '<branch>' is already used by worktree at ...`) — mas
`git merge` de uma ref remota não faz checkout de branch nenhum, apenas lê
o commit e tenta aplicá-lo ao HEAD atual. A linked worktree é um red
herring nesse chamado.

**Objetivo 2/3 — a linked worktree tem alterações não commitadas, merge
pendente, rebase pendente, cherry-pick pendente, stash próprio, índice
divergente?**

```
$ git -C .claude/worktrees/spec-mvp-completa status
On branch worktree-spec-mvp-completa
Your branch is up to date with 'origin/worktree-spec-mvp-completa'.
nothing to commit, working tree clean

$ git -C .claude/worktrees/spec-mvp-completa status --porcelain=v2
(vazio)

$ ls .git/worktrees/spec-mvp-completa/{MERGE_HEAD,rebase-merge,rebase-apply,CHERRY_PICK_HEAD,index.lock}
todos: No such file or directory
```

Todos negativos. A linked worktree está **limpa**, sem operação em
andamento. Quanto a stash: o `git stash` é um recurso **compartilhado por
todo o repositório** (a stash list não é por-worktree, salvo com
`git stash` explicitamente direcionado); `git stash list` retornou vazio
— não há stash de nenhuma worktree.

**Objetivo 4 — comparação de HEADs:**

```
HEAD worktree principal (feat/ui-design-system-ela): 8d5f316
HEAD linked worktree (worktree-spec-mvp-completa):    7fc9567
origin/worktree-spec-mvp-completa:                    7fc9567
merge-base(HEAD principal, origin/worktree-...):      7fc9567
```

A linked worktree está exatamente em sincronia com seu remoto
(`7fc9567 == origin/worktree-spec-mvp-completa`), e esse mesmo commit é
justamente o *merge-base* entre ela e o HEAD da worktree principal — ou
seja, a worktree principal já **absorveu tudo** que a linked worktree tem
(mais 68 commits adicionais). O diff de conteúdo de `Parceira.php` entre
as duas mostra que a worktree principal tem código *adicional* (consentimento
LGPD) que a linked worktree ainda não tem — divergência unidirecional
esperada (a linked worktree ficou "para trás", não é um conflito).

**Objetivo 5 — por que o Git informa "Your local changes would be
overwritten" mesmo com `git status` limpo?**

Não há contradição *no estado atual* porque, no estado atual, não há
nem alterações locais nem necessidade de merge (já mescla). A mensagem
relatada no chamado foi observada **antes** de `24f7dfc` ser criado,
quando presumivelmente a worktree principal tinha alterações não
commitadas nesses 7 arquivos que colidiam com o que o merge precisava
aplicar. Esse é o comportamento padrão do Git: a checagem de segurança do
`unpack-trees` (usada tanto por `checkout` quanto por `merge`) compara
índice vs. árvore de trabalho *antes* de tentar qualquer merge de
conteúdo, e aborta se houver diferença em um path que o merge precisa
tocar — para não perder trabalho não commitado. Isso não exige
corrupção, hook ou bug: é o design intencional do Git.

**Objetivo 6 — esse comportamento é esperado com múltiplas worktrees?**
Sim, no sentido de que múltiplas worktrees frequentemente geram exatamente
esse tipo de situação: branches de trabalho paralelo (uma por worktree)
divergem nos mesmos arquivos, e quando chega a hora de consolidar
(merge), qualquer edição não commitada na worktree de destino colide com
a mudança recebida. O ponto crítico: o comportamento **não é causado
pela topologia de worktrees em si** (não é preciso ter linked worktrees
para esse erro acontecer — aconteceria igual com dois branches locais
numa única worktree). As linked worktrees aqui são incidentais ao
chamado, não causais.

---

## Impacto

Nenhum, no estado atual. O merge que o chamado descreve já está
integrado e validado (183/183 testes verdes, lint limpo) na branch
`feat/ui-design-system-ela`, que é a branch atualmente ativa na worktree
principal e está em sincronia com `origin/feat/ui-design-system-ela`.

## Risco

Baixo. Não há merge, rebase ou cherry-pick pendente em nenhuma worktree
inspecionada; não há lock de índice; não há stash órfão. O único risco
residual é informacional: se o chamado que originou esta auditoria ainda
estiver "em aberto" em algum board/task tracker, ele deve ser fechado
como resolvido para não gerar retrabalho ou confusão em agentes futuros.

## Forma correta de resolver (apenas documentado — nada foi executado)

Não há nada a resolver tecnicamente: **o merge já está feito**. Passos
recomendados, caso se queira confirmar/formalizar:

1. Rodar `git status` e `git log --oneline -1` na worktree principal para
   confirmar que HEAD é `feat/ui-design-system-ela` @ `8d5f316` (ou
   commit mais recente) e que a árvore está limpa — já confirmado nesta
   auditoria.
2. Rodar `git merge origin/worktree-spec-mvp-completa` (sem `--no-ff`
   forçado) apenas para observar a mensagem `Already up to date.` como
   confirmação formal, se desejado — operação seguríssima e idempotente
   quando já mesclado.
3. Se o objetivo era simplesmente confirmar que o branch órfã
   `worktree-spec-mvp-completa` foi devidamente incorporado, isso já está
   documentado no próprio commit `24f7dfc` e nos arquivos citados no seu
   corpo (`TASK_ROUTER.md §16`, `RELATORIO_CONSOLIDACAO_AUDITORIAS.md`) —
   vale checar se esses documentos já refletem o merge como concluído.
4. Considerar remover a linked worktree `.claude/worktrees/spec-mvp-completa`
   se ela não tiver mais propósito (branch já mesclado e sem commits
   próprios pendentes) — **decisão do responsável do projeto**, fora do
   escopo desta auditoria somente-leitura.

---

*Relatório gerado por auditoria somente-leitura (Agente C). Nenhum
comando de escrita (`merge`, `rebase`, `commit`, `checkout`, `reset`,
`stash`, `clean`, `restore`) foi executado durante esta investigação.*
