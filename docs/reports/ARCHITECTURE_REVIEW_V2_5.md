# TEAR V2.5 — Architecture Review

**Data:** 2026-07-21
**Autor:** Auditoria de arquitetura (read-only, sem alteração de comportamento)
**Branch auditada:** `feat/ui-design-system-ela` (working tree limpo, sincronizado com `origin`)
**Escopo:** `tear-v2-app/` (Laravel 13 + Sanctum + Spatie Permission / React 19 +
TypeScript + Vite) — o sistema em preparação para produção (admin + Portal da
Influenciadora). O Portal legado GAS (`src/`) e o domínio soberano
(`CONTRATO_SOBERANO.md`) não fazem parte deste escopo: `tear-v2-app` é um
domínio próprio (Marca/Campanha/Participação), sem termos do Contrato
Soberano e sem relação de código com `src/`.

Metodologia: leitura completa de todos os Controllers (10), Policies (4),
Services (3), Models (10), FormRequests (17), Resources (9), migrations (19),
`routes/api.php`, `AppServiceProvider`, seeders, e amostragem da estrutura do
frontend. Nenhum arquivo de código foi alterado. Este documento não repete o
inventário de segurança/infra já coberto por
`docs/HANDOFF_FINAL.md` e `docs/release/TEAR_V2.5_GO_LIVE_CHECKLIST.md` (auditorias
recentes, 2026-07-21, com veredito "apto para go-live com ressalvas") —
referencia esses achados quando relevante à arquitetura, sem duplicá-los.

---

# Resumo executivo

A arquitetura de `tear-v2-app` é um Laravel convencional bem aplicado:
Controller fino → FormRequest (validação) → Model (Eloquent) → Resource
(serialização), com Policies para autorização por dono de recurso e um
`Gate::before` central que dá acesso total ao papel `ADMIN`. Não há
Repository, Domain layer ou Service layer pesada — e isso é adequado ao porte
atual do sistema (10 Models, 10 Controllers), não uma lacuna.

O ponto mais relevante encontrado é uma **regra de negócio duplicada em
quatro lugares** (visibilidade de uma Influenciadora restrita à sua própria
Parceira/Participação), implementada como filtro de query ad hoc dentro de
cada Controller de listagem, em vez de centralizada em um único ponto (scope
de Model ou Policy). Hoje os quatro pontos estão consistentes entre si, mas
não há nada que force isso a continuar assim se um quinto endpoint de listagem
for adicionado. Achado ALTO, mas não bloqueante: não é um bug hoje, é uma
condição para um bug futuro de vazamento de dados entre Influenciadoras.

Um segundo achado estrutural: o padrão adotado para transições de estado
(método dedicado no Model — `Parceira::aprovar()`, `Material::aprovar()`/
`reprovar()`) foi estabelecido conscientemente (comentários no código
confirmam a intenção: "único ponto de escrita de status") mas não foi seguido
para `Pagamento`, cuja transição de status vive inline em
`PagamentoController::update()`. Inconsistência de camada, não bug.

Fora esses dois pontos, o sistema está coeso, sem código morto localizado, com
as 19 migrations todas revertíveis, testes cobrindo os fluxos principais, e
nomenclatura em português consistente com o domínio (RN-03, ESPECIFICACAO_FUNCIONAL
§6, citadas literalmente nos comentários de Policy). O sistema está em
condição estrutural saudável para Go-Live; as recomendações abaixo são
melhorias localizadas, não uma reescrita.

---

# Pontos fortes

1. **Separação de camadas consistente e homogênea.** Todo Controller segue o
   mesmo formato: `authorize()` → FormRequest injetado (regra de validação) →
   chamada de Model/relação → Resource de retorno. Nenhum Controller lido
   contém query SQL crua, lógica de View, ou acesso a `$_SERVER`/globals.

2. **Autorização com uma única fonte de bypass.**
   `AppServiceProvider::boot()` define `Gate::before` dando acesso irrestrito
   a `ADMIN`; toda Policy (`CampanhaPolicy`, `MarcaPolicy`, `ParceiraPolicy`,
   `ParticipacaoNaCampanhaPolicy`) só precisa tratar o caso não-ADMIN. Isso
   evita a duplicação clássica de "if role == ADMIN return true" espalhada
   por Policy — há um único lugar que concede o superpoder do papel
   administrativo.

3. **Transições de estado protegidas contra mass-assignment onde o padrão foi
   seguido.** `Parceira` e `Material` deixam `status`/`user_id`/campos de
   aprovação fora do `#[Fillable]` e expõem métodos dedicados (`aprovar()`,
   `reprovar()`, `vincularUsuario()`) como único caminho de escrita — com
   comentário explícito no código documentando a intenção ("único ponto de
   escrita de status"). Isso é uma prática de proteção de invariante bem
   aplicada, não trivial em Eloquent.

4. **`FormRequest::authorize()` sempre `true`, autorização real via Policy no
   Controller.** As 17 FormRequests amostradas (`StoreParceiraRequest`,
   `UpdateCampanhaRequest`, etc.) delegam autorização inteiramente a
   `$this->authorize()` no Controller — não há duas fontes de verdade sobre
   "quem pode fazer isso" competindo entre FormRequest e Controller.

5. **Degradação deliberada de integrações externas documentada em código.**
   `CepLookupService::buscar()` nunca lança exceção — falha vira `null` e é
   logada como warning, comentário explícito citando a razão ("falha de
   integração externa não pode impedir salvar o cadastro"). `GoogleDriveService`
   tem `isConfigured()` verificado antes de qualquer chamada, com falha
   fechada (503, sem fallback silencioso) em vez de aberta.

6. **Nenhum código morto ou resíduo de debug encontrado.** Varredura por
   `TODO`/`FIXME`/`dd(`/`dump(`/`var_dump` em `app/` não retornou nenhuma
   ocorrência. As 19 migrations têm `down()` implementado (confirmado por
   varredura, nenhuma sem reversão).

7. **Design tokens do frontend já alinhados ao ADR vigente.**
   `frontend/src/index.css` usa `#CD0005`/`radius: 0` conforme
   `ADR-002-frontend-foundation.md` ("Absolute Flatness") — a dívida
   registrada no `TASK_ROUTER.md` §7 é sobre `docs/design/DESIGN_SYSTEM.md`
   estar desatualizado como *documento*, não sobre a implementação real
   divergir do ADR. Vale nota porque poderia ser lido como um problema de
   código; não é.

---

# Pontos fracos

## 1. Regra de visibilidade por dono duplicada em quatro Controllers (sem Policy como fonte única)

A regra "uma Influenciadora só enxerga o que é seu" é reimplementada como
filtro de query ad hoc em quatro pontos distintos, todos com a mesma forma
(`when(!$user->hasRole('ADMIN'), fn ($q) => $q->where(...)))`):

- `ParceiraController::index` — filtra por `user_id`
- `CampanhaController::index` — filtra por `participacoes.parceira_id` + `status ATIVA`
- `CampanhaController::show` — mesma condição, reaplicada ao eager-load de `participacoes`
- `ParticipacaoController::index` — filtra por `parceira_id`

Ao mesmo tempo, **a mesma regra de negócio já existe, escrita de forma
independente, em `CampanhaPolicy::view()`** (comentário: "a influenciadora só
vê campanhas onde sua própria participação está ATIVA") — mas essa Policy só
é chamada em `CampanhaController::show`, não em `index` (que usa
`authorize('viewAny', ...)`, que sempre retorna `true`, e resolve a
restrição real via o filtro de query citado acima, não via Policy).

Ou seja: para listagens (`index`), a autorização "por linha" não passa pela
Policy — é reimplementada manualmente, quatro vezes, com a mesma forma.
Hoje as quatro implementações são consistentes entre si e corretas. O risco é
estrutural: nada impede um quinto endpoint de listagem ser adicionado sem essa
cláusula (esquecimento humano, não erro de lógica), o que vazaria dados de uma
Influenciadora para outra — motivo pelo qual este achado é classificado ALTO
apesar de não haver bug hoje.

## 2. Transição de estado do Pagamento não segue o padrão estabelecido pelo próprio código

`Parceira::aprovar()` e `Material::aprovar()`/`reprovar()` encapsulam
transição de estado como método de domínio no Model, com o campo `status`
fora do `#[Fillable]`. `Pagamento`, ao contrário, mantém `status` **dentro**
do `#[Fillable]` (`Pagamento.php`) e sua transição de estado — incluindo a
regra de negócio "não aprova se há Material não aprovado" — vive inline em
`PagamentoController::update()` (com um método privado
`existeMaterialNaoAprovado()` no próprio Controller).

Isso não é um bug — o comportamento resultante está correto e testado — mas é
uma inconsistência de camada: o mesmo tipo de decisão (transição de estado +
regra de invariante) tem dois lugares diferentes dependendo de qual Model é
tocado, o que é confuso para quem for adicionar uma nova transição no futuro
e não tiver contexto de qual dos dois padrões seguir. Reforçado pelo achado
P2 já registrado em `HANDOFF_FINAL.md` ("`Pagamento::$fillable` inclui
`status` sem necessidade") — mesma causa raiz vista por ângulo diferente.

## 3. Papel `GESTOR_MARCA` modelado sem nenhuma regra de autorização real

`RoleSeeder` cria o papel `GESTOR_MARCA` como estrutural; `DevUserSeeder`
atribui esse papel a um usuário de desenvolvimento; o frontend
(`AppShell`, conforme já registrado em `HANDOFF_FINAL.md`) roteia qualquer
papel diferente de `INFLUENCIADORA` para a área administrativa completa. Mas
nenhuma Policy do backend distingue `GESTOR_MARCA` de "autenticado sem
ADMIN" — na prática esse papel hoje se comporta como um usuário sem nenhum
acesso de leitura a Marca/Campanha (bloqueado pelo mesmo caminho que bloqueia
qualquer não-ADMIN). É um papel "pela metade": existe no schema e na seed,
mas não tem comportamento de autorização correspondente. Não é explorável
(nenhum fluxo de produção atribui esse papel a um usuário real), mas é uma
inconsistência entre três camadas (seed, frontend, Policy) que uma pessoa
lendo só uma delas não perceberia.

## 4. Duplicação pontual entre `CadastroPublicoController::store` e `ParceiraController::store`

Os dois métodos são idênticos: resolvem endereço via `CepLookupService`,
depois `Parceira::create()`. É uma duplicação de baixo risco (mesma forma,
mesmo Model, sem lógica de autorização diferente entre eles — a diferença
real está na rota, uma pública e outra atrás de `role:ADMIN`), mas é o tipo
de duplicação que tende a divergir silenciosamente se um dos dois fluxos
ganhar uma regra nova e a outra não for atualizada junto.

## 5. Ausência de camada de Repository — não é uma fraqueza, mas registro deliberado

`tear-v2-app` não tem diretório `Repositories`; Controllers falam
diretamente com Eloquent (`Campanha::with(...)->when(...)->paginate(...)`
dentro do próprio `CampanhaController::index`). Para o porte atual (10
Models, queries de filtro simples) isso é apropriado e idiomático em
Laravel — sinalizado aqui apenas para registrar que a ausência foi observada
e avaliada como não sendo dívida, não para recomendar introduzir a camada
(ver seção "O que NÃO deve ser alterado").

---

# Dívidas técnicas

Nenhuma dívida CRÍTICA foi encontrada — nada que bloqueie o Go-Live do ponto
de vista arquitetural. As auditorias de segurança/infra já existentes
(`HANDOFF_FINAL.md`, veredito "apto para go-live com ressalvas") continuam
válidas e não são contradições por este documento. Para cada item: evidência
em código, impacto real sobre o Go-Live (não sobre manutenção futura em
abstrato), recomendação e decisão de quando agir.

## Débito #1 — Regra de visibilidade por dono duplicada em 4 Controllers, sem Policy como fonte única para listagens

**Classificação:** ALTO

**Evidência:**
- `app/Http/Controllers/Api/ParceiraController.php` (`index`, filtro por `user_id`)
- `app/Http/Controllers/Api/CampanhaController.php` (`index` e `show`, filtro por `participacoes.parceira_id` + `status ATIVA`)
- `app/Http/Controllers/Api/ParticipacaoController.php` (`index`, filtro por `parceira_id`)
- `app/Policies/CampanhaPolicy.php::view()` — mesma regra reescrita de forma independente, usada só em `show`, não em `index`

**Impacto no Go-Live:** nenhum hoje — os quatro pontos existentes estão
corretos e testados (148/148 testes verdes, conforme `HANDOFF_FINAL.md`).
Não há vazamento de dados em produção com o código atual. O impacto é
inteiramente prospectivo: um quinto endpoint de listagem adicionado sem
replicar o filtro vazaria dados entre Influenciadoras — mas isso exigiria uma
mudança de código futura que ainda não existe.

**Recomendação:** centralizar a regra em um Model scope reaproveitável
(ex.: `scopeVisivelPara(Builder $query, User $user)` em `Campanha`,
`ParticipacaoNaCampanha` e `Parceira`), chamado pelos quatro Controllers hoje
duplicados. Não muda nenhum contrato de resposta, só move a mesma condição
para um único lugar.

**Ação:** ✔ Postergar para V2.6 — nada em produção depende da correção
imediata; é a primeira unidade de trabalho recomendada da V2.6 pelo baixo
blast radius (scope de Model, sem mudar contrato de API).

## Débito #2 — Transição de estado do `Pagamento` não segue o padrão estabelecido pelo próprio código

**Classificação:** MÉDIO

**Evidência:**
- `app/Models/Parceira.php::aprovar()` e `app/Models/Material.php::aprovar()`/`reprovar()` — padrão estabelecido (método de domínio, campo fora do `#[Fillable]`)
- `app/Models/Pagamento.php` — `status` dentro do `#[Fillable]`
- `app/Http/Controllers/Api/PagamentoController.php::update()` e `::existeMaterialNaoAprovado()` — transição de estado e regra de invariante inline no Controller

**Impacto no Go-Live:** nenhum — o comportamento resultante está correto e
coberto por teste; a regra de negócio ("não aprova com Material pendente")
funciona hoje exatamente como deveria. O custo é só de manutenção futura
(confusão sobre qual dos dois padrões seguir na próxima transição de estado
a ser criada).

**Recomendação:** padronizar `Pagamento::aprovar(User $admin)` como método de
Model espelhando `Material::aprovar()`, e remover `status` do `#[Fillable]`.
Resolve, na mesma mudança, o P2 já registrado em `HANDOFF_FINAL.md`
("`Pagamento::$fillable` inclui `status` sem necessidade").

**Ação:** ✔ Postergar para V2.6 — comportamento correto hoje; reorganização
de camada, não correção de defeito.

## Débito #3 — Papel `GESTOR_MARCA` modelado sem nenhuma regra de autorização real

**Classificação:** MÉDIO

**Evidência:**
- `database/seeders/RoleSeeder.php` — cria `GESTOR_MARCA` como papel estrutural
- `database/seeders/DevUserSeeder.php` — atribui o papel a um usuário de dev (`gestor@tear.test`)
- `app/Policies/MarcaPolicy.php` — `viewAny`/`view` sempre `false` fora de `ADMIN` (via `Gate::before`); não distingue `GESTOR_MARCA` de qualquer outro não-ADMIN
- Frontend `AppShell` (referenciado em `HANDOFF_FINAL.md`) — roteia qualquer papel `!== 'INFLUENCIADORA'` para a área administrativa completa

**Impacto no Go-Live:** nenhum — `DevUserSeeder` só roda em
`local`/`testing` (guarda de ambiente confirmada no código); nenhum fluxo de
produção atribui `GESTOR_MARCA` a um usuário real. O papel é inerte em
produção hoje.

**Recomendação:** decidir o destino do papel antes da fase de produto que o
ativaria (`docs/planning/TEAR_V2.5_PRODUCTIZACAO_ROADMAP.md`) — remover do seed se não
houver plano concreto de uso próximo, ou escrever a Policy correspondente se
houver.

**Ação:** ✔ Postergar para V2.6 — não é urgente enquanto nenhum fluxo de
produção atribuir o papel; decidir quando o roadmap de produto chegar nessa
fase, não antes do Go-Live atual.

## Débito #4 — Duplicação entre `CadastroPublicoController::store` e `ParceiraController::store`

**Classificação:** BAIXO

**Evidência:**
- `app/Http/Controllers/Api/CadastroPublicoController.php::store()`
- `app/Http/Controllers/Api/ParceiraController.php::store()`
- Ambos: `CepLookupService::preencherEnderecoSeNecessario()` seguido de `Parceira::create()`, corpo idêntico

**Impacto no Go-Live:** nenhum — os dois endpoints funcionam corretamente
hoje, cada um atrás da rota certa (pública vs. `role:ADMIN`). O risco é
divergência silenciosa se um dos dois ganhar uma regra nova sem a outra ser
atualizada junto — ainda não ocorreu.

**Recomendação:** extrair o corpo comum para um método privado compartilhado
ou um Service pequeno, sem mudar rota, validação ou resposta de nenhum dos
dois endpoints.

**Ação:** ✔ Postergar para V2.6 — cosmético, sem urgência.

## Débito #5 — `GET /marcas`/`GET /marcas/{marca}` sem `role:ADMIN` explícito na rota

**Classificação:** BAIXO

**Evidência:**
- `routes/api.php` — `Route::get('/marcas', ...)` e `Route::get('/marcas/{marca}', ...)` sem `->middleware('role:ADMIN')`, ao contrário das rotas de escrita irmãs (`POST`/`PATCH /marcas`)
- `app/Policies/MarcaPolicy.php` — bloqueio real hoje depende só desta Policy (`viewAny`/`view` sempre `false` fora de `ADMIN`)

**Impacto no Go-Live:** nenhum — a Policy bloqueia corretamente hoje
(reverificado neste review); o item é hardening contra regressão futura caso
a Policy mude sem repor a restrição na rota, não uma falha ativa. Já
registrado como P1 em `HANDOFF_FINAL.md`/`docs/release/TEAR_V2.5_GO_LIVE_CHECKLIST.md`
pelo ângulo de segurança; repetido aqui pela mesma família estrutural do
Débito #1 (regra de acesso não reforçada em todas as camadas onde poderia
estar).

**Recomendação:** adicionar `role:ADMIN` explícito nas duas rotas, redundante
com a Policy mas barato e sem risco de regressão.

**Ação:** ✔ Postergar para V2.6 — trivial, pode entrar junto com o Débito #1
ou #2, sem necessidade de ser antes do Go-Live.

---

# Riscos arquiteturais

- **Vazamento de dados entre Influenciadoras por omissão futura.** O risco
  real do achado #1: se um próximo endpoint de listagem for adicionado
  copiando um Controller existente sem copiar também o filtro `when(!
  hasRole('ADMIN'), ...)`, uma Influenciadora passaria a ver dados de outra.
  Isso já é mitigado hoje (os 4 pontos existentes estão corretos), mas o
  mecanismo de mitigação é disciplina humana repetida, não uma barreira
  estrutural (ex.: um Model scope ou trait que centralizasse a regra).

- **Deriva de regra de negócio entre Model e Controller.** Com duas
  convenções coexistindo para transição de estado (método de Model vs.
  lógica inline no Controller), a próxima entidade que precisar de uma
  transição semelhante (ex.: um quinto tipo de aprovação) tem 50% de chance
  de seguir o padrão "errado" (o que hoje só `Pagamento` usa) simplesmente
  por copiar o Controller mais próximo.

- **Papéis modelados sem autorização correspondente ficam invisíveis até
  serem ativados.** `GESTOR_MARCA` é seguro hoje só porque nada atribui esse
  papel em produção. Se o roadmap de produto (`docs/planning/TEAR_V2.5_PRODUCTIZACAO_ROADMAP.md`)
  ativar esse papel sem que alguém releia este documento, o resultado visível
  será uma UI quebrada (403 constante) — não um vazamento, mas uma regressão
  funcional silenciosa até o primeiro usuário real daquele papel.

---

---

# O que NÃO deve ser alterado

- **Não introduzir camada de Repository.** O acesso direto a Eloquent nos
  Controllers é apropriado para o porte atual; adicionar essa camada agora
  seria complexidade sem benefício correspondente, na contramão do critério
  de estabilidade pré-Go-Live.
- **Não reabrir o modelo de autorização (`Gate::before` + Policies).** Está
  correto e testado; qualquer mudança aqui tem alto blast radius (afeta toda
  rota autenticada) para um ganho que nenhuma dívida encontrada justifica.
- **Não mexer no fluxo de `GoogleDriveService`/JWT manual.** Funciona,
  degrada corretamente (503) e qualquer refatoração para um SDK oficial é
  decisão de produto (custo de dependência nova), não correção de defeito.
- **Não tocar nos tokens de design (`index.css`) nem em `ADR-002`.** Já estão
  alinhados; o documento desatualizado é `docs/design/DESIGN_SYSTEM.md`
  (dívida de documentação, não de código, já registrada em
  `TASK_ROUTER.md` §7 — fora do escopo desta revisão de arquitetura).
- **Não implementar nenhuma das Recomendações acima nesta sessão** — por
  mandato explícito deste review (auditoria, não execução). Ficam
  registradas para uma unidade de trabalho futura e isolada.

---

# Prioridade das melhorias

Todos os 5 débitos técnicos receberam a decisão **✔ Postergar para V2.6**
(detalhe de evidência/impacto/recomendação em cada um, seção "Dívidas
técnicas") — nenhum bloqueia o Go-Live atual do ponto de vista arquitetural.
Ordem sugerida de execução dentro da V2.6, por relação custo/risco:

1. **Débito #1** (regra de visibilidade duplicada) — risco ALTO, correção de
   baixíssimo blast radius (scope de Model, sem mudar contrato). Primeira
   unidade de trabalho recomendada.
2. **Débito #2** (transição de `Pagamento` inline) — resolve simultaneamente
   o P2 já registrado em `HANDOFF_FINAL.md`.
3. **Débito #5** (`role:ADMIN` explícito em `/marcas`) — trivial, pode entrar
   junto com o #1 ou #2.
4. **Débito #4** (duplicação `CadastroPublicoController`/`ParceiraController`) — cosmético, sem urgência.
5. **Débito #3** (`GESTOR_MARCA` órfão) — só relevante quando o roadmap de
   produto chegar na fase que ativaria esse papel.
