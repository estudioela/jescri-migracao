# TEAR V2.5 — Roadmap de Produtização

Data: 2026-07-20
Autor: sessão Tech Lead / Product / Arquitetura (agente), a pedido do
responsável do projeto.
Escopo: `tear-v2-app/` (Laravel 13 + React/Vite). Este documento **não**
toca no Portal legado GAS (`src/`) nem no seu domínio soberano
(`CONTRATO_SOBERANO.md`) — são sistemas e trilhas de decisão separadas.
Nenhuma decisão aqui reabre esse domínio.

Documento de planejamento apenas. Nenhuma linha de código foi alterada
para produzi-lo. Fontes: `docs/planning/ROADMAP_MESTRE_TEAR_V2.md`,
`docs/reports/STATUS_MVP_OPERACIONAL_TEAR_V2.md`, `docs/reports/RELATORIO_QA_FUNCIONAL_MVP_TEAR_V2.md`
e leitura direta do código (`tear-v2-app/backend`, `tear-v2-app/frontend`)
nesta mesma sessão.

**Relação com `docs/planning/ROADMAP_MESTRE_TEAR_V2.md` Parte 2:** aquele documento
já traça uma evolução (Fase 0 a Fase 6) do MVP até migração de legado e
IA, mas não trata a hipótese SaaS/multi-tenant em nenhum momento — assume
implicitamente uma única operação (a da Elã). Este documento **não
substitui** aquele; **adiciona a lente de produtização/SaaS** que faltava
e reorganiza as fases seguintes sob essa lente. Mapa de equivalência no
§3.5.

---

## 1. Diagnóstico atual

### O que já existe

Módulos funcionais ponta a ponta, validados manualmente e por 84 testes
automatizados (`docs/reports/RELATORIO_QA_FUNCIONAL_MVP_TEAR_V2.md`):
Parceiras (CRUD + aprovação de status), Marcas, Campanhas, Participações,
Briefings, Materiais (upload com fallback local — Drive real sem
credenciais), Aprovação de materiais, Pagamentos
(`PENDENTE → APROVADO → PAGO`).

Arquitetura: Laravel 13 + Sanctum (sessão via cookie, mesma origem) +
Spatie Permission (RBAC baseado em papel) no backend; React 19 + Vite +
React Router no frontend; SQLite em desenvolvimento; upload de mídia via
`Storage` (abstração já agnóstica — hoje disco local, Google Drive real
implementado em código mas sem credenciais).

### O que está estável

- Núcleo de operação (cadastro → pagamento) sólido, testado, sem bug
  estrutural conhecido.
- Padrão de Form Requests consistente em todos os módulos (frontend e
  backend exigem os mesmos campos obrigatórios — auditado nesta sessão).
- Camada de API RESTful coerente (rotas/controllers/resources), fácil de
  estender por convenção.
- Pipeline de qualidade local funcional (testes, Pint, lint, build) —
  falta só CI automatizado (não avaliado neste documento, é item de
  engenharia, não de produto).

### O que falta para virar produto (lacunas estruturais, não bugs)

1. **Nenhuma superfície de acesso para quem não é ADMIN.** O papel
   `INFLUENCIADORA` existe na tabela de papéis (seed de desenvolvimento),
   mas não há tela, rota ou fluxo de login pensado para esse papel. A
   influenciadora hoje só existe como registro de dado (`Parceira`), nunca
   como usuário autenticado.
2. **O vínculo entre `User` (quem loga) e `Parceira` (quem é o
   negócio) existe no schema mas está morto.** A tabela `parceiras` já
   tem `user_id` (FK nullable) e o Eloquent já declara
   `Parceira::belongsTo(User::class)` — mas nenhum controller, nenhum
   fluxo de cadastro público e nenhum login preenche ou lê essa coluna
   hoje. É scaffold esquecido, não feature pronta.
3. **RBAC de leitura não existe.** Toda rota de escrita exige
   `role:ADMIN`; toda rota de leitura (`GET`) só exige `auth:sanctum` —
   qualquer usuário autenticado, de qualquer papel, lê qualquer dado do
   sistema inteiro. Achado já registrado no QA funcional, não corrigido
   até aqui por estar fora do escopo daquela sessão.
4. **Nenhum conceito de organização/tenant.** Todas as tabelas de negócio
   (`marcas`, `campanhas`, `parceiras`, etc.) pressupõem uma única
   operação dona de tudo. Não há `organization_id` em lugar nenhum.
5. **Módulos anunciados no menu e ainda não implementados:** Logística,
   Documentos, Histórico, Perfil (hoje página placeholder por decisão
   própria — não é bug, é lacuna de escopo já registrada). Contratos e
   consentimento LGPD não existem em nenhuma camada.
6. **Sem automação, sem billing, sem planos.** Esperado nesta fase — não
   é lacuna crítica, é ausência de features que só fazem sentido depois
   das anteriores.

---

## 2. Diferença entre MVP e SaaS

| Dimensão | MVP atual (TEAR V2) | SaaS (TEAR futuro) |
|---|---|---|
| Quem opera | Um cliente principal (a operação da Elã), um papel real em uso (`ADMIN`) | Múltiplas organizações independentes, operando na mesma instância |
| Dado | Implicitamente de um único dono; nenhuma tabela isola por cliente | Isolado por organização em toda tabela de negócio; vazamento entre organizações é falha crítica de segurança, não só de UX |
| Usuários | Login único de equipe interna; influenciadora não é usuário, é registro | Cada organização tem seus próprios usuários (equipe interna + influenciadoras vinculadas), com RBAC aplicado por papel **e** por organização |
| Permissões | Papel controla o quê a UI mostra; leitura não é filtrada | Papel controla o quê; organização controla de quem — as duas dimensões precisam compor em toda query |
| Onboarding | Manual (equipe cria tudo via painel admin) | Autosserviço: nova organização se cadastra, provisiona seu próprio espaço sem intervenção humana |
| Cobrança | Não existe (custo interno) | Planos, limites de uso, cobrança recorrente, bloqueio por inadimplência |
| Operação | Uma instância, um banco, sem necessidade de escala horizontal | Precisa suportar N organizações crescendo de forma independente — índices, filas e armazenamento pensados para volume agregado, não para uma operação só |
| Suporte/observabilidade | Erros observados diretamente pela equipe que também desenvolve | Precisa de logging/alertas por organização — a equipe de produto não vai estar olhando por cima do ombro de cada cliente |

O ponto central: **SaaS não é "MVP com mais telas" — é o MVP com uma
dimensão nova (organização) atravessando toda decisão de dado, acesso e
cobrança.** Por isso a preparação SaaS (Fase 4) só faz sentido depois que
o produto provar valor operando maduro para pelo menos um cliente real
(o próprio uso interno da Elã já validado + a Experiência da
Influenciadora da Fase 1).

---

## 3. Roadmap TEAR V2.5

### Fase 1 — Experiência da Influenciadora

**Objetivo.** Dar à influenciadora um canal autenticado e próprio: login,
perfil, campanhas ativas, briefing, envio de material, histórico.

**Valor de negócio.** Elimina troca manual por WhatsApp/e-mail para
briefing e envio de material; cria trilha de auditoria de quem recebeu o
quê e quando; é pré-requisito de qualquer etapa futura que dependa da
influenciadora agir sozinha (escolha de permuta, assinatura de contrato).

**Alterações necessárias.**
- Ativar o vínculo `Parceira.user_id` hoje morto: decidir e implementar
  **quando** um `User` é criado para uma Parceira (no cadastro público? só
  na aprovação pelo ADMIN?) e como a credencial inicial é entregue (convite
  por e-mail é o padrão mais seguro; evitar senha provisória visível em
  tela).
- RBAC de leitura por papel **e por dono do registro**: uma influenciadora
  só pode ler/escrever os próprios dados (`participacoes`, `briefings`,
  `materiais` da própria `Parceira`). Isso não é feature nova de UI, é
  regra de autorização que precisa estar em toda query do backend, nunca
  só escondida no frontend.
- Novas rotas API "auto-escopadas" (ex.: `GET /me/participacoes` em vez de
  depender de o cliente nunca pedir um ID que não é seu).
- Frontend: área própria "Portal da Influenciadora", com layout e rotas
  distintas do `AppShell` administrativo atual (não reaproveitar as
  mesmas telas — os dados exibidos e as ações permitidas são diferentes).
- Fluxos mínimos: login, ver campanhas/participações ativas, ler
  briefing, enviar material, ver histórico de materiais/pagamentos
  próprios.

**Dependências.** Nenhuma SPEC bloqueante fora deste próprio módulo.
Tecnicamente depende de fechar o item 3 do diagnóstico (RBAC de leitura)
antes de expor qualquer rota nova ao papel `INFLUENCIADORA` — sem isso,
abrir login para influenciadora expõe todo o sistema a ela.

**Riscos.** Vazamento de dado entre parceiras se o escopo por usuário for
aplicado só em algumas rotas e esquecido em outras — o mesmo tipo de
lacuna já observado no MVP atual (RBAC ausente nas leituras). Mitigação:
tratar "toda query de Influenciadora filtra por `parceira_id` própria"
como regra de arquitetura obrigatória, testada com casos de duas
parceiras reais (uma nunca vê dado da outra), não como detalhe de
implementação.

**Critério de conclusão.** Uma influenciadora real loga, vê só as
próprias campanhas/briefings/materiais/pagamentos, envia material pelo
próprio portal, e existe teste automatizado de isolamento (duas parceiras
distintas, uma não acessa dado da outra nem por URL direta).

---

### Fase 2 — Operação interna completa

**Objetivo.** Preencher os módulos hoje placeholder que já têm demanda
operacional real e comprovada no legado: Logística (envio de produto/
permuta), Documentos (geração), Histórico (auditoria), Contratos.

**Valor de negócio.** Elimina a última dependência de planilha/Word/Drive
manual para essas etapas; cria rastreabilidade jurídica (contrato) e
operacional (logística) que hoje não existe em `tear-v2-app`.

**Alterações necessárias.**
- Modelo de produto/variante/permuta e ficha logística (peso, dimensão,
  transportadora), como já detalhado em `docs/planning/ROADMAP_MESTRE_TEAR_V2.md`
  Parte 2, Fase 3 — este documento não reescreve aquele desenho, só
  reordena sua entrada no roadmap geral.
- Templates de contrato, geração de PDF, integração com provedor de
  assinatura digital (decisão de fornecedor é do responsável do
  projeto/jurídico, não desta equipe técnica — ver `docs/planning/ROADMAP_MESTRE_TEAR_V2.md`
  Parte 2 §5).
- Histórico/auditoria como funcionalidade transversal (log de alteração
  por entidade), não como tela isolada.
- Consentimento LGPD explícito no cadastro/aprovação de Parceira, com
  timestamp e IP — dívida já sinalizada mas nunca implementada em nenhuma
  das duas tracks do projeto (GAS e `tear-v2-app`).

**Dependências.** Fase 1 concluída **apenas** onde a escolha de permuta
for feita pela própria influenciadora autenticada (se o fluxo de
logística desta fase mantiver a escolha manual pelo ADMIN, a dependência
cai). Decisão de escopo a confirmar com o responsável do projeto no início
desta fase — não decidir por omissão.

**Riscos.** Replicar o modelo do legado GAS célula-a-célula em vez de
reinterpretar como fluxo de negócio gera a mesma dívida que o próprio
roadmap mestre já evita conscientemente na V1→V2. Contratos sem revisão
jurídica prévia das cláusulas é risco legal, não só técnico.

**Critério de conclusão.** Operação cadastra produto, disponibiliza em
campanha, recebe escolha/confirmação de envio, gera ficha logística,
gera e envia contrato, tudo pela plataforma, sem sair para planilha ou
Word.

---

### Fase 3 — Inteligência operacional

**Objetivo.** Automações de alto valor sobre uma base já estruturada:
leitura de URL de produto (extração automática de dados de e-commerce),
geração assistida de documento, notificações operacionais.

**Valor de negócio.** Ganho de produtividade mensurável sobre um processo
que já funciona manualmente — não é feature especulativa, é aceleração do
que a Fase 2 já deixou funcionando.

**Alterações necessárias.** Fila de jobs real (a tabela `jobs` já existe
no schema Laravel padrão, mas nenhum worker/dispatch está em uso hoje —
este é o primeiro momento em que isso passa a ser necessário); serviço de
scraping/extração de URL; provedor de IA para normalização de dado
extraído; painel de revisão humana da extração (nunca aplicar
automaticamente sem confirmação, ao menos nesta fase).

**Dependências.** Fase 2 concluída — automatizar sobre dado de produto
ainda instável (schema mudando) amplifica erro em vez de eliminá-lo.

**Riscos.** Maior risco é de confiança: se a extração automática errar
silenciosamente e ninguém revisar, o erro se propaga para contrato/
logística. Mitigação: toda automação desta fase nasce com revisão humana
obrigatória antes de qualquer efeito colateral real; medir taxa de acerto
antes de remover a revisão.

**Critério de conclusão.** Pelo menos um fluxo de automação em produção,
com métrica de acerto acompanhada e reversível a qualquer momento.

---

### Fase 4 — Preparação SaaS

**Objetivo.** Transformar o mono-tenant implícito de hoje em multi-tenant
real: múltiplas organizações (agências/marcas de influência) operando
isoladas na mesma instância do TEAR.

**Valor de negócio.** Destrava vender o TEAR como produto para outras
operações, não só sustentar a da Elã — é o que efetivamente torna este um
SaaS, e não apenas um sistema interno bem-feito.

**Alterações necessárias.**
- Entidade raiz `organizations` (tenant); toda tabela de negócio hoje
  existente (`parceiras`, `marcas`, `campanhas`, `participacoes`,
  `briefings`, `materiais`, `pagamentos` — e as que a Fase 2 adicionar)
  ganha `organization_id` obrigatório.
- Usuários passam a pertencer a uma organização (`users.organization_id`
  ou tabela pivô, se um usuário puder pertencer a mais de uma — decisão a
  fechar antes da migration, não durante).
- Middleware/global scope de resolução de tenant aplicado a **toda**
  query, por padrão — nunca opt-in por controller (mesmo princípio de
  risco já citado na Fase 1 para RBAC: o que não é automático, alguém
  esquece).
- Billing: plano, limite de uso, integração com provedor de cobrança
  recorrente (ex.: Stripe), bloqueio/degradação por inadimplência.
- Onboarding autosserviço: nova organização se cadastra e provisiona seu
  próprio espaço sem intervenção da equipe TEAR.

**Dependências.** Fases 1–3 maduras em operação real — não migrar para um
modelo multi-tenant um sistema cujas regras de negócio (permuta, logística,
contrato) ainda estão mudando de forma. Mesmo argumento já usado no
domínio soberano: "migração é feature, não script solto"; aqui,
"multi-tenant é arquitetura, não parametrização de última hora".

**Riscos.** Maior risco técnico de todo o roadmap. Duas classes de erro
possíveis e caras de corrigir depois de haver clientes reais: (1)
vazamento de dado entre organizações (falha de segurança grave, não só de
produto); (2) escolha de modelo de isolamento errada para o volume real de
clientes (ver §6). Nenhuma linha de código desta fase deve ser escrita
antes de a decisão do §6 estar fechada por escrito.

**Critério de conclusão.** Uma segunda organização de teste opera na
mesma instância sem ver nenhum dado da primeira (validado por teste
automatizado de isolamento, não só inspeção manual); cobrança automatizada
funcional para pelo menos um plano; onboarding de nova organização sem
intervenção manual da equipe.

---

### 3.5 — Mapa de equivalência com `docs/planning/ROADMAP_MESTRE_TEAR_V2.md` Parte 2

| Este documento | Roadmap Mestre Parte 2 | Nota |
|---|---|---|
| Fase 1 — Experiência da Influenciadora | Fase 2 — Portal da Influenciadora | Mesmo objetivo; aqui antecipado e detalhado com o achado concreto do `user_id` morto |
| Fase 2 — Operação interna completa | Fase 3 (Produtos/Logística) + Fase 4 (Contratos) | Fundidas aqui por serem, ambas, "fechar lacuna operacional conhecida" — sem mudança de conteúdo |
| Fase 3 — Inteligência operacional | Fase 6 — Inteligência e Automações | Mesmo escopo, reordenada para logo após a Fase 2 fundida (o Roadmap Mestre também intercala Fase 5 = Migração do Legado, que este documento não cobre — ver nota abaixo) |
| Fase 4 — Preparação SaaS | **Não existe na Parte 2** | Extensão nova deste documento — a Parte 2 nunca assume multi-tenant |

**Nota sobre Migração do Legado:** a Fase 5 do Roadmap Mestre Parte 2
(migração de histórico do Google Sheets) não tem equivalente aqui porque
não é uma questão de produtização — é uma tarefa pontual de dado
histórico, independente da direção SaaS. Recomenda-se executá-la em
paralelo à Fase 2 ou 3 deste documento, no momento que fizer sentido
operacionalmente, sem depender de nenhuma fase daqui.

---

## 4. Priorização

**P0 — necessário antes de operar como produto (antes mesmo de pensar em SaaS):**
- RBAC de leitura por papel e por dono do registro (débito herdado do
  MVP; bloqueia qualquer papel novo com segurança).
- Ativar o vínculo `Parceira.user_id` (hoje scaffold morto) — pré-requisito
  técnico direto da Fase 1.
- Locale `pt_BR` nas mensagens de validação — pequeno, mas é o tipo de
  detalhe que sinaliza "produto acabado" vs. "MVP interno" (achado do QA
  funcional, `APP_LOCALE=en` hoje).
- Fase 1 completa (login/portal da Influenciadora).

**P1 — alto valor, não bloqueia uso como produto interno:**
- Fase 2 completa (Logística, Documentos, Contratos, LGPD).
- Consentimento LGPD explícito (poderia ser P0 se o jurídico exigir antes
  de expor qualquer dado da influenciadora pelo portal da Fase 1 — decisão
  a confirmar antes de iniciar a Fase 1, não depois).

**P2 — evolução futura:**
- Fase 3 completa (automação/IA).
- Fase 4 completa (multi-tenant/SaaS/billing).
- 2FA, dashboards analíticos avançados, integrações de comunicação
  (e-mail transacional, WhatsApp oficial).

---

## 5. Decisões arquiteturais futuras

**Banco de dados.** SQLite é adequado para desenvolvimento local, mas um
produto real (mesmo antes de multi-tenant, só pela concorrência de
múltiplos usuários simultâneos) pede Postgres. Isso **não é troca de
stack** — `DB_CONNECTION` já é configurável por ambiente em Laravel, é
troca de driver, sem impacto em código de aplicação. Recomendo Postgres
sobre MySQL pela robustez de constraints e suporte nativo a filtros
compostos (útil quando `organization_id` entrar em cena na Fase 4), mas
qualquer um dos dois atende. Migrar para produção **antes** da Fase 1 ir a
usuário real (concorrência de escrita do SQLite é o tipo de limite que
aparece exatamente quando duas influenciadoras enviam material ao mesmo
tempo).

**Autenticação.** Manter Laravel Sanctum. É o padrão para SPA de mesma
origem, já funciona, já está testado. Não há motivo técnico hoje para
trocar. Se o SaaS futuro (Fase 4) precisar de app mobile nativo ou domínio
próprio por organização, Sanctum já suporta emissão de token além de
sessão por cookie — não exige nova biblioteca, só nova configuração.

**Armazenamento.** Manter a abstração `Storage` do Laravel (já agnóstica
de provedor — hoje disco local, Drive real implementado mas sem
credenciais). Para o momento multi-tenant (Fase 4), avaliar migrar de
Google Drive (uma única credencial de service account, pasta
compartilhada) para um provedor S3-compatível (AWS S3 ou Cloudflare R2)
com prefixo/bucket por organização — Drive atende bem uma operação única,
mas não dá isolamento de acesso nativo por cliente quando houver mais de
um. **Não migrar agora** — só quando a Fase 4 estiver próxima; até lá, o
Drive real (quando configurado) resolve a operação atual sem nenhuma
mudança de código.

**Permissões.** Manter Spatie Permission (já instalado, baseado em
tabela, compatível com escopo por organização via global scope/policy
sem precisar de nova lib). O trabalho real não é trocar ferramenta, é
efetivamente aplicar RBAC de leitura (P0) e, na Fase 4, compor RBAC de
papel com RBAC de organização em toda policy.

**Estrutura multiempresa.** Recomendo **schema único compartilhado, com
coluna `organization_id` em toda tabela de negócio** (não schema-per-tenant,
não banco-per-tenant). É o padrão que menos aumenta complexidade
operacional (uma migration, um backup, um deploy) para o perfil de
cliente esperado (agências pequenas/médias, não grandes contas com
exigência regulatória de isolamento físico). Laravel global scopes
aplicam o filtro por organização automaticamente em toda query, reduzindo
o risco de esquecimento que preocupa mais nesta arquitetura. Reavaliar
para banco-per-tenant **somente** se algum cliente concreto exigir
isolamento físico de dado por contrato ou regulação — não antecipar essa
complexidade sem demanda real.

---

## 6. O que NÃO fazer

- **Não criar features sem validação de operação real** — mesmo princípio
  já em vigor no projeto ("não criar telas sem fluxo de negócio").
- **Não introduzir IA antes da Fase 2 concluída** — dado estruturado
  (produto, contrato) é pré-requisito de qualquer automação útil; IA sobre
  dado ainda instável amplifica erro em vez de eliminá-lo.
- **Não iniciar a Fase 4 (SaaS) antes das Fases 1–3 maduras em operação
  real.** Multi-tenant sobre um modelo de negócio ainda mudando de forma
  gera retrabalho caro (mesmo argumento do Roadmap Mestre para migração de
  legado).
- **Não trocar stack (Laravel/React) sem justificativa técnica
  concreta.** Nenhuma dor observada até aqui justifica essa troca; as
  únicas mudanças de infraestrutura recomendadas neste documento (banco,
  armazenamento) são trocas de configuração/driver, não de framework.
- **Não misturar este roadmap com o domínio soberano do Portal GAS
  legado** (`src/`, `CONTRATO_SOBERANO.md`, `TASK_ROUTER.md`). São
  sistemas, times de decisão e ritmos de evolução separados. Nenhuma
  decisão deste documento reabre esse domínio nem depende dele.
- **Não implementar multi-tenant "código primeiro, decisão depois".** A
  escolha de estrutura multiempresa (§5) precisa estar fechada por
  escrito antes da primeira migration da Fase 4 — reverter um schema
  multi-tenant depois de haver clientes reais nele é ordens de grandeza
  mais caro que decidir certo da primeira vez.
- **Não expor o papel `INFLUENCIADORA` (Fase 1) antes de o RBAC de
  leitura (P0) estar corrigido e testado.** Login funcional sem isolamento
  de leitura não é uma Fase 1 incompleta — é uma falha de segurança em
  produção.
