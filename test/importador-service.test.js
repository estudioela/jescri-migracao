const { loadGas } = require('./helpers/gasHarness');

function carregar() {
  return loadGas([
    'src/modulos/Parceira.js',
  ]);
}

function fakeLegadoACL(registros) {
  return { listarRegistros: () => registros };
}

function fakeParceiraACL(chavesExistentes) {
  const importados = [];
  return {
    importados,
    listarChaves: () => chavesExistentes || [],
    importarLote(registros) {
      importados.push(...registros);
    },
    statusParaCanonico(cru) {
      const normalizado = String(cru == null ? '' : cru).trim().toLowerCase();
      if (normalizado === 'on') return 'Ativa';
      if (normalizado === 'off') return 'Inativa';
      throw new Error("STATUS desconhecido: '" + cru + "'.");
    },
  };
}

function fakePublicador() {
  const eventos = [];
  return { eventos, publicar: (e) => eventos.push(e) };
}

function montar({ legado, existentes } = {}) {
  const gas = carregar();
  const parceiraACL = fakeParceiraACL(existentes);
  const publicador = fakePublicador();
  const service = new gas.ImportadorService(fakeLegadoACL(legado || []), parceiraACL, publicador);
  return { gas, service, parceiraACL, publicador };
}

describe('ImportadorService — UC-003.01 (RN-02/RN-05, CB-01/02/03)', () => {
  test('registro válido (INFLU_KEY + demais campos, alguns vazios) é curado e importado', () => {
    const { service, parceiraACL, publicador } = montar({
      legado: [{ STATUS: 'ON', INFLU_KEY: 'Maria', CHAVE_PIX: 'pix@maria', VALOR_TOTAL: '' }],
    });

    const resultado = service.importarBase();

    expect(resultado).toEqual({ totalImportado: 1 });
    expect(parceiraACL.importados).toEqual([
      {
        parceiraId: 'Maria',
        estado: 'Ativa',
        camposFisicos: { STATUS: 'ON', INFLU_KEY: 'Maria', CHAVE_PIX: 'pix@maria', VALOR_TOTAL: '' },
      },
    ]);
    expect(publicador.eventos).toEqual([{ nome: 'BaseImportada', totalImportado: 1 }]);
  });

  test('CB-01: registro sem INFLU_KEY é descartado da curadoria, sem lançar', () => {
    const { service, parceiraACL } = montar({
      legado: [{ STATUS: 'ON', INFLU_KEY: '  ', CHAVE_PIX: 'x' }],
    });

    const resultado = service.importarBase();

    expect(resultado.totalImportado).toBe(0);
    expect(parceiraACL.importados).toHaveLength(0);
  });

  test('CB-03: grafias divergentes da mesma chave — só a primeira ocorrência é importada', () => {
    const { service, parceiraACL } = montar({
      legado: [
        { STATUS: 'ON', INFLU_KEY: 'Maria' },
        { STATUS: 'ON', INFLU_KEY: ' MARIA ' },
      ],
    });

    service.importarBase();

    expect(parceiraACL.importados).toHaveLength(1);
    expect(parceiraACL.importados[0].parceiraId).toBe('Maria');
  });

  test('CB-02/RNF-03: chave já existente na base nova nunca é reimportada (idempotência)', () => {
    const { service, parceiraACL } = montar({
      legado: [{ STATUS: 'ON', INFLU_KEY: 'Maria' }],
      existentes: ['Maria'],
    });

    const resultado = service.importarBase();

    expect(resultado.totalImportado).toBe(0);
    expect(parceiraACL.importados).toHaveLength(0);
  });

  test('STATUS ausente/desconhecido não descarta o registro — nasce Inativa (RN-05)', () => {
    const { service, parceiraACL } = montar({
      legado: [{ STATUS: 'DESCONHECIDO', INFLU_KEY: 'Ana' }],
    });

    service.importarBase();

    expect(parceiraACL.importados[0].estado).toBe('Inativa');
  });
});
