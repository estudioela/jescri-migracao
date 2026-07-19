const { loadGas } = require('./helpers/gasHarness');

const ARQUIVOS = [
  'src/modulos/Usuario.js',
  'src/domain/TokenDeSessao.js',
  'src/domain/Sessao.js',
];

const AGORA = new Date('2026-07-17T10:00:00Z');

function codigoDe(fn) {
  try {
    fn();
  } catch (erro) {
    return erro.codigo;
  }
  return null;
}

// Stubs em memória das portas do Service — mesmo estilo de
// test/acesso-service.test.js. `usuarioRepository`/`administradorACL`/
// `parceiraACL` são dublês do contrato já coberto pelas suítes de
// ACL/Repository (test/usuario-acl.test.js, usuario-repository.test.js,
// usuario-vinculacao-acl.test.js) — aqui isola-se só a orquestração.
function montar(opcoes) {
  const gas = loadGas(ARQUIVOS);
  const estado = {
    usuarios: {}, // subProvider -> Usuario
    administradores: {}, // subProvider -> {nomeCompleto, areaResponsabilidade}
    parceiras: (opcoes && opcoes.parceiras) || {}, // email -> {parceiraId, subProvider}
    sessoes: {}, // token -> Sessao
    eventos: [],
    agora: (opcoes && opcoes.agora) || AGORA,
  };

  const usuarioRepository = {
    buscarPorSub: (sub) => estado.usuarios[sub] || null,
    salvar: (usuario) => {
      estado.usuarios[usuario.subProvider] = usuario;
      return usuario;
    },
    listarPendentes: () =>
      Object.values(estado.usuarios).filter((u) => u.estado === 'PENDING'),
  };

  const administradorACL = {
    inserir: (dados) => {
      estado.administradores[dados.subProvider] = dados;
    },
  };

  const parceiraACL = {
    buscarCandidataPorEmail: (email) => {
      const registro = Object.values(estado.parceiras).find(
        (p) => p.email.toLowerCase() === String(email).toLowerCase() && !p.subProvider
      );
      return registro ? { parceiraId: registro.parceiraId } : null;
    },
    vincularSubProvider: (parceiraId, sub) => {
      const registro = Object.values(estado.parceiras).find((p) => p.parceiraId === parceiraId);
      if (!registro) throw new Error('Parceira não encontrada.');
      registro.subProvider = sub;
    },
    obterPorSubProvider: (sub) => {
      const registro = Object.values(estado.parceiras).find((p) => p.subProvider === sub);
      return registro ? { parceiraId: registro.parceiraId } : null;
    },
  };

  const sessaoRepository = {
    salvar: (sessao) => {
      estado.sessoes[sessao.token.valor] = sessao;
      return sessao;
    },
  };

  const acessoPortalService = {
    renovar: ({ token }) => {
      const sessao = estado.sessoes[token];
      if (!sessao) {
        const erro = new Error('AC-03');
        erro.codigo = 'AC-03';
        throw erro;
      }
      return sessao;
    },
  };

  const validadorDeToken = (opcoes && opcoes.validadorDeToken) || {
    validar: (idToken) => {
      const identidades = {
        'tok-admin-novo': { sub: 'sub-admin-1', email: 'admin@elastudio.com', name: 'Ana' },
        'tok-influ-vinculada': { sub: 'sub-influ-1', email: 'maria@exemplo.com', name: 'Maria' },
        'tok-influ-sem-match': { sub: 'sub-influ-2', email: 'ninguem@exemplo.com', name: 'Bia' },
      };
      const identidade = identidades[idToken];
      if (!identidade) {
        const erro = new Error('ERR_AUTH_INVALID_TOKEN: token não reconhecido no teste.');
        erro.codigo = 'ERR_AUTH_INVALID_TOKEN';
        throw erro;
      }
      return identidade;
    },
  };

  // Portas OAuth (ADR-013): trocador mapeia code→idToken dos mesmos tokens
  // do validador fake; guardião consome states em memória.
  const statesRegistrados = new Set();
  const trocadorDeCodigoOAuth = {
    trocas: [],
    construirUrlDeAutorizacao(state) {
      return 'https://auth.exemplo/?state=' + state;
    },
    trocarCodigoPorIdToken(code) {
      this.trocas.push(code);
      const mapa = {
        'code-admin-novo': 'tok-admin-novo',
        'code-influ-vinculada': 'tok-influ-vinculada',
        'code-influ-sem-match': 'tok-influ-sem-match',
      };
      if (!mapa[code]) {
        const erro = new Error('ERR_AUTH_INVALID_TOKEN: troca recusada no teste.');
        erro.codigo = 'ERR_AUTH_INVALID_TOKEN';
        throw erro;
      }
      return mapa[code];
    },
  };
  const guardiaoDeEstadoOAuth = {
    registrar: (state) => statesRegistrados.add(state),
    validarEConsumir: (state) => statesRegistrados.delete(state),
  };

  const servico = new gas.UsuarioService(
    validadorDeToken,
    usuarioRepository,
    administradorACL,
    parceiraACL,
    sessaoRepository,
    acessoPortalService,
    { gerar: () => 'sess-tok-' + (Object.keys(estado.sessoes).length + 1) },
    { hoje: () => estado.agora },
    { publicar: (evento) => estado.eventos.push(evento) },
    trocadorDeCodigoOAuth,
    guardiaoDeEstadoOAuth
  );

  return {
    gas,
    servico,
    estado,
    usuarioRepository,
    parceiraACL,
    trocadorDeCodigoOAuth,
    guardiaoDeEstadoOAuth,
    statesRegistrados,
  };
}

function influenciadoraAtiva(estado, usuarioRepository, parceiraACL, gas) {
  estado.parceiras['maria-silva'] = { parceiraId: 'maria-silva', email: 'maria@exemplo.com', subProvider: '' };
  parceiraACL.vincularSubProvider('maria-silva', 'sub-influ-1');
  usuarioRepository.salvar(
    gas.Usuario.novo('sub-influ-1', 'maria@exemplo.com', 'INFLUENCIADORA', AGORA).aprovar()
  );
}

function administradorAtivo(estado, usuarioRepository, gas, sub) {
  usuarioRepository.salvar(gas.Usuario.novo(sub, 'admin@elastudio.com', 'ADMINISTRADOR', AGORA).aprovar());
}

describe('UsuarioService.entrar (SPEC-035 UC-035.01/02, §9.2)', () => {
  test('Influenciadora ACTIVE: resolve INFLU_KEY via SUB_PROVIDER e emite Sessão reaproveitando Sessao/TokenDeSessao (§9.2-A)', () => {
    const { gas, servico, estado, usuarioRepository, parceiraACL } = montar();
    influenciadoraAtiva(estado, usuarioRepository, parceiraACL, gas);

    const resultado = servico.entrar({ idToken: 'tok-influ-vinculada' });

    expect(resultado.status).toBe('AUTENTICADO');
    expect(resultado.sessao).toBeInstanceOf(gas.Sessao);
    expect(resultado.sessao.parceiraId).toBe('maria-silva'); // INFLU_KEY, não o sub
    expect(estado.sessoes[resultado.sessao.token.valor]).toBe(resultado.sessao);
  });

  test('Administrador ACTIVE: usa o próprio sub como identificador de sessão (sem chave soberana)', () => {
    const { gas, servico, estado, usuarioRepository } = montar();
    administradorAtivo(estado, usuarioRepository, gas, 'sub-admin-1');

    const resultado = servico.entrar({ idToken: 'tok-admin-novo' });

    expect(resultado.status).toBe('AUTENTICADO');
    expect(resultado.sessao.parceiraId).toBe('sub-admin-1');
  });

  test('conta PENDING é bloqueada com o código correspondente (RN-03)', () => {
    const { gas, servico, estado, usuarioRepository } = montar();
    usuarioRepository.salvar(gas.Usuario.novo('sub-admin-1', 'admin@elastudio.com', 'ADMINISTRADOR', AGORA));

    expect(codigoDe(() => servico.entrar({ idToken: 'tok-admin-novo' }))).toBe('ERR_AUTH_ACCOUNT_PENDING');
    expect(estado.sessoes).toEqual({});
  });

  test('conta INACTIVE é bloqueada (RN-03/§14.3 ERR_AUTH_ACCOUNT_INACTIVE)', () => {
    const { gas, servico, usuarioRepository } = montar();
    usuarioRepository.salvar(
      gas.Usuario.novo('sub-admin-1', 'admin@elastudio.com', 'ADMINISTRADOR', AGORA).aprovar().inativar()
    );

    expect(codigoDe(() => servico.entrar({ idToken: 'tok-admin-novo' }))).toBe('ERR_AUTH_ACCOUNT_INACTIVE');
  });

  test('conta REJECTED é bloqueada', () => {
    const { gas, servico, usuarioRepository } = montar();
    usuarioRepository.salvar(
      gas.Usuario.novo('sub-admin-1', 'admin@elastudio.com', 'ADMINISTRADOR', AGORA).rejeitar()
    );

    expect(codigoDe(() => servico.entrar({ idToken: 'tok-admin-novo' }))).toBe('ERR_AUTH_ACCOUNT_REJECTED');
  });

  test('sub desconhecido com candidata por e-mail: devolve candidata, sem criar Usuario nem Sessão (RN-02 — nunca vincula automaticamente)', () => {
    const { servico, estado } = montar();
    estado.parceiras['maria-silva'] = { parceiraId: 'maria-silva', email: 'maria@exemplo.com', subProvider: '' };

    const resultado = servico.entrar({ idToken: 'tok-influ-vinculada' });

    expect(resultado).toEqual({
      status: 'CANDIDATA_VINCULACAO',
      parceiraId: 'maria-silva',
      sub: 'sub-influ-1',
      email: 'maria@exemplo.com',
      name: 'Maria',
    });
    expect(estado.usuarios['sub-influ-1']).toBeUndefined();
    expect(estado.sessoes).toEqual({});
  });

  test('sub desconhecido sem candidata: sinaliza onboarding requerido, sem persistir nada', () => {
    const { servico } = montar();

    const resultado = servico.entrar({ idToken: 'tok-influ-sem-match' });

    expect(resultado).toEqual({
      status: 'ONBOARDING_REQUERIDO',
      sub: 'sub-influ-2',
      email: 'ninguem@exemplo.com',
      name: 'Bia',
    });
  });

  test('token inválido propaga ERR_AUTH_INVALID_TOKEN sem consultar o Repository (§9.2 passo 3)', () => {
    const { servico, usuarioRepository } = montar();
    const spy = jest.spyOn(usuarioRepository, 'buscarPorSub');

    expect(codigoDe(() => servico.entrar({ idToken: 'token-forjado' }))).toBe('ERR_AUTH_INVALID_TOKEN');
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('UsuarioService.confirmarVinculacao (SPEC-035 §5.1-A)', () => {
  test('vincula SUB_PROVIDER à Parceira confirmada e cria Usuario PENDING (RN-04)', () => {
    const { gas, servico, estado } = montar();
    estado.parceiras['maria-silva'] = { parceiraId: 'maria-silva', email: 'maria@exemplo.com', subProvider: '' };

    const usuario = servico.confirmarVinculacao({ idToken: 'tok-influ-vinculada', parceiraId: 'maria-silva' });

    expect(usuario).toBeInstanceOf(gas.Usuario);
    expect(usuario.estado).toBe('PENDING');
    expect(usuario.papel).toBe('INFLUENCIADORA');
    expect(estado.parceiras['maria-silva'].subProvider).toBe('sub-influ-1');
    expect(estado.eventos).toContainEqual(
      expect.objectContaining({ nome: 'UsuarioCadastradoEvent', subProvider: 'sub-influ-1' })
    );
  });

  test('parceiraId divergente da candidata real é recusado (evita vinculação manipulada)', () => {
    const { servico, estado } = montar();
    estado.parceiras['maria-silva'] = { parceiraId: 'maria-silva', email: 'maria@exemplo.com', subProvider: '' };
    estado.parceiras['outra-influ'] = { parceiraId: 'outra-influ', email: 'outra@exemplo.com', subProvider: '' };

    expect(() =>
      servico.confirmarVinculacao({ idToken: 'tok-influ-vinculada', parceiraId: 'outra-influ' })
    ).toThrow();
  });
});

describe('UsuarioService.completarCadastro (SPEC-035 §3.1.2 — sem dados contratuais)', () => {
  test('Administrador: cria Usuario PENDING e grava dados complementares em BASE_ADMINISTRADORES', () => {
    const { gas, servico, estado } = montar();

    const usuario = servico.completarCadastro({
      idToken: 'tok-admin-novo',
      papel: 'ADMINISTRADOR',
      dadosComplementares: { nomeCompleto: 'Ana Souza', areaResponsabilidade: 'Financeiro' },
    });

    expect(usuario).toBeInstanceOf(gas.Usuario);
    expect(usuario.estado).toBe('PENDING');
    expect(estado.administradores['sub-admin-1']).toEqual({
      subProvider: 'sub-admin-1',
      nomeCompleto: 'Ana Souza',
      areaResponsabilidade: 'Financeiro',
    });
  });

  test('Influenciadora sem candidata pré-existente é recusada — M-ID não captura dados contratuais (§1.4/§3.1.2)', () => {
    const { servico } = montar();

    expect(codigoDe(() => servico.completarCadastro({ idToken: 'tok-influ-sem-match', papel: 'INFLUENCIADORA' }))).toBe(
      'ERR_AUTH_PARCEIRA_NAO_ENCONTRADA'
    );
  });

  test('Marca é recusada — ator fora do escopo desta implementação (SPEC-035 nota de revisão 2)', () => {
    const { servico } = montar();

    expect(codigoDe(() => servico.completarCadastro({ idToken: 'tok-admin-novo', papel: 'MARCA' }))).toBe(
      'ERR_AUTH_PAPEL_NAO_DISPONIVEL'
    );
  });

  test('sub já cadastrado é recusado', () => {
    const { gas, servico, usuarioRepository } = montar();
    usuarioRepository.salvar(gas.Usuario.novo('sub-admin-1', 'admin@elastudio.com', 'ADMINISTRADOR', AGORA));

    expect(() =>
      servico.completarCadastro({ idToken: 'tok-admin-novo', papel: 'ADMINISTRADOR', dadosComplementares: {} })
    ).toThrow();
  });
});

describe('UsuarioService.aprovarUsuario/rejeitarUsuario (SPEC-035 RN-04, §12.3)', () => {
  function contexto() {
    const m = montar();
    administradorAtivo(m.estado, m.usuarioRepository, m.gas, 'sub-admin-1');
    m.estado.sessoes['token-admin'] = new m.gas.Sessao(
      'sub-admin-1',
      new m.gas.TokenDeSessao('token-admin'),
      AGORA
    );
    m.usuarioRepository.salvar(m.gas.Usuario.novo('sub-pendente', 'nova@exemplo.com', 'INFLUENCIADORA', AGORA));
    return m;
  }

  test('Administrador ACTIVE aprova PENDING → ACTIVE e publica UsuarioAprovadoEvent', () => {
    const { servico, estado } = contexto();

    const aprovado = servico.aprovarUsuario({ token: 'token-admin', subAlvo: 'sub-pendente' });

    expect(aprovado.estado).toBe('ACTIVE');
    expect(estado.usuarios['sub-pendente'].estado).toBe('ACTIVE');
    expect(estado.eventos).toContainEqual(
      expect.objectContaining({ nome: 'UsuarioAprovadoEvent', subProvider: 'sub-pendente' })
    );
  });

  test('Administrador ACTIVE rejeita PENDING → REJECTED', () => {
    const { servico } = contexto();

    const rejeitado = servico.rejeitarUsuario({ token: 'token-admin', subAlvo: 'sub-pendente' });

    expect(rejeitado.estado).toBe('REJECTED');
  });

  test('não-Administrador não pode aprovar (RBAC — ERR_AUTH_UNAUTHORIZED_ROLE)', () => {
    const m = montar();
    influenciadoraAtiva(m.estado, m.usuarioRepository, m.parceiraACL, m.gas);
    m.estado.sessoes['token-influ'] = new m.gas.Sessao(
      'maria-silva',
      new m.gas.TokenDeSessao('token-influ'),
      AGORA
    );
    m.usuarioRepository.salvar(m.gas.Usuario.novo('sub-pendente', 'nova@exemplo.com', 'INFLUENCIADORA', AGORA));

    expect(codigoDe(() => m.servico.aprovarUsuario({ token: 'token-influ', subAlvo: 'sub-pendente' }))).toBe(
      'ERR_AUTH_UNAUTHORIZED_ROLE'
    );
  });
});

describe('UsuarioService.inativarUsuario/reativarUsuario (SPEC-035 §3.1.3/§4.1/§7.2)', () => {
  test('Administrador ACTIVE suspende conta ACTIVE (ACTIVE → INACTIVE) e publica UsuarioInativadoEvent', () => {
    const { gas, servico, estado, usuarioRepository } = montar();
    administradorAtivo(estado, usuarioRepository, gas, 'sub-admin-1');
    estado.sessoes['token-admin'] = new gas.Sessao('sub-admin-1', new gas.TokenDeSessao('token-admin'), AGORA);
    usuarioRepository.salvar(gas.Usuario.novo('sub-influ-3', 'x@y.com', 'INFLUENCIADORA', AGORA).aprovar());

    const suspenso = servico.inativarUsuario({ token: 'token-admin', subAlvo: 'sub-influ-3' });

    expect(suspenso.estado).toBe('INACTIVE');
    expect(estado.eventos).toContainEqual(
      expect.objectContaining({ nome: 'UsuarioInativadoEvent', subProvider: 'sub-influ-3' })
    );
  });

  test('inativar exige estado ACTIVE de origem (§7.2) — PENDING é recusado', () => {
    const { gas, servico, estado, usuarioRepository } = montar();
    administradorAtivo(estado, usuarioRepository, gas, 'sub-admin-1');
    estado.sessoes['token-admin'] = new gas.Sessao('sub-admin-1', new gas.TokenDeSessao('token-admin'), AGORA);
    usuarioRepository.salvar(gas.Usuario.novo('sub-influ-3', 'x@y.com', 'INFLUENCIADORA', AGORA));

    expect(codigoDe(() => servico.inativarUsuario({ token: 'token-admin', subAlvo: 'sub-influ-3' }))).toBe(
      'ERR_AUTH_ALVO_INVALIDO'
    );
  });

  test('Administrador ACTIVE reativa conta INACTIVE (§7.2 Reativação Operacional)', () => {
    const { gas, servico, estado, usuarioRepository } = montar();
    administradorAtivo(estado, usuarioRepository, gas, 'sub-admin-1');
    estado.sessoes['token-admin'] = new gas.Sessao('sub-admin-1', new gas.TokenDeSessao('token-admin'), AGORA);
    usuarioRepository.salvar(
      gas.Usuario.novo('sub-influ-3', 'x@y.com', 'INFLUENCIADORA', AGORA).aprovar().inativar()
    );

    const reativado = servico.reativarUsuario({ token: 'token-admin', subAlvo: 'sub-influ-3' });

    expect(reativado.estado).toBe('ACTIVE');
  });

  test('não-Administrador não pode inativar/reativar (RBAC)', () => {
    const m = montar();
    influenciadoraAtiva(m.estado, m.usuarioRepository, m.parceiraACL, m.gas);
    m.estado.sessoes['token-influ'] = new m.gas.Sessao('maria-silva', new m.gas.TokenDeSessao('token-influ'), AGORA);
    m.usuarioRepository.salvar(m.gas.Usuario.novo('sub-influ-3', 'x@y.com', 'INFLUENCIADORA', AGORA).aprovar());

    expect(
      codigoDe(() => m.servico.inativarUsuario({ token: 'token-influ', subAlvo: 'sub-influ-3' }))
    ).toBe('ERR_AUTH_UNAUTHORIZED_ROLE');
  });
});

describe('UsuarioService.listarPendentes (SPEC-035 §13.4)', () => {
  test('Administrador ACTIVE lista só os Usuario em PENDING', () => {
    const { gas, servico, estado, usuarioRepository } = montar();
    administradorAtivo(estado, usuarioRepository, gas, 'sub-admin-1');
    estado.sessoes['token-admin'] = new gas.Sessao('sub-admin-1', new gas.TokenDeSessao('token-admin'), AGORA);
    usuarioRepository.salvar(gas.Usuario.novo('sub-pendente', 'nova@exemplo.com', 'INFLUENCIADORA', AGORA));

    const pendentes = servico.listarPendentes({ token: 'token-admin' });

    expect(pendentes).toHaveLength(1);
    expect(pendentes[0].subProvider).toBe('sub-pendente');
  });

  test('não-Administrador não pode listar (RBAC)', () => {
    const m = montar();
    influenciadoraAtiva(m.estado, m.usuarioRepository, m.parceiraACL, m.gas);
    m.estado.sessoes['token-influ'] = new m.gas.Sessao('maria-silva', new m.gas.TokenDeSessao('token-influ'), AGORA);

    expect(codigoDe(() => m.servico.listarPendentes({ token: 'token-influ' }))).toBe('ERR_AUTH_UNAUTHORIZED_ROLE');
  });
});

describe('UsuarioService.exigirPapel (SPEC-035 §11.2 guarda de segurança)', () => {
  test('devolve o Usuario quando ACTIVE e com o papel exigido', () => {
    const { gas, servico, estado, usuarioRepository } = montar();
    administradorAtivo(estado, usuarioRepository, gas, 'sub-admin-1');
    estado.sessoes['token-admin'] = new gas.Sessao('sub-admin-1', new gas.TokenDeSessao('token-admin'), AGORA);

    const usuario = servico.exigirPapel('token-admin', 'ADMINISTRADOR');

    expect(usuario.papel).toBe('ADMINISTRADOR');
  });

  test('papel divergente lança ERR_AUTH_UNAUTHORIZED_ROLE', () => {
    const { gas, servico, estado, usuarioRepository } = montar();
    administradorAtivo(estado, usuarioRepository, gas, 'sub-admin-1');
    estado.sessoes['token-admin'] = new gas.Sessao('sub-admin-1', new gas.TokenDeSessao('token-admin'), AGORA);

    expect(codigoDe(() => servico.exigirPapel('token-admin', 'INFLUENCIADORA'))).toBe('ERR_AUTH_UNAUTHORIZED_ROLE');
  });
});

describe('UsuarioService.iniciarLogin/entrarComCodigo (ADR-013)', () => {
  test('iniciarLogin registra state novo e devolve a URL de autorização com ele', () => {
    const { servico, statesRegistrados } = montar();

    const resultado = servico.iniciarLogin();

    expect(statesRegistrados.size).toBe(1);
    const state = Array.from(statesRegistrados)[0];
    expect(resultado.urlDeAutorizacao).toBe('https://auth.exemplo/?state=' + state);
  });

  test('state inválido lança ERR_AUTH_STATE_INVALIDO sem trocar o código', () => {
    const { servico, trocadorDeCodigoOAuth } = montar();

    expect(
      codigoDe(() => servico.entrarComCodigo({ code: 'code-admin-novo', state: 'forjado' }))
    ).toBe('ERR_AUTH_STATE_INVALIDO');
    expect(trocadorDeCodigoOAuth.trocas).toHaveLength(0);
  });

  test('state é de uso único: segunda chamada com o mesmo state falha', () => {
    const { gas, servico, estado, usuarioRepository, parceiraACL, statesRegistrados } = montar();
    influenciadoraAtiva(estado, usuarioRepository, parceiraACL, gas);
    servico.iniciarLogin();
    const state = Array.from(statesRegistrados)[0];

    const primeira = servico.entrarComCodigo({ code: 'code-influ-vinculada', state });
    expect(primeira.status).toBe('AUTENTICADO');
    expect(
      codigoDe(() => servico.entrarComCodigo({ code: 'code-influ-vinculada', state }))
    ).toBe('ERR_AUTH_STATE_INVALIDO');
  });

  test('state válido troca o código e autentica (AUTENTICADO, sem idToken anexado)', () => {
    const { gas, servico, estado, usuarioRepository, parceiraACL, statesRegistrados } = montar();
    influenciadoraAtiva(estado, usuarioRepository, parceiraACL, gas);
    servico.iniciarLogin();
    const state = Array.from(statesRegistrados)[0];

    const resultado = servico.entrarComCodigo({ code: 'code-influ-vinculada', state });

    expect(resultado.status).toBe('AUTENTICADO');
    expect(resultado.papel).toBe('INFLUENCIADORA');
    expect(resultado.sessao.parceiraId).toBe('maria-silva');
    expect(resultado.idToken).toBeUndefined();
  });

  test('anexa idToken quando o resultado é ONBOARDING_REQUERIDO', () => {
    const { servico, statesRegistrados } = montar();
    servico.iniciarLogin();
    const state = Array.from(statesRegistrados)[0];

    const resultado = servico.entrarComCodigo({ code: 'code-influ-sem-match', state });

    expect(resultado.status).toBe('ONBOARDING_REQUERIDO');
    expect(resultado.idToken).toBe('tok-influ-sem-match');
  });

  test('anexa idToken quando o resultado é CANDIDATA_VINCULACAO', () => {
    const { servico, estado, statesRegistrados } = montar();
    estado.parceiras['maria-silva'] = {
      parceiraId: 'maria-silva',
      email: 'maria@exemplo.com',
      subProvider: '',
    };
    servico.iniciarLogin();
    const state = Array.from(statesRegistrados)[0];

    const resultado = servico.entrarComCodigo({ code: 'code-influ-vinculada', state });

    expect(resultado.status).toBe('CANDIDATA_VINCULACAO');
    expect(resultado.parceiraId).toBe('maria-silva');
    expect(resultado.idToken).toBe('tok-influ-vinculada');
  });

  test('falha na troca do código propaga ERR_AUTH_INVALID_TOKEN (state já consumido)', () => {
    const { servico, statesRegistrados } = montar();
    servico.iniciarLogin();
    const state = Array.from(statesRegistrados)[0];

    expect(codigoDe(() => servico.entrarComCodigo({ code: 'code-desconhecido', state }))).toBe(
      'ERR_AUTH_INVALID_TOKEN'
    );
    expect(statesRegistrados.size).toBe(0);
  });
});
