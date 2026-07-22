# ESTADO_SESSAO.md — Protocolo Operacional do Projeto

> Reescrito por `/fim` ao final de cada sessão; lido por `/comecar` no início
> da próxima. É o **cockpit** — snapshot curto e sempre atual. Não duplica
> histórico: para decisões de SPEC e histórico completo, ver
> `docs/_workspace/TASK_ROUTER.md`; para fases/calendário do negócio, ver
> `docs/planning/PLANO_MESTRE_ELA_INFLUENCIA.md`; para a lista de leitura
> obrigatória antes de alterar código, ver `CLAUDE.md` §Documentos oficiais.

## 1. Estado atual

- **Data desta atualização:** 2026-07-22
- **HEAD:** `9ecaded` — commitado e já pushado para
  `origin/feat/ui-design-system-ela`. **Nada pendente de commit**: `git
  status`/`git diff` limpos ao final desta sessão.
- **Branch:** `feat/ui-design-system-ela`.
- **Sistema em foco:** `tear-v2-app/` (Laravel + React) — Go-Live interno,
  seguindo `docs/deployment/PLANO_DE_IMPLANTACAO.md`.
- **Fase do Plano Mestre:** Macrofase A (Go Live interno) — Etapa 1
  concluída (domínio `influencia.estudioela.com` travado). Etapa 2: SSH e
  Composer já auditados/resolvidos no host (ver `AUDITORIA_LOCAWEB.md`
  §4.3 e `ADR-016`); resta levantar IP/CIDR do proxy reverso e host/porta
  do SMTP (pendências, §4 abaixo). **Confirmação oficial do suporte
  Locaweb: o plano Hospedagem I não oferece PostgreSQL** — pendência
  atual é decidir a estratégia de infraestrutura (§4). **Ambiente de
  desenvolvimento local validado ponta a ponta nesta sessão** — o que
  falta para o Go-Live é só infraestrutura remota, não código.
- **Testes:** backend 192/192 verdes (PHPUnit), Pint limpo, `tsc -b` limpo,
  `oxlint` limpo (1 warning pré-existente de fast-refresh em `auth.tsx`,
  não é erro), `vite build` ok. Medido nesta sessão, sem alteração de
  código de produção.

## 2. Última sessão concluída — validação completa do ambiente local (2026-07-22)

Por instrução explícita do responsável do projeto: **não investigar mais
Locaweb/SSH/Composer/ADR-016** (já concluídos em sessão anterior, commit
`9ecaded`) e **tratar PostgreSQL como bloqueio externo temporário**,
registrado só como pendência (ver §4) — sem nova investigação. Foco desta
sessão: validar o ambiente local enquanto se aguarda resposta da Locaweb.
Também por instrução: **não priorizar atualização de `TASK_ROUTER.md`**
nem tarefas de documentação nesta sessão, a menos que necessárias para
executar a etapa — por isso não há nova entrada em `TASK_ROUTER.md` desta
vez (nada aqui é decisão de arquitetura/domínio/SPEC; é validação
operacional).

**Subiu o sistema localmente:** `php artisan serve` (backend, :8000) e
`npm run dev` (frontend, :5173), ambos a partir do `.env`/`.env.example`
já existentes (nenhuma variável de ambiente precisou de correção — uma
suspeita inicial de que `frontend/.env.example` estivesse com conteúdo
errado do backend se mostrou um engano de leitura durante a investigação,
não um bug real; o arquivo já está e sempre esteve correto,
`VITE_API_URL=http://localhost:8000/api`).

**Problema real encontrado e corrigido:** o banco sqlite de desenvolvimento
tinha **7 migrations pendentes** desde 20/07 (`add_reprovacao_to_parceiras_table`
até `add_consentimento_cadastro_to_parceiras_table`) — código já esperava
essas colunas/tabela (`envios`, `briefing_id` em `materiais`), banco local
não. Rodar `php artisan migrate` direto falhou: a migration de
`briefing_id` adiciona coluna `NOT NULL` sem default numa tabela com 3
registros residuais de sessões de QA antigas (SQLite não permite isso em
tabela não vazia). Resolvido fazendo backup do sqlite, resetando-o do zero
e rodando `migrate --seed` — sem erro, banco 100% em dia com o schema
atual. Backup descartado ao final (dado de QA descartável, não é dado de
produção). Nenhuma migration foi alterada — o design already assumia banco
vazio/CI (comentário na própria migration), só o ambiente local estava
desatualizado.

**Validação end-to-end via browser real (Playwright), identidade nova de
ponta a ponta** ("QA Smoke Test 20260722"): cadastro público → aprovação
(ADMIN) → e-mail de primeiro acesso capturado no log (`MAIL_MAILER=log`)
→ definir senha → login → criação de Marca/Campanha → vínculo da parceira
na campanha → briefing (Feed) publicado pelo ADMIN → tentativa de upload
de material → pagamento (PENDENTE→APROVADO→PAGO) → perfil da parceira →
logout. Todos os passos alcançáveis localmente funcionaram sem bug novo.

**Confirmações de comportamentos já conhecidos (não são regressões):**
- Upload de material retorna 503 sem credenciais reais do Google Drive —
  mesma limitação já documentada na sessão de QA de 2026-07-21.
- Pagamento aprova imediatamente numa participação sem nenhum material —
  comportamento correto e já documentado (`PagamentoController::existeMaterialNaoAprovado`
  só bloqueia se existir material `!= APROVADO`, caso vácuo aprova).
- Telefone/CNPJ exibidos sem máscara no perfil/detalhe da parceira — P2
  cosmético já registrado, ainda presente.
- `GESTOR_MARCA` recebe 403 ao tentar criar briefing — esperado, rotas de
  criação (`marcas`, `campanhas`, `participações`, `briefings`, `materiais`
  aprovar/reprovar, `pagamentos`, `envios`) são `role:ADMIN` por desenho
  (`routes/api.php`), não um bug de RBAC.

**Falsa pista descartada:** durante os testes, uma aba do browser parou de
disparar requisições de rede ao clicar em botões (logout, login) mesmo com
os handlers React corretos e o elemento certo sob o cursor. Investigação
a fundo (interceptação de `fetch`/`XHR`, invocação manual do handler,
inspeção do fiber React) confirmou que era **artefato da própria
instrumentação de teste** acumulada numa aba específica (muitos
`page.on`/monkeypatches via `run_code_unsafe`), não um bug do app — uma
aba nova, limpa, reproduziu login/logout perfeitamente. Registrado aqui só
para não ser reinvestigado à toa numa sessão futura.

**Nenhuma mudança de código ou documentação foi commitada nesta sessão**
(`git status`/`git diff` limpos) — só ambiente local (sqlite, já
`.gitignore`d) e validação. Servidores locais (`:8000`/`:5173`) deixados
rodando ao final, com os dados de QA desta sessão (Parceira, Marca,
Campanha, Participação, Briefing, Pagamento) ainda no banco local.

## 3. Próxima tarefa recomendada

1. **Fechar a validação técnica remota da Etapa 2:** habilitar SSH no
   painel da hospedagem `estudioela.com` para levantar o que falta:
   IP/CIDR do proxy reverso (`TRUSTED_PROXIES`) e host/porta do relay SMTP
   — checklist em `AUDITORIA_LOCAWEB.md` §2.1 (Composer já resolvido, ver
   `ADR-016`).
2. **Definir a estratégia de infraestrutura para o PostgreSQL** —
   confirmado oficialmente pelo suporte Locaweb que o plano Hospedagem I
   não oferece PostgreSQL. Decidir entre upgrade para Hospedagem II/III ou
   PostgreSQL externo, conforme `AUDITORIA_LOCAWEB.md`, antes de seguir
   para a Etapa 3 (criar banco de produção).
3. Apontar o DNS de `estudioela.com` para a Locaweb (Etapa 4, depende da
   Etapa 2 fechada).
4. Enquanto a infraestrutura não fecha: o ambiente local está validado e
   pronto para qualquer trabalho de feature/bugfix que surgir — não há
   bloqueio de código para isso.

## 4. Pendências / bloqueios (decisão do responsável do projeto)

- **Definir estratégia de infraestrutura (upgrade para Hospedagem
  II/III ou PostgreSQL externo)**, conforme auditoria da Locaweb —
  suporte confirmou que o plano Hospedagem I não oferece PostgreSQL. Ver
  item 2 do §3 acima.
- Habilitar SSH no painel Locaweb para levantar IP/CIDR do proxy reverso
  e host/porta do SMTP (não pode ser feito pelo agente).
- Apontar o DNS de `estudioela.com` para a Locaweb (depende da Etapa 2
  fechada).
- Ok para arquivar `docs/architecture/DATABASE_MODEL.md` e
  `docs/domain/TEAR.md`, e/ou remover os 4 worktrees obsoletos em
  `.claude/worktrees/`? (baixa prioridade, não bloqueia o Go-Live)
- Preço do piloto externo (simbólico vs. real reduzido).
- Separação da marca do produto da marca da agência, antes do registro no
  INPI.
- Credenciais reais de produção (Google Drive, SMTP) — ainda não
  preenchidas.
- Decisão do que fazer com a branch remota `worktree-spec-mvp-completa`
  (arquivar/apagar) — já integrada via merge, sem urgência técnica.

## 5. Riscos ativos

1. Estratégia de deploy planejada (`ARQUITETURA_PRODUCAO.md` §3) já foi
   ajustada e implementada (`ADR-016`: Composer só no CI, deploy manual
   via `workflow_dispatch`) para lidar com a limitação real de SSH
   temporário/por senha do plano Locaweb — risco tecnicamente mitigado,
   falta só concluir Etapa 2 remota (IP do proxy, SMTP).
2. PostgreSQL confirmado indisponível no plano Hospedagem I da Locaweb
   (ver §3 item 2 e §4) — decisão de estratégia de infraestrutura ainda
   pendente, pode impactar custo/cronograma do Go-Live.
3. Validação comercial concentrada em um único piloto ainda não
   confirmado.
4. Bus factor 1 — fundador único operando agência, produto e suporte.
5. Migração de infraestrutura prevista para novembro coincide com o pico
   sazonal da Jescri em dezembro.

## 6. Documentos de leitura obrigatória na próxima sessão

Lista padrão de `CLAUDE.md` §Documentos oficiais. Para retomar a Etapa 2
remota ou a decisão de estratégia de PostgreSQL, ver também
`docs/deployment/AUDITORIA_LOCAWEB.md` (§2.1, §4.3) e
`docs/adrs/ADR-016-composer-no-ci-deploy-manual.md`.

## 7. IA recomendada para a próxima tarefa

- **Execução de engenharia/terminal** (deploy, scripts, provisionamento de
  infra): **ChatGPT**, por padrão, pela integração com terminal — salvo
  instrução em contrário do responsável do projeto.
- **Reconciliação de documentos/planejamento/auditoria:** **Claude**.
- **Design visual/UX:** sem recomendação padrão registrada ainda.

## 8. Prompt de handoff

```
Contexto: projeto ELÃ | influência (tear-v2-app, Laravel+React), plano de
lançamento comercial em 15/01/2027. Estado e pendências completos em
docs/_workspace/ESTADO_SESSAO.md (leia primeiro) e, para histórico/decisões
de SPEC, docs/_workspace/TASK_ROUTER.md. Leitura obrigatória antes de
alterar código: ver CLAUDE.md §Documentos oficiais.

Estado: ambiente de desenvolvimento local validado ponta a ponta nesta
sessão (backend+frontend rodando, testes verdes, fluxo crítico completo
testado via browser). Deploy depende só de infraestrutura remota, não de
código.

Tarefa desta sessão: (1) definir a estratégia de infraestrutura para o
PostgreSQL — suporte da Locaweb confirmou que o plano Hospedagem I não
oferece PostgreSQL; decidir entre upgrade para Hospedagem II/III ou
PostgreSQL externo, conforme AUDITORIA_LOCAWEB.md. (2) Etapa 2 remota do
PLANO_DE_IMPLANTACAO.md: habilitar SSH para levantar IP/CIDR do proxy
reverso (TRUSTED_PROXIES) e host/porta do SMTP — checklist em
AUDITORIA_LOCAWEB.md §2.1 (Composer e SSH básico já resolvidos, ADR-016).
(3) Depois disso, apontar DNS (Etapa 4).

Regras: não alterar arquitetura sem ADR; não criar documentação duplicada;
uma frente por vez; validar (testes/lint) antes de commit.
```
