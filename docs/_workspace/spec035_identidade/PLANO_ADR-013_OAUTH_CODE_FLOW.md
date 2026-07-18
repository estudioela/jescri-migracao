# Plano de Implementação — ADR-013: OAuth 2.0 Authorization Code Flow (SPEC-035)

> **Para agentes executores:** usar `superpowers:executing-plans` (ou
> `superpowers:subagent-driven-development`) para executar etapa a etapa.
> Passos usam checkboxes (`- [ ]`).

**Objetivo:** substituir o fluxo Google Identity Services (GIS, incompatível
com a hospedagem `script.googleusercontent.com` do Apps Script) pelo OAuth
2.0 Authorization Code Flow, cumprindo as 6 condições da revisão
arquitetural, sem criar stack de sessão/identidade paralela.

**Arquitetura (aprovada na revisão):** o frontend deixa de receber
`id_token` do GIS; passa a redirecionar o navegador (top-level) para o
endpoint de autorização do Google, que devolve um `code` na própria URL
`/exec`. O backend troca o `code` por `id_token` (Adapter novo, com Client
Secret), valida `state` anti-CSRF (CacheService) e reaproveita **sem
alteração** toda a cadeia existente `ValidadorDeTokenGoogle` →
`UsuarioService.entrar` → `Sessao`/`SessaoRepository` (SPEC-025/035).
`doGet()` permanece roteador puro — o callback é lido pelo cliente via
`google.script.url.getLocation`, não por lógica nova no `doGet`.

**Stack:** Google Apps Script (V8), Jest + gasHarness (vm), ESLint, clasp.

## Restrições globais

- As 6 condições da revisão arquitetural (ADR-013; Script Property nova
  `GOOGLE_CLIENT_SECRET`; `state` anti-CSRF; troca de código isolada em
  Adapter; `doGet()` só roteador; descarte de frontend separado/doPost).
- Envelope padrão `{success,data}/{success,error}` em toda função exposta
  (§3.3); erros de contrato com `codigo` (`ERR_AUTH_*`).
- Camadas: entrypoint é o único a tocar `SpreadsheetApp`/`LockService`/
  `CacheService`/`ScriptApp`; adapters podem tocar `UrlFetchApp`; Service
  não conhece HTTP/OAuth mecânico além de portas injetadas.
- Segredos: `GOOGLE_CLIENT_SECRET` e `code` **nunca** em log, erro ou
  resposta ao cliente.
- Suíte 100% verde + lint limpo (`npm run check`) antes de cada commit.
- Vocabulário: CONTRATO_SOBERANO §2/§4 (nomes em português do domínio).

## Fluxo alvo (referência para todas as etapas)

1. `login.html` (sem token em sessionStorage, sem `code` na URL): botão
   "Entrar com Google" → `google.script.run.iniciarLoginComGoogle()` →
   backend gera `state` (UUID), registra no CacheService (TTL 10 min) e
   devolve a URL de autorização → `window.top.location.href = url`.
2. Google autentica e redireciona para
   `https://script.google.com/macros/s/<DEPLOY>/exec?code=…&state=…`.
3. `doGet()` (rota default, inalterada) renderiza `login.html`; o JS lê
   `code`/`state` via `google.script.url.getLocation` e chama
   `entrarComCodigoOAuth({code, state})`.
4. Backend: valida+consome `state` → troca `code` por `id_token`
   (Adapter, com Client Secret) → `UsuarioService.entrar({idToken})`
   (inalterado: tokeninfo, PENDING/ACTIVE, sessão, papel).
5. Estados `CANDIDATA_VINCULACAO`/`ONBOARDING_REQUERIDO` devolvem também o
   `idToken` (mesma exposição que o GIS já dava ao navegador do próprio
   usuário) para os fluxos existentes `confirmarVinculacaoDeIdentidade`/
   `completarCadastroDeUsuario`, que permanecem inalterados.

## Arquivos impactados (mapa completo)

| Arquivo | Ação |
|---|---|
| `src/api/ApiGateway.js` | **remover** (experimental, não rastreado) |
| `src/entrypoint/Portal.js` | descartar `doPost` não commitado; +`iniciarLoginComGoogle`/`entrarComCodigoOAuth`; −`entrarComGoogle`/`obterConfiguracaoDeLogin`; composição dos 2 adapters novos |
| `docs/adrs/ADR-013-autenticacao-oauth-authorization-code.md` | **criar** |
| `src/shared/Config.js` | +`GOOGLE_CLIENT_SECRET` |
| `src/adapters/GuardiaoDeEstadoOAuth.js` | **criar** (state anti-CSRF) |
| `src/adapters/AdaptadorOAuthGoogle.js` | **criar** (URL de autorização + troca de código) |
| `src/service/UsuarioService.js` | +2 portas no construtor; +`iniciarLogin()`/`entrarComCodigo()` |
| `src/controller/UsuarioController.js` | +`iniciarLogin()`/`entrarComCodigo()` |
| `src/ui/login.html` | remover GIS/console.log; botão redirect + tratamento do callback |
| `test/helpers/gasHarness.js` | fakes default de `CacheService`/`ScriptApp` |
| `test/oauth-guardiao.test.js`, `test/oauth-adapter.test.js` | **criar** |
| `test/usuario-service.test.js`, `test/usuario-controller.test.js`, `test/portal-usuario.test.js`, `test/helpers/rbacFixture.js` | atualizar (portas novas, `GOOGLE_CLIENT_SECRET` nas properties fake, jornada via code flow) |
| `docs/_workspace/DEPLOY_CHECKLIST.md` §2 | 4ª property + redirect URIs no GCP Console |
| `docs/_workspace/ROTEIRO_HOMOLOGACAO.md` | passo de login atualizado |
| `docs/_workspace/TASK_ROUTER.md` | nota na SPEC-035 + ADR-013 |

**Não muda nada em:** `ValidadorDeTokenGoogle`, `Usuario`, `UsuarioRepository`,
`UsuarioACL`, `AdministradorACL`, `ParceiraACL`, `Sessao*`,
`AcessoPortalService/Controller`, RBAC (`exigirPapelAdministrador`), demais
telas/rotas.

## Dependências e contexto citado (não reauditado nesta investigação)

- SPEC-035 (`docs/specs/SPEC-035.md`) §9.2/§13/§14 —
  contrato de estados e erros `ERR_AUTH_*` já implementado; este plano só
  ADICIONA `ERR_AUTH_STATE_INVALIDO`.
- `test/helpers/rbacFixture.js` — assumido que provisiona o fake de
  `PropertiesService`; a etapa 6 confirma no próprio arquivo ao editá-lo.
- `admin.html`/`dashboard.html` — assumido que só consomem
  `sessionStorage('tearPortalToken')` e rotas já existentes; nenhum uso de
  GIS fora de `login.html` (se a etapa 7 encontrar, tratar igual).

---

### Etapa 0 — Descarte da arquitetura experimental (condição 6) + branch

**Arquivos:** `src/entrypoint/Portal.js` (working tree), `src/api/` (remover).

- [ ] `git checkout -- src/entrypoint/Portal.js` (remove o `doPost`
      provisório e o ajuste de indentação, ambos não commitados).
- [ ] `rm -rf src/api/` (ApiGateway.js é não-rastreado; não há histórico a
      preservar).
- [ ] `git status --short` → esperado: árvore limpa.
- [ ] `npm run check` → esperado: 599/599 verde, lint limpo (linha de base).
- [ ] Criar branch de trabalho a partir do HEAD atual:
      `git checkout -b feat/adr-013-oauth-code-flow`
      (o nome `feat/frontend-separado` descreve a abordagem descartada; o
      branch antigo fica intocado como histórico até o merge em `main`).

**Riscos:** nenhum — só descarta material não commitado e não referenciado
(`grep` já confirmou que nada em `src/` usa `ApiGateway`).
**Critérios de aceite:** árvore limpa; suíte e lint verdes; branch novo ativo.

---

### Etapa 1 — ADR-013 (condição 1)

**Arquivos:** criar `docs/adrs/ADR-013-autenticacao-oauth-authorization-code.md`.

- [ ] Redigir o ADR com: **Contexto** (GIS exige "Authorized JavaScript
      origins" registráveis; o HtmlService serve a UI de uma origem dinâmica
      `*.script.googleusercontent.com`, não registrável — causa raiz validada
      na documentação oficial do Google na investigação SPEC-035);
      **Decisão** (Authorization Code Flow server-side com redirect para a
      própria URL `/exec`; troca de código em Adapter; `state` anti-CSRF em
      CacheService com consumo único; Client Secret em Script Property;
      `doGet()` permanece roteador; `id_token` devolvido ao navegador apenas
      nos estados não autenticados, mesma exposição do GIS anterior);
      **Alternativas rejeitadas** (frontend separado + `doPost` — descartado
      pela revisão; biblioteca apps-script-oauth2 — dependência vendorizada
      desnecessária para um único fluxo); **Consequências** (4ª Script
      Property obrigatória; redirect URIs `/exec` e `/dev` registradas no
      GCP Console; chamadas HTTP externas sob a trava global — mesma dívida
      registrada da SPEC-032/CEP; `state` não vinculado ao navegador — 
      hardening opcional futuro via comparação em sessionStorage).
- [ ] Commit: `docs(adr): ADR-013 — autenticação por OAuth 2.0 Authorization Code Flow`.

**Critérios de aceite:** ADR segue o formato dos ADRs existentes; as 6
condições da revisão aparecem como decisões explícitas.

---

### Etapa 2 — Script Property `GOOGLE_CLIENT_SECRET` (condição 2)

**Arquivos:** `src/shared/Config.js`.

- [ ] Adicionar a `CONFIG_KEYS`:

```js
  // client_secret OAuth2 do TEAR (ADR-013) — usado EXCLUSIVAMENTE pelo
  // AdaptadorOAuthGoogle na troca do authorization code. SEGREDO: nunca
  // logar, nunca devolver ao cliente. Provisionado pelo operador.
  GOOGLE_CLIENT_SECRET: 'GOOGLE_CLIENT_SECRET',
```

- [ ] `npm run check` (nenhum teste depende da chave ainda).
- [ ] Commit junto com a Etapa 3 ou 4 (mudança puramente declarativa).

**Critérios de aceite:** `getConfig(CONFIG_KEYS.GOOGLE_CLIENT_SECRET)`
falha-rápido com mensagem padrão quando ausente (comportamento herdado de
`getConfig`, sem código novo).

---

### Etapa 3 — Adapter `GuardiaoDeEstadoOAuth` (condição 3, TDD)

**Arquivos:** criar `src/adapters/GuardiaoDeEstadoOAuth.js`,
`test/oauth-guardiao.test.js`; ajustar `test/helpers/gasHarness.js`.

**Interfaces produzidas:** `new GuardiaoDeEstadoOAuth(cache)` com
`registrar(state): void` e `validarEConsumir(state): boolean` (consumo
único — segunda chamada com o mesmo state devolve `false`).

- [ ] Adicionar aos globals default do harness (`gasGlobals` em
      `test/helpers/gasHarness.js`) fakes mínimos, para não tocar os testes
      existentes um a um:

```js
    CacheService: undefined,
    ScriptApp: undefined,
```

      (permanecem `undefined` por default — os fakes reais entram nos
      testes/fixtures que os exercitam, mesmo padrão de `UrlFetchApp`).
- [ ] Escrever `test/oauth-guardiao.test.js` com fake de cache em memória:

```js
const { loadGas } = require('./helpers/gasHarness');

function fakeCache() {
  const dados = {};
  return {
    put: (k, v, ttl) => { dados[k] = { v, ttl }; },
    get: (k) => (dados[k] ? dados[k].v : null),
    remove: (k) => { delete dados[k]; },
    _dados: dados,
  };
}

describe('GuardiaoDeEstadoOAuth (ADR-013, anti-CSRF)', () => {
  function montar() {
    const gas = loadGas(['src/adapters/GuardiaoDeEstadoOAuth.js']);
    const cache = fakeCache();
    return { guardiao: new gas.GuardiaoDeEstadoOAuth(cache), cache };
  }

  test('registrar grava o state com TTL de 600s', () => {
    const { guardiao, cache } = montar();
    guardiao.registrar('state-1');
    const chave = Object.keys(cache._dados)[0];
    expect(chave).toContain('state-1');
    expect(cache._dados[chave].ttl).toBe(600);
  });

  test('validarEConsumir aceita uma única vez (consumo)', () => {
    const { guardiao } = montar();
    guardiao.registrar('state-1');
    expect(guardiao.validarEConsumir('state-1')).toBe(true);
    expect(guardiao.validarEConsumir('state-1')).toBe(false);
  });

  test('state desconhecido, vazio ou null é recusado', () => {
    const { guardiao } = montar();
    expect(guardiao.validarEConsumir('inexistente')).toBe(false);
    expect(guardiao.validarEConsumir('')).toBe(false);
    expect(guardiao.validarEConsumir(null)).toBe(false);
  });
});
```

- [ ] Rodar: `npx jest test/oauth-guardiao.test.js` → FAIL (classe não existe).
- [ ] Implementar `src/adapters/GuardiaoDeEstadoOAuth.js`:

```js
/**
 * ADAPTADOR: GuardiaoDeEstadoOAuth — guarda anti-CSRF do parâmetro `state`
 * (ADR-013, condição 3). Registra o state emitido no início do login e o
 * valida COM CONSUMO no callback: cada state autoriza exatamente uma troca
 * de código. Cache é injetado (CacheService.getScriptCache() na composição
 * do entrypoint) — este arquivo não toca serviço Google diretamente.
 * Expiração: 600s (janela do login). Cache é best-effort: evicção antecipada
 * derruba o login com ERR_AUTH_STATE_INVALIDO — o usuário recomeça (seguro).
 */

this.GuardiaoDeEstadoOAuth = class GuardiaoDeEstadoOAuth {
  static get TTL_SEGUNDOS() {
    return 600;
  }

  /** @param {{put: Function, get: Function, remove: Function}} cache */
  constructor(cache) {
    this.cache = cache;
  }

  /** @param {string} state nonce opaco (UUID) emitido para este login. */
  registrar(state) {
    this.cache.put(this.chave(state), '1', GuardiaoDeEstadoOAuth.TTL_SEGUNDOS);
  }

  /**
   * @param {string} state valor devolvido pelo provedor no callback.
   * @returns {boolean} true se o state foi emitido por nós e ainda não usado.
   */
  validarEConsumir(state) {
    const valor = String(state == null ? '' : state).trim();
    if (!valor) {
      return false;
    }
    const chave = this.chave(valor);
    const achado = this.cache.get(chave);
    if (achado) {
      this.cache.remove(chave);
    }
    return Boolean(achado);
  }

  chave(state) {
    return 'oauth-state:' + state;
  }
};
```

- [ ] `npx jest test/oauth-guardiao.test.js` → PASS; `npm run check` verde.
- [ ] Commit: `feat(identidade): guarda anti-CSRF de state OAuth (ADR-013 c3)`.

**Riscos:** CacheService é best-effort (evicção antecipada) — efeito é
apenas "recomece o login", nunca bypass. **Critérios de aceite:** consumo
único comprovado por teste; TTL 600s; nenhuma chamada a serviço Google
dentro do adapter (cache injetado).

---

### Etapa 4 — Adapter `AdaptadorOAuthGoogle` (condição 4, TDD)

**Arquivos:** criar `src/adapters/AdaptadorOAuthGoogle.js`,
`test/oauth-adapter.test.js`.

**Interfaces produzidas:**
`new AdaptadorOAuthGoogle(clientId, clientSecret, redirectUri)` com
`construirUrlDeAutorizacao(state): string` e
`trocarCodigoPorIdToken(code): string` (lança `Error` com
`codigo='ERR_AUTH_INVALID_TOKEN'` em qualquer falha — fail-closed, mesmo
contrato do `ValidadorDeTokenGoogle`).

- [ ] Escrever `test/oauth-adapter.test.js` (fake de `UrlFetchApp` no mesmo
      padrão de `test/cep-adapter.test.js`):

```js
const { loadGas } = require('./helpers/gasHarness');

const CLIENT_ID = 'tear-v2.apps.googleusercontent.com';
const CLIENT_SECRET = 'segredo-teste';
const REDIRECT_URI = 'https://script.google.com/macros/s/FAKE/exec';

function montar(respostaToken) {
  const chamadas = [];
  const gas = loadGas(['src/adapters/AdaptadorOAuthGoogle.js'], {
    UrlFetchApp: {
      fetch: (url, opcoes) => {
        chamadas.push({ url, opcoes });
        return respostaToken;
      },
    },
  });
  return {
    adaptador: new gas.AdaptadorOAuthGoogle(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI),
    chamadas,
  };
}

describe('AdaptadorOAuthGoogle (ADR-013, condição 4)', () => {
  test('construirUrlDeAutorizacao monta a URL do endpoint oficial com state', () => {
    const { adaptador } = montar();
    const url = adaptador.construirUrlDeAutorizacao('state-1');
    expect(url).toContain('https://accounts.google.com/o/oauth2/v2/auth?');
    expect(url).toContain('client_id=' + encodeURIComponent(CLIENT_ID));
    expect(url).toContain('redirect_uri=' + encodeURIComponent(REDIRECT_URI));
    expect(url).toContain('response_type=code');
    expect(url).toContain('scope=' + encodeURIComponent('openid email profile'));
    expect(url).toContain('state=state-1');
    expect(url).not.toContain(CLIENT_SECRET); // segredo jamais na URL
  });

  test('trocarCodigoPorIdToken faz POST correto e devolve o id_token', () => {
    const { adaptador, chamadas } = montar({
      getResponseCode: () => 200,
      getContentText: () => JSON.stringify({ id_token: 'id-token-1' }),
    });
    expect(adaptador.trocarCodigoPorIdToken('code-1')).toBe('id-token-1');
    expect(chamadas[0].url).toBe('https://oauth2.googleapis.com/token');
    expect(chamadas[0].opcoes.method).toBe('post');
    expect(chamadas[0].opcoes.muteHttpExceptions).toBe(true);
    expect(chamadas[0].opcoes.payload).toEqual({
      grant_type: 'authorization_code',
      code: 'code-1',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
    });
  });

  test.each([
    ['código vazio', () => montar(), ''],
    ['HTTP != 200', () => montar({ getResponseCode: () => 400, getContentText: () => '{}' }), 'code-1'],
    ['JSON malformado', () => montar({ getResponseCode: () => 200, getContentText: () => 'x' }), 'code-1'],
    ['sem id_token', () => montar({ getResponseCode: () => 200, getContentText: () => '{}' }), 'code-1'],
  ])('fail-closed: %s lança ERR_AUTH_INVALID_TOKEN', (_nome, montarCaso, code) => {
    const { adaptador } = montarCaso();
    expect(() => adaptador.trocarCodigoPorIdToken(code)).toThrow(
      expect.objectContaining({ codigo: 'ERR_AUTH_INVALID_TOKEN' })
    );
  });

  test('mensagem de erro nunca contém code nem client_secret', () => {
    const { adaptador } = montar({ getResponseCode: () => 400, getContentText: () => '{}' });
    try {
      adaptador.trocarCodigoPorIdToken('code-super-secreto');
    } catch (erro) {
      expect(erro.message).not.toContain('code-super-secreto');
      expect(erro.message).not.toContain(CLIENT_SECRET);
    }
  });
});
```

- [ ] Rodar: `npx jest test/oauth-adapter.test.js` → FAIL.
- [ ] Implementar `src/adapters/AdaptadorOAuthGoogle.js` (JSDoc no padrão
      dos adapters existentes; `erroInvalido(motivo)` idêntico ao de
      `ValidadorDeTokenGoogle`, sem jamais incluir code/segredo):

```js
this.AdaptadorOAuthGoogle = class AdaptadorOAuthGoogle {
  constructor(clientId, clientSecret, redirectUri) {
    this.clientId = String(clientId == null ? '' : clientId).trim();
    this.clientSecret = String(clientSecret == null ? '' : clientSecret).trim();
    this.redirectUri = String(redirectUri == null ? '' : redirectUri).trim();
  }

  construirUrlDeAutorizacao(state) {
    return (
      'https://accounts.google.com/o/oauth2/v2/auth?' +
      [
        'client_id=' + encodeURIComponent(this.clientId),
        'redirect_uri=' + encodeURIComponent(this.redirectUri),
        'response_type=code',
        'scope=' + encodeURIComponent('openid email profile'),
        'state=' + encodeURIComponent(state),
        'prompt=select_account',
      ].join('&')
    );
  }

  trocarCodigoPorIdToken(code) {
    const codigo = String(code == null ? '' : code).trim();
    if (!codigo) {
      throw this.erroInvalido('código de autorização vazio');
    }
    const resposta = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', {
      method: 'post',
      muteHttpExceptions: true,
      payload: {
        grant_type: 'authorization_code',
        code: codigo,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
      },
    });
    if (resposta.getResponseCode() !== 200) {
      throw this.erroInvalido('troca de código recusada pelo provedor de identidade');
    }
    let corpo;
    try {
      corpo = JSON.parse(resposta.getContentText());
    } catch {
      throw this.erroInvalido('resposta malformada do provedor de identidade');
    }
    const idToken = String((corpo && corpo.id_token) == null ? '' : corpo.id_token).trim();
    if (!idToken) {
      throw this.erroInvalido('resposta sem id_token');
    }
    return idToken;
  }

  erroInvalido(motivo) {
    const erro = new Error('ERR_AUTH_INVALID_TOKEN: ' + motivo + '.');
    erro.codigo = 'ERR_AUTH_INVALID_TOKEN';
    return erro;
  }
};
```

- [ ] `npx jest test/oauth-adapter.test.js` → PASS; `npm run check` verde.
- [ ] Commit (inclui Etapa 2): `feat(identidade): adapter de troca de código OAuth + client secret (ADR-013 c2/c4)`.

**Riscos:** contrato do endpoint `token` do Google (formato do payload) só é
exercitado de verdade na homologação — o teste garante o nosso lado.
**Critérios de aceite:** troca isolada no adapter (nenhum outro arquivo fala
com o endpoint `token`); fail-closed comprovado; segredo fora de URL/erro.

---

### Etapa 5 — `UsuarioService.iniciarLogin`/`entrarComCodigo` + Controller (TDD)

**Arquivos:** `src/service/UsuarioService.js`,
`src/controller/UsuarioController.js`, `test/usuario-service.test.js`,
`test/usuario-controller.test.js`.

**Interfaces:**
- Consome: `AdaptadorOAuthGoogle` (Etapa 4), `GuardiaoDeEstadoOAuth`
  (Etapa 3), `UsuarioService.entrar` (existente, inalterado).
- Produz: `iniciarLogin(): {urlDeAutorizacao: string}`;
  `entrarComCodigo({code, state})` → mesmo contrato de `entrar`, com
  `idToken` anexado aos resultados não-`AUTENTICADO`; erro novo
  `ERR_AUTH_STATE_INVALIDO`.

- [ ] Testes novos em `test/usuario-service.test.js` (fakes das duas portas;
      seguir o `montar()` já existente no arquivo, acrescentando os dois
      parâmetros ao construtor):

```js
// fakes locais do describe novo
function fakePortasOAuth() {
  const registrados = new Set();
  return {
    trocador: {
      urls: [],
      construirUrlDeAutorizacao(state) {
        this.urls.push(state);
        return 'https://auth.exemplo/?state=' + state;
      },
      trocas: [],
      trocarCodigoPorIdToken(code) {
        this.trocas.push(code);
        if (code === 'code-valido') return 'tok-maria';
        const erro = new Error('ERR_AUTH_INVALID_TOKEN: recusado.');
        erro.codigo = 'ERR_AUTH_INVALID_TOKEN';
        throw erro;
      },
    },
    guardiao: {
      registrar: (s) => registrados.add(s),
      validarEConsumir: (s) => registrados.delete(s),
    },
  };
}

test('iniciarLogin registra state novo e devolve a URL de autorização', ...);
test('entrarComCodigo com state inválido lança ERR_AUTH_STATE_INVALIDO sem trocar código', ...);
test('entrarComCodigo com state válido troca o código e autentica (AUTENTICADO)', ...);
test('entrarComCodigo anexa idToken quando o resultado é CANDIDATA_VINCULACAO/ONBOARDING_REQUERIDO', ...);
test('state é de uso único: segunda chamada com o mesmo state falha', ...);
```

- [ ] Rodar: `npx jest test/usuario-service.test.js` → FAIL.
- [ ] Implementar em `UsuarioService`: construtor ganha, **ao final**,
      `trocadorDeCodigoOAuth` e `guardiaoDeEstadoOAuth` (aditivo — chamadas
      existentes que não passam os parâmetros continuam válidas para os
      métodos antigos); métodos novos:

```js
  /**
   * ADR-013: inicia o login federado — emite o state anti-CSRF (condição 3)
   * e devolve a URL de autorização do provedor para redirect top-level.
   * @returns {{urlDeAutorizacao: string}}
   */
  iniciarLogin() {
    const state = this.geradorDeToken.gerar();
    this.guardiaoDeEstadoOAuth.registrar(state);
    return { urlDeAutorizacao: this.trocadorDeCodigoOAuth.construirUrlDeAutorizacao(state) };
  }

  /**
   * ADR-013: callback do Authorization Code Flow. Valida e CONSOME o state
   * (anti-CSRF), troca o código por id_token (Adapter, condição 4) e delega
   * ao fluxo de entrada existente (§9.2) — nenhuma regra de identidade nova.
   * Estados não autenticados carregam o idToken para os fluxos de
   * vinculação/onboarding existentes (mesma exposição do GIS anterior:
   * token do próprio usuário, no próprio navegador).
   * @param {{code: string, state: string}} dados
   * @throws {Error} ERR_AUTH_STATE_INVALIDO; ERR_AUTH_INVALID_TOKEN; demais de entrar().
   */
  entrarComCodigo(dados) {
    if (!this.guardiaoDeEstadoOAuth.validarEConsumir(dados && dados.state)) {
      throw erroComCodigo(
        'ERR_AUTH_STATE_INVALIDO',
        'Sessão de login inválida ou expirada — recomece o login.'
      );
    }
    const idToken = this.trocadorDeCodigoOAuth.trocarCodigoPorIdToken(dados && dados.code);
    const resultado = this.entrar({ idToken: idToken });
    if (resultado.status !== 'AUTENTICADO') {
      resultado.idToken = idToken;
    }
    return resultado;
  }
```

- [ ] `UsuarioController`: métodos novos, mesmo padrão dos pares
      (`projetarResultadoDeEntrada` já repassa resultados não-`AUTENTICADO`
      como estão — o `idToken` anexado flui sem mudança):

```js
  iniciarLogin() {
    try {
      return envelopeOk(this.usuarioService.iniciarLogin());
    } catch (erro) {
      return falharComCodigo(erro);
    }
  }

  entrarComCodigo(dados) {
    try {
      return envelopeOk(this.projetarResultadoDeEntrada(this.usuarioService.entrarComCodigo(dados)));
    } catch (erro) {
      return falharComCodigo(erro);
    }
  }
```

- [ ] Testes de controller: envelope ok com `urlDeAutorizacao`; envelope de
      erro com `codigo: 'ERR_AUTH_STATE_INVALIDO'`; `AUTENTICADO` projeta
      token/parceiraId/expiraEm/papel (nunca a instância de `Sessao`).
- [ ] `npm run check` verde.
- [ ] Commit: `feat(identidade): login por authorization code no UsuarioService/Controller (ADR-013)`.

**Riscos:** ordem dos parâmetros do construtor — anexar ao FINAL e atualizar
todos os `new UsuarioService(...)` de teste no mesmo commit.
**Critérios de aceite:** `entrar({idToken})` intocado (diff nulo no método);
state consumido antes de qualquer chamada externa; suíte verde.

---

### Etapa 6 — Entrypoint `Portal.js`: composição e rotas (condições 5 e 6)

**Arquivos:** `src/entrypoint/Portal.js`, `test/portal-usuario.test.js`,
`test/helpers/rbacFixture.js` (e qualquer fixture que provisione
`GOOGLE_CLIENT_ID` no fake de `PropertiesService` — adicionar
`GOOGLE_CLIENT_SECRET` ao lado).

- [ ] `montarUsuarioService()` compõe as duas portas novas (entrypoint é o
      único a tocar `CacheService`/`ScriptApp`):

```js
    new AdaptadorOAuthGoogle(
      getConfig(CONFIG_KEYS.GOOGLE_CLIENT_ID),
      getConfig(CONFIG_KEYS.GOOGLE_CLIENT_SECRET),
      ScriptApp.getService().getUrl()
    ),
    new GuardiaoDeEstadoOAuth(CacheService.getScriptCache())
```

- [ ] Funções expostas novas (envelope padrão, mesmos moldes dos pares):
      `iniciarLoginComGoogle()` (sem trava — não escreve em aba) e
      `entrarComCodigoOAuth(dados)` (sob `comTravaDeAcesso`, como era
      `entrarComGoogle`).
- [ ] **Remover** `entrarComGoogle` e `obterConfiguracaoDeLogin` (+ entradas
      no `module.exports`) — plumbing exclusivo do GIS descartado (condição
      6). `confirmarVinculacaoDeIdentidade`/`completarCadastroDeUsuario`
      permanecem (continuam recebendo `idToken`, agora vindo do code flow).
- [ ] `doGet()` NÃO muda (condição 5): o callback `?code=…` cai na rota
      default (login) e é tratado no cliente.
- [ ] Atualizar `test/portal-usuario.test.js`: fake de `UrlFetchApp` passa a
      atender DOIS endpoints (`oauth2.googleapis.com/token` mapeando
      `code-maria`→`tok-maria` etc., e o `tokeninfo` existente); adicionar
      fakes `CacheService` (cache em memória) e
      `ScriptApp.getService().getUrl()`; jornadas reescritas:
      `iniciarLoginComGoogle()` → extrair `state` da URL devolvida →
      `entrarComCodigoOAuth({code, state})` → mesmos asserts de hoje
      (AUTENTICADO/CANDIDATA/ONBOARDING/PENDING, aba `SESSOES`, RBAC).
      Acrescentar: state reutilizado → envelope de erro
      `ERR_AUTH_STATE_INVALIDO`.
- [ ] Atualizar `test/helpers/rbacFixture.js` e fixtures equivalentes:
      +`GOOGLE_CLIENT_SECRET` nas properties fake, +fakes de
      `CacheService`/`ScriptApp` se a fixture montar o `UsuarioService`
      (confirmar no próprio arquivo ao editar).
- [ ] `npm run check` → suíte completa verde (599+ testes), lint limpo.
- [ ] Commit: `feat(identidade): entrypoint OAuth code flow e descarte do plumbing GIS (ADR-013 c5/c6)`.

**Riscos:** (a) `getConfig(GOOGLE_CLIENT_SECRET)` é eager em
`montarUsuarioService`, chamado também por `exigirPapelAdministrador` — se o
operador não provisionar a property, TODAS as rotas administrativas falham
fail-fast com mensagem clara (mesmo comportamento já existente do
`GOOGLE_CLIENT_ID`; documentado no checklist na Etapa 8). (b)
`ScriptApp.getService().getUrl()` devolve a URL do deployment em uso
(`/exec` ou `/dev`) — ambas precisam estar registradas no GCP Console.
**Critérios de aceite:** nenhuma referência a `entrarComGoogle`/
`obterConfiguracaoDeLogin`/`gsi` restante em `src/` (grep); jornada completa
candidata→vinculação→aprovação→login verde via code flow; RBAC intocado.

---

### Etapa 7 — `login.html`: redirect + callback (remove GIS e o debug de f307eae)

**Arquivos:** `src/ui/login.html`.

- [ ] Remover: `<script src="https://accounts.google.com/gsi/client">`,
      `aguardarGis`, `aoReceberCredencial`, o bloco
      `obterConfiguracaoDeLogin` e os `console.log` temporários (commit
      f307eae).
- [ ] `painelLogin` ganha botão próprio:

```html
      <section id="painelLogin">
        <button type="button" id="entrarComGoogle">Entrar com Google</button>
      </section>
```

- [ ] Novo bootstrap no script (substitui o bloco GIS; demais handlers —
      vinculação, onboarding, `tratarResultadoEntrada`, mensagens de espera
      — permanecem como estão):

```js
      document.getElementById('entrarComGoogle').addEventListener('click', function () {
        avisar('Redirecionando para o Google…');
        google.script.run
          .withSuccessHandler(function (resposta) {
            if (!resposta.success) {
              avisar(resposta.error.mensagem);
              return;
            }
            window.top.location.href = resposta.data.urlDeAutorizacao;
          })
          .withFailureHandler(function (erro) {
            avisar(erro.message);
          })
          .iniciarLoginComGoogle();
      });

      // Callback do Authorization Code Flow (ADR-013): o Google devolve
      // code/state na URL /exec; doGet segue roteador puro — é o cliente
      // que lê os parâmetros e completa a troca no backend.
      if (!token) {
        google.script.url.getLocation(function (localizacao) {
          var codigo = localizacao.parameter.code;
          var state = localizacao.parameter.state;
          if (!codigo) {
            return; // primeiro acesso: só o botão de login.
          }
          avisar('Entrando…');
          google.script.run
            .withSuccessHandler(tratarResultadoEntrada)
            .withFailureHandler(function (erro) {
              avisar(erro.message);
            })
            .entrarComCodigoOAuth({ code: codigo, state: state });
        });
      }
```

- [ ] `tratarResultadoEntrada`: nos ramos `CANDIDATA_VINCULACAO` e
      `ONBOARDING_REQUERIDO`, acrescentar `idTokenAtual = dados.idToken;`
      (o token deixa de vir do GIS e passa a vir na resposta do backend).
- [ ] `tratarErroDeEntrada`: mapear `ERR_AUTH_STATE_INVALIDO` para mensagem
      amigável + reexibir `painelLogin` (recomeço limpo; cobre também o
      reload da URL de callback com code já usado).
- [ ] `npm run check` (a suíte não exercita HTML — garante que nada de
      backend quebrou); revisão manual do HTML (não há harness de UI).
- [ ] Commit: `feat(portal): login.html via redirect OAuth (ADR-013), remove GIS e debug`.

**Riscos:** premissa de que `google.script.url.getLocation` expõe os
parâmetros da URL top-level no HtmlService (API documentada para isso).
**Plano B registrado (não implementar agora):** `doGet` injetar
`e.parameter.code/state` no template — exigiria escape cuidadoso (parâmetros
são controláveis pelo atacante via URL); só adotar se a homologação provar
que `getLocation` não devolve os parâmetros. **Critérios de aceite:** zero
referência a `gsi`/`accounts.google.com/gsi` no repo; fluxos de vinculação/
onboarding preservados byte a byte fora dos pontos listados.

---

### Etapa 8 — Documentação operacional e de estado

**Arquivos:** `docs/_workspace/DEPLOY_CHECKLIST.md`,
`docs/_workspace/ROTEIRO_HOMOLOGACAO.md`, `docs/_workspace/TASK_ROUTER.md`.

- [ ] `DEPLOY_CHECKLIST.md` §2: linha nova `GOOGLE_CLIENT_SECRET`
      (obrigatória para o Portal inteiro — `montarUsuarioService` é eager;
      segredo real, nunca commitado); atualizar a linha `GOOGLE_CLIENT_ID`
      (não há mais uso no frontend); seção nova "GCP Console (ADR-013)":
      credencial "Web application" com **Authorized redirect URIs** =
      URL `/exec` do deployment (e `/dev` para teste do desenvolvedor);
      "Authorized JavaScript origins" deixa de ser necessária (era o
      bloqueio do GIS).
- [ ] `ROTEIRO_HOMOLOGACAO.md`: passo de login reescrito (clique → redirect
      Google → retorno autenticado) + caso de borda novo (reload da URL de
      callback → mensagem de recomeço, `ERR_AUTH_STATE_INVALIDO`).
- [ ] `TASK_ROUTER.md`: na entrada SPEC-035, nota datada 2026-07-18
      (GIS descartado por ADR-013 — incompatibilidade com
      `script.googleusercontent.com`; login agora Authorization Code Flow;
      4ª Script Property; condição 6 cumprida — `frontend separado`/`doPost`
      descartados); adicionar `ADR-013` à tabela §1.
- [ ] Commit: `docs(identidade): checklist, homologação e roteador para ADR-013`.

**Critérios de aceite:** um operador sem contexto consegue provisionar o
GCP Console e as 4 properties só com o checklist.

---

### Etapa 9 — Validação final, push e homologação

- [ ] `npm run check` → suíte completa verde, lint limpo.
- [ ] Grep de segurança: `client_secret`/`GOCSPX` não aparecem em log,
      mensagem de erro nem resposta de envelope (busca em `src/`).
- [ ] `git push -u origin feat/adr-013-oauth-code-flow` (mandato de operação
      autônoma cobre push).
- [ ] **PARADA OBRIGATÓRIA — dependência humana (mandato: credenciais):**
      operador precisa (1) criar/ajustar a credencial OAuth "Web
      application" no GCP Console com as redirect URIs `/exec` e `/dev`,
      (2) copiar o Client Secret para a Script Property
      `GOOGLE_CLIENT_SECRET`. Sem isso não há `clasp push`/homologação real.
- [ ] Após provisionamento: `clasp push` (lembrar: substitui o manifesto
      remoto por completo — checklist §3), novo deployment, homologação do
      roteiro (login Administrador, login Influenciadora vinculada, jornada
      candidata, reload de callback, state reutilizado).
- [ ] Merge em `main` conforme fluxo Git padrão do projeto após homologação.

**Critérios de aceite (fim do plano):** login real funciona no `/exec`;
console do navegador sem erros de origem GIS; `TASK_ROUTER`/checklist
refletem o estado; ADR-013 formaliza a decisão.

---

## Impacto arquitetural (resumo)

- **Zero mudança** no domínio, ACLs, repositories e na stack de sessão —
  a fronteira `entrar({idToken})` absorve o novo transporte inteiro.
- Dois adapters novos, ambos substituíveis (trocar provedor = trocar
  adapter, mesmo princípio do `VerificadorDeCredencialLegado`).
- `id_token` validado DUAS vezes (troca via TLS + `tokeninfo` existente) —
  redundância barata, mantida deliberadamente para não tocar o validador.
- Dívida consciente (registrar no ADR): troca de código + `tokeninfo`
  rodam sob a trava global (`comTravaDeAcesso`) — mesma natureza da dívida
  SPEC-032/CEP já registrada no TASK_ROUTER §7.
- Dívida consciente: `state` prova emissão pelo servidor com consumo único,
  mas não é vinculado ao navegador que iniciou o login (login-CSRF
  teórico); hardening opcional futuro: eco do `state` em `sessionStorage`.

## Rollback

- **Antes do merge:** cada etapa é um commit isolado no branch
  `feat/adr-013-oauth-code-flow` — rollback = `git revert <sha>` da etapa
  (ou descartar o branch inteiro; `main` e `feat/frontend-separado` ficam
  intocados até a homologação passar).
- **Após deploy:** o Apps Script versiona deployments — reverter = reapontar
  o deployment para a versão anterior no editor (sem `clasp push` novo).
  O código antigo (GIS) volta a funcionar exatamente como antes: nenhuma
  aba física, coluna ou Script Property existente é alterada ou removida
  por este plano (a `GOOGLE_CLIENT_SECRET` é aditiva e ignorada pelo código
  antigo; `GOOGLE_CLIENT_ID` continua com a mesma semântica).
- **Dados:** o plano não escreve em nenhuma aba nova nem migra dados —
  `SESSOES`/`SIS_IDENTIDADES` seguem os formatos atuais. Não há rollback de
  dados a considerar.
- **GCP Console:** as redirect URIs adicionadas são inócuas para o fluxo
  antigo; podem permanecer após um rollback.

## Riscos consolidados

| # | Risco | Mitigação |
|---|---|---|
| 1 | Redirect URI não registrada/divergente no GCP Console | Checklist §2 novo; erro do Google é explícito (`redirect_uri_mismatch`); testar com `/dev` antes de `/exec` |
| 2 | `google.script.url.getLocation` não expor `code`/`state` | Premissa validada na homologação cedo (primeiro passo do roteiro); plano B documentado (injeção via template com escape) |
| 3 | `GOOGLE_CLIENT_SECRET` ausente derruba rotas administrativas (eager) | Fail-fast com mensagem `Config ausente`; checklist marca como obrigatória |
| 4 | Evicção antecipada do CacheService | Efeito seguro: usuário recomeça o login (`ERR_AUTH_STATE_INVALIDO`) |
| 5 | Reload da URL de callback (code usado) | UX tratada na Etapa 7 (mensagem + botão de recomeço) |
| 6 | `clasp push` substitui o manifesto remoto | Aviso já existente no checklist §3, repetido na Etapa 9 |
