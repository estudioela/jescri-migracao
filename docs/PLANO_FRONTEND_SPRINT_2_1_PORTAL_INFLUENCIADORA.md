# TEAR V2.5 — Sprint 2.1: Plano Técnico (Frontend)
## Primeiro Acesso e Perfil da Influenciadora

Data: 2026-07-20
Papel do autor: Tech Lead de execução (agente), a pedido do responsável
do projeto.
Status: **plano técnico. Nenhum código foi escrito, nenhum arquivo de
aplicação alterado para produzir este documento.**

**Escopo desta entrega:** exclusivamente `tear-v2-app/frontend/`. Não
inclui migrations, controllers, policies ou rotas de backend — esses
arquivos (`ParceiraController`, `ParceiraPolicy`, `routes/api.php` e
testes relacionados) estão sendo alterados por outra sessão em paralelo
neste momento; este plano **consome** o contrato de API já definido em
`docs/PLANO_TECNICO_SPRINT_2_PORTAL_INFLUENCIADORA.md` §7, sem
antecipar nem redefinir esse contrato.

**Recorte do prompt de abertura desta sub-entrega (Sprint 2.1):**
diferente do escopo completo do Portal descrito em
`PLANO_TECNICO_SPRINT_2_PORTAL_INFLUENCIADORA.md` (que inclui
Campanhas/Financeiro), esta entrega cobre só:
1. Dashboard inicial (saudação, nome, status da conta, próximos passos).
2. Perfil (dados pessoais + medidas, visualização e edição).
3. Permissões (influenciadora só acessa o próprio recorte; ADMIN mantém
   acesso administrativo).

Campanhas, briefing, upload de material e pagamentos **não** entram
nesta sub-entrega — mesmo que o plano técnico maior os preveja para o
Portal completo.

---

## 0. Fontes

- `docs/PLANO_TECNICO_SPRINT_2_PORTAL_INFLUENCIADORA.md` — arquitetura,
  contrato de API (§7) e ordem de execução (§9) já pactuados para o
  Portal completo; este documento reaproveita o desenho, restrito ao
  subconjunto Dashboard+Perfil.
- `docs/DIAGNOSTICO_AUTENTICACAO_TEAR_V2.md` — confirma que o backend de
  "definir senha" (`POST /api/password/reset`) já foi implementado e
  testado (commit `a81eb19`, fora desta sessão); só falta a tela.
- `docs/PLANO_IMPLEMENTACAO_TEAR_V2.5.md` §3 (Sprint 2) — decisão já
  registrada de **não reaproveitar as telas do `AppShell`** para o
  Portal ("layout e rotas distintas do AppShell administrativo").
- `docs/design/UX_FLOW.md` (§"Perfil: Influenciadora", §"Navegação por
  Perfil") e `docs/design/SCREEN_MAP.md` (§"Influenciadora" do
  Dashboard) — desenho de navegação alvo (Dashboard/Briefings/
  Materiais/Pagamentos/Histórico/Perfil), usado aqui só como referência
  de nomenclatura; os itens fora do recorte desta sub-entrega **não**
  são implementados, nem como placeholder (ver §6).
- Leitura direta do código atual: `frontend/src/App.tsx`,
  `frontend/src/lib/auth.tsx`, `frontend/src/components/AppShell.tsx`,
  `frontend/src/pages/Login.tsx`, `frontend/src/pages/Dashboard.tsx`,
  `frontend/src/pages/ParceiraProfilePage.tsx`,
  `frontend/src/pages/ParceiraFormPage.tsx`,
  `frontend/src/pages/PublicCadastroPage.tsx`, `frontend/src/lib/
  parceiras.ts`, e todos os componentes em `frontend/src/components/`.

---

## 1. Auditoria do estado atual

### 1.1 Roteamento (`App.tsx`)

Hoje é binário:

```tsx
{user ? (
  <Route element={<AppShell />}>...rotas administrativas...</Route>
) : (
  <Route path="*" element={<Login />} />
)}
```

Mais uma rota pública fixa fora dessa árvore: `/cadastro` →
`PublicCadastroPage`. **Nenhuma ramificação por `role`** — qualquer
usuário autenticado, inclusive `INFLUENCIADORA`, cai em `<AppShell>`
(nav administrativo: Marcas, Parceiras, Campanhas, Aprovações etc.).
Confirmado: nenhuma ocorrência de `PortalShell`, `definir-senha` ou
`ResetPassword` em `frontend/src/**`.

### 1.2 Autenticação (`lib/auth.tsx`)

`AuthProvider`/`useAuth()` já expõe `user.role: 'ADMIN' | 'GESTOR_MARCA'
| 'INFLUENCIADORA' | null` a toda a árvore (`AuthUser` type,
`lib/auth.tsx:10-16`), com `login()`/`logout()`/`isLoading` prontos e
já testados em produção-de-desenvolvimento para qualquer papel. **Não
precisa de nenhuma mudança** — é a peça que a ramificação de rota vai
ler.

`ensureCsrfCookie()` (`lib/auth.tsx:27-30`) é chamado antes de
`POST /login`; o mesmo padrão será necessário antes de
`POST /password/reset`, pois `bootstrap/app.php` usa
`$middleware->statefulApi()` — toda rota de `routes/api.php`, mesmo
pública, roda sob o guard stateful SPA (confirmado por leitura; não é
alterado por esta sub-entrega, só documentado aqui porque afeta a nova
página).

### 1.3 Componentes reaproveitáveis sem alteração

| Componente | Uso pretendido no Portal |
|---|---|
| `AuthSplitLayout` | Moldura de `/definir-senha` (mesmo padrão de `Login.tsx` e `PublicCadastroPage.tsx` — telas públicas fora da árvore autenticada) |
| `TextField` / `SelectField` / `TextareaField` | Formulário de Perfil (dados pessoais via `TextField`; medidas via `SelectField`, domínio fechado por enum) |
| `Button` / `LinkButton` | Ações de submit/navegação, já com `isLoading`/`loadingText` |
| `StatusBadge` | Exibir `status` (`Ativa`/`Inativa`) no Dashboard/Perfil — hoje só aceita `ParceiraStatus`, compatível sem alteração |
| `EmptyState` | Estado "sem participações ainda" se o Dashboard precisar (ver §3.1 — decisão: não precisa nesta sub-entrega, ver riscos §6) |

Nenhum componente exige alteração de assinatura para ser reaproveitado.

### 1.4 Lacunas confirmadas (o que falta de verdade, só frontend)

1. **`PortalShell` não existe.** Precisa de um componente-irmão de
   `AppShell.tsx`, mesmo padrão estrutural (CSS Modules, `<Outlet />`,
   header mobile/desktop, `getInitials`, botão sair via `useAuth().logout()`),
   mas com nav própria e **sem** os itens administrativos.
2. **`App.tsx` não ramifica por `role`.** Precisa virar um `switch` de
   3 vias (`!user` → `Login`; `role === 'INFLUENCIADORA'` →
   `PortalShell`; qualquer outro papel → `AppShell` atual, inalterado).
3. **`ResetPasswordPage` e rota `/definir-senha` não existem.** Bloqueia
   o critério de sucesso do prompt de abertura ("2. Definir senha")
   mesmo já existindo o endpoint de backend
   (`POST /api/password/reset`, testado, `a81eb19`). É trabalho
   estritamente frontend — não depende de nenhum arquivo em edição na
   outra sessão.
4. **Nenhuma tela de Dashboard do Portal.** `Dashboard.tsx` atual é do
   `AppShell` (cards de Campanhas/Colaborações/Aprovações/Financeiro,
   todos fora do recorte desta sub-entrega ou administrativos) — por
   decisão já registrada (`PLANO_IMPLEMENTACAO_TEAR_V2.5.md` §3, "não
   reaproveitar as mesmas telas"), a versão da influenciadora é um
   componente novo, não uma variante condicional do existente.
5. **Nenhuma tela de Perfil consumível pela influenciadora.** A rota
   `/perfil` existe hoje só dentro do `AppShell` e aponta para
   `PlaceholderPage` (`App.tsx`, rota administrativa) — não é
   reaproveitável (é do admin, vazia). `ParceiraProfilePage.tsx`
   (leitura) e `ParceiraFormPage.tsx` (edição) são as referências de
   padrão, mas são telas do admin, parametrizadas por `:id` de rota —
   o Perfil do Portal precisa resolver a própria Parceira a partir da
   sessão (`GET /me/parceira`), nunca de um `:id` de URL, para não
   reabrir a classe de bug que a Sprint 1 fechou em leitura.
6. **Nenhuma UI de medidas em lugar nenhum do frontend.** Confirmado
   por busca: nenhuma ocorrência de `medida`, `sutia`, `calcinha` em
   `frontend/src/**`. O backend já tem o endpoint
   (`GET`/`POST /parceiras/{parceira}/medidas`, Sprint 1) mas nenhuma
   tela — admin ou influenciadora — o consome hoje. É trabalho novo por
   inteiro, não uma adaptação.
7. **`ParceiraFormPage.tsx` (admin) não envia `consentimento_aceito`**
   (`EMPTY_FORM`, `updateField`, `handleSubmit` — nenhuma referência ao
   campo), mas `UpdateParceiraRequest::rules()` (backend) o exige como
   `required, accepted`. **Achado incidental, fora do escopo desta
   sub-entrega** (é o formulário do admin, não o do Portal, e o arquivo
   de request/controller está em edição na outra sessão) — registrado
   aqui só para não ser reintroduzido sem querer no formulário novo do
   Portal, que **precisa** incluir esse campo desde o início (§3.2).

---

## 2. Arquitetura proposta

Nenhuma dependência nova (sem React Query, sem Zustand/Redux — mesmo
princípio já registrado em `PLANO_TECNICO_SPRINT_2_PORTAL_INFLUENCIADORA.md`
§2: `apiClient` + hooks locais de página).

### 2.1 Ramificação de `App.tsx`

Mantendo o estilo ternário já usado hoje (evita introduzir um padrão
novo de composição de rotas):

```tsx
<Routes>
  <Route path="/cadastro" element={<PublicCadastroPage />} />
  <Route path="/definir-senha" element={<ResetPasswordPage />} />
  {!user ? (
    <Route path="*" element={<Login />} />
  ) : user.role === 'INFLUENCIADORA' ? (
    <Route element={<PortalShell />}>
      <Route path="/" element={<PortalDashboardPage />} />
      <Route path="/perfil" element={<PortalPerfilPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  ) : (
    <Route element={<AppShell />}>...rotas administrativas, inalteradas...</Route>
  )}
</Routes>
```

`/definir-senha` fica fora de qualquer ramo condicional — igual a
`/cadastro` hoje —, pois precisa ser alcançável sem sessão (é ela que
cria a primeira sessão utilizável).

### 2.2 `PortalShell` (novo, `components/PortalShell.tsx`)

Mesmo esqueleto estrutural de `AppShell.tsx` (sidebar desktop + top bar
mobile, `getInitials`, botão sair), **componente próprio, não
condicional dentro do `AppShell`** — decisão já tomada no plano maior
(§2, "não reaproveitar componentes de página do AppShell no Portal") e
reafirmada aqui para a casca do shell também, para as duas árvores não
divergirem por acoplamento cruzado.

Nav desta sub-entrega — **só dois itens**, deliberadamente menor que o
nav-alvo completo do `UX_FLOW.md` (`Dashboard/Briefings/Materiais/
Pagamentos/Histórico/Perfil`):

```
Dashboard   (/)
Perfil      (/perfil)
```

**Decisão de escopo (não reabrir sem nova sprint):** os demais itens do
nav-alvo (Briefings, Materiais, Pagamentos, Histórico) não entram nem
como `PlaceholderPage` — diferente do `AppShell`, que usa placeholders
para módulos futuros do admin. Motivo: o prompt de abertura desta
sub-entrega proíbe explicitamente construir esses módulos agora
("Não criar ainda: campanhas; briefing; materiais; pagamentos"); expor
um link morto no nav de um usuário real (a influenciadora, não um
admin explorando o sistema) é pior UX do que não expor o item ainda.
Ver risco em §7.

### 2.3 Novo grupo de arquivos

```
frontend/src/
├── components/
│   └── PortalShell.tsx (+ .module.css)
├── pages/
│   ├── ResetPasswordPage.tsx (+ .module.css)
│   ├── PortalDashboardPage.tsx (+ .module.css)
│   └── PortalPerfilPage.tsx (+ .module.css)
└── lib/
    ├── passwordReset.ts   (função nova: resetPassword(token, email, password, password_confirmation))
    ├── me.ts               (função nova: getMeParceira())
    └── medidas.ts          (funções novas: listMedidas(parceiraId), createMedida(parceiraId, valores))
```

Nenhum arquivo existente precisa ser alterado além de `App.tsx` (a
ramificação) — em particular, **`lib/parceiras.ts` não precisa mudar**:
`updateParceira()` já aceita `Partial<ParceiraFormValues>` via PUT
genérico; a única adição é o campo `consentimento_aceito` no payload
que a tela de Perfil monta, o que não exige alterar o tipo
`ParceiraFormValues` nem a função — o corpo da requisição pode carregar
o campo extra sem quebrar tipagem se `PortalPerfilPage` construir seu
próprio objeto de request (ver §3.2, decisão de não estender o tipo
compartilhado do admin).

---

## 3. Telas

### 3.1 Dashboard (`/`, dentro do `PortalShell`)

**Conteúdo (só o que o prompt de abertura autoriza):**
- Saudação (reaproveita o padrão `greetingForHour()` de
  `Dashboard.tsx:15-19`, hora do dispositivo — copiar a função, não
  importar do módulo do admin, para as duas telas não acoplarem por um
  helper compartilhado que nasce pequeno e tende a divergir; se um
  terceiro dashboard precisar do mesmo helper no futuro, aí sim vale
  extrair para `lib/`).
- Nome da influenciadora (`user.name` de `useAuth()` — já disponível,
  sem chamada extra).
- Status da conta (`GET /me/parceira` → `status: 'Ativa' | 'Inativa'`,
  renderizado com `StatusBadge`).
- Próximos passos: lista estática/condicional, não uma feed de dados
  reais (campanhas/briefings estão fora do escopo) — ex.: "complete seu
  perfil" (link para `/perfil`, condicionado a algum campo vazio ou a
  medidas não preenchidas) e uma linha fixa tipo "em breve: suas
  campanhas aparecerão aqui" para não deixar a tela vazia sem
  explicação. Decisão de conteúdo exato do "próximos passos" fica para
  a execução (não é uma decisão arquitetural que bloqueie o plano).

**Dado consumido:** só `GET /me/parceira` (ver §5) — **não** precisa de
`GET /me/participacoes`, que o plano técnico maior lista como
pré-requisito do Dashboard completo (campanhas/pagamentos). Como
Campanhas está fora desta sub-entrega, esse endpoint não é consumido
aqui — ponto relevante para quem for implementar o backend não achar
que falta algo: falta para o Portal completo, não para o Sprint 2.1.

**Estado vazio:** se `GET /me/parceira` retornar 404 (usuário sem
Parceira vinculada — não deveria acontecer para `INFLUENCIADORA` pela
regra de negócio, mas é um estado de erro possível por dado
inconsistente), renderizar mensagem de erro genérica, não crashar.

### 3.2 Perfil (`/perfil`, dentro do `PortalShell`)

Duas seções na mesma tela (decisão: uma tela, não duas rotas —
`docs/PLANO_TECNICO_SPRINT_2_PORTAL_INFLUENCIADORA.md` §6.6 já previa
isso para o Portal completo; mantido aqui mesmo com o recorte menor):

**A. Dados pessoais** — nome, email, telefone, endereço (CEP/rua/
número/complemento/bairro/cidade/UF). Reaproveita os `TextField`s no
mesmo padrão visual de `ParceiraFormPage.tsx`, mas como componente
**próprio** do Portal (`PortalPerfilPage.tsx`), não uma importação da
tela do admin — pelos mesmos três motivos já registrados no plano
maior: (1) decisão de produto de não reaproveitar telas entre os dois
shells, (2) o formulário do admin no futuro pode ganhar campos/
filtros que não fazem sentido para a própria influenciadora editar
(ex. `status`, que nunca é editável por ela), (3) o admin edita por
`:id` de rota, o Portal resolve por sessão — APIs de dados de entrada
diferentes (`getParceira(id)` vs. `getMeParceira()`).

Campo obrigatório adicional que o formulário do admin **não** tem hoje
(achado §1.4 item 7): **checkbox de consentimento** (`consentimento_aceito`,
LGPD, Sprint 1) — este formulário precisa incluir desde a primeira
versão, já que o backend rejeita a submissão sem ele
(`UpdateParceiraRequest::rules()`, `required, accepted`).

**B. Medidas** — sutiã (tamanho P/M/G/GG + numeração 42/44/46/48 + taça
A/B/C/D), calcinha (P/M/G/GG), linha noite (P/M/G/GG). Todos os campos
são `nullable` no backend (`StoreMedidaRequest`) e o histórico é
append-only (`medidas_influenciadora`, cada `POST` cria uma linha nova,
nunca edita — `MedidaController::store` não tem `update`). Implicação
de UX: **não existe "editar a medida atual"**, existe "registrar uma
nova medida" — o formulário deve deixar isso explícito (ex. texto
"registrar novas medidas" em vez de "editar medidas"), listando a
medida mais recente (`GET /parceiras/{id}/medidas`, já ordenado
`orderByDesc('id')` no model, `Parceira.php:44`) como referência
somente leitura acima do formulário de novo registro. Cada campo usa
`SelectField` com as opções fixas do enum (mesmas 4 listas do backend,
duplicadas no frontend por não haver endpoint de metadados — mesmo
padrão que o resto do projeto já usa para enums fechados, ex.
`Campanha.status` em `Badge`/`StatusBadge`).

**Dados consumidos:**
- `GET /me/parceira` — carrega o formulário de dados pessoais (mesma
  chamada do Dashboard; a tela de Perfil pode disparar sua própria
  requisição em vez de compartilhar estado entre páginas, mesmo padrão
  que `ParceiraProfilePage`/`ParceiraFormPage` já usam hoje, sem cache
  entre telas).
- `GET /parceiras/{parceira_id}/medidas` — lista o histórico; `id` vem
  da resposta de `/me/parceira`, nunca de parâmetro de rota.
- `PUT /parceiras/{parceira_id}` — salva dados pessoais (autorização:
  dono-ou-ADMIN, sendo implementada na outra sessão agora).
- `POST /parceiras/{parceira_id}/medidas` — registra novo conjunto de
  medidas (autorização: `view` policy, já existente e já correta para
  dono, `MedidaController.php:15-19`/`21-27` — nenhuma mudança de
  backend necessária aqui).

### 3.3 Definir senha (`/definir-senha`, fora do `PortalShell`)

Página pública, fora da árvore autenticada — mesmo padrão estrutural de
`Login.tsx`/`PublicCadastroPage.tsx` (`AuthSplitLayout` + `TextField` +
`Button`). Lê `token` e `email` da query string
(`useSearchParams` do `react-router-dom`, já uma dependência do
projeto). Formulário: nova senha + confirmação (`TextField type="password"`
x2). Ao submeter, chama `POST /api/password/reset` com
`{ token, email, password, password_confirmation }`; em sucesso,
redireciona para `/login` com alguma indicação de sucesso (ex. query
param `?senha-definida=1` lido por `Login.tsx` para mostrar uma
mensagem — decisão de detalhe, não bloqueante); em erro (token
inválido/expirado, resposta 422 genérica do backend, ver
`DIAGNOSTICO_AUTENTICACAO_TEAR_V2.md` §6.1), mostra mensagem genérica
igual ao padrão de erro do `Login.tsx` (não tenta diferenciar "token
expirado" de "email não existe" — o próprio backend não diferencia, por
design anti-enumeração).

Precisa de `ensureCsrfCookie()` antes do POST, mesmo padrão de
`login()` em `lib/auth.tsx:27-30`/`38-40` (rota stateful, ver §1.2) —
replicado dentro da nova função `lib/passwordReset.ts`, não importado
de `lib/auth.tsx` (a função lá é privada ao módulo, não exportada;
extrair um helper compartilhado é uma limpeza legítima, mas
opcional — não bloqueia esta sub-entrega, ver §7).

---

## 4. Permissões (RBAC) — o que o frontend precisa garantir

O isolamento de dado real é responsabilidade do backend (policies +
filtros por `parceira_id` da sessão, Sprint 1, e as duas superfícies
que a outra sessão está fechando agora). **O frontend não deve
duplicar essa lógica**, só:

1. Ramificar a UI por `role` (§2.1) — uma influenciadora nunca deve
   *ver* a navegação/telas administrativas, mesmo que o backend já
   bloqueie o acesso aos dados caso ela tente via URL direta (defesa em
   profundidade de UX, não de segurança — a garantia de segurança real
   é o backend).
2. Nunca construir uma URL de API com um `:id` vindo de estado local ou
   da URL do navegador para os endpoints do Portal — só `GET /me/*` e
   o `id` que a própria resposta de `/me/parceira` devolve. Isso é
   principalmente relevante para `PortalPerfilPage`, que passa a
   depender de `parceira.id` da resposta de `/me/parceira` para montar
   as chamadas de medidas e do `PUT /parceiras/{id}` — nunca de um
   parâmetro de rota (`/perfil` não tem `:id`, de propósito).
3. ADMIN continua caindo em `<AppShell>` (ramo `else` do switch),
   comportamento **inalterado** — nenhum teste manual adicional além
   de confirmar que `role === 'ADMIN'` não entra no ramo
   `INFLUENCIADORA` do `App.tsx`.

---

## 5. Contrato de API consumido (referência, não definido aqui)

Estes três endpoints são definidos e implementados pela outra sessão em
paralelo (`ParceiraController`, `ParceiraPolicy`, `routes/api.php`).
Listados aqui só para que a implementação frontend saiba exatamente o
que esperar, com base no que já foi lido no código (parcialmente já
presente no momento da escrita deste plano) e no contrato documentado
em `PLANO_TECNICO_SPRINT_2_PORTAL_INFLUENCIADORA.md` §7:

| Método | Rota | Observado nesta sessão |
|---|---|---|
| `GET` | `/api/me/parceira` | Rota já adicionada em `routes/api.php` (`ParceiraController::me`) no momento da auditoria; contrato assumido: retorna `{ data: Parceira }` no mesmo formato de `ParceiraResource`, 404 se `user->parceira` for `null` |
| `PUT` | `/api/parceiras/{parceira}` | Já existe; autorização "dono-ou-ADMIN" sendo adicionada agora (`ParceiraPolicy::update` + `$this->authorize` no controller, já visto no diff em andamento) |
| `GET`/`POST` | `/api/parceiras/{parceira}/medidas` | **Não está sendo alterado pela outra sessão** — já funciona hoje, autorizado por `view` (dono-ou-ADMIN), sem mudança necessária |
| `POST` | `/api/password/reset` | **Já implementado e testado**, fora desta sessão (commit `a81eb19`) — pronto para consumo imediato |

**Esta seção não deve ser tratada como confirmação formal** — antes de
implementar de fato (fora do escopo deste plano, que é só
auditoria+desenho), validar contra o estado real de
`ParceiraResource`/rota assim que a outra sessão concluir, especialmente
o formato exato da resposta de `GET /me/parceira` (o nome do método
`me()` e o shape do retorno não foram fixados por este plano).

---

## 6. Pendências antes de implementar

1. **Bloqueador de fato:** `PATCH`/`PUT /parceiras/{id}` autorizado por
   dono e `GET /me/parceira` precisam estar mergeados/estáveis antes de
   codar `PortalPerfilPage` e `PortalDashboardPage` contra a API real —
   a outra sessão está com isso em andamento; até lá, esta sub-entrega
   fica em "plano pronto, aguardando dependência de backend
   concluir" para as duas telas autenticadas. `ResetPasswordPage`
   **não tem essa dependência** (endpoint já pronto) e pode ser
   implementada imediatamente, em paralelo, sem esperar.
2. **Decisão de conteúdo, não arquitetural:** texto exato de "próximos
   passos" no Dashboard (§3.1) — não bloqueia início da implementação,
   pode ser refinado durante a execução.
3. **Confirmar contrato de `GET /me/parceira`** (§5) assim que a outra
   sessão terminar — nome do método, shape da resposta, código de erro
   quando `parceira` é `null`.
4. **Achado incidental não resolvido aqui** (§1.4 item 7): formulário
   do admin (`ParceiraFormPage.tsx`) sem `consentimento_aceito` — não é
   bloqueador desta sub-entrega (o Portal usa um formulário próprio,
   correto desde o início), mas fica registrado como débito a corrigir
   depois, fora deste plano.

---

## 7. Riscos

- **Nav do Portal com só 2 itens pode parecer "quebrado" comparado ao
  nav-alvo do `UX_FLOW.md`** (6 itens) — mitigado pela decisão
  explícita de não expor links mortos (§2.2); reavaliar quando
  Campanhas/Financeiro entrarem em sprint futura.
- **Divergência entre `AppShell` e `PortalShell`** — mesmo risco já
  registrado no plano técnico maior (§8): dois componentes de shell
  parecidos tendem a acumular inconsistência visual com o tempo.
  Mitigação sugerida (não decidida aqui): extrair primitivas de layout
  comuns (header, container) para `components/` compartilhado numa
  sprint futura, se a duplicação começar a doer na prática — não
  antecipar essa extração sem um segundo caso de uso real.
- **Dependência cruzada de sessão:** se a outra sessão alterar o nome
  do método/rota de `GET /me/parceira` depois deste plano, `lib/me.ts`
  precisa ser ajustado na implementação — risco baixo (mudança
  isolada, um arquivo), mas real por ser trabalho concorrente.
- **CSRF em `/definir-senha`:** se a suposição de §1.2/§3.3 sobre
  `statefulApi()` cobrindo a rota pública estiver errada na prática
  (ex. a rota de reset acabar não exigindo cookie XSRF por algum
  detalhe de configuração), o único efeito é uma chamada
  `ensureCsrfCookie()` a mais e inofensiva — sem risco de quebrar o
  fluxo se a suposição for otimista.

---

## 8. Ordem de execução sugerida (só frontend, quando destravado)

1. `ResetPasswordPage` + rota `/definir-senha` + `lib/passwordReset.ts`
   — sem dependência de backend pendente, pode começar já.
2. `PortalShell` (casca vazia, só nav Dashboard/Perfil + logout) +
   ramificação de `App.tsx` — infraestrutura, testável com o usuário
   seed `influenciadora@tear.test` mesmo antes das telas reais
   existirem (cai num Portal vazio em vez de crashar).
3. `lib/me.ts` (`getMeParceira`) — depende de `GET /me/parceira`
   estável na outra sessão.
4. `PortalDashboardPage` — consome (3).
5. `lib/medidas.ts` + `PortalPerfilPage` (dados pessoais + medidas) —
   depende de (3) e de `PUT /parceiras/{id}` autorizado por dono
   estável na outra sessão.
6. Validação manual ponta a ponta com o seed local
   (`influenciadora@tear.test` / `password`): login → Dashboard →
   Perfil → editar dado pessoal → registrar medida → confirmar que
   `admin@tear.test` continua caindo no `AppShell` normalmente.

---

Nenhum código foi escrito para produzir este documento. Este plano é o
insumo de entrada para a próxima etapa de execução (frontend), que
depende da conclusão da outra sessão nos três pontos listados em §6.
