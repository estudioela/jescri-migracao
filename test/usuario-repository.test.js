const { loadGas } = require('./helpers/gasHarness');

const ARQUIVOS = [, 'src/modulos/Usuario.js'];

function fakeAba(cabecalho) {
  let rows = [cabecalho.slice()];
  return {
    get _rows() {
      return rows;
    },
    getDataRange: () => ({ getValues: () => rows.map((r) => r.slice()) }),
    clearContents() {
      rows = [];
    },
    getRange(linha) {
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

const CABECALHO = ['SUB_PROVIDER', 'EMAIL_PERFIL', 'PAPEL_ATOR', 'ESTADO_CONTA', 'DATA_CRIACAO', 'ULTIMO_ACESSO'];

function montar() {
  const gas = loadGas(ARQUIVOS);
  const acl = new gas.UsuarioACL(fakeAba(CABECALHO));
  const repo = new gas.UsuarioRepository(acl);
  return { gas, repo };
}

const AGORA = new Date('2026-07-17T10:00:00.000Z');

describe('UsuarioRepository (SPEC-035 §9.1.4)', () => {
  test('salvar()/buscarPorSub() fazem round-trip como entidade Usuario reidratada', () => {
    const { gas, repo } = montar();
    const usuario = gas.Usuario.novo('sub-1', 'a@b.com', 'ADMINISTRADOR', AGORA);

    repo.salvar(usuario);
    const carregado = repo.buscarPorSub('sub-1');

    expect(carregado).toBeInstanceOf(gas.Usuario);
    expect(carregado.subProvider).toBe('sub-1');
    expect(carregado.papel).toBe('ADMINISTRADOR');
    expect(carregado.estado).toBe('PENDING');
    expect(carregado.dataCriacao).toEqual(AGORA);
  });

  test('buscarPorSub inexistente devolve null', () => {
    const { repo } = montar();

    expect(repo.buscarPorSub('nao-existe')).toBeNull();
  });

  test('salvar() persiste transições de estado (aprovar) via upsert', () => {
    const { gas, repo } = montar();
    const usuario = gas.Usuario.novo('sub-1', 'a@b.com', 'INFLUENCIADORA', AGORA);
    repo.salvar(usuario);

    usuario.aprovar();
    repo.salvar(usuario);

    expect(repo.buscarPorSub('sub-1').estado).toBe('ACTIVE');
  });

  test('listarPendentes() devolve só os Usuario em PENDING, como entidades', () => {
    const { gas, repo } = montar();
    repo.salvar(gas.Usuario.novo('sub-1', 'a@b.com', 'ADMINISTRADOR', AGORA));
    repo.salvar(gas.Usuario.novo('sub-2', 'c@d.com', 'INFLUENCIADORA', AGORA).aprovar());
    repo.salvar(gas.Usuario.novo('sub-3', 'e@f.com', 'INFLUENCIADORA', AGORA));

    const pendentes = repo.listarPendentes();

    expect(pendentes).toHaveLength(2);
    expect(pendentes.every((u) => u instanceof gas.Usuario && u.estado === 'PENDING')).toBe(true);
    expect(pendentes.map((u) => u.subProvider).sort()).toEqual(['sub-1', 'sub-3']);
  });
});
