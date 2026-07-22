# ESTADO_SESSAO.md — Protocolo Operacional do Projeto

> Reescrito por `/fim` ao final de cada sessão; lido por `/comecar` no início
> da próxima. É o **cockpit** — snapshot curto e sempre atual. Não duplica
> histórico: para decisões de SPEC e histórico completo, ver
> `docs/_workspace/TASK_ROUTER.md`; para fases/calendário do negócio, ver
> `docs/planning/PLANO_MESTRE_ELA_INFLUENCIA.md`; para a lista de leitura
> obrigatória antes de alterar código, ver `CLAUDE.md` §Documentos oficiais.
>
> **Handoff completo desta sessão:** `docs/reports/HANDOFF_GO_LIVE.md` —
> leia lá o detalhe de decisões/riscos/ordem de execução; este arquivo é
> só o snapshot rápido.

## 1. Estado atual

- **Data desta atualização:** 2026-07-22
- **HEAD:** `93578f5` — commitado e **já pushado** para
  `origin/feat/ui-design-system-ela`. **Pendente de commit** (por
  instrução explícita do responsável do projeto no fim desta sessão, "não
  faça novos commits"): este próprio arquivo (`ESTADO_SESSAO.md`) e
  `docs/reports/HANDOFF_GO_LIVE.md` (novo). Nenhum outro arquivo alterado.
- **Branch:** `feat/ui-design-system-ela`.
- **Sistema em foco:** `tear-v2-app/` (Laravel + React) — Go-Live interno,
  seguindo `docs/deployment/PLANO_DE_IMPLANTACAO.md`.
- **Fase do Plano Mestre:** Macrofase A (Go Live interno) — Etapa 1
  concluída (domínio `influencia.estudioela.com` travado); **Etapa 2
  parcialmente validada** (auditoria de painel feita; validação via SSH
  ainda pendente de ação do responsável do projeto).
- **Testes:** sem alteração de código nesta sessão (só documentação) —
  última medição conhecida (sessão anterior): backend 192/192 verdes,
  Pint limpo, `tsc -b`/`oxlint`/`vite build` do frontend limpos.

## 2. Última sessão concluída — auditoria Locaweb + consolidação documental (2026-07-22)

**Parte 1 — Auditoria read-only do painel Locaweb**, gerando
`docs/deployment/AUDITORIA_LOCAWEB.md`. Nenhuma configuração foi alterada
(SSH não habilitado, nenhum banco/domínio/SSL criado). Achados principais:
- A conta Locaweb tem **duas hospedagens Linux ativas** —
  `elafashionmkt.com.br` (agência) e `estudioela.com` (alvo do TEAR) —
  mesmo plano (Hospedagem I Linux), sem custo adicional. A hospedagem
  correta para o TEAR já existe e é compatível, **sem necessidade de
  upgrade, migração ou novo serviço contratado**.
- Confirmado: PHP 8.3 ativo, PostgreSQL disponível (0/10 usados), Crontab
  nativo disponível, SSL Let's Encrypt gratuito. DNS de `estudioela.com`
  ainda não está apontado para a Locaweb.
- **Dois achados críticos:** (1) SSH vem desabilitado por padrão, sessão
  de 3h, renovação manual, autenticação por **senha** (não por chave); (2)
  "Publicar via Git" do painel não é deploy real — é só upload FTP. Ambos
  invalidam a premissa de deploy 100% automatizado por SSH de
  `ARQUITETURA_PRODUCAO.md` §3 e do workflow já commitado
  (`.github/workflows/tear-v2-deploy.yml`/`scripts/deploy-locaweb.sh`).
- Divergência entre painel técnico e faturamento (só uma hospedagem
  aparecia em "Alterar Planos") — **esclarecida pelo responsável do
  projeto**: `estudioela.com` veio do WordPress.com (hospedagem cancelada
  lá, domínio trazido para a Locaweb). Sem risco, item fechado.

**Parte 2 — Consolidação documental via 4 subagentes em paralelo**
(revisão de consistência entre os documentos de deployment; checklist
técnico Laravel/React × infra real; análise de estratégia de deploy;
QA de referências cruzadas), consolidados e **commitados/pushados nesta
sessão** (`93578f5`):
- Corrigidas contradições internas sobre SSH por chave em
  `PLANO_DE_IMPLANTACAO.md`, `PLANO_IMPLEMENTACAO.md` e
  `IMPLEMENTACAO_TECNICA.md` (esta última também tinha placeholder de
  domínio desatualizado, corrigido para `influencia.estudioela.com`).
- Corrigida referência de etapa errada ("Etapa 6" tratada como etapa de
  deploy, quando na verdade é SMTP) — agora aponta para as Etapas 9–11
  corretamente em todos os documentos.
- Corrigido link quebrado em `tear-v2-app/docs/MONITORING.md` (`DEPLOY.md`
  §7 → §8) e lista de referências desatualizada ao `TASK_ROUTER.md` em
  `PLANO_DE_IMPLANTACAO.md`.
- `ARQUITETURA_PRODUCAO.md` §14 (riscos) ganhou uma linha registrando o
  achado de execução (SSH temporário/senha, Git=FTP), sem reabrir nenhuma
  decisão de hospedagem/banco/storage.
- `AUDITORIA_LOCAWEB.md` ganhou duas seções novas: **§2.1** checklist
  técnico Laravel/React × infra confirmada (novo pendente encontrado:
  IP/CIDR do proxy reverso da Locaweb para `TRUSTED_PROXIES` ainda não
  levantado) e **§5.1** recomendação de estratégia de deploy: modelo
  **híbrido** (FTP automatizado via CI para código/build/`vendor/`; SSH
  manual só para `migrate`/cache quando há mudança de schema ou
  dependência) — recomendação para decisão do responsável do projeto, não
  implementada.

**Parte 3 — Auditoria final ampla do repositório** (TODOs, docs órfãs,
RBAC, rotas de API, CI), read-only, sem commit adicional:
- **Sem inconsistência** entre backend/frontend/docs: rotas de API do
  frontend batem 1:1 com `backend/routes/api.php`; papéis RBAC idênticos
  entre `RoleSeeder.php` e `frontend/src/lib/auth.tsx`; nenhum TODO/FIXME
  esquecido no código; nenhum workflow de CI órfão.
- **2 documentos de planejamento órfãos e desatualizados** (não
  commitados/removidos, só identificados): `docs/architecture/DATABASE_MODEL.md`
  e `docs/domain/TEAR.md` — rascunhos antigos com resíduo de colagem do
  ChatGPT, sobrepostos ao conteúdo já consolidado em
  `docs/archive/auditorias/AUDITORIA_MODELO_DADOS_TEAR_V2.md`. Candidatos
  a arquivar, baixa prioridade, decisão do responsável do projeto.
- **4 git worktrees obsoletos** em `.claude/worktrees/` (branches já
  mescladas via PR) — seguro remover com `git worktree remove`, não feito
  por ser ação destrutiva sem confirmação explícita.

Detalhe completo em `TASK_ROUTER.md` §24 (auditoria) e §25 (consolidação)
e em `docs/reports/HANDOFF_GO_LIVE.md` (novo, gerado ao final desta
sessão).

## 3. Próxima tarefa recomendada

0. **Decidir o que fazer com os 2 arquivos pendentes de commit**
   (`ESTADO_SESSAO.md`, `docs/reports/HANDOFF_GO_LIVE.md`) — deixados sem
   commit por instrução explícita no fim da sessão anterior. Se não houver
   objeção, commitar antes de iniciar qualquer outra coisa.
1. **Fechar a validação técnica da Etapa 2:** o responsável do projeto
   habilita o SSH no painel da hospedagem `estudioela.com` (ação manual,
   válida por 3h) para confirmar via SSH: `php -v`, `which composer`,
   `crontab -l`, conexão de teste ao PostgreSQL, extensões PHP (`php -m`)
   e IP/CIDR do proxy reverso (`TRUSTED_PROXIES`) — checklist completo em
   `AUDITORIA_LOCAWEB.md` §2.1.
2. Em paralelo — decidir a estratégia de deploy (recomendação já
   documentada em `AUDITORIA_LOCAWEB.md` §5.1: modelo híbrido FTP+SSH
   pontual) antes de a execução chegar às Etapas 9–11.
3. Decisões de limpeza de baixa prioridade (docs órfãos, worktrees
   obsoletos — §2/Parte 3) podem ser resolvidas a qualquer momento, sem
   bloquear o Go-Live.

## 4. Pendências / bloqueios (decisão do responsável do projeto)

- Habilitar SSH no painel Locaweb para fechar a validação técnica da
  Etapa 2 (não pode ser feito pelo agente).
- Decidir a estratégia de deploy — recomendação já pronta em
  `AUDITORIA_LOCAWEB.md` §5.1 (modelo híbrido), aguardando validação do
  responsável do projeto.
- Apontar o DNS de `estudioela.com` para a Locaweb (Etapa 4 do plano,
  depende da Etapa 2 estar fechada).
- Levantar IP/CIDR do proxy reverso da Locaweb para `TRUSTED_PROXIES`.
- Confirmar host/porta do relay SMTP incluso no plano (seção "Email
  Locaweb" do painel).
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

1. Estratégia de deploy planejada (`ARQUITETURA_PRODUCAO.md` §3, symlink
   swap via SSH automatizado) esbarra na limitação real do painel Locaweb
   (SSH temporário/por senha) — recomendação de mitigação já documentada
   (`AUDITORIA_LOCAWEB.md` §5.1), aguardando decisão antes das Etapas
   9–11.
2. Validação comercial concentrada em um único piloto ainda não
   confirmado.
3. Bus factor 1 — fundador único operando agência, produto e suporte.
4. Migração de infraestrutura prevista para novembro coincide com o pico
   sazonal da Jescri em dezembro.

## 6. Documentos de leitura obrigatória na próxima sessão

Lista padrão de `CLAUDE.md` §Documentos oficiais, mais
`docs/reports/HANDOFF_GO_LIVE.md` (novo) e
`docs/deployment/AUDITORIA_LOCAWEB.md` (§2.1 e §5.1 são novos) antes de
retomar a Etapa 2 ou avançar para as Etapas 9–11 do
`PLANO_DE_IMPLANTACAO.md`.

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
docs/_workspace/ESTADO_SESSAO.md e docs/reports/HANDOFF_GO_LIVE.md (leia
primeiro) e, para histórico/decisões de SPEC, docs/_workspace/TASK_ROUTER.md
(ver §24-§25 para a auditoria Locaweb e consolidação documental desta
sessão). Leitura obrigatória antes de alterar código: ver CLAUDE.md
§Documentos oficiais.

Tarefa desta sessão: Etapa 2 de docs/deployment/PLANO_DE_IMPLANTACAO.md —
o responsável do projeto habilita SSH no painel Locaweb (hospedagem
estudioela.com); validar php -v, composer, crontab -l, extensões PHP e
conexão ao PostgreSQL (checklist completo em
docs/deployment/AUDITORIA_LOCAWEB.md §2.1). Em paralelo, validar a
recomendação de estratégia de deploy já documentada em
docs/deployment/AUDITORIA_LOCAWEB.md §5.1 (modelo híbrido: FTP automatizado
+ SSH manual pontual).

Regras: não alterar arquitetura sem ADR; não criar documentação duplicada;
uma frente por vez; validar (testes/lint) antes de commit.
```
