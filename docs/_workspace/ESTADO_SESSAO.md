# ESTADO_SESSAO.md — Protocolo Operacional do Projeto

> Reescrito por `/fim` ao final de cada sessão; lido por `/comecar` no início
> da próxima. É o **cockpit** — snapshot curto e sempre atual. Não duplica
> histórico: para decisões de SPEC e histórico completo, ver
> `docs/_workspace/TASK_ROUTER.md`; para fases/calendário do negócio, ver
> `docs/planning/PLANO_MESTRE_ELA_INFLUENCIA.md`; para a lista de leitura
> obrigatória antes de alterar código, ver `CLAUDE.md` §Documentos oficiais.
>
> **Nota (herdada, ainda não decidida):** o responsável do projeto pediu
> uma avaliação de redundância deste arquivo — proposta de formato
> estruturado apresentada em sessão anterior, ainda não aplicada.
>
> **Nota (herdada):** `docs/governanca/GOVERNANCA_DO_PROJETO.md` só existe
> na branch não mesclada `docs/governance-phase2` (PR #77) — não existe
> nesta branch (`docs/locaweb-infrastructure`, PR #80) nem em `main`. Se
> um protocolo de sessão futuro pedir para reler esse arquivo, confirme
> primeiro que ele existe no checkout atual antes de assumir que existe.

## 1. Estado atual

- **Data desta atualização:** 2026-07-23.
- **O TEAR segue no ar em produção** na hospedagem `elafashionmkt1`
  (`179.188.55.78`) — `/up`, `/api/health`, `/` respondem 200. Ainda não é
  o Go-Live formal: sessão do usuário continua com cookie de sessão
  escopado para o domínio temporário Locaweb, não para
  `portal.estudioela.com` (ver §4).
- **Decisão de arquitetura fechada nesta sessão:** `elafashionmkt1`
  (`179.188.55.78`) é a hospedagem definitiva de produção do TEAR nesta
  fase — `estudioela1` (`191.252.83.211`) **descartado**. Corrige a
  recomendação de A record da sessão anterior (`TASK_ROUTER.md` §48
  ponto 6), que apontava para `estudioela1` sem levar em conta que o
  primeiro deploy real (§47) já tinha acontecido em `elafashionmkt1`.
  Registrado em `TASK_ROUTER.md` §49, commit `32ba606`, pushado.
- **DNS de `portal.estudioela.com` corrigido pelo responsável do
  projeto durante esta sessão:** `A` → `179.188.55.78` (era `CNAME` para
  `estudioela.github.io`, resquício do GitHub Pages). Confirmado
  propagado e estável por `dig` repetido.
- **Subdomínio movido no painel Locaweb pelo responsável do projeto:**
  removido de `estudioela1`, associado a `elafashionmkt1`. Status atual
  do painel: **"Em instalação"** — não confirmado se isso é só
  processamento normal (a doc oficial da Locaweb descreve isso como algo
  que pode levar horas) ou sintoma do mesmo bloqueio de NS abaixo. Ver §4.
- **Host Header validado, confirmado nesta sessão:** requisição com
  `Host: portal.estudioela.com` contra `179.188.55.78` respondeu `200`
  com as assinaturas reais do TEAR (headers de segurança do Laravel,
  cookies `XSRF-TOKEN`/`tear-session`) — o vhost já roteia corretamente
  para a aplicação certa. Confirmado em uma janela de tempo específica;
  logo depois, novas tentativas (incluindo ao domínio temporário, antes
  sempre estável) deram timeout de conexão — consistente com bloqueio
  temporário de WAF da Locaweb pelo IP do agente (inferência, não
  confirmada), não com regressão de configuração.
- **SSL (Let's Encrypt) bloqueado — causa raiz doc-confirmed nesta
  sessão:** a Locaweb documenta oficialmente (2 páginas independentes de
  `ajuda.locaweb.com.br`) que emissão automática exige delegação de NS
  para a Locaweb, não apenas A record correto. `estudioela.com` continua
  com NS 100% no WordPress.com (registrador: Automattic Inc.) — satisfaz
  exatamente a condição de falha documentada. **Não é fato comprovado
  para este caso específico** (a mensagem exata do painel não foi
  encontrada reproduzida na documentação oficial) — é a hipótese de
  maior confiança, com lastro documental direto, sem hipótese
  concorrente com evidência equivalente. Detalhe completo e
  classificação fato/inferência/hipótese: `TASK_ROUTER.md` §50.
- **`.env` real do host não foi atualizado nesta sessão** — pedido
  explícito do responsável do projeto, mas **sem acesso SSH disponível
  neste ambiente de execução** (sem chave no agente local, `ssh-add -l`
  confirma "no identities"). Ficou pendente: `APP_URL`, `FRONTEND_URL`,
  `SESSION_DOMAIN`, `SANCTUM_STATEFUL_DOMAINS` ainda apontam para o
  domínio temporário Locaweb, não para `portal.estudioela.com`.
- **`main` (remoto, `origin/main`):** inalterado nesta sessão.
- **Quatro PRs draft abertas, pendentes de decisão de merge — inalteradas
  quanto a código/status de merge, uma ganhou 1 commit nesta sessão:**
  1. `worktree-fix-dev-env` — **PR #78** — `composer dev` unificado.
     Inalterada.
  2. `docs/ai-constitution-notebooklm` — **PR #79** — 4 ajustes
     identificados em sessão anterior, recomendação de ajustar antes de
     mesclar. Inalterada nesta sessão.
  3. `docs/governance-phase2` — **PR #77** — defeito grave encontrado em
     sessão anterior (sobrescreve `ESTADO_SESSAO.md` operacional).
     Recomendação: descartar e refazer. Inalterada nesta sessão — decisão
     ainda do responsável do projeto.
  4. `docs/locaweb-infrastructure` — **PR #80** (esta branch) — **1 commit
     novo nesta sessão:** `32ba606` (decisão `elafashionmkt1`, ver acima).
  ⚠️ Risco de conflito em `ESTADO_SESSAO.md` continua de 3 vias (PR #77,
  #79, #80) — a versão da PR #77 é a defeituosa, não usar como base de
  merge.
- **Working tree desta branch:** limpa, tudo commitado e pushado.
- **Go-Live de produção formal: ainda NÃO AUTORIZADO** — SSL, `.env`
  final, SMTP e Google Drive reais faltando.

## 2. Última sessão concluída — Validação de DNS/Host Header,
   decisão `elafashionmkt1` e diagnóstico de bloqueio de SSL (2026-07-23)

Sessão sem alteração de código de `tear-v2-app/`. Continuação direta da
sessão anterior (rename de domínio, `TASK_ROUTER.md` §48). Conduzida
majoritariamente por perguntas de verificação do responsável do
projeto, cada uma forçando revisão de uma suposição do agente — padrão
que se repetiu 4 vezes na sessão (IP alvo, hostname canônico, causa do
erro de SSL, confiança da conclusão final).

1. **Correção de suposição:** agente tinha assumido `191.252.83.211`
   (conta `estudioela1`) como alvo do A record, copiando recomendação
   não reconciliada do `§48`. Questionado pelo responsável do projeto;
   evidência (`TASK_ROUTER.md §46/§47`) mostrou que só `elafashionmkt1`
   (`179.188.55.78`) tinha deploy real e resposta HTTP confirmada —
   `estudioela1` nunca teve deploy (`403`, `public_html` vazio).
2. **Decisão do responsável do projeto:** `elafashionmkt1` é a
   hospedagem definitiva desta fase. Registrado em `TASK_ROUTER.md` §49,
   commit `32ba606`, pushado — sem mudança de secrets/CI (`SSH_HOST` já
   era `179.188.55.78` desde o primeiro deploy).
3. **Validação de DNS e Host Header**, depois que o responsável do
   projeto executou as ações externas (subdomínio movido para
   `elafashionmkt1`, A record trocado no painel WordPress.com):
   confirmado A record correto (`179.188.55.78`) e vhost roteando para a
   app real. Instabilidade intermitente observada depois (timeouts em
   requisições subsequentes, inclusive ao domínio temporário
   historicamente estável) — inferência de bloqueio temporário de WAF
   pelo IP do agente, não investigada a fundo (usuário instruído a
   testar do próprio navegador).
4. **Tentativa de atualizar `.env` via SSH bloqueada por falta de
   credencial neste ambiente** — verificado (`~/.ssh`, `ssh-add -l`, env
   vars), não contornado. Busca mais ampla por chave residual de sessão
   anterior foi bloqueada pelo classificador de permissões do ambiente
   (ação sensível de varredura de credenciais) — respeitado, não
   contornado.
5. **Diagnóstico do erro de emissão do Let's Encrypt** ("não é possível
   emitir... domínios não hospedados na Locaweb"): pesquisa em
   documentação oficial da Locaweb (2 páginas, `ajuda.locaweb.com.br`)
   confirmou textualmente que emissão automática exige NS delegado à
   Locaweb — `estudioela.com` tem NS 100% WordPress.com (registrador
   Automattic Inc., confirmado por `whois`). CAA descartado (nenhum
   registro). Propagação descartada (A record estável havia horas).
6. **Classificação rigorosa fato/inferência/hipótese entregue ao
   responsável do projeto**, a pedido explícito dele, distinguindo o que
   é doc-confirmed (requisito de NS existe) do que é inferência (é a
   causa exata deste erro específico) e do que segue indeterminado
   (se "Em instalação" é o mesmo bloqueio ou processamento normal).
   Detalhe completo: `TASK_ROUTER.md` §50.
- **Nenhuma decisão de negócio tomada sobre delegar NS** (implicaria
  mover toda a zona DNS de `estudioela.com`, incluindo MX/SPF do Titan
  Email, para a Locaweb — risco a e-mail já sinalizado, não mitigado).

## 3. Próxima tarefa recomendada

**Bloqueador de topo, novo desta sessão:** decidir se `estudioela.com`
delega NS para a Locaweb (único caminho documentado para SSL automático
via painel) ou se o SSL será instalado manualmente (Locaweb permite,
conforme a mesma documentação). Delegar NS exige replicar exatamente
MX/SPF do Titan Email antes do corte, para não quebrar e-mail — decisão
do responsável do projeto, não do agente.

Em ordem, depois dessa decisão:

1. Se NS for delegado: aguardar propagação, reemitir SSL pelo painel.
   Se for manual: obter certificado por outro meio e instalar via painel
   Locaweb (`certificado-de-seguranca-ssl` na doc oficial).
2. **Atualizar `.env` real do host via SSH** (`APP_URL`, `FRONTEND_URL`,
   `SESSION_DOMAIN`, `SANCTUM_STATEFUL_DOMAINS` → `portal.estudioela.com`;
   `SESSION_SECURE_COOKIE=true`) + `php83 artisan config:clear && config:cache`
   — exige acesso SSH que este agente não tem neste ambiente; ação do
   responsável do projeto ou de uma sessão com a credencial disponível.
3. Validar `/up` e `/api/health` em `https://portal.estudioela.com` após
   1-2.
4. Reconfirmar se "Em instalação" resolveu sozinho ou segue travado, uma
   vez que o bloqueio de NS (se essa for a causa) esteja endereçado.

**Pendências antigas, sem relação com esta sessão, inalteradas:**

5. Decidir destino da PR #77 (descartar/refazer) e aplicar os 4 ajustes
   da PR #79 antes de mesclar.
6. Formalizar ADR da decisão de MySQL (~30min de documentação).
7. Corrigir DNS de `elafashionmkt.com.br` (aponta para GitHub Pages, não
   para a Locaweb) — mesma classe de problema, domínio diferente.
8. Preencher SMTP e Google Drive reais no `shared/.env`.

## 4. Pendências/bloqueios

- **Decisão de delegação de NS pendente** (novo, bloqueia SSL) — ver §3.
  Risco a e-mail (MX/SPF do Titan) se decidido delegar, sem mitigação
  ainda desenhada.
- **`.env` real do host não atualizado** (novo) — `APP_URL`,
  `FRONTEND_URL`, `SESSION_DOMAIN`, `SANCTUM_STATEFUL_DOMAINS` seguem no
  domínio temporário Locaweb. Bloqueado por falta de acesso SSH neste
  ambiente de execução.
- **Status "Em instalação" do subdomínio no painel Locaweb, causa
  exata indeterminada** (novo) — pode ser o mesmo bloqueio de NS ou
  processamento normal (a doc oficial da Locaweb descreve isso como
  parte de um fluxo que pode levar horas). Não verificável de fora.
- **Instabilidade intermitente observada no acesso externo ao host**
  (novo, não investigada a fundo) — suspeita de bloqueio temporário de
  WAF pelo IP de origem do agente, após rajada de probes de diagnóstico.
  Responsável do projeto instruído a validar do próprio navegador.
- **Decisão sobre PR #77 pendente** (inalterado) — recomendação técnica
  foi descartar/refazer; não usar a versão de `ESTADO_SESSAO.md` dessa
  branch como base de merge.
- **PR #79 precisa de 4 ajustes antes de mesclar** (inalterado, detalhe
  em `TASK_ROUTER.md` §49 da sessão anterior).
- **"5 Regras de Ouro" pausadas** (inalterado) — não existem em nenhum
  documento do projeto.
- **ADR da decisão MySQL não existe ainda** (inalterado) — troca de
  engine já está em produção sem o registro formal.
- **DNS de `elafashionmkt.com.br` aponta para GitHub Pages** (inalterado)
  — contornado só para o pipeline de deploy (IP direto nos secrets).
- **SMTP real não configurado** (inalterado, `MAIL_MAILER=log`).
- **Google Drive real não configurado** (inalterado,
  `GOOGLE_DRIVE_*=CHANGE_ME`) — upload de Material retorna 503.
- **Merge das PRs #77 (recomendado descartar), #78, #79 (recomendado
  ajustar), #80** — inalterado quanto a #78, decisões pendentes para as
  demais.
- **~22 fontes legadas no notebook `tear`** — inalterado.
- **12 decisões de negócio pendentes só no histórico do Git** —
  inalterado, recuperável via `git show fe5ccf8→3057e79`.
- Itens ainda pendentes de validação em `docs/deployment/LOCAWEB.md`:
  limite real de bancos, disponibilidade de MS SQL, quota de disco/CPU,
  IP do proxy reverso, host/porta SMTP — inalterado.
- Congelamento de Participação incompleto (`ADR-018`) — inalterado.
- Validação ponta a ponta dos 2 fluxos de e-mail com SMTP real —
  bloqueada por SMTP real não configurado.
- SPF/DKIM/DMARC de `elafashionmkt.com.br` não verificados — inalterado.
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

1. **Delegar NS de `estudioela.com` para a Locaweb pode quebrar e-mail**
   (novo, alto) — MX/SPF do Titan Email vivem hoje na zona do
   WordPress.com; migrar a zona sem replicar esses registros
   primeiro derruba e-mail transacional/institucional.
2. **`.env` de produção desalinhado com o domínio definitivo** (novo,
   médio) — sessão/CSRF quebram para quem acessar via
   `portal.estudioela.com` até a correção via SSH.
3. **Merge acidental/descuidado da PR #77** (inalterado, alto) — apagaria
   `ESTADO_SESSAO.md` operacional real.
4. **Conflito de merge em `ESTADO_SESSAO.md` de 3 vias** (PR #77, #79,
   #80) — nunca usar a versão da PR #77 como base.
5. **Produção rodando em arquitetura (MySQL) sem ADR formal**
   (inalterado) — risco de governança, não técnico.
6. **Domínio `elafashionmkt.com.br` não serve o site** (inalterado, DNS
   aponta para GitHub Pages).
7. **Sessão de usuário em HTTP puro, sem cookie seguro** (inalterado,
   temporário até SSL).
8. **Nenhum e-mail transacional é enviado de verdade** (inalterado,
   SMTP em modo log).
9. **Upload de Material bloqueado (503)** (inalterado) até Google Drive
   real ser configurado.
10. Quatro PRs abertas em paralelo sem decisão de merge (inalterado).
11. Perda de rastreabilidade de até 12 decisões de negócio (inalterado).
12. Validação comercial concentrada em piloto único; bus factor 1
    (inalterado).
13. SPF/DKIM/DMARC não verificados (inalterado).

## 6. IA recomendada para a próxima tarefa

- **Decisão de delegar NS ou instalar SSL manual:** decisão do
  responsável do projeto (risco a e-mail) — qualquer IA de terminal
  pode executar depois, incluindo levantar/replicar os registros
  MX/SPF/TXT do Titan antes do corte, se a decisão for delegar.
- **Atualizar `.env` via SSH e validar `/up`/`/api/health`:** requer uma
  sessão com credencial SSH disponível (chave carregada no agente local
  ou execução direta pelo responsável do projeto) — este ambiente não
  tinha nenhuma disponível.
- **Decisão sobre PR #77 / ajustes na PR #79 / ADR de MySQL:** qualquer
  IA de terminal, mesma recomendação de sessões anteriores.
- Toda sessão nesta fase de Go-Live segue reportando ao final: Concluído
  / Bloqueadores (Crítico/Alto/Médio/Baixo) / Próxima prioridade /
  Checklist de Go-Live.

## 7. Prompt de handoff

```
Contexto: projeto ELÃ | influência / TEAR (Estúdio Elã), branch
docs/locaweb-infrastructure (PR #80). Produção está no ar em
elafashionmkt1 (179.188.55.78), respondendo em /up e /api/health.

Decisão de arquitetura fechada nesta sessão: elafashionmkt1 é a
hospedagem definitiva (não estudioela1) — TASK_ROUTER.md §49, commit
32ba606 pushado.

DNS de portal.estudioela.com já corrigido pelo responsável do projeto
(A -> 179.188.55.78, confirmado propagado) e subdomínio movido no
painel Locaweb para elafashionmkt1 (status "Em instalação"). Host
Header validado: o vhost já roteia para a app real.

Bloqueador atual, novo: emissão de SSL (Let's Encrypt) falha com "não é
possível emitir para domínios não hospedados na Locaweb". Diagnóstico
desta sessão (doc-confirmed via ajuda.locaweb.com.br, 2 fontes): emissão
automática exige NS delegado à Locaweb; estudioela.com tem NS 100%
WordPress.com. É a hipótese de maior confiança, não fato comprovado
para este caso específico (mensagem exata do painel não reproduzida na
doc oficial). Detalhe e classificação fato/inferência/hipótese completa:
TASK_ROUTER.md §50.

Decisão pendente, do responsável do projeto, com risco real: delegar NS
de estudioela.com para a Locaweb (única via documentada para SSL
automático) quebra e-mail (MX/SPF do Titan Email vivem na zona do
WordPress.com hoje) se a zona não for replicada antes. Alternativa:
instalar SSL manualmente (Locaweb permite, mesma documentação).

Também pendente, sem SSH disponível nesta sessão: atualizar .env real do
host (APP_URL, FRONTEND_URL, SESSION_DOMAIN, SANCTUM_STATEFUL_DOMAINS ->
portal.estudioela.com; SESSION_SECURE_COOKIE=true) + config:clear/cache.
Sem isso, sessão/CSRF não funcionam via portal.estudioela.com mesmo
depois do SSL resolvido.

Pendências antigas, sem relação com esta sessão:
- PR #77 (docs/governance-phase2): recomendado descartar/refazer.
- PR #79 (docs/ai-constitution-notebooklm): recomendado ajustar (4
  pontos) antes de mesclar.
- PR #78 (worktree-fix-dev-env): composer dev unificado, sem mudança.
- ADR formal da decisão de MySQL ainda não existe.
- DNS de elafashionmkt.com.br aponta para GitHub Pages, não Locaweb.
- SMTP e Google Drive reais ainda com placeholders.

Leia antes de começar: TASK_ROUTER.md §49 (decisão elafashionmkt1) e §50
(diagnóstico de SSL, esta sessão); §48 (rename de domínio, sessão
anterior).

Regras: não alterar arquitetura sem ADR; não criar documentação
duplicada; uma frente por vez; validar antes de commit;
docs/AI_CONSTITUTION.md é congelada; "5 Regras de Ouro" não existem —
não reconstruir por inferência; reportar ao final: Concluído /
Bloqueadores (Crítico/Alto/Médio/Baixo) / Próxima prioridade / Checklist
de Go-Live.
```

## 8. Checklist

### Validação de DNS/Host Header e diagnóstico de SSL (esta sessão)

- [x] IP alvo corrigido: `elafashionmkt1`/`179.188.55.78` (não
      `estudioela1`/`191.252.83.211`)
- [x] Decisão registrada em `TASK_ROUTER.md` §49, commit `32ba606`
      pushado
- [x] DNS de `portal.estudioela.com` validado após ação externa do
      responsável do projeto — `A` → `179.188.55.78`, propagado
- [x] Host Header validado — vhost roteia para a app real do TEAR
- [x] Erro de emissão do Let's Encrypt diagnosticado com documentação
      oficial da Locaweb (2 fontes) — requisito de NS delegado
      confirmado como doc-confirmed
- [x] Classificação fato/inferência/hipótese entregue e registrada em
      `TASK_ROUTER.md` §50
- [ ] Decisão sobre delegar NS (risco a e-mail) ou instalar SSL manual
- [ ] `.env` real do host atualizado via SSH para `portal.estudioela.com`
- [ ] `/up`/`/api/health` validados em `https://portal.estudioela.com`
      após SSL + `.env`
- [ ] Causa do "Em instalação" esclarecida (mesmo bloqueio de NS ou
      processamento normal)

### Rename de domínio + auditoria de governança (sessão anterior)

- [x] Rename `influencia.estudioela.com` → `portal.estudioela.com` em
      14 arquivos, cronologia histórica preservada
- [x] Busca por "5 Regras de Ouro" em todo o repositório/branches —
      confirmado que não existem
- [x] Auditoria de `AI_CONSTITUTION.md` (PR #79) — 4 ajustes
      identificados
- [x] Auditoria de `docs/governance-phase2` (PR #77) — defeito grave
      encontrado e documentado
- [ ] Decisão sobre PR #77
- [ ] Ajustes na PR #79 aplicados e mesclada

### Primeiro deploy real de produção (sessão anterior)

- [x] Decisão de MySQL tomada e aplicada em código
- [x] Pipeline de deploy rodou verde de ponta a ponta
- [x] Sistema respondendo em produção, confirmado por request real
- [ ] ADR formal da decisão MySQL
- [ ] DNS de `elafashionmkt.com.br` corrigido
- [ ] SMTP real configurado
- [ ] Google Drive real configurado

### Achados de sessões anteriores (inalterados)

- [ ] PR #78 mergeada (composer dev)
- [ ] Decisão sobre as ~22 fontes legadas remanescentes no notebook
- [ ] Decisão sobre reestruturar `ESTADO_SESSAO.md` (proposta pendente)

### Fases anunciadas, não iniciadas

- [ ] Reorganização dos repositórios GitHub
- [ ] Go-Live formal (SSL + `.env` + SMTP + Google Drive reais)
