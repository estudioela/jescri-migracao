# TEAR V2.5 — Relatório de Estado (Tech Lead)

Data: 2026-07-20
Papel do autor: Tech Lead de execução (agente), auditoria a pedido do
responsável do projeto.
Status: **auditoria/leitura. Nenhum código foi escrito e nenhum arquivo
de aplicação foi alterado para produzir este documento** — apenas este
próprio relatório foi criado.

**Escopo:** exclusivamente `tear-v2-app/` (Laravel 13 + React/Vite),
checkout principal do repositório (`/Users/danielperrut/projeto-tear`),
branch `feat/ui-design-system-ela`. Não toca no Portal legado GAS
(`src/`) nem no domínio soberano (`CONTRATO_SOBERANO.md`).

> **Nota sobre onde este documento foi produzido:** esta auditoria foi
> aberta a partir do worktree isolado `.claude/worktrees/auditoria-pre-saas`
> (branch `worktree-auditoria-pre-saas`), que **não contém `tear-v2-app/`**
> — esse diretório só existe no checkout principal, nesta branch. Os seis
> documentos pedidos como leitura obrigatória (`ROADMAP_MESTRE_TEAR_V2.md`,
> `HANDOFF_PRODUCTIZACAO_TEAR_V2.md`, `ESPECIFICACAO_FUNCIONAL_TEAR_V2.5.md`,
> `PLANO_IMPLEMENTACAO_TEAR_V2.5.md`, `RELATORIO_SPRINT_1_FUNDACAO_DADOS.md`,
> `DIAGNOSTICO_AUTENTICACAO_TEAR_V2.md`) só existem aqui, não no worktree de
> origem. Este relatório foi portanto lido/escrito diretamente no checkout
> principal (leitura + este único arquivo novo; nada mais foi alterado).

---

## ⚠️ Achado crítico: sessão concorrente em andamento agora

Durante esta auditoria, o `git status` do checkout principal mudou **entre
duas verificações feitas a poucos minutos de distância**: novos arquivos
(`PortalShell.tsx`, `PortalDashboardPage.tsx`, `PortalPerfilPage.tsx`,
`PortalIsolamentoTest.php`, `lib/me.ts`, `lib/medidas.ts`) apareceram, e um
commit que estava "ahead 1" do remoto passou a estar sincronizado — ou
seja, **outra sessão está implementando e publicando a Sprint 2.1 (Portal
da Influenciadora) neste exato momento**, no mesmo checkout usado para
esta auditoria.

**Implicação prática:** a pergunta original desta tarefa ("Sprint 2.1 ou
correção pendente antes?") já está sendo respondida na prática por essa
sessão paralela. O estado descrito abaixo é um **snapshot**, não um fato
estável — qualquer ação de execução deve primeiro reconfirmar o estado
atual do `git status`/`git log`, não confiar neste relatório para decidir
o que já foi feito.

---

# Estado atual

## 1. Git

- **Checkout principal** (`/Users/danielperrut/projeto-tear`): branch
  `feat/ui-design-system-ela`, HEAD `a81eb19` ("fix: complete influencer
  password setup flow"), sincronizado com `origin/feat/ui-design-system-ela`.
  Working tree **não está limpo** — modificações e arquivos novos em
  andamento (ver seção anterior), consistentes com uma sessão ativa
  implementando o Portal da Influenciadora agora.
- **Este worktree de auditoria** (`worktree-auditoria-pre-saas`): branch
  homônima, working tree limpo, HEAD `dfff55c`. Não contém `tear-v2-app/`
  — é uma linha de trabalho separada, focada no Portal legado GAS
  (`src/`). Não confundir os dois sistemas ao decidir onde trabalhar a
  seguir.

## 2. Autenticação (fluxo de primeiro acesso da influenciadora)

| Item | Estado |
|---|---|
| `AuthController::login/logout/me` | Implementado e commitado (`a81eb19`), guard `web` explícito |
| `POST /api/password/reset` + `AuthController::resetPassword` | Implementado e **commitado** (`a81eb19`), usa `Password::broker()->reset()` nativo do Laravel, mensagem de erro genérica (evita enumeração de e-mail) |
| `ResetPasswordRequest` | Commitado |
| Teste `ResetPasswordTest.php` (backend) | Commitado, 198 linhas — cobre token válido/inválido/expirado |
| Rota `/definir-senha` (frontend) + `ResetPasswordPage.tsx` | Existe no working tree, mas **não commitada** (arquivo novo `??` no `git status`) |
| `ParceiraController::me` (`GET /me/parceira`) | Existe no working tree, **não commitado** |
| `ParceiraPolicy::update` (fecha o débito "PATCH aberto a qualquer autenticado") | Existe no working tree, **não commitado** |
| Portal (`PortalShell`, `PortalDashboardPage`, `PortalPerfilPage`) | Arquivos novos apareceram durante esta auditoria — sessão concorrente construindo agora, estado não avaliado em detalhe aqui |

**Testes automatizados:** suíte completa do backend — `php artisan test`
— **114/114 verde**, 307 assertions (executado nesta sessão, incluindo o
working tree com as alterações não commitadas). O subconjunto de
autenticação/reset/perfil (`ResetPassword|Auth|Login|MeParceira|
ParceiraTest`) — 31/31 verde.

**Frontend:** `npx tsc --noEmit` limpo (sem erro de tipo) com o working
tree atual, incluindo os arquivos novos do Portal.

**Resposta à pergunta "o fluxo de primeiro acesso está pronto?":**
**Sim, no nível de código e teste automatizado** — convite → token →
`/definir-senha` → login está implementado ponta a ponta (backend
commitado e testado; frontend presente no working tree, ainda não
commitado). **Não confirmado**: nenhuma validação manual/navegador do
caminho e-mail → clique → definir senha → login foi registrada em
nenhum documento lido nesta auditoria — só testes automatizados
(`Mail::fake`/asserts diretos), que cobrem lógica mas não o link real de
e-mail nem a experiência do usuário.

## 3. Ambiente

- **Backend sobe:** confirmado (`php artisan serve` respondeu HTTP 422 a
  um POST `/api/login` vazio — comportamento correto de validação, servidor
  ativo).
- **Frontend sobe:** confirmado (`vite` respondeu HTTP 200 em
  `http://localhost:<porta>/`).
- **Usuários de teste:** `DevUserSeeder` (guardado por `environment('local',
  'testing')`) cria `admin@tear.test` / `gestor@tear.test` /
  `influenciadora@tear.test`, todos com senha `password`, papéis Spatie
  corretos.
- **Seed/DB:** `database/database.sqlite` presente, `vendor/` e
  `node_modules/` instalados — ambiente local operacional sem passos
  adicionais.

# O que está pronto

- Backend de autenticação (login, logout, me, reset de senha) —
  commitado, testado, guard `web` explícito.
- Convite da influenciadora na aprovação (`ParceiraController::aprovar`)
  — gera `User`, vincula `user_id`, dispara token + e-mail.
- RBAC de leitura por papel/dono (Sprint 1).
- Ambiente local (backend, frontend, seeds) funcional sem fricção.
- Suíte de testes 114/114 verde no snapshot avaliado.

# O que está bloqueando

1. **Trabalho em andamento não commitado, concorrente a esta auditoria.**
   `ResetPasswordPage`, `ParceiraController::me`, `ParceiraPolicy::update`,
   e agora `PortalShell`/`PortalDashboardPage`/`PortalPerfilPage` estão no
   working tree do checkout principal, sem commit. Risco: perda de
   trabalho se algo interromper a sessão que está escrevendo agora: **não
   é recomendável iniciar uma segunda frente de execução no mesmo checkout
   até essa sessão consolidar (commit) o que já está em curso.**
2. **Validação end-to-end no navegador não documentada.** Todos os
   documentos lidos (`DIAGNOSTICO_AUTENTICACAO_TEAR_V2.md`, `RELATORIO_
   SPRINT_1...`) descrevem confirmação por teste automatizado, nunca por
   sessão de navegador real clicando o link do e-mail de convite.
3. **Roteamento pós-login por papel** (item 4 do `DIAGNOSTICO_
   AUTENTICACAO_TEAR_V2.md` §7) era, até este snapshot, o próximo passo
   natural — e é exatamente o que os arquivos `PortalShell`/`Portal*Page`
   que apareceram durante esta auditoria parecem estar endereçando agora.

# Próxima ação recomendada

**Não iniciar uma nova frente de trabalho agora.** Há uma sessão ativa
implementando a Sprint 2.1 (Portal da Influenciadora) neste exato
checkout/branch. A ação correta para a próxima sessão é:

1. Reconfirmar `git status`/`git log` no checkout principal antes de
   qualquer decisão — este relatório é um snapshot, pode já estar
   desatualizado.
2. Se a sessão concorrente já commitou o Portal: rodar a suíte completa
   (`php artisan test` + `tsc --noEmit`), revisar o diff, e então validar
   manualmente no navegador o caminho e-mail → `/definir-senha` → login →
   Portal com o usuário seed `influenciadora@tear.test`.
3. Se ainda não commitou: **não sobrepor** — aguardar ou coordenar com o
   responsável do projeto antes de escrever no mesmo checkout.
4. Só depois disso avaliar formalmente Sprint 2.1 como "concluída" e
   decidir a Sprint seguinte (Sprint 3 — Operação interna, por
   `PLANO_IMPLEMENTACAO_TEAR_V2.5.md` §3).

Nenhum código foi escrito e nenhum arquivo de aplicação foi alterado para
produzir este relatório — apenas leitura e testes de verificação
(`php artisan test`, `tsc --noEmit`, boot de `php artisan serve`/`vite`),
mais este próprio arquivo.
