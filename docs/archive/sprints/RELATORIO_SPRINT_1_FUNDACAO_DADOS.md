# Relatório — Sprint 1: Fundação de Dados e Acesso (TEAR V2.5)

Data: 2026-07-20
Escopo: exclusivamente `tear-v2-app/` (Laravel 13 + React/Vite). Não tocou
o Portal legado GAS (`src/`) nem `CONTRATO_SOBERANO.md`.
Fonte: `docs/ESPECIFICACAO_FUNCIONAL_TEAR_V2.5.md` e
`docs/PLANO_IMPLEMENTACAO_TEAR_V2.5.md`, seção "Sprint 1".

Fluxo seguido: Auditoria → Plano técnico (aprovado pelo responsável do
projeto) → Execução em 7 commits isolados → Validação (testes + lint +
build a cada entrega) → este relatório.

---

## 1. Entregas concluídas

| # | Entrega | Commit |
|---|---|---|
| 1 | Locale `pt_BR` (validação, auth, passwords) | `eefcc02` |
| 2 | RBAC de leitura por papel e por dono do registro | `59684f0` |
| 3 | Ativação de `Parceira.user_id` + convite por e-mail na aprovação | `ee23b9e` |
| 4 | Cadastro avançado: CEP automático, CNPJ (dígito verificador), telefone | `66ac7bd` |
| 5 | Medidas de vestuário versionadas (sutiã, calcinha, linha noite) | `b1dcbca` |
| 6 | Consentimento LGPD + histórico de alterações por campo | `d3dd646` |
| 7 | Briefing reorganizado de 1:1 para 1:N por tipo de conteúdo | `ba15f78` |

Suíte de testes backend: **86 → 99 testes**, todos verdes a cada commit
(`php artisan test`). Lint backend (`pint --test`) limpo em todas as
entregas. Frontend: `tsc -b && vite build` e `oxlint` limpos após a
entrega 7 (única que tocou frontend).

---

## 2. Detalhe por entrega

### 2.1 Locale pt_BR
`APP_LOCALE`/`APP_FALLBACK_LOCALE`/`APP_FAKER_LOCALE` = `pt_BR`.
Laravel 13 não traz traduções no core desde a v9 — criado
`lang/pt_BR/{validation,auth,passwords}.php` manualmente (sem dependência
nova) em vez de um pacote de terceiros para as ~50 chaves necessárias.

### 2.2 RBAC de leitura
**Achado confirmado:** toda rota `GET` exigia só `auth:sanctum` — qualquer
usuário autenticado lia qualquer `parceira`/`campanha`/`participação`/
`briefing`/`material`/`pagamento`, de qualquer dono. Corrigido com:
- Policies (`ParceiraPolicy`, `MarcaPolicy`, `CampanhaPolicy`,
  `ParticipacaoNaCampanhaPolicy`) + `Gate::before` para `ADMIN`.
- `index`/`show` escopados por dono quando o papel não é `ADMIN`.
- `Parceira::vincularUsuario()` — único ponto de escrita de `user_id`
  (mesmo padrão de `aprovar()`/`status`).
- Teste de isolamento (`RbacIsolamentoTest`) cobrindo os 5 recursos.

**Decisão de escopo registrada:** a correção cobriu leitura (`GET`), que é
o critério de sucesso explícito do plano. `ParceiraController::store` e
`update` continuam abertos a qualquer autenticado (comportamento
pré-existente, não travado nesta sprint) — ver §4.

### 2.3 Ativação de `Parceira.user_id`
`User` criado no momento da **aprovação** (não no cadastro público) —
evita usuário órfão para cadastros nunca aprovados. Convite via
`Password::broker()->createToken()` + `InfluenciadoraConviteNotification`
(mail, sem senha provisória em texto). Login real da influenciadora é
Sprint 2 — aqui só a fundação (usuário existe, pode definir senha).

### 2.4 Cadastro avançado
`CepLookupService` (ViaCEP, timeout 3s, falha nunca bloqueia o
salvamento — RNF herdada da V1) preenche `rua`/`bairro`/`cidade`/`uf` só
quando ainda em branco. `Rule` custom `Cnpj` (dígito verificador,
sem dependência nova) e `Telefone` (10/11 dígitos com DDD). CNPJ/CEP/
telefone normalizados para somente dígitos no armazenamento
(`prepareForValidation`).

**CPF:** removido do escopo por decisão explícita do responsável do
projeto durante a sessão — TEAR é B2B, não há cadastro de consumidor
final. Não implementado, não modelado como pendência aberta.

### 2.5 Medidas versionadas
Tabela `medidas_influenciadora` (append-only — cada alteração é uma linha
nova, nunca sobrescreve). Domínio fechado por enum: sutiã
(tamanho P/M/G/GG + numeração 42/44/46/48 + taça A/B/C/D), calcinha e
linha noite (P/M/G/GG). Não obrigatório no cadastro inicial.

### 2.6 Consentimento LGPD + histórico
`PUT /parceiras/{id}` passa a exigir `consentimento_aceito: true`. Serviço
`AtualizarCadastroComConsentimentoService` grava, na mesma transação: um
`Consentimento` (quem, quando, IP) e uma linha de `HistoricoAlteracao`
por campo **efetivamente alterado** (campo reenviado sem mudança não gera
histórico). IP só tem valor de auditoria quando a alteração parte do
Portal (que ainda não existe) — capturado desde já via `$request->ip()`
para não precisar retrabalho na Sprint 2.

### 2.7 Briefing 1:1 → 1:N por tipo de conteúdo
**Regressão em relação à V1 corrigida:** a V1 tinha até 4 blocos de
briefing por formato; o MVP tinha 1 registro genérico por participação.
Agora: um item por tipo (`FEED`/`REELS`/`STORIES`/`TIKTOK`/`UGC`), cada um
com instruções, prazo, referências (JSON) e observações. Criação valida
o tipo contra a quantidade contratada (`reels_qtd`/`carrossel_qtd`/
`stories_qtd`/novo `tiktok_qtd`/`ugc_qtd`) e impede duplicar tipo na mesma
participação (`unique(participacao_id, tipo)`). Rotas migradas para
plural (`/participacoes/{id}/briefings`).

**Mapeamento assumido (não literal na especificação):** `FEED` generaliza
o antigo "Carrossel" da V1 — não existe coluna própria de quantidade para
Feed, reaproveitada `carrossel_qtd`. Se a operação usar Feed com sentido
diferente de Carrossel, ajustar em sprint futura.

---

## 3. Frontend

Único módulo tocado: `BriefingFormPage.tsx` + `lib/briefings.ts`, para
acompanhar a mudança de contrato da API (rota plural, campo `tipo`
obrigatório). A página agora lista os itens já criados da participação e
permite criar um novo por tipo ou editar um existente.

**Débito técnico registrado:** a versão atual é funcional mas mínima (lista
simples + formulário single-item). Uma UI mais rica — itens agrupados
visualmente por tipo, edição inline, indicação de quantidade
contratada vs. preenchida — não foi construída nesta sprint por decisão
explícita de foco (ver §5). Fica para a Sprint 2, que é quem realmente
expõe este fluxo à influenciadora no Portal.

Cadastro avançado (CEP/CNPJ/telefone): validação/máscara no frontend
(`PublicCadastroPage`, `ParceiraFormPage`) **não foi implementada** nesta
sprint — o backend já valida e normaliza corretamente (é a fonte de
verdade, por princípio do roadmap), mas o formulário ainda não tem
máscara de digitação nem preview de auto-preenchimento de CEP. Débito
técnico para a Sprint 2/3.

---

## 4. Riscos e débitos técnicos para a próxima sprint

1. **Mutação de `Parceira` (`store`/`update`) sem checagem de posse** —
   qualquer usuário autenticado ainda pode criar/editar qualquer
   `Parceira` (só a leitura foi travada nesta sprint, conforme escopo do
   plano). Quando o Portal da Influenciadora (Sprint 2) for ao ar, isso
   precisa fechar antes — hoje mitigado pelo fato de não existir login de
   `INFLUENCIADORA` real ainda.
2. **UI de Briefing mínima** (ver §3) — funcional, não polida.
3. **Máscaras/autopreenchimento de CEP no frontend de cadastro** — não
   implementados (backend cobre a validação real).
4. **Mapeamento FEED↔carrossel_qtd** (ver §2.7) — assunção registrada, não
   confirmada com a operação.
5. **Pendências de PO herdadas dos documentos-fonte, não decididas aqui:**
   janela de permuta, provedor de assinatura digital, modelo de
   Assessoria, escopo da migração do legado — nenhuma delas bloqueava a
   Sprint 1.
6. **Lição operacional:** duas migrations desta sprint (`reorganize
   briefings`, `add tiktok/ugc qtd`) precisaram ser renomeadas — o
   timestamp gerado pelo relógio real da sessão (09:4x) ficava **antes**
   dos timestamps fictícios já usados por migrations anteriores do mesmo
   dia (10:00–12:00). Migrations subsequentes devem checar a última
   entrada de `database/migrations/` antes de rodar `make:migration`.

---

## 5. Nota sobre execução

A meio da sprint o responsável do projeto pediu explicitamente redução de
profundidade ("priorizar entrega funcional", "não criar testes
excessivos", "evitar overengineering") e, ao final, confirmou concluir
Briefing 1:N sem abrir novos módulos. As entregas 4–7 foram ajustadas
nesse sentido: cobertura de teste focada no caminho principal e nos casos
de erro citados na especificação, sem suíte exaustiva; UI de Briefing
mantida mínima e funcional em vez de redesenhada por completo.

---

## 6. Critério de sucesso (do prompt de abertura da sprint)

- ✅ Nenhuma rota `GET` retorna dado fora do escopo do papel/dono
  (validado por `RbacIsolamentoTest`).
- ✅ `Parceira.user_id` populado no fluxo real de aprovação.
- ✅ Cadastro com CEP automático, validação de CNPJ/telefone e
  consentimento registrado com prova (backend).
- ✅ Briefing gravável por tipo de conteúdo.

Base sólida para a Sprint 2 (Portal/Experiência da Influenciadora), que
depende diretamente de RBAC de leitura, `Parceira.user_id` e Briefing por
tipo — todos entregues aqui.
