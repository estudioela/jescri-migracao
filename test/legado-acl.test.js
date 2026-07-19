const { loadGas } = require('./helpers/gasHarness');

const CABECALHO = ['STATUS', 'INFLU_KEY', 'CHAVE_PIX', 'VALOR_TOTAL'];

function fakeAbaSomenteLeitura(rows) {
  return {
    getDataRange: () => ({ getValues: () => rows.map((r) => r.slice()) }),
  };
}

function carregar(sheet) {
  const gas = loadGas(['src/modulos/Parceira.js']);
  return { gas, acl: new gas.LegadoACL(sheet) };
}

describe('LegadoACL — leitura somente (SPEC-003 RN-01/INV-01)', () => {
  test('listarRegistros devolve um objeto cru por linha, por nome de coluna', () => {
    const aba = fakeAbaSomenteLeitura([
      CABECALHO,
      ['ON', 'Maria', 'pix@maria', 3500],
      ['OFF', 'Ana', '', ''],
    ]);
    const { acl } = carregar(aba);

    const registros = acl.listarRegistros();

    expect(registros).toEqual([
      { STATUS: 'ON', INFLU_KEY: 'Maria', CHAVE_PIX: 'pix@maria', VALOR_TOTAL: 3500 },
      { STATUS: 'OFF', INFLU_KEY: 'Ana', CHAVE_PIX: '', VALOR_TOTAL: '' },
    ]);
  });

  test('linha totalmente vazia é ignorada', () => {
    const aba = fakeAbaSomenteLeitura([CABECALHO, ['', '', '', ''], ['ON', 'Maria', '', '']]);
    const { acl } = carregar(aba);

    expect(acl.listarRegistros()).toHaveLength(1);
  });

  test('nenhum método de escrita existe (RN-01/INV-01, estruturalmente somente leitura)', () => {
    const { acl } = carregar(fakeAbaSomenteLeitura([CABECALHO]));

    expect(acl.salvar).toBeUndefined();
    expect(acl.inserir).toBeUndefined();
    expect(acl.reescrever).toBeUndefined();
  });
});
