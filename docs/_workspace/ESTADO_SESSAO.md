# ESTADO_SESSAO.md — Protocolo Operacional do Projeto

> Reescrito por `/fim` ao final de cada sessão; lido por `/comecar` no início
> da próxima. É o **cockpit** — snapshot curto e sempre atual. Não duplica
> histórico: para decisões de SPEC e histórico completo, ver
> `docs/_workspace/TASK_ROUTER.md`; para fases/calendário do negócio, ver
> `docs/planning/PLANO_MESTRE_ELA_INFLUENCIA.md`; para a lista de leitura
> obrigatória antes de alterar código, ver `CLAUDE.md` §Documentos oficiais.
>
> **Nota desta atualização:** duas sessões concorrentes fecharam trabalho
> em paralelo na mesma branch — Agente B (QA/Certificação do MVP) e Agente
> C (curadoria documental). Ambas terminaram por reescrever este arquivo
> de forma independente; esta versão funde as duas (merge de
> `origin/feat/ui-design-system-ela`), sem perder nenhuma das duas
> conclusões.

## 1. Estado atual

- **Data desta atualização:** 2026-07-23
- **HEAD de `feat/ui-design-system-ela`:** merge de `0e52516` (curadoria,
  Agente C) com `7cc7594` (certificação, Agente B) — a sincronizar com
  `origin/feat/ui-design-system-ela` no push desta sessão.
- **Branch:** `feat/ui-design-system-ela`.
- **Working tree:** os 3 documentos de Go-Live
  (`docs/deployment/CHECKLIST_GO_LIVE.md`,
  `docs/deployment/RUNBOOK_DEPLOY_E_ROLLBACK.md`,
  `docs/release/GATE_FINAL_GO_LIVE.md`) foram **commitados nesta sessão**
  (Agente A, `TASK_ROUTER.md` §41) — não estavam órfãos, só sem
  histórico Git. Restam 3 arquivos `??`, herdados de sessões anteriores
  de curadoria, destino ainda não decidido (ver §4):
  `docs/reports/AUDITORIA_FUNCIONAL_MVP_VS_ESPECIFICACAO.md`,
  `docs/reports/AUDITORIA_SIMPLIFICACAO_DOCUMENTAL.md`,
  `docs/reports/PLANO_EXECUTIVO_SIMPLIFICACAO_DOCUMENTAL.md`.
- **Sistema em foco:** `tear-v2-app/` (Laravel 13 + React) — MVP
  certificado funcionalmente nesta rodada de sessões; documentação do
  repositório também recebeu curadoria em paralelo.
- **PR #66 (`fix/pagamento-gate-pago` → `feat/ui-design-system-ela`):
  MERGEADO** (merge commit `99b5f6a`, CI verde) — a correção do único bug
  Categoria A conhecido (gate de material aprovado em Pagamentos, commit
  `4138c04`) está em vigor na branch principal.
- **Suíte verificada (Agente B, em `955bb83`):** backend 208/208 testes
  verdes, `vendor/bin/pint --test` limpo, `tsc -b` (frontend) limpo.

## 2. Últimas sessões concluídas (2026-07-23)

### 2a. QA/Certificação (Agente B) — PR #66 confirmado mergeado, MVP certificado funcionalmente

Continuação da auditoria de regras de negócio do `TASK_ROUTER.md` §38,
retomada após interrupção por limite de uso.

1. Confirmou que o PR #66 já estava mergeado (`99b5f6a`) ao retomar —
   merge feito fora da sessão que o abriu.
2. Encontrou dois commits adicionais não documentados na branch:
   `bb44d20` (consentimento LGPD ausente no cadastro/convite de Parceira)
   e `955bb83` (Histórico do Portal, RF-028 — fecha o ciclo de negócio
   certificável de `TASK_ROUTER.md` §32).
3. Rodou suíte completa contra `955bb83`: sem regressão.
4. Produziu `docs/reports/CERTIFICACAO_MVP.md` — parecer técnico formal:
   **MVP funcionalmente certificado** para demonstração a cliente (nenhum
   bloqueador Categoria A em aberto). Distinto da autorização de Go-Live
   de produção (`docs/release/GATE_FINAL_GO_LIVE.md`, gate separado,
   ainda **não autorizado**, bloqueado só por infraestrutura externa).
5. Registrado em `TASK_ROUTER.md` §40. Missão do Agente B nesta frente
   (QA/Homologação/Certificação) encerrada.

### 2b. Curadoria documental (Agente C) — decisão P0-2 extraída para ADR-018, plano de congelamento arquivado; missão encerrada

Continuação de sessão de curadoria interrompida por limite de contexto —
escopo estritamente documental, nenhum código tocado.

1. Encontrou a mesma divergência que o Agente B resolveu em paralelo (PR
   #66 na verdade já mergeado) — registro factual, sem investigar o
   conteúdo funcional (papel do Agente B, não deste).
2. Concluiu o único item pendente da Fase 1 do plano de simplificação
   documental (`TASK_ROUTER.md` §28): `docs/planning/
   PLANO_FINAL_CONGELAMENTO_OPERACIONAL.md` (decisão de arquitetura P0-2)
   tinha um pré-requisito não cumprido — extrair a decisão para ADR antes
   de arquivar.
3. Leitura direta do código (`ParticipacaoNaCampanha.php`,
   `ParticipacaoController.php`, `routes/api.php`, migration
   `2026_07_20_180000_...`) revelou que a implementação real é **muito
   mais estreita** que o plano propunha: só `congelado_em` + trava de
   edição de 4 campos comerciais. Não existem `congelado_por`,
   `dados_congelados` (cópia do cadastro da Parceira) nem
   `historico_alteracoes_participacao` — o núcleo do problema que o plano
   original resolvia (histórico não deve vazar alteração posterior do
   cadastro vivo da Parceira) **não está coberto** hoje.
4. `docs/adrs/ADR-018-congelamento-de-participacao-trava-simples.md`
   criada documentando o que foi de fato implementado e o gap consciente
   frente ao plano original (mantido arquivado como referência para o
   Sprint 3/Contratos, se precisar da garantia completa).
5. `git mv` do plano para `docs/archive/pagamento-snapshot/` + todas as
   referências cruzadas ativas atualizadas (`docs/archive/README.md`,
   `PLANO_MESTRE_ELA_INFLUENCIA.md`, `TASK_ROUTER.md` §28/§39).
6. Explicitamente não executado (sem autorização no escopo desta
   continuação): demais itens de Fase 1 (2 roadmaps superados,
   `REPOSITORY_GOVERNANCE_AUDIT.md`, `RELATORIO_CONSOLIDACAO_AUDITORIAS.md`),
   Fase 2 (3 remoções diretas já validadas), Fase 3 (2 consolidações) e
   Fase 4 (arquivamento pós-Go-Live).
7. **Missão do Agente C (Curador do Repositório) encerrada** por
   instrução explícita do responsável do projeto — qualquer curadoria
   futura precisa ser reaberta explicitamente.

## 3. Próxima tarefa recomendada

Nenhuma das duas frentes que fecharam nesta rodada (QA/Certificação,
Curadoria documental) tem trabalho pendente por conta própria. Decisão do
responsável do projeto entre:

1. **Seguir para a frente de infraestrutura/Go-Live**
   (`docs/release/GATE_FINAL_GO_LIVE.md`, `docs/deployment/
   CHECKLIST_GO_LIVE.md`, `docs/deployment/RUNBOOK_DEPLOY_E_ROLLBACK.md`)
   — hoje **NÃO AUTORIZADO**, bloqueado só por itens de infraestrutura
   externa (SSH real da Locaweb, PostgreSQL de produção, DNS/TLS, `.env`
   de produção, SMTP em ambiente real). Nenhum bloqueador de código.
2. **Ampliar a auditoria funcional a fluxos secundários** não cobertos
   (Marcas, Medidas) antes de avançar ao Go-Live.
3. Reproduzir manualmente o fluxo de **Login** isolado no navegador
   (baixa prioridade, não bloqueia — auditorias de código não encontraram
   bug).
4. Decidir o destino dos 6 arquivos `??` de §1/§4 (3 relatórios antigos +
   3 documentos de deployment/release do Agente B ainda não commitados).
5. Se/quando a curadoria documental for reaberta: itens de §2b.6
   (Fases 2/3/4 do plano de simplificação) seguem prontos para execução,
   dado autorização explícita.

Ver `docs/reports/CERTIFICACAO_MVP.md` (parecer completo),
`docs/adrs/ADR-018-congelamento-de-participacao-trava-simples.md`,
`docs/_workspace/TASK_ROUTER.md` §40/§39 (estas sessões), §38/§37/§32.

## 4. Pendências/bloqueios (decisão do responsável do projeto)

- **Nenhum bloqueador funcional (Categoria A) em aberto** — o único
  identificado (gate de Pagamento) foi corrigido e mergeado.
- **Destino de 3 relatórios `??` não decidido** (os 3 documentos de
  deployment/release foram commitados nesta sessão, ver §1): 3
  relatórios herdados de sessões de curadoria.
- **Fases 2/3/4 do plano de simplificação documental** (`TASK_ROUTER.md`
  §28) seguem sem autorização de execução.
- **Categoria B (compromete robustez/segurança/concorrência/manutenção,
  não bloqueia a certificação funcional):**
  - `Pagamento.valor` editável mesmo com `status=PAGO`, sem trava nem
    auditoria de quem alterou.
  - Pagamento e cancelamento de Participação não se checam mutuamente.
  - Campanha `ENCERRADA`/`CANCELADA` continua 100% editável.
  - Participação pode ser criada numa Campanha já `ENCERRADA`/`CANCELADA`.
  - `PagamentoController` sem `DB::transaction`/lock (mesma classe de
    race condition já corrigida em `ParceiraController::aprovar`).
  - `StoreParceiraRequest`/`UpdateParceiraRequest` sem unicidade de
    e-mail entre Parceiras.
  - Mensagens de erro genéricas no frontend de Login (429/5xx vs.
    credenciais inválidas).
  - `/login` sem rate-limit por e-mail (só por IP).
  - `CadastroPublicoController::store()` não trata `QueryException` de
    nome duplicado concorrente (TOCTOU).
  - Usuário sem role recebe `AppShell` administrativo completo (sem fluxo
    de produto que crie esse estado hoje).
  - `email` não normalizado (trim) em `StoreParceiraRequest`.
- **Categoria C (pode esperar):**
  - Congelamento (`congelado_em`) trava só os 4 campos comerciais da
    própria Participação — não protege dado de `Parceira` que possa
    mudar depois, nem tem trilha de auditoria (agora formalizado em
    `ADR-018`, não corrigido).
  - `reenviarConvite` não distingue parceira já ativa de uma que nunca
    definiu senha.
  - Item "Logística" no `AppShell.tsx` é `<PlaceholderPage>` desabilitado
    (Envio só por drill-down de Campanha — funcional, rótulo enganoso).
  - `GESTOR_MARCA` não funcional, validação de Instagram, rótulo "(em
    breve)" na sidebar.
- Validação ponta a ponta dos 2 fluxos de e-mail (convite, reset) com
  SMTP real — não executada.
- SPF/DKIM/DMARC do domínio `elafashionmkt.com.br` não verificados.
- Limite diário de envio do plano Locaweb não levantado.
- `MAIL_FROM_NAME=TEAR` diverge da marca usada no corpo dos e-mails —
  deliberado, não alterar sem decisão do responsável do projeto.
- Recorrência/parcelamento de pagamento não implementado — limitação de
  escopo conhecida, não bug.
- `tear-v2-app/docs/CONFIGURACAO_PRODUCAO.md` linha ~164 — referência a
  "TVs and Limited Input devices" (Google Drive, abandonado) não
  confirmada como corrigida.
- Estrutura fixa vs. dinâmica de pastas do Google Drive — decisão de
  produto pendente.
- `docs/deployment/GOOGLE_DRIVE_RECOVERY.md` — não iniciado.
- Dois OAuth Clients "Web application" órfãos no Cloud Console
  (cosmético).
- Estratégia de infraestrutura do PostgreSQL, autenticação de deploy
  (ADR-016), DNS de `influencia.estudioela.com`, PR #62 vs.
  `worktree-agente-b-deploy-infra` — inalterados (ver
  `docs/release/GATE_FINAL_GO_LIVE.md`/`docs/deployment/
  CHECKLIST_GO_LIVE.md` para o gate completo de infra).

## 5. Riscos ativos

1. PostgreSQL indisponível no plano atual da Locaweb — impacto em
   custo/cronograma (inalterado).
2. Pipeline de deploy com incompatibilidade de autenticação não resolvida
   (inalterado).
3. DNS de `influencia.estudioela.com` não apontado (inalterado).
4. Validação comercial concentrada em piloto único ainda não confirmado;
   bus factor 1 (inalterado).
5. SPF/DKIM/DMARC não verificados no domínio de envio (inalterado, baixo
   risco imediato).
6. **Mitigado:** gate de material aprovado em Pagamentos (`P0-1`)
   corrigido (`4138c04`) e confirmado em vigor na branch principal
   (merge `99b5f6a`).
7. **Descompasso entre cockpit e realidade do repositório** — duas
   sessões nesta rodada só descobriram o estado real (PR mergeado, commits
   novos) por checagem direta de `git log`, não pelo que este arquivo
   registrava. Mitigado por esta reescrita fundida; causa raiz (sessões
   paralelas não sincronizando o cockpit em tempo real) permanece.

## 6. IA recomendada para a próxima tarefa

- **Decisão de seguir para infraestrutura/Go-Live ou ampliar auditoria:**
  decisão do responsável do projeto, não requer IA.
- **Reprodução manual do fluxo de Login no navegador:** qualquer IA com
  acesso a ferramenta de browser.
- **Continuação da frente de infraestrutura/Go-Live (se decidido):**
  Claude, mesmo agente que já mantém `docs/deployment/` e
  `docs/release/GATE_FINAL_GO_LIVE.md`.
- **Auditoria de fluxos secundários (Marcas, Medidas), se decidido:**
  Claude, mesmo motivo de sempre (volume de fluxos, cruzamento com
  `docs/specs/`/`docs/PRD.md`).
- **Retomada de curadoria documental (se reaberta):** qualquer IA — plano
  já descrito em `TASK_ROUTER.md` §28 e nos relatórios
  `docs/reports/AUDITORIA_SIMPLIFICACAO_DOCUMENTAL.md`/
  `PLANO_EXECUTIVO_SIMPLIFICACAO_DOCUMENTAL.md`.
- Toda sessão nesta fase de Go-Live segue reportando ao final: Concluído
  / Bloqueadores (Crítico/Alto/Médio/Baixo) / Próxima prioridade /
  Checklist de Go-Live.

## 7. Prompt de handoff

```
Contexto: projeto ELÃ | influência (tear-v2-app, Laravel 13+React), branch
feat/ui-design-system-ela. Estado completo em
docs/_workspace/ESTADO_SESSAO.md (leia primeiro) e docs/_workspace/
TASK_ROUTER.md §40 (QA/Certificação), §39 (curadoria documental), §38/§37
(auditorias de origem), §32 (mandato de Certificação do MVP).

Estado: duas frentes fecharam em paralelo nesta rodada. (1) QA/Certificação:
PR #66 (gate de Pagamento, bug Categoria A) confirmado mergeado (99b5f6a);
suíte verde (208/208 backend, pint, tsc); MVP funcionalmente certificado
para demonstração a cliente em docs/reports/CERTIFICACAO_MVP.md — distinto
de autorização de Go-Live de produção (docs/release/GATE_FINAL_GO_LIVE.md,
hoje NÃO AUTORIZADO, só por infra externa). (2) Curadoria documental:
decisão de arquitetura do congelamento de Participação (P0-2) extraída
para docs/adrs/ADR-018-congelamento-de-participacao-trava-simples.md;
plano original arquivado em docs/archive/pagamento-snapshot/. Achado
importante da ADR: a implementação real do congelamento é bem mais
estreita que o plano propunha (só trava de edição, sem cópia de dados da
Parceira nem auditoria) — registrado como Categoria C, não corrigido.
Ambas as frentes (Agente B e Agente C) encerraram suas missões nesta
rodada.

Tarefa desta sessão: nenhuma pendente por conta das duas frentes acima.
Próxima sessão recebe decisão do responsável do projeto entre (1) avançar
para infraestrutura/Go-Live, (2) ampliar auditoria a fluxos secundários
(Marcas, Medidas), (3) reproduzir manualmente o fluxo de Login (baixa
prioridade), ou (4) decidir destino dos 6 arquivos `??` pendentes.

Regras: não alterar arquitetura sem ADR; não criar documentação
duplicada; uma frente por vez; validar (testes/lint) antes de commit;
reportar ao final: Concluído / Bloqueadores (Crítico/Alto/Médio/Baixo) /
Próxima prioridade / Checklist de Go-Live.
```
