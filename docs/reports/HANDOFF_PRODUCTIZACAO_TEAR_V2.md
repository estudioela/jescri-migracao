# Handoff — Produtização TEAR V2

Data: 2026-07-20
Propósito: registrar o contexto da transição de MVP operacional para
TEAR V2.5 — Produtização, para que sessões futuras não precisem
reanalisar o projeto do zero. Documento de continuidade — não é fonte de
decisão de negócio (isso é `docs/PRD.md`/`TASK_ROUTER.md`, e para o
`tear-v2-app` especificamente, os documentos listados em §0).

**Escopo:** exclusivamente `tear-v2-app/` (Laravel + React). Não toca no
Portal legado GAS (`src/`) nem no seu domínio soberano
(`CONTRATO_SOBERANO.md`) — trilhas de decisão e evolução separadas.

## 0. Documentos-fonte desta sessão (ler antes de agir)

Nesta ordem, cada um mais específico que o anterior:

1. `docs/planning/ROADMAP_MESTRE_TEAR_V2.md` — visão de execução completa (Parte 1:
   sprint de estabilização já concluída; Parte 2: roadmap futuro sem a
   lente SaaS).
2. `docs/reports/RELATORIO_SPRINT_ESTABILIZACAO_TEAR_V2.md` — investigação do upload de
   material (causa raiz: falta de credencial do Drive, não bug de código).
3. `docs/reports/RELATORIO_QA_FUNCIONAL_MVP_TEAR_V2.md` — QA manual ponta a ponta no
   navegador, com os bugs reais encontrados.
4. `docs/reports/STATUS_MVP_OPERACIONAL_TEAR_V2.md` — os dois bloqueadores P1 do QA
   corrigidos e validados; MVP declarado operacional.
5. `docs/planning/TEAR_V2.5_PRODUCTIZACAO_ROADMAP.md` — plano estratégico de
   produtização (4 fases, decisões arquiteturais, priorização). Este
   handoff resume o mesmo conhecimento; aquele documento é a fonte
   completa quando precisar do detalhe de cada fase.

---

## 1. Estado atual

- **MVP operacional validado.** Fluxo completo testado manualmente no
  navegador nesta sessão, com dados reais criados pela UI — não só
  testes automatizados: Cadastro → Campanha → Participação → Briefing →
  Material → Aprovação → Pagamento, sem intervenção técnica.
- **Módulos existentes e funcionando:** Cadastro/Parceiras, Marcas,
  Campanhas, Participações, Briefings, Materiais (upload + aprovação),
  Pagamentos (`PENDENTE → APROVADO → PAGO`).
- **Testes realizados:**
  - 84 testes automatizados do backend, verdes.
  - Lint frontend limpo (1 warning pré-existente não relacionado em
    `src/lib/auth.tsx:72`).
  - Build de produção do frontend ok.
  - QA manual ponta a ponta no navegador, cobrindo todos os módulos
    listados acima.
- **Bugs P1 encontrados no QA e já corrigidos/validados:**
  1. URL do arquivo de Material no fallback local apontava para porta
     errada (`APP_URL` sem porta) — corrigido em `.env`/`.env.example`.
  2. Menu lateral levava a página placeholder em 5 itens cujo fluxo real
     já existia (só alcançável via Campanhas → participação) — trocado
     por redirect para `/campanhas`.
- **Principais decisões tomadas** nesta transição estão detalhadas em
  §5 (Regras importantes) — não repetidas aqui para evitar duplicação.

---

## 2. Arquitetura atual

- **Frontend:** React 19 + Vite + React Router, CSS Modules, sem lib de
  estado global (contexto simples de auth).
- **Backend:** Laravel 13, PHP 8.3, Sanctum (auth por sessão/cookie,
  mesma origem), Spatie Permission (RBAC baseado em papel).
- **Banco:** SQLite em desenvolvimento. Entidades atuais:

  | Entidade | Onde vive | Estado | Observação |
  |---|---|---|---|
  | Influenciadora | `Parceira` (model/tabela `parceiras`) | ✅ funcional | Tem `user_id` (FK nullable) e relação `belongsTo(User::class)` **já declarados no schema, mas não usados por nenhum controller** — achado mais importante para a Fase 1 de produtização (ver §4). Status `Ativa`/`Inativa`, aprovação por ADMIN. |
  | Marca | `Marca` | ✅ funcional | CRUD simples, só `nome` obrigatório. |
  | Campanha | `Campanha` | ✅ funcional | Vinculada a uma Marca (`marca_id`), status `PLANEJADA/ATIVA/ENCERRADA/CANCELADA`. |
  | Participação | `ParticipacaoNaCampanha` | ✅ funcional | Vínculo Parceira↔Campanha; só lista parceiras `ATIVA` no seletor; ponto de entrada real de Briefing/Materiais/Pagamento. |
  | Briefing | `Briefing` | ✅ funcional | 1:1 com Participação; campos obrigatórios `orientacoes`/`prazo`. |
  | Material | `Material` | ✅ funcional | Upload real testado; `drive_file_url` é snapshot gravado no momento do upload, não recalculado. |
  | Aprovação | ação dentro de `Material` (`aprovar`/`reprovar`) | ✅ funcional | Não existe tela central de fila de aprovação — ação contextual por material. |
  | Pagamento | `Pagamento` | ✅ funcional | Máquina de estados `PENDENTE → APROVADO → PAGO`, testada até o fim. |
  | User (auth) | `User` | ✅ funcional só para ADMIN | Papéis seedados via Spatie (`ADMIN`, `GESTOR_MARCA`, `INFLUENCIADORA`), mas só `ADMIN` é de fato usado nas rotas. |

- **Integrações:** Armazenamento de mídia via abstração `Storage` do
  Laravel — hoje disco local; Google Drive real implementado em código,
  mas sem credenciais (`GOOGLE_DRIVE_CLIENT_EMAIL`/
  `GOOGLE_DRIVE_PRIVATE_KEY` vazios).
- **Dev:** comando único `npm run dev:all` em `tear-v2-app/frontend`
  (sobe backend `:8000` + frontend `:5173` juntos). Login de teste local:
  `admin@tear.test` / `password` (seed `DevUserSeeder`, só existe em
  `local`/`testing`).
- **Limitações conhecidas (lacunas, não bugs):**
  - Nenhuma superfície de acesso para quem não é `ADMIN` (sem portal da
    influenciadora).
  - RBAC de leitura não existe — toda rota `GET` só exige
    `auth:sanctum`, sem checar papel nem dono do registro.
  - Sem multi-tenant/organização em nenhuma tabela.
  - Placeholders honestos (sem fluxo real em nenhum lugar do sistema):
    Logística, Documentos, Histórico, Perfil.
  - Sem contratos, sem consentimento LGPD, sem automação/IA, sem
    billing.

---

## 3. Fase atual

O projeto está saindo de **MVP operacional** (estabilização concluída,
bugs P1 corrigidos, fluxo ponta a ponta validado) e entrando em
**TEAR V2.5 — Produtização**: transformar o MVP em plataforma
estruturada, sem lente SaaS ainda.

Diferença entre os dois momentos:

- **MVP (estado que está sendo encerrado):** operação centralizada, um
  cliente principal (a operação da Elã), administração interna por um
  único papel real em uso (`ADMIN`). Nenhuma tabela isola dado por
  cliente; login único de equipe interna; influenciadora é registro de
  dado, não usuário autenticado.
- **Produtização (fase que se inicia):** amadurecer cadastro,
  autenticação da influenciadora, operação de produto/logística,
  contratos e histórico — preparando o terreno para uma eventual camada
  SaaS futura, sem construí-la ainda (ver §4 e `docs/planning/TEAR_V2.5_PRODUCTIZACAO_ROADMAP.md`).
- **SaaS (fora do escopo desta fase):** múltiplas organizações
  independentes na mesma instância, permissões compostas por papel **e**
  por organização, cobrança por plano, onboarding autosserviço. O ponto
  central: SaaS não é "mais telas" — é a dimensão "organização"
  atravessando toda decisão de dado, acesso e cobrança. Só se inicia
  depois das fases de produtização estarem maduras (§5).

**Próximas prioridades sugeridas (em ordem):**

1. RBAC de leitura por papel e por dono do registro — pré-requisito de
   tudo que segue.
2. Ativar o vínculo `Parceira.user_id` — decidir quando o `User` é
   criado e como a credencial inicial é entregue.
3. Locale `pt_BR` nas mensagens de validação (achado do QA,
   `APP_LOCALE=en` hoje).
4. Fase 1 completa — Portal da Influenciadora, com teste automatizado de
   isolamento entre parceiras antes de considerar concluída.
5. Decisão de escopo com o responsável do projeto: Portal da Marca entra
   no próximo ciclo ou fica fora por enquanto.
6. Fase 2 — Operação interna completa (Logística, Documentos, Contratos,
   LGPD), só depois da Fase 1 madura.
7. Fase 3 — Inteligência operacional, só depois da Fase 2.
8. Fase 4 — Preparação SaaS, só depois das três anteriores maduras em
   operação real, e só depois da decisão de estrutura multiempresa
   (§5) estar fechada por escrito.

---

## 4. Pontos de evolução levantados

- **Portal da influenciadora** — maior lacuna de produto. Pré-requisito
  técnico concreto já identificado: ativar `Parceira.user_id` (existe no
  schema, não é usado) + implementar RBAC de leitura por dono do
  registro antes de abrir qualquer login para o papel `INFLUENCIADORA`.
- **Portal da marca** — não mencionado no roadmap de produtização como
  fase própria; hoje `GESTOR_MARCA` é só um papel seedado sem uso.
  Decisão de escopo de produto pendente.
- **Contratos** — geração, template, assinatura digital. Fornecedor de
  assinatura é decisão do responsável do projeto/jurídico, não da
  equipe técnica.
- **Logística** — produto/variante/permuta/ficha de envio. Desenho já
  existe em `docs/planning/ROADMAP_MESTRE_TEAR_V2.md` Parte 2, Fase 3 — não
  redesenhar do zero.
- **Histórico legado** — hoje é item de menu placeholder; a visão de
  produtização trata como funcionalidade transversal de auditoria (log
  por entidade), não tela isolada. Inclui migração do Google Sheets
  antigo (ativações, campanhas, produtos, pagamentos) — não destruir
  dados.
- **Automações / IA** — leitura de URL de produto, geração assistida de
  documento. Depende de dado estruturado existir primeiro
  (Logística/Contratos) — não adiantar.
- **Preparação SaaS** — multi-tenant/organização, cobrança por plano,
  onboarding autosserviço. Fora do escopo desta fase de produtização;
  só se inicia depois das fases anteriores maduras (ver §5).

Detalhamento de objetivo/valor/alterações/dependências/riscos/critério de
conclusão para cada um destes: `docs/planning/TEAR_V2.5_PRODUCTIZACAO_ROADMAP.md` §3.

---

## 5. Regras importantes

- **Não trocar stack (Laravel/React) sem necessidade técnica concreta.**
  Nenhuma dor observada até aqui justifica. As únicas mudanças de
  infraestrutura recomendadas (Postgres em vez de SQLite; possível
  S3/R2 em vez de Drive na Fase SaaS) são trocas de driver/configuração,
  não de framework.
- **Não refatorar sem motivo.** Alteração de arquitetura ou de código
  existente só se justifica por um problema real identificado, nunca
  por preferência estética ou antecipação de necessidade futura.
- **Não criar features sem especificação.** Nenhuma funcionalidade nova
  entra em desenvolvimento sem passar antes por
  especificação de produto (é o objetivo do documento
  `ESPECIFICACAO_EVOLUCAO_PRODUTO_TEAR_V2.md` que motivou esta sessão).
- **Priorizar valor de negócio.** Ordem de execução segue o que
  desbloqueia operação real primeiro (RBAC de segurança, cadastro,
  portal), não o que é tecnicamente mais interessante.
- **Não criar IA/automação antes de dado estruturado existir** (Fase de
  Logística/Contratos primeiro). Automatizar sobre dado instável
  amplifica erro em vez de eliminá-lo.
- **Não iniciar preparação SaaS (multi-tenant) antes da operação estar
  madura** nas fases anteriores. Multi-tenant sobre um modelo de negócio
  ainda mudando de forma gera retrabalho caro depois de já haver
  clientes reais.
- **Estrutura multiempresa recomendada, quando chegar a hora:** schema
  único compartilhado com `organization_id` em toda tabela de negócio
  (não banco-per-tenant), usando Laravel global scopes. Reavaliar só se
  algum cliente concreto exigir isolamento físico por
  contrato/regulação.
- **RBAC de leitura é bloqueador de segurança, não melhoria de UX** —
  não expor nenhum papel além de `ADMIN` (nem portal da influenciadora)
  antes de corrigir isso.
- Este roadmap **não reabre** o domínio soberano do Portal GAS legado
  (`CONTRATO_SOBERANO.md`, `TASK_ROUTER.md`) — são trilhas de decisão
  separadas.

---

Nenhum código foi escrito ou alterado para produzir este documento.
