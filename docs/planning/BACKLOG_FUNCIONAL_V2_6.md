# BACKLOG FUNCIONAL — TEAR V2.6

**Autor:** Product Architect (sessão de planejamento pós Go-Live)
**Data:** 2026-07-21
**Sistema-alvo:** `tear-v2-app` (Laravel 12 + Sanctum + Spatie Permission /
React 19 + Vite + TypeScript) — o sistema em preparação para produção
(**APTO PARA GO-LIVE COM RESSALVAS**, pendências exclusivamente de
infraestrutura — ver `docs/release/GATE_FINAL_GO_LIVE.md`).

Este documento **não propõe implementação**. Nenhum item aqui foi
desenhado em nível de tarefa técnica — isso é trabalho de uma SPEC/ADR
futura, por item, quando priorizado.

---

# Objetivo

Organizar, num único lugar, todas as funcionalidades futuras cogitadas para
o TEAR depois do Go-Live do MVP — o que falta, o que é evolução, e o que é
apenas direção ainda não decidida. Cada item é classificado por prioridade
(MUST/SHOULD/COULD/FUTURE) e descrito com impacto, módulos, alterações de
dados/backend/frontend, dependências e riscos, para que o responsável do
projeto possa priorizar sem precisar reabrir o código a cada dúvida.

Este documento assume o **estado real do código em 2026-07-21** (verificado
por leitura de migrations/models/controllers de `tear-v2-app`, não apenas
por documentação) como ponto de partida — vários itens pedidos pelo
solicitante já estão parcial ou totalmente implementados; isso é registrado
explicitamente em cada seção para não duplicar trabalho já feito.

---

# Critérios

- **MUST** — lacuna que afeta a operação básica já validada no Go-Live ou
  regra de negócio já assumida como obrigatória (herdada do V1/PRD) e ainda
  sem cobertura no `tear-v2-app`.
- **SHOULD** — evolução de valor claro, sem a qual o produto funciona, mas
  fica aquém do que já foi prometido/sinalizado ao usuário.
- **COULD** — melhoria de conveniência, sem impacto se ficar para depois.
- **FUTURE** — depende de uma decisão de produto ou de integração externa
  ainda não definida; não deve ser estimado nem desenhado antes dessa
  decisão.

Cada item traz: descrição, objetivo, impacto, módulos envolvidos,
alterações de banco, alterações backend, alterações frontend, dependências
e riscos.

---

## Contratos

### C-01 · Geração automática de contrato em PDF (motor de mesclagem/placeholders)
**Classificação:** MUST

- **Descrição:** gerar, para cada Parceira/Participação vigente, um
  documento de contrato em PDF preenchido automaticamente (razão social,
  CPF/CNPJ, endereço, quantidades/valor contratados, prazo/canais de uso de
  imagem, cidade/data), equivalente em resultado ao job AutoCrat do V1
  (RN-15, PRD §5.7/§6.7), mas nativo do `tear-v2-app` (sem depender de
  Google Docs/AutoCrat).
- **Objetivo:** eliminar a geração manual/paralela de contrato e ter o
  documento gerado a partir do mesmo dado que já vive em Postgres
  (Parceira + ParticipacaoNaCampanha), sem duplicar cadastro em outro
  sistema.
- **Impacto:** alto — hoje a tela "Documentos" do admin é um
  `PlaceholderPage` (confirmado em código, sem implementação); não existe
  nenhuma geração de contrato no `tear-v2-app`.
- **Módulos envolvidos:** Contratos (novo), Cadastro, Campanhas.
- **Alterações de banco:** nova tabela `contratos` (ou `documentos`
  genérica reaproveitável por C-02) — participação/parceira, template
  usado, caminho/hash do PDF gerado, timestamps; sem PII duplicada além da
  já existente em `parceiras`.
- **Alterações backend:** serviço de composição de PDF (ex.:
  `dompdf`/`browsershot`/template Blade), `ContratoController`, policy por
  papel (ADMIN gera/consulta).
- **Alterações frontend:** nenhuma nesta entrega — expõe a API de geração/
  consulta de contrato; a substituição da tela "Documentos" (hoje
  placeholder) por uma UI real é entregue em H-02, para não descrever a
  mesma tela em dois itens.
- **Dependências:** nenhuma externa obrigatória para a geração em si
  (Adobe entra só em C-02, assinatura). Internamente, sequenciar depois de
  CD-01 (suporte a CPF) — o template já deve prever CPF **ou** CNPJ desde o
  primeiro contrato gerado, para não reabrir o template logo depois de
  publicado; o roadmap V2.6 já lista CD-01 antes de C-01 por este motivo.
- **Riscos:** template de contrato jurídico não é decisão técnica — texto
  final precisa de validação do responsável do projeto/jurídico antes de
  virar template de produção.

### C-02 · Assinatura eletrônica via Adobe Acrobat Sign
**Classificação:** SHOULD

- **Descrição:** enviar o PDF gerado em C-01 para assinatura eletrônica via
  Adobe Acrobat Sign (API), acompanhando o status (enviado/assinado) até o
  documento assinado retornar e ser anexado ao registro do contrato.
- **Objetivo:** fechar o ciclo contratual dentro do sistema, sem depender
  de envio manual por e-mail/WhatsApp para assinatura fora do fluxo.
- **Impacto:** médio-alto — hoje a assinatura acontece inteiramente fora do
  sistema (PRD §5.7: "influenciadora assina/recebe, fora do sistema").
- **Módulos envolvidos:** Contratos.
- **Alterações de banco:** colunas/tabela de acompanhamento do envelope de
  assinatura (`status_assinatura`, `id_envelope_adobe`,
  `assinado_em`, URL do documento assinado).
- **Alterações backend:** integração com Adobe Acrobat Sign API (OAuth de
  conta de serviço), webhook/polling de status, job assíncrono.
- **Alterações frontend:** status de assinatura visível na tela de
  Documentos/Contrato; ação "enviar para assinatura".
- **Dependências:** C-01 (documento a assinar já precisa existir); conta
  Adobe Acrobat Sign com plano que suporte API (credencial/custo — decisão
  de negócio, não técnica).
- **Riscos:** custo recorrente de licença Adobe (contradiz preferência
  registrada de infraestrutura "sem custo recorrente" — ver memória
  `project_tear_v2_dual_system`/decisões de deploy Locaweb); confirmar com
  o responsável antes de comprometer.

### C-03 · Cadastro de Assessorias
**Classificação:** SHOULD

- **Descrição:** nova entidade `Assessoria` (agência que representa uma ou
  mais influenciadoras) — nome, contato, CNPJ, status ativa/inativa. Não
  existe hoje nenhum conceito de intermediário entre Marca e Parceira no
  domínio (nem no V1, nem no `tear-v2-app` — confirmado: `PRD.md` §2 trata
  a Influenciadora como parte direta, sem menção a agência/assessoria).
- **Objetivo:** refletir operação real em que parte das influenciadoras é
  representada por uma assessoria, para centralizar contato/pagamento por
  agência quando aplicável.
- **Impacto:** médio — não bloqueia nenhum fluxo hoje ativo; é expansão de
  modelo.
- **Módulos envolvidos:** Cadastro, Contratos.
- **Alterações de banco:** nova tabela `assessorias` (mesmo padrão de
  `marcas`: cadastro simples gerido por ADMIN).
- **Alterações backend:** `AssessoriaController`/FormRequests/Resource,
  policy `role:ADMIN`, mesmo padrão de `MarcaController`.
- **Alterações frontend:** `AssessoriasListPage`/`AssessoriaFormPage`,
  nav item novo no `AppShell`.
- **Dependências:** nenhuma.
- **Riscos:** regra de negócio ainda não definida — quem recebe o
  pagamento quando há assessoria (a influenciadora ou a assessoria)? Isso é
  uma decisão de produto pendente, não assumir sem confirmação (ver C-04).

### C-04 · Relacionamento Assessoria → Influenciadoras
**Classificação:** SHOULD (depende de C-03)

- **Descrição:** vínculo N:1 entre Parceira e Assessoria (uma Parceira pode
  ser representada por uma Assessoria; uma Assessoria representa várias
  Parceiras).
- **Objetivo:** permitir consultar/filtrar influenciadoras por assessoria e,
  no futuro, direcionar comunicação/documento à assessoria quando aplicável.
- **Impacto:** médio.
- **Módulos envolvidos:** Cadastro.
- **Alterações de banco:** `assessoria_id` nullable em `parceiras`
  (FK `restrictOnDelete`, mesmo padrão de integridade já usado em todas as
  tabelas do sistema — nunca apagar dados).
- **Alterações backend:** extensão de `ParceiraController`/Resource para
  aceitar/expor `assessoria_id`; filtro `GET /parceiras?assessoria_id=`.
- **Alterações frontend:** campo de seleção de Assessoria em
  `ParceiraFormPage`; coluna/filtro na listagem.
- **Dependências:** C-03.
- **Riscos:** se a regra de pagamento-por-assessoria (ver C-03) vier a ser
  exigida, este vínculo simples não basta — pode exigir campo de
  "responsável financeiro" na Participação/Pagamento; **não implementar
  isso sem decisão explícita do PO**, para não reabrir o modelo financeiro
  já validado em Go-Live.

---

## Cadastro

> **Já implementado — não duplicar:** CEP automático (`lib/cep.ts`, busca
> ViaCEP on-blur), máscaras de telefone/CNPJ/CEP (`lib/mascaras.ts`),
> validação de e-mail/telefone/CNPJ (`Rule` dedicadas `Telefone`/`Cnpj` em
> `StoreParceiraRequest`/`UpdateParceiraRequest`), consentimento LGPD
> **na edição de cadastro** (tabela `consentimentos`: parceira, usuário que
> confirmou, IP, timestamp — via `AtualizarCadastroComConsentimentoService`)
> e histórico de consentimentos (a própria tabela `consentimentos` já é o
> histórico, sem sobrescrita). Tudo confirmado por leitura direta do código
> em 2026-07-21, aplicado tanto no cadastro público quanto no Portal e no
> formulário administrativo.

### CD-01 · Suporte a CPF (pessoa física)
**Classificação:** MUST

- **Descrição:** hoje `parceiras` só tem coluna `cnpj` (nullable) — não
  existe campo `cpf` em nenhuma migration, model ou request. O V1 também
  era CNPJ-only (RN-16: senha = 5 primeiros dígitos do CNPJ), mas boa parte
  das influenciadoras reais opera como pessoa física, não PJ.
- **Objetivo:** permitir cadastrar/validar influenciadoras sem CNPJ.
- **Impacto:** alto — sem isso, toda influenciadora sem CNPJ formal fica
  fora do cadastro ou precisa de gambiarra de dado (CNPJ fictício).
- **Módulos envolvidos:** Cadastro, Contratos (contrato precisa citar
  CPF **ou** CNPJ, exclusivamente um dos dois).
- **Alterações de banco:** coluna `cpf` nullable em `parceiras`; constraint
  de aplicação (não de banco) garantindo que exatamente um de `cpf`/`cnpj`
  esteja preenchido.
- **Alterações backend:** `Rule` nova `Cpf` (mesmo padrão de `Cnpj`),
  ajuste em `StoreParceiraRequest`/`UpdateParceiraRequest`
  (`required_without:cnpj`/`prohibited_if`).
- **Alterações frontend:** campo CPF com máscara em
  `PublicCadastroPage`/`ParceiraFormPage`/`PortalPerfilPage`, alternância
  PF/PJ.
- **Dependências:** nenhuma.
- **Riscos:** RN-16 do V1 (senha derivada do CNPJ) não se aplica mais no
  `tear-v2-app` (autenticação já é e-mail/senha própria, SPEC-035 é só do
  sistema GAS) — não há conflito real, apenas confirmar que nenhuma rotina
  nova assuma CNPJ sempre presente.

### CD-02 · Consentimento LGPD no cadastro público inicial
**Classificação:** MUST
**Status (2026-07-22):** ✅ implementado — commit `e0756c0`, consolidação documental
pós-merge `worktree-spec-mvp-completa` (ver `docs/_workspace/TASK_ROUTER.md` §16).

- **Descrição:** o consentimento já implementado (`consentimentos`) só é
  capturado no fluxo de **edição** (`PATCH /parceiras/{id}` via
  `AtualizarCadastroComConsentimentoService`) — confirmado por grep: nem
  `CadastroPublicoController` nem `StoreParceiraRequest` fazem qualquer
  menção a consentimento. Ou seja, o primeiro registro de uma influenciadora
  (cadastro público) hoje nasce **sem** consentimento LGPD coletado.
- **Objetivo:** fechar a lacuna — capturar consentimento explícito também
  no primeiro cadastro, não só nas edições subsequentes.
- **Impacto:** alto — risco de compliance: dado pessoal sendo coletado sem
  consentimento no ponto de entrada do sistema.
- **Módulos envolvidos:** Cadastro.
- **Alterações de banco:** nenhuma nova — reaproveita `consentimentos`.
- **Alterações backend:** `CadastroPublicoController` passa a exigir
  `consentimento_aceito` (mesma regra `required|accepted` já usada em
  `UpdateParceiraRequest`) e a gravar em `consentimentos` no mesmo insere
  da Parceira.
- **Alterações frontend:** checkbox de consentimento em
  `PublicCadastroPage` (mesmo componente já usado em
  `PortalPerfilPage`/`ParceiraFormPage`).
- **Dependências:** nenhuma.
- **Riscos:** baixo — é fechamento de um padrão já existente, não desenho
  novo.

### CD-03 · Auditoria de cobertura de validação nas telas administrativas
**Classificação:** COULD

- **Descrição:** confirmar que toda tela que grava CPF/CNPJ/telefone/e-mail
  (incluindo eventuais telas futuras) usa as mesmas `Rule`s centralizadas,
  evitando duplicar regex de validação em mais de um lugar.
- **Objetivo:** prevenir divergência de validação entre cadastro público,
  Portal e admin.
- **Impacto:** baixo hoje (as três telas already confirmadas consistentes
  em 2026-07-21) — item de manutenção preventiva, não bug ativo.
- **Módulos envolvidos:** Cadastro.
- **Alterações de banco:** nenhuma.
- **Alterações backend/frontend:** nenhuma planejada — apenas checklist de
  revisão a aplicar quando um novo formulário for criado.
- **Dependências:** nenhuma.
- **Riscos:** nenhum.

---

## Perfil Influenciadora

> **Estado atual:** `medidas_influenciadora` já existe com `sutia_tamanho`,
> `sutia_numeracao`, `sutia_taca`, `calcinha_tamanho`, `linha_noite_tamanho`
> (todos enum `P/M/G/GG` ou numeração), gerido por `MedidaController` e
> exposto no Portal (`PortalPerfilPage`, "medidas versionadas").

### PI-01 · Ampliação de medidas (tamanhos adicionais)
**Classificação:** SHOULD

- **Descrição:** avaliar e adicionar os "demais tamanhos necessários" que o
  solicitante sinalizou como pendentes — ex.: calçado, tamanho geral de
  peça de vestuário (quando não coberto pelas 3 categorias já existentes),
  outras categorias de produto Jescri que venham a ser comercializadas.
- **Objetivo:** garantir que a ficha de medidas cubra todo o catálogo atual
  antes de precisar improvisar em campo livre.
- **Impacto:** médio — hoje limitado a 3 categorias específicas.
- **Módulos envolvidos:** Perfil Influenciadora, Escolha de Looks (medidas
  ajudam a validar se o tamanho pedido no look é compatível).
- **Alterações de banco:** colunas novas em `medidas_influenciadora`
  (aditivas, nullable) ou nova tabela `medidas_adicionais` se o conjunto de
  categorias for dinâmico (decisão a tomar na SPEC).
- **Alterações backend:** extensão de `StoreMedidaRequest`/Resource.
- **Alterações frontend:** campos novos em `PortalPerfilPage`.
- **Dependências:** **pendência explícita de decisão do PO** — quais
  categorias exatas de tamanho faltam não está definido em nenhuma fonte
  lida (PRD não lista, pedido do solicitante é genérico ["demais tamanhos
  necessários"]); precisa de lista fechada antes de virar SPEC.
- **Riscos:** sem essa lista fechada, qualquer estimativa é arbitrária.

### PI-02 · Área de envio de métricas do perfil sob demanda
**Classificação:** COULD

- **Descrição:** tela/fluxo para a influenciadora enviar métricas do seu
  perfil (ex.: prints de alcance/engajamento do Instagram/TikTok) quando
  solicitado pela equipe — sob demanda, não recorrente automático.
- **Objetivo:** dar à equipe visibilidade de performance da influenciadora
  sem depender de pedir por WhatsApp.
- **Impacto:** baixo-médio — não existe hoje nenhum conceito de "métrica de
  perfil" no domínio (nem V1, nem `tear-v2-app`); é funcionalidade nova.
- **Módulos envolvidos:** Perfil Influenciadora.
- **Alterações de banco:** nova tabela `metricas_perfil` (parceira,
  arquivo/print ou valores numéricos, data de referência, solicitado_em).
- **Alterações backend:** `MetricaPerfilController`, reaproveitando o
  mesmo padrão de upload já usado em Material (Drive).
- **Alterações frontend:** aba "Métricas" em `PortalPerfilPage` + gatilho
  administrativo "solicitar métricas".
- **Dependências:** Google Drive configurado (mesma dependência já
  existente para upload de Material).
- **Riscos:** escopo de "quais métricas" e "que formato" não está definido
  — tratar como descoberta antes de estimar.

---

## Campanhas

> **Já implementado — nenhuma ação necessária:** "influenciadora deve
> visualizar apenas campanhas em que participa" já está em produção desde
> o Módulo Campanhas (2026-07-20) — `CampanhaController::index` filtra por
> `whereHas('participacoes', parceira_id = user.parceira.id AND status
> ATIVA)` quando o papel não é ADMIN, reaproveitado sem alteração pelo
> Portal (Sprint 2.2). Isolamento coberto por teste automatizado
> (`PortalIsolamentoTest`, 2026-07-21) para campanha, briefing e pagamento
> de participação alheia (403 confirmado). Não há gap a registrar aqui.

---

## Histórico

### H-01 · Importação do histórico da planilha Google (V1) para PostgreSQL
**Classificação:** SHOULD

- **Descrição:** avaliar e, se aprovado, executar a importação **pontual**
  (não uma sincronização contínua) das abas de histórico do V1 —
  `HISTÓRICO DE CONTEÚDOS`, `HISTÓRICO DE PAGAMENTOS`, `HISTÓRICO
  LOGÍSTICO` (PRD §8, entidade "Histórico") — para tabelas equivalentes no
  Postgres do `tear-v2-app`. Consulta em tempo real à planilha **não** deve
  ser implementada (requisito explícito do solicitante).
- **Objetivo:** preservar o histórico de continuidade do programa Jescri
  sem manter dependência operacional da planilha legada.
- **Impacto:** médio — não bloqueia operação nova (que já é 100%
  Postgres), mas sem isso a influenciadora/equipe perde visão de tudo que
  aconteceu antes do Go-Live do `tear-v2-app`.
- **Módulos envolvidos:** Histórico (novo no `tear-v2-app` — hoje a tela
  "Documentos/Histórico" do admin é `PlaceholderPage`, confirmado sem
  implementação nem teste).
- **Alterações de banco:** tabelas novas de histórico (conteúdo/pagamento/
  logística arquivados), desenhadas para os dados já existentes de
  Campanha/Participação — não necessariamente 1:1 com o schema V1
  (`MES_REFERENCIA`/`ANO_REFERENCIA` do V1 não existem no modelo novo, que
  usa `data_inicio`/`data_fim` livres de Campanha).
- **Alterações backend:** job/comando artisan de importação one-time (lido
  da planilha via API do Sheets ou de export CSV — a decidir), idempotente
  (mesmo padrão já usado em `importarBaseLegada` do sistema GAS, SPEC-003,
  que pode servir de referência de abordagem, não de código reaproveitável
  entre stacks diferentes).
- **Alterações frontend:** nenhuma nesta entrega — a exibição desses dados
  é incorporada à tela de Documentos/Histórico entregue em H-02, como
  extensão incremental (ver nota de sequenciamento em H-02).
- **Dependências:** acesso de leitura à planilha V1 (credencial/API do
  Google Sheets); mapeamento de campo V1→V2 (parte não é 1:1, precisa de
  spec própria de mapeamento antes de codar).
- **Riscos:** dado do V1 pode ter inconsistências nunca validadas contra
  regra nova (ex.: influenciadora sem Parceira correspondente no V2); é
  trabalho de dado histórico, não de produto ativo — baixo risco
  operacional se adiado.

### H-02 · Implementação da tela "Documentos/Histórico" do admin (hoje placeholder)
**Classificação:** MUST

- **Descrição:** a tela existe na navegação mas é um `PlaceholderPage` sem
  nenhuma funcionalidade real (confirmado na auditoria de cobertura de
  testes de 2026-07-21: "Documentos e Perfil (admin) sem teste porque são
  PlaceholderPage ainda não implementadas").
- **Objetivo:** dar à equipe um lugar real para consultar documentos
  gerados (C-01/C-02) — hoje esse link na navegação não leva a nada
  funcional.
- **Impacto:** médio-alto — item de navegação visível em produção sem
  função; gera expectativa quebrada no dia a dia da equipe.
- **Módulos envolvidos:** Contratos, Histórico.
- **Alterações de banco:** nenhuma isolada — depende do que C-01 entregar;
  H-01 acrescenta dado próprio quando chegar (ver nota de sequenciamento
  abaixo).
- **Alterações backend/frontend:** substituir o placeholder por consumo
  real da API de C-01 (documentos/contratos). Quando H-01 for entregue
  (V3.0), a mesma tela ganha uma aba de Histórico consumindo a API daquele
  item — extensão aditiva, sem retrabalho da tela já publicada.
- **Dependências:** C-01 é dependência obrigatória (sem contrato gerado,
  não há o que exibir nesta versão). H-01 **não** é pré-requisito — está
  sequenciado para V3.0, depois deste item (V2.7), justamente porque a
  importação histórica é execução pontual de menor urgência (ver Riscos de
  H-01); a tela nasce em V2.7 só com Contratos e ganha Histórico depois.
- **Riscos:** se C-01 for adiado, esta tela deve seguir como placeholder
  explícito (não esconder a lacuna) — confirmar com o PO se isso é
  aceitável para o MVP do V2.6 ou deve entrar já nesta versão.

---

## Briefings

### B-01 · Arquitetura formal de Briefing por formato (datas e cálculo automático de aprovação)
**Classificação:** MUST
**Status (2026-07-22):** ✅ implementado — commit `6709ee7` (HU-2.1/P0-5), consolidação
documental pós-merge `worktree-spec-mvp-completa` (ver `docs/_workspace/TASK_ROUTER.md` §16).

- **Descrição:** hoje `Briefing` é 1 registro por `tipo` (FEED, etc.) com
  um único campo `prazo` (data), campo livre `referencias` (JSON) e
  `observacoes`/`entregaveis_esperados` em texto — sem separar "data de
  entrega do material" de "data de postagem", e **sem** o cálculo
  automático da data de aprovação interna que o V1 já validava (RN-04:
  7 dias antes da postagem, +3 dias se cair numa sexta, +2 se sábado, +1
  se domingo). O Briefing também não tem nenhum campo de status/workflow
  próprio — é só texto instrutivo estático ligado à Participação; o estado
  de produção real vive inteiramente em `Material` (`PENDENTE`→aprovado).
- **Objetivo:** decidir e desenhar a arquitetura de Briefing que o V2.6
  deve seguir daqui para frente — se o modelo atual (simples, 1 registro
  por tipo) é suficiente com só os 2 campos de data adicionados, ou se
  precisa de um fluxo de estados próprio (rascunho → publicado → em
  ajuste), replicando o que o V1 já validava.
- **Impacto:** alto — é regra de negócio já validada no V1 (RN-04) e ainda
  não portada; sem ela, a equipe calcula a data de aprovação manualmente.
- **Módulos envolvidos:** Briefings, Campanhas, Conteúdo/Material.
- **Alterações de banco:** `data_entrega`/`data_postagem` substituindo ou
  complementando `prazo`; coluna calculada ou calculada em runtime
  `data_aprovacao_interna`.
- **Alterações backend:** serviço `CalculadoraDeDataDeAprovacao` (porta
  direta da regra RN-04, já teste-por-teste no V1 GAS —
  `Código.js:317-345`, reaproveitável como especificação, não como
  código); validação de que `data_postagem >= data_entrega`.
- **Alterações frontend:** campos separados em `BriefingFormPage`, data de
  aprovação exibida como somente-leitura calculada.
- **Dependências:** nenhuma técnica — é definição de arquitetura, não
  integração externa.
- **Riscos:** se o fluxo de estados também for exigido (não só as datas),
  o escopo cresce — **este item deve ser desenhado como SPEC própria antes
  de estimar**, exatamente como o solicitante pediu ("projetar
  arquitetura... definir fluxo", não implementar agora).

---

## Escolha de Looks

### L-01 · Identificação automática de produto por URL colada
**Classificação:** FUTURE

- **Descrição:** influenciadora cola a URL do produto (loja Jescri) e o
  sistema identifica automaticamente foto principal, nome comercial, cor,
  SKU e variante — evitando usar o nome otimizado para SEO quando um nome
  comercial mais claro estiver disponível.
- **Objetivo:** eliminar digitação manual de referência de produto no
  fluxo de escolha de look, hoje inexistente em qualquer forma no
  `tear-v2-app` (Briefing só tem campo livre `referencias` JSON, sem
  nenhuma estrutura de produto/catálogo).
- **Impacto:** alto se aprovado — mas depende inteiramente de uma decisão
  externa ainda não tomada.
- **Módulos envolvidos:** Escolha de Looks (novo), Briefings, Permutas,
  Logística (todos consomem o produto identificado aqui).
- **Alterações de banco:** nova tabela `produtos_look` (ou similar): url
  de origem, foto principal, nome comercial, cor, SKU, `variant_id`,
  vinculado à Participação/Briefing.
- **Alterações backend:** serviço de identificação de produto — via
  scraping de metatags Open Graph/JSON-LD da página, **ou** via API do
  motor de e-commerce (se existir e for exposta), a depender da plataforma
  real da loja Jescri.
- **Alterações frontend:** campo "colar URL do produto" na tela de
  Briefing/Look, preview do produto identificado antes de confirmar.
- **Dependências:** **pendência de decisão do PO/descoberta técnica** —
  qual é a plataforma de e-commerce da Jescri (Locaweb/Tray/VTEX/Shopify?)
  e se ela expõe API ou só HTML renderizado (scraping é mais frágil,
  quebra a cada redesign da loja). Nenhuma fonte lida (PRD, TASK_ROUTER,
  HANDOFF) confirma a plataforma — **não estimar sem essa resposta**.
- **Riscos:** se for scraping de HTML sem API, é uma integração frágil por
  natureza (quebra sem aviso a cada mudança de layout da loja) — deixar
  isso explícito ao PO antes de comprometer prazo.

### L-02 · Validação obrigatória de variant_id
**Classificação:** MUST (condicionado a L-01)

- **Descrição:** nenhum look pode ser salvo sem um `variant_id` resolvido
  — nunca aceitar o produto "base" sem variante definida (cor+tamanho
  específicos), para não gerar ambiguidade na hora de gerar a ficha de
  retirada (ver Logística).
- **Objetivo:** garantir que a informação que chega à Logística seja
  sempre acionável (sem "qual variante exatamente?" pendente).
- **Impacto:** alto — é a regra de integridade que sustenta toda a cadeia
  Looks→Permutas→Logística.
- **Módulos envolvidos:** Escolha de Looks, Logística.
- **Alterações de banco:** `variant_id` `NOT NULL` na tabela de L-01 (ou
  constraint de aplicação equivalente, se o variant puder ser resolvido em
  etapa posterior ao registro inicial).
- **Alterações backend:** validação na gravação do look — rejeitar
  produto sem variante.
- **Alterações frontend:** UI não permite confirmar o look sem variante
  selecionada (ex.: cor e tamanho obrigatórios se o produto tiver mais de
  uma variante).
- **Dependências:** L-01 (não existe variant_id para validar sem a
  identificação automática existir primeiro).
- **Riscos:** nenhum adicional além dos já listados em L-01.

---

## Permutas

### PM-01 · Janela de escolha e bloqueio de alterações após o prazo
**Classificação:** SHOULD

- **Descrição:** definir uma data-limite (por Campanha ou por
  Participação) até a qual a influenciadora pode escolher/alterar seu
  look; após essa data, bloquear qualquer alteração.
- **Objetivo:** dar previsibilidade à logística de envio — sem prazo
  fechado, o envio físico nunca pode ser disparado com segurança.
- **Impacto:** médio-alto, mas **hoje não existe nenhuma entidade
  "Permuta"** no domínio — nem no V1 (fora de escopo confirmado, PRD §12:
  "fluxo de negociação/recusa de briefing ou de looks pela influenciadora"
  não existe no sistema atual) nem no `tear-v2-app`. É conceito
  inteiramente novo.
- **Módulos envolvidos:** Permutas (novo), Escolha de Looks, Logística.
- **Alterações de banco:** campo `prazo_escolha` na entidade que guarda o
  look (L-01) ou na Participação; flag/estado de bloqueio.
- **Alterações backend:** validação de escrita rejeitando alteração após
  `prazo_escolha`; job/checagem de expiração.
- **Alterações frontend:** contagem regressiva/aviso na tela de escolha de
  look; UI somente-leitura após o prazo.
- **Dependências:** L-01/L-02 (não há o que travar sem a escolha de look
  existir primeiro).
- **Riscos:** **"Permuta" como nome de conceito precisa de definição do
  PO** — é a mesma coisa que "Escolha de Looks" com prazo, ou é uma
  entidade distinta (ex.: troca de um produto já escolhido por outro,
  dentro de uma janela)? O pedido original lista os dois como seções
  separadas sem detalhar a diferença — **não presumir**; esclarecer antes
  de abrir SPEC.

---

## Logística

### LG-01 · Modelagem de envio físico + geração automática de ficha de retirada
**Classificação:** MUST

- **Descrição:** o `tear-v2-app` **não tem nenhuma entidade de logística/
  envio físico hoje** — `Material` é conteúdo digital (upload de
  arquivo), não produto físico. O V1 (GAS) tinha esse módulo completo
  (RN-13/RN-14, PRD §6.5/§5.5: confirmação de endereço, rastreio,
  arquivamento ao entregar) mas ele nunca foi portado para o
  `tear-v2-app`. Este item cobre a modelagem básica de Envio + a geração
  automática de uma "ficha de retirada" com foto, referência, SKU, cor,
  tamanho, endereço e influenciadora.
- **Objetivo:** permitir que a equipe opere o envio físico do produto
  dentro do mesmo sistema que já controla campanha/briefing/pagamento, sem
  depender de planilha ou WhatsApp para a parte logística.
- **Impacto:** alto — é um módulo inteiro do domínio original (PRD §6.5)
  ainda ausente no sistema em produção.
- **Módulos envolvidos:** Logística (novo), Escolha de Looks (fonte de
  SKU/cor/variante), Cadastro (endereço já existente na Parceira).
- **Alterações de banco:** nova tabela `envios` (participação, endereço
  resolvido no momento do envio — snapshot, não referência viva, para não
  quebrar histórico se o endereço mudar depois —, status, código de
  rastreio opcional). Foto/referência/SKU/cor/tamanho da ficha **não são
  colunas novas** — são lidos de `produtos_look` (L-01) no momento da
  geração; a ficha em si é um PDF/print gerado on-the-fly a partir de
  Envio+Look, sem tabela própria.
- **Alterações backend:** `EnvioController`, geração de ficha (reaproveita
  motor de PDF de C-01, se já existir nessa altura do roadmap), policy por
  papel (ADMIN opera, Influenciadora só confirma endereço/consulta status).
- **Alterações frontend:** tela de Logística no admin (lista de envios,
  ação "gerar ficha", registrar rastreio); indicador de status no Portal.
- **Dependências:** Escolha de Looks (L-01/L-02) para ter SKU/cor/tamanho
  confiáveis — sem isso, a ficha nasce com dado incompleto/manual.
- **Riscos:** se implementado antes de L-01/L-02 estarem prontos, a ficha
  de retirada nasce sem SKU/variante confiável, reabrindo o mesmo
  problema que motivou L-02 — **respeitar a ordem de dependência no
  roadmap**.

---

# Roadmap sugerido de implementação por versões

> Sequenciamento por dependência técnica e por risco — itens que dependem
> de decisão externa/PO (marcados FUTURE ou com pendência explícita) foram
> posicionados depois dos itens que só dependem de trabalho interno.

## V2.6 — Fechamento de lacunas do MVP já em produção
Prioridade: itens MUST de baixo risco e sem dependência externa, que
fecham compromissos já assumidos (LGPD, cadastro, Go-Live).
- CD-01 · Suporte a CPF
- CD-02 · Consentimento LGPD no cadastro público inicial
- B-01 · Arquitetura formal de Briefing (datas + cálculo de aprovação RN-04)
- C-01 · Geração automática de contrato em PDF

## V2.7 — Documentos, agências e histórico
Depende de C-01 já existir; introduz conceitos novos de baixo risco
(Assessoria) e resolve a dívida de navegação (placeholder).
- H-02 · Tela "Documentos/Histórico" deixa de ser placeholder
- C-03 · Cadastro de Assessorias
- C-04 · Relacionamento Assessoria → Influenciadoras
- C-02 · Assinatura eletrônica via Adobe Acrobat Sign (sujeito à decisão de
  custo recorrente — ver risco registrado em C-02)
- PI-01 · Ampliação de medidas (sujeito a lista fechada do PO)

## V2.8 — Looks, Permutas e Logística (cadeia dependente)
Bloco que só faz sentido em conjunto — depende de decisão externa sobre
plataforma de e-commerce (L-01) antes de iniciar.
- L-01 · Identificação automática de produto por URL (spike de descoberta
  primeiro — plataforma de e-commerce da Jescri)
- L-02 · Validação obrigatória de variant_id
- PM-01 · Janela de escolha e bloqueio de Permutas (sujeito a esclarecer o
  conceito junto ao PO)
- LG-01 · Modelagem de Logística + ficha de retirada

## V3.0 — Consolidação de dados históricos e conveniências finais
Itens de menor urgência operacional ou que dependem de execução pontual
(não recorrente).
- H-01 · Importação efetiva do histórico do V1 para PostgreSQL
- PI-02 · Área de envio de métricas do perfil sob demanda
- CD-03 · Auditoria de cobertura de validação (manutenção preventiva)
- Débitos já conhecidos e registrados no `TASK_ROUTER.md` §15 (papel
  `GESTOR_MARCA` sem autorização real; deliverables TikTok/UGC
  parcialmente implementados) — candidatos naturais a entrar aqui se a
  operação decidir ativá-los.

---

*Todo item marcado com pendência de decisão do PO (PI-01, L-01, PM-01, e o
risco de custo em C-02) deve ser resolvido antes de virar SPEC — este
documento organiza e prioriza, não decide no lugar do responsável do
projeto.*
