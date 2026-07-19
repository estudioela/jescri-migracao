const { loadGas } = require('./helpers/gasHarness');

const SEIS_HORAS_MS = 6 * 60 * 60 * 1000;
const QUINZE_MINUTOS_MS = 15 * 60 * 1000;

// Stub de SessaoACL em memória, indexada por token.
function stubSessaoACL() {
  const registros = {};
  return {
    _registros: registros,
    upsert(sessao) {
      registros[sessao.token] = sessao;
    },
    obterPorToken(token) {
      return registros[token] || null;
    },
    remover(token) {
      delete registros[token];
    },
  };
}

// Stub de BloqueioACL em memória, indexada por identificador.
function stubBloqueioACL() {
  const registros = {};
  return {
    _registros: registros,
    obter(identificador) {
      return registros[identificador] || null;
    },
    salvar(identificador, tentativas, inicio) {
      registros[identificador] = { tentativas, inicio };
    },
    remover(identificador) {
      delete registros[identificador];
    },
  };
}

describe('SessaoRepository — projeção explícita da Sessão (SPEC-025 §3.5)', () => {
  function carregar() {
    return loadGas([
      'src/domain/TokenDeSessao.js',
      'src/domain/Sessao.js',
      'src/repository/SessaoRepository.js',
    ]);
  }

  test('salvar projeta token/parceiraId/expiraEm para a ACL (RN-03: 6h)', () => {
    const gas = carregar();
    const acl = stubSessaoACL();
    const repositorio = new gas.SessaoRepository(acl);
    const agora = new Date('2026-07-16T10:00:00.000Z');
    const sessao = new gas.Sessao('Maria', new gas.TokenDeSessao('tok-1'), agora);

    const devolvida = repositorio.salvar(sessao);

    expect(devolvida).toBe(sessao);
    const registro = acl._registros['tok-1'];
    expect(registro.parceiraId).toBe('Maria');
    expect(registro.expiraEm.getTime()).toBe(agora.getTime() + SEIS_HORAS_MS);
  });

  test('obterPorToken reconstitui a Sessao com a validade persistida (sem recomputar)', () => {
    const gas = carregar();
    const acl = stubSessaoACL();
    const expiraEm = new Date('2026-07-16T16:00:00.000Z');
    acl.upsert({ token: 'tok-1', parceiraId: 'Maria', expiraEm });
    const repositorio = new gas.SessaoRepository(acl);

    const sessao = repositorio.obterPorToken('tok-1');

    expect(sessao.parceiraId).toBe('Maria');
    expect(sessao.token.valor).toBe('tok-1');
    // Validade vinda da persistência, não do relógio (comparação por getTime:
    // instanceof Date não atravessa o realm do vm).
    expect(sessao.expiraEm.getTime()).toBe(expiraEm.getTime());
    expect(sessao.expiradaEm(new Date('2026-07-16T16:00:00.001Z'))).toBe(true);
  });

  test('obterPorToken devolve null quando a ACL não tem o token', () => {
    const gas = carregar();
    const repositorio = new gas.SessaoRepository(stubSessaoACL());

    expect(repositorio.obterPorToken('tok-fantasma')).toBeNull();
  });

  test('remover delega o token à ACL (logout/expiração)', () => {
    const gas = carregar();
    const acl = stubSessaoACL();
    acl.upsert({ token: 'tok-1', parceiraId: 'Maria', expiraEm: new Date() });
    const repositorio = new gas.SessaoRepository(acl);

    repositorio.remover('tok-1');

    expect(acl.obterPorToken('tok-1')).toBeNull();
  });
});

describe('BloqueioRepository — estado de tentativas e janela (SPEC-025 RN-02)', () => {
  function carregar() {
    return loadGas([
      'src/modulos/Arquivamento.js',
    ]);
  }

  test('contarFalhas devolve 0 sem registro e o total persistido quando há', () => {
    const gas = carregar();
    const acl = stubBloqueioACL();
    const repositorio = new gas.BloqueioRepository(acl);

    expect(repositorio.contarFalhas('cupom-x')).toBe(0);

    acl.salvar('cupom-x', 3, null);
    expect(repositorio.contarFalhas('cupom-x')).toBe(3);
  });

  test('salvarFalhas persiste o total sem janela (inicio null)', () => {
    const gas = carregar();
    const acl = stubBloqueioACL();
    const repositorio = new gas.BloqueioRepository(acl);

    repositorio.salvarFalhas('cupom-x', 2);

    expect(acl._registros['cupom-x']).toEqual({ tentativas: 2, inicio: null });
  });

  test('obterJanela devolve null sem registro ou sem início de bloqueio', () => {
    const gas = carregar();
    const acl = stubBloqueioACL();
    const repositorio = new gas.BloqueioRepository(acl);

    expect(repositorio.obterJanela('cupom-x')).toBeNull();

    acl.salvar('cupom-x', 3, null);
    expect(repositorio.obterJanela('cupom-x')).toBeNull();
  });

  test('obterJanela reconstitui JanelaDeBloqueio de 15min a partir do início (RN-02)', () => {
    const gas = carregar();
    const acl = stubBloqueioACL();
    const inicio = new Date('2026-07-16T12:00:00.000Z');
    acl.salvar('cupom-x', 5, inicio);
    const repositorio = new gas.BloqueioRepository(acl);

    const janela = repositorio.obterJanela('cupom-x');

    expect(janela.inicio.getTime()).toBe(inicio.getTime());
    expect(janela.fim.getTime()).toBe(inicio.getTime() + QUINZE_MINUTOS_MS);
    expect(janela.ativaEm(new Date(inicio.getTime() + QUINZE_MINUTOS_MS - 1))).toBe(true);
    expect(janela.ativaEm(new Date(inicio.getTime() + QUINZE_MINUTOS_MS))).toBe(false);
  });

  test('bloquear persiste falhas + início da janela (CB-01)', () => {
    const gas = carregar();
    const acl = stubBloqueioACL();
    const repositorio = new gas.BloqueioRepository(acl);
    const inicio = new Date('2026-07-16T12:00:00.000Z');
    const janela = new gas.JanelaDeBloqueio(inicio);

    repositorio.bloquear('cupom-x', janela, 5);

    const registro = acl._registros['cupom-x'];
    expect(registro.tentativas).toBe(5);
    expect(registro.inicio.getTime()).toBe(inicio.getTime());
  });

  test('limpar zera o estado do identificador (janela vencida ou autenticação ok, §9)', () => {
    const gas = carregar();
    const acl = stubBloqueioACL();
    acl.salvar('cupom-x', 5, new Date());
    const repositorio = new gas.BloqueioRepository(acl);

    repositorio.limpar('cupom-x');

    expect(acl.obter('cupom-x')).toBeNull();
  });
});
