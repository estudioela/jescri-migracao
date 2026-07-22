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

Este documento complementa `TEAR_V2.5_RELEASE_READINESS.md` (que valida
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

## 1. RBAC — role `GESTOR_MARCA` é funcionalmente inutilizável, mas o frontend a trata como equivalente a ADMIN

**Evidência:**
- `backend/database/seeders/RoleSeeder.php:15`, `DevUserSeeder.php:22` — role real, criada e atribuível.
- `backend/app/Providers/AppServiceProvider.php:26` — só `ADMIN` recebe bypass total no Gate.
- `backend/app/Policies/MarcaPolicy.php:14-22` — `viewAny`/`view` retornam `false` incondicionalmente para não-ADMIN → `GET /marcas` = 403.
- `backend/app/Http/Controllers/Api/ParceiraController.php:34-39` e `CampanhaController.php:31-37` — listas filtradas por vínculo com `Parceira`, que não existe para `GESTOR_MARCA` → listas sempre vazias.
- Não existe em nenhum Model um vínculo Marca↔User.
- `frontend/src/App.tsx:54` e `frontend/src/components/AppShell.tsx:5-19` — roteiam `GESTOR_MARCA` para o mesmo painel completo do ADMIN, sem filtragem.
- `frontend/src/pages/Dashboard.tsx:9-13` — rotula a role como "Gestor(a) de Marca", indicando uso de produto real esperado.

**Impacto:** qualquer usuário logado com `GESTOR_MARCA` abre o painel administrativo completo e encontra páginas vazias e 403 em praticamente toda ação — a role está presente na UI e no banco mas não tem nenhum caminho funcional.

**Prioridade:** CRÍTICO

**Decisão:** ⚠ **Requer decisão de produto (regra de negócio inédita, não é escolha técnica)** — há duas rotas possíveis igualmente válidas: (a) implementar o vínculo Marca↔User e as Policies de escopo antes do Go-Live, ou (b) remover `GESTOR_MARCA` do seeder/UI para V2.5 e reintroduzir em V2.6 quando o escopo estiver implementado. Não decidido nesta auditoria — só o responsável pelo produto sabe se algum usuário real será cadastrado com essa role no Go-Live. **Enquanto não houver decisão, tratar como bloqueio potencial de Go-Live.**

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

**Evidência:**
- `backend/database/migrations/2026_07_20_130001_add_tiktok_ugc_qtd_to_participacoes_na_campanha_table.php:15-16` — colunas `tiktok_qtd`/`ugc_qtd` criadas com `default(0)`.
- `backend/app/Models/ParticipacaoNaCampanha.php:13-23,54-64` — `fillable` inclui as colunas e `quantidadeContratadaPara()` as usa para validar a regra RN-06.
- `backend/app/Http/Requests/Participacao/StoreParticipacaoRequest.php:30-34` e `UpdateParticipacaoRequest.php:20-26` — só aceitam `reels_qtd`, `carrossel_qtd`, `stories_qtd`; não há como setar `tiktok_qtd`/`ugc_qtd` &gt; 0 via API.
- `backend/app/Http/Resources/ParticipacaoResource.php:15-26` — não serializa essas colunas.
- `backend/app/Http/Requests/Briefing/StoreBriefingRequest.php:22,41-49` — enum `tipo` inclui `TIKTOK`/`UGC`, e bloqueia o briefing se `quantidadeContratadaPara($tipo) &lt; 1`.
- `frontend/src/lib/briefings.ts:3`, `frontend/src/pages/BriefingFormPage.tsx:18` — `TIPOS` oferece `TIKTOK` e `UGC` como opções selecionáveis.
- `frontend/src/pages/CampanhaDetailPage.tsx:19-33,254-289` — formulário "Vincular parceira" só tem campos Reels/Carrossel/Stories; não há como contratar TikTok/UGC.

**Impacto:** o admin vê "TikTok" e "UGC" como opções válidas ao criar um Briefing, mas toda tentativa falha com 422 ("Este tipo de conteúdo não foi contratado nesta participação") — para qualquer participação, sem exceção, porque não existe nenhum caminho (API ou UI) para contratar esses tipos. Funcionalidade que aparenta existir mas está morta.

**Prioridade:** CRÍTICO

**Decisão:** ✔ Corrigir antes do Go-Live — na forma mínima seguinte: remover `TIKTOK`/`UGC` das opções selecionáveis em `BriefingFormPage.tsx` até que `StoreParticipacaoRequest`/`UpdateParticipacaoRequest`/`ParticipacaoResource` e o formulário "Vincular parceira" sejam atualizados para aceitar essas quantidades. É um bug de contrato (RN-06 sempre reprova), não uma escolha de produto.

---

## 4. Paginação — frontend nunca envia parâmetro de página; registros além do 20º ficam inacessíveis

**Evidência:**
- `backend/app/Http/Controllers/Api/CampanhaController.php:39`, `MarcaController.php:27`, `ParceiraController.php:41` — todos `paginate(20)`.
- `frontend/src/lib/marcas.ts:26-28`, `campanhas.ts:43-46`, `parceiras.ts:44-46` — nenhum dos tipos `ListXParams` aceita `page`.
- `frontend/src/pages/MarcasListPage.tsx:12-16`, `CampanhasListPage.tsx:26-31`, `ParceirasListPage.tsx:16-21` — chamam `listX()` sem parâmetro de página e não renderizam nenhum controle de paginação.
- `meta` só é lido para `total` (usado por `countMarcas`/`countCampanhas`), nunca para navegação.

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
| 1 | `GESTOR_MARCA` sem escopo de dados implementado | CRÍTICO | ⚠ Decisão de produto pendente |
| 2 | Formulários ADMIN-only não ocultados no frontend | ALTO | Corrigir antes do Go-Live |
| 3 | Briefing TIKTOK/UGC sempre falha (RN-06) | CRÍTICO | Corrigir antes do Go-Live |
| 4 | Paginação nunca acionada (Marcas/Campanhas/Parceiras) | CRÍTICO | Corrigir antes do Go-Live |
| 5 | Sem interceptor global de 401 (sessão expirada) | ALTO | Corrigir antes do Go-Live |
| 6 | Sem UI para alterar status de Marca | MÉDIO | Postergar para V2.6 |
| 7 | Sem validação client-side de arquivo (Material) | MÉDIO | Postergar para V2.6 |
| 8 | Erro de upload não distingue 422/503/500 | MÉDIO | Postergar para V2.6 |
| 9 | 403/404 sem tratamento diferenciado | MÉDIO/BAIXO | Postergar para V2.6 |
| 10 | Sem busca/ordenação parametrizável | BAIXO | Postergar para V2.6 |
| 11 | 500/rede indistinguíveis | BAIXO | Postergar para V2.6 |

**Itens que exigem ação de código antes do Go-Live (independente do item 1):** #2, #3, #4, #5 — nenhum é de grande esforço, mas #3 e #4 são bugs funcionais reais (não apenas UX) e devem ser tratados com prioridade.

**Bloqueio real pendente de decisão humana:** item #1 (`GESTOR_MARCA`) — é uma regra de negócio inédita (a role deve existir e funcionar no Go-Live, ou deve ser removida da V2.5?), não uma escolha técnica desta auditoria.
