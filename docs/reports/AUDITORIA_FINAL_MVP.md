# Auditoria Final de Prontidão do MVP — TEAR V2.5

- **Data:** 2026-07-22
- **Papel:** Tech Lead de execução (Agente B), avaliação técnica imparcial.
- **Missão:** exclusivamente auditoria — nenhum código ou documento existente
  foi alterado; nenhum ADR foi criado; esta é a única frente trabalhada
  nesta sessão.
- **Escopo:** o repositório contém **dois sistemas**. O sistema legado em
  Google Apps Script (`src/`, `clasp`) é o que está em produção hoje e tem
  as 15 SPECs do `TASK_ROUTER.md` §3 concluídas — não é objeto desta
  auditoria. O objeto desta auditoria é **`tear-v2-app/`** (Laravel 12 +
  React 19), o sistema que o projeto está preparando para Go-Live e para o
  qual esta pergunta de MVP faz sentido hoje (confirmado em
  `docs/_workspace/ESTADO_SESSAO.md`: "Sistema em foco: tear-v2-app").
  Onde a coexistência dos dois sistemas gera risco próprio, isso é sinalizado
  explicitamente.
- **Método:** síntese e verificação cruzada de auditorias já existentes no
  repositório (`docs/reports/GO_LIVE_STATUS.md`, nota 55/100, sessão desta
  mesma data; `docs/reports/AUDITORIA_QUALIDADE_INTERNA_2_ANOS.md`, nota
  72/100; `docs/reports/ARCHITECTURE_REVIEW_V2_5.md`;
  `docs/reports/RELATORIO_QA_FUNCIONAL_MVP_TEAR_V2.md`, 2026-07-20;
  `docs/_workspace/TASK_ROUTER.md`) **mais verificação independente ao
  vivo nesta sessão**: suíte de testes backend, lint e build de frontend
  executados do zero, e leitura direta do roteamento atual
  (`tear-v2-app/frontend/src/App.tsx`) para resolver uma divergência
  encontrada entre um relatório de QA de dois dias atrás e o estado real do
  código hoje (detalhe na ETAPA 2).

---

## ETAPA 1 — Inventário Funcional

| Funcionalidade | Status | Maturidade / evidência |
|---|---|---|
| Cadastro público de Parceira | Implementada | `POST /api/parceiras/cadastro`, RN-01 (nasce `Inativa`), consentimento LGPD no nascimento do dado. RN-02 (endereço automático por CEP) só client-side (`lib/cep.ts`) — débito aceito explicitamente pelo responsável do projeto (`TASK_ROUTER.md` §15). |
| Aprovação de Parceira (admin) | Implementada e testada | `Parceira::aprovar()`, `role:ADMIN`; P0 de segurança já corrigido (endpoint de criação sem gate ADMIN). |
| Login / recuperação de acesso / reset de senha | Implementada e testada | Broker nativo Laravel, `throttle:6,1` em `/login` (fechou lockout permanente, P0 corrigido). |
| Marca / Campanha / Participação | Implementada e testada | RN-C01–C04 aplicadas (status `Ativa`, unicidade Campanha×Parceira, soft-cancel, `restrictOnDelete`); condição comercial "congelada" no vínculo. Validação manual ponta a ponta registrada. |
| Briefing | Implementada e testada | CRUD 1:1 com Participação; cálculo automático de data de aprovação (RN-04). |
| Upload/aprovação de Materiais | Implementada no código; **não validável ponta a ponta sem infraestrutura real** | MIME allowlist fechada; fluxo aprovar/reprovar testado manualmente. Sem credenciais reais do Google Drive, `store()` retorna 503 (comportamento correto). Bug conhecido (P1, não corrigido): link "ver arquivo" do fallback local aponta para porta errada (`APP_URL` sem porta) — esvazia o propósito da etapa de aprovação enquanto o Drive real estiver desligado. |
| Logística (Envio) | Implementada no código; **inacessível pelo menu** | Model/controller/migration completos; só alcançável por drill-down (`/participacoes/:id/envio`). O item de menu "Logística" ainda é `<PlaceholderPage>` — comentário no código confirma que é conhecido/intencional, não regressão. |
| Pagamento | Implementada e testada | Bloqueio por material não aprovado, transições `PENDENTE→APROVADO→PAGO` validadas manualmente. Erro 409 não repassa causa real ao frontend (P1 cosmético, não bloqueante). |
| Documentos (admin) | **Não implementada** | Rota `/documentos` renderiza `<PlaceholderPage>`. Existe no sistema legado (SPEC-023), não portado. |
| Histórico | **Não implementada** | Rota `/historico` (admin) é `<PlaceholderPage>`; não existe visão consolidada de histórico para nenhum papel em `tear-v2-app` (o Portal da Influenciadora só mostra pagamento pontual por participação, não uma aba de histórico). É a última etapa do fluxo de negócio pedido nesta auditoria — lacuna real, não cosmética. |
| Perfil (admin) | **Não implementada** | `/perfil` (admin) é `<PlaceholderPage>`. Perfil **da influenciadora** é outra tela e está implementado e testado. |
| Portal da Influenciadora completo (dashboard/perfil/campanhas/briefing/materiais/pagamento) | Implementada e testada | Isolamento entre influenciadoras coberto por teste dedicado (`PortalIsolamentoTest`). |
| RBAC / autorização | Implementada e testada | Todo controller usa `authorize()` por posse ou papel; confirmado por duas auditorias estáticas independentes. Gap residual: `GET /marcas` depende só de Policy, sem `role:ADMIN` explícito na rota (hardening redundante, não é gap ativo). |
| Papel `GESTOR_MARCA` | Não implementada (autorização) | Só existe em seeder de desenvolvimento; `MarcaPolicy` sempre nega fora de ADMIN. Sem risco ativo hoje — nenhum fluxo real cria esse papel. |
| TikTok/UGC como deliverable | Parcial, decisão de escopo | Campos existem na migration, nenhuma tela/request os usa — decisão explícita do responsável de não implementar agora (não é dívida técnica). |
| Testes automatizados — backend | 192/192 verdes (verificado ao vivo nesta sessão), Pint limpo | Boa cobertura dos fluxos de negócio acima. |
| Testes automatizados — frontend | **Zero** (0 arquivos `*.test.*`/`*.spec.*`, confirmado ao vivo nesta sessão) | Toda a camada React depende de QA manual; qualquer refactor de UI arrisca regressão silenciosa. |

---

## ETAPA 2 — Fluxo de Negócio

Fluxo avaliado: **Cadastro → Aprovação → Campanha → Participação → Briefing →
Materiais → Aprovação → Logística → Pagamento → Histórico**

| Etapa | Ponta a ponta? | Evidência / lacuna |
|---|---|---|
| Cadastro | Sim | Falta apenas RN-02 (CEP server-side), aceito como débito. |
| Aprovação | Sim | Testado manualmente e via teste automatizado de isolamento. |
| Campanha | Sim | CRUD completo, status controlado só por ADMIN. |
| Participação | Sim | Condição comercial congelada no vínculo. |
| Briefing | Sim | Cálculo automático de data de aprovação. |
| Materiais | Sim no código; **não valida sem infraestrutura real** | Bloqueia em 503 sem credenciais reais do Google Drive — nenhum smoke test conseguiu completar "aprovação de material" com arquivo real até hoje. |
| Aprovação (de material) | Depende da etapa anterior | Mesmo bloqueio de infraestrutura. |
| Logística | Sim no código; **órfã de navegação** | Funcional só via URL direta; um operador seguindo o menu lateral não encontra esta etapa. |
| Pagamento | Sim | Regra de bloqueio testada; mensagem de erro genérica quando bloqueado (P1 cosmético). |
| Histórico | **Não** | Zero implementação, nem no admin nem como visão consolidada em nenhum papel. |

**Divergência resolvida nesta sessão:** o `RELATORIO_QA_FUNCIONAL_MVP_TEAR_V2.md`
(2026-07-20) registra 9 de 12 itens do menu lateral como
`<PlaceholderPage>` (incluindo Materiais, Aprovações, Pagamentos,
Colaborações, Briefings). Verificação direta em `App.tsx` nesta sessão
confirma que isso **mudou desde então**: 5 desses itens (`/colaboracoes`,
`/briefings`, `/materiais`, `/aprovacoes`, `/pagamentos`) hoje redirecionam
para `/campanhas` em vez de mostrar página vazia — melhoria real, mas ainda
não uma navegação direta ao módulo funcional. Continuam como
`<PlaceholderPage>` genuíno apenas: **Logística, Documentos, Histórico,
Perfil (admin)**. O relatório de 2026-07-20 está desatualizado neste ponto
específico; as lacunas de Documentos/Histórico continuam reais e atuais.

**Lacunas concretas do fluxo de negócio:**
1. **Histórico** — última etapa do fluxo pedido, sem nenhuma implementação.
2. **Documentos (admin)** — inexistente em `tear-v2-app`, apesar de existir
   completo no sistema legado (não portado).
3. **Logística** — funcional mas não descobrível pela navegação padrão.
4. **Materiais/aprovação** — não validável ponta a ponta sem credenciais
   reais de produção (bloqueio de infraestrutura, não de lógica de negócio).

Nenhuma dessas quatro lacunas é um bug de lógica — são gaps de escopo
(1, 2), de navegação (3) ou de infraestrutura (4), confirmados por duas
auditorias estáticas de segurança/RBAC que não encontraram P0 de código
aberto no que já está implementado.

---

## ETAPA 3 — Riscos

Classificação própria (Crítico/Alto/Médio/Baixo) — não é cópia mecânica das
categorias "bloqueador/recomendado/pós-MVP" de `GO_LIVE_STATUS.md`, que mede
*prontidão de deploy*, não *risco* em si.

### Crítico
1. **Banco de dados de produção sem infraestrutura definida.** O plano de
   hospedagem contratado ("Locaweb Hospedagem I") não oferece PostgreSQL,
   confirmado pelo suporte técnico. Nenhum outro item deste relatório é
   validável ponta a ponta sem isso resolvido. (Infraestrutura externa —
   decisão comercial/contratual, fora do código.)
2. **Disaster recovery quebrado.** `tear-v2-app/scripts/restore-db.sh`
   assume `docker compose exec`, mas a hospedagem real não tem Docker —
   falharia exatamente durante um incidente real de perda de dados.
3. **Risco de exposição de `.env`/`vendor`/`storage` via HTTP.** Nenhum
   documento de deployment especifica apontar o domínio Locaweb para
   `current/public` (em vez de `current`). Se malfeito no primeiro deploy,
   expõe credenciais de produção publicamente.
4. **Pipeline de deploy incompatível com o host real.** O workflow de CI
   usa autenticação SSH por chave; a Locaweb só autentica por senha —
   quebra garantida na configuração atual, não é risco probabilístico.

### Alto
5. **Regra "Influenciadora só vê o seu" duplicada em 4 Controllers**, sem
   Policy/scope centralizado — hoje correta e testada, mas estruturalmente
   frágil: um 5º endpoint de listagem copiado sem o filtro vazaria dados
   entre parceiras.
6. **Zero testes automatizados no frontend** — regras de negócio de UI
   (cálculo de disponibilidade, transições de estado, parsing de erro) sem
   rede de segurança contra regressão.
7. **Duplicação sistemática de fetch + tratamento de erro 422 em 9
   arquivos** — mudança de comportamento exige edição manual replicada;
   divergência silenciosa entre páginas é questão de tempo.
8. **Duas estratégias de autorização coexistindo sem convenção
   documentada** (middleware de rota vs. Policy) — mudança de regra de
   acesso exige tocar dois lugares sem critério escrito.
9. **Backups com dados pessoais sem confirmação de isolamento de ACL no
   Google Drive** — vira risco de LGPD ativo assim que os backups
   automatizados rodarem com dado real.
10. **Bus factor 1** — fundador único operando agência, produto e suporte;
    amplifica todos os outros riscos (débitos acumulam sem segundo par de
    olhos até forçarem refactor não planejado).

### Médio
11. `SESSION_SECURE_COOKIE` sem default seguro em `config/session.php` —
    fail-open se a variável de ambiente não for setada corretamente.
12. Rate limiting ausente na API autenticada (incluindo upload de
    materiais) — go-live é interno, mas exposição a custo/armazenamento
    descontrolado existe.
13. Sem backup imediatamente antes de `migrate --force` — inofensivo no
    primeiro deploy (banco vazio), relevante a partir do segundo.
14. Sem healthcheck pós-deploy/rollback automático — mitigado por
    supervisão humana direta no primeiro deploy, não escala.
15. Ausência de enums nativos PHP para status/papel (34+12 ocorrências de
    strings soltas) — typo só é pego em runtime, não em análise estática.
16. Papel `GESTOR_MARCA` sem Policy real — inerte hoje, mas vira 403
    constante (regressão silenciosa) se o roadmap ativar o papel sem
    revisitar este achado.
17. Ausência de biblioteca de data-fetching/cache no frontend — gerenciável
    manualmente hoje, tende a ficar inconsistente se o número de páginas
    dobrar.
18. `PortalPerfilPage.tsx` com 422 linhas / 2 formulários / 12 `useState`
    no mesmo escopo — risco de efeito colateral cruzado.
19. Ausência de soft deletes em tabelas de negócio — decisão de produto
    pendente, mais barata de decidir agora do que após existir dado real.
20. Sem `chmod` explícito para `storage/`/`bootstrap/cache` no script de
    deploy — nunca validado em ambiente real.

### Baixo
21. Nenhum componente de tabela reutilizável (5 páginas reimplementam
    `<table>` crua).
22. Nomenclatura de tabelas inconsistente — custo cognitivo, não
    funcional.
23. Duplicação pontual entre `CadastroPublicoController::store` e
    `ParceiraController::store`.
24. `GET /marcas` sem `role:ADMIN` explícito na rota (Policy já bloqueia
    corretamente — hardening redundante).
25. Os 13 itens "pós-MVP" já catalogados em `GO_LIVE_STATUS.md` §6 (fila
    sem uso, cache de assets ausente, FKs sem índice, releases antigas não
    removidas, rollback só manual, etc.) — nenhum quebra algo hoje.

**Nota de coerência entre fontes:** `GO_LIVE_STATUS.md` (55/100) e
`AUDITORIA_QUALIDADE_INTERNA_2_ANOS.md` (72/100) medem eixos diferentes
(prontidão de deploy/infra vs. qualidade interna de código/arquitetura) —
ambos documentos são explícitos sobre isso e não devem ter suas notas
comparadas diretamente. Tratados aqui como complementares.

---

## ETAPA 4 — Dívida Técnica (relevante para os próximos 6 meses)

Itens cosméticos (nomenclatura de tabela, componente de tabela reutilizável
etc.) foram excluídos por não afetarem os próximos 6 meses de forma
material.

| # | Item | Impacto | Urgência | Custo estimado |
|---|---|---|---|---|
| 1 | Centralizar regra de visibilidade por dono num Model scope | Alto — vazamento de dados entre Influenciadoras se um 5º endpoint esquecer o filtro | Antes da próxima feature de listagem | Baixo (poucas horas) |
| 2 | Testes automatizados de frontend (Vitest + Testing Library), priorizando as páginas de campanha/perfil | Alto — regras de negócio de UI sem rede de segurança | Antes de acelerar novas features de frontend | Médio (dias) |
| 3 | Extrair hook compartilhado de fetch + erro 422 (elimina duplicação em 9 arquivos) | Alto — mudança de comportamento exige edição replicada manualmente hoje | Nos próximos 6 meses, antes de dobrar o nº de entidades | Baixo-médio (1–2 dias) |
| 4 | ADR formalizando convenção de autorização (middleware vs. Policy) | Alto — próxima regra de acesso granular exigirá tocar 2 lugares sem critério escrito | Antes do roadmap ativar permissões mais granulares | Baixo (horas) |
| 5 | Confirmar isolamento de ACL dos backups com PII no Google Drive | Alto (risco LGPD) assim que backups automatizados rodarem com dado real | Antes do primeiro backup automatizado com dado real | Baixo (horas) |
| 6 | Padronizar transição de estado de Pagamento como método de Model | Médio — confusão sobre qual padrão seguir na próxima transição de estado | Sem pressa | Baixo (horas) |
| 7 | Decidir destino do papel `GESTOR_MARCA` | Médio — vira 403 constante se o roadmap ativar o papel sem revisitar | Antes da fase de produto que ativaria o papel | Baixo |
| 8 | Enums nativos PHP para status/papel | Médio — typo só é pego em runtime | Conforme novos domínios de status forem adicionados | Médio (1–2 dias por leva) |
| 9 | Dividir `PortalPerfilPage.tsx` em subcomponentes | Médio — acoplamento dificulta teste unitário focado | Junto com o item 2 | Baixo (horas) |
| 10 | Rate limiting na API autenticada (upload incluso) | Médio — exposição a custo/armazenamento descontrolado quando sair do uso interno | Antes de abrir para público além das usuárias conhecidas | Baixo (throttle padrão do Laravel) |
| 11 | Decisão de soft deletes em tabelas de negócio | Médio — mais barato decidir/migrar antes de existir dado real | Antes do primeiro dado real de produção | Baixo-médio (1 dia) |
| 12 | `SESSION_SECURE_COOKIE` sem default seguro | Médio — fail-open se env mal configurada | Antes do primeiro deploy | Trivial |
| 13 | Backup imediatamente antes de `migrate --force` | Baixo hoje, sobe a partir do 2º deploy | Antes do segundo deploy | Baixo |

**Nota de escopo:** a dívida técnica do sistema legado GAS (`src/`) não
entra nesta lista — pertence a um sistema diferente do que decide este
MVP. Se os dois sistemas seguirem em produção paralela após o Go-Live do
`tear-v2-app`, isso é um risco organizacional adicional (duplicação de
operação/suporte) que não está quantificado aqui.

---

## ETAPA 5 — MVP Score

| Dimensão | Nota (0–10) | Justificativa resumida |
|---|---|---|
| Funcionalidade | 6 | Núcleo comercial (cadastro→pagamento) funciona ponta a ponta e testado; Histórico ausente por completo e Documentos não portado — gaps reais no fluxo pedido, não cosméticos. |
| Estabilidade | 7 | 192/192 testes de backend verdes (verificado nesta sessão), Pint limpo, build/lint de frontend limpos; fragilizado por zero cobertura de teste no frontend. |
| Segurança | 6 | RBAC testado, P0s anteriores já corrigidos; mas blocker de exposição de `.env` no primeiro deploy, cookie de sessão sem default seguro, sem rate limiting, autorização duplicada sem Policy central. |
| Documentação | 8 | Disciplina forte de fonte única de verdade (TASK_ROUTER/ADRs/PROJECT_GOVERNANCE), múltiplas auditorias recentes e bem referenciadas entre si. |
| Engenharia | 7 | Nota interna própria de 72/100; arquitetura em camadas coerente, mas débito real em duplicação de fetch/erro e duas estratégias de autorização sem convenção escrita. |
| UX | 5 | 4 itens de menu ainda são placeholder genuíno (Logística, Documentos, Histórico, Perfil admin); sem lista central de pendências de aprovação; mensagens de validação em inglês numa UI em português; valores monetários sem formatação pt-BR. |
| Manutenibilidade | 5 | Bus factor 1; zero testes de frontend; lógica duplicada em múltiplos arquivos; convenções de autorização não documentadas. |
| Deploy | 4 | Nota própria de 55/100 em `GO_LIVE_STATUS.md`; 4 bloqueadores ativos, um deles (banco de dados de produção) impede qualquer deploy real hoje, independentemente do código. |

**Nota geral (média simples): 6,0 / 10.**

---

## ETAPA 6 — GO / NO GO

## **NO GO**

**Justificativa técnica:**

O núcleo funcional do produto (Cadastro → Aprovação → Campanha →
Participação → Briefing → Materiais → Pagamento) está implementado,
testado e razoavelmente estável — isso por si só sustentaria um "GO com
ressalvas" se a única questão fosse maturidade de produto.

O que impede o GO hoje não é uma ressalva aceitável de risco — é uma
**impossibilidade técnica objetiva de deploy**: o plano de hospedagem
contratado não oferece o banco de dados que o sistema requer (Bloqueador
#4), e mesmo se esse ponto fosse resolvido agora, o script de restauração
de backup pressupõe Docker inexistente no host real, e o pipeline de CI
usa autenticação SSH incompatível com o que a hospedagem aceita. "GO com
ressalvas" descreveria uma situação em que a equipe *pode* entregar
aceitando riscos conhecidos; aqui a equipe **não pode entregar
tecnicamente** enquanto esses quatro itens não forem resolvidos — por
isso o veredito correto é NO GO, não uma ressalva.

Adicionalmente, a última etapa do fluxo de negócio pedido nesta auditoria
(Histórico) tem 0% de implementação em `tear-v2-app` — uma lacuna de
escopo, não de qualidade, mas que por definição impede classificar o
fluxo completo como entregue.

Nenhum dos itens acima decorre de dívida técnica de longo prazo: os 3
bloqueadores técnicos de deploy têm custo estimado de horas a poucos dias
cada (ver ETAPA 4, itens correlatos), e o Bloqueador #4 é uma decisão de
infraestrutura pendente do responsável do projeto, não um problema de
engenharia. Isso significa que o caminho até GO COM RESSALVAS é curto e
bem definido — não é um NO GO por causa de reescrita ou arquitetura
malfeita, é um NO GO por pré-requisitos de infraestrutura e escopo ainda
não fechados.

---

## Entrega — Síntese final

**Principais riscos:**
1. Banco de dados de produção sem infraestrutura definida (Crítico).
2. Disaster recovery quebrado (`restore-db.sh` assume Docker inexistente) (Crítico).
3. Risco de exposição de credenciais de produção via apontamento incorreto de domínio (Crítico).
4. Pipeline de deploy incompatível com autenticação da hospedagem real (Crítico).
5. Regra de isolamento entre Influenciadoras sem Policy central — estruturalmente frágil apesar de correta hoje (Alto).
6. Zero testes automatizados de frontend (Alto).
7. Bus factor 1 (Alto, organizacional).

**Bloqueadores reais (impedem GO hoje):**
- Definição do banco de dados de produção (decisão do responsável do projeto — upgrade de plano, PostgreSQL externo/gerenciado ou outro SGBD).
- Reescrita de `restore-db.sh` sem dependência de Docker.
- Decisão de estratégia de autenticação SSH compatível com a hospedagem (chave vs. senha vs. híbrido).
- Validação/documentação explícita do apontamento do domínio para `current/public`.
- Conclusão da validação local pendente (fora do escopo desta auditoria, referenciada em `ESTADO_SESSAO.md`).

**Itens recomendados para versão pós-MVP:**
- Implementar Histórico (admin e visão consolidada para influenciadora) e Documentos (admin) — ou decidir explicitamente adiá-los, documentando a decisão de escopo.
- Ligar o item de menu "Logística" à tela já funcional (`/participacoes/:id/envio`).
- Lista central de pendências de aprovação (materiais e pagamentos aguardando ação, hoje só acessível uma participação por vez).
- Testes automatizados de frontend, começando pelos fluxos de campanha e perfil.
- ADR formalizando convenção de autorização (middleware de rota vs. Policy).
- Extração de hook compartilhado de fetch + tratamento de erro 422.
- Locale pt_BR nas mensagens de validação do backend e formatação monetária pt-BR no frontend.
- Rate limiting na API autenticada antes de abrir o produto além das usuárias internas conhecidas.
- Decisão explícita sobre soft deletes em tabelas de negócio, antes do primeiro dado real de produção.
- Confirmação de isolamento de ACL dos backups com PII no Google Drive.
- Avaliar, no momento do Go-Live, se o sistema legado GAS será desligado ou seguirá em produção paralela — e o custo organizacional dessa escolha.

**Recomendação final de aprovação: NO GO.** O produto está funcionalmente
maduro o suficiente para justificar investimento em destravar a
infraestrutura, mas não pode ser entregue como MVP hoje devido a um
bloqueador de infraestrutura externa (banco de dados de produção
indefinido) e três bloqueadores técnicos de deploy com correção estimada
em horas a poucos dias. Resolvidos esses quatro itens — e com uma decisão
explícita sobre Histórico/Documentos — o caminho para **GO COM RESSALVAS**
está aberto e é de curto prazo.
