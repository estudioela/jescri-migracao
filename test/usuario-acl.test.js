const { loadGas } = require('./helpers/gasHarness');

// Fakes das abas físicas — mesmo padrão de test/acesso-acl.test.js
// (leitura completa + reescrita num único setValues) para SIS_IDENTIDADES,
// e padrão appendRow (test/parceira-acl.test.js) para BASE_ADMINISTRADORES.
function fakeAbaGravavel(cabecalho) {
  let rows = [cabecalho.slice()];
  return {
    get _rows() {
      return rows;
    },
    getDataRange: () => ({ getValues: () => rows.map((r) => r.slice()) }),
    clearContents() {
      rows = [];
    },
    getRange(linha, _coluna, numLinhas, numColunas) {
      return {
        setValues(valores) {
          if (valores.length !== numLinhas || valores[0].length !== numColunas) {
            throw new Error('fake: range incompatível.');
          }
          valores.forEach((v, i) => {
            rows[linha - 1 + i] = v.slice();
          });
        },
      };
    },
  };
}

function fakeAbaComAppend(cabecalho) {
  const rows = [cabecalho.slice()];
  return {
    get _rows() {
      return rows;
    },
    getDataRange: () => ({ getValues: () => rows.map((r) => r.slice()) }),
    appendRow: (arr) => rows.push(arr.slice()),
  };
}

describe('UsuarioACL — aba SIS_IDENTIDADES (SPEC-035 §10.2.1)', () => {
  const CABECALHO = [
    'SUB_PROVIDER',
    'EMAIL_PERFIL',
    'PAPEL_ATOR',
    'ESTADO_CONTA',
    'DATA_CRIACAO',
    'ULTIMO_ACESSO',
  ];

  function carregar(aba) {
    const gas = loadGas(['src/modulos/Usuario.js']);
    return { gas, acl: new gas.UsuarioACL(aba) };
  }

  test('upsert insere novo Usuario e buscarPorSub devolve a linha', () => {
    const aba = fakeAbaGravavel(CABECALHO);
    const { acl } = carregar(aba);
    const criado = new Date('2026-07-17T10:00:00.000Z');

    acl.upsert({
      subProvider: 'sub-1',
      email: 'a@b.com',
      papel: 'ADMINISTRADOR',
      estado: 'PENDING',
      dataCriacao: criado,
      ultimoAcesso: null,
    });

    const registro = acl.buscarPorSub('sub-1');
    expect(registro).toEqual({
      subProvider: 'sub-1',
      email: 'a@b.com',
      papel: 'ADMINISTRADOR',
      estado: 'PENDING',
      dataCriacao: criado,
      ultimoAcesso: null,
    });
  });

  test('buscarPorSub inexistente devolve null', () => {
    const { acl } = carregar(fakeAbaGravavel(CABECALHO));

    expect(acl.buscarPorSub('nao-existe')).toBeNull();
  });

  test('upsert substitui a linha do mesmo SUB_PROVIDER (mudança de estado)', () => {
    const aba = fakeAbaGravavel(CABECALHO);
    const { acl } = carregar(aba);
    const criado = new Date('2026-07-17T10:00:00.000Z');
    const acesso = new Date('2026-07-17T11:00:00.000Z');

    acl.upsert({
      subProvider: 'sub-1',
      email: 'a@b.com',
      papel: 'ADMINISTRADOR',
      estado: 'PENDING',
      dataCriacao: criado,
      ultimoAcesso: null,
    });
    acl.upsert({
      subProvider: 'sub-1',
      email: 'a@b.com',
      papel: 'ADMINISTRADOR',
      estado: 'ACTIVE',
      dataCriacao: criado,
      ultimoAcesso: acesso,
    });

    expect(aba._rows).toHaveLength(2); // cabeçalho + 1 linha (upsert, não append)
    expect(acl.buscarPorSub('sub-1').estado).toBe('ACTIVE');
    expect(acl.buscarPorSub('sub-1').ultimoAcesso).toEqual(acesso);
  });

  test('listarPorEstado filtra pelo ESTADO_CONTA (painel de moderação §13.4)', () => {
    const aba = fakeAbaGravavel(CABECALHO);
    const { acl } = carregar(aba);
    const criado = new Date('2026-07-17T10:00:00.000Z');
    acl.upsert({ subProvider: 'sub-1', email: 'a@b.com', papel: 'ADMINISTRADOR', estado: 'PENDING', dataCriacao: criado, ultimoAcesso: null });
    acl.upsert({ subProvider: 'sub-2', email: 'c@d.com', papel: 'INFLUENCIADORA', estado: 'ACTIVE', dataCriacao: criado, ultimoAcesso: null });
    acl.upsert({ subProvider: 'sub-3', email: 'e@f.com', papel: 'INFLUENCIADORA', estado: 'PENDING', dataCriacao: criado, ultimoAcesso: null });

    const pendentes = acl.listarPorEstado('PENDING');

    expect(pendentes.map((r) => r.subProvider).sort()).toEqual(['sub-1', 'sub-3']);
  });

  test('coluna física ausente falha barulhento (Contrato §7)', () => {
    const aba = fakeAbaGravavel(['SUB_PROVIDER']);
    aba._rows.push(['sub-1']);
    const { acl } = carregar(aba);

    expect(() => acl.buscarPorSub('sub-1')).toThrow(/SIS_IDENTIDADES/);
  });
});

describe('AdministradorACL — aba BASE_ADMINISTRADORES (SPEC-035 §10.2.2)', () => {
  const CABECALHO = ['SUB_PROVIDER', 'NOME_COMPLETO', 'AREA_RESPONSABILIDADE'];

  function carregar(aba) {
    const gas = loadGas(['src/acl/AdministradorACL.js']);
    return { gas, acl: new gas.AdministradorACL(aba) };
  }

  test('inserir grava a linha de especialização do Administrador', () => {
    const aba = fakeAbaComAppend(CABECALHO);
    const { acl } = carregar(aba);

    acl.inserir({ subProvider: 'sub-1', nomeCompleto: 'Ana Souza', areaResponsabilidade: 'Financeiro' });

    expect(aba._rows[1]).toEqual(['sub-1', 'Ana Souza', 'Financeiro']);
  });

  test('buscarPorSub devolve os dados complementares ou null', () => {
    const aba = fakeAbaComAppend(CABECALHO);
    const { acl } = carregar(aba);
    acl.inserir({ subProvider: 'sub-1', nomeCompleto: 'Ana Souza', areaResponsabilidade: 'Financeiro' });

    expect(acl.buscarPorSub('sub-1')).toEqual({
      subProvider: 'sub-1',
      nomeCompleto: 'Ana Souza',
      areaResponsabilidade: 'Financeiro',
    });
    expect(acl.buscarPorSub('sub-inexistente')).toBeNull();
  });
});
