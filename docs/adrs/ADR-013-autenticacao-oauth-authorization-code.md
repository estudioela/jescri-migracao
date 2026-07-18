# ADR-013 — Autenticação do Portal via OAuth 2.0 Authorization Code Flow

- **Status:** Aceito
- **Data:** 2026-07-18
- **Autores:** Arquitetura TEAR
- **Resolve:** falha de produção do login federado (investigação SPEC-035,
  revisão arquitetural independente de 2026-07-18, aprovada com 6 condições)
- **Relaciona-se com:** SPEC-035 (Identidade e Acesso, M-ID), SPEC-025
  (stack de sessão reaproveitada), `docs/_workspace/DEPLOY_CHECKLIST.md` §2
- **Substitui:** o fluxo Google Identity Services (GIS, botão
  `google.accounts.id` no frontend) como mecanismo de obtenção do
  `id_token`; e descarta a arquitetura experimental "frontend separado +
  `doPost` provisório" (branch `feat/frontend-separado`).

---

## 1. Contexto

A SPEC-035 substituiu o modelo de credencial legado (cupom + CNPJ, SPEC-025
RN-16) por federação Google Identity. A implementação original adotou o
Google Identity Services (GIS): o frontend (`src/ui/login.html`) carregava
`https://accounts.google.com/gsi/client`, renderizava o botão "Sign in with
Google" e recebia o `id_token` diretamente no navegador, repassando-o ao
backend (`entrarComGoogle`).

Em homologação o botão falhou de forma sistemática. A investigação da
SPEC-035 validou a causa raiz na documentação oficial do Google:

- O GIS exige que a origem JavaScript que renderiza o botão esteja
  registrada como **Authorized JavaScript origin** na credencial OAuth do
  Google Cloud Console.
- O HtmlService do Apps Script serve a interface de dentro de um iframe
  sandboxed numa origem dinâmica `*.script.googleusercontent.com` — origem
  que **não é estável nem registrável** no GCP Console (o Google rejeita o
  domínio e, ainda que aceitasse, o subdomínio varia por usuário/sessão).
- Consequência: o modelo de hospedagem do Apps Script é estruturalmente
  incompatível com o fluxo implícito do GIS. Não é um bug de configuração —
  nenhum valor de origem resolve.

Durante a investigação nasceu uma arquitetura experimental (branch
`feat/frontend-separado`: frontend hospedado fora do Apps Script falando
com um `doPost` provisório/`ApiGateway`). A revisão arquitetural
independente rejeitou essa direção e aprovou a alternativa descrita aqui,
com seis condições obrigatórias (ver §4).

## 2. Problema

Obter um `id_token` Google verificável pelo backend sem depender de origem
JavaScript registrável, preservando integralmente a stack de identidade e
sessão já implementada e testada da SPEC-035/025 (`UsuarioService.entrar`,
`ValidadorDeTokenGoogle`, `Sessao`/`SessaoRepository`, RBAC).

## 3. Alternativas Consideradas

### A) Frontend separado (hospedagem própria) + `doPost` como API
- **Prós:** origem estável registrável para o GIS; UI fora do sandbox.
- **Contras:** cria uma segunda superfície de entrada HTTP paralela ao
  Portal (CORS, versionamento de contrato, autenticação de API);
  infraestrutura nova de hospedagem para um MVP que hoje vive inteiro no
  Apps Script; duplica o roteamento já servido por `doGet`. **Rejeitada
  pela revisão arquitetural** (condição 6: descartar definitivamente).

### B) Biblioteca `apps-script-oauth2` vendorizada
- **Prós:** fluxo code pronto, endpoint `/usercallback` gerenciado.
- **Contras:** dependência vendorizada inteira para um único fluxo; o
  callback `/usercallback` vive fora do `doGet` do Portal (duas portas de
  entrada); o projeto já possui adapter próprio de validação de token e
  padrão consolidado de adapters finos sobre `UrlFetchApp`.

### C) OAuth 2.0 Authorization Code Flow server-side, com redirect para a
### própria URL `/exec` (adotada)
- **Prós:** o Authorization Code Flow usa **Authorized redirect URIs** (não
  JavaScript origins) — a URL `/exec` do deployment é estável e registrável
  no GCP Console; o navegador navega top-level (fora do iframe sandbox),
  eliminando a incompatibilidade; o `id_token` passa a ser obtido pelo
  backend, e a fronteira existente `UsuarioService.entrar({idToken})`
  absorve o novo transporte com **diff zero** em domínio, ACLs,
  repositories, sessão e RBAC; nenhuma infraestrutura nova.
- **Contras:** exige um segredo de cliente no servidor (4ª Script
  Property) e proteção anti-CSRF (`state`) — endereçados nas condições da
  revisão (§4).

## 4. Decisão

**Adota-se a Alternativa C**, sob as seis condições da revisão
arquitetural:

1. **Este ADR** formaliza a decisão (condição 1).
2. **`GOOGLE_CLIENT_SECRET`** passa a ser a 4ª Script Property
   (`src/shared/Config.js`), usada exclusivamente pelo adapter de troca de
   código; segredo jamais em log, erro, URL ou resposta ao cliente
   (condição 2).
3. **Parâmetro `state` anti-CSRF** (condição 3): UUID emitido pelo backend
   no início do login, registrado em `CacheService` (TTL 600s) pelo
   adapter `GuardiaoDeEstadoOAuth`, validado **com consumo único** no
   callback — cada `state` autoriza exatamente uma troca de código.
4. **Troca do código isolada em Adapter** (condição 4):
   `AdaptadorOAuthGoogle` (`src/adapters/`) é o único componente que fala
   com `https://oauth2.googleapis.com/token` e o único que toca o Client
   Secret. Constrói também a URL de autorização
   (`https://accounts.google.com/o/oauth2/v2/auth`, escopos
   `openid email profile`). Fail-closed: qualquer falha vira
   `ERR_AUTH_INVALID_TOKEN`.
5. **`doGet()` permanece roteador puro** (condição 5): o retorno do Google
   (`/exec?code=…&state=…`) cai na rota default (login); é o **cliente**
   que lê os parâmetros via `google.script.url.getLocation` e completa a
   troca chamando `entrarComCodigoOAuth` — nenhuma lógica de callback no
   `doGet`.
6. **Arquitetura experimental descartada** (condição 6): `doPost`
   provisório e `src/api/ApiGateway.js` removidos; o plumbing GIS
   (`entrarComGoogle`, `obterConfiguracaoDeLogin`, script `gsi/client`)
   eliminado do código e da UI.

Detalhes de fluxo:

- `UsuarioService.iniciarLogin()` emite o `state` e devolve a URL de
  autorização; `UsuarioService.entrarComCodigo({code, state})` valida e
  consome o `state`, troca o código pelo `id_token` e delega ao
  `entrar({idToken})` **existente e inalterado** — inclusive a revalidação
  do `id_token` no endpoint `tokeninfo` (`ValidadorDeTokenGoogle`).
- Nos resultados não autenticados (`CANDIDATA_VINCULACAO`,
  `ONBOARDING_REQUERIDO`), o `id_token` é devolvido ao navegador para os
  fluxos existentes de vinculação/onboarding (que continuam recebendo
  `idToken`). Exposição idêntica à do GIS anterior: o token do próprio
  usuário, no navegador do próprio usuário, com validade curta.
- O `id_token` é validado duas vezes (recebido via TLS do endpoint `token`
  + revalidado no `tokeninfo`). Redundância barata, mantida
  deliberadamente para não alterar o validador testado.

## 5. Consequências

### Positivas
- Login federado volta a funcionar no modelo de hospedagem real do Portal.
- Zero mudança em domínio, ACLs, repositories, stack de sessão e RBAC — a
  troca é de transporte, não de identidade.
- Provedor substituível: trocar o Google = trocar dois adapters (mesmo
  princípio do `VerificadorDeCredencialLegado`).

### Negativas / Trade-offs
- 4ª Script Property obrigatória (o `montarUsuarioService` é eager: sem
  ela, todas as rotas que exigem papel falham fail-fast com mensagem
  clara) — provisionamento documentado no `DEPLOY_CHECKLIST.md` §2.
- Operador precisa registrar as **Authorized redirect URIs** (`/exec` do
  deployment e `/dev` para testes) na credencial "Web application" do GCP
  Console; "Authorized JavaScript origins" deixa de ser necessária.
- Recarregar a URL de callback reutiliza um `code`/`state` já consumidos —
  o usuário recebe orientação de recomeçar o login (comportamento seguro
  por construção).

### Riscos residuais / dívidas conscientes
- **Trava global + HTTP externo:** a troca de código e o `tokeninfo` rodam
  sob `comTravaDeAcesso` — mesma natureza da dívida já registrada da
  SPEC-032 (CEP sob a trava), `TASK_ROUTER.md` §7. Resolver de vez pertence
  ao mesmo ADR futuro de granularidade de lock.
- **`state` não vinculado ao navegador:** o `state` prova emissão pelo
  servidor e uso único, mas não que o navegador do callback é o que iniciou
  o login (login-CSRF teórico: vítima autenticada com a conta do
  atacante). Hardening opcional futuro: eco do `state` em `sessionStorage`
  e comparação no cliente antes de chamar o backend.
- **CacheService é best-effort:** evicção antecipada do `state` derruba o
  login com `ERR_AUTH_STATE_INVALIDO` — degradação segura (recomeço), nunca
  bypass.

## 6. Aplicação

1. Este ADR aprovado e mesclado.
2. Implementação conforme
   `docs/_workspace/spec035_identidade/PLANO_ADR-013_OAUTH_CODE_FLOW.md`
   (adapters → service/controller → entrypoint → UI → docs).
3. `DEPLOY_CHECKLIST.md` §2 atualizado (property nova + GCP Console);
   `ROTEIRO_HOMOLOGACAO.md` com o passo de login por redirect;
   `TASK_ROUTER.md` com a nota na SPEC-035 e este ADR em §1.

**Critério de conclusão:** login real funcionando na URL `/exec` com a
credencial "Web application" (redirect URIs registradas); nenhuma
referência a `gsi/client`, `entrarComGoogle` ou `obterConfiguracaoDeLogin`
no repositório; suíte completa verde.

---

**Referências**
- SPEC-035 (`docs/specs/SPEC-035.md`) §9.2/§13/§14
- Google Identity: "Sign In with Google for Web" (exigência de Authorized
  JavaScript origins) e "OpenID Connect / OAuth 2.0 for Web Server
  Applications" (Authorization Code Flow, redirect URIs)
- `docs/_workspace/spec035_identidade/PLANO_ADR-013_OAUTH_CODE_FLOW.md`
- `docs/_workspace/TASK_ROUTER.md` §7 (dívida da trava global)
