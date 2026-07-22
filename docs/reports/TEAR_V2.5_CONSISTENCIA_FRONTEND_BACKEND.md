# TEAR V2.5 — Consistência Frontend × Backend

Data: 2026-07-21
Autor: auditoria de consistência (read-only — mandato de auditoria,
`CLAUDE.md`; não implementa código, não refatora, não altera arquitetura).
Branch auditada: `feat/ui-design-system-ela`.
Escopo: **somente `tear-v2-app/`** (Laravel 12 + Sanctum / React 19 +
TypeScript). Não cobre o Portal legado GAS (`src/`) nem reabre o domínio
soberano (`CONTRATO_SOBERANO.md`).

Metodologia: leitura completa de `backend/routes/api.php`, todos os 18
`Http/Requests`, os 11 `Models`, os 9 `Http/Resources`, os 4 `Policies`,
os 10 `Controllers`, e de todos os módulos `frontend/src/lib/*.ts` +
páginas consumidoras em `frontend/src/pages` e `frontend/src/pages/portal`.
Comparação campo a campo (rotas, payloads, enums, RBAC, upload, paginação,
tratamento de erro).

Este documento complementa `docs/release/TEAR_V2.5_RELEASE_READINESS.md` (que valida
build/testes/lint) com uma checagem específica de contrato entre as duas
camadas da aplicação — não duplica seu conteúdo.

---

# Consistência confirmada

- **Rotas**: todas as ~25 chamadas HTTP feitas por `frontend/src/lib/*.ts`
  têm rota correspondente em `backend/routes/api.php`, com método HTTP,
  nomes de parâmetros e payload corretos. Nenhuma rota ausente, nenhum
  verbo trocado (`updateParceira` usa `PUT`, compatível porque
  `apiResource(...)->except(...)` aceita `PUT`/`PATCH` em `update`).
  `GET /health` é a única rota do backend sem consumidor no frontend
  (esperado — health-check de infraestrutura).
- **RBAC — fluxo Influenciadora**: isolamento por `parceira->user_id` e
  por status `ATIVA` implementado de forma consistente em
  `ParceiraPolicy`, `CampanhaPolicy` e `ParticipacaoNaCampanhaPolicy`; o
  roteamento do frontend (`App.tsx`) reflete corretamente essa
  segregação (Portal isolado, sem acesso a rotas administrativas).
- **RBAC — fluxo ADMIN**: `Gate::before` concede bypass total a `ADMIN`;
  ações administrativas sensíveis (aprovar parceira, aprovar/reprovar
  material, avançar status de pagamento) são corretamente ocultadas no
  frontend via `user?.role === 'ADMIN'` em `MateriaisPage.tsx`,
  `PagamentoPage.tsx` (parcialmente) e `ParceiraProfilePage.tsx`.
- **Enums**: 100% de correspondência entre `Rule::in()` do backend e os
  union types do frontend — `CampanhaStatus`, `MarcaStatus`/
  `ParceiraStatus`, `ParticipacaoStatus`, `PagamentoStatus`,
  `MaterialTipo`, `MaterialStatus`, `TipoConteudo` (Briefing) e os 5
  enums de `MedidaInfluenciadora`.
- **Nomenclatura de campos**: 100% snake_case nos dois lados; nenhum
  caso de camelCase sem tradução.
- **Datas/decimais/monetários**: datas via `toDateString()` (compatível
  com `<input type="date">`); datetimes via `toIso8601String()`; valores
  monetários (`decimal:2` no Model) re-castados para `(float)` nos
  Resources — frontend trata como `number` sem risco de string vs number.
- **Relacionamentos aninhados**: `CampanhaController` carrega
  explicitamente `marca` e `participacoes.parceira`, batendo com o que
  `CampanhaResource`/`ParticipacaoResource` expõem via `whenLoaded()` e
  com o que as páginas consomem.
- **Strings vazias → null**: middleware global (`TrimStrings`,
  `ConvertEmptyStringsToNull`) roda também em `api/*`; campos opcionais
  enviados como `''` chegam como `null` e passam pelas regras `nullable`.
- **Upload de Material**: nome de campo (`arquivo`) e campo `tipo` batem
  entre `StoreMaterialRequest` e `materiais.ts`; `MaterialResource` bate
  1:1 com o type TS `Material`; estados de loading/erro (`isUploading`,
  `uploadError`) implementados corretamente nas duas telas de upload.
- **Paginação — formato e filtros**: `paginate(20)` usado corretamente
  em `Campanha`/`Marca`/`Parceira`, formato padrão Laravel
  (`data`/`links`/`meta`); parâmetros de filtro (`status`, `marca_id`)
  batem nome nos dois lados. Listas aninhadas (participações, materiais,
  briefings, medidas) não paginadas em nenhum dos dois lados —
  consistente entre si (volumes hoje pequenos).
- **Erro 422 (validação)**: tratamento robusto e uniforme em todas as
  telas de formulário, lendo corretamente `error.response.data.errors`
  no formato `{ campo: string[] }` gerado pelo Laravel.
- **Formato de erro do backend**: segue o padrão default do Laravel em
  toda a API (nenhuma inconsistência entre controllers); nenhum handler
  customizado que divirja desse padrão.

---

# Inconsistências

## 1. RBAC — role `GESTOR_MARCA` sem escopo de dados implementado

**Classificação:** ⚠ **Decisão de Produto (PO Required)** — não é um bug de código. O código é internamente consistente com a ausência de uma decisão: a role foi criada no seeder e exposta na UI, mas nunca recebeu uma definição funcional (o que um `GESTOR_MARCA` pode ver/fazer, e como o vínculo dele com uma Marca seria modelado). Não há comportamento "errado" para corrigir sem antes responder essa pergunta de produto.

**Evidência técnica:**
- `backend/database/seeders/RoleSeeder.php:15` — role `GESTOR_MARCA` é criada no seeder de roles, junto com `ADMIN` e `INFLUENCIADORA`.
- `backend/database/seeders/DevUserSeeder.php:22` — um usuário de desenvolvimento é criado com essa role, confirmando que ela é tratada como um perfil de uso real (não um resquício morto).
- `backend/app/Providers/AppServiceProvider.php:26` — `Gate::before(fn ($user, $ability) => $user->hasRole('ADMIN') ? true : null)`: apenas `ADMIN` recebe bypass total de autorização; `GESTOR_MARCA` cai nas Policies normais, que não têm regra dedicada para ela.
- `backend/app/Policies/MarcaPolicy.php:14-22` — método `viewAny()` e `view()` retornam `false` de forma incondicional para qualquer usuário que não seja `ADMIN` (o próprio comentário no arquivo diz "só ADMIN... enxerga marcas").
- `backend/app/Http/Controllers/Api/ParceiraController.php:34-39`, método `index()` — para não-ADMIN, aplica `->where('user_id', $request->user()->id)` sobre a relação com `Parceira`; `GESTOR_MARCA` nunca tem uma `Parceira` vinculada (esse vínculo só existe para `INFLUENCIADORA`), então a query sempre retorna vazio.
- `backend/app/Http/Controllers/Api/CampanhaController.php:31-37`, método `index()` — mesmo padrão: filtra por `participacoes.parceira_id = user->parceira?->id`, que é `null` para `GESTOR_MARCA`.
- Busca em todos os `backend/app/Models/*.php` não encontra nenhuma coluna ou relação que vincule `Marca` a `User` — o conceito "esta marca pertence a este gestor" não existe no schema.
- `frontend/src/App.tsx:54` — `{user && user.role !== 'INFLUENCIADORA' && (...)}`: a única distinção de rota feita é "é Influenciadora ou não"; `ADMIN` e `GESTOR_MARCA` recebem exatamente o mesmo conjunto de rotas.
- `frontend/src/components/AppShell.tsx:5-19` — `NAV_ITEMS` (menu principal) é idêntico para as duas roles, sem filtragem condicional.
- `frontend/src/pages/Dashboard.tsx:9-13` — `ROLE_LABELS` traduz `GESTOR_MARCA` como "Gestor(a) de Marca", reforçando que a intenção de produto é ter esse papel funcionando, não apenas um valor de enum não utilizado.

**Arquivo(s):** `backend/database/seeders/RoleSeeder.php`, `backend/database/seeders/DevUserSeeder.php`, `backend/app/Providers/AppServiceProvider.php`, `backend/app/Policies/MarcaPolicy.php`, `backend/app/Http/Controllers/Api/ParceiraController.php`, `backend/app/Http/Controllers/Api/CampanhaController.php`, `frontend/src/App.tsx`, `frontend/src/components/AppShell.tsx`, `frontend/src/pages/Dashboard.tsx`.

**Método:** `Gate::before()` (AppServiceProvider); `MarcaPolicy::viewAny()` / `MarcaPolicy::view()`; `ParceiraController::index()`; `CampanhaController::index()`.

**Linha aproximada:** `AppServiceProvider.php:26`; `MarcaPolicy.php:14-22`; `ParceiraController.php:34-39`; `CampanhaController.php:31-37`; `App.tsx:54`; `AppShell.tsx:5-19`.

**Fluxo de reprodução:**
1. Criar (ou usar o seeder de dev) um usuário com role `GESTOR_MARCA`.
2. Fazer login com esse usuário — o frontend renderiza o `AppShell` completo, com o mesmo menu do `ADMIN` (Marcas, Campanhas, Parceiras, etc.), porque `App.tsx:54` só trata `INFLUENCIADORA` como caso especial.
3. Clicar em "Marcas" → `GET /marcas` → `MarcaPolicy::viewAny()` retorna `false` → resposta `403`.
4. Clicar em "Parceiras" → `GET /parceiras` → `ParceiraController::index()` filtra por uma `Parceira` vinculada ao usuário, que não existe → lista sempre vazia (sem erro, silenciosamente vazia).
5. Clicar em "Campanhas" → mesmo padrão do passo 4: lista sempre vazia.
6. Tentar qualquer ação de escrita (criar Marca/Campanha/Parceira, vincular participação, aprovar material ou pagamento) → rota protegida por `middleware('role:ADMIN')` → `403` em todos os casos.
7. Resultado: o usuário `GESTOR_MARCA` vê um painel administrativo aparentemente completo e funcional, mas toda ação relevante falha silenciosamente (lista vazia) ou explicitamente (403).

**Motivo da classificação (Decisão de Produto, não bug):** o sistema não está se comportando de forma inconsistente com nenhuma especificação — ele está se comportando de forma consistente com a *ausência* de uma especificação. Corrigir isso via código exigiria antes responder perguntas que só o responsável pelo produto pode responder: um `GESTOR_MARCA` deve enxergar todas as marcas ou só as "suas"? Existe hoje algum critério de "marca de um gestor" no negócio (ex.: um campo a ser adicionado, um vínculo N:N)? A role deve entrar em uso já na V2.5 ou pode ficar de fora até a V2.6? Sem essas respostas, qualquer implementação seria uma suposição de escopo, não uma correção de bug — por isso a reclassificação de CRÍTICO (bug) para Decisão de Produto (PO Required).

**Impacto:** enquanto a decisão não for tomada, qualquer usuário real cadastrado com `GESTOR_MARCA` antes do Go-Live terá uma experiência de sistema quebrado (páginas vazias e 403 em quase toda ação), apesar da role aparecer disponível e rotulada na interface.

**Decisão:** ⚠ **Requer decisão de produto (regra de negócio inédita, não é escolha técnica)** — duas rotas possíveis: (a) implementar o vínculo Marca↔User e as Policies de escopo antes do Go-Live, ou (b) remover `GESTOR_MARCA` do seeder/UI para V2.5 e reintroduzir em V2.6 quando o escopo estiver definido e implementado. **Enquanto não houver decisão, tratar como bloqueio potencial de Go-Live** (se algum usuário real vier a ser cadastrado com essa role antes da definição de escopo).

---

## 2. RBAC — formulários de escrita ADMIN-only não são ocultados no frontend para roles não-ADMIN

**Evidência:**
- `backend/routes/api.php:58-59,62-63,81-82` — `POST/PATCH campanhas`, `POST participacoes`, `POST pagamento` exigem `role:ADMIN`.
- `frontend/src/pages/CampanhaDetailPage.tsx:124-126,236-306` — botão de editar campanha e formulário "Vincular parceira" renderizados sem checar `user.role`.
- `frontend/src/pages/PagamentoPage.tsx:121-146` — formulário "Criar pagamento" sem gate de role (a mesma página já faz o gate corretamente em outro trecho: `:42,114`).
- `MarcaFormPage.tsx`, `ParceiraFormPage.tsx`, `BriefingFormPage.tsx` — sem verificação de role em nenhum ponto.

**Impacto:** usuário sem permissão vê e preenche um formulário funcional, submete, e recebe erro genérico ("Não foi possível... Tente novamente") sem indicação de que é um problema de permissão — UX ambígua, mascara 403 como falha transitória. Fica mais grave se o item 1 for resolvido criando um `GESTOR_MARCA` com permissões parciais.

**Prioridade:** ALTO

**Decisão:** ✔ Corrigir antes do Go-Live (ajuste simples e de baixo risco: condicionar renderização a `user?.role === 'ADMIN'`, seguindo o padrão já usado em `MateriaisPage.tsx`/`ParceiraProfilePage.tsx`).

---

## 3. DTO/Payload + Models — tipos de Briefing TIKTOK/UGC são oferecidos na UI mas nunca podem ser criados com sucesso

**Evidência técnica:**
- `backend/database/migrations/2026_07_20_130001_add_tiktok_ugc_qtd_to_participacoes_na_campanha_table.php:15-16` — colunas `tiktok_qtd`/`ugc_qtd` criadas na tabela `participacoes_na_campanha` com `default(0)`.
- `backend/app/Models/ParticipacaoNaCampanha.php:13-23` — `$fillable` inclui `tiktok_qtd` e `ugc_qtd`.
- `backend/app/Models/ParticipacaoNaCampanha.php:54-64`, método `quantidadeContratadaPara(string $tipo)` — resolve a quantidade contratada de um tipo de conteúdo lendo diretamente `$this->tiktok_qtd` / `$this->ugc_qtd` (entre outros); como essas colunas nunca são setadas para um valor diferente de `0`, o método sempre retorna `0` para `TIKTOK`/`UGC`.
- `backend/app/Http/Requests/Participacao/StoreParticipacaoRequest.php:30-34`, método `rules()` — só declara regras de validação para `reels_qtd`, `carrossel_qtd`, `stories_qtd`; `tiktok_qtd`/`ugc_qtd` não aparecem nessa lista, portanto o Laravel os descarta do payload validado mesmo que fossem enviados.
- `backend/app/Http/Requests/Participacao/UpdateParticipacaoRequest.php:20-26`, método `rules()` — mesma omissão na edição de uma participação já existente.
- `backend/app/Http/Resources/ParticipacaoResource.php:15-26`, método `toArray()` — não inclui `tiktok_qtd` nem `ugc_qtd` na serialização, então nem o frontend consegue ler o valor atual dessas colunas.
- `backend/app/Http/Requests/Briefing/StoreBriefingRequest.php:22` — a regra do campo `tipo` inclui `Rule::in([..., 'TIKTOK', 'UGC'])`, aceitando essas opções como entrada válida.
- `backend/app/Http/Requests/Briefing/StoreBriefingRequest.php:41-49`, método `withValidator()` — adiciona um erro de validação customizado quando `$participacao->quantidadeContratadaPara($tipo) < 1`, com a mensagem "Este tipo de conteúdo não foi contratado nesta participação".
- `frontend/src/lib/briefings.ts:3` — constante `TIPOS` inclui `'TIKTOK'` e `'UGC'` na lista de tipos de conteúdo do Briefing.
- `frontend/src/pages/BriefingFormPage.tsx:18` — o `<select>` de tipo de Briefing itera sobre `TIPOS`, oferecendo `TikTok` e `UGC` como opções clicáveis para o usuário final.
- `frontend/src/pages/CampanhaDetailPage.tsx:19-33,254-289` — o formulário "Vincular parceira" (que faz `POST /campanhas/{id}/participacoes`) só tem campos para `reels_qtd`, `carrossel_qtd` e `stories_qtd`; não existe nenhum input para `tiktok_qtd`/`ugc_qtd` em nenhuma tela do sistema.

**Arquivo(s):** `backend/database/migrations/2026_07_20_130001_add_tiktok_ugc_qtd_to_participacoes_na_campanha_table.php`, `backend/app/Models/ParticipacaoNaCampanha.php`, `backend/app/Http/Requests/Participacao/StoreParticipacaoRequest.php`, `backend/app/Http/Requests/Participacao/UpdateParticipacaoRequest.php`, `backend/app/Http/Resources/ParticipacaoResource.php`, `backend/app/Http/Requests/Briefing/StoreBriefingRequest.php`, `frontend/src/lib/briefings.ts`, `frontend/src/pages/BriefingFormPage.tsx`, `frontend/src/pages/CampanhaDetailPage.tsx`.

**Método:** `ParticipacaoNaCampanha::quantidadeContratadaPara()`; `StoreParticipacaoRequest::rules()`; `UpdateParticipacaoRequest::rules()`; `StoreBriefingRequest::withValidator()`.

**Linha aproximada:** `ParticipacaoNaCampanha.php:54-64` (cálculo que sempre resolve para 0); `StoreParticipacaoRequest.php:30-34` e `UpdateParticipacaoRequest.php:20-26` (omissão do campo); `StoreBriefingRequest.php:41-49` (ponto onde a validação reprova).

**Fluxo de reprodução:**
1. Admin cria uma Campanha normalmente.
2. Admin vincula uma Parceira à campanha via o formulário "Vincular parceira" (`POST /campanhas/{id}/participacoes`) — só é possível informar quantidades de Reels/Carrossel/Stories; `tiktok_qtd`/`ugc_qtd` permanecem no valor default `0` no banco, sem nenhuma forma de alterá-los.
3. Admin abre a participação recém-criada e clica em "Novo Briefing".
4. No formulário de Briefing, seleciona o tipo `TikTok` (ou `UGC`) — opção presente e clicável no `<select>`.
5. Submete o formulário → `POST /participacoes/{id}/briefings` com `tipo: "TIKTOK"`.
6. `StoreBriefingRequest::withValidator()` chama `quantidadeContratadaPara('TIKTOK')`, que retorna `0`.
7. A validação falha com `422` e a mensagem "Este tipo de conteúdo não foi contratado nesta participação".
8. O passo 4-7 se repete de forma **determinística para qualquer participação**, em qualquer campanha, porque não existe nenhum caminho — nem na API, nem na UI — para que `tiktok_qtd`/`ugc_qtd` deixem de ser `0`.

**Motivo da classificação (CRÍTICO):** é uma funcionalidade visivelmente oferecida na interface (o tipo aparece como opção selecionável, sugerindo suporte real) mas que falha 100% das vezes, sem excecão, para qualquer usuário e qualquer dado — não é um caso de borda, é a única saída possível do fluxo. Isso representa a incapacidade de registrar uma contratação real de conteúdo TikTok/UGC no sistema antes do Go-Live, e gera trabalho (o usuário tenta, recebe erro, tenta novamente, reporta bug) sem que exista, hoje, qualquer forma de contornar via UI.

**Impacto:** o admin vê "TikTok" e "UGC" como opções válidas ao criar um Briefing, mas toda tentativa falha com 422 — para qualquer participação, sem exceção, porque não existe nenhum caminho (API ou UI) para contratar esses tipos. Funcionalidade que aparenta existir mas está morta.

**Prioridade:** CRÍTICO

**Decisão:** ✔ Corrigir antes do Go-Live — na forma mínima seguinte: remover `TIKTOK`/`UGC` das opções selecionáveis em `BriefingFormPage.tsx` até que `StoreParticipacaoRequest`/`UpdateParticipacaoRequest`/`ParticipacaoResource` e o formulário "Vincular parceira" sejam atualizados para aceitar essas quantidades. É um bug de contrato (RN-06 sempre reprova), não uma escolha de produto.

---

## 4. Paginação — frontend nunca envia parâmetro de página; registros além do 20º ficam inacessíveis

**Evidência técnica:**
- `backend/app/Http/Controllers/Api/CampanhaController.php:39`, método `index()` — `Campanha::query()->paginate(20)`, retornando o formato padrão do Laravel (`data`, `links`, `meta.current_page/last_page/total`).
- `backend/app/Http/Controllers/Api/MarcaController.php:27`, método `index()` — mesmo padrão, `Marca::query()->paginate(20)`.
- `backend/app/Http/Controllers/Api/ParceiraController.php:41`, método `index()` — mesmo padrão, `paginate(20)`.
- `frontend/src/lib/marcas.ts:26-28` — o tipo `ListMarcasParams` só declara `{ status }`, sem campo `page`.
- `frontend/src/lib/campanhas.ts:43-46` — o tipo `ListCampanhasParams` só declara `{ marca_id, status }`, sem campo `page`.
- `frontend/src/lib/parceiras.ts:44-46` — o tipo `ListParceirasParams` só declara `{ status }`, sem campo `page`.
- `frontend/src/pages/MarcasListPage.tsx:12-16` — chama `listMarcas({ status })` sem parâmetro de página e não renderiza nenhum controle de "próxima página"/paginador.
- `frontend/src/pages/CampanhasListPage.tsx:26-31` — mesmo padrão para campanhas.
- `frontend/src/pages/ParceirasListPage.tsx:16-21` — mesmo padrão para parceiras.
- Em todos os três arquivos `lib/*.ts` citados, o campo `meta` da resposta só é lido para extrair `meta.total` (usado pelas funções auxiliares `countMarcas`/`countCampanhas`, provavelmente para cards de contagem no Dashboard) — `meta.current_page`/`meta.last_page` nunca são lidos ou usados para navegação em nenhuma tela.

**Arquivo(s):** `backend/app/Http/Controllers/Api/CampanhaController.php`, `backend/app/Http/Controllers/Api/MarcaController.php`, `backend/app/Http/Controllers/Api/ParceiraController.php`, `frontend/src/lib/marcas.ts`, `frontend/src/lib/campanhas.ts`, `frontend/src/lib/parceiras.ts`, `frontend/src/pages/MarcasListPage.tsx`, `frontend/src/pages/CampanhasListPage.tsx`, `frontend/src/pages/ParceirasListPage.tsx`.

**Método:** `CampanhaController::index()`; `MarcaController::index()`; `ParceiraController::index()`; funções `listMarcas()`/`listCampanhas()`/`listParceiras()` no frontend.

**Linha aproximada:** `CampanhaController.php:39`; `MarcaController.php:27`; `ParceiraController.php:41`; `marcas.ts:26-28`; `campanhas.ts:43-46`; `parceiras.ts:44-46`; `MarcasListPage.tsx:12-16`; `CampanhasListPage.tsx:26-31`; `ParceirasListPage.tsx:16-21`.

**Fluxo de reprodução:**
1. Popular o banco com 21 ou mais registros ativos de uma das três entidades (por exemplo, 21 Marcas).
2. Acessar a tela de listagem correspondente na aplicação (ex.: "Marcas").
3. O frontend chama `GET /marcas` sem nenhum parâmetro `page` (implícito = página 1).
4. O backend responde com os 20 primeiros registros em `data`, e `meta.last_page = 2`, `meta.total = 21`.
5. A tela renderiza os 20 itens de `data` e, no máximo, exibe `meta.total` em algum contador — mas não existe nenhum botão, link ou controle de "próxima página" em nenhuma das três telas.
6. O 21º registro (e qualquer subsequente) nunca aparece em nenhuma tela do sistema, mesmo existindo e sendo um dado válido no banco — sem mensagem de erro, sem indicação visual de que há mais páginas.
7. Reproduzível de forma determinística e automática assim que o volume de registros ativos ultrapassar 20 em Marcas, Campanhas ou Parceiras — não depende de nenhuma ação incorreta do usuário.

**Motivo da classificação (CRÍTICO):** é perda silenciosa de acesso a dados reais — ao contrário de um erro visível (que ao menos alerta a equipe), aqui a lista simplesmente aparenta estar completa quando não está. Isso é particularmente grave porque (a) o valor limite (20) é baixo e plausível de ser atingido logo após o Go-Live com o crescimento normal da base de clientes/parceiras, e (b) a ausência de qualquer sinal de erro faz com que o problema só seja percebido quando alguém notar manualmente que "a marca X deveria estar na lista e não está" — não há como o sistema ou a equipe de suporte detectar a falha proativamente.

**Impacto:** assim que o número de marcas, campanhas ou parceiras ativas ultrapassar 20, os registros excedentes ficam completamente invisíveis na tela de listagem — sem erro, sem aviso.

**Prioridade:** CRÍTICO

**Decisão:** ✔ Corrigir antes do Go-Live — risco real e imediato: basta a base de clientes/parceiras crescer minimamente para dados ficarem inacessíveis pela UI, sem qualquer sinal de erro.

---

## 5. Erros — sem interceptor global de 401; sessão expirada não redireciona para login

**Evidência:**
- `frontend/src/lib/apiClient.ts:3-10` — só `axios.create(...)`, sem `interceptors.response.use(...)`.
- `frontend/src/lib/auth.tsx:41-50` — verifica `/me` uma única vez, no mount do `AuthProvider`.
- Todas as páginas (`MarcasListPage.tsx:15`, `CampanhaDetailPage.tsx:50`, `PagamentoPage.tsx:48`, etc.) tratam 401 igual a qualquer outro erro, com mensagem genérica de "não foi possível carregar".

**Impacto:** se a sessão Sanctum expirar durante o uso (cookie expira, logout em outra aba), o usuário fica preso numa tela de erro genérico, sem nunca ser levado de volta ao `/login` — precisa descobrir sozinho que precisa recarregar a página.

**Prioridade:** ALTO

**Decisão:** ✔ Corrigir antes do Go-Live — cenário realista em uso prolongado (expiração de sessão); correção pontual e de baixo risco (interceptor global de resposta no `apiClient.ts` para 401 → redirecionar a `/login`).

**Status:** ✅ Corrigido — interceptor global de resposta em `apiClient.ts` dispara evento `auth:unauthorized` em qualquer 401; `AuthProvider` (`auth.tsx`) escuta o evento e limpa `user`, o que já aciona a rota `*` → `<Login />` existente em `App.tsx:44`.

---

## 6. DTO/Payload — não existe UI para alterar o `status` de Marca (Ativa/Inativa)

**Evidência:**
- `backend/app/Models/Marca.php:11-18`, `StoreMarcaRequest.php:26`, `UpdateMarcaRequest.php:31` — backend aceita e valida `status`.
- `frontend/src/lib/marcas.ts:15-21` (`MarcaFormValues`) e `MarcaFormPage.tsx` — nunca leem nem enviam `status`.
- `MarcasListPage.tsx:54` — `status` é só exibido, sem ação de alterar.

**Impacto:** impossível desativar uma Marca que deixou de ser cliente através da UI — gap funcional, não um erro de runtime (nenhuma tela quebra; a ação simplesmente não existe).

**Prioridade:** MÉDIO

**Decisão:** ✔ Postergar para V2.6 — não bloqueia o fluxo crítico de Go-Live (criar/gerenciar campanhas e participações); workaround via acesso direto ao backend é aceitável no curto prazo.

---

## 7. Uploads — sem validação client-side de tamanho/tipo de arquivo em Material

**Evidência:**
- `backend/app/Http/Requests/Material/StoreMaterialRequest.php:20-23` — limita a 50MB e 8 mimetypes.
- `frontend/src/pages/MateriaisPage.tsx:199`, `frontend/src/pages/portal/PortalCampanhaDetailPage.tsx:274-279` — `<input type="file">` sem `accept` e sem checagem prévia de tamanho/tipo.

**Impacto:** usuário pode selecionar um arquivo grande ou de tipo não aceito, esperar o upload inteiro completar e só então receber o 422 — desperdício de banda/tempo, sem impacto de segurança (backend já valida corretamente).

**Prioridade:** MÉDIO

**Decisão:** ✔ Postergar para V2.6 — é melhoria de UX; o backend já protege corretamente contra arquivos inválidos.

---

## 8. Erros — mensagens de upload genéricas não distinguem 422 (arquivo inválido) de 503 (Drive indisponível) de 500 (falha do Drive)

**Evidência:**
- `backend/app/Http/Controllers/Api/MaterialController.php:33-53` — 422 (validação), 503 (Drive não configurado, mensagem amigável específica), ou 500 (exceção não tratada de `GoogleDriveService`, sem try/catch).
- `frontend/src/pages/MateriaisPage.tsx:65-66`, `PortalCampanhaDetailPage.tsx:85-86` — catch genérico único ("Não foi possível enviar o material. Tente novamente.") para os três casos.

**Impacto:** usuário não distingue "corrija seu arquivo" de "tente mais tarde, é uma falha temporária do serviço" — confusão e possíveis novas tentativas inúteis; dificulta suporte/diagnóstico.

**Prioridade:** MÉDIO

**Decisão:** ✔ Postergar para V2.6 — não impede o fluxo funcionar quando tudo está correto; é lacuna de clareza de mensagem, não de comportamento.

---

## 9. Erros — 403 e 404 nunca tratados de forma diferenciada no frontend

**Evidência:** busca por `status === 403` em todo `frontend/src` não retorna nenhuma ocorrência; toda página usa o mesmo catch genérico para 403, 404, 500 e falha de rede (ex. `MarcaFormPage.tsx:66-68`, `ParceiraFormPage.tsx:96-98`, `CampanhaDetailPage.tsx:90-92`).

**Impacto:** usuário sem permissão (403) ou pedindo um registro inexistente (404) recebe a mesma mensagem genérica de "não foi possível carregar/salvar" — indistinguível de erro de rede ou bug real; puramente UX, o backend continua bloqueando/recusando corretamente.

**Prioridade:** MÉDIO / BAIXO

**Decisão:** ✔ Postergar para V2.6 — melhoria de diagnóstico para o usuário, sem risco funcional ou de segurança (o bloqueio em si já funciona).

---

## 10. Paginação/Busca — sem parâmetro de ordenação ou busca textual parametrizável (ausência de feature, não bug)

**Evidência:** `MarcaController.php:26`, `ParceiraController.php:40`, `CampanhaController.php:38` fixam `orderBy` internamente; frontend não envia nem espera parâmetro de sort/busca.

**Impacto:** nenhum — ambos os lados concordam em não ter a funcionalidade; registrado apenas como lacuna funcional.

**Prioridade:** BAIXO

**Decisão:** ✔ Postergar para V2.6.

---

## 11. Erros — 500/erro de rede indistinguíveis entre si na UI

**Evidência:** qualquer erro que não seja 422 cai no mesmo `catch`/`else` genérico com mensagem "Tente novamente", em todas as páginas de formulário.

**Impacto:** puramente de diagnóstico para o usuário; nenhum comportamento incorreto.

**Prioridade:** BAIXO

**Decisão:** ✔ Postergar para V2.6.

---

# Resumo executivo

| # | Item | Prioridade | Decisão |
|---|------|-----------|---------|
| 1 | `GESTOR_MARCA` sem escopo de dados implementado | ⚠ Decisão de Produto (PO Required) — não é bug | ⚠ Decisão de produto pendente |
| 2 | Formulários ADMIN-only não ocultados no frontend | ALTO | Corrigir antes do Go-Live |
| 3 | Briefing TIKTOK/UGC sempre falha (RN-06) | CRÍTICO | Corrigir antes do Go-Live |
| 4 | Paginação nunca acionada (Marcas/Campanhas/Parceiras) | CRÍTICO | Corrigir antes do Go-Live |
| 5 | Sem interceptor global de 401 (sessão expirada) | ALTO | ✅ Corrigido |
| 6 | Sem UI para alterar status de Marca | MÉDIO | Postergar para V2.6 |
| 7 | Sem validação client-side de arquivo (Material) | MÉDIO | Postergar para V2.6 |
| 8 | Erro de upload não distingue 422/503/500 | MÉDIO | Postergar para V2.6 |
| 9 | 403/404 sem tratamento diferenciado | MÉDIO/BAIXO | Postergar para V2.6 |
| 10 | Sem busca/ordenação parametrizável | BAIXO | Postergar para V2.6 |
| 11 | 500/rede indistinguíveis | BAIXO | Postergar para V2.6 |

**Itens que exigem ação de código antes do Go-Live (independente do item 1):** #2, #3, #4, #5 — nenhum é de grande esforço, mas #3 e #4 são bugs funcionais reais (não apenas UX) e devem ser tratados com prioridade.

**Bloqueio real pendente de decisão humana:** item #1 (`GESTOR_MARCA`) — é uma regra de negócio inédita (a role deve existir e funcionar no Go-Live, ou deve ser removida da V2.5?), não uma escolha técnica desta auditoria.
