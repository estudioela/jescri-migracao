# ADR-015 — Frontend React servido pelo Laravel (origem única)

- **Status:** Aceito
- **Data:** 2026-07-22
- **Autores:** responsável do projeto (decisão) + Arquitetura TEAR (aplicação)
- **Resolve:** ambiguidade arquitetural registrada em `TASK_ROUTER.md` §18 —
  `ARQUITETURA_PRODUCAO.md` já assumia subdomínio único, mas o repositório
  não tinha a fiação entre o build do Vite e o Laravel.
- **Relaciona-se com:** `docs/deployment/ARQUITETURA_PRODUCAO.md` §3/§8/§10,
  `docs/deployment/IMPLEMENTACAO_TECNICA.md` §2/§9, `TASK_ROUTER.md` §18/§19.
- **Escopo:** `tear-v2-app` (Laravel 12 + React 19 + Vite). Não se aplica ao
  legado GAS (`src/`).

---

## 1. Contexto

A Macrofase A (Go Live interno) começou a executar as Etapas 5/6 de
`PLANO_IMPLEMENTACAO.md` (CI de build do frontend + deploy via SSH) e parou:
`ARQUITETURA_PRODUCAO.md` já decidia um único subdomínio
(definitivo desde 2026-07-22 como `influencia.estudioela.com`, renomeado
para `portal.estudioela.com` em 2026-07-23 — à época desta ADR ainda
ilustrado como `tear.estudioela.com`) para frontend e API, mas
nada no repositório
implementava essa origem única de fato — `frontend/vite.config.ts` builda
para `dist/` (artefato solto, sem consumidor), `backend/routes/web.php` só
tinha a view placeholder `welcome`, e o template de produção comentava
"frontend e API podem ficar em subdomínios distintos", contradizendo a
arquitetura já aprovada.

## 2. Decisão

**O Laravel serve o build estático do frontend.** Sem domínio separado para
a SPA, sem servidor HTTP adicional, sem proxy reverso próprio de aplicação —
um único processo PHP-FPM (o já provisionado pela Locaweb) responde tanto
`/api/*` quanto qualquer outra rota, servindo o `index.html` gerado pelo
Vite para esta última.

### Mecânica

1. **Build:** `frontend/vite.config.ts` só muda `base`/`outDir` quando a
   variável de ambiente `VITE_BUILD_TARGET=locaweb` está definida — nesse
   modo, `outDir: '../backend/public/build'` e `base: '/build/'`. Sem essa
   variável (`npm run build` padrão, usado pela validação do CI de testes e
   pela imagem Docker de dev local via `docker-compose.yml`), o
   comportamento não muda (`dist/`, `base: '/'`) — **decisão deliberada**
   para não quebrar o pipeline de dev local, que continua fora do escopo
   desta ADR (`ARQUITETURA_PRODUCAO.md` já reserva Docker só para dev).
   Novo script `npm run build:locaweb` (`frontend/package.json`) ativa o
   modo de produção.
2. **Serving:** `backend/routes/web.php` registra
   `Route::get('/{any?}', ...)->where('any', '.*')`, que devolve o conteúdo
   de `public/build/index.html` (404 com mensagem clara se o build não
   existir). Não há risco de esta rota capturar `/api/*` ou `/up`: o
   Laravel registra rotas de API e o health-check **antes** das rotas de
   web (`Illuminate\Foundation\Configuration\ApplicationBuilder::buildRoutingCallback`),
   e o Router resolve pela primeira rota que casar, em ordem de registro —
   comportamento validado por teste (`SpaCatchAllRouteTest`).
3. **Assets físicos** (`/build/assets/*.js`, `*.css`, ícones) são servidos
   diretamente pelo servidor web a partir de `public/build/`, sem passar
   pelo roteador do Laravel — comportamento padrão de qualquer arquivo
   dentro de `public/`.
4. **API consumida por caminho relativo:** o build de produção define
   `VITE_API_URL=/api` (mesma origem) — não `https://.../api` absoluto —
   eliminando a necessidade de saber o domínio de produção em tempo de
   build. Dev local mantém `VITE_API_URL=http://localhost:8000/api`
   (`frontend/.env`, cross-origin real entre `:5173` e `:8000`).

### O que isso implica para o resto da arquitetura já aprovada

- `SESSION_DOMAIN` passa a ser o host exato (sem ponto inicial) — não há
  mais "subdomínios distintos" a cobrir.
- `FRONTEND_URL` e `APP_URL` apontam para o mesmo host em produção.
- `config/cors.php` deixa de ser exercido pelo navegador em produção (não
  há requisição cross-origin) — mantido apenas porque `npm run dev` local
  ainda é cross-origin (`:5173` → `:8000`).
- CI/CD: um único pipeline constrói o frontend e empacota o resultado junto
  com o backend antes do deploy via SSH — não dois artefatos publicados
  separadamente.

## 3. Alternativas consideradas

### A) Site estático separado (mesmo subdomínio, via proxy do servidor web)
- **Prós:** frontend e backend fisicamente independentes, deploy
  desacoplado.
- **Contras:** a Locaweb Hospedagem Linux compartilhada não dá acesso a
  configuração de proxy reverso/vhost (`ARQUITETURA_PRODUCAO.md` §0/§1) —
  exigiria um serviço adicional (contra a restrição soberana de zero custo
  recorrente novo, §0). **Rejeitada**: tecnicamente inviável no plano já
  contratado.

### B) Subdomínio dedicado à API (`api.portal.estudioela.com`) + frontend em
### outro (adotada em versões anteriores da documentação, nunca implementada)
- **Prós:** separação clássica API/SPA.
- **Contras:** exige registro DNS e SSL adicionais, CORS real em produção
  (superfície de configuração e de erro a mais), sem benefício concreto para
  o perfil atual (mantenedor único, tráfego administrativo). **Rejeitada**
  pelo responsável do projeto (2026-07-22): resolve o problema errado para
  este estágio do produto.

### C) Laravel serve o build do Vite, origem única (adotada)
- **Prós:** zero peça de infraestrutura nova, zero CORS em produção, um
  único pipeline de CI/CD, compatível com a restrição soberana de custo já
  registrada em `ARQUITETURA_PRODUCAO.md` §0.
- **Contras:** acopla o ciclo de release do frontend ao do backend (um
  único deploy publica os dois) — aceitável para o perfil atual (não é um
  SaaS multi-time com ciclos de release independentes).

## 4. Consequências

### Positivas
- Fecha a ambiguidade que bloqueava as Etapas 5/6 de
  `PLANO_IMPLEMENTACAO.md` (`TASK_ROUTER.md` §18).
- Nenhuma peça de infraestrutura nova — consistente com a restrição
  soberana de `ARQUITETURA_PRODUCAO.md` §0.
- Pipeline único de build+deploy — menos superfície de CI/CD para manter.

### Negativas / Trade-offs
- Qualquer alteração de frontend, por menor que seja, passa pelo mesmo
  pipeline de deploy do backend (sem deploy independente de SPA).
- O catch-all em `web.php` precisa continuar excluindo implicitamente
  `/api/*` e `/up` — depende da ordem de registro de rotas do Laravel
  (documentada e testada, mas é um invariante a não quebrar sem revisar
  este ADR).

### Riscos residuais / dívidas conscientes
- `docs/deployment/DEPLOY.md` e
  `docs/release/TEAR_V2.5_GO_LIVE_CHECKLIST.md` ainda descrevem o fluxo
  Docker/Coolify anterior — pendência já registrada em
  `IMPLEMENTACAO_TECNICA.md` §2, não resolvida por este ADR (fora de
  escopo, tratada antes da Etapa 11 do plano).

## 5. Aplicação

1. Este ADR aprovado e mesclado.
2. `frontend/vite.config.ts` / `frontend/package.json` (`build:locaweb`),
   `backend/routes/web.php`, `backend/config/cors.php` (comentário),
   `backend/.env.production.example` (`SESSION_DOMAIN`/`FRONTEND_URL`),
   `backend/tests/Feature/SpaCatchAllRouteTest.php` — implementados.
3. `.github/workflows/tear-v2-deploy.yml` (novo) e
   `scripts/deploy-locaweb.sh` (novo) — Etapas 5/6 de
   `PLANO_IMPLEMENTACAO.md`.
4. `.github/workflows/tear-v2-docker.yml` removido — produção não consome
   mais imagem Docker (`IMPLEMENTACAO_TECNICA.md` §9, já previsto como
   aposentadoria antes deste ADR).
5. `TASK_ROUTER.md` §19 com o registro desta sessão.

**Critério de conclusão:** suíte de testes do backend verde incluindo
`SpaCatchAllRouteTest`; `npm run build` (padrão) continua gerando `dist/`
sem regressão no Docker de dev local; `npm run build:locaweb` gera
`backend/public/build/index.html` com assets sob `/build/`; workflow de
deploy criado e sintaticamente válido (execução real depende de secrets
ainda não configurados — `TASK_ROUTER.md` §19).

---

**Referências**
- `docs/deployment/ARQUITETURA_PRODUCAO.md` §3, §8, §10
- `docs/deployment/IMPLEMENTACAO_TECNICA.md` §2, §9
- `docs/deployment/PLANO_IMPLEMENTACAO.md` Etapas 5/6
- `docs/_workspace/TASK_ROUTER.md` §18 (bloqueio original), §19 (resolução)
