const { loadGas } = require('./helpers/gasHarness');

// Slice do M-ID (SPEC-035): Portal → UsuarioController → UsuarioService →
// ValidadorDeTokenGoogle + UsuarioRepository/AdministradorACL/ParceiraACL,
// reaproveitando a stack de sessão de SPEC-025 (§9.2-A) sobre fakes de
// planilha e do endpoint tokeninfo do Google.

const CLIENT_ID = 'tear-v2.apps.googleusercontent.com';

function fakeAbaGravavel(cabecalho, linhas) {
  let rows = [cabecalho.slice()].concat((linhas || []).map((l) => l.slice()));
  return {
    get _rows() {
      return rows;
    },
    getDataRange: () => ({ getValues: () => rows.map((r) => r.slice()) }),
    appendRow: (arr) => rows.push(arr.slice()),
    clearContents() {
      rows = [];
    },
    getRange(linha, coluna, numLinhas) {
      if (numLinhas === undefined) {
        // célula única (mesmo fake de test/perfil-portal.test.js)
        return { setValue: (v) => (rows[linha - 1][coluna - 1] = v) };
      }
      return {
        setValues(valores) {
          valores.forEach((v, i) => {
            rows[linha - 1 + i] = v.slice();
          });
        },
      };
    },
  };
}

function fakeBaseDeDados() {
  return fakeAbaGravavel(['INFLU_KEY', 'STATUS', 'EMAIL', 'SUB_PROVIDER'], [
    ['maria-silva', 'ON', 'maria@exemplo.com', ''],
  ]);
}

// Fake dos DOIS endpoints do provedor (ADR-013): `token` (troca do
// authorization code — code 'code-<idToken>' vira o próprio idToken) e
// `tokeninfo` (cada idToken de teste já vem mapeado às claims
// correspondentes — mesmo princípio do fake de test/cep-adapter.test.js).
function fakeUrlFetchApp() {
  const emissoes = {
    'tok-maria': { sub: 'sub-influ-1', email: 'maria@exemplo.com', name: 'Maria Silva' },
    'tok-admin': { sub: 'sub-admin-1', email: 'admin@elastudio.com', name: 'Ana Souza' },
  };
  return {
    fetch: (url, opcoes) => {
      if (url === 'https://oauth2.googleapis.com/token') {
        const code = String((opcoes && opcoes.payload && opcoes.payload.code) || '');
        if (!code.startsWith('code-')) {
          return { getResponseCode: () => 400, getContentText: () => '{}' };
        }
        return {
          getResponseCode: () => 200,
          getContentText: () => JSON.stringify({ id_token: code.slice('code-'.length) }),
        };
      }
      const idToken = decodeURIComponent(url.split('id_token=')[1]);
      const claims = emissoes[idToken];
      if (!claims) {
        return { getResponseCode: () => 400, getContentText: () => '{}' };
      }
      const agoraSegundos = Math.floor(Date.now() / 1000);
      return {
        getResponseCode: () => 200,
        getContentText: () =>
          JSON.stringify(
            Object.assign({}, claims, {
              aud: CLIENT_ID,
              iss: 'accounts.google.com',
              exp: agoraSegundos + 3600,
              iat: agoraSegundos - 60,
            })
          ),
      };
    },
  };
}

function montar() {
  let uuid = 0;
  const abas = {
    'BASE DE DADOS': fakeBaseDeDados(),
    SESSOES: fakeAbaGravavel(['TOKEN', 'PARCEIRA_ID', 'EXPIRA_EM']),
    BLOQUEIOS: fakeAbaGravavel(['IDENTIFICADOR', 'TENTATIVAS', 'BLOQUEIO_INICIO']),
    SIS_IDENTIDADES: fakeAbaGravavel([
      'SUB_PROVIDER',
      'EMAIL_PERFIL',
      'PAPEL_ATOR',
      'ESTADO_CONTA',
      'DATA_CRIACAO',
      'ULTIMO_ACESSO',
    ]),
    BASE_ADMINISTRADORES: fakeAbaGravavel(['SUB_PROVIDER', 'NOME_COMPLETO', 'AREA_RESPONSABILIDADE']),
  };
  const propriedades = {
    SPREADSHEET_ID: 'fake-spreadsheet-id',
    GOOGLE_CLIENT_ID: CLIENT_ID,
    GOOGLE_CLIENT_SECRET: 'segredo-teste',
  };
  const gas = loadGas(
    [
      'src/shared/Nucleo.js',
      'src/modulos/Autenticacao.js',
      'src/modulos/Arquivamento.js',
      'src/modulos/Usuario.js',
      'src/modulos/Parceira.js',
      'src/entrypoint/Portal.js',
    ],
    {
      PropertiesService: {
        getScriptProperties: () => ({ getProperty: (chave) => propriedades[chave] || null }),
      },
      SpreadsheetApp: {
        openById: () => ({ getSheetByName: (nome) => abas[nome] || null }),
      },
      Utilities: { getUuid: () => 'uuid-' + ++uuid },
      UrlFetchApp: fakeUrlFetchApp(),
      LockService: { getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }) },
    }
  );
  return { gas, abas };
}

/**
 * Jornada de login completa do ADR-013: inicia o login (state emitido no
 * cache fake), extrai o state da URL de autorização e entrega o code no
 * callback — exatamente o que o navegador faz via redirect + getLocation.
 */
function entrarViaGoogle(gas, idToken) {
  const inicio = gas.iniciarLoginComGoogle();
  expect(inicio.success).toBe(true);
  const state = decodeURIComponent(inicio.data.urlDeAutorizacao.match(/state=([^&]+)/)[1]);
  return gas.entrarComCodigoOAuth({ code: 'code-' + idToken, state: state });
}

describe('Entrypoint · Portal — slice de Identidade e Acesso (SPEC-035)', () => {
  test('jornada completa: candidata → vinculação → PENDING bloqueado → aprovação por Administrador (RN-07 seed) → login ACTIVE com INFLU_KEY', () => {
    const { gas, abas } = montar();
    // RN-07: bootstrap manual do primeiro Administrador — inserção direta,
    // fora do fluxo de onboarding (mesmo padrão descrito na SPEC).
    abas.SIS_IDENTIDADES._rows.push([
      'sub-admin-1',
      'admin@elastudio.com',
      'ADMINISTRADOR',
      'ACTIVE',
      new Date().toISOString(),
      '',
    ]);

    // 1) Primeiro login de Maria: sub desconhecido, e-mail bate com a
    //    Parceira pré-existente → candidata, sem sessão nem persistência.
    const primeiraTentativa = entrarViaGoogle(gas, 'tok-maria');
    expect(primeiraTentativa.success).toBe(true);
    expect(primeiraTentativa.data).toEqual({
      status: 'CANDIDATA_VINCULACAO',
      parceiraId: 'maria-silva',
      sub: 'sub-influ-1',
      email: 'maria@exemplo.com',
      name: 'Maria Silva',
      // ADR-013: o idToken volta ao navegador nos estados não autenticados
      // para os fluxos de vinculação/onboarding (mesma exposição do GIS).
      idToken: 'tok-maria',
    });

    // 2) Confirmação explícita da vinculação (RN-02 — nunca automática).
    const vinculacao = gas.confirmarVinculacaoDeIdentidade({ idToken: 'tok-maria', parceiraId: 'maria-silva' });
    expect(vinculacao.success).toBe(true);
    expect(vinculacao.data.estado).toBe('PENDING');
    const linhaParceira = abas['BASE DE DADOS']._rows.find((l) => l[0] === 'maria-silva');
    expect(linhaParceira[3]).toBe('sub-influ-1'); // SUB_PROVIDER gravado, INFLU_KEY preservado

    // 3) Login enquanto PENDING é bloqueado (RN-03).
    const loginPendente = entrarViaGoogle(gas, 'tok-maria');
    expect(loginPendente.success).toBe(false);
    expect(loginPendente.error.codigo).toBe('ERR_AUTH_ACCOUNT_PENDING');

    // 4) O Administrador (bootstrap RN-07) faz login e obtém sessão.
    const loginAdmin = entrarViaGoogle(gas, 'tok-admin');
    expect(loginAdmin.success).toBe(true);
    expect(loginAdmin.data.parceiraId).toBe('sub-admin-1'); // sem chave soberana
    const tokenAdmin = loginAdmin.data.token;

    // 5) Painel de moderação lista Maria como pendente.
    const pendentes = gas.listarUsuariosPendentes({ token: tokenAdmin });
    expect(pendentes.success).toBe(true);
    expect(pendentes.data.map((u) => u.subProvider)).toEqual(['sub-influ-1']);

    // 6) Aprovação (RN-04) — dispara a transição PENDING → ACTIVE.
    const aprovacao = gas.aprovarUsuario({ token: tokenAdmin, subAlvo: 'sub-influ-1' });
    expect(aprovacao.success).toBe(true);
    expect(aprovacao.data.estado).toBe('ACTIVE');

    // 7) Login de Maria agora funciona — Sessão carrega a INFLU_KEY
    //    soberana (não o sub), reaproveitando Sessao/TokenDeSessao/
    //    SessaoRepository de SPEC-025 (§9.2-A) — mesma aba SESSOES do
    //    login legado.
    const loginFinal = entrarViaGoogle(gas, 'tok-maria');
    expect(loginFinal.success).toBe(true);
    expect(loginFinal.data.parceiraId).toBe('maria-silva');
    const linhaSessao = abas.SESSOES._rows.find((l) => l[1] === 'maria-silva');
    expect(linhaSessao).toBeDefined();
  });

  test('sessão emitida via Google é renovada/encerrada pelo AcessoController já existente (§9.2-A — reuso, não duplicação)', () => {
    const { gas, abas } = montar();
    abas.SIS_IDENTIDADES._rows.push([
      'sub-admin-1',
      'admin@elastudio.com',
      'ADMINISTRADOR',
      'ACTIVE',
      new Date().toISOString(),
      '',
    ]);

    const login = entrarViaGoogle(gas, 'tok-admin');
    const token = login.data.token;

    const renovada = gas.renovarSessaoDoPortal({ token: token });
    expect(renovada.success).toBe(true);
    expect(renovada.data.parceiraId).toBe('sub-admin-1');

    const logout = gas.sairDoPortal({ token: token });
    expect(logout.success).toBe(true);
    expect(abas.SESSOES._rows.find((l) => l[0] === token)).toBeUndefined();
  });

  test('Administrador genuinamente novo completa cadastro (UC-035.03) sem dados contratuais', () => {
    const { gas, abas } = montar();

    const resposta = gas.completarCadastroDeUsuario({
      idToken: 'tok-admin',
      papel: 'ADMINISTRADOR',
      dadosComplementares: { nomeCompleto: 'Ana Souza', areaResponsabilidade: 'Financeiro' },
    });

    expect(resposta.success).toBe(true);
    expect(resposta.data.estado).toBe('PENDING');
    const linhaAdmin = abas.BASE_ADMINISTRADORES._rows.find((l) => l[0] === 'sub-admin-1');
    expect(linhaAdmin).toEqual(['sub-admin-1', 'Ana Souza', 'Financeiro']);
  });

  test('Marca é recusada nesta implementação (escopo deferido, SPEC-035 nota de revisão 2)', () => {
    const { gas } = montar();

    const resposta = gas.completarCadastroDeUsuario({ idToken: 'tok-admin', papel: 'MARCA' });

    expect(resposta.success).toBe(false);
    expect(resposta.error.codigo).toBe('ERR_AUTH_PAPEL_NAO_DISPONIVEL');
  });

  test('token inválido/forjado é recusado sem tocar nenhuma aba (§14.1)', () => {
    const { gas, abas } = montar();

    const resposta = entrarViaGoogle(gas, 'token-forjado-que-nao-existe');

    expect(resposta.success).toBe(false);
    expect(resposta.error.codigo).toBe('ERR_AUTH_INVALID_TOKEN');
    expect(abas.SIS_IDENTIDADES._rows).toHaveLength(1); // só o cabeçalho
  });

  test('Administrador suspende e reativa uma conta ACTIVE (§3.1.3/§7.2)', () => {
    const { gas, abas } = montar();
    abas.SIS_IDENTIDADES._rows.push([
      'sub-admin-1',
      'admin@elastudio.com',
      'ADMINISTRADOR',
      'ACTIVE',
      new Date().toISOString(),
      '',
    ]);
    abas['BASE DE DADOS']._rows[1][3] = 'sub-influ-1';
    abas.SIS_IDENTIDADES._rows.push([
      'sub-influ-1',
      'maria@exemplo.com',
      'INFLUENCIADORA',
      'ACTIVE',
      new Date().toISOString(),
      '',
    ]);
    const tokenAdmin = entrarViaGoogle(gas, 'tok-admin').data.token;

    const suspensao = gas.inativarUsuario({ token: tokenAdmin, subAlvo: 'sub-influ-1' });
    expect(suspensao.success).toBe(true);
    expect(suspensao.data.estado).toBe('INACTIVE');

    const loginBloqueado = entrarViaGoogle(gas, 'tok-maria');
    expect(loginBloqueado.success).toBe(false);
    expect(loginBloqueado.error.codigo).toBe('ERR_AUTH_ACCOUNT_INACTIVE');

    const reativacao = gas.reativarUsuario({ token: tokenAdmin, subAlvo: 'sub-influ-1' });
    expect(reativacao.success).toBe(true);
    expect(reativacao.data.estado).toBe('ACTIVE');

    const loginLiberado = entrarViaGoogle(gas, 'tok-maria');
    expect(loginLiberado.success).toBe(true);
    expect(loginLiberado.data.parceiraId).toBe('maria-silva');
  });

  test('não-Administrador não pode aprovar nem listar pendentes (RBAC, §8.3)', () => {
    const { gas, abas } = montar();
    // Maria já ACTIVE, sem passar pelo fluxo completo.
    abas['BASE DE DADOS']._rows[1][3] = 'sub-influ-1';
    abas.SIS_IDENTIDADES._rows.push([
      'sub-influ-1',
      'maria@exemplo.com',
      'INFLUENCIADORA',
      'ACTIVE',
      new Date().toISOString(),
      '',
    ]);
    const loginMaria = entrarViaGoogle(gas, 'tok-maria');
    const tokenMaria = loginMaria.data.token;

    const tentativaListar = gas.listarUsuariosPendentes({ token: tokenMaria });
    const tentativaAprovar = gas.aprovarUsuario({ token: tokenMaria, subAlvo: 'sub-influ-1' });

    expect(tentativaListar.success).toBe(false);
    expect(tentativaListar.error.codigo).toBe('ERR_AUTH_UNAUTHORIZED_ROLE');
    expect(tentativaAprovar.error.codigo).toBe('ERR_AUTH_UNAUTHORIZED_ROLE');
  });
});

describe('Entrypoint · Portal — anti-CSRF do Authorization Code Flow (ADR-013)', () => {
  test('state forjado (não emitido) é recusado com ERR_AUTH_STATE_INVALIDO sem trocar código', () => {
    const { gas, abas } = montar();

    const resposta = gas.entrarComCodigoOAuth({ code: 'code-tok-admin', state: 'forjado' });

    expect(resposta.success).toBe(false);
    expect(resposta.error.codigo).toBe('ERR_AUTH_STATE_INVALIDO');
    expect(abas.SESSOES._rows).toHaveLength(1); // só o cabeçalho
  });

  test('state é de uso único: reusar o mesmo state (reload da URL de callback) é recusado', () => {
    const { gas, abas } = montar();
    abas.SIS_IDENTIDADES._rows.push([
      'sub-admin-1',
      'admin@elastudio.com',
      'ADMINISTRADOR',
      'ACTIVE',
      new Date().toISOString(),
      '',
    ]);
    const inicio = gas.iniciarLoginComGoogle();
    const state = decodeURIComponent(inicio.data.urlDeAutorizacao.match(/state=([^&]+)/)[1]);

    const primeira = gas.entrarComCodigoOAuth({ code: 'code-tok-admin', state: state });
    expect(primeira.success).toBe(true);

    const reuso = gas.entrarComCodigoOAuth({ code: 'code-tok-admin', state: state });
    expect(reuso.success).toBe(false);
    expect(reuso.error.codigo).toBe('ERR_AUTH_STATE_INVALIDO');
  });
});
