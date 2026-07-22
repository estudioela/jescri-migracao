# Relatório de Estado Atual — TEAR V2 (visão Tech Lead)

Data: 2026-07-20
Papel do autor: Tech Lead (agente), fotografia de estado a pedido do
responsável do projeto. **Nenhum código foi alterado para produzir este
documento** — apenas leitura de documentos, código, git e execução de
suíte de testes/build (sem side effects em código de aplicação).

**Escopo:** exclusivamente `tear-v2-app/` (Laravel 13 + React/Vite), que é
a trilha ativa de trabalho na branch atual. Não cobre o Portal legado GAS
(`src/`) nem `CONTRATO_SOBERANO.md`/`TASK_ROUTER.md` — trilha de decisão
separada, confirmada pelos próprios documentos-fonte lidos abaixo.

## 0. Fontes lidas

1. `docs/HANDOFF_PRODUCTIZACAO_TEAR_V2.md`
2. `docs/ESPECIFICACAO_FUNCIONAL_TEAR_V2.5.md`
3. `docs/PLANO_IMPLEMENTACAO_TEAR_V2.5.md`
4. `docs/RELATORIO_SPRINT_1_FUNDACAO_DADOS.md`
5. Inspeção direta do código atual (`tear-v2-app/backend` e
   `tear-v2-app/frontend`) e do estado do git nesta sessão.

---

## 1. Git

- **Branch atual:** `feat/ui-design-system-ela`, sincronizada com
  `origin/feat/ui-design-system-ela` (sem commits locais à frente/atrás).
- **Commits recentes** (mais novo primeiro): `a81eb19` fix: complete
  influencer password setup flow → `326e2b7` docs: diagnóstico de
  autenticação → `fb7f239` docs: plano técnico Sprint 2 → `b4920ce` docs:
  relatório Sprint 1 → `ba15f78` feat: Briefing 1:1→1:N → ... (histórico
  completo da Sprint 1, 7 commits de feature, todos íntegros).
- **Alterações pendentes (não commitadas), consistentes com Sprint 2 em
  andamento:**
  - Modificados: `ParceiraController.php` (novo método `me()` +
    `authorize('update', ...)` no `update()`), `ParceiraPolicy.php` (nova
    regra `update`), `routes/api.php` (rota `GET /me/parceira`),
    `ConsentimentoHistoricoTest.php`, `ParceiraTest.php`, `App.tsx`
    (rotas do Portal).
  - Novos (untracked): `MeParceiraTest.php`, `PortalIsolamentoTest.php`
    (backend); `PortalShell.tsx`, `lib/me.ts`, `lib/medidas.ts`,
    `lib/passwordReset.ts`, `ResetPasswordPage.tsx`,
    `pages/portal/PortalDashboardPage.tsx`,
    `pages/portal/PortalPerfilPage.tsx` (frontend).
  - **Nada disso está commitado.** É trabalho em progresso da Sprint 2
    (Portal da Influenciadora), coerente com o plano técnico (`fb7f239`)
    e o diagnóstico de autenticação (`326e2b7`) já registrados em docs.

---

## 2. Backend (Laravel 13 + PHP 8.3)

### Models
`Briefing`, `Campanha`, `Consentimento`, `HistoricoAlteracao`, `Marca`,
`Material`, `MedidaInfluenciadora`, `Pagamento`, `Parceira`,
`ParticipacaoNaCampanha`, `User` — todos os módulos da Sprint 1 já
modelados (medidas, consentimento/histórico já existem como entidades
próprias, não placeholders).

### Migrations
Sequência íntegra da fundação (`users`, `parceiras`,
`permission_tables`) até as entregas de Sprint 1: `medidas_influenciadora`,
`consentimentos`, `historico_alteracoes`, `marcas`, `campanhas`,
`participacoes_na_campanha`, `briefings`, `materiais`, `pagamentos`, e a
reorganização de `briefings` para 1:N com `tiktok_qtd`/`ugc_qtd`. Nenhuma
migration pendente de aplicar além do já commitado — as mudanças
pendentes do momento não incluem migration nova.

### Controllers e autenticação
- `AuthController`: login via `Auth::guard('web')->attempt` (Sanctum,
  sessão por cookie), `resetPassword` (fluxo de definição de senha via
  `Password::broker()`, mensagem genérica anti-enumeração), `logout`,
  `me`. Não há distinção de guard por papel — o mesmo `/login` serve
  `ADMIN` e `INFLUENCIADORA`; a separação de experiência acontece no
  frontend por `user.role`.
- **RBAC de leitura (Sprint 1) já está aplicado de ponta a ponta**, não
  só em `Parceira`: `CampanhaController`, `ParticipacaoController`,
  `BriefingController`, `MaterialController::index`,
  `PagamentoController::show` e `MedidaController` todos chamam
  `$this->authorize('view', ...)` e escopam por
  `parceira_id`/`participacao.status = 'ATIVA'` quando o usuário não é
  `ADMIN`. Ou seja: **o dado de campanhas/participações/briefings/
  materiais/pagamentos já está isolado por dono no backend hoje**,
  reaproveitando as rotas existentes (não foi necessário criar
  `/me/participacoes` como o plano original sugeria — o mesmo efeito foi
  alcançado escopando as rotas já existentes por usuário autenticado).
- **Gap real, não coberto ainda:** `POST /participacoes/{id}/materiais`
  (upload de material) e as rotas de `Briefing`/`Campanha`/`Participação`
  `store`/`update` continuam com `middleware('role:ADMIN')` — uma
  influenciadora autenticada consegue **ler** seus próprios
  briefings/materiais/pagamentos, mas **não consegue enviar material**
  pelo Portal ainda. Isso é esperado neste ponto (frontend do Portal
  ainda não tem essa tela — ver §3) mas é o próximo bloqueador funcional
  quando a tela existir.
- Trabalho pendente (não commitado) adiciona `GET /me/parceira` (perfil
  próprio, resolvido só pela sessão) e fecha `PUT /parceiras/{id}` com
  `authorize('update', ...)` — hoje qualquer autenticado ainda podia
  editar cadastro de qualquer parceira (débito técnico §4 do relatório
  de Sprint 1); esta mudança pendente fecha exatamente esse débito.

### Testes
`php artisan test` executado nesta sessão: **117 testes, 315 assertions,
todos passando** (inclui os testes novos/untracked de
`MeParceiraTest`/`PortalIsolamentoTest`). O relatório de Sprint 1
registrava 99 testes ao final da sprint — o salto para 117 confirma que
o trabalho pendente de Sprint 2 já tem cobertura de teste própria,
incluindo isolamento entre duas influenciadoras reais (cadastro e
medidas).

---

## 3. Frontend (React 19 + Vite + React Router)

### Rotas (`App.tsx`)
- Públicas: `/cadastro` (cadastro público de parceira), `/definir-senha`
  (`ResetPasswordPage` — fluxo de definição de senha após convite).
- Sem sessão: tudo cai em `Login`.
- **`user.role === 'INFLUENCIADORA'`:** shell próprio (`PortalShell`),
  com apenas duas rotas hoje — `/` (`PortalDashboardPage`) e `/perfil`
  (`PortalPerfilPage`); qualquer outra rota redireciona para `/`.
- **Qualquer outro papel:** `AppShell` administrativo completo (o mesmo
  de sempre) — Parceiras, Marcas, Campanhas, Participações, Briefings,
  Materiais, Pagamentos. `Logística`/`Documentos`/`Histórico`/`Perfil`
  (do admin) continuam `PlaceholderPage` honesto, sem fluxo real.

### Páginas novas do Portal (trabalho pendente, não commitado)
- `PortalDashboardPage`: saudação por horário do dia, status da conta
  (`StatusBadge`), e um cartão de "próximos passos" que checa se
  endereço está completo e linka para `/perfil` — **não lista
  campanhas/briefings/materiais/pagamentos** (o dado já existe e já está
  liberado no backend por RBAC, mas ainda não tem tela consumindo).
- `PortalPerfilPage`: formulário completo de dados pessoais + endereço
  com fluxo de consentimento (checkbox obrigatório, mapeamento de erros
  422 por campo) e formulário de medidas (sutiã/calcinha/linha noite) —
  este é o único fluxo de escrita hoje disponível à influenciadora pelo
  Portal.

### Validação de build/lint
Executados nesta sessão, sem alterar código:
- `tsc -b`: sem erros.
- `oxlint`: limpo, só o warning pré-existente já conhecido em
  `src/lib/auth.tsx:72` (não relacionado, já registrado no handoff).
- `vite build`: build de produção concluído sem erro (140 módulos, ~347
  kB de bundle JS).

---

## 4. Estado funcional

### O que já funciona hoje (validado nesta sessão)
- Núcleo administrativo completo (Cadastro/Aprovação → Campanhas →
  Participações → Briefings → Materiais → Pagamentos), como já
  registrado no handoff — nada regrediu.
- RBAC de leitura por papel e por dono do registro, aplicado em **todos**
  os recursos que a influenciadora poderia acessar (campanha,
  participação, briefing, material, pagamento, perfil, medidas) — não
  só no perfil.
- Login funcional para o papel `INFLUENCIADORA`, com Portal próprio
  (shell, dashboard, edição de perfil, edição de medidas) já navegável.
- Consentimento LGPD com histórico por campo já é exigido na edição de
  perfil pela própria influenciadora.
- Definição de senha inicial via link de convite (`/definir-senha`) já
  implementada ponta a ponta (o commit mais recente, `a81eb19`, fechou
  esse fluxo).
- 117 testes automatizados de backend verdes; build e lint de frontend
  limpos.

### O que está incompleto
1. **Portal da Influenciadora não expõe campanhas/briefings/materiais/
   pagamentos ainda** — o backend já filtra esse dado por dono
   corretamente, mas não existe tela no Portal que o consuma. É o maior
   gap funcional aberto agora.
2. **Upload de material pela própria influenciadora ainda não é
   possível** — a rota é `role:ADMIN` só; falta abrir essa rota para
   `INFLUENCIADORA` dona da participação (mesma politica de posse já
   usada em `MedidaController`) quando a tela existir.
3. **`PUT /parceiras/{id}` sem checagem de posse** era um débito técnico
   registrado no relatório de Sprint 1 (§4.1) — o trabalho pendente
   (não commitado) já resolve isso (`authorize('update', ...)` +
   `ParceiraPolicy::update`), mas **ainda não foi commitado**.
4. Máscaras de digitação e auto-preenchimento de CEP no frontend
   continuam pendentes (débito já registrado na Sprint 1) — a validação
   real está no backend, mas a UX de cadastro não reflete isso ainda.
5. Trabalho de Sprint 3 em diante (produto/variante, logística,
   permutas, contratos, LGPD além do já feito, histórico legado, IA) não
   foi iniciado — coerente com a ordem planejada, que depende da Sprint
   2 estar madura primeiro.

### Próximo passo recomendado
Terminar e commitar a Sprint 2 antes de abrir qualquer frente nova:

1. **Commitar o trabalho pendente já testado** (`/me/parceira`,
   fechamento de `PUT /parceiras/{id}` por posse, isolamento validado por
   `PortalIsolamentoTest`/`MeParceiraTest`) — está verde e é a correção
   de um débito técnico já identificado, não uma decisão nova.
2. **Fechar o gap de maior valor do Portal:** telas de
   campanhas/participação ativa → briefing por tipo → envio de material
   → status de pagamento, reaproveitando o RBAC de leitura que já existe
   no backend (só falta a rota de escrita do upload de material para
   `INFLUENCIADORA` dona + as telas React correspondentes).
3. Só depois disso declarar a Sprint 2 concluída (critério do plano:
   "influenciadora real loga, vê só as próprias
   campanhas/briefings/materiais/pagamentos, envia material pelo próprio
   portal" — hoje só a parte de "ver perfil próprio" está pronta) e
   avançar para a Sprint 3.

---

Nenhum código foi escrito ou alterado para produzir este documento —
apenas leitura de arquivos, `git status`/`log`/`diff`, `php artisan
test`, `tsc -b`, `oxlint` e `vite build`.
