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
> **Nota (2026-07-23):** `docs/governanca/GOVERNANCA_DO_PROJETO.md` só
> existe na branch não mesclada `docs/governance-phase2` (PR #77) — não
> existe nesta branch nem em `main`. Se um protocolo de sessão futuro
> pedir para reler esse arquivo, confirme primeiro que ele existe no
> checkout atual antes de assumir que existe (ver §2 abaixo).

## 1. Estado atual

- **Data desta atualização:** 2026-07-23.
- **O TEAR segue no ar em produção** desde a sessão anterior (`GET /up`,
  `/api/health`, `/` todos 200), sem mudança nesta sessão — só o domínio
  temporário Locaweb (`elafashionmkt1.hospedagemdesites.ws`), HTTP, sem
  SSL. Não é ainda o Go-Live formal.
- **`main` (remoto, `origin/main`):** inalterado nesta sessão. Último
  commit: `c96d460`.
- **`main` local segue 1 commit à frente do remoto, nunca pushado**
  (inalterado): `8060e18 docs(governance): establish Phase 2 governance
  model` — é o commit da PR #77, agora **auditado nesta sessão** com
  achado grave (ver §2 e §4).
- **Quatro PRs draft abertas, pendentes de decisão de merge — três
  inalteradas em código, uma cresceu nesta sessão:**
  1. `worktree-fix-dev-env` — **PR #78** — `composer dev` unificado.
     Inalterada.
  2. `docs/ai-constitution-notebooklm` — **PR #79** — `AI_CONSTITUTION.md`
     + NotebookLM. Inalterada em código; **auditada nesta sessão** — 4
     ajustes menores identificados, recomendação: ajustar antes de
     mesclar (não mesclar como está, não descartar). Detalhe:
     `TASK_ROUTER.md` §49.
  3. `docs/governance-phase2` — **PR #77** — modelo de governança Fase
     2. Inalterada em código; **auditada nesta sessão** — defeito grave
     encontrado (sobrescreve `ESTADO_SESSAO.md` com conteúdo de
     governança, perde dado operacional real se mesclada). Recomendação:
     **descartar e refazer**, não só ajustar. Detalhe: `TASK_ROUTER.md`
     §49.
  4. `docs/locaweb-infrastructure` — **PR #80** — todo o trabalho de
     infraestrutura Locaweb + primeiro deploy + esta sessão. **1 commit
     novo nesta sessão:** `dd16df0` (rename de domínio, ver §2).
  ⚠️ **Risco de conflito em `ESTADO_SESSAO.md` agora é de 3 vias**, não
  2: PR #77, #79 e #80 reescrevem esse arquivo a partir de bases
  diferentes de `main`. A versão da PR #77 é a defeituosa — **não usar
  como base de merge**.
- **Domínio definitivo do produto TEAR renomeado nesta sessão:**
  `influencia.estudioela.com` (decisão de 2026-07-22) →
  **`portal.estudioela.com`** (decisão de 2026-07-23). Propagado em
  `backend/.env.production.example` e em toda a documentação de deploy.
  DNS ainda **não** aponta para a Locaweb — ver §4.
- **Working tree:** limpa, tudo commitado e pushado
  (`git status --short` vazio ao final da sessão).
- **Go-Live de produção formal: ainda NÃO AUTORIZADO** (SSL, DNS do
  domínio definitivo, SMTP e Google Drive reais faltando — ver §4).

## 2. Última sessão concluída — Rename de domínio + auditoria de
   governança (PR #77 vs PR #79) (2026-07-23)

Sessão sem alteração de código de `tear-v2-app/`. Duas frentes
sequenciais, a pedido direto do responsável do projeto. Detalhe
completo: `TASK_ROUTER.md` §48 (frente 1) e §49 (frente 2).

**Frente 1 — DNS e rename de domínio:**

1. Confirmado por consulta DNS ao vivo (`dig`/`whois`, reconfirma
   achado já registrado em sessão anterior): provedor DNS autoritativo
   de `estudioela.com` é o **WordPress.com**. Apex já aponta
   corretamente para GitHub Pages — sem mudança necessária.
2. **Achado:** `portal.estudioela.com` (subdomínio já criado no painel
   Locaweb pelo responsável do projeto) ainda resolvia via `CNAME` para
   `estudioela.github.io` (GitHub Pages) — resquício antigo, não
   Locaweb. Confirmado que a criação do subdomínio no painel Locaweb é
   só configuração local do servidor, não escreve em DNS público — não
   precisa ser desfeita.
3. **Decisão do responsável do projeto:** `portal.estudioela.com`
   substitui `influencia.estudioela.com` (decisão de 2026-07-22) como
   nome definitivo do produto TEAR. Rename propagado em 14 arquivos
   (`.env.production.example` + 13 documentos), preservando a
   cronologia real nas entradas de log datadas (o que foi decidido em
   07-22 continua registrado como tal). Commit `dd16df0`, pushado.
4. **Pendente — ação externa, fora do alcance do agente:** trocar o
   registro de `portal.estudioela.com` de `CNAME` para `A` →
   `191.252.83.211` no painel DNS do WordPress.com. Ver §4.

**Frente 2 — "5 Regras de Ouro" e auditoria de governança:**

1. Pedido do responsável do projeto: institucionalizar "5 Regras de
   Ouro" do projeto. Busca em todo o repositório (todas as branches)
   não encontrou esse documento em lugar nenhum — nem mesclado, nem em
   PR aberta.
2. Seguindo instrução explícita do responsável do projeto, **nenhum
   documento foi criado por inferência**. Em vez disso, redirecionado
   para auditar `docs/AI_CONSTITUTION.md` (PR #79) quanto a consistência
   com o resto da documentação de governança.
3. **Achado não previsto:** existe uma segunda branch de governança,
   `docs/governance-phase2` (**PR #77**, commit `8060e18`, o mesmo
   commit já listado como "não investigado" em sessões anteriores).
   Cria `docs/governanca/GOVERNANCA_DO_PROJETO.md` com exatos 5
   princípios numerados — candidato mais próximo a uma origem real das
   "5 Regras de Ouro", mas **não tratado como resolvido**, por instrução
   do responsável do projeto.
4. Auditoria completa das duas PRs, com recomendação técnica (ver §1 e
   `TASK_ROUTER.md` §49). Nenhuma decisão de merge foi tomada — fica
   para o responsável do projeto.

## 3. Próxima tarefa recomendada

**Nenhuma decisão bloqueante de código.** Em ordem de impacto:

1. **Decidir o destino da PR #77** (descartar/refazer, conforme
   recomendação técnica desta sessão, ou revisar pessoalmente antes de
   decidir) — bloqueia tanto a consolidação de governança quanto o tema
   "5 Regras de Ouro", que só deve ser retomado depois, derivado da
   Constituição oficial (nunca reconstruído por inferência).
2. **Formalizar a decisão de MySQL** com um ADR (ex.: `ADR-019`),
   seguindo o padrão de `ADR-016` — ainda pendente desde a sessão
   anterior, mudança já está em produção. Trabalho de documentação
   pura, ~30min.
3. **Aplicar os 4 ajustes na PR #79** (`TASK_ROUTER.md` §49) e mesclar.
4. **Ação externa de DNS:** trocar `portal.estudioela.com` de `CNAME`
   para `A` → `191.252.83.211` no painel WordPress.com — só o
   responsável do projeto tem acesso a esse painel.
5. **Corrigir o DNS de `elafashionmkt.com.br`** (aponta para GitHub
   Pages, não para a Locaweb) — pendência antiga, domínio diferente de
   `estudioela.com`, mesma classe de problema.
6. **Emitir SSL**, depois **preencher SMTP e Google Drive reais** no
   `shared/.env` — pendências antigas, inalteradas.

## 4. Pendências/bloqueios

- **Decisão sobre PR #77 pendente** (novo) — recomendação técnica desta
  sessão foi descartar/refazer; decisão final é do responsável do
  projeto. Enquanto pendente, **não usar a versão de `ESTADO_SESSAO.md`
  dessa branch como base de merge** — ela sobrescreve o conteúdo
  operacional real.
- **PR #79 precisa de 4 ajustes antes de mesclar** (novo, detalhe em
  `TASK_ROUTER.md` §49) — nenhum é reescrita de princípio, todos são
  integração/duplicação textual.
- **"5 Regras de Ouro" pausadas** (novo) — não existem em nenhum
  documento do projeto; se ainda fizerem sentido, devem ser derivadas
  da Constituição oficial (a definir entre PR #77/#79), nunca
  reconstruídas por memória ou inferência.
- **`portal.estudioela.com` ainda resolve para GitHub Pages** (`CNAME`
  antigo), não para a Locaweb — precisa de registro `A` →
  `191.252.83.211` no painel WordPress.com; ação externa, fora do
  alcance do agente.
- **ADR da decisão MySQL não existe ainda** (inalterado desde sessão
  anterior) — troca de engine já está em produção sem o registro formal
  exigido por `CLAUDE.md`.
- **DNS de `elafashionmkt.com.br` aponta para GitHub Pages**, não para a
  Locaweb (inalterado) — contornado só para o pipeline de deploy (IP
  direto nos secrets), não para tráfego público.
- **SSL não emitido em nenhum domínio** (inalterado) — produção está em
  HTTP puro, `SESSION_SECURE_COOKIE=false` temporário.
- **SMTP real não configurado** (inalterado, `MAIL_MAILER=log`).
- **Google Drive real não configurado** (inalterado,
  `GOOGLE_DRIVE_*=CHANGE_ME`) — upload de Material retorna 503.
- **`APP_URL`/`SESSION_DOMAIN` apontam para o domínio temporário
  Locaweb** (inalterado), não para `portal.estudioela.com` — trocar
  assim que DNS/SSL estiverem resolvidos.
- **Commit `8060e18` em `main` local, nunca pushado** — agora associado
  à PR #77, cuja auditoria desta sessão recomenda descartar.
- **Merge das PRs #77 (recomendado descartar), #78, #79 (recomendado
  ajustar), #80** — inalterado quanto a #78/#80, decisões novas para
  #77/#79 nesta sessão.
- **~22 fontes legadas no notebook `tear`** — inalterado.
- **12 decisões de negócio pendentes só no histórico do Git** —
  inalterado, recuperável via `git show fe5ccf8→3057e79`.
- Itens ainda pendentes de validação em `docs/deployment/LOCAWEB.md`:
  limite real de bancos, disponibilidade de MS SQL, crontab nativo,
  emissão efetiva de SSL, quota de disco/CPU, IP do proxy reverso, host/
  porta SMTP — inalterado.
- Congelamento de Participação incompleto (`ADR-018`) — inalterado.
- Validação ponta a ponta dos 2 fluxos de e-mail com SMTP real — ainda
  não executada (bloqueada por SMTP real não configurado).
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

1. **Merge acidental/descuidado da PR #77** (novo, alto) — apagaria
   `ESTADO_SESSAO.md` operacional real (PRs abertas, pendências, status
   de deploy), substituindo por conteúdo de governança duplicado e com
   artefato de citação de IA vazado no texto.
2. **Conflito de merge em `ESTADO_SESSAO.md` agora é de 3 vias** (PR
   #77, #79, #80) — resolver na hora do merge, nunca usando a versão da
   PR #77 como base.
3. **`portal.estudioela.com` não resolve para produção** (novo,
   específico) — DNS ainda aponta para GitHub Pages; ação externa
   pendente no painel WordPress.com.
4. **Produção rodando em arquitetura (MySQL) sem ADR formal**
   (inalterado) — risco de governança, não técnico.
5. **Domínio `elafashionmkt.com.br` não serve o site** (inalterado, DNS
   aponta para GitHub Pages) — só o domínio temporário Locaweb funciona.
6. **Sessão de usuário em HTTP puro, sem cookie seguro** (inalterado,
   temporário até SSL).
7. **Nenhum e-mail transacional é enviado de verdade** (inalterado,
   SMTP em modo log).
8. **Upload de Material bloqueado (503)** (inalterado) até Google Drive
   real ser configurado.
9. Quatro PRs abertas em paralelo sem decisão de merge (inalterado
   quanto à quantidade; duas delas — #77/#79 — agora têm recomendação
   técnica registrada).
10. Perda de rastreabilidade de até 12 decisões de negócio (inalterado,
    mitigável via Git).
11. Validação comercial concentrada em piloto único; bus factor 1
    (inalterado).
12. SPF/DKIM/DMARC não verificados (inalterado).

## 6. IA recomendada para a próxima tarefa

- **Decisão sobre PR #77 / "5 Regras de Ouro":** decisão do responsável
  do projeto, não de IA — mas qualquer IA de terminal pode executar o
  descarte/refação da PR #77 depois da decisão, seguindo a recomendação
  técnica em `TASK_ROUTER.md` §49.
- **Ajustar e mesclar PR #79:** qualquer IA de terminal — os 4 ajustes
  são pequenos e bem definidos (ver `TASK_ROUTER.md` §49).
- **Formalizar ADR da decisão MySQL:** qualquer IA de terminal — tarefa
  de documentação pura, seguindo o padrão já estabelecido por
  `ADR-016`.
- **Ação de DNS de `portal.estudioela.com` / corrigir DNS de
  `elafashionmkt.com.br` / emitir SSL / preencher SMTP e Google Drive
  reais:** decisões e execução do responsável do projeto em painéis
  externos (WordPress.com, Locaweb, Google Cloud Console) — não é
  trabalho de código, mas uma IA de terminal pode aplicar os valores
  resultantes no `shared/.env` via SSH depois.
- Toda sessão nesta fase de Go-Live segue reportando ao final: Concluído
  / Bloqueadores (Crítico/Alto/Médio/Baixo) / Próxima prioridade /
  Checklist de Go-Live.

## 7. Prompt de handoff

```
Contexto: projeto ELÃ | influência / TEAR (Estúdio Elã). O primeiro
deploy real de produção aconteceu numa sessão anterior (2026-07-23) — o
sistema está no ar e respondendo, mas só no domínio temporário da
Locaweb (elafashionmkt1.hospedagemdesites.ws), em HTTP, sem SSL. Não é
ainda o Go-Live formal.

Nesta sessão (mesma data): domínio definitivo do produto renomeado de
influencia.estudioela.com para portal.estudioela.com (decisão do
responsável do projeto) — propagado em .env.production.example e toda a
documentação. DNS público de portal.estudioela.com ainda NÃO aponta
para a Locaweb (continua CNAME para GitHub Pages) — precisa virar
registro A -> 191.252.83.211 no painel WordPress.com, ação que só o
responsável do projeto pode fazer.

Também nesta sessão: auditoria de governança encontrou uma PR não
mencionada antes, PR #77 (docs/governance-phase2), com defeito grave —
o commit sobrescreve ESTADO_SESSAO.md inteiro com conteúdo de
governança, o que apagaria dado operacional real se mesclada como está.
Recomendação técnica: descartar/refazer PR #77, ajustar PR #79
(AI_CONSTITUTION.md, 4 pontos pequenos) antes de mesclar. Nenhuma das
duas decisões foi tomada ainda pelo responsável do projeto. Detalhe
completo: TASK_ROUTER.md §49.

"5 Regras de Ouro" pedidas pelo responsável do projeto não existem em
nenhum documento do repositório (busca em todas as branches). Não
foram reconstruídas por inferência, por instrução explícita dele. Se o
tema voltar, derivar só da Constituição oficial depois que PR #77/#79
forem resolvidas — nunca criar um documento novo sem fonte confirmada.

Decisão de arquitetura de sessão anterior, ainda sem ADR formal:
PostgreSQL indisponível no painel Locaweb, banco de produção passou a
ser MySQL. Código já migrado e funcionando, SEM ADR FORMAL ainda —
prioridade alta da próxima sessão.

Quatro PRs draft abertas, sem código pendente, decisões de merge
diferentes para cada uma:
- PR #77 (docs/governance-phase2): recomendado descartar/refazer.
- PR #78 (worktree-fix-dev-env): composer dev unificado, sem mudança.
- PR #79 (docs/ai-constitution-notebooklm): recomendado ajustar (4
  pontos) antes de mesclar.
- PR #80 (docs/locaweb-infrastructure): todo o trabalho de
  infraestrutura, primeiro deploy real e o rename de domínio desta
  sessão.
⚠️ Conflito de merge em ESTADO_SESSAO.md agora é de 3 vias (#77/#79/
#80) — nunca usar a versão da PR #77 como base.

Pendências reais para o Go-Live formal (nenhuma é bloqueio de código):
1. DNS de portal.estudioela.com (CNAME -> A) e de elafashionmkt.com.br
   (aponta para GitHub Pages) — corrigir no provedor de DNS.
2. SSL não emitido em nenhum domínio.
3. SMTP e Google Drive ainda com placeholders (shared/.env no host).
4. APP_URL/SESSION_DOMAIN apontam para o domínio temporário, trocar
   para portal.estudioela.com assim que 1-2 estiverem resolvidos.

Leia antes de começar: TASK_ROUTER.md §48 (rename de domínio) e §49
(auditoria de governança, esta sessão); §47 (deploy real, sessão
anterior).

Regras: não alterar arquitetura sem ADR (MySQL precisa de um agora);
não criar documentação duplicada; uma frente por vez; validar antes de
commit; docs/AI_CONSTITUTION.md é congelada (não editar sem pedido
explícito); "5 Regras de Ouro" não existem — não reconstruir por
inferência; reportar ao final: Concluído / Bloqueadores (Crítico/Alto/
Médio/Baixo) / Próxima prioridade / Checklist de Go-Live.
```

## 8. Checklist

### Rename de domínio + auditoria de governança (esta sessão)

- [x] Provedor DNS autoritativo de `estudioela.com` reconfirmado
      (WordPress.com)
- [x] `portal.estudioela.com` confirmado como resquício de GitHub Pages
      (`CNAME` antigo), não Locaweb
- [x] Criação do subdomínio no painel Locaweb confirmada como
      inofensiva (não escreve em DNS público)
- [x] Rename `influencia.estudioela.com` → `portal.estudioela.com` em
      14 arquivos, cronologia histórica preservada
- [x] `TASK_ROUTER.md` §48 registrado; commit `dd16df0` pushado
- [x] Busca por "5 Regras de Ouro" em todo o repositório/branches —
      confirmado que não existem
- [x] Auditoria de `AI_CONSTITUTION.md` (PR #79) — 4 ajustes
      identificados
- [x] Auditoria de `docs/governance-phase2` (PR #77) — defeito grave
      encontrado e documentado
- [x] Recomendação técnica apresentada (PR #79 ajustar, PR #77
      descartar/refazer) — decisão pendente do responsável do projeto
- [ ] Registro `A` de `portal.estudioela.com` → `191.252.83.211` no
      painel WordPress.com (ação externa)
- [ ] Decisão sobre PR #77
- [ ] Ajustes na PR #79 aplicados e mesclada

### Primeiro deploy real de produção (sessão anterior)

- [x] Auditoria de consistência dos 5 fatos confirmados vs. documentos
      soberanos
- [x] `scripts/deploy-locaweb.sh`, `crontab.example`, `backup-db.sh`
      corrigidos para `php83`
- [x] `restore-db.sh` migrado de Docker para `psql` direto
- [x] Decisão de MySQL tomada e aplicada em código
- [x] Banco `influenciaela` (MySQL) criado e operacional
- [x] Chave SSH de deploy gerada e `authorized_keys` configurado
- [x] 4 secrets do GitHub Actions cadastrados
- [x] Pipeline de deploy rodou verde de ponta a ponta
- [x] Sistema respondendo em produção, confirmado por request real
- [ ] ADR formal da decisão MySQL
- [ ] DNS de `elafashionmkt.com.br` corrigido
- [ ] SSL emitido
- [ ] SMTP real configurado
- [ ] Google Drive real configurado
- [ ] `APP_URL`/`SESSION_DOMAIN` trocados para `portal.estudioela.com`

### Achados de sessões anteriores (inalterados)

- [ ] PR #78 mergeada (composer dev)
- [ ] Decisão sobre as ~22 fontes legadas remanescentes no notebook
- [ ] Decisão sobre reestruturar `ESTADO_SESSAO.md` (proposta pendente)

### Fases anunciadas, não iniciadas

- [ ] Reorganização dos repositórios GitHub
- [ ] Go-Live formal (SSL + DNS + SMTP + Google Drive reais, domínio
      definitivo)
