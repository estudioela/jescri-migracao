# ESTADO_SESSAO.md — Protocolo Operacional do Projeto

> Reescrito por `/fim` ao final de cada sessão; lido por `/comecar` no início
> da próxima. É o **cockpit** — snapshot curto e sempre atual. Não duplica
> histórico: para decisões de SPEC e histórico completo, ver
> `docs/_workspace/TASK_ROUTER.md`; para fases/calendário do negócio, ver
> `docs/planning/PLANO_MESTRE_ELA_INFLUENCIA.md`; para a lista de leitura
> obrigatória antes de alterar código, ver `CLAUDE.md` §Documentos oficiais.

## 1. Estado atual

- **Data desta atualização:** 2026-07-23.
- **`main` (remoto, `origin/main`):** inclui a limpeza estrutural de 6
  rodadas (`feat/ui-design-system-ela`, mesclada — ver `TASK_ROUTER.md`
  §42-§44). Último commit em `origin/main`: `c96d460`.
- **Achado nesta sessão — `main` local está 1 commit à frente do
  remoto, nunca pushado:** `8060e18 docs(governance): establish Phase 2
  governance model` (cria `docs/governanca/GOVERNANCA_DO_PROJETO.md`,
  reescreve `ESTADO_SESSAO.md` e altera `docs/handoff/README.md`). Existe
  também uma branch `docs/governance-phase2` (local e em `origin`) com o
  mesmo commit. Não investigado a fundo nem tocado nesta sessão — fora
  de escopo da missão desta sessão. Ver §4.
- **Duas branches com PR draft aberta, pendentes de decisão de
  push/merge, sem relação entre si:**
  1. `worktree-fix-dev-env` — **PR #78** — correção do ambiente de
     desenvolvimento local (`composer dev` unificado). Commit mais
     recente `10a8298`, pushado. Nenhuma ação de código pendente, só
     decisão de merge.
  2. `docs/ai-constitution-notebooklm` — **PR #79** — `docs/
     AI_CONSTITUTION.md` (criada na sessão anterior, **reescrita nesta
     sessão** como constituição de engenharia) + reenvio completo do
     notebook do NotebookLM (sessão anterior). Commit mais recente
     `e6892b9`, pushado.
  Nenhuma das duas branches depende da outra; podem ser mescladas em
  qualquer ordem. Nenhuma delas inclui o commit `8060e18` de `main`.
- **Working tree desta sessão:** limpo (tudo commitado e pushado).
- **Go-Live de produção: continua NÃO AUTORIZADO**, pendente só de
  infraestrutura externa ao código (inalterado — ver
  `docs/release/GATE_FINAL_GO_LIVE.md`).

## 2. Última sessão concluída — `AI_CONSTITUTION.md` reescrita como
    constituição de engenharia + 3 regras de governança fixadas (2026-07-23)

Sessão sem alteração de código de `tear-v2-app/`. Duas frentes:

1. **Verificação de missão já concluída:** a conversa começou (pós
   `/clear`) com o reenvio do mesmo prompt de "preparar base para o
   NotebookLM" já executado antes do clear (commits `75d5f2e`/`9e47c86`,
   PR #79). Investigado e confirmado que já estava tudo commitado e
   pushado — nenhuma ação repetida, só relatório do estado real.
2. **`docs/AI_CONSTITUTION.md` reescrita por completo** a partir de
   `BASE.docx` (anexado pelo responsável do projeto), substituindo o
   conteúdo da sessão anterior (papéis de IA) por uma constituição de
   engenharia: Hierarquia das Verdades, Mandamentos da IA, regras de
   código/bugs/documentação, critérios de qualidade, critérios de
   interrupção. `CLAUDE.md` §Fonte de decisão passou a referenciá-la como
   autoridade máxima de engenharia. Commit `e6892b9`, pushado na PR #79.
3. **Três regras de governança fixadas pelo responsável do projeto**,
   registradas na memória do agente (não em arquivo do repositório):
   `AI_CONSTITUTION.md` congelada (só muda por pedido explícito ou
   revisão formal), **Lei da Evidência** (rotular toda afirmação como
   confirmado-no-código / confirmado-na-documentação / inferência /
   sugestão) e **Lei da Intervenção Mínima** (menor correção localizada
   primeiro; mudança ampla exige justificativa técnica). O responsável
   do projeto confirmou explicitamente que as duas últimas são
   comportamentais, não edições ao documento constitucional.
4. Detalhe completo: `docs/_workspace/TASK_ROUTER.md` §46.

## 3. Próxima tarefa recomendada

Nenhuma pendência de código nesta sessão. Decisão do responsável do
projeto entre:

1. **Esclarecer o commit `8060e18` órfão em `main` local** (§1/§4) —
   decidir se é pushado para `origin/main`, descartado, ou se pertence
   só à branch `docs/governance-phase2` e `main` local deve ser
   realinhado a `origin/main`. Recomendo resolver isso antes de mesclar
   qualquer uma das PRs abertas, para não gerar divergência de histórico.
2. **Merge/push das duas PRs abertas** (#78 dev-env, #79 docs/
   AI_CONSTITUTION+NotebookLM) — independentes entre si, mas ambas
   partiram de `origin/main` antes do commit `8060e18`.
3. **Confirmar se as ~22 fontes legadas remanescentes no notebook
   `tear`** (da limpeza manual do responsável do projeto, sessão
   anterior) devem ser removidas ou mantidas.
4. **Reorganização dos repositórios GitHub** (fase anunciada, ainda não
   iniciada).
5. **Autorizar preparação de infraestrutura de produção** (único
   bloqueio real para o Go-Live, ver `docs/release/GATE_FINAL_GO_LIVE.md`).

## 4. Pendências/bloqueios (decisão do responsável do projeto)

- **Commit `8060e18` em `main` local, nunca pushado, criando
  `docs/governanca/GOVERNANCA_DO_PROJETO.md`** — não investigado a
  fundo nesta sessão (fora de escopo). Risco de duas fontes de verdade
  sobre o mesmo assunto (esse documento já declara os mesmos princípios
  de "estado ≠ histórico" que `TASK_ROUTER.md`/`ESTADO_SESSAO.md` já
  seguem na prática) — ver §5.
- **Merge das PRs #78 e #79** — ver §3.2.
- **~22 fontes legadas no notebook `tear`** não removidas (inalterado).
- **Nenhum bloqueador funcional (Categoria A) em aberto** no código de
  `tear-v2-app` — inalterado, nenhum código tocado nesta sessão.
- **12 decisões de negócio pendentes só no histórico do Git** (inalterado
  desde a limpeza estrutural): `docs/planning/
  ESPECIFICACAO_FUNCIONAL_MVP_COMPLETA.md` §9 tinha 12 decisões do
  responsável do projeto ainda em aberto (recorrência/parcelamento já
  tem rastreamento próprio; as outras 11 só recuperáveis via `git show`
  no commit `fe5ccf8`→`3057e79`).
- **Congelamento de Participação incompleto frente ao gap real**
  (`ADR-018`) — inalterado.
- Validação ponta a ponta dos 2 fluxos de e-mail (convite, reset) com
  SMTP real — não executada (inalterado).
- SPF/DKIM/DMARC do domínio `elafashionmkt.com.br` não verificados
  (inalterado).
- Limite diário de envio do plano Locaweb não levantado (inalterado).
- Recorrência/parcelamento de pagamento não implementado — limitação de
  escopo conhecida, não bug (inalterado).
- Estratégia de infraestrutura do PostgreSQL, autenticação de deploy,
  DNS de `influencia.estudioela.com` — inalterados (ver
  `docs/release/GATE_FINAL_GO_LIVE.md`).
- **Categoria B (não bloqueia certificação funcional, inalterado):**
  `Pagamento.valor` editável mesmo com `status=PAGO` sem auditoria;
  Pagamento e cancelamento de Participação não se checam mutuamente;
  Campanha `ENCERRADA`/`CANCELADA` continua 100% editável; Participação
  pode ser criada em Campanha já encerrada; `PagamentoController` sem
  `DB::transaction`/lock; e-mail sem unicidade entre Parceiras;
  mensagens de erro genéricas no Login; `/login` sem rate-limit por
  e-mail; `CadastroPublicoController::store()` não trata `QueryException`
  de nome duplicado concorrente; usuário sem role recebe `AppShell`
  administrativo completo; `email` não normalizado em
  `StoreParceiraRequest`.

## 5. Riscos ativos

1. **Divergência de histórico entre `main` local e `origin/main`**
   (commit `8060e18` não pushado) — se outra sessão/worktree pushar
   `main` primeiro sem esse commit, ou se ele for esquecido, o trabalho
   de "Governança Fase 2" pode se perder ou conflitar (novo, esta sessão).
2. Perda de rastreabilidade de até 11 decisões de negócio pendentes
   (ver §4) — mitigável recuperando o arquivo do histórico do Git, não
   feito automaticamente (inalterado).
3. PostgreSQL indisponível no plano atual da Locaweb (inalterado).
4. Pipeline de deploy com incompatibilidade de autenticação não
   resolvida (inalterado).
5. DNS de `influencia.estudioela.com` não apontado (inalterado).
6. Validação comercial concentrada em piloto único ainda não
   confirmado; bus factor 1 (inalterado).
7. SPF/DKIM/DMARC não verificados no domínio de envio (inalterado,
   baixo risco imediato).
8. Duas PRs abertas em paralelo (#78, #79) sem decisão de merge — quanto
   mais tempo sem mesclar, maior o risco de conflito com trabalho futuro
   em `docs/` ou em `backend/`/`frontend/` (agravado pelo risco #1).

## 6. IA recomendada para a próxima tarefa

- **Esclarecer o commit `8060e18`/branch `docs/governance-phase2`:**
  qualquer IA de terminal com `git`/`gh` — tarefa de investigação e
  decisão, não de código.
- **Merge/push das PRs #78 e #79:** qualquer IA de terminal com `gh`
  autenticado.
- **Reorganização dos repositórios GitHub:** qualquer IA com escopo
  `delete_repo` no token `gh`; se faltar, entregar os comandos exatos em
  vez de travar a tarefa.
- **Decisão de autorizar infraestrutura/Go-Live:** decisão do
  responsável do projeto, não requer IA.
- Toda sessão nesta fase de Go-Live segue reportando ao final:
  Concluído / Bloqueadores (Crítico/Alto/Médio/Baixo) / Próxima
  prioridade / Checklist de Go-Live.

## 7. Prompt de handoff

```
Contexto: projeto ELÃ | influência / TEAR (Estúdio Elã). origin/main já
inclui a limpeza estrutural de 6 rodadas (TASK_ROUTER.md §42-§44). ATENÇÃO:
main local está 1 commit à frente de origin/main (8060e18, "Governança Fase
2", nunca pushado) — investigar antes de mesclar qualquer PR.

Duas PRs draft abertas, independentes, sem código pendente, só decisão de
merge:
- PR #78 (branch worktree-fix-dev-env): composer dev unificado.
- PR #79 (branch docs/ai-constitution-notebooklm): docs/AI_CONSTITUTION.md
  reescrita nesta sessão como constituição de engenharia (a partir de
  BASE.docx) + reenvio completo de docs/*.md ao notebook "tear" do
  NotebookLM (sessão anterior).

Três regras de governança fixadas pelo responsável do projeto nesta sessão
(em memória do agente, não em arquivo): AI_CONSTITUTION.md congelada (só
muda por pedido explícito), Lei da Evidência (rotular fato/inferência/
sugestão), Lei da Intervenção Mínima (menor correção primeiro, justificar
mudanças amplas).

Leia antes de começar: docs/_workspace/TASK_ROUTER.md §46 (esta sessão) e
§45 (sessão anterior).

Tarefa desta sessão: concluída. Próxima sessão recebe decisão do
responsável do projeto entre (1) resolver o commit 8060e18 órfão, (2)
merge das duas PRs, (3) confirmar remoção ou não das ~22 fontes legadas no
notebook tear, (4) reorganização dos repositórios GitHub, ou (5) autorizar
infraestrutura de produção/Go-Live.

Regras: não alterar arquitetura sem ADR; não criar documentação duplicada;
uma frente por vez; validar antes de commit; docs/AI_CONSTITUTION.md é
congelada (não editar sem pedido explícito); reportar ao final: Concluído
/ Bloqueadores (Crítico/Alto/Médio/Baixo) / Próxima prioridade / Checklist
de Go-Live.
```

## 8. Checklist

### AI_CONSTITUTION.md como constituição de engenharia (esta sessão)

- [x] `BASE.docx` lido e transformado (não resumido) em
      `docs/AI_CONSTITUTION.md`
- [x] `CLAUDE.md` §Fonte de decisão referenciando a nova autoridade
- [x] 3 regras de governança do responsável do projeto salvas em memória
- [x] PR #79 atualizada (commit `e6892b9`, pushado)
- [ ] Decisão sobre as ~22 fontes legadas remanescentes no notebook

### Achado desta sessão

- [ ] Esclarecer commit `8060e18` (Governança Fase 2) órfão em `main`
      local / branch `docs/governance-phase2`

### Ambiente de desenvolvimento (sessão anterior, PR #78)

- [x] `composer dev` único comando oficial, validado por navegação real
- [ ] PR #78 mergeada / commits pushados em `main`

### Fases anunciadas, não iniciadas

- [ ] Reorganização dos repositórios GitHub
- [ ] Infraestrutura de produção / Go-Live (`GATE_FINAL_GO_LIVE.md`)
