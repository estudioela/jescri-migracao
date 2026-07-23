# ESTADO_SESSAO.md — Protocolo Operacional do Projeto

> Reescrito por `/fim` ao final de cada sessão; lido por `/comecar` no início
> da próxima. É o **cockpit** — snapshot curto e sempre atual. Não duplica
> histórico: para decisões de SPEC e histórico completo, ver
> `docs/_workspace/TASK_ROUTER.md`; para fases/calendário do negócio, ver
> `docs/planning/PLANO_MESTRE_ELA_INFLUENCIA.md`; para a lista de leitura
> obrigatória antes de alterar código, ver `CLAUDE.md` §Documentos oficiais.
>
> **Nota desta sessão:** o responsável do projeto pediu uma avaliação de
> redundância deste arquivo — proposta de formato estruturado (fato único
> por linha, tags de data/evidência) apresentada na conversa, mas **ainda
> não aplicada** (aguardando decisão). Este arquivo mantém a estrutura de
> seções de sempre.

## 1. Estado atual

- **Data desta atualização:** 2026-07-23.
- **`main` (remoto, `origin/main`):** inalterado nesta sessão. Último
  commit: `c96d460`.
- **`main` local segue 1 commit à frente do remoto, nunca pushado**
  (inalterado, não investigado nesta sessão): `8060e18 docs(governance):
  establish Phase 2 governance model`. Branch `docs/governance-phase2`
  (local e `origin`) com o mesmo commit.
- **Três PRs draft abertas, sem relação entre si, pendentes de decisão de
  merge (inalterado nesta sessão):**
  1. `worktree-fix-dev-env` — **PR #78** — `composer dev` unificado.
  2. `docs/ai-constitution-notebooklm` — **PR #79** — `AI_CONSTITUTION.md`
     + NotebookLM.
  3. `docs/locaweb-infrastructure` — **PR #80** — inventário Locaweb
     (`LOCAWEB.md`) + esta sessão (`VALIDACAO_AMBIENTE_REAL.md`).
  ⚠️ PR #79 e #80 vão conflitar em `ESTADO_SESSAO.md` no merge (bases
  diferentes de `main`, ambas reescrevem o arquivo) — resolver mantendo o
  conteúdo mais recente.
- **Working tree desta sessão:** commitado e pushado ao final (ver
  §"Arquivos alterados" abaixo).
- **Go-Live de produção: continua NÃO AUTORIZADO.** Dois bloqueadores
  novos nesta sessão se somam ao já conhecido (divergência de banco,
  §4): divergência de DNS em `elafashionmkt.com.br` e um bug confirmado
  em `scripts/deploy-locaweb.sh` que faria o primeiro deploy falhar
  como está hoje.

## 2. Última sessão concluída — Validação real do ambiente Locaweb via
    SSH + estratégia de deploy (2026-07-23)

Continuação direta da auditoria da sessão anterior (§45 de
`TASK_ROUTER.md`), agora validando por dentro do host, não só por
prints do painel. Nenhum código de `tear-v2-app/` alterado.

1. **Validação externa (sem SSH):** `docs/deployment/
   VALIDACAO_AMBIENTE_REAL.md` criado com evidência de rede (DNS, TCP,
   HTTP). Achado crítico: `elafashionmkt.com.br` resolve hoje para
   GitHub Pages, não para o IP Locaweb — apesar de o NS ser da Locaweb e
   do print da mesma data dizer "DNS já apontado". Causa não confirmada,
   decisão do responsável do projeto pendente (ver §4).
2. **Validação interna via SSH:** bloqueada por falta de credenciais →
   senha solicitada e fornecida pelo responsável do projeto → instável
   por expiração da janela de 3h → **concluída pelo próprio responsável
   do projeto**, conectado via seu terminal, rodando os comandos de
   leitura fornecidos pelo agente.
3. **Fatos confirmados pela auditoria real** (substituem inferência de
   painel): SSH operacional; Git instalado; `public_html` vazio; **`php`
   genérico ausente do PATH — só `php83` existe**; Composer ausente
   globalmente (reconfirma `AUDITORIA_LOCAWEB.md`/`ADR-016`).
4. **Gap encontrado, não coberto por `ADR-016`:**
   `scripts/deploy-locaweb.sh` chama `php artisan ...` genérico —
   falharia sempre no host real. `tear-v2-deploy.yml` assume
   `SSH_PRIVATE_KEY`, mas o painel não tem campo de `authorized_keys`
   (contornável com bootstrap manual único, nunca feito).
5. **Recomendação de estratégia de deploy:** reafirmar `ADR-016`
   (Composer só no CI + `rsync`/SSH + `workflow_dispatch` manual) — os
   achados desta sessão confirmam as premissas do ADR, não as
   contradizem. Não é caso de nova ADR, e sim de um adendo cobrindo o
   binário `php83`. Plano operacional de 5 fases apresentado (ver §3) —
   **nada executado ainda**.
6. **Proposta de processo (não aplicada):** reduzir redundância deste
   arquivo — ver nota no topo.
- Detalhe completo: `docs/_workspace/TASK_ROUTER.md` §46.

## 3. Próxima tarefa recomendada

**Duas decisões do responsável do projeto, não tarefas de código,
bloqueiam o avanço:**

1. **Divergência de DNS em `elafashionmkt.com.br`** (nova nesta sessão)
   — confirmar se o apontamento para GitHub Pages é intencional ou
   precisa ser corrigido antes de usar este domínio como destino do
   primeiro deploy. Ver `VALIDACAO_AMBIENTE_REAL.md` §6.
2. **Divergência de banco de dados (PostgreSQL vs. MySQL)** — inalterada
   desde a sessão anterior, ver §4.

**Se ambas forem resolvidas (ou adiadas via domínio temporário
Locaweb), a próxima tarefa de execução é aplicar o plano de deploy já
desenhado:** corrigir `scripts/deploy-locaweb.sh` (usar `php83`),
registrar o adendo em `ADR-016`, gerar par de chaves SSH dedicado ao CI,
habilitar SSH no painel e fazer o bootstrap manual de
`~/.ssh/authorized_keys`, cadastrar os 4 secrets do GitHub, disparar
`workflow_dispatch`. Detalhe fase a fase na conversa desta sessão /
`TASK_ROUTER.md` §46.

Em paralelo, seguem pendências já conhecidas (§4): commit `8060e18`
órfão, merge das 3 PRs, ~22 fontes legadas no notebook.

## 4. Pendências/bloqueios (decisão do responsável do projeto)

- **Divergência de DNS em `elafashionmkt.com.br`** (nova) — resolve para
  GitHub Pages, não para o IP Locaweb. Ver §2/§3.
- **`scripts/deploy-locaweb.sh` usa `php` genérico** (novo, bug
  confirmado) — falharia no host real, que só tem `php83`. Correção já
  desenhada, não aplicada.
- **`SSH_PRIVATE_KEY` do workflow sem `authorized_keys` no host** (novo)
  — bootstrap manual necessário, nunca executado.
- **Divergência de banco de dados (PostgreSQL vs. MySQL)** em
  `elafashionmkt.com.br` — inalterada desde a sessão anterior.
- **Commit `8060e18` em `main` local, nunca pushado** — inalterado, não
  investigado nesta sessão.
- **Merge das PRs #78, #79 e #80** — inalterado.
- **~22 fontes legadas no notebook `tear`** — inalterado.
- Itens ainda pendentes de validação em `docs/deployment/LOCAWEB.md`
  (agora parcialmente resolvidos por SSH real — ver §2 item 3; ainda
  faltam): limite real de bancos, disponibilidade de MS SQL, crontab
  nativo, emissão efetiva de SSL, quota de disco/CPU, IP do proxy
  reverso, host/porta SMTP.
- **12 decisões de negócio pendentes só no histórico do Git** —
  inalterado, recuperável via `git show fe5ccf8→3057e79`.
- Congelamento de Participação incompleto (`ADR-018`) — inalterado.
- Validação ponta a ponta dos 2 fluxos de e-mail com SMTP real — não
  executada, inalterado.
- SPF/DKIM/DMARC de `elafashionmkt.com.br` não verificados — inalterado,
  relevância maior agora que a divergência de DNS deste domínio foi
  confirmada.
- Recorrência/parcelamento de pagamento não implementado — limitação de
  escopo conhecida, inalterado.
- **Categoria B (não bloqueia certificação funcional, inalterado):**
  `Pagamento.valor` editável com `status=PAGO` sem auditoria; Pagamento
  e cancelamento de Participação não se checam mutuamente; Campanha
  `ENCERRADA`/`CANCELADA` continua editável; Participação pode ser
  criada em Campanha encerrada; `PagamentoController` sem
  `DB::transaction`/lock; e-mail sem unicidade entre Parceiras;
  mensagens de erro genéricas no Login; `/login` sem rate-limit por
  e-mail; `CadastroPublicoController::store()` não trata
  `QueryException` de nome duplicado concorrente; usuário sem role
  recebe `AppShell` administrativo completo; `email` não normalizado em
  `StoreParceiraRequest`.

## 5. Riscos ativos

1. **Deploy real falharia hoje mesmo com tudo mais resolvido** (novo) —
   `deploy-locaweb.sh` chama `php` genérico, ausente no host; correção
   simples, mas não aplicada ainda.
2. **Tráfego de `elafashionmkt.com.br` não chega ao host Locaweb** (novo)
   — domínio resolve para GitHub Pages; primeiro deploy de homologação
   deveria usar o domínio temporário Locaweb até isso ser esclarecido.
3. **Conflito de merge em `ESTADO_SESSAO.md` entre PR #79 e #80** —
   inalterado, resolver na hora do merge.
4. **Divergência de histórico entre `main` local e `origin/main`**
   (`8060e18` não pushado) — inalterado.
5. Decisão de banco de dados em aberto pode atrasar o primeiro deploy —
   inalterado.
6. Três PRs abertas em paralelo sem decisão de merge — inalterado.
7. Perda de rastreabilidade de até 12 decisões de negócio — mitigável
   via Git, inalterado.
8. PostgreSQL indisponível no plano atual da Locaweb para
   `elafashionmkt.com.br` — inalterado quanto ao fato.
9. DNS de `influencia.estudioela.com` ainda não apontado — inalterado.
10. Validação comercial concentrada em piloto único; bus factor 1 —
    inalterado.
11. SPF/DKIM/DMARC não verificados — relevância maior após a divergência
    de DNS confirmada nesta sessão.

## 6. IA recomendada para a próxima tarefa

- **Decidir DNS de `elafashionmkt.com.br` / PostgreSQL vs. MySQL:**
  decisões do responsável do projeto, não requerem IA.
- **Aplicar o plano de deploy (corrigir `deploy-locaweb.sh`, adendo a
  `ADR-016`, bootstrap de `authorized_keys`, secrets do GitHub):**
  qualquer IA de terminal com `git`/`gh`/acesso SSH — trabalho de código
  + execução, seguindo o fluxo Auditoria → Plano → Execução → Validação
  → Commit já usado nesta sessão.
- **Merge/push das PRs #78, #79, #80:** qualquer IA de terminal com `gh`
  autenticado — atenção ao conflito esperado em `ESTADO_SESSAO.md`.
- Toda sessão nesta fase de Go-Live segue reportando ao final: Concluído
  / Bloqueadores (Crítico/Alto/Médio/Baixo) / Próxima prioridade /
  Checklist de Go-Live.

## 7. Prompt de handoff

```
Contexto: projeto ELÃ | influência / TEAR (Estúdio Elã). origin/main já
inclui a limpeza estrutural de 6 rodadas (TASK_ROUTER.md §42-§44). ATENÇÃO:
main local está 1 commit à frente de origin/main (8060e18, "Governança Fase
2", nunca pushado, inalterado) — investigar antes de mesclar qualquer PR.

Três PRs draft abertas, sem código pendente, só decisão de merge:
- PR #78 (worktree-fix-dev-env): composer dev unificado.
- PR #79 (docs/ai-constitution-notebooklm): AI_CONSTITUTION.md + NotebookLM.
- PR #80 (docs/locaweb-infrastructure): LOCAWEB.md + VALIDACAO_AMBIENTE_REAL.md
  (validação real do host via SSH, esta sessão).
⚠️ PR #79 e #80 vão conflitar em ESTADO_SESSAO.md no merge — resolver
mantendo o conteúdo mais recente.

Esta sessão validou o ambiente Locaweb por dentro (SSH real, não só
painel): PHP só existe como `php83` (sem `php` genérico no PATH), Composer
ausente globalmente, public_html vazio. Isso confirma ADR-016 (Composer só
no CI), mas expôs um bug real: scripts/deploy-locaweb.sh chama `php`
genérico e falharia hoje. Plano de correção + deploy desenhado, não
aplicado — ver TASK_ROUTER.md §46 para o plano completo de 5 fases.

Dois bloqueadores de decisão antes de prosseguir:
1. elafashionmkt.com.br resolve hoje para GitHub Pages, não para o IP
   Locaweb — confirmar se é intencional (ver VALIDACAO_AMBIENTE_REAL.md §6).
2. PostgreSQL vs. MySQL em elafashionmkt.com.br — ver LOCAWEB.md, seção
   "Conclusão desta revisão" (inalterado desde a sessão anterior).

Leia antes de começar: TASK_ROUTER.md §46 (esta sessão) e §45 (anterior).

Regras: não alterar arquitetura sem ADR; não criar documentação duplicada;
uma frente por vez; validar antes de commit; docs/AI_CONSTITUTION.md é
congelada (não editar sem pedido explícito); reportar ao final: Concluído
/ Bloqueadores (Crítico/Alto/Médio/Baixo) / Próxima prioridade / Checklist
de Go-Live.
```

## 8. Checklist

### Validação real do ambiente Locaweb (esta sessão)

- [x] `docs/deployment/VALIDACAO_AMBIENTE_REAL.md` criado (validação
      externa + validação interna via SSH real, PR #80)
- [x] Confirmado via SSH real: `php83`, Composer ausente, `public_html`
      vazio, Git instalado
- [x] Estratégia de deploy avaliada e recomendada (reafirmar `ADR-016`)
- [x] Plano operacional de deploy (5 fases) apresentado
- [ ] Decisão sobre DNS de `elafashionmkt.com.br` (GitHub Pages vs.
      Locaweb)
- [ ] Corrigir `scripts/deploy-locaweb.sh` para `php83`
- [ ] Adendo a `ADR-016` registrado
- [ ] Bootstrap de `authorized_keys` no host + secrets do GitHub
- [ ] Decisão sobre reestruturar `ESTADO_SESSAO.md` (proposta pendente)

### Achados de sessões anteriores (inalterados)

- [ ] Decisão sobre PostgreSQL vs. MySQL na hospedagem real
- [ ] PR #80 mergeada
- [ ] Esclarecer commit `8060e18` (Governança Fase 2) órfão em `main`
      local / branch `docs/governance-phase2`
- [ ] PR #78 mergeada / commits pushados em `main`
- [ ] PR #79 mergeada
- [ ] Decisão sobre as ~22 fontes legadas remanescentes no notebook

### Fases anunciadas, não iniciadas

- [ ] Reorganização dos repositórios GitHub
- [ ] Infraestrutura de produção / Go-Live (`GATE_FINAL_GO_LIVE.md`)
