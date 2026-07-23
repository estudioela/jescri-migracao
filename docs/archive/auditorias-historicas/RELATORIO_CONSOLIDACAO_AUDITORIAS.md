# RELATÓRIO DE CONSOLIDAÇÃO DE AUDITORIAS EXTERNAS — ELÃ | influência

**Data:** 2026-07-22
**Papel:** Arquiteto Responsável do projeto, avaliando com autonomia técnica as
recomendações de três auditorias externas independentes sobre o plano
estratégico já auditado nesta sessão (`AUDITORIA_CLAUDE.md`).

**Documentos avaliados:**
- `ELA_Auditoria_Parte1_CPO.md` (persona CPO — produto/UX/GTM)
- `Auditoria Independente Completa_ ELÃ _ Influência.md` (Manus AI — meta-auditoria da due diligence anterior + propostas técnicas)
- `ELA_Auditoria_Parte2_Melhorias.md` (persona CPO — plano de melhorias e fluxo de trabalho)

**Método:** cada recomendação foi verificada contra o estado real do código
(`tear-v2-app/`) e contra os documentos oficiais do projeto
(`PLANO_MESTRE_ELA_INFLUENCIA.md`, as duas Entregas, `BACKLOG_FUNCIONAL_V2_6.md`,
`TASK_ROUTER.md`, `PRD.md`) **antes** de qualquer decisão de aceitar ou
implementar — para não retrabalhar o que já estava contemplado nem reabrir
decisões já tomadas sem justificativa nova.

---

## 1. Resumo Executivo

As três auditorias externas convergem, em grande parte, com a due diligence já
realizada nesta sessão (`AUDITORIA_CLAUDE.md`): reconhecem a maturidade
técnica do MVP, a disciplina de portões do plano, e apontam os mesmos dois
riscos mais graves — a lacuna de LGPD no cadastro público e a contradição
arquitetural Docker/Locaweb. Nesses dois pontos, que já tinham diagnóstico
técnico convergente e solução de baixo risco/alto valor, **implementei
diretamente** as correções.

Onde as auditorias (principalmente a persona CPO) propõem mudanças
estruturais — Portal da Marca com tenancy própria, self-service, billing,
autenticação por Magic Link, reestruturação em sprint de 30 dias — a decisão
técnica foi **rejeitar**. Não porque a crítica de UX/produto seja infundada,
mas porque essas propostas contradizem decisões já tomadas e registradas por
escrito (Marca sem tenant próprio é decisão de escopo do responsável do
projeto, não lacuna técnica), ou porque aceleram trabalho especulativo que o
próprio Plano Mestre já evita deliberadamente por boas razões (tenancy
implementada só depois de evidência real, não antes).

Um achado das auditorias — a branch órfã `worktree-spec-mvp-completa` — foi
investigado a fundo (zero conflitos confirmados, conteúdo de alto valor
confirmado) mas a integração em si **não foi executada**: é uma mudança
grande demais (16 commits, 1675 linhas, nova regra de negócio) para caber
dentro de uma tarefa de consolidação de auditoria, e a tentativa de merge foi
corretamente bloqueada pelo classificador de permissão do próprio harness.
Fica registrada como a ação de maior valor prático recomendada para a
próxima sessão dedicada.

Nenhuma decisão de negócio (preço, marca, INPI, CNPJ) foi tomada por mim —
essas seguem, corretamente, reservadas ao responsável do projeto, como o
próprio Plano Mestre já registra em sua tabela de decisões (§10).

---

## 2. Sugestões Aceitas

### A1 — Consentimento LGPD explícito no nascimento do dado (cadastro público)

- **Origem:** Manus AI (§10.2, achado crítico #1 de LGPD) e CPO (implícito, ao
  citar tenancy/dados como bloqueador). Convergente com a due diligence
  anterior (`AUDITORIA_CLAUDE.md` §9, risco #2) e com o item CD-02, já
  classificado MUST em `docs/planning/BACKLOG_FUNCIONAL_V2_6.md`.
- **Motivo da aceitação:** verificado no código, antes de qualquer edição,
  que `CadastroPublicoController::store` criava a `Parceira` sem nenhum gate
  de consentimento — só o fluxo de edição exigia `consentimento_aceito`.
  Como o sistema coleta dado sensível (medidas corporais, capturadas depois,
  já sob essa mesma Parceira), a lacuna era real e de baixo custo para
  fechar, sem mudança de schema destrutiva.
- **Decisão de design:** não reaproveitei a tabela `consentimentos` existente
  porque ela exige `user_id` (FK obrigatória a `users`) e, no momento do
  cadastro público, ainda não existe nenhum `User` vinculado à Parceira
  (`vincularUsuario()` só roda no primeiro acesso). Em vez de alterar o
  schema de `consentimentos` para tornar `user_id` opcional (o que
  enfraqueceria a garantia de autoria para o fluxo de edição autenticado),
  segui o padrão já estabelecido em `Parceira` (`aprovado_por`/`aprovado_em`,
  campos de auditoria dedicados fora do `fillable`, escritos por um método
  único) e criei `consentimento_cadastro_aceito_em`/`consentimento_cadastro_ip`
  diretamente na Parceira, com `registrarConsentimentoCadastro()` como único
  ponto de escrita.
- **Documentos/código alterados:**
  - `tear-v2-app/backend/database/migrations/2026_07_22_034958_add_consentimento_cadastro_to_parceiras_table.php` (novo, aditivo)
  - `tear-v2-app/backend/app/Models/Parceira.php`
  - `tear-v2-app/backend/app/Http/Requests/Parceira/StoreParceiraRequest.php`
  - `tear-v2-app/backend/app/Http/Controllers/Api/CadastroPublicoController.php`
  - `tear-v2-app/backend/app/Http/Controllers/Api/ParceiraController.php` (mesma regra aplicada à rota administrativa `POST /parceiras`, que reaproveita o mesmo `StoreParceiraRequest`)
  - `tear-v2-app/backend/app/Http/Resources/ParceiraResource.php` (expõe o novo campo)
  - `tear-v2-app/backend/tests/Feature/CadastroPublicoParceiraTest.php` (2 testes novos, 1 assert ampliado)
  - `tear-v2-app/backend/tests/Feature/ParceiraTest.php` e `CadastroAvancadoTest.php` (fixture atualizada)
  - `tear-v2-app/frontend/src/pages/PublicCadastroPage.tsx` e `.module.css`
- **Validação:** suíte backend 151/151 verde (era 149, +2 testes novos), `pint --test` limpo, `tsc -b`/`vite build`/`oxlint` do frontend limpos.

### A2 — Resolver a contradição arquitetural Docker vs. Locaweb na documentação de deploy

- **Origem:** Manus AI (achado crítico #2, risco #2 da tabela) — convergente
  com a due diligence anterior (`AUDITORIA_CLAUDE.md` §13, risco #1) e com o
  próprio `docs/deployment/IMPLEMENTACAO_TECNICA.md`, que já registrava
  `tear-v2-app/docs/DEPLOY.md` e `docs/release/TEAR_V2.5_GO_LIVE_CHECKLIST.md`
  como "pendente, fora do escopo desta revisão".
- **Motivo da aceitação:** confirmado que a arquitetura definitiva
  (`ARQUITETURA_PRODUCAO.md`, "aprovada e definitiva", 2026-07-21) decide
  Locaweb compartilhada sem Docker, mas o runbook realmente em uso
  (`DEPLOY.md`) e parte do checklist de Go-Live ainda descreviam
  integralmente um fluxo Docker Compose — uma contradição que, como três
  auditorias independentes apontaram, tornaria a Fase A tecnicamente
  inexecutável como documentada.
- **Por que a proposta técnica da Manus (SFTP "bare metal", sem CI) foi
  parcialmente rejeitada:** a arquitetura já aprovada especifica GitHub
  Actions + SSH + deploy atômico por symlink (`releases/`+`current`), com
  rollback instantâneo e pipeline testável — estritamente superior a um
  script de SFTP manual sem integração contínua. Implementar a alternativa
  mais simples da Manus seria uma regressão de qualidade de engenharia sem
  necessidade: a decisão de arquitetura já resolvia o problema, só faltava
  transcrevê-la nos artefatos operacionais.
- **Documentos alterados:**
  - `tear-v2-app/docs/DEPLOY.md` — reescrito integralmente para o fluxo
    GitHub Actions + SSH + symlink, com nota de consolidação explicando a
    obsolescência da versão Docker anterior.
  - `docs/release/TEAR_V2.5_GO_LIVE_CHECKLIST.md` — nota de consolidação no
    topo; P0-2 atualizado (Postgres gerenciado da Locaweb, não Droplet/Docker);
    "Ordem ideal de execução" (§4) e "Estimativa de esforço" (§5) corrigidas;
    checklist de "Deploy" (§6) atualizado para refletir Docker como
    dev-only e os itens pendentes reais (job de deploy SSH, aposentar
    `tear-v2-docker.yml`). **Narrativa histórica de sessões anteriores
    preservada sem alteração** (o que foi entregue em cada sessão é fato
    histórico, não normativo — reescrevê-la apagaria rastreabilidade).

### A3 — Investigar a branch órfã `worktree-spec-mvp-completa`

- **Origem:** Manus AI ("Semana 2: Investigar a branch órfã", §7 Oportunidades) — mesma recomendação já presente como "o que eu mudaria imediatamente" na due diligence anterior.
- **Motivo da aceitação parcial (investigação sim, merge não):** confirmado via `git log`/`git merge-tree` que a branch tem 16 commits únicos, **zero conflitos** com a branch atual, e implementa código já testado para módulo de logística (`Envio`), cálculo automático de data de aprovação do briefing (RN-04), campos contratuais em `Parceira` e landing page pública de onboarding — exatamente as lacunas que três auditorias independentes (incluindo o painel de 9 especialistas desta sessão) apontaram como MUST ausentes do MVP.
- **Por que o merge não foi executado:** é uma mudança de 54 arquivos e 1675
  linhas introduzindo regra de negócio nova (não é documentação nem
  correção pontual) — desproporcional ao escopo desta tarefa de consolidação
  de auditorias, e a tentativa foi corretamente barrada pelo classificador
  de permissão do harness por ser uma ação significativa e de reversão
  custosa. Mesclar sem uma sessão dedicada de validação (rodar a suíte
  pós-merge, conferir se as telas do frontend — que evoluíram desde o ponto
  de divergência — ainda fazem sentido com o código novo) seria o tipo de
  ação apressada que o próprio `CLAUDE.md` pede para evitar ("não trabalhar
  em múltiplas frentes").
- **Documento alterado:** `docs/_workspace/TASK_ROUTER.md` (§16, novo) — registra o achado, a evidência (zero conflitos, diffstat) e a recomendação para a próxima sessão.

---

## 3. Sugestões Aceitas Parcialmente

### B1 — Piloto externo com preço real, não puramente simbólico

- **Origem:** Manus AI (discordância expressa com o Founder SaaS da due
  diligence anterior) e a própria `AUDITORIA_CLAUDE.md` (divergência já
  preservada nessa mesma questão).
- **O que foi aceito:** o diagnóstico técnico — preço puramente simbólico
  testa *willingness-to-try*, não *willingness-to-pay*, e o racional já
  presente no plano ("cliente que paga se comporta como cliente",
  `ELA_INFLUENCIA_ENTREGA_1_ANALISE_ESTRATEGICA.md`) já aponta na direção
  certa, mas o valor específico continua chamado de "simbólico" em dois
  documentos (`PLANO_MESTRE_ELA_INFLUENCIA.md`, `ELA_INFLUENCIA_ENTREGA_2_PLANO_EXECUTIVO.md`).
- **O que não foi implementado, e por quê:** não editei a redação do plano
  para trocar "simbólico" por um valor real/reduzido. Preço e modelo de
  cobrança do piloto é uma decisão de negócio, explicitamente listada em
  `PLANO_MESTRE_ELA_INFLUENCIA.md` §10 como reserva do responsável do
  projeto ("hipótese até fim de setembro... números são decisão sua"). Como
  Arquiteto Responsável, tenho autonomia técnica, não autonomia comercial —
  decidir por quanto o piloto deveria cobrar extrapola o mandato desta
  tarefa. Fica registrada como recomendação para quando essa decisão for
  tomada.

### B2 — Corte agressivo de escopo do MVP (CPO)

- **Origem:** CPO Parte 1, item 8 ("Cortar qualquer funcionalidade que não
  seja estritamente ligada ao fluxo crítico Briefing→Upload→Aprovação→Pagamento").
- **O que foi aceito:** a filosofia geral de minimalismo já está no Plano
  Mestre e é genuinamente compatível ("na dúvida entre adicionar e
  simplificar, simplificar", regra de ouro do documento) — não há
  divergência de princípio.
- **O que foi rejeitado:** a versão literal da CPO eliminaria, na prática,
  os módulos de Marcas, Campanhas e a administração de Pagamentos como
  telas/fluxos permanentes — módulos que **já existem, já estão testados, e
  já sustentam a operação real da Jescri hoje** (confirmado no código:
  `MarcaController`, `CampanhaController`, `PagamentoController`, todos com
  cobertura de teste). Cortá-los não é reduzir escopo futuro, é remover
  capacidade operacional já em uso — o oposto do que qualquer auditoria
  deveria recomendar.

### B3 — Foco absoluto no Portal da Influenciadora mobile-first

- **Origem:** CPO Parte 1 (item 1 dos "5 mudanças") e Parte 2 (§1.A, §4).
- **O que foi aceito:** o objetivo em si — portal simples, mobile-first,
  "menos burocrático que o WhatsApp" — já é o núcleo explícito da Macrofase
  C do Plano Mestre, com a mesma régua de comparação ("mais fácil que
  WhatsApp") já usada pelo próprio plano e pela due diligence anterior.
  Não há divergência de objetivo.
- **O que foi rejeitado:** os mandatos de "parar todo o desenvolvimento
  administrativo imediatamente" e "no máximo dois ecrãs" são prematuros e
  não evidenciados — o Painel administrativo é o que roda a operação real
  da Jescri hoje (Fases A/B dependem dele funcionando), e o próprio Plano
  Mestre já determina que ajustes de UX do portal sejam guiados por
  fricção real de uso (Fase C), não por design especulativo antes de haver
  qualquer influenciadora usando o sistema.

### B4 — Antecipar decisões de negócio (candidata a piloto, INPI, marca)

- **Origem:** Manus AI (§7, recomendações "Imediato"/"Agosto"/"Setembro").
- **O que foi aceito:** o espírito de urgência — quanto antes essas
  decisões forem tomadas, menor o risco de calendário.
- **O que foi verificado como já contemplado, sem necessidade de edição:**
  a busca de candidata a piloto já está calendarizada para agosto
  (`PLANO_MESTRE:264`, "há uma agência cogitada, 2026-07-21"); o registro
  no INPI já é decisão pendente com prazo de outubro (`PLANO_MESTRE:116/263`);
  o risco de conflação de marca com a agência já está registrado
  (`ENTREGA_1:85`). Não alterei os prazos já decididos: são decisões de
  negócio do responsável do projeto, e a diferença entre "começar em
  agosto" (já planejado) e "começar esta semana" (sugestão da Manus) não
  justifica reabrir um documento de planejamento para uma diferença de
  poucos dias — fica como recomendação de ênfase, não como mudança de
  plano.

---

## 4. Sugestões Rejeitadas

| # | Sugestão | Origem | Justificativa técnica |
|---|---|---|---|
| C1 | Portal da Marca/Cliente com tenancy própria, login e visão executiva de ROI | CPO Parte 1 (item "Funcionalidades Ausentes") e Parte 2 (§1.B) | Contradiz decisão de escopo **já tomada e registrada por escrito**: `TASK_ROUTER.md` §15 confirma que `Marca` foi desenhada "sem login/tenant próprio, decisão explícita de escopo... é decisão de escopo de produto que só o responsável do projeto pode tomar." Reabrir isso sem uma nova decisão explícita do responsável violaria a regra do próprio `CLAUDE.md` ("não alterar arquitetura sem ADR"). |
| C2 | Implementar tenancy completa agora, antes da Fase D | CPO Parte 1 (item 2 das "5 mudanças") e Parte 2 (Semana 2) | Contradiz um sequenciamento já decidido e já avaliado como tecnicamente correto na due diligence anterior (CTO/PM endossaram: decidir via ADR em agosto, implementar em outubro, informado por uso real). Acelerar sem evidência de um segundo tenant real é exatamente o overengineering que o Plano Mestre evita deliberadamente. |
| C3 | Fluxo de aprovação "one-click" para marcas | CPO Parte 1 (item 3) e Parte 2 (§1.B) | Depende de C1 (Portal da Marca), já rejeitado pelo mesmo motivo. Prematuro sem um tenant de marca real para desenhar contra. |
| C4 | Onboarding via Magic Link / passwordless / Google SSO substituindo login por senha | CPO Parte 2 (§2, Etapa 1) | É uma mudança de arquitetura de autenticação, não um ajuste de UX — exigiria ADR próprio. O próprio histórico do projeto (`TASK_ROUTER.md`, SPEC-035/ADR-013) mostra que uma migração de autenticação equivalente no sistema GAS consumiu múltiplas sessões e produziu incidentes reais em produção (redirect_uri_mismatch, escopos OAuth). Isso argumenta por cautela e uma decisão dedicada, não por replicar a mudança de improviso dentro de uma consolidação de auditorias. |
| C5 | Implementar arquitetura de billing/assinatura agora | CPO Parte 2 (§3.1) | Contradiz textualmente o que o Plano Mestre já define: "O que o 1.0 deliberadamente NÃO é: multi-tenant self-service em escala... equipe de suporte" (`PLANO_MESTRE:40`). O piloto é concierge/manual por desenho — billing automatizado não tem função nesta fase. |
| C6 | Setup self-service para novas marcas | CPO Parte 2 (§3.2) | Mesmo motivo de C1/C5 — decisão de escopo já tomada contra self-service nesta etapa. |
| C7 | Congelar todo o desenvolvimento administrativo imediatamente | CPO Parte 2 (§4, Semana 1) | O Painel administrativo é o que roda a operação real da Jescri hoje — as Macrofases A/B do Plano Mestre dependem dele funcionando e evoluindo com o uso real. A recomendação parece assumir um estágio de maturidade de produto mais avançado do que o real. |
| C8 | Notificações transacionais automáticas amplas (novo briefing, prazo, material rejeitado) | CPO Parte 2 (§2, Etapa 3) | Funcionalidade nova além do fluxo crítico já validado — contraria a própria disciplina de corte de escopo que a Entrega 1/Plano Mestre já aplicam (nenhuma integração/feature nova antes do 1.0 sem evidência de necessidade real). |
| C9 | Reestruturação do roadmap em sprint fixo de 30 dias | CPO Parte 2 (§4) | Contradiz diretamente o calendário de 5 ciclos mensais do Plano Mestre, cuja lógica ("ciclo mensal como unidade de validação... não há como comprimir") já foi endossada pela due diligence anterior como um dos maiores acertos do plano. Substituí-lo por um sprint de 30 dias reintroduziria exatamente o risco que a Fase E (piloto externo antes do 1.0) foi desenhada para evitar: validar por calendário arbitrário em vez de por evidência real de uso. |
| C10 | Nota de maturidade do plano revista para 6,5/10; probabilidade "realista" de 40-50% | Manus AI (§4) | Não são recomendações acionáveis — são opiniões de síntese sobre a due diligence anterior, não sugestões de mudança no projeto. Registradas como leitura alternativa válida (a divergência de nota reflete pesos diferentes dados aos mesmos fatos, não um erro factual), sem ação. |

---

## 5. Arquivos Modificados

**Backend (`tear-v2-app/backend/`):**
- `database/migrations/2026_07_22_034958_add_consentimento_cadastro_to_parceiras_table.php` (novo)
- `app/Models/Parceira.php`
- `app/Http/Requests/Parceira/StoreParceiraRequest.php`
- `app/Http/Controllers/Api/CadastroPublicoController.php`
- `app/Http/Controllers/Api/ParceiraController.php`
- `app/Http/Resources/ParceiraResource.php`
- `tests/Feature/CadastroPublicoParceiraTest.php`
- `tests/Feature/ParceiraTest.php`
- `tests/Feature/CadastroAvancadoTest.php`

**Frontend (`tear-v2-app/frontend/`):**
- `src/pages/PublicCadastroPage.tsx`
- `src/pages/PublicCadastroPage.module.css`

**Documentação:**
- `tear-v2-app/docs/DEPLOY.md` (reescrito)
- `docs/release/TEAR_V2.5_GO_LIVE_CHECKLIST.md` (edições pontuais, narrativa histórica preservada)
- `docs/_workspace/TASK_ROUTER.md` (novo §16)
- `RELATORIO_CONSOLIDACAO_AUDITORIAS.md` (este arquivo, novo)

**Nenhum arquivo do plano estratégico** (`PLANO_MESTRE_ELA_INFLUENCIA.md`,
`ELA_INFLUENCIA_ENTREGA_1_ANALISE_ESTRATEGICA.md`,
`ELA_INFLUENCIA_ENTREGA_2_PLANO_EXECUTIVO.md`) **foi alterado** — todas as
recomendações que os afetariam diretamente (preço, calendário, tenancy,
escopo de Marca) foram avaliadas e, ou já estavam contempladas, ou foram
rejeitadas/parcialmente aceitas sem necessidade de reescrever decisões já
consolidadas.

---

## 6. Impacto Geral

As mudanças implementadas fecham os dois riscos de maior consenso entre as
quatro fontes de auditoria (a due diligence anterior e as três externas): a
única lacuna jurídica ativa e imediata (LGPD sem consentimento na porta de
entrada de dado sensível) e a única contradição técnica que bloqueava
literalmente o primeiro passo executável do plano (Docker vs. Locaweb). Os
dois foram resolvidos com o menor footprint possível — migrations aditivas,
reaproveitamento de padrões já estabelecidos no código, e a arquitetura de
deploy **já decidida** em vez de uma alternativa nova.

Igualmente importante é o que **não** mudou: o projeto preserva a coerência
que a due diligence anterior já identificou como seu maior ativo estrutural
— disciplina de portões, sequenciamento de tenancy por evidência (não por
especulação), escopo de 1.0 deliberadamente estreito, e a decisão já tomada
de que `Marca` não é um tenant self-service nesta etapa. Aceitar as
propostas mais estruturais da persona CPO (Portal da Marca, billing,
self-service, sprint de 30 dias) teria desfeito exatamente essa disciplina,
substituindo um plano validado por evidência por um plano validado por
intuição de produto — por mais bem-intencionada que seja essa intuição.

O achado de maior valor prático de toda esta rodada de consolidação — a
branch órfã `worktree-spec-mvp-completa`, com trabalho real e testado que já
resolve lacunas de logística e contrato apontadas por três auditorias
independentes — foi confirmado (zero conflitos) mas deliberadamente **não**
executado nesta sessão, por prudência de escopo e por bloqueio explícito do
próprio harness a uma ação dessa magnitude. É a recomendação mais valiosa
deste relatório para a próxima sessão de trabalho.
