const { loadGas } = require('./helpers/gasHarness');

function carregar() {
  return loadGas(['src/shared/Nucleo.js', 'src/modulos/Usuario.js']);
}

function erroComCodigo(codigo, mensagem) {
  const erro = new Error(mensagem);
  erro.codigo = codigo;
  return erro;
}

const SESSAO_STUB = {
  token: { valor: 'sess-tok-1' },
  parceiraId: 'maria-silva',
  expiraEm: new Date('2026-07-17T18:00:00.000Z'),
};

const USUARIO_STUB = { subProvider: 'sub-1', email: 'a@b.com', papel: 'ADMINISTRADOR', estado: 'PENDING' };

describe('UsuarioController — envelope padrão (§3.3) e contrato de erros (§14.3)', () => {
  test('entrar AUTENTICADO projeta token/parceiraId/expiraEm ISO, nunca a instância de Sessao', () => {
    const gas = carregar();
    const controller = new gas.UsuarioController({
      entrar: () => ({ status: 'AUTENTICADO', sessao: SESSAO_STUB, papel: 'INFLUENCIADORA' }),
    });

    const resposta = controller.entrar({ idToken: 'tok' });

    expect(resposta.success).toBe(true);
    expect(resposta.data).toEqual({
      status: 'AUTENTICADO',
      token: 'sess-tok-1',
      parceiraId: 'maria-silva',
      expiraEm: '2026-07-17T18:00:00.000Z',
      papel: 'INFLUENCIADORA',
    });
  });

  test('entrar CANDIDATA_VINCULACAO repassa o sinalizador sem sessão', () => {
    const gas = carregar();
    const sinalizador = { status: 'CANDIDATA_VINCULACAO', parceiraId: 'maria-silva', sub: 'sub-1', email: 'a@b.com', name: 'A' };
    const controller = new gas.UsuarioController({ entrar: () => sinalizador });

    const resposta = controller.entrar({ idToken: 'tok' });

    expect(resposta.data).toEqual(sinalizador);
  });

  test('entrar com token inválido devolve ERR_AUTH_INVALID_TOKEN no envelope de erro', () => {
    const gas = carregar();
    const controller = new gas.UsuarioController({
      entrar: () => {
        throw erroComCodigo('ERR_AUTH_INVALID_TOKEN', 'token inválido.');
      },
    });

    const resposta = controller.entrar({ idToken: 'ruim' });

    expect(resposta).toEqual({
      success: false,
      error: { codigo: 'ERR_AUTH_INVALID_TOKEN', mensagem: 'token inválido.' },
    });
  });

  test('confirmarVinculacao projeta o Usuario (nunca dados sensíveis extras)', () => {
    const gas = carregar();
    const controller = new gas.UsuarioController({ confirmarVinculacao: () => USUARIO_STUB });

    const resposta = controller.confirmarVinculacao({ idToken: 'tok', parceiraId: 'maria-silva' });

    expect(resposta.data).toEqual(USUARIO_STUB);
  });

  test('completarCadastro propaga ERR_AUTH_PAPEL_NAO_DISPONIVEL (Marca fora de escopo)', () => {
    const gas = carregar();
    const controller = new gas.UsuarioController({
      completarCadastro: () => {
        throw erroComCodigo('ERR_AUTH_PAPEL_NAO_DISPONIVEL', 'Marca indisponível.');
      },
    });

    const resposta = controller.completarCadastro({ idToken: 'tok', papel: 'MARCA' });

    expect(resposta.success).toBe(false);
    expect(resposta.error.codigo).toBe('ERR_AUTH_PAPEL_NAO_DISPONIVEL');
  });

  test('listarPendentes projeta um array de Usuario', () => {
    const gas = carregar();
    const controller = new gas.UsuarioController({ listarPendentes: () => [USUARIO_STUB] });

    const resposta = controller.listarPendentes({ token: 'tok-admin' });

    expect(resposta.data).toEqual([USUARIO_STUB]);
  });

  test('aprovarUsuario/rejeitarUsuario projetam o Usuario resultante', () => {
    const gas = carregar();
    const controllerAprovar = new gas.UsuarioController({
      aprovarUsuario: () => Object.assign({}, USUARIO_STUB, { estado: 'ACTIVE' }),
    });
    const controllerRejeitar = new gas.UsuarioController({
      rejeitarUsuario: () => Object.assign({}, USUARIO_STUB, { estado: 'REJECTED' }),
    });

    expect(controllerAprovar.aprovarUsuario({ token: 't', subAlvo: 's' }).data.estado).toBe('ACTIVE');
    expect(controllerRejeitar.rejeitarUsuario({ token: 't', subAlvo: 's' }).data.estado).toBe('REJECTED');
  });

  test('inativarUsuario/reativarUsuario projetam o Usuario resultante', () => {
    const gas = carregar();
    const controllerInativar = new gas.UsuarioController({
      inativarUsuario: () => Object.assign({}, USUARIO_STUB, { estado: 'INACTIVE' }),
    });
    const controllerReativar = new gas.UsuarioController({
      reativarUsuario: () => Object.assign({}, USUARIO_STUB, { estado: 'ACTIVE' }),
    });

    expect(controllerInativar.inativarUsuario({ token: 't', subAlvo: 's' }).data.estado).toBe('INACTIVE');
    expect(controllerReativar.reativarUsuario({ token: 't', subAlvo: 's' }).data.estado).toBe('ACTIVE');
  });

  test('erro sem codigo (infraestrutura) segue o padrão dos pares — envelope só com mensagem', () => {
    const gas = carregar();
    const controller = new gas.UsuarioController({
      entrar: () => {
        throw new Error('Falha de leitura na planilha.');
      },
    });

    const resposta = controller.entrar({ idToken: 'tok' });

    expect(resposta).toEqual({ success: false, error: { mensagem: 'Falha de leitura na planilha.' } });
  });
});

describe('UsuarioController — iniciarLogin/entrarComCodigo (ADR-013)', () => {
  test('iniciarLogin devolve a URL de autorização no envelope ok', () => {
    const gas = carregar();
    const controller = new gas.UsuarioController({
      iniciarLogin: () => ({ urlDeAutorizacao: 'https://auth.exemplo/?state=s1' }),
    });

    const resposta = controller.iniciarLogin();

    expect(resposta).toEqual({
      success: true,
      data: { urlDeAutorizacao: 'https://auth.exemplo/?state=s1' },
    });
  });

  test('entrarComCodigo AUTENTICADO projeta a sessão (mesma projeção de entrar)', () => {
    const gas = carregar();
    const controller = new gas.UsuarioController({
      entrarComCodigo: () => ({ status: 'AUTENTICADO', sessao: SESSAO_STUB, papel: 'ADMINISTRADOR' }),
    });

    const resposta = controller.entrarComCodigo({ code: 'c', state: 's' });

    expect(resposta.success).toBe(true);
    expect(resposta.data).toEqual({
      status: 'AUTENTICADO',
      token: 'sess-tok-1',
      parceiraId: 'maria-silva',
      expiraEm: '2026-07-17T18:00:00.000Z',
      papel: 'ADMINISTRADOR',
    });
  });

  test('entrarComCodigo repassa estados não autenticados COM o idToken anexado', () => {
    const gas = carregar();
    const sinalizador = {
      status: 'ONBOARDING_REQUERIDO',
      sub: 'sub-1',
      email: 'a@b.com',
      name: 'A',
      idToken: 'id-tok-1',
    };
    const controller = new gas.UsuarioController({ entrarComCodigo: () => sinalizador });

    const resposta = controller.entrarComCodigo({ code: 'c', state: 's' });

    expect(resposta.data).toEqual(sinalizador);
  });

  test('entrarComCodigo com state inválido devolve ERR_AUTH_STATE_INVALIDO no envelope', () => {
    const gas = carregar();
    const controller = new gas.UsuarioController({
      entrarComCodigo: () => {
        throw erroComCodigo('ERR_AUTH_STATE_INVALIDO', 'recomece o login.');
      },
    });

    const resposta = controller.entrarComCodigo({ code: 'c', state: 'forjado' });

    expect(resposta.success).toBe(false);
    expect(resposta.error.codigo).toBe('ERR_AUTH_STATE_INVALIDO');
  });
});
