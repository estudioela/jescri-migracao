# TEAR V2.5 — Diagnóstico de Autenticação da Influenciadora

Data: 2026-07-20
Papel do autor: Tech Lead de execução (agente), a pedido do responsável
do projeto.
Status: **diagnóstico. Nenhum código foi escrito, nenhuma migration
criada, nenhum arquivo de aplicação alterado para produzir este
documento.**

**Escopo:** exclusivamente `tear-v2-app/` (Laravel 13 + React/Vite). Não
toca no Portal legado GAS (`src/`) nem no seu domínio soberano
(`CONTRATO_SOBERANO.md`) — trilhas de decisão separadas.

## 0. Fontes

Este documento não introduz achado novo — confirma, célula a célula no
código real, o que `docs/PLANO_TECNICO_SPRINT_2_PORTAL_INFLUENCIADORA.md`
§1.2 (item 1) já havia identificado por leitura. Onde este documento cita
um arquivo/linha, foi lido diretamente nesta sessão; onde cita estado de
banco, foi consultado diretamente em `tear-v2-app/backend/database/database.sqlite`
(ambiente local/dev).

Lidos nesta sessão: `docs/HANDOFF_PRODUCTIZACAO_TEAR_V2.md`,
`docs/ESPECIFICACAO_FUNCIONAL_TEAR_V2.5.md`,
`docs/PLANO_IMPLEMENTACAO_TEAR_V2.5.md`,
`docs/RELATORIO_SPRINT_1_FUNDACAO_DADOS.md`,
`docs/PLANO_TECNICO_SPRINT_2_PORTAL_INFLUENCIADORA.md`, e o código-fonte
listado em cada seção abaixo.

---

## 1. Login administrativo (hoje, funcional)

| Item | Detalhe |
|---|---|
| Endpoint | `POST /api/login` (`routes/api.php:22`) |
| Controller | `AuthController::login` (`app/Http/Controllers/Api/AuthController.php:15-26`) |
| Validação | `LoginRequest` (`app/Http/Requests/Auth/LoginRequest.php`) |
| Autenticação | `Auth::attempt()` + `session()->regenerate()` — Sanctum SPA, guard `web`, sessão via cookie, mesma origem |
| Logout | `POST /api/logout` (auth:sanctum), `AuthController::logout` |
| Sessão atual | `GET /api/me` → `AuthController::me` → `UserResource` (expõe `role`) |
| Frontend | `frontend/src/pages/Login.tsx` + `frontend/src/lib/auth.tsx` (`AuthProvider`/`useAuth`) — já funciona para **qualquer** papel autenticado, não só ADMIN |
| Roteamento pós-login | `frontend/src/App.tsx:20-63` — binário: `user ? <AppShell> : <Login>`. Não ramifica por `role`; qualquer usuário autenticado cai no `AppShell` administrativo |
| Usuários existentes (dev/local) | `database/seeders/DevUserSeeder.php` — 3 usuários seed, só em `local`/`testing`: `admin@tear.test`, `gestor@tear.test`, `influenciadora@tear.test` (senha `password` para os três). Confirmado no banco local: 3 linhas em `users`, papéis `ADMIN`/`GESTOR_MARCA`/`INFLUENCIADORA` corretamente atribuídos via Spatie (`roles` tem as 3 linhas esperadas) |
| Papéis | Spatie Permission, guard `web`. Seed via `database/seeders/RoleSeeder.php`: `ADMIN`, `GESTOR_MARCA`, `INFLUENCIADORA` |

**Conclusão desta seção:** o mecanismo de autenticação em si (Sanctum,
sessão, `Auth::attempt`) já funciona para qualquer papel, inclusive
`INFLUENCIADORA` — confirmado que `influenciadora@tear.test` / `password`
loga com sucesso no backend hoje. **O problema não é autenticação — é
que (a) não existe caminho de produção para uma influenciadora real obter
senha, e (b) o frontend não sabe o que fazer com ela depois de logada.**
Ver §3.

---

## 2. Fluxo esperado da influenciadora (convite → definir senha → login → portal)

### 2.1 Convite (funcional)

Disparado dentro de `ParceiraController::aprovar`
(`app/Http/Controllers/Api/ParceiraController.php:64-83`), acionado por
`PATCH /api/parceiras/{parceira}/aprovar` (rota `role:ADMIN`):

1. `Parceira::aprovar($admin)` muda `status` para `Ativa`.
2. Se `parceira.user_id` ainda é `null`: cria `User` (nome/e-mail da
   Parceira, senha aleatória de 40 chars — nunca exposta), garante o role
   `INFLUENCIADORA` via `Role::findOrCreate`, atribui o role ao `User`,
   chama `Parceira::vincularUsuario($user)` (único ponto de escrita de
   `user_id`, `app/Models/Parceira.php:98-101`).
3. Gera token via `Password::broker()->createToken($user)` (mecanismo
   nativo do Laravel, broker `users` — `config/auth.php:20`, TTL padrão
   `60` min, `config/auth.php:99`).
4. Dispara `InfluenciadoraConviteNotification`
   (`app/Notifications/InfluenciadoraConviteNotification.php`) — e-mail
   com botão "Definir senha", apontando para:
   ```
   {config('app.frontend_url')}/definir-senha?token={token}&email={email}
   ```
   (`InfluenciadoraConviteNotification.php:25`). Em dev,
   `FRONTEND_URL=http://localhost:5173` (`.env`).

**Este passo está correto e funcional.** `User` é criado só na aprovação
(evita usuário órfão para cadastro nunca aprovado), token gerado pelo
mecanismo padrão do Laravel, sem senha provisória em texto — nenhuma
dívida aqui.

### 2.2 Definir senha (rota morta — bloqueador absoluto)

Confirmado nesta sessão, célula a célula:

- **Frontend:** `frontend/src/App.tsx` não tem `/definir-senha` em
  nenhuma `<Route>` — nem na árvore autenticada nem na não-autenticada.
  Como a árvore hoje é só `{ '/cadastro' } ∪ { user ? AppShell-routes :
  <Login /> }`, qualquer acesso a `/definir-senha` **sem sessão** cai no
  fallback `<Route path="*" element={<Login />} />` — a página de login
  é renderizada, `token`/`email` da query string são ignorados, não há
  nenhum componente que os leia. Confirmado por busca no código-fonte:
  nenhuma ocorrência de `definir-senha`, `ResetPassword` ou
  `password/reset` em `frontend/src/**`.
- **Backend:** `routes/api.php` não tem nenhuma rota de reset de senha —
  nenhuma linha com `password/reset`, `password/email` ou equivalente.
  `grep` por `Password::broker` no projeto retorna só a linha que **cria**
  o token (`ParceiraController.php:80`); não existe nenhum controller que
  chame `Password::broker()->reset(...)`.
- **Banco:** a tabela `password_reset_tokens` já existe (migration padrão
  do Laravel, `database/migrations/0001_01_01_000000_create_users_table.php:24`)
  — não falta migration, falta o endpoint que a consome. Confirmado
  vazia no banco local (`0` linhas) — nenhum convite foi consumido ainda,
  consistente com a rota nunca ter existido.

**Efeito prático:** toda influenciadora aprovada hoje recebe um e-mail
com um link que, ao ser clicado, mostra a tela de login sem nenhuma
senha para usar — **nenhuma influenciadora real jamais completa o
primeiro login por este caminho.** Isso bloqueia todo o resto do fluxo
(login → portal), independentemente de o portal existir ou não.

### 2.3 Login (mecanismo pronto, mas inatingível para influenciadora real)

Como visto em §1, `POST /api/login` já aceita qualquer papel. O bloqueio
não é aqui — é que, sem §2.2 resolvido, uma influenciadora real nunca
tem uma senha para usar neste passo (a única exceção é o usuário seed
`influenciadora@tear.test`, que existe só em `local`/`testing` e não
representa o caminho de produção).

### 2.4 Portal (não existe — fora do escopo desta tarefa)

Mesmo que o login funcionasse ponta a ponta hoje, `App.tsx:20-63` monta
sempre `<AppShell>` (nav administrativo: Parceiras, Marcas, Campanhas)
para **qualquer** usuário autenticado — não há `PortalShell`, não há
nenhuma tela pensada para o papel `INFLUENCIADORA`. Confirmado: nenhuma
rota, nenhum componente `Portal*` em `frontend/src/**`. **Não é o escopo
desta tarefa construir o portal** (instrução explícita do responsável do
projeto) — registrado aqui só para deixar claro que corrigir §2.2
destrava login, não o portal em si.

---

## 3. Banco de dados

| Item | Situação |
|---|---|
| Tabela `users` | Existe, schema padrão Laravel + Sanctum. 3 linhas hoje (dev seed): `admin@tear.test`, `gestor@tear.test`, `influenciadora@tear.test` |
| Tabela `convites` | **Não existe como tabela própria.** O "convite" é modelado como um token em `password_reset_tokens` (mecanismo nativo `Illuminate\Auth\Passwords`, broker `users`) — não há uma entidade de domínio `Convite`, e não é necessário criar uma: o padrão Laravel já cobre token + expiração (`config/auth.php:99`, `expire => 60` min) + throttle (`throttle => 60`) |
| Tabela `password_reset_tokens` | Existe (migration `0001_01_01_000000_create_users_table.php:24`), `0` linhas no banco local — nenhum token foi consumido ainda (consistente com §2.2: nunca houve endpoint para consumir) |
| Relação `User` ↔ `Parceira` | `User::parceira()` → `hasOne(Parceira::class)` (`app/Models/User.php:34-37`); `Parceira::user()` → `belongsTo(User::class)` (`app/Models/Parceira.php:65`). `Parceira.user_id` só é escrito por `Parceira::vincularUsuario()` (`Parceira.php:98-101`), chamado exclusivamente por `ParceiraController::aprovar` — nenhum outro caminho de escrita, RN-01 preservada. Confirmado: banco local não tem nenhuma `Parceira` ainda (tabela vazia) — o vínculo nunca foi exercitado com dado real nesta sessão |
| Roles | Spatie Permission, guard `web`. 3 roles seedadas: `ADMIN`, `GESTOR_MARCA`, `INFLUENCIADORA` (`RoleSeeder.php`). Atribuição automática de `INFLUENCIADORA` ocorre em `ParceiraController::aprovar` (§2.1, passo 2) |

**Nenhuma migration nova é necessária para destravar o login** — a
lacuna é 100% de código de aplicação (rota + controller + tela), não de
schema.

---

## 4. Problema (síntese)

O convite de influenciadora **é gerado corretamente** e aponta para
`/definir-senha`, mas essa rota **não existe em nenhuma camada**:

1. Sem tela `/definir-senha` no frontend.
2. Sem endpoint `POST /api/password/reset` (ou equivalente) no backend
   que consuma o token via `Password::broker()->reset(...)`.

Resultado: link morto no e-mail de convite. **Bloqueador absoluto** —
nenhuma influenciadora real completa o primeiro login, independente de
o Portal (telas pós-login) existir.

Dois débitos adicionais, não bloqueadores para o login em si mas
relevantes para a ordem de implementação (já registrados em
`docs/RELATORIO_SPRINT_1_FUNDACAO_DADOS.md` §4 item 1 e reconfirmados
nesta sessão):

- `PATCH /api/parceiras/{parceira}` está aberto a **qualquer** usuário
  autenticado — `ParceiraPolicy` (`app/Policies/ParceiraPolicy.php`) só
  declara `viewAny`/`view`, não `update`; `ParceiraController::update`
  não chama `$this->authorize()`. Não bloqueia login, mas precisa fechar
  **antes** de qualquer tela de portal permitir edição de perfil.
- `POST /api/participacoes/{participacao}/materiais` tem
  `middleware('role:ADMIN')` (`routes/api.php`) — só a equipe sobe
  material hoje, nunca a própria influenciadora. Fora do escopo desta
  tarefa (é portal, não login).

---

## 5. Arquivos envolvidos

**Confirmados existentes e corretos (não tocar sem motivo novo):**
- `app/Http/Controllers/Api/ParceiraController.php` (`aprovar`, linhas 64-83)
- `app/Notifications/InfluenciadoraConviteNotification.php`
- `app/Models/Parceira.php` (`vincularUsuario`, linhas 98-101)
- `app/Models/User.php` (relação `parceira()`)
- `database/seeders/RoleSeeder.php`, `database/seeders/DevUserSeeder.php`
- `app/Http/Controllers/Api/AuthController.php` (`login`/`logout`/`me`)

**Faltando (a criar na correção):**
- Backend: novo endpoint público (sem `auth:sanctum`, mesmo padrão de
  `/login`) em `routes/api.php`, ex. `POST /api/password/reset`; novo
  método/controller que chame `Password::broker()->reset(...)`
  (fail-closed: token inválido/expirado → 422 com mensagem genérica, sem
  revelar se o e-mail existe).
- Frontend: nova página `ResetPasswordPage` (rota `/definir-senha`, fora
  da árvore autenticada de `App.tsx`, mesmo padrão de `/cadastro`) — lê
  `token`/`email` da query string, formulário de senha + confirmação,
  chama o endpoint novo, redireciona para `/login` em sucesso.

**A tocar por débito correlato (não bloqueia login, mas é pré-requisito
de segurança antes de abrir qualquer edição de perfil no portal):**
- `app/Policies/ParceiraPolicy.php` — adicionar `update()` (dono ou
  ADMIN via `Gate::before`, já automático).
- `app/Http/Controllers/Api/ParceiraController.php::update` — adicionar
  `$this->authorize('update', $parceira)`.

---

## 6. Correção necessária

1. **Endpoint de reset de senha** (backend) — `POST /api/password/reset`,
   público, recebe `token`/`email`/`password`/`password_confirmation`,
   usa `Password::broker()->reset()` (zero dependência nova, já parte do
   Laravel). Nenhuma migration necessária (`password_reset_tokens` já
   existe).
2. **Tela "Definir senha"** (frontend) — `ResetPasswordPage` em
   `/definir-senha`, fora da árvore autenticada, consumindo o endpoint
   acima.
3. **Fechar `PATCH /parceiras/{id}` para dono-ou-ADMIN** — débito de
   segurança independente do login, mas deve ser corrigido antes de
   qualquer tela de portal permitir edição de perfil (fora do escopo
   "login" desta tarefa, mas registrado para não ser esquecido).

O que **não** precisa de correção: mecanismo de autenticação (`Auth::attempt`,
Sanctum, sessão), criação de `User`/vínculo `user_id` na aprovação,
geração do token de convite, papéis Spatie. Tudo isso já funciona.

---

## 7. Ordem de implementação

1. `POST /api/password/reset` (backend) — sem isso nada mais é testável
   ponta a ponta com uma senha real definida pela própria influenciadora.
2. `ResetPasswordPage` / rota `/definir-senha` (frontend) — consome (1).
3. Validação ponta a ponta: aprovar uma Parceira de teste → receber
   e-mail (ou `Mail::fake`/log driver em dev) → abrir `/definir-senha` →
   definir senha → logar com sucesso via `/login`.
4. **Fora desta tarefa, mas registrado como próximo passo natural:**
   ramificação de frontend por `role` (hoje todo usuário autenticado cai
   em `<AppShell>` — sem isso, a influenciadora loga com sucesso mas cai
   no shell administrativo). Este é o início do Portal em si —
   `docs/PLANO_TECNICO_SPRINT_2_PORTAL_INFLUENCIADORA.md` já tem o
   desenho completo dessa etapa, não repetido aqui.

**Prioridade confirmada pelo responsável do projeto:** login funcionando
> portal. Este documento cobre só o primeiro; o segundo já está
planejado em `docs/PLANO_TECNICO_SPRINT_2_PORTAL_INFLUENCIADORA.md`.

---

Nenhum código foi escrito, nenhuma migration criada e nenhuma
arquitetura alterada para produzir este documento. Este diagnóstico é o
insumo de entrada para a próxima sessão de execução, seguindo o fluxo
obrigatório do projeto (Auditoria → Plano → Execução → Validação →
Commit).
