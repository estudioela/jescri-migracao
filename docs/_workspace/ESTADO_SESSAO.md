# ESTADO_SESSAO.md — Protocolo Operacional do Projeto

> Reescrito por `/fim` ao final de cada sessão; lido por `/comecar` no início
> da próxima. É o **cockpit** — snapshot curto e sempre atual. Não duplica
> histórico: para decisões de SPEC e histórico completo, ver
> `docs/_workspace/TASK_ROUTER.md`; para fases/calendário do negócio, ver
> `docs/planning/PLANO_MESTRE_ELA_INFLUENCIA.md`; para a lista de leitura
> obrigatória antes de alterar código, ver `CLAUDE.md` §Documentos oficiais.

## 1. Estado atual

- **Data desta atualização:** 2026-07-23
- **HEAD de `feat/ui-design-system-ela`:** `a82d77f`, pushado e
  sincronizado com `origin/feat/ui-design-system-ela`.
- **Branch:** `feat/ui-design-system-ela`.
- **Working tree:** limpo.
- **Sistema em foco:** o repositório inteiro (missão de limpeza
  estrutural), não uma SPEC específica de `tear-v2-app`. Nenhum código de
  `tear-v2-app` foi alterado nesta sessão — só estrutura de arquivos e
  documentação.
- **Go-Live de produção: continua NÃO AUTORIZADO**, pendente só de
  infraestrutura externa ao código (inalterado desde a sessão anterior;
  ver `docs/release/GATE_FINAL_GO_LIVE.md`).
- **Suíte revalidada nesta sessão** (antes da limpeza de docs, sem código
  alterado depois): backend `php artisan test` 208/208 verde,
  `vendor/bin/pint --test` limpo, `tsc -b && vite build` sem erros,
  `oxlint` só o aviso pré-existente não relacionado (`src/lib/auth.tsx`).

## 2. Última sessão concluída — Missão de limpeza estrutural do repositório, 6 rodadas (2026-07-23)

Sessão longa, autorizada explicitamente pelo responsável do projeto para
reduzir agressivamente a árvore de arquivos ativa. Cinco commits em
`feat/ui-design-system-ela`: `fe5ccf8` → `8c001c8` → `4fc6b36` → `eeefbf7`
→ `3057e79` → `a82d77f`.

1. **Remoção do Portal legado em Google Apps Script** (`fe5ccf8`):
   confirmado pelo responsável do projeto como descontinuado/substituído —
   `tear-v2-app` é a única aplicação oficial. Removidos `src/` (14 `.js` +
   13 `.html`), `test/` (86 testes Jest + helpers), `eslint.config.js`,
   `.clasp.json.example`, `.claspignore`, `appsscript.json`,
   `scripts/preview-server.mjs`, `package.json`/`package-lock.json` da
   raiz. Antes da remoção, o algoritmo de normalização de
   `ChaveInfluenciadora` (só existia no código) foi extraído para
   `docs/specs/SPEC-003-importacao-inicial-da-base.md` §6.1.
   `PROJECT_GOVERNANCE.md`, `DEPLOY_CHECKLIST.md`, `ROTEIRO_HOMOLOGACAO.md`
   (100% sobre o legado) inicialmente arquivados, depois removidos de
   vez na rodada 5. `README.md` e `knowledge/README.md` reescritos para
   descrever `tear-v2-app` como o produto oficial.
2. **Consolidação de ADRs e mais documentos superados** (`8c001c8`):
   `ADR-002` marcado "Superseded by ADR-015" (nunca implementado);
   5 ADRs do legado ganharam nota histórica (depois removidos na rodada
   5); `docs/architecture/ARQUITETURA_CAMADAS.md` e
   `docs/design/stitch-export/screens/` (mockups já implementados como
   páginas reais) arquivados; `docs/deployment/PLANO_IMPLEMENTACAO.md`
   arquivado só depois de remapear ~9 citações "Etapa N" em documentos
   vivos de deploy para a numeração de `PLANO_DE_IMPLANTACAO.md` (as duas
   versões têm etapas diferentes).
3. **Redução da raiz** (`4fc6b36`): `knowledge/` incorporado a
   `docs/knowledge/` (scripts de sync com NotebookLM atualizados para o
   novo caminho). Confirmado que `mcp/` (servidor MCP real, expõe status
   de ambiente para sessões de IA) e `scripts/` (sync real com NotebookLM
   via `nlm`, binário instalado e em uso) são ferramentas ativas, não
   lixo — mantidos na raiz.
4. **Padronização de nomenclatura** (`eeefbf7`): as 15 SPECs (só tinham
   número, ex. `SPEC-003.md`) e `ADR-001` (único slug em UPPERCASE)
   renomeadas para `ID-slug-descritivo-em-portugues.md`, seguindo o
   padrão já usado pelos demais ADRs. Numeração preservada (histórica,
   lacunas 006-009 mantidas). Todas as referências de caminho corrigidas.
5. **Reversão da estratégia de arquivamento — remoção definitiva**
   (`3057e79`/`a82d77f`): o responsável do projeto considerou o
   arquivamento (`git mv` para `docs/archive/`) "conservador demais" e
   determinou o critério final: **conhecimento já consolidado em fonte
   vigente = documento antigo removido da árvore (`git rm`), não
   arquivado.** Removidos: `docs/archive/` inteiro (64 arquivos),
   `docs/reports/` inteiro (7 arquivos — achados específicos confirmados
   já presentes em `ESTADO_SESSAO.md`/`TASK_ROUTER.md` antes da remoção),
   `docs/knowledge/archive/` e `docs/knowledge/references/` (8 arquivos),
   e mais 8 ADRs sobre o legado removido/nunca implementado (`001`, `002`,
   `004`, `005`, `010`, `011`, `013`, `014`). Restam 6 ADRs vigentes
   (`003`, `012`, `015`, `016`, `017`, `018`). Referências corrigidas em
   todos os documentos vivos que citavam os arquivos removidos.
6. **Resultado:** `docs/` passa de ~102 arquivos `.md` (linha de base da
   missão de simplificação documental original, `TASK_ROUTER.md` §28)
   para 50 arquivos em 9 pastas temáticas, todas vigentes. Raiz do
   repositório passa de ~15 itens para 10 (`.claude`, `.git`, `.github`,
   `.gitignore`, `CLAUDE.md`, `docs/`, `mcp/`, `README.md`, `scripts/`,
   `tear-v2-app`). Detalhe completo de cada decisão em `TASK_ROUTER.md`
   §42-§44.

## 3. Próxima tarefa recomendada

Nenhuma pendência de código. Decisão do responsável do projeto entre:

1. **Fase separada já anunciada: reorganização dos repositórios GitHub**
   (manter só 2 repositórios principais, renomear `jescri-migracao` para
   `portal-ela`, excluir os demais). Explicitamente **não iniciada nesta
   sessão** por instrução do responsável do projeto. Quando essa fase
   começar: `gh repo rename`/`gh repo delete` exigem permissões
   administrativas e o escopo `delete_repo` do token `gh` — se a sessão
   que executar não tiver esse escopo, ela deve entregar os comandos
   `gh` exatos (ou o caminho na interface do GitHub) em vez de parar a
   tarefa, conforme já orientado pelo responsável do projeto.
2. **Autorizar preparação de infraestrutura de produção** (Locaweb real,
   PostgreSQL, DNS/TLS, `.env` de produção, SMTP) — único bloqueio real
   para o Go-Live, seguindo `docs/release/GATE_FINAL_GO_LIVE.md`.
3. **Reconciliar `docs/knowledge/.notebook-index.json`** — tem entradas
   para arquivos já removidos (ver §4 abaixo). Rodar
   `scripts/clean-notebook.sh` para sincronizar com o notebook real do
   NotebookLM (não é urgente, é limpeza de estado externo).

## 4. Pendências/bloqueios (decisão do responsável do projeto)

- **Nenhum bloqueador funcional (Categoria A) em aberto** no código de
  `tear-v2-app` — inalterado desde a sessão anterior.
- **12 decisões de negócio pendentes ficaram só no histórico do Git, não
  mais na árvore ativa:** `docs/planning/ESPECIFICACAO_FUNCIONAL_MVP_COMPLETA.md`
  §9 tinha uma lista de 12 decisões do responsável do projeto ainda em
  aberto (recorrência/parcelamento de pagamento é a "de maior
  alavancagem" — já rastreada separadamente em `ESTADO_SESSAO.md`/
  `TASK_ROUTER.md` como limitação de escopo conhecida). O arquivo foi
  removido nesta sessão (rodada 5, junto com todo `docs/archive/`) sem
  que as outras 11 decisões fossem extraídas para um documento vigente —
  **só a de recorrência já tinha rastreamento próprio antes**. As demais
  11 não estão mais em nenhum documento ativo, só recuperáveis via
  `git log`/`git show` no commit `fe5ccf8`→`3057e79` (arquivo estava em
  `docs/archive/planejamento-pre-codigo/ESPECIFICACAO_FUNCIONAL_MVP_COMPLETA.md`
  antes de `3057e79`). **Se alguma dessas 11 decisões for real e ainda
  não resolvida, vale recuperar o arquivo do histórico do Git antes que
  a memória de qual eram se perca.**
- **Congelamento de Participação incompleto frente ao gap real**
  (`ADR-018`): sem cópia de dados da Parceira nem trilha de auditoria. Se
  algum fluxo (ex.: geração de Contrato no Sprint 3) precisar dessa
  garantia, o modelo completo precisa ser **refeito como trabalho novo**
  — o plano de arquitetura original foi removido da árvore (não só
  arquivado) nesta sessão.
- **`docs/knowledge/.notebook-index.json`** tem entradas obsoletas
  (inclusive de antes desta sessão — nomes que não correspondem a
  nenhuma estrutura já vista no repositório). Não editado à mão para não
  gerar inconsistência com o notebook remoto real; reconciliar rodando
  `scripts/clean-notebook.sh`.
- Validação ponta a ponta dos 2 fluxos de e-mail (convite, reset) com
  SMTP real — não executada (inalterado).
- SPF/DKIM/DMARC do domínio `elafashionmkt.com.br` não verificados
  (inalterado).
- Limite diário de envio do plano Locaweb não levantado (inalterado).
- Recorrência/parcelamento de pagamento não implementado — limitação de
  escopo conhecida, não bug (inalterado).
- Estratégia de infraestrutura do PostgreSQL, autenticação de deploy,
  DNS de `influencia.estudioela.com` — inalterados (ver
  `docs/release/GATE_FINAL_GO_LIVE.md` para o gate completo de infra).
- **Categoria B (não bloqueia certificação funcional, registrado
  integralmente em sessões anteriores, inalterado nesta sessão):**
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

1. **Novo nesta sessão:** perda de rastreabilidade de até 11 decisões de
   negócio pendentes (ver §4) — mitigável recuperando o arquivo do
   histórico do Git, mas não feito automaticamente.
2. PostgreSQL indisponível no plano atual da Locaweb — impacto em
   custo/cronograma (inalterado).
3. Pipeline de deploy com incompatibilidade de autenticação não resolvida
   (inalterado).
4. DNS de `influencia.estudioela.com` não apontado (inalterado).
5. Validação comercial concentrada em piloto único ainda não confirmado;
   bus factor 1 (inalterado).
6. SPF/DKIM/DMARC não verificados no domínio de envio (inalterado, baixo
   risco imediato).
7. **Mitigado nesta sessão:** repositório com dezenas de documentos
   históricos/redundantes dificultando navegação — `docs/` reduzido de
   ~102 para 50 arquivos, raiz de ~15 para 10 itens, nomenclatura de
   SPECs/ADRs padronizada.

## 6. IA recomendada para a próxima tarefa

- **Reorganização dos repositórios GitHub (fase anunciada, não
  iniciada):** qualquer IA com acesso a `gh` autenticado; se faltar
  escopo `delete_repo`, a IA deve entregar os comandos `gh` exatos para
  o responsável do projeto executar, não travar a tarefa.
- **Decisão de autorizar infraestrutura/Go-Live:** decisão do
  responsável do projeto, não requer IA.
- **Recuperação das 11 decisões de negócio do histórico do Git (se
  decidido fazer):** qualquer IA — é um `git show` num commit específico,
  não requer contexto arquitetural profundo.
- Toda sessão nesta fase de Go-Live segue reportando ao final: Concluído
  / Bloqueadores (Crítico/Alto/Médio/Baixo) / Próxima prioridade /
  Checklist de Go-Live.

## 7. Prompt de handoff

```
Contexto: projeto ELÃ | influência (tear-v2-app, Laravel 13+React), branch
feat/ui-design-system-ela, HEAD a82d77f. Estado completo em
docs/_workspace/ESTADO_SESSAO.md (leia primeiro) e docs/_workspace/
TASK_ROUTER.md §42-§44 (missão de limpeza estrutural, 6 rodadas, mais
recente).

Estado: sessão longa de limpeza estrutural agressiva do repositório,
autorizada explicitamente pelo responsável do projeto. Portal legado em
Google Apps Script (src/, test/) removido — tear-v2-app é a única
aplicação oficial. docs/ reduzido de ~102 para 50 arquivos (removido
docs/archive/, docs/reports/, docs/knowledge/archive+references, 8 ADRs de
legado — não arquivados, removidos de vez, histórico só no Git). Raiz
reduzida de ~15 para 10 itens (knowledge/ incorporado a docs/knowledge/).
SPECs e ADR-001 renomeados com slug descritivo. Nenhum código de
tear-v2-app alterado — suíte revalidada antes da limpeza: 208/208 backend,
tsc -b + vite build ok, oxlint só aviso pré-existente.

Tarefa desta sessão: concluída. Próxima sessão recebe decisão do
responsável do projeto entre (1) fase separada de reorganização dos
repositórios GitHub (manter 2 principais, renomear jescri-migracao para
portal-ela, excluir os demais — gh repo rename/delete exigem permissão
admin + escopo delete_repo, entregar comandos exatos se faltar escopo),
(2) autorizar infraestrutura de produção/Go-Live, ou (3) verificar se
alguma das 11 decisões de negócio que ficaram só no histórico do Git
(docs/planning/ESPECIFICACAO_FUNCIONAL_MVP_COMPLETA.md, removido no
commit 3057e79, recuperável via git show) ainda é relevante.

Regras: não alterar arquitetura sem ADR; não criar documentação
duplicada; uma frente por vez; validar (testes/lint) antes de commit;
reportar ao final: Concluído / Bloqueadores (Crítico/Alto/Médio/Baixo) /
Próxima prioridade / Checklist de Go-Live.
```
