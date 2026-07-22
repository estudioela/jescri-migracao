# TEAR V2.5 — Backlog Executivo do MVP

Data: 2026-07-20
Papel do autor: Tech Lead de execução (agente), a pedido do responsável
do projeto.
Status: **backlog de planejamento. Nenhum código foi escrito, nenhuma
migration criada, nenhuma arquitetura alterada para produzir este
documento.**

**Escopo:** exclusivamente `tear-v2-app/` (Laravel 13 + React 19). Não
toca no Portal legado GAS (`src/`) nem em `CONTRATO_SOBERANO.md`/
`docs/_workspace/TASK_ROUTER.md` — trilhas de decisão separadas (mesmo
recorte de todos os documentos-fonte abaixo).

## 0. Fonte e método

Insumo único: `docs/ESPECIFICACAO_FUNCIONAL_MVP_COMPLETA.md` e os 15
documentos por ela consolidados (auditorias, especificação de produto,
diagnóstico de autenticação, auditoria de dados, auditoria de UX, planos
de sprint, análises de pagamento/snapshot). Cada história abaixo cita a
seção de origem — nenhuma regra nova foi inventada aqui; este documento
só quebra o que já foi decidido em entregas pequenas e homogêneas
(objetivo, prioridade, dependências, backend, frontend, API, migrations,
testes, critério de aceite).

Confirmado por leitura direta do código nesta sessão (`tear-v2-app/backend`,
sem alteração): `routes/api.php`, `database/migrations/` (19 arquivos),
`app/Http/Controllers/Api/*`, `tests/Feature/*` (21 arquivos) — usado só
para grounding técnico dos campos "Backend/API/Migrations/Testes" de cada
história, não como fonte de regra de negócio nova.

**Nota de atualização (achado desta sessão, não uma regra nova):**
`config/app.php:83` já lê `APP_LOCALE` com default `pt_BR`, e
`.env.example:7` já tem `APP_LOCALE=pt_BR`; `tests/Feature/LocaleTest.php`
já cobre mensagem de validação em português. O gap "`APP_LOCALE=en`"
registrado nos documentos-fonte (§2 da Especificação Funcional,
`HANDOFF`, `PLANO_IMPLEMENTACAO_TEAR_V2.5`) **já foi corrigido** em algum
commit posterior à redação desses documentos — não vira história neste
backlog.

### Legenda

- **P0** = necessário para a operação substituir o processo manual.
- **P1** = alto valor, não bloqueia uso atual como produto interno.
- **P2** = evolução futura.
- 🟠 = **bloqueado por decisão do responsável do projeto** — a história
  não deve ser iniciada tecnicamente antes da resposta (lista completa em
  `docs/ESPECIFICACAO_FUNCIONAL_MVP_COMPLETA.md` §9, reproduzida por item
  abaixo). Registrar isso não é "inventar a regra" — é o oposto.
- ✅ = já implementado; citado só como pré-condição de outra história,
  nunca como item de backlog.

### Linha de base — o que já está pronto (não é backlog)

Cadastro público, aprovação administrativa, Marcas, Campanhas,
Participações, Briefing 1:N por tipo, Materiais (upload + aprovação pelo
ADMIN), Pagamentos (`PENDENTE→APROVADO→PAGO` com gate P0-1), Medidas
versionadas, Consentimento LGPD + histórico de alteração, RBAC de leitura
por dono nas rotas `/me/*` e nas entidades-filhas (Campanha/Participação/
Briefing/Material/Pagamento escopadas por posse), login + `/definir-senha`
+ `PortalShell`/Dashboard/Perfil básicos. Fonte: `ESPECIFICACAO_FUNCIONAL_MVP_COMPLETA.md`
§1, confirmado por `tests/Feature/{RbacIsolamentoTest,PortalIsolamentoTest,
ResetPasswordTest,ConsentimentoHistoricoTest,MedidaInfluenciadoraTest,
CadastroAvancadoTest}.php` existentes no repositório.

---

## EPIC 1 — Portal da Influenciadora

**Por que primeiro:** é o item #1 do resumo executivo da especificação —
"a influenciadora ainda não opera o próprio Portal" é o que mais reduz o
valor do MVP hoje (`ESPECIFICACAO_FUNCIONAL_MVP_COMPLETA.md` §10). Backend
já autoriza por dono em todas as entidades envolvidas — o que falta é
telas + 2 rotas novas (envio de material pelo dono, listagem auto-escopada).
Fonte de UX: `AUDITORIA_UX_PORTAL_INFLUENCIADORA.md` (documento inteiro).

### HU-1.1 — Portal: listar participações ativas (Dashboard) ✅

**Implementada em 2026-07-20, com uma simplificação consciente.**
`GET /me/participacoes` (auto-escopado pela sessão) + `GET /me/participacoes/{id}`,
reaproveitando `ParticipacaoNaCampanhaPolicy::view` já existente. Lista
ordenada pelo prazo de briefing mais próximo; card mostra
campanha+marca, resumo de entregáveis **contratados** por tipo e badge
de status financeiro; card de perfil incompleto passa a aparecer só
quando necessário, antes da lista. Estados A (sem participação) e D
(erro) implementados; C fica implícito (card permanece visível sem
truncar nada extra).
**Simplificação:** o resumo mostra quantidade **contratada** por tipo,
não "pendente = contratado − enviado" como o desenho original do
backlog sugeria — calcular "enviado" por tipo exige a mesma taxonomia
`Material.tipo`×`Briefing.tipo` ainda não resolvida (EPIC 4, 🟠). Não é
um bloqueio: entrega valor real (campanhas ativas, prazos, entregáveis)
sem depender da decisão pendente; a contagem de pendência específica
fica para quando EPIC 4 for resolvida. 4 testes novos. Suíte 153/153
verde, pint limpo; frontend tsc/lint/build limpos. Card agora linka
para `/participacoes/:id` (HU-1.2, próxima história).

- **Objetivo:** revisar o Dashboard existente para responder "o que eu
  preciso fazer agora?" — lista de participações ativas como cards,
  ordenada por prazo de briefing mais próximo, com contagem de
  entregáveis pendentes por tipo e badge de status financeiro.
- **Prioridade:** P0.
- **Dependências:** nenhuma (dado já existe; é revisão de UX sobre
  `PortalDashboardPage` existente).
- **Backend:** novo endpoint agregador `GET /me/participacoes` (hoje não
  existe — só `GET /me/parceira`) que devolve participações `ATIVA` da
  parceira da sessão, com campanha/marca embutidas e contagem
  `(qtd contratada − qtd enviada)` por tipo.
- **Frontend:** `PortalDashboardPage` — reordenar card de "perfil
  incompleto" para depois da lista (só antes se `perfilEstaCompleto` for
  falso); implementar os 4 estados A/B/C/D descritos em
  `AUDITORIA_UX_PORTAL_INFLUENCIADORA.md` §4.
- **API:** `GET /me/participacoes` (nova, auto-escopada por sessão —
  nunca aceitar `parceira_id` do cliente, RFC-04).
- **Migrations:** nenhuma.
- **Testes:** feature test de isolamento (parceira A nunca vê participação
  de parceira B via este endpoint, mesmo padrão de `PortalIsolamentoTest.php`);
  teste de ordenação por prazo; teste dos 4 estados no frontend.
- **Critério de aceite:** login como influenciadora com participações
  ativas mostra os cards corretos, ordenados, sem exigir clique;
  influenciadora sem nenhuma participação vê a mensagem única do estado A.

### HU-1.2 — Portal: painel único de Participação (Campanhas) ✅

**Implementada em 2026-07-20, junto com HU-1.3 e HU-1.5** (mesma tela,
não fazia sentido separar em três entregas). `PortalParticipacaoPage.tsx`
em `/participacoes/:participacaoId` (dentro do `PortalShell`): cabeçalho
com campanha/marca/período/resumo de entregáveis contratados (tipos
zerados aparecem apagados, não somem) + seção de Briefing (HU-1.3) +
placeholder "em breve" para Materiais (HU-1.4, fora desta onda — bloqueada
por EPIC 4) + seção de Pagamento (HU-1.5). Sem backend novo — reaproveita
`GET /me/participacoes/{id}` (já criado na HU-1.1),
`GET /participacoes/{id}/briefings` e `GET /participacoes/{id}/pagamento`
(ambos já com escopo de posse via policy). Participação de outra
parceira ou inexistente → 403/404 da API → redireciona para o Dashboard
(sem mensagem que revele existência). Frontend tsc/lint/build limpos.

- **Objetivo:** tela `/campanhas/:participacaoId` com cabeçalho
  (campanha, marca, período, resumo de entregáveis contratados) e três
  seções verticais (Briefing, Materiais, Pagamento) — nunca abas, nunca
  telas separadas de "Campanha" vs. "Participação".
- **Prioridade:** P0.
- **Dependências:** HU-1.1 (a navegação parte do card do Dashboard).
- **Backend:** `GET /me/participacoes/{id}` auto-escopado (404 genérico,
  sem revelar existência, se a participação não pertence à sessão —
  `AUDITORIA_UX_PORTAL_INFLUENCIADORA.md` §6).
- **Frontend:** nova página `PortalParticipacaoPage`, layout de seções
  com âncora de rolagem (não abas).
- **API:** `GET /me/participacoes/{participacao}`.
- **Migrations:** nenhuma.
- **Testes:** 404 para participação de outra parceira ou inexistente;
  snapshot de cabeçalho com tipos de quantidade zero exibidos (apagados,
  não somem).
- **Critério de aceite:** acessar a URL de uma participação própria
  mostra os 3 blocos; acessar a de outra parceira retorna 404 genérico e
  redireciona ao Dashboard.

### HU-1.3 — Portal: leitura de Briefing por tipo de conteúdo ✅

**Implementada junto com HU-1.2** (ver nota lá). Bloco fixo
Feed→Reels→Stories→TikTok→UGC (só tipos com quantidade contratada > 0);
tipo sem briefing publicado mostra aviso apagado; tipo com briefing
mostra orientações, prazo + contagem relativa ("faltam N dias"/"hoje"/
"atrasado há N dias", lógica pura, sem dado novo) e entregáveis
esperados quando preenchido. Progresso "X de Y enviados" (cruza com
Materiais) **não implementado** — depende da mesma taxonomia
Material×Briefing ainda não resolvida (EPIC 4), mesma simplificação já
registrada na HU-1.1.

- **Objetivo:** dentro do painel da HU-1.2, um bloco por tipo contratado
  (ordem fixa Feed→Reels→Stories→TikTok→UGC), com orientação, prazo +
  contagem relativa ("faltam N dias"), entregáveis esperados e progresso
  de envio.
- **Prioridade:** P0.
- **Dependências:** HU-1.2.
- **Backend:** endpoint de leitura de briefing por dono já existe
  (`GET /participacoes/{participacao}/briefings`, sem middleware de
  role — verificar em `routes/api.php` que a leitura já é aberta a
  `auth:sanctum` com escopo de posse aplicado no controller/policy;
  se o escopo de posse ainda não estiver explícito nesse endpoint
  específico, é debito a fechar aqui, não presumir).
- **Frontend:** componente de bloco de briefing dentro de
  `PortalParticipacaoPage`, lógica pura de contagem relativa de prazo
  (sem dado novo).
- **API:** reaproveita `GET /participacoes/{participacao}/briefings`
  (validar escopo de posse).
- **Migrations:** nenhuma.
- **Testes:** contagem relativa de dias (dias úteis/corridos conforme já
  definido); bloco colapsado quando briefing do tipo ainda não existe.
- **Critério de aceite:** influenciadora vê briefing de cada tipo
  contratado assim que publicado pelo ADMIN, nunca antes.

### HU-1.4 — Portal: envio de material pela própria influenciadora ✅

**Implementada em 2026-07-20**, sobre a taxonomia unificada de HU-4.1.
Backend: `POST /participacoes/{participacao}/materiais` perdeu o
middleware `role:ADMIN` — autorização passa a ser
`$this->authorize('view', $participacao)` no controller, mesmo padrão de
`MedidaController::store` (dono via `ParticipacaoNaCampanhaPolicy::view`,
`Gate::before` cobre ADMIN). 2 testes novos/atualizados (dono envia com
sucesso; usuário sem posse nem ADMIN recebe 403). Suíte 155/155 verde,
pint limpo. Frontend: `PortalParticipacaoPage.tsx` — cada bloco de
Briefing ganhou lista de materiais já enviados (com badge de status e
`motivo_reprovacao` sempre visível quando reprovado) + input de arquivo
`multiple` (loop de `uploadMaterial` por arquivo — decisão técnica já
prevista, sem endpoint de array no backend), visível só quando
`enviados < contratado`. tsc/lint/build limpos.

**Simplificação sobre o desenho original:** a seção "Materiais" deixou
de ser uma seção separada com CTA de rolagem ancorada (como o desenho
original da `AUDITORIA_UX_PORTAL_INFLUENCIADORA.md` §6 sugeria) —
ficou embutida diretamente em cada bloco de Briefing, mesmo lugar onde a
influenciadora já lê a orientação e o prazo daquele tipo. Menos
navegação, mesma informação, sem construir mecânica de scroll-anchor
entre seções para o mesmo resultado.

- **Objetivo:** reabrir a rota de envio de material para o dono da
  participação (hoje `role:ADMIN`-only), com formulário sem campo de
  "tipo" (implícito pelo bloco), múltiplos arquivos por envio, e lista de
  tentativas anteriores (reprovadas) sempre visível.
- **Prioridade:** P0 (RFC-07, `ESPECIFICACAO_FUNCIONAL_MVP_COMPLETA.md`
  §5).
- **Dependências:** HU-1.3; **bloqueada tecnicamente por EPIC 4**
  (taxonomia `Material.tipo` × `Briefing.tipo`) — ver nota de escopo
  abaixo.
- **Backend:** `POST /participacoes/{participacao}/materiais` — trocar
  `middleware('role:ADMIN')` por autorização de posse (dono da
  participação OU `role:ADMIN`, mesmo padrão já usado em
  `MedidaController`); aceitar múltiplos arquivos por requisição (decisão
  técnica de execução, não de produto — `AUDITORIA_UX_PORTAL...` §10).
- **Frontend:** formulário de envio dentro de cada bloco de tipo (HU-1.3),
  estado "enviando…", lista de tentativas com badge e
  `motivo_reprovacao` sempre visível.
- **API:** `POST /participacoes/{participacao}/materiais` (policy
  alterada, contrato de request possivelmente com `files[]`).
- **Migrations:** nenhuma, **a menos que** EPIC 4 exija (ver nota).
- **Testes:** dono envia com sucesso; não-dono autenticado recebe 403;
  botão de envio só habilitado quando `enviado < contratado` e briefing
  publicado.
- **Critério de aceite:** influenciadora autenticada envia material do
  próprio painel; equipe vê e aprova/reprova normalmente, sem mudança no
  fluxo administrativo existente.
- **Nota de escopo (⚠️ não decidida por este backlog):** a
  `AUDITORIA_UX_PORTAL_INFLUENCIADORA.md` §8 registra que esta história
  **não pode ser implementada fielmente** até a EPIC 4 (taxonomia
  `Material.tipo`/`Briefing.tipo`) ser resolvida pelo responsável do
  projeto. Recomendação de sequenciamento: EPIC 4 primeiro, HU-1.4 depois
  — ver `docs/PLANO_EXECUCAO_MVP.md`.

### HU-1.5 — Portal: consulta de Pagamento ✅

**Implementada junto com HU-1.2** (ver nota lá). Última seção do painel:
valor formatado, badge de status (reaproveita `pagamentoStatusTone` já
existente), sem nenhuma ação — mesmo padrão de leitura das demais
seções. Distinção visual `aprovado`×`pago` (débito já registrado na
auditoria de UX) **não resolvida** aqui — os dois seguem com o mesmo
tom verde, fora do escopo mínimo desta história.

- **Objetivo:** última seção do painel — valor, badge de status
  (`pendente`/`aprovado`/`pago`, com distinção visual entre `aprovado` e
  `pago` só nesta tela), sem nenhuma ação.
- **Prioridade:** P0.
- **Dependências:** HU-1.2.
- **Backend:** dado já disponível em `GET /me/participacoes` (HU-1.1) ou
  `GET /participacoes/{participacao}/pagamento` com escopo de posse.
- **Frontend:** seção de leitura, sem formulário.
- **API:** reaproveita rota existente, validando escopo de posse.
- **Migrations:** nenhuma.
- **Testes:** dono vê o próprio pagamento; não-dono recebe 403/404.
- **Critério de aceite:** badge de pagamento reflete o estado real, com
  tom visualmente distinto entre aprovado e pago.

### HU-1.6 — Portal: revisão de UX do Perfil ✅

**Implementada em 2026-07-20.** `PortalPerfilPage`: grupo "Dados pessoais"
renomeado para "Contato e recebimento", com `chave_pix` movida para o
topo do grupo (era o último campo) e texto auxiliar "confira com
atenção — é para aqui que o pagamento vai." logo abaixo; ordem final =
Contato/PIX → Endereço (inalterado) → Medidas (form separado,
inalterado). Mensagens de sucesso (perfil e medidas) agora somem
sozinhas após 4s ou na próxima edição de qualquer campo do respectivo
form, via `useEffect`+`setTimeout`. Sem mudança de validação, LGPD ou
endpoints. tsc/lint/build limpos (lint só com o warning pré-existente
de `src/lib/auth.tsx:72`).

- **Objetivo:** reordenar o formulário existente — grupo "Contato e
  recebimento" primeiro (com `chave_pix` no topo e texto auxiliar de
  atenção), Endereço em segundo, Medidas em terceiro; timeout de ~4s na
  mensagem de sucesso.
- **Prioridade:** P1 (é revisão de UX sobre tela já funcional, não
  bloqueia operação).
- **Dependências:** nenhuma.
- **Backend:** nenhuma mudança.
- **Frontend:** `PortalPerfilPage` — reordenação de campos/grupos, texto
  auxiliar, timeout de mensagem.
- **API:** nenhuma mudança.
- **Migrations:** nenhuma.
- **Testes:** teste de frontend (ordem de renderização dos grupos).
- **Critério de aceite:** ordem visual = Contato/PIX → Endereço →
  Medidas; mensagem de sucesso some após ~4s ou na próxima edição.

**Risco transversal do EPIC 1:** abrir escrita concorrente para múltiplas
influenciadoras (HU-1.4) reintroduz o risco de concorrência em SQLite já
sinalizado em `ESPECIFICACAO_FUNCIONAL_MVP_COMPLETA.md` §6 — migrar para
Postgres é pré-requisito de infraestrutura antes de HU-1.4 ir a produção
com usuárias reais, não depois de aparecer em produção.

---

## EPIC 2 — Regras Críticas de Negócio Pendentes (P0-2 a P0-5)

Fonte: `CONSOLIDACAO_REGRAS_CRITICAS_P0_TEAR_V2.md` (P0-1 já implementado,
fora deste backlog), `PLANO_IMPLEMENTACAO_SNAPSHOT_MENSAL.md`,
`ANALISE_MODELO_PAGAMENTO_RECORRENTE_TEAR_V2.md`.

### HU-2.1 — P0-5: cálculo automático da data de aprovação do briefing ✅

**Implementada em 2026-07-20.** Migration `data_aprovacao_interna`
(date, nullable, sempre fora do fillable); `Briefing::calcularDataAprovacaoInterna()`
+ hook `saving` recalcula a cada `prazo` novo/alterado; exposta em
`BriefingResource`; `BriefingFormPage.tsx` mostra o valor calculado como
texto somente-leitura ao editar. 6 testes novos (dia útil, sexta/sábado/
domingo, recálculo na edição, payload com o campo ignorado). Suíte
135/135 verde, pint limpo; frontend tsc/lint/build limpos.

- **Objetivo:** ao definir/editar a data de postagem de um `Briefing`,
  calcular `data_aprovacao_interna` = postagem − 7 dias, com ajuste de
  fim de semana (sexta/sábado/domingo → segunda seguinte); campo sempre
  derivado, nunca editável.
- **Prioridade:** P0.
- **Dependências:** nenhuma (lógica isolada).
- **Backend:** `Briefing` model — método de cálculo; `BriefingController`
  (`store`/`update`) — recalcular sempre que a data de postagem mudar.
- **Frontend:** `BriefingFormPage` — exibir campo calculado como
  somente-leitura.
- **API:** `POST/PATCH .../briefings` — resposta passa a incluir
  `data_aprovacao_interna`.
- **Migrations:** nova coluna `data_aprovacao_interna` (date, calculada)
  em `briefings`.
- **Testes:** postagem em dia útil → −7 dias corridos; postagem em
  sexta/sábado/domingo → ajusta para a segunda seguinte; edição da data
  de postagem recalcula.
- **Critério de aceite:** critério já definido em
  `CONSOLIDACAO_REGRAS_CRITICAS_P0_TEAR_V2.md` P0-5 — replicado aqui sem
  alteração.
- 🟠 **Pendência que não bloqueia esta história:** mapeamento `FEED` ↔
  `carrossel_qtd` (decisão 4 da lista consolidada) é de outra história
  (quantidade contratada, não data de aprovação) — não impede iniciar
  HU-2.1.

### HU-2.2 — P0-2: campos contratuais em Parceira ✅

**Implementada em 2026-07-20.** `razao_social`/`canais_uso_imagem`/
`prazo_uso_imagem` nullable (todos texto livre — `canais_uso_imagem`
como lista fechada segue 🟠 pendente, ver decisão 1 do §5). Aceitos e
persistidos no cadastro admin (`ParceiraFormPage`, seção "Dados
contratuais") e via API; cadastro público e Perfil do Portal preservam
os valores sem expor edição (evita apagar dado contratual gerido pela
equipe). 2 testes novos. Suíte 137/137 verde, pint limpo; frontend
tsc/lint/build limpos.

- **Objetivo:** adicionar `razao_social`, `canais_uso_imagem`,
  `prazo_uso_imagem` a `parceiras`, nullable, sem quebrar cadastros
  existentes — pré-requisito de dado para o futuro módulo de Contratos
  (EPIC 9), não o módulo em si.
- **Prioridade:** P0.
- **Dependências:** nenhuma (schema aditivo puro).
- **Backend:** `Parceira` model (`$fillable`); `StoreParceiraRequest`/
  `UpdateParceiraRequest` — campos novos opcionais.
- **Frontend:** formulário de cadastro/edição administrativa — 3 campos
  novos, não obrigatórios nesta fase.
- **API:** `POST/PATCH /parceiras` — aceita e persiste os 3 campos.
- **Migrations:** `add_dados_contratuais_to_parceiras_table` (3 colunas
  nullable).
- **Testes:** cadastro aceita os campos; cadastro sem eles continua
  funcionando (regressão zero).
- **Critério de aceite:** idêntico ao definido em
  `CONSOLIDACAO_REGRAS_CRITICAS_P0_TEAR_V2.md` P0-2.
- 🟠 **Pendência que não bloqueia esta história:** `canais_uso_imagem`
  como lista fechada vs. texto livre (decisão 1 da lista consolidada,
  ver §5 deste documento) — implementar como texto livre nesta história e
  migrar para enum depois, se aprovado, é a opção de menor retrabalho
  (mudança de `string` para `enum`/tabela de apoio é aditiva).

### HU-2.3 — P0-4: módulo de Logística mínimo viável (Envio) ✅

**Implementada em 2026-07-20.** `Envio` 1:1 com `ParticipacaoNaCampanha`
(mesmo padrão de `Pagamento`), status `PENDENTE→EXPEDIDO→ENTREGUE`
(+`CANCELADO`), `codigo_rastreio` livre opcional. Endereço nunca
persistido na tabela — `EnvioResource` lê `endereco_completo` ao vivo de
`participacao.parceira`. Rotas espelham Pagamento
(`GET/POST /participacoes/{id}/envio`, `PATCH /envios/{id}`, escrita
`role:ADMIN`). Frontend: `EnvioPage.tsx` (mesmo layout de `PagamentoPage`),
link "envio" na tabela de participações de `CampanhaDetailPage`. 7 testes
novos, incluindo confirmação de que a tabela `envios` não tem coluna de
endereço. Suíte 144/144 verde, pint limpo; frontend tsc/lint/build
limpos.

- **Objetivo:** nova entidade `Envio` por `ParticipacaoNaCampanha`, status
  `Pendente → Expedido → Entregue` (+`Cancelado`), endereço lido ao vivo
  do cadastro (nunca duplicado na tabela), código de rastreio texto
  livre.
- **Prioridade:** P0 (nomenclatura técnica P0-4; valor de produto listado
  como P1 na especificação — ambos os documentos-fonte concordam que a
  regra em si não tem decisão de PO pendente, então tecnicamente pode
  começar a qualquer momento; ver `docs/PLANO_EXECUCAO_MVP.md` para a
  posição real na sequência).
- **Dependências:** nenhuma decisão de PO pendente; tecnicamente
  independente, mas beneficia-se do Portal (EPIC 1) existir para exibir
  status de envio à influenciadora no futuro (fora deste MVP).
- **Backend:** novo `Envio` (model), `EnvioController`, `EnvioPolicy`
  (dono da participação lê, ADMIN escreve); leitura de endereço via
  relação com `Parceira` no momento da consulta (`with('parceira')`),
  nunca coluna própria de endereço.
- **Frontend:** tela administrativa de gestão de envio (status, rastreio)
  dentro do fluxo de `CampanhaDetailPage`/participação.
- **API:** `GET/POST /participacoes/{participacao}/envio`,
  `PATCH /envios/{envio}` (mudança de status).
- **Migrations:** nova tabela `envios` (`participacao_id` FK,
  `status`, `codigo_rastreio` nullable, timestamps de transição) — **sem**
  colunas de endereço/PIX (INV-04, proteção de PII).
- **Testes:** criar envio, avançar status até `Entregue`; consultar
  endereço de destino sem que fique persistido na tabela de envio.
- **Critério de aceite:** idêntico ao definido em
  `CONSOLIDACAO_REGRAS_CRITICAS_P0_TEAR_V2.md` P0-4.

### HU-2.4 — P0-3 (parte 1): congelamento de Participação ✅

**Implementada em 2026-07-20, com escopo reduzido conscientemente** (ver
nota abaixo). `congelado_em` (nullable) em `participacoes_na_campanha`;
ação dedicada `PATCH /participacoes/{id}/congelar` (`role:ADMIN`, mesmo
padrão de `Parceira::aprovar()` — nada congela automaticamente na
criação, evita regressão no fluxo atual de ajuste logo após vincular a
parceira). Depois de congelada, `PATCH /participacoes/{id}` recusa
(409) edição de `valor_contratado`/`reels_qtd`/`carrossel_qtd`/
`stories_qtd`; `status` (cancelamento) continua editável. Frontend:
botão "congelar" + indicador "congelada" na tabela de
`CampanhaDetailPage`. 5 testes novos. Suíte 149/149 verde, pint limpo;
frontend tsc/lint/build limpos.

**Simplificação sobre o desenho original do backlog:** a tabela de
auditoria `historico_alteracoes_participacao` **não foi criada** nesta
entrega — como a decisão do PO (bloquear vs. permitir-com-auditoria)
resolveu-se por "bloquear" (opção mais segura e reversível, adotada na
ausência de resposta), não há edição pós-congelamento para auditar; a
tabela só passa a ser necessária se o PO decidir trocar para
"permitir com auditoria" no futuro — nesse caso é um acréscimo pequeno
sobre o que já existe, não retrabalho.

- **Objetivo:** implementar **só** o congelamento — coluna
  `congelado_em` (timestamp nullable) em `participacoes_na_campanha`,
  setada na confirmação/ativação; edição de `valor_contratado`/
  quantidades após `congelado_em` bloqueada ou auditável.
- **Prioridade:** P0.
- **Dependências:** nenhuma — é aditivo puro e **não** depende da
  resposta do PO sobre recorrência (`CHECKPOINT_POS_ANALISE_PAGAMENTO_SNAPSHOT.md`,
  "Próxima tarefa recomendada", item 1: "seguir com (a) agora").
- **Backend:** `ParticipacaoNaCampanha` model (guarda de edição pós-
  congelamento); `ParticipacaoController::update`; nova tabela de
  auditoria — recomendação registrada em
  `PLANO_IMPLEMENTACAO_SNAPSHOT_MENSAL.md` §2: tabela irmã
  `historico_alteracoes_participacao` (mesmo formato de
  `historico_alteracoes`), **não** generalizar `historico_alteracoes`
  para polimórfica nesta história (mudança maior, atravessa `Parceira`,
  avaliar à parte).
- **Frontend:** `ParticipacaoForm`/`CampanhaDetailPage` — campos
  comerciais somem do formulário de edição (ou viram somente-leitura)
  quando `congelado_em` estiver preenchido.
- **API:** `PATCH /participacoes/{participacao}` — bloqueia ou audita
  edição de `valor_contratado`/quantidades pós-congelamento (comportamento
  exato depende da decisão "bloquear vs. auditar", que É uma decisão de
  PO — ver nota abaixo).
- **Migrations:** `add_congelado_em_to_participacoes_na_campanha_table`;
  `create_historico_alteracoes_participacao_table`.
- **Testes:** editar valor antes de congelar funciona normalmente; editar
  depois de congelar é bloqueado ou gera registro auditável (conforme
  decisão); `congelado_em` setado no momento certo do fluxo de
  confirmação/ativação.
- **Critério de aceite:** idêntico ao definido em
  `CONSOLIDACAO_REGRAS_CRITICAS_P0_TEAR_V2.md` P0-3, item 1.
- 🟠 **Decisão do PO necessária antes de fechar esta história (não antes
  de iniciá-la):** bloquear edição pós-congelamento ou permitir com
  trilha auditável (decisão 2 da lista consolidada, §5). Recomendação
  técnica de menor retrabalho: implementar a tabela de auditoria de
  qualquer forma (é necessária nos dois cenários); a única variável é se
  o `PATCH` recusa (422) ou aceita-e-audita — troca de poucas linhas no
  controller, não de schema.

### HU-2.5 — P0-3 (parte 2): decisão de compilação em lote

- **Objetivo:** não é uma história de código — é o registro explícito de
  que a "compilação mensal em lote" (modelo do legado: vincular todas as
  Parceiras `Ativa` de uma vez) **não deve ser assumida nem implementada**
  até o responsável do projeto responder se o modelo atual (vínculo
  individual por campanha) já é a decisão definitiva de produto.
- **Prioridade:** N/A — item de decisão, não de entrega.
- **Dependências:** bloqueia só a si mesma; não bloqueia HU-2.4 nem
  nenhuma outra história deste backlog.
- 🟠 **Decisão do PO (decisão 3 da lista consolidada, §5):** manter ritmo
  de compilação em lote (modelo legado) ou vínculo individual por
  campanha (modelo atual já implementado)? A resposta também resolve, por
  consequência, a pergunta de pagamento recorrente
  (`ANALISE_MODELO_PAGAMENTO_RECORRENTE_TEAR_V2.md` — ver nota em EPIC 5).
- **Ação recomendada:** nenhuma migration ou código a partir desta
  história até a decisão chegar — mesma recomendação já registrada em
  `PLANO_IMPLEMENTACAO_SNAPSHOT_MENSAL.md` §6.

---

## EPIC 3 — Cadastro: Gaps e Conformidade

Fonte: `ESPECIFICACAO_FUNCIONAL_MVP_COMPLETA.md` §3.1,
`AUDITORIA_MODELO_DADOS_TEAR_V2.md` §2.1.

### HU-3.1 — Fechar `authorize()` em `POST /parceiras` (cadastro administrativo) ✅

**Implementada em 2026-07-20** (Onda 1). `ParceiraPolicy::create()` adicionada
(retorna `false`; `Gate::before` já concede a `ADMIN`, mesmo padrão de
`MarcaPolicy`); `ParceiraController::store` ganhou
`$this->authorize('create', Parceira::class)`. `CadastroPublicoController::store`
(rota pública `/parceiras/cadastro`, sem autenticação) não foi tocado —
usa o mesmo `StoreParceiraRequest`, mas é um controller e uma rota
diferentes, fora desta policy. 4 testes de `ParceiraTest.php` e 3 de
`CadastroAvancadoTest.php` que assumiam usuário autenticado sem papel
ADMIN foram migrados para `autenticarComoAdmin()`; 1 teste novo prova o
403 (`test_usuario_sem_role_admin_nao_pode_criar_parceira`). Suíte
122/122 verde (121 pré-existentes + 1 novo); `pint --test` limpo.

- **Objetivo:** hoje qualquer usuário autenticado cria uma Parceira nova
  pela rota administrativa (distinta do cadastro público) — falta
  `authorize()`/policy. É gap de segurança real, não melhoria.
- **Prioridade:** P0 (RBAC é bloqueador de segurança, não UX —
  `ROADMAP_MESTRE_TEAR_V2.md` princípio 6/regra já estabelecida).
- **Dependências:** nenhuma.
- **Backend:** `ParceiraPolicy` — adicionar `create()` (`role:ADMIN`, ou
  o papel que a operação confirmar); `ParceiraController::store` —
  `$this->authorize('create', Parceira::class)`.
- **Frontend:** nenhuma mudança (tela administrativa já assume ADMIN).
- **API:** `POST /parceiras` — passa a exigir a policy.
- **Migrations:** nenhuma.
- **Testes:** usuário sem papel adequado recebe 403; ADMIN continua
  criando normalmente (regressão zero).
- **Critério de aceite:** rota fechada, sem quebrar o fluxo administrativo
  existente.

### HU-3.2 — Validação de formato do campo Instagram

- **Objetivo:** hoje é texto livre — definir e aplicar uma regra mínima
  (ex.: aceitar com/sem `@`, normalizar armazenamento).
- **Prioridade:** P1.
- **Dependências:** nenhuma.
- **Backend:** `StoreParceiraRequest`/`UpdateParceiraRequest` — regra de
  validação nova; normalização antes de persistir.
- **Frontend:** máscara/validação inline no formulário de cadastro.
- **API:** `POST/PATCH /parceiras`, `POST /parceiras/cadastro`.
- **Migrations:** nenhuma.
- **Testes:** formatos aceitos/rejeitados, normalização com e sem `@`.
- **Critério de aceite:** campo `instagram` sempre armazenado em formato
  único, entradas inválidas retornam 422 com mensagem em português.

### HU-3.3 — Deduplicação/normalização de identidade (nome)

- **Objetivo:** hoje só `unique()` de banco sobre `nome`, sem
  normalização — duas influenciadoras com grafia levemente diferente do
  mesmo nome não são detectadas (gap já registrado como recomendação P1
  da auditoria de regras legadas).
- **Prioridade:** P1.
- **Dependências:** nenhuma.
- **Backend:** função de normalização (trim, colapso de espaço,
  case-insensitive) aplicada antes da checagem de unicidade —
  precedente conceitual: `ChaveInfluenciadora` do sistema legado (não
  reaproveitar código, só o conceito, sistemas são independentes).
- **Frontend:** mensagem de alerta no cadastro/edição se nome normalizado
  colidir com registro existente.
- **API:** `POST/PATCH /parceiras`, `POST /parceiras/cadastro`.
- **Migrations:** nenhuma (ou índice funcional sobre nome normalizado, a
  avaliar na execução).
- **Testes:** "Maria Silva" vs. "maria  silva" (espaço duplo, case)
  detectado como colisão.
- **Critério de aceite:** cadastro com nome normalizado-equivalente a um
  já existente é bloqueado ou sinalizado (definir qual na execução — não
  é decisão de produto, é UX de erro).

### HU-3.4 — Campo "observações" em medidas

- **Objetivo:** confirmar ausência e adicionar coluna livre nullable à
  tabela de medidas, se de fato não existir.
- **Prioridade:** P2 (extensão simples, sem urgência).
- **Dependências:** nenhuma.
- **Backend:** `MedidaInfluenciadora` model/migration; `MedidaController`.
- **Frontend:** campo de texto livre no formulário de medidas do Portal
  e/ou admin.
- **API:** `POST /parceiras/{parceira}/medidas`.
- **Migrations:** `add_observacoes_to_medidas_influenciadora_table`.
- **Testes:** salvar medida com e sem observação.
- **Critério de aceite:** campo opcional persistido e exibido.

### HU-3.5 — CPF como alternativa a CNPJ 🟠

- **Objetivo:** aceitar CPF como alternativa a CNPJ no cadastro.
- **Prioridade:** bloqueada — decisão 4 da lista de pendências (§5).
- **Nota:** `AUDITORIA_MODELO_DADOS_TEAR_V2.md` §4 registra que esta
  questão **já foi respondida** para o schema atual — "TEAR é B2B, não há
  cadastro de consumidor final", decisão explícita do responsável do
  projeto no Relatório Sprint 1. A `ESPECIFICACAO_FUNCIONAL_MVP_COMPLETA.md`
  ainda lista como pendente (§9, item 4) por reproduzir a lista original
  sem reabrir. **Recomendação deste backlog:** tratar como já resolvido
  (não fazer) — se o responsável do projeto quiser reabrir, é uma decisão
  nova, não a mesma pendência antiga.

### HU-3.6 — Onboarding público: Landing Page + reprovação de solicitação de cadastro ✅

**Implementada em 2026-07-20** (Onda 1). Backend: migration
`add_reprovacao_to_parceiras_table` (`reprovado_por`/`reprovado_em`/
`motivo_reprovacao`, nullable, mesmo padrão de `aprovado_por`/
`aprovado_em`); `Parceira::reprovar()` (único ponto de escrita, mesmo
padrão de `aprovar()`); `ParceiraController::reprovar` +
`PATCH /api/parceiras/{parceira}/reprovar` (`role:ADMIN`) — 409 se já
`Ativa` ou já reprovada, `motivo` opcional (máx. 1000 chars); campos
expostos em `ParceiraResource`. Frontend: `LandingPage.tsx` (nova, usa
`AuthSplitLayout` existente) com CTA "quero ser parceira" →
`/cadastro` e link "entrar" → `/login`; `App.tsx` — `/` passa a ser
pública (Landing) quando deslogado, `Login` movido para `/login`,
wildcard redireciona para `/`; `ParceiraProfilePage.tsx` — botão
"reprovar" (visível só quando `Inativa` e ainda não reprovada) com
formulário inline de motivo opcional, e aviso de reprovação
(data + motivo) quando presente. 7 testes novos
(`ParceiraReprovacaoTest.php`): reprovação com/sem motivo, 403 sem
papel ADMIN, 401 sem sessão, 409 em `Ativa` e em reprovação duplicada,
e confirmação de que `aprovar()` continua funcionando sobre uma
Parceira previamente reprovada (histórico preservado, não removido).
Suíte backend 129/129 verde (122 pré-existentes + 7 novos); `pint --test`
limpo. Frontend: `tsc -b`, `oxlint` (só o warning pré-existente e não
relacionado de `auth.tsx:72`) e `vite build` limpos — **não há suíte de
testes automatizados de frontend neste projeto** (confirmado: nenhum
`vitest`/framework de teste configurado em `package.json` nem arquivo
`*.test.*`/`*.spec.*` em `src/`); a validação de frontend segue o único
padrão já estabelecido no repositório (typecheck + lint + build), não
uma lacuna introduzida por esta história.

**Nova história, adicionada em 2026-07-20 a pedido explícito do
responsável do projeto, classificada P0.** Não vem de nenhum dos 16
documentos-fonte originais — é requisito novo. Auditado contra o código
atual antes de ser escrita (sem alteração nenhuma nesta sessão) para não
duplicar o que já existe.

- **Objetivo:** cobrir o fluxo completo Visitante → Landing Page → CTA
  "Quero ser Parceira" → Cadastro público → status pendente → Admin
  aprova/reprova → se aprovada, `status=Ativa` e acesso ao Portal
  liberado.
- **Prioridade:** P0.
- **Dependências:** nenhuma — schema/rota aditivos, sem decisão de PO
  pendente.

**Já implementado hoje (pré-condição, não é trabalho novo desta
história — confirmado por leitura direta do código nesta sessão):**
- Cadastro público sem login: `POST /parceiras/cadastro`
  (`CadastroPublicoController`), grava `status='Inativa'` por padrão.
  Equivalente semântico ao "PENDENTE" do enunciado — ver nota de
  nomenclatura abaixo.
- Rota `/cadastro` no frontend (`PublicCadastroPage.tsx`).
- Admin lista solicitações pendentes: `GET /api/parceiras?status=Inativa`,
  com aba de filtro já implementada em `ParceirasListPage.tsx`.
- Aprovação: `PATCH /api/parceiras/{parceira}/aprovar` (`role:ADMIN`) →
  `Parceira::aprovar()` (único ponto de escrita de status) → cria `User`,
  atribui papel `INFLUENCIADORA`, dispara
  `InfluenciadoraConviteNotification` com link para `/definir-senha`.
  Nenhuma credencial existe antes da aprovação — acesso ao Portal já é
  condicionado à aprovação.
- Participação em campanha é entidade própria
  (`POST /campanhas/{campanha}/participacoes`), criada individualmente
  pelo admin, independente do status da Parceira — nenhuma campanha é
  atribuída automaticamente, já é o modelo atual.
- Portal exibirá só participações ativas da própria influenciadora — é a
  HU-1.1 (Onda 1, mesmo plano de execução).

**O que falta (escopo real desta história):**
1. **CTA "Quero ser Parceira" numa Landing Page** — hoje não existe
   nenhuma página inicial pública além do formulário direto em
   `/cadastro` (confirmado em `frontend/src/App.tsx`: a raiz `/` só
   existe dentro das árvores autenticadas de `PortalShell`/`AppShell`).
2. **Ação de reprovar** — não existe hoje. Só `Parceira::aprovar()`
   existe; não há transição, endpoint, tela nem registro de reprovação.
3. **Nota de nomenclatura, não decisão de arquitetura:** o enunciado usa
   três estados nomeados (`PENDENTE`/`ATIVA`, e implicitamente
   "reprovada"); o schema atual usa dois (`enum('status', ['Ativa',
   'Inativa'])`), onde `Inativa` cobre hoje tanto "recém-cadastrada,
   aguardando decisão" quanto uma futura "reprovada" — indistinguíveis.
   **Abordagem recomendada (menor retrabalho, mesmo precedente já usado
   para aprovação):** manter o enum binário e adicionar
   `reprovado_por`/`reprovado_em`/`motivo_reprovacao` (nullable), mesmo
   padrão de `aprovado_por`/`aprovado_em`
   (`2026_07_20_030000_add_aprovacao_to_parceiras_table.php`) — Parceira
   reprovada permanece `Inativa`, mas fica marcada e distinguível de
   "ainda pendente" pela presença desses campos. Alternativa mais
   invasiva (estado `Pendente` dedicado no enum) tocaria toda checagem de
   `status` já existente no sistema — não recomendada sem dor concreta
   que a justifique; sinalizada aqui, não decidida unilateralmente.
- **Backend:** `Parceira` model — método `reprovar(User $admin, ?string
  $motivo)` (mesmo padrão de `aprovar()`, único ponto de escrita dos
  campos de reprovação); nova rota
  `PATCH /api/parceiras/{parceira}/reprovar` (`role:ADMIN`).
- **Frontend:** nova página pública de Landing (rota a definir na
  execução sem redesenhar a navegação existente — hoje `/` só existe
  dentro das árvores autenticadas) com CTA linkando para `/cadastro`;
  botão "reprovar" (com campo de motivo opcional) na tela administrativa
  de solicitações pendentes (`ParceirasListPage`/`ParceiraProfilePage`).
- **API:** `PATCH /api/parceiras/{parceira}/reprovar` (nova).
- **Migrations:** `add_reprovacao_to_parceiras_table` — `reprovado_por`
  (FK nullable), `reprovado_em` (timestamp nullable), `motivo_reprovacao`
  (string/text nullable).
- **Testes:** ADMIN reprova solicitação pendente (grava campos de
  reprovação, `status` permanece `Inativa`); reprovar uma Parceira já
  aprovada é rejeitado (proteção de estado); usuário sem papel ADMIN
  recebe 403; Landing Page renderiza o CTA e navega para `/cadastro`
  (teste de frontend).
- **Critério de aceite:** idêntico ao definido pelo responsável do
  projeto — Landing Page com CTA (novo); cadastro público funcionando
  (já cumprido); status inicial pendente (já cumprido, nomenclatura
  `Inativa`); fluxo administrativo de aprovação (já cumprido) e
  reprovação (novo); acesso ao Portal só após aprovação (já cumprido);
  nenhuma campanha atribuída automaticamente (já cumprido); Portal exibe
  só participações ativas (HU-1.1, mesma Onda 1).

---

## EPIC 4 — Taxonomia Material × Briefing ✅

Fonte: `AUDITORIA_UX_PORTAL_INFLUENCIADORA.md` §8, §10;
`ESPECIFICACAO_FUNCIONAL_MVP_COMPLETA.md` §3.4/§3.9.

### HU-4.1 — Unificar `Material.tipo` com `Briefing.tipo` + vínculo estrutural ✅

**Decisão tomada e aprovada em 2026-07-20:** Opção B, formalizada em
`docs/DECISAO_TAXONOMIA_MATERIAL_BRIEFING.md` — `Material` ganha
`briefing_id` obrigatório; `tipo` deixa de ser digitado, passa a ser
sempre derivado do `Briefing` vinculado (hook `saving`, mesmo padrão de
`Briefing::calcularDataAprovacaoInterna`, HU-2.1). `FOTOS`/`OUTROS`
saíram do domínio válido (sem uso real confirmado antes da migration).

- **Objetivo original:** hoje `Briefing.tipo` = `FEED/REELS/STORIES/TIKTOK/UGC`
  e `Material.tipo` = `REELS/STORIES/FOTOS/OUTROS` — nem os nomes nem a
  cardinalidade combinam, e `Material` não tinha `briefing_id`.
- **Prioridade:** P0 — bloqueava HU-1.4 (envio de material pelo Portal).
- **Backend implementado em 2026-07-20:** migration
  `add_briefing_id_to_materiais_table` (`briefing_id` FK obrigatória,
  `restrictOnDelete`; enum de `tipo` restrito aos 5 valores de
  `Briefing`); `Material::booted()` deriva `tipo` do `briefing_id` a cada
  save; `StoreMaterialRequest` troca `tipo` por `briefing_id` (validado
  contra a mesma `participacao_id` da rota); `MaterialController::store`
  resolve o `tipo` do briefing para nomear a pasta do Drive;
  `MaterialResource` expõe `briefing_id`; `MaterialFactory` cria
  Participação+Briefing consistentes. 3 testes atualizados + 1 novo
  (briefing de outra participação é rejeitado). Suíte 154/154 verde,
  pint limpo.
- **Frontend implementado em 2026-07-20** (por subagente, em paralelo ao
  backend, contra o mesmo contrato combinado): `MateriaisPage.tsx` e
  `lib/materiais.ts` — formulário de envio troca o antigo select de
  "Tipo" por um select de "Briefing" (via `listBriefings`), enviando
  `briefing_id`; participação sem briefing publicado mostra mensagem
  orientando a publicar um antes, sem quebrar a tela. tsc/lint/build
  limpos.
- **Frontend implementado em 2026-07-20:** `MateriaisPage.tsx` e
  `lib/materiais.ts` ajustados ao contrato aprovado em
  `docs/DECISAO_TAXONOMIA_MATERIAL_BRIEFING.md` — `Material.tipo` agora é
  o union de 5 valores (espelhando `Briefing.tipo`, só leitura); formulário
  de envio troca o antigo select de "Tipo" por um select de "Briefing"
  (via `listBriefings`), enviando `briefing_id` no upload em vez de
  `tipo`; se a participação não tem briefing publicado, mostra mensagem
  orientando a publicar um briefing antes, sem quebrar a tela. Backend
  correspondente implementado em paralelo por outro agente. Trabalho
  técnico entregue (typecheck/lint/build verdes); decisão de negócio e
  critério de aceite formal seguem registrados acima como já estavam.

---

## EPIC 5 — Pagamentos: Extensões

Fonte: `ESPECIFICACAO_FUNCIONAL_MVP_COMPLETA.md` §3.10, §5 (RFC-12).

### HU-5.1 — Comprovante de pagamento (upload)

- **Objetivo:** gap total — nenhum documento-fonte original mencionava
  comprovante. Proposta mínima: anexo (mesma abstração `Storage` já
  usada por Materiais) associado ao evento `PAGO`.
- **Prioridade:** P1.
- **Dependências:** nenhuma.
- **Backend:** `Pagamento` model (`comprovante_path`/`comprovante_url`);
  `PagamentoController::update` — aceitar upload no momento da transição
  para `PAGO`.
- **Frontend:** `PagamentoPage` — campo de upload no formulário de
  confirmação de pagamento; link de download no Portal (HU-1.5).
- **API:** `PATCH /pagamentos/{pagamento}` — aceitar `multipart/form-data`
  com arquivo.
- **Migrations:** `add_comprovante_to_pagamentos_table`.
- **Testes:** marcar `PAGO` com e sem comprovante (definir se obrigatório
  — **🟠 decisão 12 da lista consolidada, §5**: formato mínimo aceitável).
- **Critério de aceite:** comprovante anexado fica acessível ao ADMIN e à
  influenciadora dona (Portal), nunca a terceiros.

### HU-5.2 — Histórico de transição de status de Pagamento

- **Objetivo:** hoje só se sabe o estado atual + `aprovado_por`/
  `aprovado_em` do último evento; não há registro de quem/quando marcou
  `PAGO` especificamente.
- **Prioridade:** P2 (observação de auditoria, nenhum documento-fonte
  pediu como requisito bloqueante).
- **Dependências:** nenhuma.
- **Backend:** tabela de histórico dedicada (mesmo padrão de
  `historico_alteracoes_participacao` da HU-2.4) ou colunas
  `pago_por`/`pago_em` simples — decisão de execução, não de produto.
- **Frontend:** exibição do histórico na tela administrativa de
  Pagamento.
- **API:** sem mudança de contrato externo, só enriquecimento de leitura.
- **Migrations:** nova tabela ou colunas simples em `pagamentos`.
- **Testes:** transição `APROVADO→PAGO` registra autor/timestamp.
- **Critério de aceite:** é possível reconstruir quem/quando marcou
  `PAGO`.

### HU-5.3 — "Previsto × pago" no Portal

- **Objetivo:** já adiado explicitamente para entrega futura pela
  auditoria de regras legadas (RF-030 da V1) — registrado aqui só para
  não ser esquecido, sem data definida.
- **Prioridade:** P2.
- **Dependências:** HU-1.5 madura em produção.
- **Critério de aceite:** a definir quando priorizado.

---

## EPIC 6 — Produto, Variante e Estoque

Fonte: `ESPECIFICACAO_FUNCIONAL_MVP_COMPLETA.md` §3.5;
`ROADMAP_MESTRE_TEAR_V2.md` Parte 2, Fase 3 (desenho físico já
antecipado, não redesenhado aqui).

### HU-6.1 — Schema de Produto/Variante/Estoque

- **Objetivo:** território novo — nunca existiu em nenhuma versão do
  sistema. Tabelas `products`, `product_variants`, `stock`.
- **Prioridade:** P1.
- **Dependências:** nenhuma decisão de PO pendente para o schema em si.
- **Backend:** novos models `Produto`, `ProdutoVariante`, `Estoque`;
  controllers CRUD administrativos.
- **Frontend:** catálogo interno (tela administrativa de cadastro de
  produto/variante).
- **API:** `GET/POST /produtos`, `GET/POST /produtos/{produto}/variantes`.
- **Migrations:** `create_products_table`, `create_product_variants_table`,
  `create_stock_table`.
- **Testes:** CRUD básico; unicidade de variante (produto+cor+tamanho).
- **Critério de aceite:** operação cadastra produto com variantes e
  estoque pela plataforma.

### HU-6.2 — Validação de variante obrigatória

- **Objetivo:** bloquear salvamento de escolha de produto sem
  cor/tamanho confirmados; checar disponibilidade no momento da
  confirmação, não da extração/cadastro.
- **Prioridade:** P1 (RFC-10).
- **Dependências:** HU-6.1.
- **Backend:** regra de validação no service/controller que grava a
  escolha de produto (ainda a nascer — depende de onde a escolha é
  registrada: Briefing, Permuta ou entidade própria, a definir na
  execução).
- **Frontend:** formulário de escolha de produto bloqueia submit sem
  variante confirmada.
- **API:** endpoint que grava a escolha (a definir junto com HU-6.1/HU-8.x).
- **Migrations:** nenhuma além de HU-6.1.
- **Testes:** tentativa de salvar produto pai (sem variante) é rejeitada.
- **Critério de aceite:** idêntico ao definido em
  `ESPECIFICACAO_FUNCIONAL_MVP_COMPLETA.md` §5, RFC-10.

---

## EPIC 7 — Logística: Ficha de Retirada Automática

Fonte: `ESPECIFICACAO_FUNCIONAL_MVP_COMPLETA.md` §3.6 (RFC-09).

### HU-7.1 — Ficha de retirada automática

- **Objetivo:** gerada no momento em que o look da campanha é confirmado
  (produto/variante escolhidos no briefing) — foto, SKU, produto/
  variante, nome completo, endereço.
- **Prioridade:** P1.
- **Dependências:** HU-2.3 (Envio) + HU-6.1 (Produto/Variante).
- **Backend:** trigger na confirmação de look (evento de domínio ou
  chamada direta de service) que gera a ficha; reaproveita leitura de
  endereço ao vivo (mesmo padrão de HU-2.3, nunca duplicar).
- **Frontend:** visualização/impressão da ficha na tela de Envio.
- **API:** endpoint de geração/consulta da ficha (a definir na execução).
- **Migrations:** possível tabela `fichas_retirada` ou campo derivado em
  `envios` — avaliar na execução, sem redesenhar o schema já antecipado
  em `ROADMAP_MESTRE_TEAR_V2.md`.
- **Testes:** ficha gerada com todos os campos exigidos; endereço lido ao
  vivo, não duplicado.
- **Critério de aceite:** idêntico ao definido em
  `ESPECIFICACAO_FUNCIONAL_MVP_COMPLETA.md` §5, RFC-09.

---

## EPIC 8 — Permutas

Fonte: `ESPECIFICACAO_FUNCIONAL_MVP_COMPLETA.md` §3 (via §3.5 dependência),
`ROADMAP_MESTRE_TEAR_V2.md` Fase 3.

### HU-8.1 — Escolha de produto de permuta pela influenciadora

- **Objetivo:** janela de dias corridos a partir da abertura da
  campanha/ciclo; escolha feita pela influenciadora autenticada; mesma
  regra de variante obrigatória da HU-6.2.
- **Prioridade:** P1.
- **Dependências:** EPIC 1 (Portal maduro — "sem login não há quem
  escolha") + HU-6.1/HU-6.2 (Produto/Variante).
- 🟠 **Decisão bloqueante parcial:** duração exata da janela (decisão 2
  da lista consolidada, §5) — pode ser implementada com duração
  configurável (não hardcoded) para não bloquear o desenvolvimento
  técnico enquanto o número exato não chega.
- **Backend:** nova entidade `Permuta` (estado "solicitada" até
  confirmação); regra de janela por data de abertura da campanha.
- **Frontend:** tela de escolha de permuta no Portal (dentro do painel de
  participação, HU-1.2).
- **API:** `POST /participacoes/{participacao}/permuta`.
- **Migrations:** `create_permutas_table`.
- **Testes:** escolha dentro da janela aceita; fora da janela rejeitada
  (comportamento de expiração — ver HU-8.3).
- **Critério de aceite:** influenciadora escolhe produto de permuta
  dentro da janela, com variante confirmada.

### HU-8.2 — Confirmação da equipe

- **Objetivo:** escolha entra em estado "solicitada" até aprovação (ou
  confirmação automática, a decidir) da equipe; só após confirmada vira
  ficha logística (EPIC 7).
- **Prioridade:** P1.
- **Dependências:** HU-8.1.
- **Backend:** `PermutaController::confirmar`/`rejeitar` (ADMIN).
- **Frontend:** fila de permutas pendentes na tela administrativa.
- **API:** `PATCH /permutas/{permuta}/confirmar`.
- **Migrations:** nenhuma além de HU-8.1.
- **Testes:** confirmação dispara geração de ficha (HU-7.1).
- **Critério de aceite:** permuta confirmada gera ficha logística
  automaticamente.

### HU-8.3 — Comportamento ao expirar sem escolha 🟠

- **Objetivo/Prioridade:** bloqueada — decisão 2 da lista consolidada
  (§5): fallback automático (ex. produto padrão) ou fallback manual
  (equipe decide caso a caso). Não implementar nenhum dos dois sem
  confirmação.

---

## EPIC 9 — Contratos

Fonte: `ESPECIFICACAO_FUNCIONAL_MVP_COMPLETA.md` §3.7, §4.4;
`ROADMAP_MESTRE_TEAR_V2.md` Fase 4.

### HU-9.1 — Template de contrato editável pelo ADMIN sem deploy

- **Objetivo:** requisito central e critério de aceite obrigatório —
  administrador altera texto/placeholders pela própria aplicação, sem
  deploy.
- **Prioridade:** P1.
- **Dependências:** HU-2.2 (campos contratuais em Parceira).
- **Backend:** `ContractTemplate` model, CRUD; motor de placeholders
  (`{{nome}}`, `{{cnpj}}`, `{{valor_total}}`, `{{prazo_uso_imagem}}` etc.)
  vinculado a dados de Cadastro + `ParticipacaoNaCampanha.valor_contratado`
  (total da participação, sem acoplamento à pergunta de recorrência —
  `ANALISE_MODELO_PAGAMENTO_RECORRENTE_TEAR_V2.md` §3).
- **Frontend:** editor/visualizador de template (tela administrativa
  nova).
- **API:** `GET/POST/PATCH /contract-templates`.
- **Migrations:** `create_contract_templates_table`.
- **Testes:** edição de template sem deploy reflete na próxima geração;
  templates antigos não afetam contratos já emitidos (ver HU-9.4).
- **Critério de aceite:** ADMIN edita cláusula e vê efeito na próxima
  geração, sem intervenção técnica.

### HU-9.2 — Geração de contrato em PDF

- **Objetivo:** preencher template com dados reais e gerar PDF.
- **Prioridade:** P1.
- **Dependências:** HU-9.1.
- **Backend:** `ContractService` (merge de placeholders + geração de
  PDF); armazenamento via abstração `Storage` já usada por Materiais.
- **Frontend:** botão "gerar contrato" na tela de Participação/Parceira
  administrativa; preview antes de confirmar.
- **API:** `POST /participacoes/{participacao}/contratos`.
- **Migrations:** `create_contracts_table`.
- **Testes:** geração com todos os placeholders resolvidos; falha
  controlada se campo obrigatório do template estiver ausente no
  cadastro (mesmo padrão de falha rápida do legado, `CamposDeMesclagem`).
- **Critério de aceite:** PDF gerado com dados corretos, armazenado e
  associado à participação.

### HU-9.3 — Envio para assinatura digital 🟠

- **Objetivo/Prioridade:** bloqueada — decisão 4 da lista consolidada
  (§5): provedor (Clicksign, D4Sign, DocuSign, ZapSign etc.) é decisão do
  responsável do projeto/jurídico. Sem provedor definido, esta história
  não tem endpoint/integração possível.
- **Dependências:** HU-9.2.
- **Ação recomendada:** nenhuma integração até a decisão — contrato pode
  circular para assinatura manual/externa (fora da plataforma) como
  estado intermediário aceitável, sem tabela `contract_signatures`/
  `contract_events` implementada ainda.

### HU-9.4 — Versionamento imutável do contrato gerado

- **Objetivo:** nova geração nunca reescreve contrato emitido; sempre
  gera nova versão.
- **Prioridade:** P1.
- **Dependências:** HU-9.2.
- **Backend:** `contracts` — sem `UPDATE` de conteúdo, só `INSERT`;
  relação com o template usado (snapshot de qual versão do template
  gerou aquele PDF).
- **Frontend:** listagem de versões de contrato por participação.
- **API:** `GET /participacoes/{participacao}/contratos` (lista, não
  singular).
- **Migrations:** nenhuma além de HU-9.2 (a modelagem já nasce
  append-only).
- **Testes:** gerar 2 vezes produz 2 registros distintos, o primeiro
  intacto.
- **Critério de aceite:** histórico de versões de contrato nunca perde
  uma geração anterior.

---

## EPIC 10 — Assessoria 🟠

Fonte: `ESPECIFICACAO_FUNCIONAL_MVP_COMPLETA.md` §3.8.

### HU-10.1 — Modelo de Assessoria

- **Objetivo/Prioridade:** bloqueada — decisão 5 da lista consolidada
  (§5). Recomendação técnica registrada é o Modelo B (entidade própria,
  1:N para `parceiras`), mas depende de dado operacional real (quantas
  influenciadoras têm assessoria hoje, se compartilham a mesma) que não
  está em nenhuma fonte analisada.
- **Achado correlato, não bloqueado:** `parceiras.user_id` não tem
  `unique()` no banco hoje — se o Modelo B for aprovado (um `User`
  representando várias Parceiras), essa ausência de constraint passa de
  risco teórico a decisão de design ativa. Registrar como item técnico a
  resolver **junto** com a decisão de modelo, não antes.
- **Ação recomendada:** aguardar decisão; nenhuma migration.

---

## EPIC 11 — Histórico Legado (Importação)

Fonte: `ESPECIFICACAO_FUNCIONAL_MVP_COMPLETA.md` §3.12.

### HU-11.1 — Importador idempotente de registros terminais

- **Objetivo:** importar só linhas já arquivadas (estado terminal) do
  legado — ativações/conteúdos publicados, pagamentos concluídos, envios
  entregues — como registros `origem: legado`, somente leitura. Não
  recriar comportamento nem reabrir fluxo.
- **Prioridade:** P1.
- **Dependências:** modelo de destino estável — não migrar para algo que
  ainda vai mudar (ex.: aguardar EPIC 2/6/7 estabilizarem os módulos que
  recebem dado histórico equivalente).
- 🟠 **Decisão bloqueante parcial:** escopo exato (quais abas entram,
  quais campos obrigatórios, o que descartar — decisão 11 da lista
  consolidada, §5). A estratégia geral (somente leitura, só registros
  terminais) já está decidida e pode orientar o desenho técnico antes do
  escopo fino chegar.
- **Backend:** importador por planilha/aba, idempotente, com relatório de
  divergências; campo `origem`/`legacy_id` nas entidades migradas; tabela
  `imports` (log de execução).
- **Frontend:** painel de importação (upload, dry-run, status, erros
  linha a linha) — administrativo.
- **API:** `POST /imports`, `GET /imports/{import}`.
- **Migrations:** `origem`/`legacy_id` nas tabelas afetadas; `create_imports_table`.
- **Testes:** reimportar o mesmo arquivo não duplica registros
  (idempotência); divergência de grafia entre `INFLU_KEY` e `nome` é
  reportada, não descartada silenciosamente (risco já registrado —
  §7 da Especificação Funcional V2.5).
- **Critério de aceite:** planilha crítica importada com relatório
  zero-erros ou erros justificados; nenhum dado do legado é sobrescrito
  nem descartado sem log.

### HU-11.2 — Tela de histórico "origem: legado"

- **Objetivo:** consulta somente leitura dos registros importados.
- **Prioridade:** P1.
- **Dependências:** HU-11.1.
- **Backend:** endpoints de leitura filtrando por `origem=legado`.
- **Frontend:** tela administrativa de histórico (hoje é item de menu
  placeholder).
- **API:** `GET /historico?origem=legado`.
- **Migrations:** nenhuma além de HU-11.1.
- **Testes:** registros legados aparecem, sem ação de edição disponível.
- **Critério de aceite:** equipe consulta histórico legado sem sair da
  plataforma.

---

## EPIC 12 — Métricas de Perfil

Fonte: `ESPECIFICACAO_FUNCIONAL_MVP_COMPLETA.md` §3.11 (RFC-14).

### HU-12.1 — Cadastro e atualização versionada de métricas

- **Objetivo:** métricas autodeclaradas (seguidores, engajamento) no
  cadastro e sob demanda; cada atualização gera novo registro versionado
  (mesma lógica de Medidas), nunca sobrescreve. Sem integração automática
  a redes sociais nesta fase.
- **Prioridade:** P2.
- **Dependências:** nenhuma.
- **Backend:** nova tabela `metricas_influenciadora` (append-only, mesmo
  padrão de `medidas_influenciadora`).
- **Frontend:** formulário de métricas no cadastro e no Perfil (Portal).
- **API:** `POST /parceiras/{parceira}/metricas`.
- **Migrations:** `create_metricas_influenciadora_table`.
- **Testes:** atualização gera novo registro, não sobrescreve o anterior.
- **Critério de aceite:** histórico de métricas consultável ao longo do
  tempo.

---

## EPIC 13 — Portal da Marca (`GESTOR_MARCA`) 🟠

Fonte: `ESPECIFICACAO_FUNCIONAL_MVP_COMPLETA.md` §3.2, §9 item 6.

### HU-13.1 — Escopo de visibilidade para `GESTOR_MARCA`

- **Objetivo/Prioridade:** bloqueada — decisão 6 da lista consolidada
  (§5). Papel já existe como seed sem uso; nenhuma regra de visibilidade
  definida em nenhuma fonte; sem precedente na V1. Decisão de escopo de
  produto do zero, não uma lacuna técnica.
- **Ação recomendada:** nenhuma implementação até definição de escopo.

---

## EPIC 14 — Inteligência Operacional

Fonte: `ESPECIFICACAO_FUNCIONAL_MVP_COMPLETA.md` §3.5, §5 (RFC-15).

### HU-14.1 — Extração assistida de produto via URL

- **Objetivo:** colar URL de produto, extrair foto/nome/cor/SKU, sempre
  com revisão humana obrigatória antes de gravar; nome operacional
  sempre editável, extração é sugestão, nunca fonte de verdade.
- **Prioridade:** P2.
- **Dependências:** EPIC 6 (Produto/Variante) maduro e estável — não
  adiantar sobre modelo instável.
- **Backend:** serviço de scraping/extração, fila de jobs (`jobs` table
  já existe no schema padrão Laravel, sem worker em uso hoje).
- **Frontend:** interface de colar URL + tela de revisão/conferência
  antes de confirmar.
- **API:** `POST /produtos/extrair-url`, painel de revisão.
- **Migrations:** `automation_jobs`, `url_extractions`.
- **Testes:** extração popula formulário sem gravar direto; edição manual
  sempre possível.
- **Critério de aceite:** pelo menos um fluxo de extração em produção,
  com taxa de acerto acompanhada.

---

## Cross-cutting (não é epic de produto, é infraestrutura/gate)

### CC-1 — Migração SQLite → Postgres

- **Objetivo:** eliminar risco de concorrência de escrita antes de abrir
  o Portal para múltiplas influenciadoras enviando material
  simultaneamente (HU-1.4).
- **Prioridade:** P0 (gate de infraestrutura, não feature de produto).
- **Dependências:** deve completar **antes** de HU-1.4 ir a produção com
  usuárias reais.
- **Critério de aceite:** ambiente de produção roda Postgres; suíte de
  testes verde no novo driver.

---

## Resumo de decisões do PO que bloqueiam histórias específicas

Consolidado de `ESPECIFICACAO_FUNCIONAL_MVP_COMPLETA.md` §9, mapeado às
histórias deste backlog (nenhuma pergunta nova foi criada aqui):

| # | Decisão | Bloqueia |
|---|---|---|
| 1 | Pagamento recorrente/parcelado por Participação | HU-2.5 (e, por consequência, o dimensionamento de HU-2.4) |
| 2 | Bloquear vs. auditar edição pós-congelamento | Fechamento de HU-2.4 (não seu início) |
| 3 | Taxonomia Material↔Briefing | HU-4.1, e por decorrência HU-1.4 |
| 4 | CPF alternativo a CNPJ | HU-3.5 (recomendação: já resolvido, não reabrir) |
| 5 | Medida corporal em cm | Não vira história neste backlog — gap novo sem proposta técnica ainda; registrar como pendência de produto pura |
| 6 | Escopo do Portal da Marca | EPIC 13 inteiro |
| 7 | Modelo de Assessoria | EPIC 10 inteiro |
| 8 | Provedor de assinatura digital | HU-9.3 |
| 9 | Cláusulas/versões/prazo contratuais | Detalhamento fino de HU-9.1 (não bloqueia o CRUD de template em si) |
| 10 | Janela de permuta (dias) | Duração exata de HU-8.1 (implementável com valor configurável enquanto isso) |
| 11 | Escopo exato da importação do legado | Detalhamento fino de HU-11.1 (não bloqueia o desenho do importador) |
| 12 | Formato do comprovante de pagamento | Detalhamento fino de HU-5.1 |

---

Nenhum código foi escrito, nenhuma migration criada, nenhum Model ou
Controller alterado para produzir este documento. Sequência recomendada
de execução, estimativa de histórias e caminho crítico:
`docs/PLANO_EXECUCAO_MVP.md`.
