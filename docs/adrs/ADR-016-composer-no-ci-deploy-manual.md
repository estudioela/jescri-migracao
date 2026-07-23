# ADR-016 — Composer só no runner do CI; deploy disparado manualmente

- **Status:** Aceito
- **Data:** 2026-07-22
- **Autores:** responsável do projeto (decisão) + Arquitetura TEAR (análise
  e aplicação)
- **Resolve:** contradição entre a mecânica de deploy documentada em
  `ARQUITETURA_PRODUCAO.md` §3 (Composer rodando via SSH no host, deploy
  disparado automaticamente por push em `main`) e os achados confirmados
  de uma auditoria real do host Locaweb: Composer **não** está instalado
  globalmente no host, e o SSH é de habilitação manual/temporária (~3h) no
  painel — a mesma limitação já registrada em
  `docs/deployment/AUDITORIA_LOCAWEB.md` §4.1, agora com o dado do
  Composer confirmado (§4.3 daquele documento tratava isso como risco
  hipotético; deixa de ser hipótese).
- **Relaciona-se com:** `ADR-015` (arquitetura que este ADR ajusta, sem
  reabrir), `docs/deployment/ARQUITETURA_PRODUCAO.md` §3/§14,
  `docs/deployment/AUDITORIA_LOCAWEB.md` §1, §2, §2.1, §4.1, §4.3, §5.1,
  §6, `docs/deployment/PLANO_DE_IMPLANTACAO.md` Etapa 11,
  `docs/deployment/IMPLEMENTACAO_TECNICA.md` §3, `TASK_ROUTER.md` §27.
- **Escopo:** mecânica de deploy de `tear-v2-app`
  (`.github/workflows/tear-v2-deploy.yml`,
  `scripts/deploy-locaweb.sh`). **Não altera** stack de
  aplicação, banco, storage, domínio, nem nenhuma regra de negócio —
  permanece 100% conforme `ADR-015`/`ARQUITETURA_PRODUCAO.md`.

---

## 1. Contexto

`ARQUITETURA_PRODUCAO.md` §3 e o código já commitado (`ac5180f`) assumiam
que o job de deploy conectaria via SSH ao host Locaweb e rodaria, no
próprio host, `composer install --no-dev --optimize-autoloader` antes de
`migrate`/cache/symlink — com o workflow disparado automaticamente a cada
push em `main`.

Uma auditoria do host confirmou dois fatos que quebram essa premissa:

1. **Composer não está instalado globalmente no host** (Rocky Linux 8.10,
   PHP 8.4.22, `public_html` vazio) — `composer install` na linha 19 de
   `deploy-locaweb.sh` falharia sempre.
2. **SSH é de habilitação manual no painel, com sessão de ~3h** — já
   registrado como risco em `AUDITORIA_LOCAWEB.md` §4.1. Isso inviabiliza
   um disparo automático por push confiável: nada garante que o SSH esteja
   habilitado no momento em que o workflow tentaria rodar.

Uma revisão de código dedicada a essas duas mudanças (implementadas antes
deste ADR) não encontrou nenhuma regressão em rsync, releases, symlink,
rollback ou segurança — só a lacuna de que a mudança de arquitetura de
deploy não tinha, até aqui, um ADR cobrindo-a, exigido por
`CLAUDE.md` ("Não alterar arquitetura sem ADR"). Este documento fecha essa
lacuna.

## 2. Decisão

Duas mudanças pontuais na mecânica de deploy, **mantendo intacta** a
estratégia geral de `ARQUITETURA_PRODUCAO.md` §3 (releases/ + symlink
`current`, publicação via `rsync`/SSH):

1. **Composer roda só no runner do GitHub Actions**, nunca no host.
   `vendor/` é gerado ali (`composer install --no-dev
   --optimize-autoloader --no-interaction`, na working-directory
   `backend`) e enviado já pronto via `rsync` junto com o
   restante de `backend/` — mesmo princípio que já valia para o build do
   frontend (Node/npm também só existem no runner, nunca no host, ver
   ADR-015). O host (`deploy-locaweb.sh`) passa a só **verificar** a
   presença de `vendor/autoload.php` antes de prosseguir — falha rápida e
   explícita se o pipeline entregou uma release incompleta, em vez de um
   erro críptico do PHP tentando `require` um arquivo inexistente.
2. **O disparo do workflow deixa de ser automático por push em `main`** e
   passa a ser **manual** (`workflow_dispatch`), acionado pelo responsável
   do projeto depois de habilitar o SSH no painel Locaweb. Não há como um
   push garantir que a janela de 3h de SSH esteja aberta.

### O que **não** muda

- Estratégia de releases/symlink, `rsync`/SSH para publicar o código,
  `migrate --force` + `*:cache` + swap de `current` no host — tudo isso
  continua exatamente como em `ARQUITETURA_PRODUCAO.md` §3.
- Nenhuma regra de negócio, controller, model, migration, frontend ou rota
  de API foi tocada.

## 3. Alternativas consideradas

### A) Manter `composer install` rodando no host
**Rejeitada** — o host confirmadamente não tem Composer instalado; a
alternativa nem chega a ser viável tecnicamente, não é uma questão de
preferência.

### B) Automatizar a habilitação do SSH via scraping/RPA do painel, para manter o disparo automático por push
Já avaliada e **rejeitada** em `AUDITORIA_LOCAWEB.md` §5.1 (opção C
daquele checklist): exigiria guardar a senha da Central do Cliente em CI —
troca um problema pequeno (disparo manual) por uma superfície de risco
maior (credencial de painel exposta em automação).

### C) Substituir `rsync`/SSH por FTP automatizado para todo o código (recomendação anterior de `AUDITORIA_LOCAWEB.md` §5.1, opção B daquele checklist)
Essa recomendação foi feita quando a auditoria via o SSH **desabilitado
por padrão** e sem confirmação de Composer. Uma auditoria mais recente do
host confirmou SSH **disponível** (ainda que temporário/manual) — com SSH
utilizável, manter `rsync`/SSH (transporte criptografado, resumível, já
implementado e testado) é preferível a introduzir FTP (sem verificação de
integridade nativa, credencial adicional) só para contornar um problema
(Composer ausente) que se resolve de forma mais simples movendo a etapa
para o CI. **Rejeitada nesta revisão**: a mudança mínima (D, abaixo) já
resolve o bloqueio confirmado sem trocar o mecanismo de transporte.

### D) Composer só no CI + disparo manual do workflow existente (adotada)
Menor mudança suficiente: resolve o único bloqueio confirmado (Composer
ausente) e adapta o disparo à realidade do SSH temporário, sem descartar
nenhuma peça já implementada e testada (`rsync`, `releases/`, symlink,
`deploy-locaweb.sh`).

## 4. Consequências

### Positivas
- Bloqueio confirmado (Composer ausente no host) resolvido sem tocar em
  nenhuma regra de negócio.
- Nenhuma peça de infraestrutura nova, nenhum custo adicional — consistente
  com a restrição soberana de `ARQUITETURA_PRODUCAO.md` §0.
- `deploy-locaweb.sh` fica mais simples (uma responsabilidade a menos) e
  falha de forma explícita (guard de `vendor/autoload.php`) em vez de um
  erro genérico de PHP.

### Negativas / Trade-offs
- O deploy deixa de ser 100% automático: exige ação humana (habilitar SSH
  no painel + disparar o `workflow_dispatch`) a cada release. Aceitável
  para o perfil atual (mantenedor único, poucos deploys, não é um SaaS de
  alta frequência de release).
- Se o SSH do plano Locaweb vier a se tornar persistente/por chave no
  futuro, este ADR pode ser revisitado para reativar o disparo automático
  por push — não é uma decisão permanente, é a resposta à limitação atual
  do plano.

### Riscos residuais / dívidas conscientes
- `docs/deployment/PLANO_IMPLEMENTACAO.md` e `docs/deployment/DEPLOY.md`
  são documentos de referência histórica/detalhada (já superados para fins
  de execução por `PLANO_DE_IMPLANTACAO.md`) — receberam uma nota de
  correção apontando para este ADR, não uma reescrita completa dos
  runbooks internos. Não é um problema de execução (o documento
  operacional único, `PLANO_DE_IMPLANTACAO.md`, foi atualizado por
  completo), só um débito de redação nesses dois documentos de referência.

## 5. Aplicação

1. `.github/workflows/tear-v2-deploy.yml` — trigger só `workflow_dispatch`;
   novos steps `Setup PHP` + `Cache Composer packages` + `Install backend
   dependencies` antes do build do frontend e do `rsync`.
2. `scripts/deploy-locaweb.sh` — removida a linha `composer
   install`; adicionado guard de `vendor/autoload.php`.
3. `docs/deployment/ARQUITETURA_PRODUCAO.md` §3/§14 — atualizado.
4. `docs/deployment/AUDITORIA_LOCAWEB.md` §2, §2.1, §3, §4.3, §5.1, §6 —
   atualizado (itens antes "PENDENTE"/"recomendação" agora "decidido via
   ADR-016").
5. `docs/deployment/IMPLEMENTACAO_TECNICA.md` §3 — atualizado.
6. `docs/deployment/PLANO_DE_IMPLANTACAO.md` Etapa 11 — atualizado (ordem
   dos comandos, disparo manual).
7. `docs/deployment/PLANO_IMPLEMENTACAO.md`, `docs/deployment/DEPLOY.md`
   — nota de correção apontando para este ADR.
8. `docs/_workspace/TASK_ROUTER.md` §27 — registro desta sessão.

**Critério de conclusão:** workflow (`tear-v2-deploy.yml`) e script
(`deploy-locaweb.sh`) sintaticamente válidos (validado nesta sessão);
revisão de código dedicada não encontrou regressão em rsync,
releases/symlink, rollback ou segurança; nenhuma regra de
negócio/controller/model/migration/frontend alterada. Execução real do
primeiro deploy (secrets do GitHub cadastrados, SSH habilitado
manualmente no painel) continua fora de escopo deste ADR — é trabalho de
execução das Etapas 9-11 de `PLANO_DE_IMPLANTACAO.md`.

---

**Referências**
- `docs/deployment/ARQUITETURA_PRODUCAO.md` §3, §14
- `docs/deployment/AUDITORIA_LOCAWEB.md` §1, §2, §2.1, §4.1, §4.3, §5.1, §6
- `docs/adrs/ADR-015-frontend-servido-pelo-laravel.md`
- `docs/deployment/PLANO_DE_IMPLANTACAO.md` Etapa 11
- `docs/_workspace/TASK_ROUTER.md` §27
