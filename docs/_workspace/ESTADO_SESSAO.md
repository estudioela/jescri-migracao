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

## 1. Estado atual

- **Data desta atualização:** 2026-07-23.
- **O TEAR está no ar em produção pela primeira vez.** `GET /up` → 200,
  `GET /api/health` → 200 (`{"status":"ok","app":"TEAR"}`), `GET /` → 200
  servindo a SPA — verificado por request HTTP real ao final desta sessão.
  URL de validação atual: `http://elafashionmkt1.hospedagemdesites.ws`
  (domínio **temporário** da Locaweb, não o definitivo — ver §4).
- **`main` (remoto, `origin/main`):** inalterado nesta sessão. Último
  commit: `c96d460`.
- **`main` local segue 1 commit à frente do remoto, nunca pushado**
  (inalterado, não investigado nesta sessão): `8060e18 docs(governance):
  establish Phase 2 governance model` — tem PR própria, **PR #77**, não é
  mais um commit órfão sem contexto.
- **Quatro PRs draft abertas, sem relação entre si, pendentes de decisão
  de merge:**
  1. `worktree-fix-dev-env` — **PR #78** — `composer dev` unificado.
     Inalterada.
  2. `docs/ai-constitution-notebooklm` — **PR #79** — `AI_CONSTITUTION.md`
     + NotebookLM. Inalterada.
  3. `docs/governance-phase2` — **PR #77** — modelo de governança Fase 2.
     Inalterada (mesmo commit `8060e18` acima).
  4. `docs/locaweb-infrastructure` — **PR #80** — todo o trabalho desta
     sessão e da anterior (inventário Locaweb, validação SSH real,
     correções de código para o primeiro deploy). **5 commits novos
     nesta sessão:** `1adaae5`, `3e741cb`, `e3aeca4`, `a3069c1`,
     `3d9fb4b`.
  ⚠️ PR #79 e #80 ainda devem conflitar em `ESTADO_SESSAO.md` no merge
  (bases diferentes de `main`, ambas reescrevem o arquivo) — resolver
  mantendo o conteúdo mais recente.
- **Working tree:** limpa, tudo commitado e pushado (`git status --short`
  vazio ao final da sessão).
- **Go-Live de produção formal: ainda NÃO AUTORIZADO** (SSL, domínio
  definitivo, SMTP e Google Drive reais faltando — ver §4), mas o
  **primeiro deploy técnico foi executado com sucesso**, o que é uma
  mudança de estado relevante em relação à sessão anterior (onde nada
  disso existia ainda).

## 2. Última sessão concluída — Primeiro deploy real de produção
    (2026-07-23)

Sessão de execução direta (não só auditoria), em 4 missões sequenciais
do responsável do projeto. Detalhe completo: `TASK_ROUTER.md` §47.

1. **Auditoria de consistência** dos 5 fatos já confirmados (`php83`,
   Composer, SSH, `public_html`, build fora do servidor) contra os
   documentos soberanos — 2 lacunas encontradas e corrigidas
   (`ARQUITETURA_PRODUCAO.md`, `PLANO_DE_IMPLANTACAO.md`).
2. **Bugs de código já rastreados, corrigidos:** `scripts/deploy-locaweb.sh`,
   `crontab.example`, `backup-db.sh` (`php` genérico → `php83`);
   `restore-db.sh` (`docker compose` → `psql` direto). Procedimento de
   bootstrap de `authorized_keys` e de `public_html` documentado.
3. **Decisão de arquitetura pelo responsável do projeto:** PostgreSQL
   confirmado indisponível no painel Locaweb (print real) — **banco de
   produção passa a ser MySQL.** Auditoria de compatibilidade não achou
   bloqueio nas migrations (só Schema Builder); corrigido
   preventivamente `Schema::defaultStringLength(191)` e todos os
   templates/scripts que assumiam Postgres.
   **⚠️ Sem ADR formal ainda — ver §4.**
4. **Deploy real executado, passo a passo, com o responsável do
   projeto:** banco `influenciaela` criado; ~1h de troubleshooting de
   "Access denied" isolado como senha divergindo entre digitações
   (`read -s` sem eco) — resolvido com copiar-colar; chave SSH de
   deploy gerada e instalada; DNS de `elafashionmkt.com.br` reconfirmado
   apontando para GitHub Pages (contornado com IP direto nos secrets,
   não resolve para tráfego público real); 4 secrets do GitHub
   cadastrados; estrutura `releases/`+`shared/` criada no host; `.env`
   de produção montado (com decisões temporárias sinalizadas — ver §4);
   bug de migration MySQL-específico (índice/FK, erro 1553) encontrado e
   corrigido; `public_html` resolvido via symlink; pipeline completo
   rodou verde.
5. **Resultado:** sistema respondendo em produção, confirmado por
   request HTTP real (não suposição).

## 3. Próxima tarefa recomendada

**Nenhuma decisão bloqueante de código — só trabalho de configuração e
uma dívida de governança.** Em ordem de impacto:

1. **Formalizar a decisão de MySQL** com um ADR (ex.: `ADR-019`),
   seguindo o mesmo padrão de `ADR-016` — a mudança já está em produção,
   falta só o registro formal (`CLAUDE.md`: "Não alterar arquitetura sem
   ADR"). Trabalho de documentação puro, ~30min.
2. **Corrigir o DNS de `elafashionmkt.com.br`** (aponta para GitHub
   Pages, não para a Locaweb) — decisão/execução do responsável do
   projeto junto ao provedor de DNS/registrador, fora do alcance de
   qualquer agente sem acesso a esse painel.
3. **Emitir SSL** (nenhum domínio tem certificado válido ainda) e então
   reverter as decisões temporárias do `shared/.env` (`APP_URL`,
   `SESSION_DOMAIN`, `SESSION_SECURE_COOKIE=true`) para o domínio
   definitivo com HTTPS.
4. **Preencher SMTP e Google Drive reais** no `shared/.env` (hoje
   `MAIL_MAILER=log` e `GOOGLE_DRIVE_*=CHANGE_ME`) — necessário antes de
   qualquer uso real por influenciadoras/admin.
5. Em paralelo, seguem pendências antigas (§4): merge das 4 PRs, ~22
   fontes legadas no notebook, 12 decisões de negócio só no histórico do
   Git.

## 4. Pendências/bloqueios

- **ADR da decisão MySQL não existe ainda** (novo, dívida de governança)
  — a troca de engine já está em produção sem o registro formal exigido
  por `CLAUDE.md`.
- **DNS de `elafashionmkt.com.br` aponta para GitHub Pages**, não para a
  Locaweb (reconfirmado nesta sessão com teste direto) — bloqueia o uso
  do domínio real; contornado só para o pipeline de deploy (IP direto
  nos secrets), não para tráfego público.
- **SSL não emitido em nenhum domínio** — produção está em HTTP puro,
  com `SESSION_SECURE_COOKIE=false` temporário.
- **SMTP real não configurado** (`MAIL_MAILER=log`) — nenhum e-mail
  transacional é enviado de fato ainda, só logado.
- **Google Drive real não configurado** (`GOOGLE_DRIVE_*=CHANGE_ME`) —
  upload de Material retorna 503 até isso ser preenchido.
- **`APP_URL`/`SESSION_DOMAIN` apontam para o domínio temporário
  Locaweb**, não para o domínio definitivo do produto — trocar assim
  que DNS/SSL estiverem resolvidos.
- **Commit `8060e18` em `main` local, nunca pushado** — agora associado
  à PR #77, menos urgente que antes, ainda inalterado.
- **Merge das PRs #77, #78, #79 e #80** — inalterado (PR #80 cresceu
  bastante nesta sessão, é a mais importante de revisar).
- **~22 fontes legadas no notebook `tear`** — inalterado.
- **12 decisões de negócio pendentes só no histórico do Git** —
  inalterado, recuperável via `git show fe5ccf8→3057e79`.
- Itens ainda pendentes de validação em `docs/deployment/LOCAWEB.md`:
  limite real de bancos, disponibilidade de MS SQL, crontab nativo,
  emissão efetiva de SSL, quota de disco/CPU, IP do proxy reverso, host/
  porta SMTP — inalterado.
- Congelamento de Participação incompleto (`ADR-018`) — inalterado.
- Validação ponta a ponta dos 2 fluxos de e-mail com SMTP real — ainda
  não executada (agora bloqueada também por SMTP real não configurado).
- SPF/DKIM/DMARC de `elafashionmkt.com.br` não verificados — inalterado,
  ainda mais relevante com o domínio fora do ar via DNS.
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

1. **Produção rodando em arquitetura (MySQL) sem ADR formal** (novo) —
   risco de governança, não técnico; a decisão já foi tomada e aplicada,
   falta só o registro.
2. **Domínio real (`elafashionmkt.com.br`) não serve o site** (DNS
   aponta para GitHub Pages) — quem acessar o domínio real hoje não
   encontra o TEAR; só o domínio temporário Locaweb funciona.
3. **Sessão de usuário em HTTP puro, sem cookie seguro** (temporário,
   até SSL) — aceitável para validação técnica, não para uso real por
   influenciadoras.
4. **Nenhum e-mail transacional é enviado de verdade** (SMTP em modo
   log) — convite/reset de senha não chegam a caixas de entrada reais
   ainda.
5. **Upload de Material bloqueado (503)** até Google Drive real ser
   configurado.
6. **Conflito de merge em `ESTADO_SESSAO.md` entre PR #79 e #80** —
   inalterado, resolver na hora do merge.
7. Quatro PRs abertas em paralelo sem decisão de merge — inalterado
   (uma a mais que antes, PR #77 identificada).
8. Perda de rastreabilidade de até 12 decisões de negócio — mitigável
   via Git, inalterado.
9. DNS de `portal.estudioela.com` (domínio canônico planejado)
   ainda não apontado — inalterado.
10. Validação comercial concentrada em piloto único; bus factor 1 —
    inalterado.
11. SPF/DKIM/DMARC não verificados — inalterado.

## 6. IA recomendada para a próxima tarefa

- **Formalizar ADR da decisão MySQL:** qualquer IA de terminal — tarefa
  de documentação pura, seguindo o padrão já estabelecido por
  `ADR-016`.
- **Corrigir DNS / emitir SSL / preencher SMTP e Google Drive reais:**
  decisões e execução do responsável do projeto em painéis externos
  (registrador de DNS, Locaweb, Google Cloud Console) — não é trabalho
  de código, mas uma IA de terminal pode aplicar os valores resultantes
  no `shared/.env` via SSH depois.
- **Merge das PRs #77, #78, #79, #80:** qualquer IA de terminal com `gh`
  autenticado — atenção ao conflito esperado em `ESTADO_SESSAO.md` entre
  #79 e #80.
- Toda sessão nesta fase de Go-Live segue reportando ao final: Concluído
  / Bloqueadores (Crítico/Alto/Médio/Baixo) / Próxima prioridade /
  Checklist de Go-Live.

## 7. Prompt de handoff

```
Contexto: projeto ELÃ | influência / TEAR (Estúdio Elã). O primeiro
deploy real de produção aconteceu nesta sessão (2026-07-23) — o sistema
está no ar e respondendo (/up, /api/health, / todos 200), mas só no
domínio temporário da Locaweb (elafashionmkt1.hospedagemdesites.ws),
em HTTP, sem SSL. Não é ainda o Go-Live formal.

Decisão de arquitetura tomada pelo responsável do projeto: PostgreSQL
está indisponível no painel Locaweb, banco de produção passou a ser
MySQL. Código já migrado e funcionando, mas SEM ADR FORMAL ainda —
primeira prioridade da próxima sessão é fechar essa lacuna de governança
(ver TASK_ROUTER.md §47).

Quatro PRs draft abertas, sem código pendente, só decisão de merge:
- PR #77 (docs/governance-phase2): modelo de governança Fase 2.
- PR #78 (worktree-fix-dev-env): composer dev unificado.
- PR #79 (docs/ai-constitution-notebooklm): AI_CONSTITUTION.md + NotebookLM.
- PR #80 (docs/locaweb-infrastructure): todo o trabalho de infraestrutura
  e o primeiro deploy real (esta sessão + a anterior).
⚠️ PR #79 e #80 vão conflitar em ESTADO_SESSAO.md no merge — resolver
mantendo o conteúdo mais recente.

Pendências reais para o Go-Live formal (nenhuma é bloqueio de código):
1. DNS de elafashionmkt.com.br aponta para GitHub Pages, não para a
   Locaweb — corrigir no provedor de DNS.
2. SSL não emitido em nenhum domínio.
3. SMTP e Google Drive ainda com placeholders (shared/.env no host).
4. APP_URL/SESSION_DOMAIN apontam para o domínio temporário, trocar
   para o definitivo assim que 1-2 estiverem resolvidos.

Leia antes de começar: TASK_ROUTER.md §47 (esta sessão, detalhe completo
do deploy) e §46 (sessão anterior).

Regras: não alterar arquitetura sem ADR (a MySQL precisa de um agora);
não criar documentação duplicada; uma frente por vez; validar antes de
commit; docs/AI_CONSTITUTION.md é congelada (não editar sem pedido
explícito); reportar ao final: Concluído / Bloqueadores (Crítico/Alto/
Médio/Baixo) / Próxima prioridade / Checklist de Go-Live.
```

## 8. Checklist

### Primeiro deploy real de produção (esta sessão)

- [x] Auditoria de consistência dos 5 fatos confirmados vs. documentos
      soberanos
- [x] `scripts/deploy-locaweb.sh`, `crontab.example`, `backup-db.sh`
      corrigidos para `php83`
- [x] `restore-db.sh` migrado de Docker para `psql` direto
- [x] Decisão de MySQL tomada e aplicada em código
      (`.env.production.example`, workflow, `AppServiceProvider`)
- [x] Banco `influenciaela` (MySQL) criado e operacional
- [x] Chave SSH de deploy gerada e `authorized_keys` configurado
- [x] 4 secrets do GitHub Actions cadastrados
- [x] Estrutura `releases/`+`shared/` criada no host
- [x] `shared/.env` de produção montado (com placeholders temporários
      sinalizados)
- [x] Bug de migration MySQL (índice/FK) corrigido
- [x] `public_html` → `current/public` resolvido via symlink
- [x] Pipeline de deploy rodou verde de ponta a ponta
- [x] Sistema respondendo em produção, confirmado por request real
- [ ] ADR formal da decisão MySQL
- [ ] DNS de `elafashionmkt.com.br` corrigido
- [ ] SSL emitido
- [ ] SMTP real configurado
- [ ] Google Drive real configurado
- [ ] `APP_URL`/`SESSION_DOMAIN` trocados para o domínio definitivo

### Achados de sessões anteriores (inalterados)

- [ ] PR #77 mergeada (governança Fase 2)
- [ ] PR #78 mergeada (composer dev)
- [ ] PR #79 mergeada (AI_CONSTITUTION.md + NotebookLM)
- [ ] PR #80 mergeada (infraestrutura Locaweb + primeiro deploy)
- [ ] Decisão sobre as ~22 fontes legadas remanescentes no notebook
- [ ] Decisão sobre reestruturar `ESTADO_SESSAO.md` (proposta pendente)

### Fases anunciadas, não iniciadas

- [ ] Reorganização dos repositórios GitHub
- [ ] Go-Live formal (SSL + DNS + SMTP + Google Drive reais, domínio
      definitivo)
